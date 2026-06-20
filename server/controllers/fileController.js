import File from "../models/File.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Readable } from "stream";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { ZipArchive } = require("archiver");


// ✅ Get user's all files (with optional folder filter)
export const getUserFiles = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { folderId } = req.query; // 'null' string or objectId

    const query = { userId, isDeleted: false };
    
    if (folderId !== undefined) {
      query.folderId = folderId === "null" || folderId === "" ? null : folderId;
    }

    const files = await File.find(query)
      .sort({ createdAt: -1 })
      .select("-__v");

    res.json({
      success: true,
      files,
      count: files.length,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Get single file by ID
export const getFileById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const file = await File.findOne({ _id: id, userId });

    if (!file) {
      const error = new Error("File not found");
      error.statusCode = 404;
      return next(error);
    }

    res.json({ success: true, file });
  } catch (error) {
    next(error);
  }
};

// ✅ Save file info after upload
export const saveFileInfo = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      fileName,
      fileUrl,
      fileType,
      fileSize,
      fileSizeBytes,
      checksum,
      tags,
      password,
      folderId,
    } = req.body;

    if (!fileName || !fileUrl) {
      const error = new Error("File name and URL are required");
      error.statusCode = 400;
      return next(error);
    }


// Check for duplicate files using checksum
if (checksum) {
  const duplicateFile = await File.findOne({
    checksum,
    userId,
  });

  if (duplicateFile) {
    return res.status(200).json({
      success: true,
      duplicate: true,
      warning: "Duplicate file detected",
      existingFile: {
        id: duplicateFile._id,
        fileName: duplicateFile.fileName,
      },
    });
  }
}

    const existingFile = await File.findOne({ fileName, userId });

    if (existingFile) {
      // Archive the current state into versions array
      existingFile.versions.push({
        version: existingFile.currentVersion || 1,
        fileUrl: existingFile.fileUrl,
        fileSize: existingFile.fileSize,
        fileSizeBytes: existingFile.fileSizeBytes,
        checksum: existingFile.checksum,
        uploadedAt: existingFile.updatedAt || existingFile.createdAt,
      });

      // Update with new file data
      existingFile.fileUrl = fileUrl;
      existingFile.fileType = fileType || existingFile.fileType;
      existingFile.fileSize = fileSize || existingFile.fileSize;
      existingFile.fileSizeBytes = fileSizeBytes || existingFile.fileSizeBytes;
      existingFile.checksum = checksum || existingFile.checksum;
      existingFile.currentVersion = (existingFile.currentVersion || 1) + 1;

      await existingFile.save();

      const io = req.app.get("io");
      if (io) io.to(`user_${userId}`).emit("FILE_UPDATED", existingFile);

      return res.status(200).json({
        success: true,
        message: "File updated successfully as a new version",
        file: existingFile,
      });
    }

    let hashedPassword = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const newFile = new File({
      fileName,
      fileUrl,
      fileType: fileType || "application",
      fileSize: fileSize || "0 KB",
      fileSizeBytes: fileSizeBytes || 0,
      checksum: checksum || null,
      folderId: folderId || null,
      userId,
      currentVersion: 1,
      tags: Array.isArray(tags) ? tags : [],
      password: hashedPassword,
      shareCount: 0,
      downloadCount: 0,
      viewCount: 0,
      shareHistory: [],
      downloadHistory: [],
      viewHistory: [],
      versions: [],
    });

    await newFile.save();

    const io = req.app.get("io");
    if (io) io.to(`user_${userId}`).emit("FILE_UPLOADED", newFile);

    res.status(201).json({
      success: true,
      message: "File info saved successfully",
      file: newFile,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Update file share count
export const updateShareCount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { source = "direct_copy" } = req.body;

    const file = await File.findById(id);

    if (!file) {
      const error = new Error("File not found");
      error.statusCode = 404;
      return next(error);
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
    next(error);
  }
};

import User from "../models/UserSchema.js";

// ✅ Update file download count
export const updateDownloadCount = async (req, res, next) => {
  try {
    const { id } = req.params;

    const file = await File.findById(id);

    if (!file) {
      const error = new Error("File not found");
      error.statusCode = 404;
      return next(error);
    }

    // Check user quota if authenticated user is downloading
    if (req.user && req.user.id) {
      const user = await User.findById(req.user.id);
      if (user) {
        const fileSizeBytes = file.fileSizeBytes || 0;
        if (user.dailyBandwidth + fileSizeBytes > user.bandwidthLimit) {
          const error = new Error(
            "Daily bandwidth quota exceeded. Please try again tomorrow.",
          );
          error.statusCode = 429;
          return next(error);
        }
        user.dailyBandwidth += fileSizeBytes;
        await user.save();
      }
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
    next(error);
  }
};

// ✅ Update file view count
export const updateViewCount = async (req, res, next) => {
  try {
    const { id } = req.params;

    const file = await File.findById(id);

    if (!file) {
      const error = new Error("File not found");
      error.statusCode = 404;
      return next(error);
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
    next(error);
  }
};

// ✅ Delete single file
export const deleteFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const file = await File.findOneAndDelete({ _id: id, userId });

    if (!file) {
      const error = new Error("File not found");
      error.statusCode = 404;
      return next(error);
    }

    const io = req.app.get("io");
    if (io) io.to(`user_${userId}`).emit("FILE_DELETED", id);

    res.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Bulk delete files
export const bulkDeleteFiles = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { fileIds } = req.body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      const error = new Error("No file IDs provided");
      error.statusCode = 400;
      return next(error);
    }

    const result = await File.deleteMany({
      _id: { $in: fileIds },
      userId,
    });

    const io = req.app.get("io");
    if (io) io.to(`user_${userId}`).emit("FILES_BULK_DELETED", fileIds);

    res.json({
      success: true,
      message: `${result.deletedCount} files deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Bulk download files as ZIP
export const bulkDownloadFiles = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { fileIds } = req.body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      const error = new Error("No file IDs provided");
      error.statusCode = 400;
      return next(error);
    }

    if (fileIds.length > 50) {
      const error = new Error("Maximum of 50 files can be downloaded at once");
      error.statusCode = 400;
      return next(error);
    }

    const files = await File.find({
      _id: { $in: fileIds },
      userId,
    });

    if (files.length === 0) {
      const error = new Error("No valid files found for download");
      error.statusCode = 404;
      return next(error);
    }

    // Set headers for ZIP download
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="bulk_download_${Date.now()}.zip"`
    );

    const archive = new ZipArchive({
      zlib: { level: 5 }, // Moderate compression for speed
    });

    archive.on("error", function (err) {
      console.error("Archive error:", err);
      if (!res.headersSent) {
        res.status(500).end("Error generating ZIP archive.");
      } else {
        res.end();
      }
    });

    // Pipe archive data to the response
    archive.pipe(res);

    const fileNamesSeen = new Set();

    for (const file of files) {
      if (!file.fileUrl) continue;

      try {
        const response = await fetch(file.fileUrl);
        if (!response.ok) {
          console.warn(`Failed to fetch ${file.fileUrl}: ${response.statusText}`);
          continue;
        }

        const nodeStream = Readable.fromWeb(response.body);

        // Handle duplicate file names in the zip
        let finalName = file.fileName;
        let counter = 1;
        while (fileNamesSeen.has(finalName)) {
          const nameParts = file.fileName.split('.');
          const ext = nameParts.length > 1 ? `.${nameParts.pop()}` : '';
          const base = nameParts.join('.');
          finalName = `${base} (${counter})${ext}`;
          counter++;
        }
        fileNamesSeen.add(finalName);

        archive.append(nodeStream, { name: finalName });
      } catch (err) {
        console.error(`Error appending file ${file.fileName}:`, err);
      }
    }

    await archive.finalize();

  } catch (error) {
    if (!res.headersSent) {
      next(error);
    } else {
      console.error("Error during bulk download stream:", error);
      res.end();
    }
  }
};

// ✅ Get file statistics for dashboard
export const getFileStats = async (req, res, next) => {
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
    next(error);
  }
};

