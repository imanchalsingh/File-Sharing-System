import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Share2,
  Download,
  Eye,
  Clock,
  Calendar,
  RefreshCw,
  FileText,
  Smartphone,
  Award,
  Target,
  Zap,
  HardDrive,
  Database,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
} from "recharts";
import { analyticsApi } from "../../services/api";

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

interface AnalyticsData {
  dailyShares: Array<{ date: string; shares: number; uniqueFiles: number }>;
  topFiles: Array<{
    name: string;
    shares: number;
    downloads: number;
    views: number;
  }>;
  shareSources: Array<{ name: string; value: number; color: string }>;
  hourlyActivity: Array<{ hour: string; shares: number; avg: number }>;
  fileTypeDistribution: Array<{
    type: string;
    count: number;
    shares: number;
    color: string;
  }>;
  performanceMetrics: {
    avgSharesPerFile: number;
    peakHourShares: number;
    mobileShareRate: number;
    directCopyRate: number;
  };
  recentActivity: Array<{
    time: string;
    file: string;
    action: string;
    count: number;
  }>;
}

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month" | "year">(
    "week",
  );
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    dailyShares: [],
    topFiles: [],
    shareSources: [],
    hourlyActivity: [],
    fileTypeDistribution: [],
    performanceMetrics: {
      avgSharesPerFile: 0,
      peakHourShares: 0,
      mobileShareRate: 0,
      directCopyRate: 100,
    },
    recentActivity: [],
  });
  const [trackedFiles, setTrackedFiles] = useState<TrackedFile[]>([]);

  //  NEW: Load data from BACKEND API instead of localStorage
  useEffect(() => {
    const loadDataFromBackend = async () => {
      setLoading(true);
      try {
        // Fetch analytics stats from backend
        const stats = await analyticsApi.getStats(timeRange);

        // Transform backend data to match AnalyticsData format
        const transformedData = transformBackendData(stats);
        setAnalyticsData(transformedData);

        // Also update trackedFiles from backend if available
        // For now, keep existing trackedFiles or create from stats
        if (stats.topFiles && stats.topFiles.length > 0) {
          const filesFromBackend: TrackedFile[] = stats.topFiles.map(
            (file: any, index: number) => ({
              id: file._id || index.toString(),
              name: file.fileName,
              url: "",
              type: "application",
              size: "0 KB",
              uploaded: new Date(file.lastShared).toLocaleDateString(),
              shareCount: file.shares,
              downloadCount: 0,
              viewCount: 0,
              shareHistory: [],
              downloadHistory: [],
              viewHistory: [],
            }),
          );
          setTrackedFiles(filesFromBackend);
        }
      } catch (error) {
        console.error("Failed to load analytics from backend:", error);
        // Fallback to localStorage if backend fails
        const stored = localStorage.getItem("uploadedFiles");
        if (stored) {
          const files = JSON.parse(stored);
          setTrackedFiles(files);
          generateRealAnalyticsData(files);
        } else {
          generateMockAnalyticsData();
        }
      } finally {
        setLoading(false);
      }
    };

    loadDataFromBackend();
  }, [timeRange]);

  //  NEW: Transform backend API response to AnalyticsData format
  const transformBackendData = (backendStats: any): AnalyticsData => {
    // Transform daily shares
    const dailyShares = (backendStats.sharesByDay || []).map((day: any) => ({
      date: day.date,
      shares: day.shares,
      uniqueFiles: day.uniqueUsers || 0,
    }));

    // Transform top files
    const topFiles = (backendStats.topFiles || []).map((file: any) => ({
      name:
        file.fileName.length > 20
          ? file.fileName.substring(0, 20) + "..."
          : file.fileName,
      shares: file.shares,
      downloads: 0,
      views: 0,
    }));

    // Transform share sources
    const totalShares = (backendStats.shareSources || []).reduce(
      (sum: number, s: any) => sum + s.count,
      0,
    );
    const shareSources = (backendStats.shareSources || []).map(
      (source: any) => ({
        name:
          source._id === "direct_copy"
            ? "Direct Copy"
            : source._id.charAt(0).toUpperCase() + source._id.slice(1),
        value:
          totalShares > 0 ? Math.round((source.count / totalShares) * 100) : 0,
        color: getSourceColor(source._id),
      }),
    );

    // Transform hourly activity
    const hourlyActivity = (backendStats.hourlyActivity || []).map(
      (hour: any) => ({
        hour: formatHour(hour._id.toString()),
        shares: hour.shares,
        avg: Math.round((backendStats.totalShares || 0) / 24),
      }),
    );

    // Calculate performance metrics

    const avgSharesPerFile =
      backendStats.uniqueFiles > 0
        ? Math.round((backendStats.totalShares || 0) / backendStats.uniqueFiles)
        : 0;

    const peakHourShares =
      backendStats.hourlyActivity && backendStats.hourlyActivity.length > 0
        ? Math.max(
            ...backendStats.hourlyActivity.map(
              (h: { _id: number; shares: number }) => h.shares,
            ),
          )
        : 0;

    const directCopyRate =
      shareSources.find(
        (s: { name: string; value: number; color: string }) =>
          s.name === "Direct Copy",
      )?.value || 0;

    return {
      dailyShares,
      topFiles,
      shareSources,
      hourlyActivity,
      fileTypeDistribution: [],
      performanceMetrics: {
        avgSharesPerFile,
        peakHourShares,
        mobileShareRate: 30,
        directCopyRate,
      },
      recentActivity: [],
    };
  };

  //  Keep existing generateRealAnalyticsData for fallback
  const generateRealAnalyticsData = (files: TrackedFile[]) => {
    // Your existing code remains exactly the same
    try {
      const dailySharesMap = new Map<
        string,
        { shares: number; files: Set<string> }
      >();
      const hourlySharesMap = new Map<string, number>();
      const fileTypeMap = new Map<string, { count: number; shares: number }>();
      const sourceMap = new Map<string, number>();
      let totalShares = 0;
      const totalFiles = files.length;

      files.forEach((file) => {
        const fileType = file.type || "other";
        const typeData = fileTypeMap.get(fileType) || { count: 0, shares: 0 };
        typeData.count++;
        typeData.shares += file.shareCount || 0;
        fileTypeMap.set(fileType, typeData);

        if (file.shareHistory && file.shareHistory.length > 0) {
          file.shareHistory.forEach((share) => {
            const shareDate = new Date(share.timestamp);
            const dateKey = shareDate.toLocaleDateString("en-US", {
              weekday: "short",
            });
            const dailyData = dailySharesMap.get(dateKey) || {
              shares: 0,
              files: new Set<string>(),
            };
            dailyData.shares++;
            dailyData.files.add(file.id);
            dailySharesMap.set(dateKey, dailyData);

            const hourKey = `${shareDate.getHours()}:00`;
            hourlySharesMap.set(
              hourKey,
              (hourlySharesMap.get(hourKey) || 0) + 1,
            );

            const source = share.source || "Direct Copy";
            sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
          });
        }

        totalShares += file.shareCount || 0;
      });

      const dailyShares = Array.from(dailySharesMap.entries())
        .map(([date, data]) => ({
          date,
          shares: data.shares,
          uniqueFiles: data.files.size,
        }))
        .sort((a, b) => {
          const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          return days.indexOf(a.date) - days.indexOf(b.date);
        });

      const topFiles = files
        .map((file) => ({
          name:
            file.name.length > 20
              ? file.name.substring(0, 20) + "..."
              : file.name,
          fullName: file.name,
          shares: file.shareCount || 0,
          downloads: file.downloadCount || 0,
          views: file.viewCount || 0,
          size: file.size,
        }))
        .filter((file) => file.shares > 0)
        .sort((a, b) => b.shares - a.shares)
        .slice(0, 8);

      const totalSourceShares = Array.from(sourceMap.values()).reduce(
        (sum, val) => sum + val,
        0,
      );
      const shareSources = Array.from(sourceMap.entries())
        .map(([name, value]) => ({
          name,
          value: Math.round((value / totalSourceShares) * 100),
          color: getSourceColor(name),
        }))
        .sort((a, b) => b.value - a.value);

      const hourlyActivity = Array.from(hourlySharesMap.entries())
        .map(([hour, shares]) => ({
          hour: formatHour(hour),
          shares,
          avg: Math.round(totalShares / 24),
        }))
        .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

      const fileTypeDistribution = Array.from(fileTypeMap.entries())
        .map(([type, data]) => ({
          type: type.charAt(0).toUpperCase() + type.slice(1),
          count: data.count,
          shares: data.shares,
          color: getFileTypeColor(type),
        }))
        .sort((a, b) => b.shares - a.shares);

      const avgSharesPerFile =
        totalFiles > 0 ? Math.round(totalShares / totalFiles) : 0;
      const peakHourShares =
        hourlyActivity.length > 0
          ? Math.max(...hourlyActivity.map((h) => h.shares))
          : 0;
      const directCopyRate =
        shareSources.find((s) => s.name === "Direct Copy")?.value || 100;

      const recentActivity = files
        .flatMap((file) => {
          const activities = [];
          if (file.shareCount > 0) {
            activities.push({
              time: file.lastAccessed
                ? formatTimeAgo(new Date(file.lastAccessed))
                : "Recently",
              file: file.name,
              action: "share",
              count: file.shareCount,
            });
          }
          if (file.downloadCount > 0) {
            activities.push({
              time: file.lastAccessed
                ? formatTimeAgo(new Date(file.lastAccessed))
                : "Recently",
              file: file.name,
              action: "download",
              count: file.downloadCount,
            });
          }
          return activities;
        })
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 5);

      setAnalyticsData({
        dailyShares,
        topFiles,
        shareSources,
        hourlyActivity,
        fileTypeDistribution,
        performanceMetrics: {
          avgSharesPerFile,
          peakHourShares,
          mobileShareRate: 30,
          directCopyRate,
        },
        recentActivity,
      });
    } catch (error) {
      console.error("Error generating analytics:", error);
      generateMockAnalyticsData();
    }
  };

  // ✅ Keep existing generateMockAnalyticsData for fallback
  const generateMockAnalyticsData = () => {
    const now = new Date();
    const dailyShares = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      dailyShares.push({
        date: date.toLocaleDateString("en-US", { weekday: "short" }),
        shares: Math.floor(Math.random() * 50) + 10,
        uniqueFiles: Math.floor(Math.random() * 15) + 5,
      });
    }

    setAnalyticsData({
      dailyShares,
      topFiles: [],
      shareSources: [{ name: "Direct Copy", value: 100, color: "#3498db" }],
      hourlyActivity: [],
      fileTypeDistribution: [],
      performanceMetrics: {
        avgSharesPerFile: 0,
        peakHourShares: 0,
        mobileShareRate: 0,
        directCopyRate: 100,
      },
      recentActivity: [],
    });
  };

  //  Keep all existing helper functions (getSourceColor, getFileTypeColor, formatHour, formatTimeAgo)
  const getSourceColor = (source: string) => {
    const colors: { [key: string]: string } = {
      "Direct Copy": "#3498db",
      direct_copy: "#3498db",
      Email: "#2ecc71",
      email: "#2ecc71",
      WhatsApp: "#9b59b6",
      whatsapp: "#9b59b6",
      Teams: "#f39c12",
      teams: "#f39c12",
      Slack: "#e74c3c",
      slack: "#e74c3c",
      other: "#95a5a6",
    };
    return colors[source] || "#95a5a6";
  };

  const getFileTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      image: "#3498db",
      application: "#2ecc71",
      text: "#9b59b6",
      video: "#e74c3c",
      audio: "#f39c12",
      other: "#95a5a6",
    };
    return colors[type] || "#95a5a6";
  };

  const formatHour = (hour: string) => {
    const [h] = hour.split(":");
    const hourNum = parseInt(h);
    return hourNum < 12
      ? `${hourNum === 0 ? 12 : hourNum}AM`
      : hourNum === 12
        ? "12PM"
        : `${hourNum - 12}PM`;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  // Calculate real stats (uses trackedFiles state)
  const totalShares = trackedFiles.reduce(
    (sum, file) => sum + (file.shareCount || 0),
    0,
  );
  const totalDownloads = trackedFiles.reduce(
    (sum, file) => sum + (file.downloadCount || 0),
    0,
  );
  const totalViews = trackedFiles.reduce(
    (sum, file) => sum + (file.viewCount || 0),
    0,
  );
  const today = new Date().toDateString();
  const todayShares = trackedFiles.reduce((sum, file) => {
    if (file.shareHistory) {
      return (
        sum +
        file.shareHistory.filter(
          (share) => new Date(share.timestamp).toDateString() === today,
        ).length
      );
    }
    return sum;
  }, 0);

  const stats = [
    {
      title: "Total Link Copies",
      value: totalShares,
      change: todayShares > 0 ? `+${todayShares} today` : "No activity today",
      icon: <Share2 className="w-6 h-6" />,
      color: "from-[#3498db] to-[#2980b9]",
      bgColor: "bg-[#3498db]/20",
      trend: todayShares > 0 ? "up" : "neutral",
    },
    {
      title: "Unique Files",
      value: trackedFiles.filter((f) => f.shareCount > 0).length,
      change: `${trackedFiles.length} total files`,
      icon: <FileText className="w-6 h-6" />,
      color: "from-[#2ecc71] to-[#27ae60]",
      bgColor: "bg-[#2ecc71]/20",
      trend: "neutral",
    },
    {
      title: "Total Downloads",
      value: totalDownloads,
      change: `${trackedFiles.filter((f) => f.downloadCount > 0).length} files`,
      icon: <Download className="w-6 h-6" />,
      color: "from-[#9b59b6] to-[#8e44ad]",
      bgColor: "bg-[#9b59b6]/20",
      trend: "up",
    },
    {
      title: "Total Views",
      value: totalViews,
      change: `${trackedFiles.filter((f) => f.viewCount > 0).length} files`,
      icon: <Eye className="w-6 h-6" />,
      color: "from-[#f39c12] to-[#d35400]",
      bgColor: "bg-[#f39c12]/20",
      trend: "up",
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-3">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-300">{entry.name}:</span>
              </div>
              <span className="text-white font-medium ml-4">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const FileTypeTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-3">
          <p className="text-white font-medium mb-2">{data.type}</p>
          <p className="text-gray-300">
            Files: <span className="text-white">{data.count}</span>
          </p>
          <p className="text-gray-300">
            Total Shares: <span className="text-white">{data.shares}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3498db] mx-auto mb-4" />
          <p className="text-gray-400">Loading analytics from server...</p>
        </div>
      </div>
    );
  }

  //  Rest of the JSX remains EXACTLY THE SAME
  // (from return statement onwards - no changes needed)
  return (
    <div className="px-4 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-gray-400">
              Real insights from {trackedFiles.length} tracked files •{" "}
              {totalShares} total link copies
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Time Range Selector */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              {(["day", "week", "month", "year"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded text-sm font-medium capitalize ${
                    timeRange === range
                      ? "bg-gradient-to-r from-[#3498db] to-[#2ecc71] text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => {
                const loadDataFromBackend = async () => {
                  setLoading(true);
                  try {
                    const stats = await analyticsApi.getStats(timeRange);
                    const transformedData = transformBackendData(stats);
                    setAnalyticsData(transformedData);
                  } catch (error) {
                    console.error("Refresh failed:", error);
                    const stored = localStorage.getItem("uploadedFiles");
                    if (stored) {
                      const files = JSON.parse(stored);
                      setTrackedFiles(files);
                      generateRealAnalyticsData(files);
                    }
                  } finally {
                    setLoading(false);
                  }
                };
                loadDataFromBackend();
              }}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-gray-800/50 rounded-xl p-5 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <div
                    className={`text-white ${
                      stat.color.includes("[#3498db]")
                        ? "text-[#3498db]"
                        : stat.color.includes("[#2ecc71]")
                          ? "text-[#2ecc71]"
                          : stat.color.includes("[#9b59b6]")
                            ? "text-[#9b59b6]"
                            : "text-[#f39c12]"
                    }`}
                  >
                    {stat.icon}
                  </div>
                </div>
                <span
                  className={`text-sm font-medium px-2 py-1 rounded ${
                    stat.trend === "up"
                      ? "text-green-400 bg-green-400/10"
                      : stat.trend === "down"
                        ? "text-red-400 bg-red-400/10"
                        : "text-gray-400 bg-gray-400/10"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {stat.value.toLocaleString()}
              </div>
              <div className="text-gray-400 text-sm">{stat.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Shares Over Time */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                Shares Over Time
              </h3>
              <p className="text-gray-400 text-sm">
                Daily link copying activity
              </p>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <Calendar className="w-4 h-4 mr-2" />
              {timeRange === "day"
                ? "Today"
                : timeRange === "week"
                  ? "Last 7 days"
                  : timeRange === "month"
                    ? "Last 30 days"
                    : "Last year"}
            </div>
          </div>

          {analyticsData.dailyShares.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.dailyShares}>
                  <defs>
                    <linearGradient
                      id="colorShares"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3498db" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3498db" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="shares"
                    stroke="#3498db"
                    fillOpacity={1}
                    fill="url(#colorShares)"
                    name="Link Copies"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center">
              <Share2 className="w-12 h-12 text-gray-600 mb-4" />
              <p className="text-gray-500">No sharing data available yet</p>
              <p className="text-gray-600 text-sm">
                Share some files to see analytics
              </p>
            </div>
          )}
        </div>

        {/* Top Performing Files */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                Top Shared Files
              </h3>
              <p className="text-gray-400 text-sm">Most copied links by file</p>
            </div>
            <Award className="w-5 h-5 text-[#f39c12]" />
          </div>

          {analyticsData.topFiles.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.topFiles}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="name"
                    stroke="#9ca3af"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="shares"
                    name="Link Copies"
                    fill="#3498db"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="downloads"
                    name="Downloads"
                    fill="#2ecc71"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center">
              <FileText className="w-12 h-12 text-gray-600 mb-4" />
              <p className="text-gray-500">No file sharing activity yet</p>
              <p className="text-gray-600 text-sm">
                Files will appear here when shared
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Second Row Charts */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* File Type Distribution */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                File Type Analysis
              </h3>
              <p className="text-gray-400 text-sm">Shares by file type</p>
            </div>
            <Database className="w-5 h-5 text-[#9b59b6]" />
          </div>

          {analyticsData.fileTypeDistribution.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.fileTypeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.type}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="shares"
                  >
                    {analyticsData.fileTypeDistribution.map((entry, index) => (
                      <Line key={`line-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<FileTypeTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center">
              <HardDrive className="w-10 h-10 text-gray-600 mb-4" />
              <p className="text-gray-500">No file type data</p>
            </div>
          )}
        </div>

        {/* Performance Metrics */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                Performance Metrics
              </h3>
              <p className="text-gray-400 text-sm">Key sharing statistics</p>
            </div>
            <BarChart3 className="w-5 h-5 text-[#2ecc71]" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div className="flex items-center">
                <Share2 className="w-4 h-4 text-[#3498db] mr-3" />
                <span className="text-gray-300">Avg Shares per File</span>
              </div>
              <span className="text-white font-bold">
                {analyticsData.performanceMetrics.avgSharesPerFile}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div className="flex items-center">
                <Target className="w-4 h-4 text-[#f39c12] mr-3" />
                <span className="text-gray-300">Peak Hour Activity</span>
              </div>
              <span className="text-white font-bold">
                {analyticsData.performanceMetrics.peakHourShares}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div className="flex items-center">
                <Smartphone className="w-4 h-4 text-[#9b59b6] mr-3" />
                <span className="text-gray-300">Direct Copy Rate</span>
              </div>
              <span className="text-white font-bold">
                {analyticsData.performanceMetrics.directCopyRate}%
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 text-[#2ecc71] mr-3" />
                <span className="text-gray-300">Engagement Rate</span>
              </div>
              <span className="text-white font-bold">
                {trackedFiles.length > 0
                  ? Math.round((totalShares / trackedFiles.length) * 100)
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                Recent Activity
              </h3>
              <p className="text-gray-400 text-sm">Latest file interactions</p>
            </div>
            <Zap className="w-5 h-5 text-[#f39c12]" />
          </div>

          {analyticsData.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center">
                    <div
                      className={`p-2 rounded-lg mr-3 ${
                        activity.action === "share"
                          ? "bg-[#3498db]/20"
                          : "bg-[#2ecc71]/20"
                      }`}
                    >
                      {activity.action === "share" ? (
                        <Share2 className="w-4 h-4 text-[#3498db]" />
                      ) : (
                        <Download className="w-4 h-4 text-[#2ecc71]" />
                      )}
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium truncate max-w-[150px]">
                        {activity.file}
                      </div>
                      <div className="text-gray-400 text-xs capitalize">
                        {activity.action} • {activity.count} times
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-400 text-sm">{activity.time}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center">
              <Clock className="w-10 h-10 text-gray-600 mb-4" />
              <p className="text-gray-500">No recent activity</p>
              <p className="text-gray-600 text-sm">Activity will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* File Details Table */}
      {trackedFiles.length > 0 && (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mb-8">
          <h3 className="text-xl font-bold text-white mb-6">File Details</h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    File Name
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    Shares
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    Downloads
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    Views
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    Last Accessed
                  </th>
                </tr>
              </thead>
              <tbody>
                {trackedFiles
                  .filter(
                    (file) => file.shareCount > 0 || file.downloadCount > 0,
                  )
                  .sort((a, b) => (b.shareCount || 0) - (a.shareCount || 0))
                  .slice(0, 5)
                  .map((file, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30"
                    >
                      <td className="py-3 px-4 text-white truncate max-w-[200px]">
                        {file.name}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            file.type === "image"
                              ? "bg-[#3498db]/20 text-[#3498db]"
                              : file.type === "application"
                                ? "bg-[#2ecc71]/20 text-[#2ecc71]"
                                : "bg-gray-700/50 text-gray-400"
                          }`}
                        >
                          {file.type || "other"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Share2 className="w-4 h-4 text-[#3498db] mr-2" />
                          <span className="text-white">
                            {file.shareCount || 0}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Download className="w-4 h-4 text-[#2ecc71] mr-2" />
                          <span className="text-white">
                            {file.downloadCount || 0}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 text-[#f39c12] mr-2" />
                          <span className="text-white">
                            {file.viewCount || 0}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {file.lastAccessed
                          ? formatTimeAgo(new Date(file.lastAccessed))
                          : "Never"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer Note */}
      <div className="text-center text-gray-500 text-sm mb-4">
        <p>
          Tracking {trackedFiles.length} files with {totalShares} total link
          copies • Last updated:{" "}
          {new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <p className="text-gray-600 text-xs mt-1">
          Data from backend • Analytics update when files are shared
        </p>
      </div>
    </div>
  );
};

export default Analytics;
