import express from "express";
import authenticateUser from "../middleware/authenticateUser.js";
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
} from "../controllers/fileController.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/shared/:id", getSharedFileById);
router.post("/shared/:id/verify-password", verifySharedFilePassword);

// All routes below require authentication
router.use(authenticateUser);

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
router.put("/:id/download", updateDownloadCount);
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