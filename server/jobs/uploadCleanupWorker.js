import cron from "node-cron";
import File from "../models/File.js";
import UploadSession from "../models/UploadSession.js";
import { removeSessionTempDir } from "../utils/chunkStorage.js";

/**
 * Initializes the background cron worker to clean up stale PENDING uploads.
 * Runs daily at midnight (0 0 * * *).
 */
export const initUploadCleanupWorker = () => {
  cron.schedule("0 0 * * *", async () => {
    const thresholdTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 Hours ago
    console.log(`[Cleanup Worker] Starting sweep of stale PENDING uploads older than ${thresholdTime.toISOString()}`);

    try {
      // Find all incomplete files older than 24 hours
      const staleUploads = await File.find({
        status: "PENDING",
        updatedAt: { $lt: thresholdTime }
      });

      let clearedCount = 0;
      for (const file of staleUploads) {
        try {
          // Find matching UploadSession to cleanup temp directory
          const session = await UploadSession.findOne({ fileId: file._id });
          if (session) {
            if (session.tempDir) {
              await removeSessionTempDir(session.tempDir);
            }
            await UploadSession.findByIdAndDelete(session._id);
          }
          
          // Delete the stale File document from MongoDB
          await File.findByIdAndDelete(file._id);
          clearedCount++;
        } catch (fileErr) {
          console.error(`[Cleanup Worker] Failed to clean up file ${file._id}:`, fileErr);
        }
      }

      console.log(`[Cleanup Worker] Successfully cleared ${clearedCount} stale uploads.`);
    } catch (error) {
      console.error("[Cleanup Worker Error]:", error);
    }
  });
};
