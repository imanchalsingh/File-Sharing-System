import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fileApi, analyticsApi } from "../../services/api";
import {
  File,
  FileText,
  Image as ImageIcon,
  Download,
  Lock,
  Unlock,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  Cloud,
  Sun,
  Moon,
} from "lucide-react";
import { motion } from "framer-motion";
import { notify as toast } from "@/services/toastService";

const SharePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // File detail states
  const [fileDetails, setFileDetails] = useState<any>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  
  // Loading & Error states
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null); // tracks current download file version/id
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // View tracking lock (ensure we only track view once per load/unlock)
  const viewTrackedRef = useRef(false);

  // Theme support
  const [theme, setTheme] = useState(
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    }
  };

  // 1. Fetch shared file metadata on load
  useEffect(() => {
    const fetchFileMetadata = async () => {
      if (!id) return;
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const response = await fileApi.getSharedFile(id);
        if (response.success && response.file) {
          const file = response.file;
          setFileDetails(file);
          
          if (!file.isPasswordProtected) {
            setIsUnlocked(true);
            setFileUrl(file.fileUrl);
            setVersions(file.versions || []);
            // Track view immediately if not password protected
            trackView(file._id, file.fileName, file.fileUrl);
          }
        } else {
          setErrorMsg("Failed to load shared file metadata.");
        }
      } catch (err: any) {
        console.error("Fetch shared file error:", err);
        setErrorMsg(err.response?.data?.error || "Shared file not found or link has expired.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFileMetadata();
  }, [id]);

  // 2. Track view action in analytics
  const trackView = async (fileId: string, fileName: string, url: string) => {
    if (viewTrackedRef.current) return;
    try {
      await analyticsApi.trackAction("view", {
        fileId,
        fileName,
        fileUrl: url,
        source: "shared_link"
      });
      viewTrackedRef.current = true;
      console.log("✅ Share view tracked successfully");
    } catch (err) {
      console.error("Failed to track shared view:", err);
    }
  };

  // 3. Verify password handler
  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !password) return;
    
    setIsVerifying(true);
    try {
      const response = await fileApi.verifySharedPassword(id, password);
      if (response.success) {
        setFileUrl(response.fileUrl);
        setVersions(response.versions || []);
        setIsUnlocked(true);
        toast.success("File unlocked successfully! 🔑");
        
        // Track view immediately upon successful password verification
        if (fileDetails) {
          trackView(fileDetails._id, fileDetails.fileName, response.fileUrl);
        }
      }
    } catch (err: any) {
      console.error("Password verification error:", err);
      toast.error(err.response?.data?.error || "Invalid password. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // 4. Download file handler
  const handleDownload = async (url: string, fileName: string, versionNum?: number) => {
    if (!id) return;
    const downloadKey = versionNum ? `v${versionNum}` : "current";
    setIsDownloading(downloadKey);
    
    try {
      // Track download in analytics
      await analyticsApi.trackAction("download", {
        fileId: id,
        fileName,
        fileUrl: url,
        source: "shared_link"
      });
      
      // Update share download count
      const fileIdClean = id;
      try {
        await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/files/shared/${fileIdClean}/download`, {
          method: "PUT"
        });
      } catch (countErr) {
        console.error("Failed to increment download count in DB:", countErr);
      }

      // Download file blob
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success("Download started!");
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Download failed. Please try again.");
    } finally {
      setIsDownloading(null);
    }
  };

  // Helper icons and styling
  const getFileTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "image": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "application": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "video": return "text-red-500 bg-red-500/10 border-red-500/20";
      default: return "text-purple-500 bg-purple-500/10 border-purple-500/20";
    }
  };

  const getFileIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "image": return <ImageIcon className="w-10 h-10" />;
      case "application": return <FileText className="w-10 h-10" />;
      default: return <File className="w-10 h-10" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300 flex flex-col justify-between">
      {/* Navbar */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
            <Cloud className="w-8 h-8 text-[#3498db]" />
            <span className="text-xl font-bold bg-gradient-to-r from-[#3498db] to-[#2ecc71] bg-clip-text text-transparent">
              SecureShare
            </span>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800/50 hover:bg-gray-300 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          
          {isLoading ? (
            /* LOADING STATE */
            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3498db] mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading secure sharing link details...</p>
            </div>
          ) : errorMsg ? (
            /* ERROR STATE */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-900 rounded-3xl border border-red-500/20 dark:border-red-950 shadow-xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Unable to access file</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                {errorMsg}
              </p>
              <button
                onClick={() => navigate("/")}
                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-medium rounded-xl transition-all text-sm w-full"
              >
                Go Back Home
              </button>
            </motion.div>
          ) : !isUnlocked ? (
            /* PASSWORD INPUT FOR LOCKED FILES */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl p-8"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Lock className="w-8 h-8 text-yellow-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Password Protected</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm max-w-sm mx-auto">
                  This shared file is protected. Please enter the password provided by the sender to verify access.
                </p>
              </div>

              <form onSubmit={handleVerifyPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Enter Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 
                    rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                    focus:ring-[#3498db] focus:border-transparent transition-all font-mono"
                    disabled={isVerifying}
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-3 px-6 bg-gradient-to-r from-[#3498db] to-[#2ecc71] hover:opacity-90 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2"
                >
                  {isVerifying ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>Verify & Unlock</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            /* UNLOCKED / PUBLIC FILE DISPLAY */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden"
            >
              {/* Card Header Banner */}
              <div className="p-6 bg-gradient-to-r from-[#3498db]/10 to-[#2ecc71]/10 border-b border-gray-100 dark:border-gray-800 flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  Shared File Unlocked & Secure
                </span>
              </div>

              {/* File details */}
              <div className="p-8">
                <div className="flex items-start space-x-4 mb-8">
                  <div className={`p-4 rounded-2xl border ${getFileTypeColor(fileDetails.fileType)} shrink-0`}>
                    {getFileIcon(fileDetails.fileType)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate" title={fileDetails.fileName}>
                      {fileDetails.fileName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {fileDetails.fileSize} • Version {fileDetails.currentVersion}
                    </p>
                  </div>
                </div>

                {/* Sender Details */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-100 dark:border-gray-800/50 mb-8 text-sm">
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="truncate">Shared by: {fileDetails.owner?.username || "SecureShare User"}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 justify-end">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{new Date(fileDetails.updatedAt || fileDetails.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Primary Download Button */}
                {fileUrl && (
                  <button
                    onClick={() => handleDownload(fileUrl, fileDetails.fileName)}
                    disabled={isDownloading !== null}
                    className="w-full py-4 px-6 bg-gradient-to-r from-[#3498db] to-[#2ecc71] hover:opacity-95 text-white font-semibold rounded-2xl transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center space-x-3 mb-6"
                  >
                    {isDownloading === "current" ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        <span>Download Active File</span>
                      </>
                    )}
                  </button>
                )}

                {/* Versions History Dropdown */}
                {versions && versions.length > 0 && (
                  <div className="mt-8 border-t border-gray-100 dark:border-gray-800 pt-6">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span>Previous Versions</span>
                      <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full">
                        {versions.length}
                      </span>
                    </h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {versions.map((v) => (
                        <div
                          key={v.version}
                          className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-850 rounded-xl border border-gray-100 dark:border-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              Version {v.version}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {v.fileSize || fileDetails.fileSize} • {new Date(v.uploadedAt).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDownload(v.fileUrl || fileUrl!, fileDetails.fileName, v.version)}
                            disabled={isDownloading !== null}
                            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-[#3498db] transition-colors"
                            title="Download version"
                          >
                            {isDownloading === `v${v.version}` ? (
                              <div className="animate-spin rounded-full h-4.5 w-4.5 border-b-2 border-[#3498db]"></div>
                            ) : (
                              <Download className="w-4.5 h-4.5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}

        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-gray-200 dark:border-gray-800 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Powered by SecureShare. End-to-end encrypted sharing platform.
        </p>
      </footer>
    </div>
  );
};

export default SharePage;
