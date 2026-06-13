import cron from "node-cron";
import User from "../models/UserSchema.js";
import ShareLink from "../models/ShareLink.js";

export const initQuotaResetJob = () => {
  // Run every day at midnight (0 0 * * *)
  cron.schedule("0 0 * * *", async () => {
    console.log("[QuotaResetJob] Running daily bandwidth quota reset...");
    try {
      // 1. Reset all users' daily bandwidth
      const userResult = await User.updateMany(
        {},
        {
          $set: {
            dailyBandwidth: 0,
            quotaResetAt: new Date(),
          },
        }
      );
      console.log(`[QuotaResetJob] Reset bandwidth for ${userResult.modifiedCount} users.`);

      // 2. Reset active share links' daily bandwidth and unsuspend them if suspended due to bandwidth
      const shareResult = await ShareLink.updateMany(
        { status: { $ne: "revoked" } }, // don't unsuspend revoked links
        {
          $set: {
            dailyBandwidth: 0,
            isSuspended: false,
          },
        }
      );
      console.log(`[QuotaResetJob] Reset bandwidth and suspensions for ${shareResult.modifiedCount} share links.`);

    } catch (error) {
      console.error("[QuotaResetJob] Error resetting quotas:", error);
    }
  });

  console.log("[QuotaResetJob] Scheduled to run every day at midnight.");
};
