import UploadSession from "../models/UploadSession.js";
import { removeSessionTempDir } from "../utils/chunkStorage.js";

export function startUploadSessionCleanupJob() {
  const intervalMs = 60 * 60 * 1000;

  const cleanup = async () => {
    try {
      const expiredSessions = await UploadSession.find({
        expiresAt: { $lt: new Date() },
        status: { $nin: ["completed"] },
      });

      for (const session of expiredSessions) {
        session.status = session.status === "completed" ? session.status : "failed";
        session.errorMessage = session.errorMessage || "Upload session expired";
        await session.save();
        await removeSessionTempDir(session.tempDir);
      }

      if (expiredSessions.length > 0) {
        console.log(`Cleaned up ${expiredSessions.length} expired upload session(s)`);
      }
    } catch (error) {
      console.error("Upload session cleanup error:", error);
    }
  };

  cleanup();
  setInterval(cleanup, intervalMs);
}
