// server/routes/analytics.js

import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// Analytics Schema
const analyticsSchema = new mongoose.Schema({
  fileId: String,
  fileName: String,
  fileUrl: String,
  action: String, // 'copy_link', 'download', 'view'
  source: String, // 'direct_copy', 'email', 'whatsapp', etc.
  userAgent: String,
  timestamp: Date,
  userId: String,
  deviceInfo: Object,
  ipAddress: String,
});

const Analytics = mongoose.model("Analytics", analyticsSchema);

// --- Track file action ---
router.post("/track/:action", async (req, res) => {
  try {
    const { action } = req.params;
    const { fileId, fileName, fileUrl, source = "direct_copy", userId, deviceInfo = {} } = req.body;

    const analytics = new Analytics({
      fileId,
      fileName,
      fileUrl,
      action,
      source,
      userAgent: req.headers["user-agent"],
      timestamp: new Date(),
      userId: userId || req.user?.id,
      deviceInfo,
      ipAddress: req.ip,
    });

    await analytics.save();
    res.json({ success: true, message: "Action tracked" });
  } catch (error) {
    console.error("Tracking error:", error);
    res.status(500).json({ error: "Failed to track action" });
  }
});

// --- Get analytics stats ---
router.get("/stats", async (req, res) => {
  try {
    const { period = "week", userId } = req.query;
    const startDate = getStartDate(period);

    const totalShares = await Analytics.countDocuments({ action: "copy_link", timestamp: { $gte: startDate } });
    const uniqueFiles = await Analytics.distinct("fileId", { action: "copy_link", timestamp: { $gte: startDate } });

    const sharesByDay = await Analytics.aggregate([
      { $match: { action: "copy_link", timestamp: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }, shares: { $sum: 1 }, uniqueUsers: { $addToSet: "$userId" } } },
      { $project: { date: "$_id", shares: 1, uniqueUsers: { $size: "$uniqueUsers" } } },
      { $sort: { date: 1 } },
    ]);

    const topFiles = await Analytics.aggregate([
      { $match: { action: "copy_link", timestamp: { $gte: startDate } } },
      { $group: { _id: "$fileId", fileName: { $first: "$fileName" }, shares: { $sum: 1 }, lastShared: { $max: "$timestamp" } } },
      { $sort: { shares: -1 } },
      { $limit: 10 },
    ]);

    const shareSources = await Analytics.aggregate([
      { $match: { action: "copy_link", timestamp: { $gte: startDate } } },
      { $group: { _id: "$source", count: { $sum: 1 } } },
    ]);

    const hourlyActivity = await Analytics.aggregate([
      { $match: { action: "copy_link", timestamp: { $gte: startDate } } },
      { $group: { _id: { $hour: "$timestamp" }, shares: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({ totalShares, uniqueFiles: uniqueFiles.length, sharesByDay, topFiles, shareSources, hourlyActivity, period });
  } catch (error) {
    console.error("Error getting stats:", error);
    res.status(500).json({ error: "Failed to get analytics" });
  }
});

// --- Get file-specific analytics ---
router.get("/file/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    const { period = "week" } = req.query;

    const fileStats = await Analytics.aggregate([
      { $match: { fileId, timestamp: { $gte: getStartDate(period) } } },
      { $group: { _id: "$action", count: { $sum: 1 }, timeline: { $push: { timestamp: "$timestamp", source: "$source" } } } },
    ]);

    const dailyShares = await Analytics.aggregate([
      { $match: { fileId, action: "copy_link", timestamp: { $gte: getStartDate(period) } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }, shares: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      fileId,
      stats: fileStats,
      dailyShares,
      totalShares: fileStats.find((s) => s._id === "copy_link")?.count || 0,
      totalDownloads: fileStats.find((s) => s._id === "download")?.count || 0,
      totalViews: fileStats.find((s) => s._id === "view")?.count || 0,
    });
  } catch (error) {
    console.error("Error getting file stats:", error);
    res.status(500).json({ error: "Failed to get file analytics" });
  }
});

function getStartDate(period) {
  const now = new Date();
  switch (period) {
    case "day": return new Date(now.setDate(now.getDate() - 1));
    case "week": return new Date(now.setDate(now.getDate() - 7));
    case "month": return new Date(now.setMonth(now.getMonth() - 1));
    case "year": return new Date(now.setFullYear(now.getFullYear() - 1));
    default: return new Date(now.setDate(now.getDate() - 7));
  }
}

// ✅ ESM export
export default router;
