import cron from 'node-cron';
import ShareLink from '../models/ShareLink.js';
import { createNotification } from '../utils/notificationService.js';
import { dispatchWebhookEvent } from './webhookQueue.js';

export const startExpirationJob = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();

      // 1. Expire all active links past their expiration date
      const expiredLinks = await ShareLink.find({
        status: 'active',
        expiresAt: { $ne: null, $lte: now },
      }).populate('fileId', 'fileName');

      for (const link of expiredLinks) {
        link.status = 'expired';
        await link.save();

        await createNotification({
          userId: link.userId,
          type: 'expired',
          shareId: link._id,
          fileId: link.fileId?._id || link.fileId,
          message: `Share link for "${link.fileId?.fileName || 'Unknown file'}" has expired.`,
        });
        
        try {
          await dispatchWebhookEvent(link.userId, "link_expired", {
            shareId: link._id,
            fileId: link.fileId?._id || link.fileId,
            fileName: link.fileId?.fileName || 'Unknown file'
          });
        } catch (e) {}
      }

      if (expiredLinks.length > 0) {
        console.log(`[ExpirationJob] Expired ${expiredLinks.length} share links`);
      }

      // 2. Send 24h warning notifications
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const warningLinks24h = await ShareLink.find({
        status: 'active',
        expiresAt: { $ne: null, $lte: in24h, $gt: now },
        notifiedAt24h: false,
      }).populate('fileId', 'fileName');

      for (const link of warningLinks24h) {
        link.notifiedAt24h = true;
        await link.save();

        await createNotification({
          userId: link.userId,
          type: 'expiry_warning_24h',
          shareId: link._id,
          fileId: link.fileId?._id || link.fileId,
          message: `Share link for "${link.fileId?.fileName || 'Unknown file'}" expires within 24 hours.`,
        });
      }

      // 3. Send 1h warning notifications
      const in1h = new Date(now.getTime() + 60 * 60 * 1000);
      const warningLinks1h = await ShareLink.find({
        status: 'active',
        expiresAt: { $ne: null, $lte: in1h, $gt: now },
        notifiedAt1h: false,
      }).populate('fileId', 'fileName');

      for (const link of warningLinks1h) {
        link.notifiedAt1h = true;
        await link.save();

        await createNotification({
          userId: link.userId,
          type: 'expiry_warning_1h',
          shareId: link._id,
          fileId: link.fileId?._id || link.fileId,
          message: `Share link for "${link.fileId?.fileName || 'Unknown file'}" expires within 1 hour!`,
        });
      }
    } catch (error) {
      console.error('[ExpirationJob] Error:', error);
    }
  });

  console.log('[ExpirationJob] Scheduled to run every 5 minutes');
};
