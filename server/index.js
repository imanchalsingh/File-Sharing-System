import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
dotenv.config();
import validateEnv from "./config/validateEnv.js";
validateEnv();
import connectDB from "./config/db.js";
import router from "./routes/routers.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";
import analyticsRoutes from "./routes/analytics.js";
import fileRoutes from "./routes/files.js";
import shareRoutes from "./routes/shares.js";
import { startExpirationJob } from "./jobs/expirationJob.js";
import { startScanWorker } from "./jobs/scanWorker.js";
import { startIndexWorker } from "./jobs/indexWorker.js";
import { startWebhookWorker } from "./jobs/webhookWorker.js";
import webhookRoutes from "./routes/webhooks.js";
import { startUploadSessionCleanupJob } from "./jobs/uploadSessionCleanup.js";
import { initQuotaResetJob } from "./jobs/quotaResetJob.js";
import { connectRedis } from "./config/redis.js";
import { ensureUploadTempRoot } from "./utils/chunkStorage.js";
import {
  globalErrorHandler,
  notFoundHandler,
} from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://file-sharing-system-lake.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

// Connect to database
connectDB();
// Connect to Redis
connectRedis();
// Start background jobs
startExpirationJob();
startScanWorker();
startIndexWorker();
startWebhookWorker();
startUploadSessionCleanupJob();
initQuotaResetJob();
ensureUploadTempRoot().catch(console.error);

app.use(express.json());
app.use(cookieParser());

// Apply General API Rate Limiter to all /api routes
app.use("/api", apiLimiter);

// Routes
app.use("/api/analytics", analyticsRoutes);
app.use("/api/track", analyticsRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/shares", shareRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/", router);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Legacy upload endpoint — use authenticated chunked upload at /api/files/upload/*
app.post("/upload", (_req, res) => {
  res.status(410).json({
    error:
      "This endpoint is deprecated. Use /api/files/upload/init for resumable chunked uploads.",
  });
});

// 404 handler — must be after all routes
app.use(notFoundHandler);

// Global error handling middleware — must be last in the stack
app.use(globalErrorHandler);

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://file-sharing-system-lake.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

// Attach io to app so it can be used in controllers
app.set("io", io);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join_room", (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined room: user_${userId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () =>
  console.log(`Server running on port http://localhost:${PORT}`),
);
