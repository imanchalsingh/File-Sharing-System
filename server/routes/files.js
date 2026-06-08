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
  toggleFavorite,
  getFavoriteFiles,
} from "../controllers/fileController.js";

const router = express.Router();

// All routes require authentication
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

// Update counts
router.put("/:id/share", updateShareCount);
router.put("/:id/download", updateDownloadCount);
router.put("/:id/view", updateViewCount);
router.put("/:id/favorite", toggleFavorite);

// Delete file
router.delete("/:id", deleteFile);

// Bulk delete
router.delete("/bulk-delete", bulkDeleteFiles);

export default router;