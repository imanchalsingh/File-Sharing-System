import React, { useEffect, useRef, useState } from "react";
import { analyticsApi, fileApi, uploadApi } from "../../services/api";
import {
  uploadFileResumable,
  type UploadProgressState,
} from "../../services/resumableUpload";
import { formatFileSize } from "../../services/uploadTypes";
import {
  loadStoredSessions,
  removeStoredSession,
  type StoredUploadSession,
} from "../../utils/uploadSessionStorage";
import {
  Upload,
  Trash2,
  Share2,
  Download,
  Copy,
  Search,
  Filter,
  FileText,
  Image as ImageIcon,
  File,
  Folder,
  CheckCircle,
  X,
  Grid,
  List,
  Eye,
  BarChart3,
  Link as LinkIcon,
  History,
  Star,
  Lock,
  Unlock,
  Pause,
  Play,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import ShareModal from "./ShareModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface TrackedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: string;
  uploaded: string;
  checksum?: string;
  isFavorite?: boolean;
  tags?: string[];
  shareCount: number;
  downloadCount: number;
  viewCount: number;
  lastAccessed?: string;
  shareHistory: Array<{ timestamp: string; source?: string }>;
  downloadHistory: Array<{ timestamp: string }>;
  viewHistory: Array<{ timestamp: string }>;
  uploadHistory?: Array<{ timestamp: string }>;
  password?: string;
  scanStatus?: string;
  matchType?: string;
  snippet?: string;
}

