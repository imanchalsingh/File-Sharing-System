import ShareLink from '../models/ShareLink.js';
import File from '../models/File.js';
import {
  createNotification,
  getUserNotifications as fetchUserNotifications,
  markNotificationRead as markOneRead,
  markAllNotificationsRead,
  getUnreadCount as fetchUnreadCount,
} from '../utils/notificationService.js';

// POST /api/shares - Create a new share link
export const createShareLink = async (req, res, next) => {
  try {
    const { fileId, expiresAt, maxAccessCount, slug } = req.body;
    const userId = req.user.id;

    if (!fileId) {
      return res.status(400).json({ success: false, message: 'fileId is required' });
    }

    let finalSlug = undefined;
    if (slug) {
      finalSlug = slug.trim().toLowerCase();
      
      if (!/^[a-z0-9-]+$/.test(finalSlug)) {
        return res.status(400).json({ success: false, message: 'Custom URL can only contain letters, numbers, and hyphens' });
      }
      if (finalSlug.length < 3 || finalSlug.length > 32) {
        return res.status(400).json({ success: false, message: 'Custom URL must be between 3 and 32 characters long' });
      }
      
      const reservedWords = ['admin', 'api', 'login', 'dashboard', 'settings', 's', 'shared', 'files', 'users', 'auth'];
      if (reservedWords.includes(finalSlug)) {
        return res.status(400).json({ success: false, message: 'This custom URL is reserved and cannot be used' });
      }
    }

    // Verify file ownership
    const file = await File.findOne({ _id: fileId, userId });
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found or access denied' });
    }

    // Generate unique token using nanoid
    const { nanoid } = await import('nanoid');
    const token = nanoid(21);

    const shareLink = new ShareLink({
      token,
      slug: finalSlug,
      fileId,
      userId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      maxAccessCount: maxAccessCount || null,
    });

    await shareLink.save();

    // Update file share stats
    file.shareCount = (file.shareCount || 0) + 1;
    file.shareHistory.push({ timestamp: new Date(), source: 'link' });
    await file.save();

    const shareUrl = `${process.env.SHARE_BASE_URL || 'http://localhost:5173/s'}/${shareLink.slug || token}`;

    const { recipientEmail } = req.body;
    if (recipientEmail) {
      await createNotification({
        userId,
        type: 'FILE_SHARED',
        shareId: shareLink._id,
        fileId,
        message: `${req.user.name || 'A user'} shared a file with you: ${file.fileName}`,
        shareLink: shareUrl,
        recipientEmail: recipientEmail.trim(),
      });
    }

    res.status(201).json({
      success: true,
      share: {
        _id: shareLink._id,
        token: shareLink.token,
        slug: shareLink.slug,
        url: shareUrl,
        expiresAt: shareLink.expiresAt,
        maxAccessCount: shareLink.maxAccessCount,
        status: shareLink.status,
        createdAt: shareLink.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
      return res.status(409).json({ success: false, message: 'This custom URL is already taken' });
    }
    next(error);
  }
};

// GET /api/shares/file/:fileId - Get all share links for a file
export const getShareLinks = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    // Verify file ownership
    const file = await File.findOne({ _id: fileId, userId });
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found or access denied' });
    }

    const shares = await ShareLink.find({ fileId, userId })
      .sort({ createdAt: -1 })
      .lean();

    const baseUrl = process.env.SHARE_BASE_URL || 'http://localhost:5173/s';
    const sharesWithUrls = shares.map((share) => ({
      ...share,
      url: `${baseUrl}/${share.slug || share.token}`,
    }));

    res.json({ success: true, shares: sharesWithUrls });
  } catch (error) {
    next(error);
  }
};

