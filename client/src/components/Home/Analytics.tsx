import React, { useEffect, useState } from "react";
import { fetchDownloadAnalytics } from "../../services/api";
import { BarChart2, Clock, FileText } from "lucide-react";

interface AnalyticsData {
  _id: string;
  downloadCount: number;
  fileId: { name: string; size: number };
  downloadHistory: Array<{ downloadedAt: string; ipAddress: string }>;
}

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDownloadAnalytics()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalDownloads = data.reduce((sum, item) => sum + item.downloadCount, 0);

  if (loading) return <div className="text-center p-6">Loading statistics...</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold dark:text-white">Engagement Dashboard</h2>

      {/* Metric Cards Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border dark:border-gray-700 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Aggregate Downloads</div>
            <div className="text-2xl font-bold dark:text-white">{totalDownloads}</div>
          </div>
        </div>
      </div>

      {/* File-by-File Summary Matrix Table Layout */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b dark:border-gray-700 font-bold dark:text-white flex items-center">
          <FileText className="w-5 h-5 mr-2 text-gray-500" /> Active Links Performance
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 text-sm">
            <tr>
              <th className="p-4">Resource File Name</th>
              <th className="p-4 text-center">Hit Frequency</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700 text-sm dark:text-gray-300">
            {data.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="p-4 font-medium">{item.fileId?.name || "Deleted File"}</td>
                <td className="p-4 text-center font-bold text-green-600">{item.downloadCount} downloads</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Analytics;