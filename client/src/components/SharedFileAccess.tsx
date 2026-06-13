import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { shareApi, analyticsApi } from '../services/api';
import {
  Download,
  Clock,
  AlertTriangle,
  FileX,
  Shield,
  File,
  ExternalLink,
  Home,
} from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';

interface SharedFileData {
  _id?: string;
  fileName: string;
  fileType: string;
  fileSize: string | number;
  fileUrl: string;
  createdAt: string;
  expiresAt: string | null;
  accessCount: number;
  downloadCount?: number;
}

interface ErrorState {
  status: number;
  fileName?: string;
  expiresAt?: string;
  message?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const SharedFileAccess: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [fileData, setFileData] = useState<SharedFileData | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const viewTrackedRef = useRef(false);

  useEffect(() => {
    const fetchSharedFile = async () => {
      if (!token) {
        setError({ status: 404, message: 'No share token provided' });
        setIsLoading(false);
        return;
      }

      try {
        const res = await shareApi.accessSharedFile(token);
        if (res.success && res.file) {
          const mappedData: SharedFileData = {
            _id: res.file._id,
            fileName: res.file.fileName,
            fileType: res.file.fileType,
            fileSize: res.file.fileSize,
            fileUrl: res.file.fileUrl,
            createdAt: res.share?.createdAt,
            expiresAt: res.share?.expiresAt,
            accessCount: res.share?.accessCount,
            downloadCount: res.share?.downloadCount || 0,
          };
          setFileData(mappedData);

          // Track view safely
          if (!viewTrackedRef.current) {
            try {
              await analyticsApi.trackAction("view", {
                fileId: res.file._id,
                fileName: res.file.fileName,
                fileUrl: res.file.fileUrl,
                source: "shared_link"
              });
              viewTrackedRef.current = true;
            } catch (err) {
              console.error("View tracking error:", err);
            }
          }
        } else {
          setError({ status: 500, message: 'Invalid response structure' });
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response) {
          const status = err.response.status;
          const responseData = err.response.data;
          setError({
            status,
            fileName: responseData?.fileName,
            expiresAt: responseData?.expiresAt,
            message: responseData?.message,
          });
        } else {
          setError({ status: 500, message: 'An unexpected error occurred' });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedFile();
  }, [token]);

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#3498db] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading shared file...</p>
        </div>
      </div>
    );
  }

  // Expired State (410)
  if (error?.status === 410) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700 p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#f39c12]/10 flex items-center justify-center">
            <Clock className="w-8 h-8 text-[#f39c12]" />
          </div>
          <h1
            id="expired-share-title"
            className="text-2xl font-bold text-white mb-2"
          >
            Link Expired
          </h1>
          {error.fileName && (
            <p className="text-gray-400 text-sm mb-1">
              File: <span className="text-gray-300 font-medium">{error.fileName}</span>
            </p>
          )}
          {error.expiresAt && (
            <p className="text-gray-500 text-xs mb-4">
              Expired on {formatDate(error.expiresAt)}
            </p>
          )}
          <p className="text-gray-400 mb-6">
            This share link has expired. Contact the file owner for a new link.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              id="expired-share-home-link"
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                bg-gradient-to-r from-[#3498db] to-[#2ecc71]
                text-white font-medium text-sm
                hover:shadow-lg hover:shadow-[#3498db]/25 transition-all"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Revoked State (403)
  if (error?.status === 403) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700 p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#e74c3c]/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-[#e74c3c]" />
          </div>
          <h1
            id="revoked-share-title"
            className="text-2xl font-bold text-white mb-2"
          >
            Access Revoked
          </h1>
          <p className="text-gray-400 mb-6">
            {error.message || 'This share link has been revoked by the file owner.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              id="revoked-share-home-link"
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                bg-gradient-to-r from-[#3498db] to-[#2ecc71]
                text-white font-medium text-sm
                hover:shadow-lg hover:shadow-[#3498db]/25 transition-all"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Not Found State (404) / Generic Error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700 p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#9b59b6]/10 flex items-center justify-center">
            <FileX className="w-8 h-8 text-[#9b59b6]" />
          </div>
          <h1
            id="notfound-share-title"
            className="text-2xl font-bold text-white mb-2"
          >
            Link Not Found
          </h1>
          <p className="text-gray-400 mb-6">
            {error.message ||
              'The share link you\'re looking for doesn\'t exist or has been removed.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              id="notfound-share-home-link"
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                bg-gradient-to-r from-[#3498db] to-[#2ecc71]
                text-white font-medium text-sm
                hover:shadow-lg hover:shadow-[#3498db]/25 transition-all"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleDownload = async () => {
    if (!token || !fileData) return;
    setIsDownloading(true);

    try {
      // 1. Track download in analytics
      try {
        await analyticsApi.trackAction("download", {
          fileId: fileData._id || "",
          fileName: fileData.fileName,
          fileUrl: fileData.fileUrl,
          source: "shared_link"
        });
      } catch (err) {
        console.error("Analytics tracking failed:", err);
      }

      // 2. Increment share download count on backend
      try {
        await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/shares/download/${token}`, {
          method: "POST"
        });
        setFileData(prev => prev ? { ...prev, downloadCount: (prev.downloadCount || 0) + 1 } : null);
      } catch (countErr) {
        console.error("Failed to increment download count in DB:", countErr);
      }

      // 3. Download the file blob
      const response = await fetch(fileData.fileUrl);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileData.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Download started!");
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Valid File State
  if (!fileData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-lg bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700 overflow-hidden"
      >
        {/* Header gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#3498db] via-[#9b59b6] to-[#2ecc71]" />

        <div className="p-8">
          {/* File Icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#3498db]/20 to-[#2ecc71]/20 border border-gray-700 flex items-center justify-center">
            <File className="w-8 h-8 text-[#3498db]" />
          </div>

          {/* File Name */}
          <h1
            id="shared-file-name"
            className="text-xl font-bold text-white text-center mb-1 truncate"
          >
            {fileData.fileName}
          </h1>
          <p className="text-gray-400 text-sm text-center mb-6">
            Shared file • Ready to download
          </p>

          {/* File Details */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
              <span className="text-gray-400 text-sm">Type</span>
              <span id="shared-file-type" className="text-gray-200 text-sm font-medium">
                {fileData.fileType || 'Unknown'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
              <span className="text-gray-400 text-sm">Size</span>
              <span id="shared-file-size" className="text-gray-200 text-sm font-medium">
                {typeof fileData.fileSize === 'number' ? formatFileSize(fileData.fileSize) : fileData.fileSize}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
              <span className="text-gray-400 text-sm">Shared on</span>
              <span className="text-gray-200 text-sm font-medium">
                {formatDate(fileData.createdAt)}
              </span>
            </div>
            {fileData.expiresAt && (
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
                <span className="text-gray-400 text-sm flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Expires
                </span>
                <span className="text-[#f39c12] text-sm font-medium">
                  {formatDate(fileData.expiresAt)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
              <span className="text-gray-400 text-sm">Access count</span>
              <span id="shared-file-access-count" className="text-gray-200 text-sm font-medium">
                {fileData.accessCount}
              </span>
            </div>
          </div>

          {/* Download Button */}
          <button
            id="shared-file-download-btn"
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
              bg-gradient-to-r from-[#3498db] to-[#2ecc71]
              text-white font-semibold text-base
              hover:shadow-lg hover:shadow-[#3498db]/30
              hover:scale-[1.02] active:scale-[0.98]
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download File
              </>
            )}
          </button>

          {/* Warning */}
          {fileData.expiresAt && (
            <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[#f39c12]" />
              <span>
                This link will expire on {formatDate(fileData.expiresAt)}.
                Download the file before it expires.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-gray-700/50 flex items-center justify-between">
          <Link
            id="shared-file-home-link"
            to="/"
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
          >
            <Home className="w-3 h-3" />
            SecureShare
          </Link>
          <span className="text-xs text-gray-600">
            Secure file sharing
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default SharedFileAccess;
