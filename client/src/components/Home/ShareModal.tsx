import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
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
  Lock,
} from "lucide-react";
import { shareApi } from "../../services/api";

// ── Types ──────────────────────────────────────────────────────────────────

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: { _id: string; fileName: string; fileUrl: string };
}

interface ShareLink {
  _id: string;
  token: string;
  slug?: string;
  expiresAt: string | null;
  maxAccessCount: number | null;
  accessCount: number;
  status: string;
  createdAt: string;
}

type PresetKey = "1h" | "24h" | "7d" | "30d" | "none" | "custom";

// ── Helpers ────────────────────────────────────────────────────────────────

const EXPIRATION_PRESETS: { key: PresetKey; label: string; icon: string }[] = [
  { key: "1h", label: "1 Hour", icon: "⏱" },
  { key: "24h", label: "24 Hours", icon: "🕐" },
  { key: "7d", label: "7 Days", icon: "📅" },
  { key: "30d", label: "30 Days", icon: "🗓" },
  { key: "none", label: "No Expiry", icon: "♾️" },
  { key: "custom", label: "Custom", icon: "✏️" },
];

function getExpirationDate(preset: PresetKey): string | null {
  const now = new Date();
  switch (preset) {
    case "1h":
      return new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString();
    case "24h":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    case "7d":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    case "30d":
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    case "none":
      return null;
    default:
      return null;
  }
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never expires";
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) return "Expired";

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h left`;
  if (hours > 0) return `${hours}h ${minutes % 60}m left`;
  if (minutes > 0) return `${minutes}m left`;
  return `${seconds}s left`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "No expiry";
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusInfo(share: ShareLink): {
  label: string;
  color: string;
  bg: string;
  border: string;
} {
  if (share.status === "revoked") {
    return {
      label: "Revoked",
      color: "text-gray-400",
      bg: "bg-gray-500/20",
      border: "border-gray-500/30",
    };
  }
  if (share.expiresAt) {
    const diff = new Date(share.expiresAt).getTime() - Date.now();
    if (diff <= 0) {
      return {
        label: "Expired",
        color: "text-red-400",
        bg: "bg-red-500/20",
        border: "border-red-500/30",
      };
    }
    if (diff < 24 * 60 * 60 * 1000) {
      return {
        label: "Expiring Soon",
        color: "text-yellow-400",
        bg: "bg-yellow-500/20",
        border: "border-yellow-500/30",
      };
    }
  }
  return {
    label: "Active",
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
    border: "border-emerald-500/30",
  };
}

function toLocalDateTimeValue(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

// ── Component ──────────────────────────────────────────────────────────────

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, file }) => {
  // ── State ──
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>("24h");
  const [customDate, setCustomDate] = useState(
    toLocalDateTimeValue(new Date(Date.now() + 24 * 60 * 60 * 1000))
  );
  const [maxAccess, setMaxAccess] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [existingShares, setExistingShares] = useState<ShareLink[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ── Fetch existing shares ──
  const fetchShares = useCallback(async () => {
    if (!file?._id) return;
    setIsLoading(true);
    try {
      const data = await shareApi.getShareLinks(file._id);
      setExistingShares(data.shares || []);
    } catch {
      // Silently fail – existing shares are supplementary
    } finally {
      setIsLoading(false);
    }
  }, [file?._id]);

  useEffect(() => {
    if (isOpen) {
      fetchShares();
      setCreatedLink(null);
      setCopied(null);
      setSlug("");
      setMaxAccess("");
      setPassword("");
    }
  }, [isOpen, fetchShares]);

  // ── Handlers ──
  const handleCreate = async () => {
    setIsCreating(true);
    try {
      let expiresAt: string | null = null;
      if (selectedPreset === "custom") {
        expiresAt = new Date(customDate).toISOString();
      } else {
        expiresAt = getExpirationDate(selectedPreset);
      }

      const data = await shareApi.createShareLink({
        fileId: file._id,
        expiresAt,
        maxAccessCount: maxAccess ? parseInt(maxAccess, 10) : null,
        slug: slug.trim() || undefined,
        password: password || undefined,
      });

      const token = data.share?.slug || data.share?.token || data.token;
      const link = `${window.location.origin}/s/${token}`;
      setCreatedLink(link);
      toast.success("Share link created successfully!");
      fetchShares();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create share link");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleRevoke = async (shareId: string) => {
    try {
      await shareApi.revokeShareLink(shareId);
      toast.success("Share link revoked");
      fetchShares();
    } catch {
      toast.error("Failed to revoke share link");
    }
  };

  const handleDelete = async (shareId: string) => {
    try {
      await shareApi.deleteShareLink(shareId);
      toast.success("Share link deleted");
      fetchShares();
    } catch {
      toast.error("Failed to delete share link");
    }
  };

  const handleEditSlug = async (shareId: string, currentSlug: string | undefined) => {
    const newSlug = window.prompt(
      "Enter new custom URL (letters, numbers, hyphens only).\nLeave blank to remove the custom URL and revert to token.",
      currentSlug || ""
    );
    if (newSlug === null) return; // Cancelled
    
    const sanitizedSlug = newSlug.toLowerCase().replace(/[^a-z0-9-]/g, "");

    try {
      await shareApi.updateShareLink(shareId, { slug: sanitizedSlug });
      toast.success("Custom link updated successfully");
      fetchShares();
      // Update createdLink if we were editing it
      if (createdLink && createdLink.includes(shareId)) { // Rough check, since we don't map createdLink to shareId easily
         // To be safe, just clear it or let it be
         setCreatedLink(null);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update custom link");
    }
  };

  // ── Render ──
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="share-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            id="share-modal-content"
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-2xl"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#3498db]/20 to-[#2ecc71]/20">
                  <Share2 className="w-5 h-5 text-[#3498db]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Share File
                  </h2>
                  <p
                    className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[280px]"
                    title={file.fileName}
                  >
                    {file.fileName}
                  </p>
                </div>
              </div>
              <button
                id="share-modal-close"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* ── Expiration Presets ── */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <Clock className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  Link Expiration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {EXPIRATION_PRESETS.map((preset) => (
                    <button
                      key={preset.key}
                      id={`share-preset-${preset.key}`}
                      onClick={() => setSelectedPreset(preset.key)}
                      className={`relative px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                        selectedPreset === preset.key
                          ? "border-[#3498db] bg-[#3498db]/10 text-[#3498db] shadow-[0_0_0_1px_rgba(52,152,219,0.3)]"
                          : "border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <span className="mr-1">{preset.icon}</span>
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Custom date-time input */}
                <AnimatePresence>
                  {selectedPreset === "custom" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <input
                        id="share-custom-date"
                        type="datetime-local"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        min={toLocalDateTimeValue(new Date())}
                        className="mt-3 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm focus:border-[#3498db] focus:ring-1 focus:ring-[#3498db]/30 outline-none transition-all"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Custom Link Slug ── */}
              <div>
                <label
                  htmlFor="share-custom-slug"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                >
                  <Link className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  Custom Link <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-gray-500 dark:text-gray-400 text-sm font-mono select-none">
                    /s/
                  </span>
                  <input
                    id="share-custom-slug"
                    type="text"
                    placeholder="my-project"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    maxLength={32}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:border-[#3498db] focus:ring-1 focus:ring-[#3498db]/30 outline-none transition-all font-mono"
                  />
                </div>
                {slug && slug.length < 3 && (
                  <p className="mt-1 text-xs text-yellow-500">Must be at least 3 characters long.</p>
                )}
              </div>

              {/* ── Max Access Count ── */}
              <div>
                <label
                  htmlFor="share-max-access"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                >
                  <Shield className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  Max Access Count{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  id="share-max-access"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={maxAccess}
                  onChange={(e) => setMaxAccess(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:border-[#3498db] focus:ring-1 focus:ring-[#3498db]/30 outline-none transition-all"
                />
              </div>

              {/* ── Password Protection ── */}
              <div>
                <label
                  htmlFor="share-password"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                >
                  <Lock className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  Password Protection{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  id="share-password"
                  type="password"
                  placeholder="Enter a secure password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:border-[#3498db] focus:ring-1 focus:ring-[#3498db]/30 outline-none transition-all"
                />
              </div>

              {/* ── Create Button ── */}
              <button
                id="share-create-btn"
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#3498db] to-[#2ecc71] hover:shadow-lg hover:shadow-[#3498db]/25 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Link className="w-4 h-4" />
                    Create Share Link
                  </>
                )}
              </button>

              {/* ── Created Link ── */}
              <AnimatePresence>
                {createdLink && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                      <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                        ✨ Link Created
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          id="share-created-link"
                          type="text"
                          readOnly
                          value={createdLink}
                          className="flex-1 px-3 py-2 rounded-lg bg-gray-900/50 dark:bg-gray-900/80 border border-gray-700 text-sm text-gray-200 font-mono truncate outline-none"
                        />
                        <button
                          id="share-copy-created"
                          onClick={() => handleCopy(createdLink, "created")}
                          className="p-2.5 rounded-lg bg-gradient-to-r from-[#3498db] to-[#2ecc71] text-white hover:shadow-md transition-all shrink-0"
                        >
                          {copied === "created" ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Existing Share Links ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <Link className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    Active Share Links
                  </h3>
                  {existingShares.length > 0 && (
                    <span className="text-xs text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                      {existingShares.length}
                    </span>
                  )}
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-[#3498db]/30 border-t-[#3498db] rounded-full animate-spin" />
                  </div>
                ) : existingShares.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    <Link className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No share links yet
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {existingShares.map((share) => {
                      const status = getStatusInfo(share);
                      const identifier = share.slug || share.token;
                      const shareUrl = `${window.location.origin}/s/${identifier}`;
                      return (
                        <motion.div
                          key={share._id}
                          id={`share-link-${share._id}`}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                        >
                          {/* Top row: token + status badge */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <code className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/60 px-2 py-0.5 rounded" title={identifier}>
                                {identifier.length > 15 ? `${identifier.slice(0, 15)}…` : identifier}
                              </code>
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${status.bg} ${status.color} ${status.border}`}
                              >
                                {status.label}
                              </span>
                            </div>
                            <span className="text-[11px] text-gray-400">
                              {share.accessCount}
                              {share.maxAccessCount
                                ? `/${share.maxAccessCount}`
                                : ""}{" "}
                              views
                            </span>
                          </div>

                          {/* Expiry & relative time */}
                          <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(share.expiresAt)}</span>
                            <span className="text-gray-400">•</span>
                            <span
                              className={
                                status.label === "Expiring Soon"
                                  ? "text-yellow-400 font-medium"
                                  : ""
                              }
                            >
                              {formatRelativeTime(share.expiresAt)}
                            </span>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-1.5">
                            <button
                              id={`share-copy-${share._id}`}
                              onClick={() => handleCopy(shareUrl, share._id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#3498db]/10 text-[#3498db] hover:bg-[#3498db]/20 transition-colors"
                              title="Copy link"
                            >
                              {copied === share._id ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              Copy
                            </button>

                            {share.status !== "revoked" &&
                              !(
                                share.expiresAt &&
                                new Date(share.expiresAt).getTime() < Date.now()
                              ) && (
                                <button
                                  id={`share-edit-${share._id}`}
                                  onClick={() => handleEditSlug(share._id, share.slug)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                  title="Edit custom link"
                                >
                                  <Link className="w-3 h-3" />
                                  Edit
                                </button>
                              )}

                            {share.status !== "revoked" &&
                              !(
                                share.expiresAt &&
                                new Date(share.expiresAt).getTime() < Date.now()
                              ) && (
                                <button
                                  id={`share-revoke-${share._id}`}
                                  onClick={() => handleRevoke(share._id)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#f39c12]/10 text-[#f39c12] hover:bg-[#f39c12]/20 transition-colors"
                                  title="Revoke link"
                                >
                                  <ShieldOff className="w-3 h-3" />
                                  Revoke
                                </button>
                              )}

                            <button
                              id={`share-delete-${share._id}`}
                              onClick={() => handleDelete(share._id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#e74c3c]/10 text-[#e74c3c] hover:bg-[#e74c3c]/20 transition-colors ml-auto"
                              title="Delete link"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareModal;
