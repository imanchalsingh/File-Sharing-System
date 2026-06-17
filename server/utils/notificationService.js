import Notification from '../models/Notification.js';
import nodemailer from 'nodemailer';
import User from '../models/UserSchema.js';

let transporter = null;

try {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('Email notifications enabled');
  } else {
    console.log('Email notifications disabled (SMTP not configured)');
  }
} catch (err) {
  console.log('Email setup failed, continuing without email:', err.message);
}

export const createNotification = async ({ userId, type, shareId, fileId, message }) => {
  try {
    const notification = new Notification({ userId, type, shareId, fileId, message });
    await notification.save();

    // Attempt email notification
    if (transporter) {
      try {
        const user = await User.findById(userId);
        if (user?.email) {
          await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: user.email,
            subject: `File Share Alert: ${type.replace(/_/g, ' ')}`,
            html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>File Sharing Notification</h2>
              <p>${message}</p>
              <p style="color: #666; font-size: 12px;">This is an automated notification from File Sharing System.</p>
            </div>`,
          });
        }
      } catch (emailErr) {
        console.error('Email send failed (notification still saved):', emailErr.message);
      }
    }

    return notification;
  } catch (err) {
    console.error('Create notification error:', err);
    return null;
  }
};

export const getUserNotifications = async (userId, limit = 20) => {
  return Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('fileId', 'fileName')
    .lean();
};

export const markNotificationRead = async (notificationId, userId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true },
    { new: true }
  );
};

export const markAllNotificationsRead = async (userId) => {
  return Notification.updateMany({ userId, read: false }, { read: true });
};

export const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ userId, read: false });
};
