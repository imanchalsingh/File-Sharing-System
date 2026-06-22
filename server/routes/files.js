import express from "express";
import authenticateUser from "../middleware/authenticateUser.js";
import { downloadLimiter } from "../middleware/rateLimiter.js";
import {
  initUpload,
  getUploadStatus,
  getResumableUploads,
  uploadChunk,
  cancelUpload,
  chunkUploadMiddleware,
} from "../controllers/uploadController.js";
import {
  getUserFiles,
  getFileById,
  saveFileInfo,
  updateShareCount,
  updateDownloadCount,
  updateViewCount,
  deleteFile,
  bulkDeleteFiles,
  getFileStats,
  getFileVersions,
  restoreFileVersion,
  toggleFavorite,
  getFavoriteFiles,
  updateFileTags,
  getFilesByTag,
  updateFilePassword,
  getSharedFileById,
  verifySharedFilePassword,
  searchFiles,
} from "../controllers/fileController.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/shared/:id", getSharedFileById);
router.post("/shared/:id/verify-password", verifySharedFilePassword);
router.put("/shared/:id/download", updateDownloadCount);

// All routes below require authentication
router.use(authenticateUser);

// Chunked resumable upload routes
router.post("/upload/init", initUpload);
router.get("/upload/resumable", getResumableUploads);
router.get("/upload/status/:sessionId", getUploadStatus);
router.post("/upload/chunk", ...chunkUploadMiddleware, uploadChunk);
router.delete("/upload/:sessionId", cancelUpload);

// Search files
router.get("/search", searchFiles);

// Get all user files
router.get("/my-files", getUserFiles);

// Get favorite files
router.get("/favorites", getFavoriteFiles);

// Get file stats
router.get("/stats", getFileStats);

// Get single file
router.get("/:id", getFileById);

// Save file info after upload
router.post("/save-info", saveFileInfo);

// Update counts & password
router.put("/:id/share", updateShareCount);
router.put("/:id/download", downloadLimiter, updateDownloadCount);
router.put("/:id/view", updateViewCount);
router.put("/:id/favorite", toggleFavorite);
router.put("/:id/password", updateFilePassword);

// Delete file
router.delete("/:id", deleteFile);

// Bulk delete
router.delete("/bulk-delete", bulkDeleteFiles);

// Get file versions
router.get("/:id/versions", getFileVersions);

// Restore file version
router.post("/:id/restore/:version", restoreFileVersion);

// Tags
router.put("/:id/tags", updateFileTags);
router.get("/tag/:tag", getFilesByTag);

export default router;