// PUT /api/shares/:shareId - Update share link expiration
export const updateShareLink = async (req, res, next) => {
  try {
    const { shareId } = req.params;
    const { expiresAt, maxAccessCount, slug } = req.body;
    const userId = req.user.id;

    const share = await ShareLink.findOne({ _id: shareId, userId });
    if (!share) {
      return res.status(404).json({ success: false, message: 'Share link not found' });
    }

    if (expiresAt !== undefined) {
      const newExpiry = expiresAt ? new Date(expiresAt) : null;
      // Reset notification flags if new date is later than current
      if (newExpiry && (!share.expiresAt || newExpiry > share.expiresAt)) {
        share.notifiedAt24h = false;
        share.notifiedAt1h = false;
      }
      share.expiresAt = newExpiry;
    }

    if (maxAccessCount !== undefined) {
      share.maxAccessCount = maxAccessCount;
    }

    if (slug !== undefined) {
      if (slug) {
        const finalSlug = slug.trim().toLowerCase();
        
        if (!/^[a-z0-9-]+$/.test(finalSlug)) {
          return res.status(400).json({ success: false, message: 'Custom URL can only contain letters, numbers, and hyphens' });
        }
        if (finalSlug.length < 3 || finalSlug.length > 32) {
          return res.status(400).json({ success: false, message: 'Custom URL must be between 3 and 32 characters long' });
        }
        
        const reservedWords = ['admin', 'api', 'login', 'dashboard', 'settings', 's', 'shared', 'files', 'users', 'auth'];
        if (reservedWords.includes(finalSlug)) {
          return res.status(400).json({ success: false, message: 'This custom URL is reserved and cannot be used' });
        }
        share.slug = finalSlug;
      } else {
        share.slug = undefined;
        share.$unset('slug');
      }
    }

    // Reactivate if it was expired and new date is in the future
    if (share.status === 'expired' && share.expiresAt && share.expiresAt > new Date()) {
      share.status = 'active';
    }

    await share.save();

    res.json({ success: true, share });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
      return res.status(409).json({ success: false, message: 'This custom URL is already taken' });
    }
    next(error);
  }
};

// PUT /api/shares/:shareId/revoke - Revoke a share link
export const revokeShareLink = async (req, res, next) => {
  try {
    const { shareId } = req.params;
    const userId = req.user.id;

    const share = await ShareLink.findOne({ _id: shareId, userId });
    if (!share) {
      return res.status(404).json({ success: false, message: 'Share link not found' });
    }

    share.status = 'revoked';
    await share.save();

    await createNotification({
      userId,
      type: 'revoked',
      shareId: share._id,
      fileId: share.fileId,
      message: `You revoked a share link.`,
    });

    res.json({ success: true, message: 'Share link revoked', share });
  } catch (error) {
    next(error);
  }
};

