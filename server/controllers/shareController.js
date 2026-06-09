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
export const createShareLink = async (req, res) => {
  try {
    const { fileId, expiresAt, maxAccessCount } = req.body;
    const userId = req.user.id;

    if (!fileId) {
      return res.status(400).json({ success: false, message: 'fileId is required' });
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

    const shareUrl = `${process.env.SHARE_BASE_URL || 'http://localhost:5173/s'}/${token}`;

    res.status(201).json({
      success: true,
      share: {
        _id: shareLink._id,
        token: shareLink.token,
        url: shareUrl,
        expiresAt: shareLink.expiresAt,
        maxAccessCount: shareLink.maxAccessCount,
        status: shareLink.status,
        createdAt: shareLink.createdAt,
      },
    });
  } catch (error) {
    console.error('Create share link error:', error);
    res.status(500).json({ success: false, message: 'Failed to create share link' });
  }
};

// GET /api/shares/file/:fileId - Get all share links for a file
export const getShareLinks = async (req, res) => {
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
      url: `${baseUrl}/${share.token}`,
    }));

    res.json({ success: true, shares: sharesWithUrls });
  } catch (error) {
    console.error('Get share links error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch share links' });
  }
};

// PUT /api/shares/:shareId - Update share link expiration
export const updateShareLink = async (req, res) => {
  try {
    const { shareId } = req.params;
    const { expiresAt, maxAccessCount } = req.body;
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

    // Reactivate if it was expired and new date is in the future
    if (share.status === 'expired' && share.expiresAt && share.expiresAt > new Date()) {
      share.status = 'active';
    }

    await share.save();

    res.json({ success: true, share });
  } catch (error) {
    console.error('Update share link error:', error);
    res.status(500).json({ success: false, message: 'Failed to update share link' });
  }
};

// PUT /api/shares/:shareId/revoke - Revoke a share link
export const revokeShareLink = async (req, res) => {
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
    console.error('Revoke share link error:', error);
    res.status(500).json({ success: false, message: 'Failed to revoke share link' });
  }
};

// PUT /api/shares/:shareId/extend - Extend share link expiration
export const extendShareLink = async (req, res) => {
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
    console.error('Extend share link error:', error);
    res.status(500).json({ success: false, message: 'Failed to extend share link' });
  }
};

// DELETE /api/shares/:shareId - Delete a share link permanently
export const deleteShareLink = async (req, res) => {
  try {
    const { shareId } = req.params;
    const userId = req.user.id;

    const share = await ShareLink.findOneAndDelete({ _id: shareId, userId });
    if (!share) {
      return res.status(404).json({ success: false, message: 'Share link not found' });
    }

    res.json({ success: true, message: 'Share link deleted' });
  } catch (error) {
    console.error('Delete share link error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete share link' });
  }
};

// GET /api/shares/access/:token - Public access to shared file
export const accessSharedFile = async (req, res) => {
  try {
    const { token } = req.params;

    const share = await ShareLink.findOne({ token }).populate('fileId', 'fileName fileUrl fileType fileSize');
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

    // Increment access count
    share.accessCount += 1;
    await share.save();

    res.json({
      success: true,
      file: {
        fileName: share.fileId?.fileName,
        fileUrl: share.fileId?.fileUrl,
        fileType: share.fileId?.fileType,
        fileSize: share.fileId?.fileSize,
      },
      share: {
        expiresAt: share.expiresAt,
        accessCount: share.accessCount,
        createdAt: share.createdAt,
      },
    });
  } catch (error) {
    console.error('Access shared file error:', error);
    res.status(500).json({ success: false, message: 'Failed to access shared file' });
  }
};

// GET /api/shares/expiring - Get shares expiring within 24h
export const getExpiringShares = async (req, res) => {
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
    console.error('Get expiring shares error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch expiring shares' });
  }
};

// GET /api/shares/notifications - Get user notifications
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const notifications = await fetchUserNotifications(userId, limit);
    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

// PUT /api/shares/notifications/:notificationId/read - Mark notification as read
export const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    const notification = await markOneRead(notificationId, userId);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, notification });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
};

// PUT /api/shares/notifications/read-all - Mark all notifications as read
export const markAllRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await markAllNotificationsRead(userId);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
  }
};

// GET /api/shares/notifications/unread-count - Get unread notification count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await fetchUnreadCount(userId);
    res.json({ success: true, count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: 'Failed to get unread count' });
  }
};