const MyFiles: React.FC = () => {
  const [files, setFiles] = useState<TrackedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TrackedFile[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedType, setSelectedType] = useState("All");
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadProgressDetail, setUploadProgressDetail] = useState<UploadProgressState | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [pendingResumeSessions, setPendingResumeSessions] = useState<StoredUploadSession[]>([]);
  const pauseRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const resumeFileInputRef = useRef<HTMLInputElement | null>(null);
  const resumeSessionIdRef = useRef<string | null>(null);
  const [showFileStats, setShowFileStats] = useState<string | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState<string | null>(null);
  const [fileVersions, setFileVersions] = useState<any[]>([]);
  const [activeVersionDetails, setActiveVersionDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState<string>("");
  const [editingTagsFor, setEditingTagsFor] = useState<string | null>(null);
  
  // Password protection state
  const [showPasswordModal, setShowPasswordModal] = useState<string | null>(null);
  const [passwordValue, setPasswordValue] = useState("");
  const [isPasswordModalLoading, setIsPasswordModalLoading] = useState(false);

  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedFileForShare, setSelectedFileForShare] = useState<{
    _id: string;
    fileName: string;
    fileUrl: string;
  } | null>(null);

  // Bulk download state
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  // ✅ Load files from localStorage (temporary - will be replaced with backend)

  // ✅ Load resumable upload sessions from localStorage
  useEffect(() => {
    setPendingResumeSessions(
      loadStoredSessions().filter((session) => session.status !== "completed"),
    );
  }, []);

  // ✅ UPDATED: Load files from BACKEND first, localStorage as fallback
  useEffect(() => {
    const loadFiles = async () => {
      setLoading(true);
      try {
        const data = await fileApi.getMyFiles();
        if (data.files) {
          const backendFiles = data.files.map((file: any) => ({
            id: file._id,
            name: file.fileName,
            url: file.fileUrl,
            type: file.fileType || "application",
            size: file.fileSize || "0 KB",
            uploaded: new Date(file.updatedAt || file.createdAt).toLocaleDateString(),
            isFavorite: file.isFavorite || false,
            shareCount: file.shareCount || 0,
            downloadCount: file.downloadCount || 0,
            viewCount: file.viewCount || 0,
            shareHistory: file.shareHistory || [],
            downloadHistory: file.downloadHistory || [],
            viewHistory: file.viewHistory || [],
            currentVersion: file.currentVersion,
            tags: file.tags || [],
            password: file.password,
            scanStatus: file.scanStatus || "uploaded",
          }));
          setFiles(backendFiles);
          setLoading(false);
          return;
        }
        // Try to fetch from backend
        const token = localStorage.getItem("authToken");
        if (token) {
          const response = await fetch(`${API_URL}/api/files/my-files`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.files && data.files.length > 0) {
              const backendFiles = data.files.map((file: any) => ({
                id: file._id,
                name: file.fileName,
                url: file.fileUrl,
                type: file.fileType || "application",
                size: file.fileSize || "0 KB",
                uploaded: new Date(file.createdAt).toLocaleDateString(),
                isFavorite: file.isFavorite || false,
                shareCount: file.shareCount || 0,
                downloadCount: file.downloadCount || 0,
                viewCount: file.viewCount || 0,
                shareHistory: file.shareHistory || [],
                downloadHistory: file.downloadHistory || [],
                viewHistory: file.viewHistory || [],
                tags: file.tags || [],
                password: file.password,
                scanStatus: file.scanStatus || "uploaded",
              }));
              setFiles(backendFiles);
              setLoading(false);
              return;
            }
          }
        }
        
        // Fallback to localStorage
        const stored = localStorage.getItem("uploadedFiles");
        if (stored) {
          setFiles(JSON.parse(stored));
        }
      } catch (error) {
        console.error("Error loading files:", error);
        // Fallback to localStorage
        const stored = localStorage.getItem("uploadedFiles");
        if (stored) {
          setFiles(JSON.parse(stored));
        }
      } finally {
        setLoading(false);
      }
    };

    loadFiles();
  }, []);

  const refreshFiles = async () => {
    try {
      const data = await fileApi.getMyFiles();
      if (data.files) {
        const backendFiles = data.files.map((file: any) => ({
          id: file._id,
          name: file.fileName,
          url: file.fileUrl,
          type: file.fileType || "application",
          size: file.fileSize || "0 KB",
          uploaded: new Date(file.updatedAt || file.createdAt).toLocaleDateString(),
          isFavorite: file.isFavorite || false,
          shareCount: file.shareCount || 0,
          downloadCount: file.downloadCount || 0,
          viewCount: file.viewCount || 0,
          shareHistory: file.shareHistory || [],
          downloadHistory: file.downloadHistory || [],
          viewHistory: file.viewHistory || [],
          currentVersion: file.currentVersion,
          tags: file.tags || [],
          password: file.password,
          scanStatus: file.scanStatus || "uploaded",
        }));
        setFiles(backendFiles);
      }
    } catch (error) {
      console.error("Error refreshing files:", error);
    }
  };

  useEffect(() => {
    import("../../services/socket").then(({ subscribeToFiles, unsubscribeFromFiles }) => {
      subscribeToFiles({
        onUploaded: () => refreshFiles(),
        onUpdated: () => refreshFiles(),
        onDeleted: () => refreshFiles(),
        onBulkDeleted: () => refreshFiles(),
      });
      return () => unsubscribeFromFiles();
    });
  }, []);

  // ✅ Backend Search Integration
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults(null);
        setIsSearching(false);
        return;
      }
      
      setIsSearching(true);
      try {
        const response = await fileApi.searchFiles(searchQuery);
        if (response && response.files) {
          const mappedResults = response.files.map((file: any) => ({
            id: file._id,
            name: file.fileName,
            url: file.fileUrl,
            type: file.fileType || "application",
            size: file.fileSize || "0 KB",
            uploaded: new Date(file.updatedAt || file.createdAt).toLocaleDateString(),
            isFavorite: file.isFavorite || false,
            shareCount: file.shareCount || 0,
            downloadCount: file.downloadCount || 0,
            viewCount: file.viewCount || 0,
            shareHistory: file.shareHistory || [],
            downloadHistory: file.downloadHistory || [],
            viewHistory: file.viewHistory || [],
            currentVersion: file.currentVersion,
            tags: file.tags || [],
            password: file.password,
            scanStatus: file.scanStatus || "uploaded",
            matchType: file.matchType,
            snippet: file.snippet,
          }));
          setSearchResults(mappedResults);
        }
      } catch (error) {
        console.error("Failed to perform search:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(performSearch, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ✅ Track link copy with BACKEND API
  const trackLinkCopy = async (
    fileId: string,
    fileName: string,
    fileUrl: string,
  ) => {
    try {
      // Send to backend API
      await analyticsApi.trackAction("copy_link", {
        fileId,
        fileName,
        fileUrl,
        source: "direct_copy",
      });
      console.log("✅ Share tracked to backend");

      // Update local state for UI
      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === fileId
            ? {
                ...file,
                shareCount: (file.shareCount || 0) + 1,
                lastAccessed: new Date().toISOString(),
                shareHistory: [
                  ...(file.shareHistory || []),
                  {
                    timestamp: new Date().toISOString(),
                    source: "direct_copy",
                  },
                ],
              }
            : file,
        ),
      );
    } catch (error) {
      console.error("Failed to track share:", error);
    }
  };

  // ✅ Track download with BACKEND API
  const trackDownload = async (
    fileId: string,
    fileName: string,
    fileUrl: string,
  ) => {
    try {
      // Send to backend API
      await analyticsApi.trackAction("download", {
        fileId,
        fileName,
        fileUrl,
      });
      console.log("✅ Download tracked to backend");

      // Update local state for UI
      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === fileId
            ? {
                ...file,
                downloadCount: (file.downloadCount || 0) + 1,
                lastAccessed: new Date().toISOString(),
                downloadHistory: [
                  ...(file.downloadHistory || []),
                  { timestamp: new Date().toISOString() },
                ],
              }
            : file,
        ),
      );
    } catch (error) {
      console.error("Failed to track download:", error);
    }
  };

  // ✅ Track view with BACKEND API
  const trackView = async (
    fileId: string,
    fileName: string,
    fileUrl: string,
  ) => {
    try {
      // Send to backend API
      await analyticsApi.trackAction("view", {
        fileId,
        fileName,
        fileUrl,
      });
      console.log("✅ View tracked to backend");

      // Update local state for UI
      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === fileId
            ? {
                ...file,
                viewCount: (file.viewCount || 0) + 1,
                viewHistory: [
                  ...(file.viewHistory || []),
                  { timestamp: new Date().toISOString() },
                ],
              }
            : file,
        ),
      );
    } catch (error) {
      console.error("Failed to track view:", error);
    }
  };

  // ✅ Show version history
  const handleShowVersions = async (fileId: string) => {
    try {
      const data = await fileApi.getFileVersions(fileId);
      if (data.success) {
        setFileVersions(data.versions.sort((a: any, b: any) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()));
        setActiveVersionDetails(data.activeVersionDetails);
        setShowVersionHistory(fileId);
      }
    } catch (error) {
      console.error("Failed to load versions:", error);
      toast.error("Failed to load version history.");
    }
  };

  // ✅ Restore a version
  const handleRestoreVersion = async (fileId: string, versionNumber: number) => {
    if (!confirm(`Are you sure you want to restore version ${versionNumber}?`)) return;
    try {
      const data = await fileApi.restoreFileVersion(fileId, versionNumber);
      if (data.success) {
        toast.success("File version restored successfully.");
        setShowVersionHistory(null);
        await refreshFiles();
      }
    } catch (error) {
      console.error("Failed to restore version:", error);
      toast.error("Failed to restore file version.");
    }
  };
  // ✅ Toggle favorite status
  const handleToggleFavorite = async (fileId: string) => {
    try {
      const result = await fileApi.toggleFavorite(fileId);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, isFavorite: result.isFavorite } : f
        )
      );
      toast.success(result.isFavorite ? "Added to favorites ⭐" : "Removed from favorites");
    } catch {
      toast.error("Failed to update favorite");
    }
  };

  // ✅ Password protection update
  const handlePasswordUpdate = async (fileId: string, password: string | null) => {
    setIsPasswordModalLoading(true);
    try {
      const result = await fileApi.updatePassword(fileId, password);
      if (result.success) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, password: password ? "protected" : undefined } : f
          )
        );
        toast.success(result.message);
        setShowPasswordModal(null);
        setPasswordValue("");
      }
    } catch (error: any) {
      console.error("Failed to update password:", error);
      toast.error(error.response?.data?.error || "Failed to update password protection");
    } finally {
      setIsPasswordModalLoading(false);
    }
  };

  // ✅ Handle file upload to Cloudinary via backend
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFilesList = Array.from(e.target.files);
    const resumeSessionId = resumeSessionIdRef.current;
    resumeSessionIdRef.current = null;

    if (resumeSessionId && selectedFilesList.length !== 1) {
      toast.error("Select the original file to resume an interrupted upload.");
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    setIsPaused(false);
    pauseRef.current = false;
    setUploadProgress(0);
    setUploadProgressDetail(null);
    abortControllerRef.current = new AbortController();

    for (const [index, file] of selectedFilesList.entries()) {
      try {
        const result = await uploadFileResumable({
          file,
          sessionId: resumeSessionId || undefined,
          signal: abortControllerRef.current.signal,
          shouldPause: () => pauseRef.current,
          onProgress: (state) => {
            const overallProgress =
              ((index + state.progressPercent / 100) / selectedFilesList.length) * 100;
            setUploadProgress(overallProgress);
            setUploadProgressDetail(state);
          },
        });

        await fileApi.saveFileInfo({
          fileName: file.name,
          fileUrl: result.fileUrl,
          fileType: file.type.split("/")[0] || "application",
          fileSize: formatFileSize(file.size),
          fileSizeBytes: file.size,
          checksum: result.checksum,
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          toast.info("Upload cancelled.");
          break;
        }
        console.error("Upload failed for", file.name, err);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    await refreshFiles();
    setPendingResumeSessions(
      loadStoredSessions().filter((session) => session.status !== "completed"),
    );
    setIsUploading(false);
    setIsPaused(false);
    pauseRef.current = false;
    setUploadProgressDetail(null);
    abortControllerRef.current = null;
    setUploadProgress(100);
    setTimeout(() => setUploadProgress(0), 1000);
    e.target.value = "";
  };

  const handlePauseUpload = () => {
    pauseRef.current = true;
    setIsPaused(true);
    toast.info("Upload paused. Click Resume to continue.");
  };

  const handleResumeUpload = () => {
    pauseRef.current = false;
    setIsPaused(false);
    toast.info("Upload resumed.");
  };

  const handleCancelUpload = () => {
    pauseRef.current = false;
    setIsPaused(false);
    abortControllerRef.current?.abort();
  };

  const handleResumeStoredSession = (session: StoredUploadSession) => {
    resumeSessionIdRef.current = session.sessionId;
    toast.info(`Select "${session.fileName}" to resume from chunk ${session.receivedChunks.length}/${session.totalChunks}.`);
    resumeFileInputRef.current?.click();
  };

  const handleDiscardStoredSession = async (sessionId: string) => {
    try {
      await uploadApi.cancelUpload(sessionId);
    } catch {
      // Session may already be expired on server
    }
    removeStoredSession(sessionId);
    setPendingResumeSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    toast.success("Interrupted upload discarded.");
  };

  // ✅ Delete file

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/files/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Backend se delete ho gaya, ab local update karo
        const updated = files.filter((file) => file.id !== id);
        setFiles(updated);
        setSelectedFiles((prev) => prev.filter((fileId) => fileId !== id));
        localStorage.setItem("uploadedFiles", JSON.stringify(updated));
        console.log(" File deleted from backend");
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      console.error("Delete from backend failed:", error);
      // Fallback: local delete only
      const updated = files.filter((file) => file.id !== id);
      setFiles(updated);
      localStorage.setItem("uploadedFiles", JSON.stringify(updated));
      toast.warning("Deleted locally only. Backend sync failed");
   }
   };

  // ✅ Delete selected files
  const handleDeleteSelected = async () => {
    if (!confirm(`Delete ${selectedFiles.length} selected files?`)) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/files/bulk-delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fileIds: selectedFiles }),
      });

      if (response.ok) {
        const updated = files.filter(
          (file) => !selectedFiles.includes(file.id),
        );
        setFiles(updated);
        setSelectedFiles([]);
        localStorage.setItem("uploadedFiles", JSON.stringify(updated));
      }
    } catch (error) {
      console.error("Bulk delete failed:", error);
      // Fallback to local delete
      const updated = files.filter((file) => !selectedFiles.includes(file.id));
      setFiles(updated);
      setSelectedFiles([]);
      localStorage.setItem("uploadedFiles", JSON.stringify(updated));
    }
  };

  // ✅ Toggle file selection
  const toggleFileSelection = (id: string) => {
    setSelectedFiles((prev) =>
      prev.includes(id)
        ? prev.filter((fileId) => fileId !== id)
        : [...prev, id],
    );
  };

  // ✅ Share file with tracking
  const handleShare = async (
    fileId: string,
    fileUrl: string,
    fileName: string,
  ) => {
    // Copy link pointing to client App's SharePage
    const shareLink = `${window.location.origin}/share/${fileId}`;
    await navigator.clipboard.writeText(shareLink);

    // Track the copy to backend
    await trackLinkCopy(fileId, fileName, shareLink);

    // Show success message
    toast.success("Share link copied to clipboard!");
  };

  // ✅ Download file with tracking
  const handleDownload = async (
    fileId: string,
    fileUrl: string,
    fileName: string,
    scanStatus?: string,
  ) => {
    try {
      if (scanStatus && scanStatus !== "safe") {
        toast.error(`Cannot download file. Scan status: ${scanStatus}`);
        return;
      }
      
      // Track download to backend first
      await trackDownload(fileId, fileName, fileUrl);

      // Then proceed with download
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed. Please try again.");
    }
  };

  // ✅ Download selected files as a ZIP archive
  const handleDownloadSelected = async () => {
    if (selectedFiles.length === 0) return;

    if (selectedFiles.length === 1) {
      const fileId = selectedFiles[0];
      const file = files.find((f) => f.id === fileId);
      if (file) {
        await handleDownload(file.id, file.url, file.name);
      }
      return;
    }

    setIsDownloadingZip(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // 1. Fetch all blobs in parallel
      const blobs = await Promise.all(
        selectedFiles.map(async (fileId) => {
          const file = files.find((f) => f.id === fileId);
          if (!file) throw new Error("File not found");

          // Track download to backend
          await trackDownload(file.id, file.name, file.url);

          const response = await fetch(file.url);
          const blob = await response.blob();
          return { name: file.name, blob };
        })
      );

      // 2. Add to zip with de-duplication
      const nameCounts: { [key: string]: number } = {};
      blobs.forEach(({ name, blob }) => {
        let uniqueName = name;
        if (nameCounts[name] !== undefined) {
          nameCounts[name]++;
          const extIndex = name.lastIndexOf(".");
          const baseName = extIndex !== -1 ? name.slice(0, extIndex) : name;
          const ext = extIndex !== -1 ? name.slice(extIndex) : "";
          uniqueName = `${baseName} (${nameCounts[name]})${ext}`;
        } else {
          nameCounts[name] = 0;
        }
        zip.file(uniqueName, blob);
      });

      // 3. Generate and trigger download
      const content = await zip.generateAsync({ type: "blob" });
      const downloadUrl = window.URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `SecureShare_download_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("ZIP archive downloaded successfully!");
      setSelectedFiles([]);
    } catch (error: any) {
      console.error("Bulk download failed:", error);
      toast.error(error.message || "Failed to download selected files.");
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // ✅ View image with tracking
  const handleImagePreview = (
    fileId: string,
    fileUrl: string,
    fileName: string,
  ) => {
    trackView(fileId, fileName, fileUrl);
    setActiveImage(fileUrl);
  };
  const getFileType = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
  
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension || "")) {
      return "Images";
    }
  
    if (extension === "pdf") {
      return "PDFs";
    }
  
    if (["doc", "docx", "txt", "rtf"].includes(extension || "")) {
      return "Documents";
    }
  
    if (["mp4", "mov", "avi", "mkv", "webm"].includes(extension || "")) {
      return "Videos";
    }
  
    return "Others";
  };
  // ✅ Update tags for a file
  const handleTagUpdate = async (fileId: string, newTags: string[]) => {
    try {
      const token = localStorage.getItem("authToken");
      await fetch(`${API_URL}/api/files/${fileId}/tags`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tags: newTags }),
      });
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, tags: newTags } : f))
      );
      toast.success("Tags updated!");
    } catch (error) {
      toast.error("Failed to update tags");
    }
  };

  // ✅ Filter files based on search, type, and activeFilter
  const baseFiles = searchResults !== null ? searchResults : files;
  
  const filteredFiles = baseFiles.filter((file) => {
    const matchesType =
      selectedType === "All" || getFileType(file.name) === selectedType;

    const matchesActiveFilter =
      activeFilter === "all" || file.type === activeFilter;
  
    return matchesType && matchesActiveFilter;
  });

  const searchResultCount = filteredFiles.length;
  
// ✅ Format file size
function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + (sizes[i] || "Bytes")
  );
}
formatFileSize

 
  

  // ✅ Get file icon based on type
  function getFileIcon(type: string) {
      switch (type) {
        case "image":
          return <ImageIcon className="w-5 h-5" />;
        case "application":
          return <FileText className="w-5 h-5" />;
        default:
          return <File className="w-5 h-5" />;
      }
    }

  // ✅ Get file type color
  const getFileTypeColor = (type: string) => {
    switch (type) {
      case "image":
        return "#3498db";
      case "application":
        return "#2ecc71";
      case "video":
        return "#e74c3c";
      default:
        return "#9b59b6";
    }
  };

  // ✅ Get file stats for modal
  const getFileStats = (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return null;

    const today = new Date().toDateString();
    const todayShares =
      file.shareHistory?.filter(
        (share) => new Date(share.timestamp).toDateString() === today,
      ).length || 0;

    const todayDownloads =
      file.downloadHistory?.filter(
        (download) => new Date(download.timestamp).toDateString() === today,
      ).length || 0;

    const todayViews =
      file.viewHistory?.filter(
        (view) => new Date(view.timestamp).toDateString() === today,
      ).length || 0;

    return {
      totalShares: file.shareCount || 0,
      totalDownloads: file.downloadCount || 0,
      totalViews: file.viewCount || 0,
      todayShares,
      todayDownloads,
      todayViews,
      lastAccessed: file.lastAccessed
        ? new Date(file.lastAccessed).toLocaleString()
        : "Never",
    };
  };

  // ✅ Get total stats for header
  const totalStats = {
    totalShares: files.reduce((sum, file) => sum + (file.shareCount || 0), 0),
    totalDownloads: files.reduce(
      (sum, file) => sum + (file.downloadCount || 0),
      0,
    ),
    totalViews: files.reduce((sum, file) => sum + (file.viewCount || 0), 0),
    todayShares: files.reduce((sum, file) => {
      const today = new Date().toDateString();
      const todayShares =
        file.shareHistory?.filter(
          (share) => new Date(share.timestamp).toDateString() === today,
        ).length || 0;
      return sum + todayShares;
    }, 0),
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3498db] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6">
      {/* Header with Stats */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Files</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {files.length} files • {selectedFiles.length} selected
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <div className="flex bg-gray-200 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded ${viewMode === "grid" ? "text-3xl font-bold text-gray-900 dark:text-white mb-2" : "text-gray-600 dark:text-gray-400"}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded ${viewMode === "list" ? "text-3xl font-bold text-gray-900 dark:text-white mb-2" : "text-gray-600 dark:text-gray-400"}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="hidden sm:block w-48">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {uploadProgressDetail?.status === "hashing"
                    ? "Hashing..."
                    : uploadProgressDetail?.status === "paused"
                      ? "Paused"
                      : "Uploading..."}{" "}
                  {uploadProgress.toFixed(0)}%
                </div>
                {uploadProgressDetail && uploadProgressDetail.totalChunks > 0 && (
                  <div className="text-[10px] text-gray-500 mb-1">
                    Chunk {uploadProgressDetail.currentChunk}/{uploadProgressDetail.totalChunks}
                  </div>
                )}
                <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#3498db] to-[#2ecc71]"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  ></motion.div>
                </div>
                <div className="flex gap-1 mt-1">
                  {!isPaused ? (
                    <button
                      type="button"
                      onClick={handlePauseUpload}
                      className="text-[10px] px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      <Pause className="w-3 h-3 inline" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResumeUpload}
                      className="text-[10px] px-2 py-0.5 rounded bg-[#3498db] text-white"
                    >
                      <Play className="w-3 h-3 inline" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCancelUpload}
                    className="text-[10px] px-2 py-0.5 rounded bg-[#e74c3c] text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-[#3498db]/20 rounded-lg mr-3">
                <Folder className="w-5 h-5 text-[#3498db]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {files.length}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">Total Files</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-400/20 rounded-lg mr-3">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {files.filter((f) => f.isFavorite).length}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">Favorites</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-[#2ecc71]/20 rounded-lg mr-3">
                <LinkIcon className="w-5 h-5 text-[#2ecc71]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalStats.totalShares}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">Total Link Copies</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-[#9b59b6]/20 rounded-lg mr-3">
                <Download className="w-5 h-5 text-[#9b59b6]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalStats.totalDownloads}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">Total Downloads</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-[#f39c12]/20 rounded-lg mr-3">
                <BarChart3 className="w-5 h-5 text-[#f39c12]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalStats.todayShares}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">Today's Copies</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resumable uploads banner */}
      {pendingResumeSessions.length > 0 && !isUploading && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Interrupted uploads ({pendingResumeSessions.length})
            </h3>
          </div>
          <div className="space-y-2">
            {pendingResumeSessions.map((session) => (
              <div
                key={session.sessionId}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white/80 dark:bg-gray-800/50 rounded-lg"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {session.fileName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(session.uploadedBytes)} / {formatFileSize(session.fileSizeBytes)} •{" "}
                    {session.receivedChunks.length}/{session.totalChunks} chunks
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleResumeStoredSession(session)}
                    className="px-3 py-1.5 text-sm bg-[#3498db] text-white rounded-lg hover:opacity-90"
                  >
                    Resume
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDiscardStoredSession(session.sessionId)}
                    className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
                  >
                    Discard
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <input
        ref={resumeFileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Toolbar */}
      <div className="mb-6 p-4 bg-white/80 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search */}
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 
                rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                focus:ring-[#3498db] focus:border-transparent"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
  {searchResultCount} result{searchResultCount !== 1 ? "s" : ""} found
</p>

<div className="flex flex-wrap gap-2 mt-4">
  {["All", "Images", "PDFs", "Documents", "Videos", "Others"].map((type) => (
    <button
      key={type}
      type="button"
      onClick={() => setSelectedType(type)}
      className={`px-4 py-2 rounded-lg border transition-all ${
        selectedType === type
          ? "bg-[#3498db] text-white border-[#3498db]"
          : "bg-gray-800/50 text-gray-300 border-gray-700 hover:border-[#3498db]"
      }`}
    >
      {type}
    </button>
  ))}
</div>

            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {/* Upload Button */}
            <label className="relative cursor-pointer">
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <div className="px-4 py-2 bg-gradient-to-r from-[#3498db] to-[#2ecc71] 
              text-white font-medium rounded-lg hover:opacity-90 transition-opacity 
              flex items-center disabled:opacity-50">
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload Files"}
              </div>
            </label>

            {/* Filter */}
            {/* Filter */}
<div className="relative">
  <button
    onClick={() => setShowFilter((v) => !v)}
    className={`p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors ${
      activeFilter !== "all"
        ? "bg-[#3498db] text-white dark:text-white"
        : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
    }`}
    title="Filter by type"
  >
    <Filter className="w-5 h-5" />
  </button>

  {showFilter && (
    <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 overflow-hidden">
      {["all", "image", "application", "video", "other"].map((type) => (
        <button
          key={type}
          onClick={() => {
            setActiveFilter(type);
            setShowFilter(false);
          }}
          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
            activeFilter === type
              ? "bg-[#3498db]/10 text-[#3498db] font-medium"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </button>
      ))}
    </div>
  )}
     </div>

            {/* Download Selected */}
            {selectedFiles.length > 0 && (
              <button
                onClick={handleDownloadSelected}
                disabled={isDownloadingZip}
                className="p-2 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-lg flex items-center disabled:opacity-50"
              >
                {isDownloadingZip ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                <span className="hidden sm:inline ml-2">
                  {isDownloadingZip ? "Zipping..." : "Download Selected"}
                </span>
              </button>
            )}

            {/* Delete Selected */}
            {selectedFiles.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="p-2 bg-[#e74c3c] hover:bg-[#c0392b] text-white rounded-lg flex items-center"
              >
                <Trash2 className="w-5 h-5" />
                <span className="hidden sm:inline ml-2">Delete Selected</span>
              </button>
            )}
          </div>
        </div>

        {/* Upload Progress (Mobile) */}
        {isUploading && (
          <div className="mt-4 sm:hidden">
            <div className="text-sm text-gray-400 mb-1 flex justify-between items-center">
              <span>
                {uploadProgressDetail?.status === "paused" ? "Paused" : "Uploading..."}{" "}
                {uploadProgress.toFixed(0)}%
              </span>
              {uploadProgressDetail && (
                <span className="text-xs">
                  Chunk {uploadProgressDetail.currentChunk}/{uploadProgressDetail.totalChunks}
                </span>
              )}
            </div>
            <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#3498db] to-[#2ecc71]"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              ></motion.div>
            </div>
            <div className="flex gap-2 mt-2">
              {!isPaused ? (
                <button
                  type="button"
                  onClick={handlePauseUpload}
                  className="flex-1 py-1.5 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  <Pause className="w-4 h-4 inline mr-1" />
                  Pause
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResumeUpload}
                  className="flex-1 py-1.5 text-sm rounded-lg bg-[#3498db] text-white"
                >
                  <Play className="w-4 h-4 inline mr-1" />
                  Resume
                </button>
              )}
              <button
                type="button"
                onClick={handleCancelUpload}
                className="flex-1 py-1.5 text-sm rounded-lg bg-[#e74c3c] text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Files Grid/List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >{filteredFiles.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-400">
              No files found
            </h3>
            <p className="text-gray-500 mt-2">
              Try changing your search or filter.
            </p>
          </div>
        )}
          {filteredFiles.length > 0 && (
  viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredFiles.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`relative group rounded-xl overflow-hidden border ${
                    selectedFiles.includes(file.id)
                      ? "border-[#3498db] ring-2 ring-[#3498db]/20"
                      : "border-gray-700 hover:border-gray-600"
                  } bg-gray-800/30 transition-all duration-300 hover:scale-[1.02]`}
                >
                  {/* Selection Checkbox */}
                  <button
                    onClick={() => toggleFileSelection(file.id)}
                    className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center ${
                      selectedFiles.includes(file.id)
                        ? "bg-[#3498db] text-white"
                        : "bg-gray-900/80 text-gray-400 hover:text-white"
                    }`}
                  >
                    {selectedFiles.includes(file.id) && (
                      <CheckCircle className="w-4 h-4" />
                    )}
                  </button>

                  {/* Stats Badge */}
                  {(file.shareCount > 0 || file.downloadCount > 0) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFileStats(file.id);
                      }}
                      className="absolute top-2 right-2 z-10 p-1.5 bg-gray-900/80 rounded-full text-gray-300 hover:text-white hover:bg-gray-800"
                      title="View Stats"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                  )}

                  {/* Favorite Button - top-right, below stats badge */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleFavorite(file.id); }}
                    className={`absolute top-10 right-2 z-10 p-1.5 rounded-full transition-all duration-200 ${
                      file.isFavorite
                        ? "bg-yellow-400 text-white shadow-md"
                        : "bg-gray-900/70 text-gray-400 hover:text-yellow-400 hover:bg-gray-900/90"
                    }`}
                    aria-label={file.isFavorite ? "Remove from favorites" : "Add to favorites"}
                    title={file.isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Star className={`w-3.5 h-3.5 ${file.isFavorite ? "fill-white" : ""}`} />
                  </button>

                  {/* File Preview */}
                  <div
                    className="h-40 relative overflow-hidden cursor-pointer"
                    onClick={() =>
                      handleImagePreview(file.id, file.url, file.name)
                    }
                  >
                    {file.type === "image" ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{
                          backgroundColor: `${getFileTypeColor(file.type)}20`,
                        }}
                      >
                        <div style={{ color: getFileTypeColor(file.type) }}>
                          {getFileIcon(file.type)}
                        </div>
                      </div>
                    )}

                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (file.scanStatus !== "safe") {
                            toast.error(`Cannot download file. Status: ${file.scanStatus}`);
                            return;
                          }
                          handleDownload(file.id, file.url, file.name, file.scanStatus);
                        }}
                        className={`p-2 rounded-full text-white ${file.scanStatus === 'safe' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-500 cursor-not-allowed'}`}
                        title={file.scanStatus === 'safe' ? "Download" : "Scan in progress or failed"}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (file.scanStatus !== "safe") {
                            toast.error(`Cannot share file. Status: ${file.scanStatus}`);
                            return;
                          }
                          const f = files.find(fi => fi.id === file.id);
                          if (f) {
                            setSelectedFileForShare({ _id: f.id, fileName: f.name, fileUrl: f.url });
                            setShareModalOpen(true);
                          }
                        }}
                        className={`p-2 rounded-full text-white ${file.scanStatus === 'safe' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-500 cursor-not-allowed'}`}
                        title={file.scanStatus === 'safe' ? "Share" : "Scan in progress or failed"}
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file.id);
                        }}
                        className="p-2 bg-red-500/20 rounded-full text-red-400 hover:bg-red-500/30"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowVersions(file.id);
                        }}
                        className="p-2 bg-blue-500/20 rounded-full text-blue-400 hover:bg-blue-500/30"
                        title="Version History"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPasswordModal(file.id);
                          setPasswordValue("");
                        }}
                        className={`p-2 rounded-full ${
                          file.password
                            ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                            : "bg-gray-800 text-white hover:bg-gray-700"
                        }`}
                        title={file.password ? "Password Protected (Manage)" : "Set Password"}
                      >
                        {file.password ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* File Info */}
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center min-w-0 flex-1">
                        <div
                          className="p-1.5 rounded-lg mr-2 shrink-0"
                          style={{
                            backgroundColor: `${getFileTypeColor(file.type)}20`,
                          }}
                        >
                          <div style={{ color: getFileTypeColor(file.type) }}>
                            {getFileIcon(file.type)}
                          </div>
                        </div>
                        <h3 className="text-sm font-medium text-white truncate flex-1">
                          {file.name}
                        </h3>
                      </div>
                      {file.scanStatus && (
                        <span 
                          className={`text-[10px] px-1.5 py-0.5 rounded-full mr-1 shrink-0 ${
                            file.scanStatus === 'safe' ? 'bg-green-500/20 text-green-400' :
                            file.scanStatus === 'scanning' ? 'bg-blue-500/20 text-blue-400' :
                            file.scanStatus === 'uploaded' ? 'bg-gray-500/20 text-gray-400' :
                            'bg-red-500/20 text-red-400'
                          }`}
                          title={`Scan Status: ${file.scanStatus}`}
                        >
                          {file.scanStatus}
                        </span>
                      )}
                      {file.password && (
                        <span title="Password Protected">
                          <Lock className="w-3.5 h-3.5 text-yellow-400 shrink-0 ml-1" />
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                      <span>{file.size}</span>
                      <span>{file.uploaded}</span>
                    </div>

                    {/* Search Snippet (if searching) */}
                    {searchQuery.trim().length > 0 && file.matchType && (
                      <div className="mb-2 text-xs">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider mb-1 ${
                          file.matchType === 'content' ? 'bg-purple-500/20 text-purple-400' :
                          file.matchType === 'metadata' ? 'bg-green-500/20 text-green-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {file.matchType} match
                        </span>
                        {file.snippet && (
                          <p 
                            className="text-gray-300 italic line-clamp-2 leading-relaxed mt-1" 
                            dangerouslySetInnerHTML={{ __html: file.snippet }}
                          />
                        )}
                      </div>
                    )}

                    {/* Mini Stats */}
                    <div className="flex justify-between text-xs">
                      <div
                        className="flex items-center text-[#3498db]"
                        title="Link Copies"
                      >
                        <LinkIcon className="w-3 h-3 mr-1" />
                        {file.shareCount || 0}
                      </div>
                      <div
                        className="flex items-center text-[#2ecc71]"
                        title="Downloads"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        {file.downloadCount || 0}
                      </div>
                      <div
                        className="flex items-center text-[#f39c12]"
                        title="Views"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        {file.viewCount || 0}
                      </div>
                    </div>
                    {/* Checksum */}
                    {file.checksum && (
                      <div className="mt-2 pt-2 border-t border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 font-mono truncate w-24">
                            SHA256: {file.checksum.slice(0, 12)}...
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(file.checksum!);
                              toast.success("Checksum copied!");
                            }}
                            className="text-xs text-[#3498db] hover:text-[#2980b9] ml-1"
                            title={`Full hash: ${file.checksum}\n\nVerify on Linux/Mac:\nshasum -a 256 <filename>\n\nVerify on Windows:\ncertutil -hashfile <filename> SHA256`}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                     )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* List View - keeping existing list view code */
            <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-700 text-gray-400 text-sm font-medium">
                <div className="col-span-4">Name</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-1">Copies</div>
                <div className="col-span-1">Downloads</div>
                <div className="col-span-2">Uploaded</div>
                <div className="col-span-2">Actions</div>
              </div>

              <div className="divide-y divide-gray-700">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-800/50 transition-colors ${
                      selectedFiles.includes(file.id) ? "bg-[#3498db]/10" : ""
                    }`}
                  >
                    <div className="col-span-4 flex items-center">
                      <button
                        onClick={() => toggleFileSelection(file.id)}
                        className="mr-3"
                      >
                        {selectedFiles.includes(file.id) ? (
                          <CheckCircle className="w-5 h-5 text-[#3498db]" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-600 rounded" />
                        )}
                      </button>
                      <div className="flex items-center">
                        <div
                          className="p-2 rounded-lg mr-3"
                          style={{
                            backgroundColor: `${getFileTypeColor(file.type)}20`,
                          }}
                        >
                          <div style={{ color: getFileTypeColor(file.type) }}>
                            {getFileIcon(file.type)}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center">
                            <div className="text-white font-medium truncate max-w-[200px]">
                              {file.name}
                            </div>
                            {file.scanStatus && (
                              <span 
                                className={`text-[10px] px-1.5 py-0.5 rounded-full ml-2 shrink-0 ${
                                  file.scanStatus === 'safe' ? 'bg-green-500/20 text-green-400' :
                                  file.scanStatus === 'scanning' ? 'bg-blue-500/20 text-blue-400' :
                                  file.scanStatus === 'uploaded' ? 'bg-gray-500/20 text-gray-400' :
                                  'bg-red-500/20 text-red-400'
                                }`}
                                title={`Scan Status: ${file.scanStatus}`}
                              >
                                {file.scanStatus}
                              </span>
                            )}
                            {file.password && (
                              <span title="Password Protected">
                                <Lock className="w-3.5 h-3.5 text-yellow-400 shrink-0 ml-1.5" />
                              </span>
                            )}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {file.size}

                            {/* Search Snippet (if searching) */}
                            {searchQuery.trim().length > 0 && file.matchType && (
                              <div className="mt-1 flex items-center gap-2">
                                <span className={`inline-block px-1 py-0.5 rounded text-[9px] uppercase tracking-wider ${
                                  file.matchType === 'content' ? 'bg-purple-500/20 text-purple-400' :
                                  file.matchType === 'metadata' ? 'bg-green-500/20 text-green-400' :
                                  'bg-blue-500/20 text-blue-400'
                                }`}>
                                  {file.matchType} match
                                </span>
                                {file.snippet && (
                                  <span 
                                    className="text-gray-300 italic truncate max-w-[200px] inline-block align-bottom" 
                                    dangerouslySetInnerHTML={{ __html: file.snippet }}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: `${getFileTypeColor(file.type)}20`,
                          color: getFileTypeColor(file.type),
                        }}
                      >
                        {file.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="col-span-1 text-center">
                      <div className="text-white font-bold">
                        {file.shareCount || 0}
                      </div>
                      <div className="text-gray-400 text-xs">Copies</div>
                    </div>
                    <div className="col-span-1 text-center">
                      <div className="text-white font-bold">
                        {file.downloadCount || 0}
                      </div>
                      <div className="text-gray-400 text-xs">Downloads</div>
                    </div>
                    <div className="col-span-2 text-gray-400 text-sm">
                      {file.uploaded}
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            if (file.scanStatus !== "safe") {
                              toast.error(`Cannot download. Status: ${file.scanStatus}`);
                              return;
                            }
                            handleDownload(file.id, file.url, file.name, file.scanStatus);
                          }}
                          className="p-1.5 hover:bg-gray-700 rounded"
                          title="Download"
                        >
                          <Download className={`w-4 h-4 ${file.scanStatus === 'safe' ? 'text-gray-400 hover:text-white' : 'text-gray-600'}`} />
                        </button>
                        <button
                          onClick={() => {
                            if (file.scanStatus !== "safe") {
                              toast.error(`Cannot share. Status: ${file.scanStatus}`);
                              return;
                            }
                            setSelectedFileForShare({ _id: file.id, fileName: file.name, fileUrl: file.url });
                            setShareModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-gray-700 rounded"
                          title="Share"
                        >
                          <Share2 className={`w-4 h-4 ${file.scanStatus === 'safe' ? 'text-gray-400 hover:text-white' : 'text-gray-600'}`} />
                        </button>
                        <button
                          onClick={() => setShowFileStats(file.id)}
                          className="p-1.5 hover:bg-gray-700 rounded"
                          title="View Stats"
                        >
                          <BarChart3 className="w-4 h-4 text-gray-400 hover:text-white" />
                        </button>
                        <button
                          onClick={() => handleToggleFavorite(file.id)}
                          className="p-1.5 hover:bg-yellow-400/20 rounded"
                          title={file.isFavorite ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Star className={`w-4 h-4 ${file.isFavorite ? "text-yellow-400 fill-yellow-400" : "text-gray-400 hover:text-yellow-400"}`} />
                        </button>
                        <button
                          onClick={() => {
                            setShowPasswordModal(file.id);
                            setPasswordValue("");
                          }}
                          className="p-1.5 hover:bg-gray-700 rounded"
                          title={file.password ? "Password Protected (Manage)" : "Set Password"}
                        >
                          {file.password ? (
                            <Lock className="w-4 h-4 text-yellow-400" />
                          ) : (
                            <Unlock className="w-4 h-4 text-gray-400 hover:text-white" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(file.id)}
                          className="p-1.5 hover:bg-red-500/20 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
                        </button>
                        <button
                          onClick={() => handleShowVersions(file.id)}
                          className="p-1.5 hover:bg-blue-500/20 rounded"
                          title="Version History"
                        >
                          <History className="w-4 h-4 text-blue-400 hover:text-blue-300" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        
        </motion.div>
      </AnimatePresence>

      {/* Empty State */}
      {filteredFiles.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800/50 flex items-center justify-center">
            <Folder className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            No files found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchQuery
              ? "Try a different search term"
              : "Upload your first file to get started"}
          </p>
          <label className="inline-block">
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
            <div className="px-6 py-3 bg-gradient-to-r from-[#3498db] to-[#2ecc71] text-white font-medium rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
              <Upload className="w-4 h-4 inline mr-2" />
              Upload Files
            </div>
          </label>
        </div>
      )}

      {/* File Stats Modal - keeping existing modal code */}
      <AnimatePresence>
        {showFileStats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowFileStats(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  File Statistics
                </h3>
                <button
                  onClick={() => setShowFileStats(null)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {(() => {
                const file = files.find((f) => f.id === showFileStats);
                if (!file) return null;
                const stats = getFileStats(file.id);

                return (
                  <>
                    <div className="mb-6">
                      <div className="flex items-center mb-4">
                        <div
                          className="p-2 rounded-lg mr-3"
                          style={{
                            backgroundColor: `${getFileTypeColor(file.type)}20`,
                          }}
                        >
                          <div style={{ color: getFileTypeColor(file.type) }}>
                            {getFileIcon(file.type)}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-gray-900 dark:text-white font-medium truncate">
                            {file.name}
                          </h4>
                          <p className="text-gray-400 dark:text-gray-500 text-sm">
                            {file.size} • {file.uploaded}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-[#3498db] mb-1">
                            {stats?.totalShares || 0}
                          </div>
                          <div className="text-gray-400 dark:text-gray-500 text-sm">
                            Total Link Copies
                          </div>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-[#2ecc71] mb-1">
                            {stats?.totalDownloads || 0}
                          </div>
                          <div className="text-gray-400 dark:text-gray-500 text-sm">
                            Total Downloads
                          </div>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-[#f39c12] mb-1">
                            {stats?.todayShares || 0}
                          </div>
                          <div className="text-gray-400 dark:text-gray-500 text-sm">
                            Today's Copies
                          </div>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-[#9b59b6] mb-1">
                            {stats?.totalViews || 0}
                          </div>
                          <div className="text-gray-400 dark:text-gray-500 text-sm">
                            Total Views
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p className="mb-1">
                          Last accessed: {stats?.lastAccessed || "Never"}
                        </p>
                        <p>
                          Today: {stats?.todayShares || 0} copies,{" "}
                          {stats?.todayDownloads || 0} downloads
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          handleShare(file.id, file.url, file.name);
                          setShowFileStats(null);
                        }}
                        className="px-4 py-2 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-lg"
                      >
                        Copy Link
                      </button>
                      <button
                        onClick={() => setShowFileStats(null)}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg"
                      >
                        Close
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {activeImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4"
            onClick={() => setActiveImage(null)}
          >
            <button
              className="absolute top-4 right-4 p-2 bg-white/90 dark:bg-gray-800/50 rounded-full text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 z-10"
              onClick={() => setActiveImage(null)}
            >
              <X className="w-6 h-6" />
            </button>

            <img
              src={activeImage}
              alt="Preview"
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6 flex flex-wrap justify-center gap-3 bg-white/90 dark:bg-gray-800/80 backdrop-blur-xl p-4 rounded-xl border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  const fileId = files.find((f) => f.url === activeImage)?.id;
                  const fileName = files.find(
                    (f) => f.url === activeImage,
                  )?.name;
                  if (fileId && fileName) {
                    handleShare(fileId, activeImage, fileName);
                  }
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-gray-900 dark:text-whitebg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium flex items-center"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </button>
              <button
                onClick={() => {
                  const fileId = files.find((f) => f.url === activeImage)?.id;
                  const fileName = files.find(
                    (f) => f.url === activeImage,
                  )?.name;
                  if (fileId && fileName) {
                    handleDownload(fileId, activeImage, fileName);
                  }
                }}
                 className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-gray-900 dark:text-whitebg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Version History Modal */}
      <AnimatePresence>
        {showVersionHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowVersionHistory(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full border border-gray-200 dark:border-gray-700 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Version History
                </h3>
                <button
                  onClick={() => setShowVersionHistory(null)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {activeVersionDetails && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">Active Version (v{activeVersionDetails.version})</h4>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">Size: {activeVersionDetails.fileSize}</p>
                      <p className="text-sm text-gray-500">Uploaded: {new Date(activeVersionDetails.uploadedAt).toLocaleString()}</p>
                    </div>
                    <a href={activeVersionDetails.fileUrl} target="_blank" rel="noreferrer" className="px-3 py-1 bg-[#3498db] text-white text-sm rounded">View</a>
                  </div>
                </div>
              )}

              {fileVersions.length > 0 ? (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Previous Versions</h4>
                  <div className="space-y-3">
                    {fileVersions.map((v: any) => (
                      <div key={v.version} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Version {v.version}</p>
                          <p className="text-sm text-gray-500">Size: {v.fileSize} • Uploaded: {new Date(v.uploadedAt).toLocaleString()}</p>
                        </div>
                        <div className="flex space-x-2">
                          <a href={v.fileUrl} target="_blank" rel="noreferrer" className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-500">View</a>
                          <button
                            onClick={() => handleRestoreVersion(showVersionHistory, v.version)}
                            className="px-3 py-1 bg-[#f39c12] hover:bg-[#e67e22] text-white text-sm rounded"
                          >
                            Restore
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No previous versions available.</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Protection Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPasswordModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Password Protection
                  </h3>
                </div>
                <button
                  onClick={() => setShowPasswordModal(null)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {(() => {
                const file = files.find((f) => f.id === showPasswordModal);
                if (!file) return null;

                const hasPassword = !!file.password;

                return (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handlePasswordUpdate(file.id, passwordValue);
                    }}
                  >
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Secure <strong className="text-gray-900 dark:text-white">"{file.name}"</strong> with a password. Anyone with the share link will be required to enter this password to view or download the file.
                    </p>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {hasPassword ? "New Password (leave empty to keep current)" : "Password"}
                      </label>
                      <input
                        type="password"
                        placeholder="Enter secure password"
                        value={passwordValue}
                        onChange={(e) => setPasswordValue(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 
                        rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                        focus:ring-[#3498db] focus:border-transparent transition-all"
                        disabled={isPasswordModalLoading}
                        required={!hasPassword}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                      {hasPassword && (
                        <button
                          type="button"
                          onClick={() => handlePasswordUpdate(file.id, null)}
                          className="px-4 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl font-medium transition-all text-sm flex items-center justify-center"
                          disabled={isPasswordModalLoading}
                        >
                          Disable Protection
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPasswordModal(null)}
                        className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-all text-sm flex items-center justify-center"
                        disabled={isPasswordModalLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-gradient-to-r from-[#3498db] to-[#2ecc71] hover:opacity-90 text-white rounded-xl font-medium transition-all text-sm flex items-center justify-center shadow-lg shadow-blue-500/20"
                        disabled={isPasswordModalLoading}
                      >
                        {isPasswordModalLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : hasPassword ? (
                          "Change Password"
                        ) : (
                          "Enable Password"
                        )}
                      </button>
                    </div>
                  </form>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Share Link Modal */}
      {/* Share Modal */}
      {shareModalOpen && selectedFileForShare && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedFileForShare(null);
          }}
          file={selectedFileForShare}
        />
      )}
    </div>
  );
};


export default MyFiles;
