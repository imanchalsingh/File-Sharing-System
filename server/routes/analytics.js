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
  visitorId: String,
});

const Analytics = mongoose.model("Analytics", analyticsSchema);

// --- Track file action ---
router.post("/track/:action", async (req, res) => {
  try {
    const { action } = req.params;
    const { fileId, fileName, fileUrl, source = "direct_copy", userId, deviceInfo = {} } = req.body;
    const visitorId =
  userId || `${req.ip}-${req.headers["user-agent"]}`;

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
       visitorId,
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
    const uniqueViews = await Analytics.distinct("visitorId", {
  action: "view",
  timestamp: { $gte: startDate },
});

const uniqueDownloads = await Analytics.distinct("visitorId", {
  action: "download",
  timestamp: { $gte: startDate },
});

const viewCount = await Analytics.countDocuments({
  action: "view",
  timestamp: { $gte: startDate },
});

const downloadCount = await Analytics.countDocuments({
  action: "download",
  timestamp: { $gte: startDate },
});

const conversionRate =
  viewCount > 0
    ? ((downloadCount / viewCount) * 100).toFixed(2)
    : 0;

    const uniqueFiles = await Analytics.distinct("fileId", { timestamp: { $gte: startDate } });

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
       res.json({
  totalShares,
  uniqueFiles: uniqueFiles.length,

  uniqueViews: uniqueViews.length,
  uniqueDownloads: uniqueDownloads.length,
  conversionRate,

  sharesByDay,
  topFiles,
  shareSources,
  hourlyActivity,
  period,
});

    // res.json({ totalShares, uniqueFiles: uniqueFiles.length, sharesByDay, topFiles, shareSources, hourlyActivity, period });
  } catch (error) {
    console.error("Error getting stats:", error);
    res.status(500).json({ error: "Failed to get analytics" });
  }
});

