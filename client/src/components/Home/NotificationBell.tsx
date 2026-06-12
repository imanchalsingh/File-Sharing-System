import React, { useState, useEffect, useRef } from 'react';
import { Bell, Clock, XCircle, RefreshCw, Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationApi } from '../../services/api';

interface Notification {
  _id: string;
  type: 'expiry_warning' | 'expired' | 'extended' | string;
  message: string;
  read: boolean;
  createdAt: string;
}

const getRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes === 1) return '1 min ago';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'expiry_warning':
      return <Clock className="w-4 h-4 text-[#f39c12]" />;
    case 'expired':
      return <XCircle className="w-4 h-4 text-[#e74c3c]" />;
    case 'extended':
      return <RefreshCw className="w-4 h-4 text-[#2ecc71]" />;
    default:
      return <Bell className="w-4 h-4 text-[#3498db]" />;
  }
};

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const data = await notificationApi.getUnreadCount();
      setUnreadCount(data.count ?? 0);
    } catch {
      // Silent fail for polling
    }
  };

  // Fetch notifications list
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await notificationApi.getNotifications();
      setNotifications(data.notifications ?? []);
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for unread count every 60 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silent fail
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Silent fail
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        id="notification-bell-toggle"
        ref={bellRef}
        onClick={handleToggle}
        className="relative p-2 rounded-lg bg-gray-200 dark:bg-gray-700/50
          hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300
          hover:text-black dark:hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            id="notification-unread-badge"
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1
              bg-[#e74c3c] text-white text-[10px] font-bold
              rounded-full flex items-center justify-center
              shadow-lg shadow-red-500/30 animate-pulse"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="notification-dropdown"
            ref={dropdownRef}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[28rem]
              bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl
              border border-gray-200 dark:border-gray-700
              rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#3498db]" />
                Notifications
                {unreadCount > 0 && (
                  <span className="text-xs bg-[#3498db]/20 text-[#3498db] px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button
                  id="notification-mark-all-read"
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-[#3498db] hover:text-[#2980b9] font-medium
                    flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-[#3498db] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
                  <Bell className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {notifications.map((notification) => (
                    <li key={notification._id}>
                      <button
                        id={`notification-item-${notification._id}`}
                        onClick={() => {
                          if (!notification.read) {
                            handleMarkAsRead(notification._id);
                          }
                        }}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3
                          transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/40
                          ${
                            !notification.read
                              ? 'border-l-2 border-[#3498db] bg-[#3498db]/5'
                              : 'border-l-2 border-transparent opacity-70'
                          }`}
                      >
                        {/* Icon */}
                        <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm leading-snug ${
                              !notification.read
                                ? 'text-gray-900 dark:text-white font-medium'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {getRelativeTime(notification.createdAt)}
                          </p>
                        </div>

                        {/* Read indicator */}
                        {!notification.read && (
                          <div className="flex-shrink-0 mt-1">
                            <div className="w-2 h-2 rounded-full bg-[#3498db]" />
                          </div>
                        )}
                        {notification.read && (
                          <div className="flex-shrink-0 mt-1">
                            <Check className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                          </div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                  Showing last {notifications.length} notifications
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
