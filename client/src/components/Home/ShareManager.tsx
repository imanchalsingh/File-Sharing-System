import React, { useEffect, useState, useMemo, useCallback } from "react";
import { shareApi, fileApi } from "../../services/api";
import {
  Link,
  Copy,
  Clock,
  Trash2,
  Shield,
  ShieldOff,
  X,
  Check,
  Share2,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { notify as toast } from "@/services/toastService";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ShareLink {
  _id: string;
  token: string;
  fileId: string;
  url?: string;
  expiresAt: string | null;
  status: "active" | "expired" | "revoked";
  accessCount: number;
  maxAccessCount: number | null;
  createdAt: string;
  updatedAt: string;
}

interface SimpleFile {
  id: string;
  name: string;
}

type StatusFilter = "all" | "active" | "expiring" | "expired" | "revoked";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getTimeRemaining = (expiresAt: string) => {
  const now = new Date().getTime();
  const expiry = new Date(expiresAt).getTime();
  const diff = expiry - now;
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
};

const isExpiringSoon = (expiresAt: string | null): boolean => {
  if (!expiresAt) return false;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return diff > 0 && diff <= 24 * 60 * 60 * 1000;
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const truncateToken = (token: string) =>
  token.length > 12 ? `${token.slice(0, 6)}…${token.slice(-4)}` : token;

// ─── Component ───────────────────────────────────────────────────────────────

const ShareManager: React.FC = () => {
  // State
  const [files, setFiles] = useState<SimpleFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>("");
  const [shares, setShares] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShares, setSelectedShares] = useState<string[]>([]);
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [extendDate, setExtendDate] = useState("");
  const [fileDropdownOpen, setFileDropdownOpen] = useState(false);

// Pagination for the file dropdown
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const limit = 50;

// Global Keyboard Shortcuts
useKeyboardShortcuts({
  Escape: () => {
    setFileDropdownOpen(false);
    setExtendingId(null);
  },
});

  // ─── Data Loading ──────────────────────────────────────────────────────────

  useEffect(() => {
    const loadFiles = async () => {
      if (files.length === 0) setLoadingFiles(true);
      try {
        const data = await fileApi.getMyFiles(currentPage, limit);
        if (data.files) {
          const mapped = data.files.map((f: any) => ({
            id: f._id,
            name: f.fileName,
          }));
          setFiles(mapped);
        }
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
        } else {
          setTotalPages(1);
        }
      } catch (err) {
        console.error("Failed to load files:", err);
        toast.error("Failed to load files");
      } finally {
        setLoadingFiles(false);
      }
    };
    loadFiles();
  }, [currentPage]);

  const loadShares = useCallback(async (fileId: string) => {
    if (!fileId) return;
    setLoading(true);
    try {
      const data = await shareApi.getShareLinks(fileId);
      if (data.success) {
        setShares(data.shares || []);
      }
    } catch (err) {
      console.error("Failed to load shares:", err);
      toast.error("Failed to load share links");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFileId) {
      setSelectedShares([]);
      loadShares(selectedFileId);
    } else {
      setShares([]);
    }
  }, [selectedFileId, loadShares]);

  const handleRefresh = async () => {
    if (!selectedFileId) return;
    setRefreshing(true);
    await loadShares(selectedFileId);
    setRefreshing(false);
    toast.success("Share links refreshed");
  };

  // ─── Filtering ─────────────────────────────────────────────────────────────

  const getEffectiveStatus = useCallback(
    (share: ShareLink): "active" | "expiring" | "expired" | "revoked" => {
      if (share.status === "revoked") return "revoked";
      if (share.status === "expired") return "expired";
      if (
        share.expiresAt &&
        new Date(share.expiresAt).getTime() <= Date.now()
      ) {
        return "expired";
      }
      if (isExpiringSoon(share.expiresAt)) return "expiring";
      return "active";
    },
    []
  );

  const filteredShares = useMemo(() => {
    return shares.filter((share) => {
      const effective = getEffectiveStatus(share);
      const matchesFilter =
        statusFilter === "all" || effective === statusFilter;
      const matchesSearch =
        !searchQuery ||
        share.token.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [shares, statusFilter, searchQuery, getEffectiveStatus]);

  // ─── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    let active = 0;
    let expiring = 0;
    let expired = 0;
    shares.forEach((s) => {
      const eff = getEffectiveStatus(s);
      if (eff === "active") active++;
      else if (eff === "expiring") expiring++;
      else if (eff === "expired") expired++;
    });
    return { active, expiring, expired };
  }, [shares, getEffectiveStatus]);

  // ─── Selection ─────────────────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelectedShares((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedShares.length === filteredShares.length) {
      setSelectedShares([]);
    } else {
      setSelectedShares(filteredShares.map((s) => s._id));
    }
  };

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleCopyLink = async (share: ShareLink) => {
    const url = `${window.location.origin}/s/${share.token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleRevoke = async (shareId: string) => {
    try {
      await shareApi.revokeShareLink(shareId);
      setShares((prev) =>
        prev.map((s) =>
          s._id === shareId ? { ...s, status: "revoked" as const } : s
        )
      );
      toast.success("Share link revoked");
    } catch {
      toast.error("Failed to revoke share link");
    }
  };

  const handleDelete = async (shareId: string) => {
    try {
      await shareApi.deleteShareLink(shareId);
      setShares((prev) => prev.filter((s) => s._id !== shareId));
      setSelectedShares((prev) => prev.filter((id) => id !== shareId));
      toast.success("Share link deleted");
    } catch {
      toast.error("Failed to delete share link");
    }
  };

  const handleExtend = async (shareId: string) => {
    if (!extendDate) {
      toast.warning("Please select a new expiration date");
      return;
    }
    try {
      const data = await shareApi.extendShareLink(shareId, { expiresAt: extendDate });
      if (data.success) {
        setShares((prev) =>
          prev.map((s) =>
            s._id === shareId
              ? {
                  ...s,
                  expiresAt: extendDate,
                  status: "active" as const,
                }
              : s
          )
        );
        setExtendingId(null);
        setExtendDate("");
        toast.success("Share link extended");
      }
    } catch {
      toast.error("Failed to extend share link");
    }
  };

  const handleBulkRevoke = async () => {
    if (!selectedShares.length) return;
    const count = selectedShares.length;
    try {
      await Promise.all(
        selectedShares.map((id) => shareApi.revokeShareLink(id))
      );
      setShares((prev) =>
        prev.map((s) =>
          selectedShares.includes(s._id)
            ? { ...s, status: "revoked" as const }
            : s
        )
      );
      setSelectedShares([]);
      toast.success(`Revoked ${count} share link${count > 1 ? "s" : ""}`);
    } catch {
      toast.error("Failed to revoke some share links");
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedShares.length) return;
    const count = selectedShares.length;
    try {
      await Promise.all(
        selectedShares.map((id) => shareApi.deleteShareLink(id))
      );
      setShares((prev) =>
        prev.filter((s) => !selectedShares.includes(s._id))
      );
      setSelectedShares([]);
      toast.success(`Deleted ${count} share link${count > 1 ? "s" : ""}`);
    } catch {
      toast.error("Failed to delete some share links");
    }
  };

  // ─── Status Badge ──────────────────────────────────────────────────────────

  const StatusBadge: React.FC<{ share: ShareLink }> = ({ share }) => {
    const effective = getEffectiveStatus(share);
    const config = {
      active: {
        bg: "bg-[#2ecc71]/20",
        text: "text-[#2ecc71]",
        label: "Active",
      },
      expiring: {
        bg: "bg-[#f39c12]/20",
        text: "text-[#f39c12]",
        label: "Expiring Soon",
      },
      expired: {
        bg: "bg-[#e74c3c]/20",
        text: "text-[#e74c3c]",
        label: "Expired",
      },
      revoked: {
        bg: "bg-gray-500/20",
        text: "text-gray-400",
        label: "Revoked",
      },
    }[effective];

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  // ─── Filter Chips ──────────────────────────────────────────────────────────

  const filterChips: { key: StatusFilter; label: string; count?: number }[] = [
    { key: "all", label: "All", count: shares.length },
    { key: "active", label: "Active", count: stats.active },
    { key: "expiring", label: "Expiring Soon", count: stats.expiring },
    { key: "expired", label: "Expired", count: stats.expired },
    {
      key: "revoked",
      label: "Revoked",
      count: shares.filter((s) => s.status === "revoked").length,
    },
  ];

  // ─── Selected file name ────────────────────────────────────────────────────

  const selectedFileName =
    files.find((f) => f.id === selectedFileId)?.name || "";

  // ─── Loading State ─────────────────────────────────────────────────────────

  if (loadingFiles) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3498db] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your files...</p>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 sm:px-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Share Manager
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage all your share links in one place
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="share-manager-refresh-btn"
              onClick={handleRefresh}
              disabled={!selectedFileId || refreshing}
              className="p-2.5 bg-white/80 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh"
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* ── File Selector ────────────────────────────────────────────────── */}
        <div className="relative mb-6">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Select a file to manage its share links
          </label>
          <div className="relative">
            <button
              id="share-manager-file-selector"
              onClick={() => setFileDropdownOpen(!fileDropdownOpen)}
              className="w-full sm:w-96 flex items-center justify-between bg-white/80 dark:bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700 text-left hover:border-[#3498db]/50 transition-colors"
            >
              <span className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Share2 className="w-4 h-4 text-[#3498db]" />
                {selectedFileName || "Choose a file…"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  fileDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {fileDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-30 mt-2 w-full sm:w-96 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl max-h-64 overflow-y-auto"
                >
                  {files.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-400">
                      No files found
                    </div>
                  ) : (
                    files.map((file) => (
                      <button
                        key={file.id}
                        id={`share-manager-file-option-${file.id}`}
                        onClick={() => {
                          setSelectedFileId(file.id);
                          setFileDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-2 ${
                          selectedFileId === file.id
                            ? "text-[#3498db] font-medium"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {selectedFileId === file.id && (
                          <Check className="w-4 h-4 text-[#3498db]" />
                        )}
                        <span className="truncate">{file.name}</span>
                      </button>
                    ))
                  )}
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 sticky bottom-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.max(1, p - 1)); }}
                        disabled={currentPage === 1}
                        className="text-xs font-medium text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:text-[#3498db] dark:hover:text-[#3498db] transition-colors p-1"
                      >
                        Prev
                      </button>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Page {currentPage} of {totalPages}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                        disabled={currentPage === totalPages}
                        className="text-xs font-medium text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:text-[#3498db] dark:hover:text-[#3498db] transition-colors p-1"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Stats Cards ──────────────────────────────────────────────────── */}
        {selectedFileId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
          >
            <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-[#2ecc71]/20 rounded-lg mr-3">
                  <Shield className="w-5 h-5 text-[#2ecc71]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.active}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm">
                    Total Active
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-[#f39c12]/20 rounded-lg mr-3">
                  <Clock className="w-5 h-5 text-[#f39c12]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.expiring}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm">
                    Expiring Soon
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-[#e74c3c]/20 rounded-lg mr-3">
                  <AlertTriangle className="w-5 h-5 text-[#e74c3c]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.expired}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm">
                    Expired
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      {selectedFileId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {/* ── Toolbar: Search, Filter Chips, Bulk Actions ──────────────── */}
          <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-4">
            {/* Search + Bulk Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="share-manager-search"
                  type="text"
                  placeholder="Search by token…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3498db]/40"
                />
              </div>

              {selectedShares.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedShares.length} selected
                  </span>
                  <button
                    id="share-manager-bulk-revoke-btn"
                    onClick={handleBulkRevoke}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f39c12]/10 text-[#f39c12] rounded-lg text-sm font-medium hover:bg-[#f39c12]/20 transition-colors"
                  >
                    <ShieldOff className="w-3.5 h-3.5" />
                    Revoke Selected
                  </button>
                  <button
                    id="share-manager-bulk-delete-btn"
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e74c3c]/10 text-[#e74c3c] rounded-lg text-sm font-medium hover:bg-[#e74c3c]/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Selected
                  </button>
                </div>
              )}
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2">
              {filterChips.map((chip) => (
                <button
                  key={chip.key}
                  id={`share-manager-filter-${chip.key}`}
                  onClick={() => setStatusFilter(chip.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    statusFilter === chip.key
                      ? "bg-gradient-to-r from-[#3498db] to-[#2ecc71] text-white shadow-md"
                      : "bg-gray-100 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50"
                  }`}
                >
                  {chip.label}
                  {chip.count !== undefined && (
                    <span className="ml-1.5 opacity-75">({chip.count})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Loading ──────────────────────────────────────────────────── */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3498db] mx-auto mb-3"></div>
                <p className="text-gray-400 text-sm">
                  Loading share links…
                </p>
              </div>
            </div>
          )}

          {/* ── Empty State ──────────────────────────────────────────────── */}
          {!loading && filteredShares.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-full mb-4">
                <Link className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                No share links found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center max-w-sm">
                {shares.length === 0
                  ? "This file has no share links yet. Create one from the file's share menu."
                  : "No share links match the current filter."}
              </p>
            </motion.div>
          )}

          {/* ── Share Links Table ─────────────────────────────────────────── */}
          {!loading && filteredShares.length > 0 && (
            <div className="space-y-3">
              {/* Table Header (desktop only) */}
              <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="col-span-1 flex items-center">
                  <input
                    id="share-manager-select-all"
                    type="checkbox"
                    checked={
                      selectedShares.length === filteredShares.length &&
                      filteredShares.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-[#3498db]"
                  />
                </div>
                <div className="col-span-2">Token</div>
                <div className="col-span-2">Created</div>
                <div className="col-span-2">Expires</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1">Access</div>
                <div className="col-span-3 text-right">Actions</div>
              </div>

              {/* Share Link Cards */}
              <AnimatePresence mode="popLayout">
                {filteredShares.map((share) => {
                  const effective = getEffectiveStatus(share);
                  return (
                    <motion.div
                      key={share._id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white/80 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-[#3498db]/30 transition-colors"
                    >
                      <div className="p-4">
                        {/* Desktop Layout */}
                        <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
                          {/* Checkbox */}
                          <div className="col-span-1">
                            <input
                              id={`share-manager-select-${share._id}`}
                              type="checkbox"
                              checked={selectedShares.includes(share._id)}
                              onChange={() => toggleSelect(share._id)}
                              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-[#3498db]"
                            />
                          </div>

                          {/* Token */}
                          <div className="col-span-2 flex items-center gap-2">
                            <code className="text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900/50 px-2 py-1 rounded font-mono">
                              {truncateToken(share.token)}
                            </code>
                          </div>

                          {/* Created */}
                          <div className="col-span-2 text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(share.createdAt)}
                          </div>

                          {/* Expires */}
                          <div className="col-span-2">
                            {share.expiresAt ? (
                              <div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatDate(share.expiresAt)}
                                </div>
                                {effective !== "expired" &&
                                  effective !== "revoked" && (
                                    <div
                                      className={`text-xs mt-0.5 ${
                                        effective === "expiring"
                                          ? "text-[#f39c12]"
                                          : "text-gray-400"
                                      }`}
                                    >
                                      {getTimeRemaining(share.expiresAt)}
                                    </div>
                                  )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 italic">
                                Never
                              </span>
                            )}
                          </div>

                          {/* Status */}
                          <div className="col-span-1">
                            <StatusBadge share={share} />
                          </div>

                          {/* Access Count */}
                          <div className="col-span-1 text-sm text-gray-600 dark:text-gray-400">
                            {share.accessCount}
                            {share.maxAccessCount
                              ? ` / ${share.maxAccessCount}`
                              : ""}
                          </div>

                          {/* Actions */}
                          <div className="col-span-3 flex items-center justify-end gap-1.5">
                            <button
                              id={`share-manager-copy-${share._id}`}
                              onClick={() => handleCopyLink(share)}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:text-[#3498db] transition-colors"
                              title="Copy Link"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            <button
                              id={`share-manager-open-${share._id}`}
                              onClick={() =>
                                window.open(
                                  `${window.location.origin}/s/${share.token}`,
                                  "_blank"
                                )
                              }
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:text-[#2ecc71] transition-colors"
                              title="Open Link"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>

                            {effective !== "revoked" && (
                              <>
                                <button
                                  id={`share-manager-extend-${share._id}`}
                                  onClick={() => {
                                    setExtendingId(
                                      extendingId === share._id
                                        ? null
                                        : share._id
                                    );
                                    setExtendDate("");
                                  }}
                                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:text-[#9b59b6] transition-colors"
                                  title="Extend"
                                >
                                  <Clock className="w-4 h-4" />
                                </button>

                                <button
                                  id={`share-manager-revoke-${share._id}`}
                                  onClick={() => handleRevoke(share._id)}
                                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:text-[#f39c12] transition-colors"
                                  title="Revoke"
                                >
                                  <ShieldOff className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            <button
                              id={`share-manager-delete-${share._id}`}
                              onClick={() => handleDelete(share._id)}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:text-[#e74c3c] transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Mobile Layout */}
                        <div className="lg:hidden space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                id={`share-manager-select-mobile-${share._id}`}
                                type="checkbox"
                                checked={selectedShares.includes(share._id)}
                                onChange={() => toggleSelect(share._id)}
                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-[#3498db] mt-0.5"
                              />
                              <div>
                                <code className="text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900/50 px-2 py-1 rounded font-mono">
                                  {truncateToken(share.token)}
                                </code>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <StatusBadge share={share} />
                                  <span className="text-xs text-gray-400">
                                    {share.accessCount}
                                    {share.maxAccessCount
                                      ? ` / ${share.maxAccessCount}`
                                      : ""}{" "}
                                    views
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <div>
                              <span className="block text-gray-400 mb-0.5">
                                Created
                              </span>
                              {formatDate(share.createdAt)}
                            </div>
                            <div>
                              <span className="block text-gray-400 mb-0.5">
                                Expires
                              </span>
                              {share.expiresAt
                                ? formatDate(share.expiresAt)
                                : "Never"}
                              {share.expiresAt &&
                                effective !== "expired" &&
                                effective !== "revoked" && (
                                  <span
                                    className={`block mt-0.5 ${
                                      effective === "expiring"
                                        ? "text-[#f39c12]"
                                        : ""
                                    }`}
                                  >
                                    {getTimeRemaining(share.expiresAt)}
                                  </span>
                                )}
                            </div>
                          </div>

                          {/* Mobile Actions */}
                          <div className="flex items-center gap-1 pt-1 border-t border-gray-100 dark:border-gray-700/50">
                            <button
                              id={`share-manager-copy-mobile-${share._id}`}
                              onClick={() => handleCopyLink(share)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-[#3498db] transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Copy
                            </button>

                            {effective !== "revoked" && (
                              <>
                                <button
                                  id={`share-manager-extend-mobile-${share._id}`}
                                  onClick={() => {
                                    setExtendingId(
                                      extendingId === share._id
                                        ? null
                                        : share._id
                                    );
                                    setExtendDate("");
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-[#9b59b6] transition-colors"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  Extend
                                </button>

                                <button
                                  id={`share-manager-revoke-mobile-${share._id}`}
                                  onClick={() => handleRevoke(share._id)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-[#f39c12] transition-colors"
                                >
                                  <ShieldOff className="w-3.5 h-3.5" />
                                  Revoke
                                </button>
                              </>
                            )}

                            <button
                              id={`share-manager-delete-mobile-${share._id}`}
                              onClick={() => handleDelete(share._id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-[#e74c3c] transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* ── Extend Inline Date Picker ─────────────────── */}
                        <AnimatePresence>
                          {extendingId === share._id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                                <Clock className="w-4 h-4 text-[#9b59b6] shrink-0" />
                                <span className="text-sm text-gray-600 dark:text-gray-400 shrink-0">
                                  New expiry:
                                </span>
                                <input
                                  id={`share-manager-extend-date-${share._id}`}
                                  type="datetime-local"
                                  value={extendDate}
                                  onChange={(e) =>
                                    setExtendDate(e.target.value)
                                  }
                                  min={new Date().toISOString().slice(0, 16)}
                                  className="flex-1 max-w-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9b59b6]/40"
                                />
                                <button
                                  id={`share-manager-extend-confirm-${share._id}`}
                                  onClick={() => handleExtend(share._id)}
                                  className="p-2 bg-gradient-to-r from-[#3498db] to-[#2ecc71] rounded-lg text-white hover:shadow-lg transition-shadow"
                                  title="Confirm"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  id={`share-manager-extend-cancel-${share._id}`}
                                  onClick={() => {
                                    setExtendingId(null);
                                    setExtendDate("");
                                  }}
                                  className="p-2 bg-gray-100 dark:bg-gray-900/50 rounded-lg text-gray-500 hover:text-[#e74c3c] transition-colors"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Prompt when no file selected ───────────────────────────────────── */}
      {!selectedFileId && !loadingFiles && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-24"
        >
          <div className="p-5 bg-gradient-to-br from-[#3498db]/10 to-[#2ecc71]/10 rounded-full mb-5">
            <Share2 className="w-12 h-12 text-[#3498db]" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Select a file to get started
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center max-w-md">
            Choose a file from the dropdown above to view and manage all its
            share links, including active, expiring, and expired links.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default ShareManager;