// --- File Type Analytics ---
router.get("/file-types", async (req, res) => {
  try {
    const { period = "week" } = req.query;
    const startDate = getStartDate(period);

    const data = await Analytics.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
        },
      },
      {
        $addFields: {
          fileType: {
            $toLower: {
              $arrayElemAt: [{ $split: ["$fileName", "."] }, -1],
            },
          },
        },
      },
      {
        $group: {
          _id: "$fileType",
          count: { $sum: 1 },
          shares: {
            $sum: {
              $cond: [{ $eq: ["$action", "copy_link"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          type: "$_id",
          count: 1,
          shares: 1,
          _id: 0,
        },
      },
      {
        $sort: { shares: -1 },
      },
    ]);

    res.json({
      period,
      fileTypeDistribution: data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch file type analytics" });
  }
});

// trending files
router.get("/trending-files", async (req, res) => {
  try {
    const { period = "week" } = req.query;
    const startDate = getStartDate(period);

    const trending = await Analytics.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
        },
      },

      // weight each action
      {
        $addFields: {
          weight: {
            $switch: {
              branches: [
                { case: { $eq: ["$action", "view"] }, then: 1 },
                { case: { $eq: ["$action", "download"] }, then: 2 },
                { case: { $eq: ["$action", "copy_link"] }, then: 3 },
              ],
              default: 0,
            },
          },
        },
      },

      // group by file
      {
        $group: {
          _id: "$fileId",
          fileName: { $first: "$fileName" },
          totalScore: { $sum: "$weight" },
          views: {
            $sum: {
              $cond: [{ $eq: ["$action", "view"] }, 1, 0],
            },
          },
          downloads: {
            $sum: {
              $cond: [{ $eq: ["$action", "download"] }, 1, 0],
            },
          },
          shares: {
            $sum: {
              $cond: [{ $eq: ["$action", "copy_link"] }, 1, 0],
            },
          },
          lastActivity: { $max: "$timestamp" },
        },
      },

      // sort by score
      { $sort: { totalScore: -1 } },

      // top 10
      { $limit: 10 },
    ]);

    res.json({
      period,
      trendingFiles: trending,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch trending files" });
  }
});


router.get("/file/:fileId/unique-metrics", async (req, res) => {
  try {
    const { fileId } = req.params;
    const { period = "week" } = req.query;

    const startDate = getStartDate(period);

    // TOTAL COUNTS
    const totalViews = await Analytics.countDocuments({
      fileId,
      action: "view",
      timestamp: { $gte: startDate },
    });

    const totalDownloads = await Analytics.countDocuments({
      fileId,
      action: "download",
      timestamp: { $gte: startDate },
    });

    // UNIQUE VIEWS
    const uniqueViews = await Analytics.distinct("visitorId", {
      fileId,
      action: "view",
      timestamp: { $gte: startDate },
    });

    // UNIQUE DOWNLOADS
    const uniqueDownloads = await Analytics.distinct("visitorId", {
      fileId,
      action: "download",
      timestamp: { $gte: startDate },
    });

    // CONVERSION RATE (based on unique users)
    const conversionRate =
      uniqueViews.length > 0
        ? ((uniqueDownloads.length / uniqueViews.length) * 100).toFixed(2)
        : 0;

    res.json({
      fileId,
      period,

      totalViews,
      totalDownloads,

      uniqueViews: uniqueViews.length,
      uniqueDownloads: uniqueDownloads.length,

      conversionRate: `${conversionRate}%`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch unique metrics" });
  }
});
//share conversion per file

router.get("/file/:fileId/conversion/share-download", async (req, res) => {
  try {
    const { fileId } = req.params;
    const { period = "week" } = req.query;

    const startDate = getStartDate(period);

    const shareUsers = await Analytics.distinct("visitorId", {
      fileId,
      action: "copy_link",
      timestamp: { $gte: startDate },
    });

    const downloadUsers = await Analytics.distinct("visitorId", {
      fileId,
      action: "download",
      timestamp: { $gte: startDate },
    });

    const convertedUsers = shareUsers.filter((u) =>
      downloadUsers.includes(u)
    );

    const conversionRate =
      shareUsers.length > 0
        ? ((convertedUsers.length / shareUsers.length) * 100).toFixed(2)
        : 0;

    res.json({
      fileId,
      totalSharers: shareUsers.length,
      totalDownloaders: downloadUsers.length,
      convertedUsers: convertedUsers.length,
      conversionRate: `${conversionRate}%`,
    });
  } catch (err) {
    res.status(500).json({ error: "Conversion API failed" });
  }
});



// prevents fake analysis inflation
router.post("/track-safe/:action", async (req, res) => {
  try {
    const { action } = req.params;
    const { fileId, fileName, fileUrl, userId } = req.body;

    const visitorId =
      userId || `${req.ip}-${req.headers["user-agent"]}`;

    // CHECK LAST ACTION TIME
    const lastAction = await Analytics.findOne({
      fileId,
      action,
      visitorId,
    }).sort({ timestamp: -1 });

    if (lastAction) {
      const diff =
        new Date() - new Date(lastAction.timestamp);

      // 10 sec cooldown
      if (diff < 10000) {
        return res.json({
          skipped: true,
          message: "Duplicate action ignored (cooldown active)",
        });
      }
    }

    const newEntry = new Analytics({
      fileId,
      fileName,
      fileUrl,
      action,
      visitorId,
      userId,
      timestamp: new Date(),
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    await newEntry.save();

    res.json({ success: true, message: "Tracked safely" });
  } catch (err) {
    res.status(500).json({ error: "Safe tracking failed" });
  }
});

//engagement score(tells how popular the file is)
router.get("/file/:fileId/engagement-score", async (req, res) => {
  try {
    const { fileId } = req.params;
    const { period = "week" } = req.query;

    const startDate = getStartDate(period);

    const views = await Analytics.countDocuments({
      fileId,
      action: "view",
      timestamp: { $gte: startDate },
    });

    const downloads = await Analytics.countDocuments({
      fileId,
      action: "download",
      timestamp: { $gte: startDate },
    });

    const shares = await Analytics.countDocuments({
      fileId,
      action: "copy_link",
      timestamp: { $gte: startDate },
    });

    // weighted scoring system
    const score =
      views * 1 +
      downloads * 3 +
      shares * 2;

    res.json({
      fileId,
      views,
      downloads,
      shares,
      engagementScore: score,
    });
  } catch (err) {
    res.status(500).json({ error: "Score calculation failed" });
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

//     res.json({
//   totalShares,
//   uniqueFiles: uniqueFiles.length,

//   uniqueViews: uniqueViews.length,
//   uniqueDownloads: uniqueDownloads.length,
//   conversionRate,

//   sharesByDay,
//   topFiles,
//   shareSources,
//   hourlyActivity,
//   period,
// });

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
