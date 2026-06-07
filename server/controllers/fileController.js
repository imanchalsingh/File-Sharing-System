import File from "../models/File.js";

// ✅ Get user's all files
export const getUserFiles = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const files = await File.find({ userId })
      .sort({ createdAt: -1 })
      .select("-__v");
    
    res.json({
      success: true,
      files,
      count: files.length,
    });
  } catch (error) {
    console.error("Get user files error:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
};

// ✅ Get single file by ID
export const getFileById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const file = await File.findOne({ _id: id, userId });
    
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }
    
    res.json({ success: true, file });
  } catch (error) {
    console.error("Get file error:", error);
    res.status(500).json({ error: "Failed to fetch file" });
  }
};

// ✅ Save file info after upload
export const saveFileInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fileName, fileUrl, fileType, fileSize, fileSizeBytes, checksum } = req.body;
    
    if (!fileName || !fileUrl) {
      return res.status(400).json({ error: "File name and URL are required" });
    }
    
    const newFile = new File({
      fileName,
      fileUrl,
      fileType: fileType || "application",
      fileSize: fileSize || "0 KB",
      fileSizeBytes: fileSizeBytes || 0,
      checksum: checksum || null,
      userId,
      shareCount: 0,
      downloadCount: 0,
      viewCount: 0,
      shareHistory: [],
      downloadHistory: [],
      viewHistory: [],
    });
    
    await newFile.save();
    
    res.status(201).json({
      success: true,
      message: "File info saved successfully",
      file: newFile,
    });
  } catch (error) {
    console.error("Save file info error:", error);
    res.status(500).json({ error: "Failed to save file info" });
  }
};

// ✅ Update file share count
export const updateShareCount = async (req, res) => {
  try {
    const { id } = req.params;
    const { source = "direct_copy" } = req.body;
    
    const file = await File.findById(id);
    
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }
    
    file.shareCount += 1;
    file.shareHistory.push({
      timestamp: new Date(),
      source,
    });
    file.lastAccessed = new Date();
    
    await file.save();
    
    res.json({
      success: true,
      message: "Share count updated",
      shareCount: file.shareCount,
    });
  } catch (error) {
    console.error("Update share count error:", error);
    res.status(500).json({ error: "Failed to update share count" });
  }
};

// ✅ Update file download count
export const updateDownloadCount = async (req, res) => {
  try {
    const { id } = req.params;
    
    const file = await File.findById(id);
    
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }
    
    file.downloadCount += 1;
    file.downloadHistory.push({
      timestamp: new Date(),
    });
    file.lastAccessed = new Date();
    
    await file.save();
    
    res.json({
      success: true,
      message: "Download count updated",
      downloadCount: file.downloadCount,
    });
  } catch (error) {
    console.error("Update download count error:", error);
    res.status(500).json({ error: "Failed to update download count" });
  }
};

// ✅ Update file view count
export const updateViewCount = async (req, res) => {
  try {
    const { id } = req.params;
    
    const file = await File.findById(id);
    
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }
    
    file.viewCount += 1;
    file.viewHistory.push({
      timestamp: new Date(),
    });
    file.lastAccessed = new Date();
    
    await file.save();
    
    res.json({
      success: true,
      message: "View count updated",
      viewCount: file.viewCount,
    });
  } catch (error) {
    console.error("Update view count error:", error);
    res.status(500).json({ error: "Failed to update view count" });
  }
};

// ✅ Delete single file
export const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const file = await File.findOneAndDelete({ _id: id, userId });
    
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }
    
    res.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Delete file error:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
};

// ✅ Bulk delete files
export const bulkDeleteFiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fileIds } = req.body;
    
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: "No file IDs provided" });
    }
    
    const result = await File.deleteMany({
      _id: { $in: fileIds },
      userId,
    });
    
    res.json({
      success: true,
      message: `${result.deletedCount} files deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    res.status(500).json({ error: "Failed to delete files" });
  }
};

// ✅ Get file statistics for dashboard
export const getFileStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const totalFiles = await File.countDocuments({ userId });
    const totalShares = await File.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: "$shareCount" } } },
    ]);
    const totalDownloads = await File.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: "$downloadCount" } } },
    ]);
    const totalViews = await File.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: "$viewCount" } } },
    ]);
    
    res.json({
      success: true,
      stats: {
        totalFiles,
        totalShares: totalShares[0]?.total || 0,
        totalDownloads: totalDownloads[0]?.total || 0,
        totalViews: totalViews[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Get file stats error:", error);
    res.status(500).json({ error: "Failed to get file statistics" });
  }
};