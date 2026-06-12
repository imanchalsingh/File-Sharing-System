import express from 'express';
import authenticateUser from '../middleware/authenticateUser.js';
import {
  createShareLink,
  getShareLinks,
  updateShareLink,
  revokeShareLink,
  extendShareLink,
  deleteShareLink,
  accessSharedFile,
  getExpiringShares,
  getUserNotifications as getNotifications,
  markNotificationRead as markRead,
  markAllRead,
  getUnreadCount,
} from '../controllers/shareController.js';

const router = express.Router();

// Public route - anyone with token can access
router.get('/access/:token', accessSharedFile);

// All routes below require authentication
router.use(authenticateUser);

router.post('/', createShareLink);
router.get('/expiring', getExpiringShares);
router.get('/file/:fileId', getShareLinks);
router.put('/:shareId', updateShareLink);
router.put('/:shareId/revoke', revokeShareLink);
router.put('/:shareId/extend', extendShareLink);
router.delete('/:shareId', deleteShareLink);

// Notification routes
router.get('/notifications', getNotifications);
router.get('/notifications/unread-count', getUnreadCount);
router.put('/notifications/:notificationId/read', markRead);
router.put('/notifications/read-all', markAllRead);

export default router;
