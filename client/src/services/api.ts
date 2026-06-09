import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, 
});

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
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
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
};

export default api;