// ✅ Get file versions
export const getFileVersions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const file = await File.findOne({ _id: id, userId }).select(
      "versions currentVersion fileName fileUrl fileSize fileSizeBytes uploadedAt updatedAt createdAt",
    );

    if (!file) {
      const error = new Error("File not found");
      error.statusCode = 404;
      return next(error);
    }

    res.json({
      success: true,
      versions: file.versions,
      currentVersion: file.currentVersion || 1,
      activeVersionDetails: {
        version: file.currentVersion || 1,
        fileUrl: file.fileUrl,
        fileSize: file.fileSize,
        fileSizeBytes: file.fileSizeBytes,
        uploadedAt: file.updatedAt || file.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Restore a previous file version
export const restoreFileVersion = async (req, res, next) => {
  try {
    const { id, version } = req.params;
    const userId = req.user.id;
    const versionToRestore = parseInt(version, 10);

    const file = await File.findOne({ _id: id, userId });

    if (!file) {
      const error = new Error("File not found");
      error.statusCode = 404;
      return next(error);
    }

    const versionData = file.versions.find(
      (v) => v.version === versionToRestore,
    );

    if (!versionData) {
      const error = new Error("Version not found");
      error.statusCode = 404;
      return next(error);
    }

    // Archive current active state
    file.versions.push({
      version: file.currentVersion || 1,
      fileUrl: file.fileUrl,
      fileSize: file.fileSize,
      fileSizeBytes: file.fileSizeBytes,
      checksum: file.checksum,
      uploadedAt: file.updatedAt || file.createdAt,
    });

    // Restore the selected version data
    file.fileUrl = versionData.fileUrl;
    file.fileSize = versionData.fileSize;
    file.fileSizeBytes = versionData.fileSizeBytes;
    file.checksum = versionData.checksum;
    file.currentVersion = (file.currentVersion || 1) + 1; // Increment version number for the new state

    await file.save();

    const io = req.app.get("io");
    if (io) io.to(`user_${userId}`).emit("FILE_UPDATED", file);

    res.json({
      success: true,
      message: "File version restored successfully",
      file,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Toggle file favorite status
export const toggleFavorite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const file = await File.findOne({ _id: id, userId });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    file.isFavorite = !file.isFavorite;
    await file.save();

    const io = req.app.get("io");
    if (io) io.to(`user_${userId}`).emit("FILE_UPDATED", file);

    res.json({
      success: true,
      message: file.isFavorite
        ? "File marked as favorite"
        : "File removed from favorites",
      isFavorite: file.isFavorite,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Get all favorite files for user
export const getFavoriteFiles = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const files = await File.find({ userId, isFavorite: true })
      .sort({ updatedAt: -1 })
      .select("-__v");

    res.json({
      success: true,
      files,
      count: files.length,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Update file tags
export const updateFileTags = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: "Tags must be an array" });
    }

    const file = await File.findOneAndUpdate(
      { _id: id, userId },
      { tags },
      { new: true },
    );

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    const io = req.app.get("io");
    if (io) io.to(`user_${userId}`).emit("FILE_UPDATED", file);

    res.json({ success: true, message: "Tags updated", tags: file.tags });
  } catch (error) {
    next(error);
  }
};

// ✅ Get files by tag
export const getFilesByTag = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { tag } = req.params;

    const files = await File.find({
      userId,
      tags: { $in: [tag] },
    }).sort({ createdAt: -1 });

    res.json({ success: true, files, count: files.length });
  } catch (error) {
    next(error);
  }
};

// ✅ Update file password protection
export const updateFilePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { password } = req.body; // Can be null/empty string to remove password

    const file = await File.findOne({ _id: id, userId });
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    if (!password) {
      file.password = null;
    } else {
      const salt = await bcrypt.genSalt(10);
      file.password = await bcrypt.hash(password, salt);
    }

    await file.save();

    const io = req.app.get("io");
    if (io) io.to(`user_${userId}`).emit("FILE_UPDATED", file);

    res.json({
      success: true,
      message: password
        ? "Password protection enabled"
        : "Password protection disabled",
      isPasswordProtected: !!password,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Get shared file details (public)
export const getSharedFileById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if ID is a valid ObjectId first to prevent crash
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: "File not found" });
    }

    // Find file, populate user username/email if we want to show who shared it
    const file = await File.findById(id).populate("userId", "username email");

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    const isPasswordProtected = !!file.password;

    // Return metadata, but hide fileUrl if password protected
    const fileDetails = {
      _id: file._id,
      fileName: file.fileName,
      fileType: file.fileType,
      fileSize: file.fileSize,
      fileSizeBytes: file.fileSizeBytes,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      isPasswordProtected,
      owner: file.userId ? { username: file.userId.username } : null,
      currentVersion: file.currentVersion || 1,
      // Only include fileUrl and versions if NOT password protected
      fileUrl: isPasswordProtected ? null : file.fileUrl,
      versions: isPasswordProtected
        ? file.versions.map((v) => ({
            version: v.version,
            uploadedAt: v.uploadedAt,
            fileSize: v.fileSize,
          }))
        : file.versions,
    };

    res.json({ success: true, file: fileDetails });
  } catch (error) {
    next(error);
  }
};

// ✅ Verify shared file password and get fileUrl
export const verifySharedFilePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const file = await File.findById(id);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    if (!file.password) {
      return res.json({
        success: true,
        fileUrl: file.fileUrl,
        versions: file.versions,
      });
    }

    const isMatch = await bcrypt.compare(password, file.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    res.json({
      success: true,
      message: "Password verified",
      fileUrl: file.fileUrl,
      versions: file.versions,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Move a file to another folder
export const moveFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { folderId } = req.body;
    const userId = req.user.id;
    const newFolderId = folderId || null;

    const file = await File.findOne({ _id: id, userId });
    if (!file) {
      const error = new Error("File not found or unauthorized");
      error.statusCode = 404;
      return next(error);
    }

    if (newFolderId) {
      // Need to import Folder model for validation
      // But fileController doesn't import Folder yet. We can avoid importing it
      // if we trust the API or we can just import mongoose and query the 'folders' collection
      const folderExists = await mongoose.connection.collection("folders").findOne({ 
        _id: new mongoose.Types.ObjectId(newFolderId), 
        userId: new mongoose.Types.ObjectId(userId) 
      });
      if (!folderExists) {
        const error = new Error("Destination folder not found or unauthorized");
        error.statusCode = 404;
        return next(error);
      }
    }

    file.folderId = newFolderId;
    await file.save();

    res.status(200).json({
      success: true,
      message: "File moved successfully",
      file,
    });
  } catch (error) {
    next(error);
  }
};
