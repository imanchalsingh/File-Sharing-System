import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

interface TrackedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: string;
  uploaded: string;
  shareCount: number;
  downloadCount: number;
  viewCount: number;
  lastAccessed?: string;
  shareHistory: Array<{ timestamp: string; source?: string }>;
  downloadHistory: Array<{ timestamp: string }>;
  viewHistory: Array<{ timestamp: string }>;
}

const MyFiles: React.FC = () => {
  const [files, setFiles] = useState<TrackedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showFileStats, setShowFileStats] = useState<string | null>(null);

  // fetch live url
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
  });

  // Load saved files on component mount
  useEffect(() => {
    const stored = localStorage.getItem("uploadedFiles");
    if (stored) {
      setFiles(JSON.parse(stored));
    }
  }, []);

  // Function to track link copy
  const trackLinkCopy = async (
    fileId: string,
    fileName: string,
    fileUrl: string,
  ) => {
    try {
      const timestamp = new Date().toISOString();

      // Update local state
      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === fileId
            ? {
                ...file,
                shareCount: (file.shareCount || 0) + 1,
                lastAccessed: timestamp,
                shareHistory: [
                  ...(file.shareHistory || []),
                  { timestamp, source: "direct_copy" },
                ],
              }
            : file,
        ),
      );

      // Save to localStorage
      const updatedFiles = files.map((file) =>
        file.id === fileId
          ? {
              ...file,
              shareCount: (file.shareCount || 0) + 1,
              lastAccessed: timestamp,
              shareHistory: [
                ...(file.shareHistory || []),
                { timestamp, source: "direct_copy" },
              ],
            }
          : file,
      );
      localStorage.setItem("uploadedFiles", JSON.stringify(updatedFiles));

      // Send to backend API (if available)
      try {
        await api.post("/api/track/share", {
          fileId,
          fileName,
          fileUrl,
          timestamp,
          action: "copy_link",
          source: "direct_copy",
          userAgent: navigator.userAgent,
        });
      } catch (apiError) {
        console.log("API not available, tracking locally", apiError);
      }
    } catch (error) {
      console.error("Failed to track share:", error);
    }
  };

  // Function to track download
  const trackDownload = async (
    fileId: string,
    fileName: string,
    fileUrl: string,
  ) => {
    try {
      const timestamp = new Date().toISOString();

      // Update local state
      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === fileId
            ? {
                ...file,
                downloadCount: (file.downloadCount || 0) + 1,
                lastAccessed: timestamp,
                downloadHistory: [
                  ...(file.downloadHistory || []),
                  { timestamp },
                ],
              }
            : file,
        ),
      );

      // Save to localStorage
      const updatedFiles = files.map((file) =>
        file.id === fileId
          ? {
              ...file,
              downloadCount: (file.downloadCount || 0) + 1,
              lastAccessed: timestamp,
              downloadHistory: [...(file.downloadHistory || []), { timestamp }],
            }
          : file,
      );
      localStorage.setItem("uploadedFiles", JSON.stringify(updatedFiles));

      // Send to backend API (if available)
      try {
        await api.post("/api/track/download", {
          fileId,
          fileName,
          fileUrl,
          timestamp,
          action: "download",
          userAgent: navigator.userAgent,
        });
      } catch (apiError) {
        console.log("API not available, tracking locally", apiError);
      }
    } catch (error) {
      console.error("Failed to track download:", error);
    }
  };

  // Function to track view
  const trackView = async (fileId: string, _fileName: string, _fileUrl: string) => {
    try {
      const timestamp = new Date().toISOString();

      // Update local state
      setFiles((prevFiles) => {
        const updated = prevFiles.map((file) =>
          file.id === fileId
            ? {
                ...file,
                viewCount: (file.viewCount || 0) + 1,
                viewHistory: [...(file.viewHistory || []), { timestamp }],
              }
            : file,
        );

        localStorage.setItem("uploadedFiles", JSON.stringify(updated));

        return updated;
      });

      // Save to localStorage
      const updatedFiles = files.map((file) =>
        file.id === fileId
          ? {
              ...file,
              viewCount: (file.viewCount || 0) + 1,
              viewHistory: [...(file.viewHistory || []), { timestamp }],
            }
          : file,
      );
      localStorage.setItem("uploadedFiles", JSON.stringify(updatedFiles));
    } catch (error) {
      console.error("Failed to track view:", error);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFilesList = Array.from(e.target.files);
    setIsUploading(true);
    setUploadProgress(0);

    const uploadedFiles: TrackedFile[] = [];

    for (const [index, file] of selectedFilesList.entries()) {
      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            const newProgress = prev + 100 / selectedFilesList.length / 10;
            return newProgress > (index + 1) * (100 / selectedFilesList.length)
              ? (index + 1) * (100 / selectedFilesList.length)
              : newProgress;
          });
        }, 100);

        // In real app, replace with actual upload API
        // const res = await axios.post("/upload", formData);
        const mockUrl = URL.createObjectURL(file); // Simulated URL

        clearInterval(progressInterval);

        const newFile: TrackedFile = {
          id: Date.now().toString() + index,
          name: file.name,
          url: mockUrl,
          type: file.type.split("/")[0],
          size: formatFileSize(file.size),
          uploaded: new Date().toLocaleDateString(),
          shareCount: 0,
          downloadCount: 0,
          viewCount: 0,
          shareHistory: [],
          downloadHistory: [],
          viewHistory: [],
        };

        uploadedFiles.push(newFile);
        setUploadProgress(((index + 1) / selectedFilesList.length) * 100);
      } catch (err) {
        console.error("Upload failed", err);
      }
    }

    setFiles((prev) => {
      const updated = [...uploadedFiles, ...prev];
      localStorage.setItem("uploadedFiles", JSON.stringify(updated));
      return updated;
    });

    setIsUploading(false);
    setUploadProgress(100);
    setTimeout(() => setUploadProgress(0), 1000);
  };

  // Delete file
  const handleDelete = (id: string) => {
    const updated = files.filter((file) => file.id !== id);
    setFiles(updated);
    setSelectedFiles((prev) => prev.filter((fileId) => fileId !== id));
    localStorage.setItem("uploadedFiles", JSON.stringify(updated));
  };

  // Delete selected files
  const handleDeleteSelected = () => {
    const updated = files.filter((file) => !selectedFiles.includes(file.id));
    setFiles(updated);
    setSelectedFiles([]);
    localStorage.setItem("uploadedFiles", JSON.stringify(updated));
  };

  // Toggle file selection
  const toggleFileSelection = (id: string) => {
    setSelectedFiles((prev) =>
      prev.includes(id)
        ? prev.filter((fileId) => fileId !== id)
        : [...prev, id],
    );
  };

  // Share file with tracking
  const handleShare = async (
    fileId: string,
    fileUrl: string,
    fileName: string,
  ) => {
    // Copy to clipboard
    await navigator.clipboard.writeText(fileUrl);

    // Track the copy
    await trackLinkCopy(fileId, fileName, fileUrl);

    // Show success message
    alert("Link copied to clipboard!");
  };

  // Download file with tracking
  const handleDownload = async (
    fileId: string,
    fileUrl: string,
    fileName: string,
  ) => {
    try {
      // Track download first
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
    }
  };

  // View image with tracking
  const handleImagePreview = (
    fileId: string,
    fileUrl: string,
    fileName: string,
  ) => {
    trackView(fileId, fileName, fileUrl);
    setActiveImage(fileUrl);
  };

  // Filter files based on search
  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Format file size
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Get file icon based on type
  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="w-5 h-5" />;
      case "application":
        return <FileText className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  // Get file type color
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

  // Get file stats
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

  // Get total stats for header
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

  return (
    <div className="px-4 sm:px-6">
      {/* Header with Stats */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Files</h1>
            <p className="text-gray-400">
              {files.length} files • {selectedFiles.length} selected
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded ${viewMode === "grid" ? "bg-gray-700 text-white" : "text-gray-400"}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded ${viewMode === "list" ? "bg-gray-700 text-white" : "text-gray-400"}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="hidden sm:block w-32">
                <div className="text-xs text-gray-400 mb-1">Uploading...</div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#3498db] to-[#2ecc71]"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  ></motion.div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-[#3498db]/20 rounded-lg mr-3">
                <Folder className="w-5 h-5 text-[#3498db]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {files.length}
                </div>
                <div className="text-gray-400 text-sm">Total Files</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-[#2ecc71]/20 rounded-lg mr-3">
                <LinkIcon className="w-5 h-5 text-[#2ecc71]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {totalStats.totalShares}
                </div>
                <div className="text-gray-400 text-sm">Total Link Copies</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-[#9b59b6]/20 rounded-lg mr-3">
                <Download className="w-5 h-5 text-[#9b59b6]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {totalStats.totalDownloads}
                </div>
                <div className="text-gray-400 text-sm">Total Downloads</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-[#f39c12]/20 rounded-lg mr-3">
                <BarChart3 className="w-5 h-5 text-[#f39c12]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {totalStats.todayShares}
                </div>
                <div className="text-gray-400 text-sm">Today's Copies</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search */}
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3498db] focus:border-transparent"
              />
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
              <div className="px-4 py-2 bg-gradient-to-r from-[#3498db] to-[#2ecc71] text-white font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center disabled:opacity-50">
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload Files"}
              </div>
            </label>

            {/* Filter */}
            <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 hover:text-white transition-colors">
              <Filter className="w-5 h-5" />
            </button>

            {/* Delete Selected */}
            {selectedFiles.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="p-2 bg-[#e74c3c] hover:bg-[#c0392b] text-white rounded-lg transition-colors flex items-center"
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
            <div className="text-sm text-gray-400 mb-1">
              Uploading... {uploadProgress.toFixed(0)}%
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#3498db] to-[#2ecc71]"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              ></motion.div>
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
        >
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredFiles.map((file) => {
                return (
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
                            handleDownload(file.id, file.url, file.name);
                          }}
                          className="p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(file.id, file.url, file.name);
                          }}
                          className="p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700"
                          title="Share"
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
                      </div>
                    </div>

                    {/* File Info */}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          <div
                            className="p-1.5 rounded-lg mr-2"
                            style={{
                              backgroundColor: `${getFileTypeColor(file.type)}20`,
                            }}
                          >
                            <div style={{ color: getFileTypeColor(file.type) }}>
                              {getFileIcon(file.type)}
                            </div>
                          </div>
                          <h3 className="text-sm font-medium text-white truncate">
                            {file.name}
                          </h3>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mb-2">
                        <span>{file.size}</span>
                        <span>{file.uploaded}</span>
                      </div>

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
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* List View */
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
                {filteredFiles.map((file) => {
                  return (
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
                            <div className="text-white font-medium truncate max-w-[200px]">
                              {file.name}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {file.size}
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
                            onClick={() =>
                              handleDownload(file.id, file.url, file.name)
                            }
                            className="p-1.5 hover:bg-gray-700 rounded"
                            title="Download"
                          >
                            <Download className="w-4 h-4 text-gray-400 hover:text-white" />
                          </button>
                          <button
                            onClick={() =>
                              handleShare(file.id, file.url, file.name)
                            }
                            className="p-1.5 hover:bg-gray-700 rounded"
                            title="Share"
                          >
                            <Share2 className="w-4 h-4 text-gray-400 hover:text-white" />
                          </button>
                          <button
                            onClick={() => setShowFileStats(file.id)}
                            className="p-1.5 hover:bg-gray-700 rounded"
                            title="View Stats"
                          >
                            <BarChart3 className="w-4 h-4 text-gray-400 hover:text-white" />
                          </button>
                          <button
                            onClick={() => handleDelete(file.id)}
                            className="p-1.5 hover:bg-red-500/20 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Empty State */}
      {filteredFiles.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800/50 flex items-center justify-center">
            <Folder className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">
            No files found
          </h3>
          <p className="text-gray-400 mb-6">
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

      {/* File Stats Modal */}
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
              className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  File Statistics
                </h3>
                <button
                  onClick={() => setShowFileStats(null)}
                  className="p-2 hover:bg-gray-700 rounded-lg"
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
                          <h4 className="text-white font-medium truncate">
                            {file.name}
                          </h4>
                          <p className="text-gray-400 text-sm">
                            {file.size} • {file.uploaded}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-700/50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-[#3498db] mb-1">
                            {stats?.totalShares || 0}
                          </div>
                          <div className="text-gray-400 text-sm">
                            Total Link Copies
                          </div>
                        </div>
                        <div className="bg-gray-700/50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-[#2ecc71] mb-1">
                            {stats?.totalDownloads || 0}
                          </div>
                          <div className="text-gray-400 text-sm">
                            Total Downloads
                          </div>
                        </div>
                        <div className="bg-gray-700/50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-[#f39c12] mb-1">
                            {stats?.todayShares || 0}
                          </div>
                          <div className="text-gray-400 text-sm">
                            Today's Copies
                          </div>
                        </div>
                        <div className="bg-gray-700/50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-[#9b59b6] mb-1">
                            {stats?.totalViews || 0}
                          </div>
                          <div className="text-gray-400 text-sm">
                            Total Views
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-gray-400">
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
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
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
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 p-2 bg-gray-800/50 rounded-full text-white hover:bg-gray-700 z-10"
              onClick={() => setActiveImage(null)}
            >
              <X className="w-6 h-6" />
            </button>

            {/* Image */}
            <img
              src={activeImage}
              alt="Preview"
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Share Options */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6 flex flex-wrap justify-center gap-3 bg-gray-800/80 backdrop-blur-xl p-4 rounded-xl border border-gray-700"
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
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium flex items-center"
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
                className="px-4 py-2 bg-[#3498db] hover:bg-[#2980b9] rounded-lg text-white font-medium flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyFiles;