// PUT /api/shares/:shareId/extend - Extend share link expiration
export const extendShareLink = async (req, res, next) => {
  try {
    const { shareId } = req.params;
    const { expiresAt } = req.body;
    const userId = req.user.id;

    if (!expiresAt) {
      return res.status(400).json({ success: false, message: 'New expiresAt is required' });
    }

    const share = await ShareLink.findOne({ _id: shareId, userId });
    if (!share) {
      return res.status(404).json({ success: false, message: 'Share link not found' });
    }

    const newExpiry = new Date(expiresAt);
    share.expiresAt = newExpiry;
    share.notifiedAt24h = false;
    share.notifiedAt1h = false;

    // Reactivate if expired
    if (share.status === 'expired') {
      share.status = 'active';
    }

    await share.save();

    await createNotification({
      userId,
      type: 'extended',
      shareId: share._id,
      fileId: share.fileId,
      message: `Share link expiration extended to ${newExpiry.toISOString()}.`,
    });

    res.json({ success: true, message: 'Share link extended', share });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/shares/:shareId - Delete a share link permanently
export const deleteShareLink = async (req, res, next) => {
  try {
    const { shareId } = req.params;
    const userId = req.user.id;

    const share = await ShareLink.findOneAndDelete({ _id: shareId, userId });
    if (!share) {
      return res.status(404).json({ success: false, message: 'Share link not found' });
    }

    res.json({ success: true, message: 'Share link deleted' });
  } catch (error) {
    next(error);
  }
};

// GET /api/shares/access/:token - Public access to shared file
export const accessSharedFile = async (req, res, next) => {
  try {
    const { token } = req.params;

    const share = await ShareLink.findOne({ $or: [{ token }, { slug: token }] }).populate('fileId', 'fileName fileUrl fileType fileSize fileSizeBytes');
    if (!share) {
      return res.status(404).json({ success: false, error: 'not_found', message: 'Share link not found' });
    }

    // Check if revoked
    if (share.status === 'revoked') {
      return res.status(403).json({ success: false, error: 'revoked', message: 'This share link has been revoked' });
    }

    // Check if expired by status
    if (share.status === 'expired') {
      return res.status(410).json({
        success: false,
        error: 'expired',
        message: 'This share link has expired',
        fileName: share.fileId?.fileName,
      });
    }

    // Check if expired by date
    if (share.expiresAt && share.expiresAt <= new Date()) {
      share.status = 'expired';
      await share.save();
      return res.status(410).json({
        success: false,
        error: 'expired',
        message: 'This share link has expired',
        fileName: share.fileId?.fileName,
      });
    }

    // Check max access count
    if (share.maxAccessCount && share.accessCount >= share.maxAccessCount) {
      return res.status(410).json({
        success: false,
        error: 'expired',
        message: 'This share link has reached its maximum access count',
        fileName: share.fileId?.fileName,
      });
    }

    // Increment accessCount only (not downloadCount)
    // Check quota / suspension
    if (share.isSuspended) {
      return res.status(429).json({
        success: false,
        error: 'quota_exceeded',
        message: 'This share link has been temporarily suspended due to exceeding its daily bandwidth quota.',
        fileName: share.fileId?.fileName,
      });
    }

    const fileSizeBytes = share.fileId?.fileSizeBytes || 0;
    if (share.dailyBandwidth + fileSizeBytes > share.bandwidthLimit) {
      share.isSuspended = true;
      await share.save();
      return res.status(429).json({
        success: false,
        error: 'quota_exceeded',
        message: 'This share link has exceeded its daily bandwidth quota and has been suspended.',
        fileName: share.fileId?.fileName,
      });
    }

    // Increment access count and bandwidth
    share.accessCount += 1;
    share.dailyBandwidth += fileSizeBytes;
    await share.save();

    res.json({
      success: true,
      file: {
        _id: share.fileId?._id,
        fileName: share.fileId?.fileName,
        fileUrl: share.fileId?.fileUrl,
        fileType: share.fileId?.fileType,
        fileSize: share.fileId?.fileSize,
      },
      share: {
        _id: share._id,
        expiresAt: share.expiresAt,
        accessCount: share.accessCount,
        downloadCount: share.downloadCount || 0,
        createdAt: share.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/shares/download/:token - Record download of a shared file
export const trackShareDownload = async (req, res, next) => {
  try {
    const { token } = req.params;

    const share = await ShareLink.findOne({ $or: [{ token }, { slug: token }] });
    if (!share) {
      return res.status(404).json({ success: false, message: 'Share link not found' });
    }

    if (share.status === 'revoked') {
      return res.status(403).json({ success: false, message: 'This share link has been revoked' });
    }

    if (share.status === 'expired') {
      return res.status(410).json({ success: false, message: 'This share link has expired' });
    }

    if (share.expiresAt && share.expiresAt <= new Date()) {
      share.status = 'expired';
      await share.save();
      return res.status(410).json({ success: false, message: 'This share link has expired' });
    }

    if (share.maxAccessCount && share.accessCount >= share.maxAccessCount) {
      return res.status(410).json({ success: false, message: 'Access limit reached' });
    }

    // Increment downloadCount for ShareLink
    share.downloadCount = (share.downloadCount || 0) + 1;
    if (!share.downloadHistory) {
      share.downloadHistory = [];
    }
    share.downloadHistory.push({
      downloadedAt: new Date(),
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Unknown'
    });
    await share.save();

    // Increment downloadCount for the underlying File
    const file = await File.findById(share.fileId);
    if (file) {
      file.downloadCount = (file.downloadCount || 0) + 1;
      file.downloadHistory.push({
        timestamp: new Date()
      });
      file.lastAccessed = new Date();
      await file.save();
    }

    res.json({ success: true, downloadCount: share.downloadCount });
  } catch (error) {
    next(error);
  }
};

// GET /api/shares/analytics/downloads - Gather detailed aggregated engagement metrics per user profile session
export const getDownloadAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Filter structural parameters matching the specific authenticated signature index keys
    const shareAnalytics = await ShareLink.find({ userId })
      .populate('fileId', 'fileName fileType fileSize')
      .select('downloadCount downloadHistory expiresAt status token createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, shares: shareAnalytics });
  } catch (error) {
    next(error);
  }
};

// GET /api/shares/expiring - Get shares expiring within 24h
export const getExpiringShares = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const shares = await ShareLink.find({
      userId,
      status: 'active',
      expiresAt: { $ne: null, $lte: in24h, $gt: now },
    })
      .populate('fileId', 'fileName fileType')
      .sort({ expiresAt: 1 })
      .lean();

    res.json({ success: true, shares });
  } catch (error) {
    next(error);
  }
};

// GET /api/shares/notifications - Get user notifications
export const getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const notifications = await fetchUserNotifications(userId, limit);
    res.json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
};

// PUT /api/shares/notifications/:notificationId/read - Mark notification as read
export const markNotificationRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    const notification = await markOneRead(notificationId, userId);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

// PUT /api/shares/notifications/read-all - Mark all notifications as read
export const markAllRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await markAllNotificationsRead(userId);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// GET /api/shares/notifications/unread-count - Get unread notification count
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const count = await fetchUnreadCount(userId);
    res.json({ success: true, count });
  } catch (error) {
    next(error);
  }
};