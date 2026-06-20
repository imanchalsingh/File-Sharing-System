import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, 
});

export const fetchDownloadAnalytics = async () => {
  const response = await api.get("/api/shares/analytics/downloads");
  return response.data;
};
// ==================== ANALYTICS APIs ====================

export const analyticsApi = {
  getStats: async (period: "day" | "week" | "month" | "year" = "week") => {
    const response = await api.get(`/api/analytics/stats?period=${period}`);
    return response.data;
  },

  getFileStats: async (fileId: string, period: string = "week") => {
    const response = await api.get(`/api/analytics/file/${fileId}?period=${period}`);
    return response.data;
  },

  trackAction: async (action: string, data: {
    fileId: string;
    fileName: string;
    fileUrl: string;
    source?: string;
  }) => {
    const response = await api.post(`/api/track/${action}`, {
      ...data,
      source: data.source || "direct_copy",
      deviceInfo: {
        screenSize: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        platform: navigator.platform,
      },
    });
    return response.data;
  },
};

// ==================== FILE APIs ====================

export const fileApi = {
  getMyFiles: async () => {
    const response = await api.get("/api/files/my-files");
    return response.data;
  },

  saveFileInfo: async (data: {
    fileName: string;
    fileUrl: string;
    fileType?: string;
    fileSize?: string;
    fileSizeBytes?: number;
    checksum?: string;
  }) => {
    const response = await api.post("/api/files/save-info", data);
    return response.data;
  },

  getFileVersions: async (fileId: string) => {
    const response = await api.get(`/api/files/${fileId}/versions`);
    return response.data;
  },

  restoreFileVersion: async (fileId: string, version: number) => {
    const response = await api.post(`/api/files/${fileId}/restore/${version}`);
    return response.data;
  },

  uploadFile: async (file: File) => {
    const { uploadFileResumable } = await import("./resumableUpload");
    const result = await uploadFileResumable({ file });
    return { url: result.fileUrl };
  },

  deleteFile: async (fileId: string) => {
    const response = await api.delete(`/api/files/${fileId}`);
    return response.data;
  },

  toggleFavorite: async (fileId: string) => {
    const response = await api.put(`/api/files/${fileId}/favorite`);
    return response.data;
  },

  getFavorites: async () => {
    const response = await api.get("/api/files/favorites");
    return response.data;
  },

  updatePassword: async (fileId: string, password: string | null) => {
    const response = await api.put(`/api/files/${fileId}/password`, { password });
    return response.data;
  },

  getSharedFile: async (fileId: string) => {
    const response = await api.get(`/api/files/shared/${fileId}`);
    return response.data;
  },

  verifySharedPassword: async (fileId: string, password: string) => {
    const response = await api.post(`/api/files/shared/${fileId}/verify-password`, { password });
    return response.data;
  },

  moveFile: async (fileId: string, folderId: string | null) => {
    const response = await api.patch(`/api/files/${fileId}/move`, { folderId });
    return response.data;
  },
};

// ==================== FOLDER APIs ====================

export const folderApi = {
  create: async (name: string, parentId: string | null = null) => {
    const response = await api.post("/api/folders", { name, parentId });
    return response.data;
  },

  getTree: async () => {
    const response = await api.get("/api/folders/tree");
    return response.data;
  },

  getContents: async (folderId: string | null = null) => {
    const id = folderId || "root";
    const response = await api.get(`/api/folders/${id}/contents`);
    return response.data;
  },

  rename: async (folderId: string, name: string) => {
    const response = await api.patch(`/api/folders/${folderId}/rename`, { name });
    return response.data;
  },

  move: async (folderId: string, newParentId: string | null) => {
    const response = await api.patch(`/api/folders/${folderId}/move`, { parentId: newParentId });
    return response.data;
  },

  delete: async (folderId: string, force: boolean = false) => {
    const response = await api.delete(`/api/folders/${folderId}?force=${force}`);
    return response.data;
  },
};

// ==================== SHARE APIs ====================

export const shareApi = {
  createShareLink: async (data: {
    fileId: string;
    expiresAt?: string | null;
    maxAccessCount?: number | null;
    slug?: string;
  }) => {
    const response = await api.post('/api/shares', data);
    return response.data;
  },

  getShareLinks: async (fileId: string) => {
    const response = await api.get(`/api/shares/file/${fileId}`);
    return response.data;
  },

  updateShareLink: async (shareId: string, data: { expiresAt?: string; maxAccessCount?: number; slug?: string }) => {
    const response = await api.put(`/api/shares/${shareId}`, data);
    return response.data;
  },

  revokeShareLink: async (shareId: string) => {
    const response = await api.put(`/api/shares/${shareId}/revoke`);
    return response.data;
  },

  extendShareLink: async (shareId: string, data: { expiresAt: string }) => {
    const response = await api.put(`/api/shares/${shareId}/extend`, data);
    return response.data;
  },

  deleteShareLink: async (shareId: string) => {
    const response = await api.delete(`/api/shares/${shareId}`);
    return response.data;
  },

  getExpiringShares: async () => {
    const response = await api.get('/api/shares/expiring');
    return response.data;
  },

  accessSharedFile: async (token: string) => {
    const response = await api.get(`/api/shares/access/${token}`);
    return response.data;
  },
};

// ==================== NOTIFICATION APIs ====================

export const notificationApi = {
  getNotifications: async () => {
    const response = await api.get('/api/shares/notifications');
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/api/shares/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (notificationId: string) => {
    const response = await api.put(`/api/shares/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/api/shares/notifications/read-all');
    return response.data;
  },
};

export default api;

// ==================== CHUNKED UPLOAD APIs ====================

export const uploadApi = {
  initUpload: async (data: {
    fileName: string;
    fileSizeBytes: number;
    mimeType?: string;
    expectedChecksum?: string;
    sessionId?: string;
  }) => {
    const response = await api.post("/api/files/upload/init", data);
    return response.data as {
      success: boolean;
      session: import("./uploadTypes").UploadSessionInfo;
    };
  },

  getUploadStatus: async (sessionId: string) => {
    const response = await api.get(`/api/files/upload/status/${sessionId}`);
    return response.data as {
      success: boolean;
      session: import("./uploadTypes").UploadSessionInfo;
    };
  },

  getResumableUploads: async () => {
    const response = await api.get("/api/files/upload/resumable");
    return response.data as {
      success: boolean;
      sessions: import("./uploadTypes").UploadSessionInfo[];
    };
  },

  uploadChunk: async (
    sessionId: string,
    chunkIndex: number,
    chunk: Blob,
    signal?: AbortSignal,
  ) => {
    const formData = new FormData();
    formData.append("sessionId", sessionId);
    formData.append("chunkIndex", String(chunkIndex));
    formData.append("chunk", chunk, `chunk-${chunkIndex}`);

    const response = await api.post("/api/files/upload/chunk", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      signal,
      timeout: 120000,
    });

    return response.data as {
      success: boolean;
      fileUrl?: string;
      session: import("./uploadTypes").UploadSessionInfo;
    };
  },

  cancelUpload: async (sessionId: string) => {
    const response = await api.delete(`/api/files/upload/${sessionId}`);
    return response.data;
  },
};