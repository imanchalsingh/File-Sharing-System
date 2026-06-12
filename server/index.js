
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./config/db.js";
import router from "./routes/routers.js";
import cors from "cors";
import cookieParser from "cookie-parser"; 
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import analyticsRoutes from "./routes/analytics.js";
import fileRoutes from "./routes/files.js";
import shareRoutes from "./routes/shares.js";
import { startExpirationJob } from "./jobs/expirationJob.js";
import { initQuotaResetJob } from "./jobs/quotaResetJob.js";
import {connectRedis} from "./config/redis.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

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
initQuotaResetJob();

app.use(express.json());
app.use(cookieParser()); 

// Apply General API Rate Limiter to all /api routes
app.use("/api", apiLimiter);

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

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// File Upload API using Cloudinary
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const streamUpload = (reqFile) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "myfiles" },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          },
        );
        streamifier.createReadStream(reqFile.buffer).pipe(stream);
      });
    };

    const result = await streamUpload(req.file);
    res.json({ url: result.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://file-sharing-system-lake.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }
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