
import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./config/db.js";
import router from "./routes/routers.js";
import cors from "cors";
import cookieParser from "cookie-parser"; 
import { v2 as cloudinary } from "cloudinary";
import analyticsRoutes from "./routes/analytics.js";
import fileRoutes from "./routes/files.js";
import shareRoutes from "./routes/shares.js";
import { startExpirationJob } from "./jobs/expirationJob.js";
import { startUploadSessionCleanupJob } from "./jobs/uploadSessionCleanup.js";
import { connectRedis } from "./config/redis.js";
import { ensureUploadTempRoot } from "./utils/chunkStorage.js";

const app = express();


app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://file-sharing-system-lake.vercel.app"
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
startUploadSessionCleanupJob();
ensureUploadTempRoot().catch(console.error);

app.use(express.json());
app.use(cookieParser()); 

// Routes
app.use("/api/analytics", analyticsRoutes);
app.use("/api/track", analyticsRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/shares", shareRoutes);
app.use("/", router);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

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
    error: "This endpoint is deprecated. Use /api/files/upload/init for resumable chunked uploads.",
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port http://localhost:${PORT}`),
);