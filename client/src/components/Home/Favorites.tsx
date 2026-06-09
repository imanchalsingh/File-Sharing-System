import React, { useEffect, useState, useCallback } from "react";
import { analyticsApi, fileApi } from "../../services/api";
import {
  Download,
  Share2,
  Star,
  FileText,
  Image as ImageIcon,
  File,
  X,
  Link as LinkIcon,
  Eye,
  Search,
  Grid,
  List,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

interface TrackedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: string;
  uploaded: string;
  checksum?: string;
  isFavorite?: boolean;
  shareCount: number;
  downloadCount: number;
  viewCount: number;
  lastAccessed?: string;
  shareHistory: Array<{ timestamp: string; source?: string }>;
  downloadHistory: Array<{ timestamp: string }>;
  viewHistory: Array<{ timestamp: string }>;
}

const Favorites: React.FC = () => {
  const [favorites, setFavorites] = useState<TrackedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const mapFile = (file: any): TrackedFile => ({
    id: file._id,
    name: file.fileName,
    url: file.fileUrl,
    type: file.fileType || "application",
    size: file.fileSize || "0 KB",
    uploaded: new Date(file.createdAt).toLocaleDateString(),
    isFavorite: file.isFavorite,
    shareCount: file.shareCount || 0,
    downloadCount: file.downloadCount || 0,
    viewCount: file.viewCount || 0,
    shareHistory: file.shareHistory || [],
    downloadHistory: file.downloadHistory || [],
    viewHistory: file.viewHistory || [],
  });

  const loadFavorites = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await fileApi.getFavorites();
      if (data.files) {
        setFavorites(data.files.map(mapFile));
      }
    } catch (err) {
      console.error("Failed to load favorites:", err);
      toast.error("Failed to load favorites");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleUnfavorite = async (fileId: string) => {
    try {
      await fileApi.toggleFavorite(fileId);
      setFavorites((prev) => prev.filter((f) => f.id !== fileId));
      toast.success("Removed from favorites");
    } catch {
      toast.error("Failed to update favorite");
    }
  };

  const handleShare = async (fileId: string, fileUrl: string, fileName: string) => {
    await navigator.clipboard.writeText(fileUrl);
    try {
      await analyticsApi.trackAction("copy_link", {
        fileId,
        fileName,
        fileUrl,
        source: "direct_copy",
      });
    } catch {
      /* non-critical */
    }
    toast.success("Link copied to clipboard!");
  };

  const handleDownload = async (
    fileId: string,
    fileUrl: string,
    fileName: string,
  ) => {
    try {
      await analyticsApi.trackAction("download", { fileId, fileName, fileUrl });
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed. Please try again.");
    }
  };

  const getFileType = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "Images";
    if (ext === "pdf") return "PDFs";
    if (["doc", "docx", "txt", "rtf"].includes(ext)) return "Documents";
    if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "Videos";
    return "Others";
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case "image": return "#3498db";
      case "application": return "#2ecc71";
      case "video": return "#e74c3c";
      default: return "#9b59b6";
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image": return <ImageIcon className="w-6 h-6" />;
      case "application": return <FileText className="w-6 h-6" />;
      default: return <File className="w-6 h-6" />;
    }
  };

  // Filtered favorites
  const filtered = favorites.filter((file) => {
    const matchesSearch = file.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType =
      selectedType === "All" || getFileType(file.name) === selectedType;
    return matchesSearch && matchesType;
  });

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading favorites…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-yellow-400/20 rounded-xl">
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Favorites
              </h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 ml-1">
              {favorites.length} starred {favorites.length === 1 ? "file" : "files"} —
              quick access to what matters most
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh */}
            <button
              onClick={() => loadFavorites(true)}
              disabled={refreshing}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                         text-gray-600 dark:text-gray-300 transition-colors"
              title="Refresh favorites"
              aria-label="Refresh favorites"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
            </button>

            {/* View toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                className={`p-2 rounded transition-colors ${
                  viewMode === "grid"
                    ? "bg-yellow-400 text-white"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                aria-label="List view"
                className={`p-2 rounded transition-colors ${
                  viewMode === "list"
                    ? "bg-yellow-400 text-white"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Search & Filters ─────────────────────────────────────────── */}
        {favorites.length > 0 && (
          <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            {/* Search bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="favorites-search"
                type="text"
                placeholder="Search favorites…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-300
                           dark:border-gray-700 rounded-lg text-gray-900 dark:text-white
                           placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400
                           focus:border-transparent text-sm"
              />
            </div>

            {/* Type filter chips */}
            <div className="flex flex-wrap gap-2">
              {["All", "Images", "PDFs", "Documents", "Videos", "Others"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    selectedType === type
                      ? "bg-yellow-400 text-white border-yellow-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-yellow-400"
                  }`}
                >
                  {type}
                </button>
              ))}
              {searchQuery && (
                <span className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 self-center">
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""} found
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Empty State ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {favorites.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-24"
          >
            <div className="relative w-28 h-28 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-yellow-400/10 animate-pulse" />
              <div className="relative w-full h-full rounded-full bg-yellow-400/10 flex items-center justify-center">
                <Star className="w-14 h-14 text-yellow-400" />
              </div>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              No favorites yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Star files in <strong className="text-gray-700 dark:text-gray-200">My Files</strong> to
              pin them here for instant access.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── No search results ────────────────────────────────────────────── */}
      {favorites.length > 0 && filtered.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No favorites match your search. Try a different term.
          </p>
        </div>
      )}

      {/* ── Grid View ───────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {filtered.length > 0 && viewMode === "grid" && (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          >
            {filtered.map((file) => (
              <motion.div
                key={file.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700
                           hover:border-yellow-400/60 bg-white/80 dark:bg-gray-800/50
                           transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-yellow-400/10"
              >
                {/* Unfavorite Button */}
                <button
                  onClick={() => handleUnfavorite(file.id)}
                  className="absolute top-2 right-2 z-10 p-1.5 bg-yellow-400 hover:bg-red-500 rounded-full
                             transition-colors shadow-sm"
                  title="Remove from favorites"
                  aria-label={`Remove ${file.name} from favorites`}
                >
                  <Star className="w-3.5 h-3.5 text-white fill-white" />
                </button>

                {/* Preview */}
                <div
                  className="h-36 relative overflow-hidden cursor-pointer"
                  onClick={() =>
                    file.type === "image" && setActiveImage(file.url)
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
                        backgroundColor: `${getFileTypeColor(file.type)}18`,
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
                      className="p-2 bg-gray-800/90 rounded-full text-white hover:bg-gray-700"
                      title="Download"
                      aria-label={`Download ${file.name}`}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(file.id, file.url, file.name);
                      }}
                      className="p-2 bg-gray-800/90 rounded-full text-white hover:bg-gray-700"
                      title="Copy link"
                      aria-label={`Copy link for ${file.name}`}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* File Info */}
                <div className="p-3">
                  <h3
                    className="text-sm font-medium text-gray-900 dark:text-white truncate mb-1"
                    title={file.name}
                  >
                    {file.name}
                  </h3>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span>{file.size}</span>
                    <span>{file.uploaded}</span>
                  </div>
                  {/* Mini stats */}
                  <div className="flex justify-between text-xs">
                    <span
                      className="flex items-center text-[#3498db]"
                      title="Link Copies"
                    >
                      <LinkIcon className="w-3 h-3 mr-1" />
                      {file.shareCount}
                    </span>
                    <span
                      className="flex items-center text-[#2ecc71]"
                      title="Downloads"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      {file.downloadCount}
                    </span>
                    <span
                      className="flex items-center text-[#f39c12]"
                      title="Views"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      {file.viewCount}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── List View ─────────────────────────────────────────────────── */}
        {filtered.length > 0 && viewMode === "list" && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white/80 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* List header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <div className="col-span-5">Name</div>
              <div className="col-span-2 hidden sm:block">Type</div>
              <div className="col-span-1 text-center hidden md:block">
                <LinkIcon className="w-3 h-3 inline" />
              </div>
              <div className="col-span-1 text-center hidden md:block">
                <Download className="w-3 h-3 inline" />
              </div>
              <div className="col-span-1 text-center hidden md:block">
                <Eye className="w-3 h-3 inline" />
              </div>
              <div className="col-span-2 hidden sm:block">Date Added</div>
              <div className="col-span-2 sm:col-span-1 text-right">Actions</div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((file) => (
                <motion.div
                  key={file.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  {/* Name + icon */}
                  <div className="col-span-5 flex items-center gap-3 min-w-0">
                    <div
                      className="p-2 rounded-lg flex-shrink-0"
                      style={{
                        backgroundColor: `${getFileTypeColor(file.type)}18`,
                      }}
                    >
                      <div style={{ color: getFileTypeColor(file.type) }}>
                        {getFileIcon(file.type)}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div
                        className="text-sm font-medium text-gray-900 dark:text-white truncate"
                        title={file.name}
                      >
                        {file.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {file.size}
                      </div>
                    </div>
                  </div>

                  {/* Type badge */}
                  <div className="col-span-2 hidden sm:block">
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: `${getFileTypeColor(file.type)}18`,
                        color: getFileTypeColor(file.type),
                      }}
                    >
                      {file.type.toUpperCase()}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="col-span-1 hidden md:block text-center text-sm font-semibold text-[#3498db]">
                    {file.shareCount}
                  </div>
                  <div className="col-span-1 hidden md:block text-center text-sm font-semibold text-[#2ecc71]">
                    {file.downloadCount}
                  </div>
                  <div className="col-span-1 hidden md:block text-center text-sm font-semibold text-[#f39c12]">
                    {file.viewCount}
                  </div>

                  {/* Date */}
                  <div className="col-span-2 hidden sm:block text-xs text-gray-500 dark:text-gray-400">
                    {file.uploaded}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 sm:col-span-1 flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleDownload(file.id, file.url, file.name)}
                      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Download"
                      aria-label={`Download ${file.name}`}
                    >
                      <Download className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-[#2ecc71]" />
                    </button>
                    <button
                      onClick={() => handleShare(file.id, file.url, file.name)}
                      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Copy link"
                      aria-label={`Copy link for ${file.name}`}
                    >
                      <Share2 className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-[#3498db]" />
                    </button>
                    <button
                      onClick={() => handleUnfavorite(file.id)}
                      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Remove from favorites"
                      aria-label={`Remove ${file.name} from favorites`}
                    >
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 hover:text-red-400 hover:fill-red-400" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Image Preview Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {activeImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setActiveImage(null)}
          >
            <button
              className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
              onClick={() => setActiveImage(null)}
              aria-label="Close preview"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={activeImage}
              alt="Preview"
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Favorites;
