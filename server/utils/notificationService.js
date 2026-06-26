import Notification from '../models/Notification.js';
import nodemailer from 'nodemailer';
import User from '../models/UserSchema.js';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

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

// Check Redis availability for BullMQ
let emailQueue = null;
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

try {
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });
  connection.on('error', (err) => {
    console.warn('BullMQ Redis Connection Error:', err.message);
  });
  emailQueue = new Queue('emailQueue', { connection });

  new Worker(
    'emailQueue',
    async (job) => {
      const { to, subject, html } = job.data;
      if (transporter) {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to,
          subject,
          html,
        });
      }
    },
    { connection }
  ).on('failed', (job, err) => {
    console.error(`Email Job ${job.id} failed:`, err.message);
  });
  console.log('BullMQ Email Queue initialized');
} catch (err) {
  console.warn('BullMQ initialization failed, falling back to direct async delivery:', err.message);
}

const sendEmailAsync = async (to, subject, html) => {
  if (!transporter) return;

  if (emailQueue) {
    // Dispatch to background worker
    await emailQueue.add('sendEmail', { to, subject, html }).catch(async (err) => {
      console.warn('BullMQ failed to queue, falling back to direct send:', err.message);
      // Fallback if Redis disconnects
      await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, html }).catch(() => {});
    });
  } else {
    // Immediate fallback decoupled from HTTP cycle
    setImmediate(async () => {
      try {
        await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, html });
      } catch (err) {
        console.error('Direct email send failed:', err.message);
      }
    });
  }
};

const getEmailTemplate = (type, message, shareLink = null) => {
  const ctaButton = shareLink
    ? `<div style="text-align: center; margin-top: 30px;">
         <a href="${shareLink}" style="background-color: #3498db; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Shared File</a>
       </div>`
    : '';

  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #3498db; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">SecureShare</h1>
      </div>
      <div style="padding: 40px 30px;">
        <h2 style="color: #333333; margin-top: 0; font-size: 20px;">File Sharing Notification</h2>
        <p style="color: #555555; font-size: 16px; line-height: 1.5;">${message}</p>
        ${ctaButton}
      </div>
      <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eaeaea;">
        <p style="color: #999999; font-size: 12px; margin: 0;">This is an automated notification from your File Sharing System.</p>
        <p style="color: #999999; font-size: 12px; margin: 5px 0 0 0;">Please do not reply to this email.</p>
      </div>
    </div>
  `;
};

export const createNotification = async ({ userId, type, shareId, fileId, message, shareLink, recipientEmail }) => {
  try {
    const notification = new Notification({ userId, type, shareId, fileId, message });
    await notification.save();

    // Dispatch background email if possible
    if (transporter) {
      let targetEmail = recipientEmail;
      
      if (!targetEmail) {
        const user = await User.findById(userId);
        if (user?.email) {
          targetEmail = user.email;
        }
      }

      if (targetEmail) {
        const subject = `File Share Alert: ${type.replace(/_/g, ' ')}`;
        const html = getEmailTemplate(type, message, shareLink);
        await sendEmailAsync(targetEmail, subject, html);
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
