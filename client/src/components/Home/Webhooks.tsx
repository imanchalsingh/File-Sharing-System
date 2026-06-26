import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { notify as toast } from "@/services/toastService";
import { Globe, Plus, Trash2, Edit2, CheckCircle, XCircle, Activity, Key, Link as LinkIcon, AlertCircle } from "lucide-react";

interface Webhook {
  _id: string;
  targetUrl: string;
  secretKey: string;
  events: string[];
  isActive: boolean;
  deliveryLogs: any[];
  createdAt: string;
}

const AVAILABLE_EVENTS = [
  { id: "file_shared", label: "File Shared" },
  { id: "link_accessed", label: "Link Accessed" },
  { id: "download_completed", label: "Download Completed" },
  { id: "link_expired", label: "Link Expired" }
];

const Webhooks: React.FC = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);

  // Form state
  const [targetUrl, setTargetUrl] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const { data } = await api.get("/webhooks");
      setWebhooks(data.webhooks);
    } catch (error) {
      toast.error("Failed to fetch webhooks");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (webhook: Webhook | null = null) => {
    if (webhook) {
      setEditingWebhook(webhook);
      setTargetUrl(webhook.targetUrl);
      setSecretKey(webhook.secretKey);
      setSelectedEvents(webhook.events);
      setIsActive(webhook.isActive);
    } else {
      setEditingWebhook(null);
      setTargetUrl("");
      setSecretKey(generateSecretKey());
      setSelectedEvents(["file_shared", "download_completed"]);
      setIsActive(true);
    }
    setIsModalOpen(true);
  };

  const generateSecretKey = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { targetUrl, secretKey, events: selectedEvents, isActive };
      
      if (editingWebhook) {
        await api.put(`/webhooks/${editingWebhook._id}`, payload);
        toast.success("Webhook updated successfully");
      } else {
        await api.post("/webhooks", payload);
        toast.success("Webhook created successfully");
      }
      setIsModalOpen(false);
      fetchWebhooks();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to save webhook");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;
    try {
      await api.delete(`/webhooks/${id}`);
      toast.success("Webhook deleted");
      fetchWebhooks();
    } catch (error) {
      toast.error("Failed to delete webhook");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Activity className="animate-spin text-[#3498db] w-8 h-8" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Webhooks</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage external event notifications.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-[#3498db] text-white rounded-lg hover:bg-[#2980b9] transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Webhook
        </button>
      </div>

      {webhooks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
          <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No webhooks configured</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 mb-4">Set up a webhook to receive real-time notifications about file events.</p>
          <button onClick={() => openModal()} className="text-[#3498db] font-medium hover:underline">Create your first webhook</button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {webhooks.map((webhook) => (
            <div key={webhook._id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 flex flex-col relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${webhook.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center text-sm font-medium text-gray-900 dark:text-white truncate pr-4">
                  <LinkIcon className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{webhook.targetUrl}</span>
                </div>
                <div className="flex space-x-1">
                  <button onClick={() => openModal(webhook)} className="p-1 text-gray-400 hover:text-[#3498db]"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(webhook._id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {webhook.events.map(ev => (
                  <span key={ev} className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md">
                    {ev}
                  </span>
                ))}
              </div>

              <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <span>{webhook.isActive ? <span className="text-green-500 flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> Active</span> : <span className="flex items-center"><XCircle className="w-3 h-3 mr-1"/> Inactive</span>}</span>
                <span>{webhook.deliveryLogs?.length || 0} deliveries</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 relative">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {editingWebhook ? "Edit Webhook" : "New Webhook"}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target URL</label>
                  <input
                    type="url"
                    required
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#3498db] text-gray-900 dark:text-white"
                    placeholder="https://api.example.com/webhook"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Secret Key</label>
                  <div className="flex">
                    <input
                      type="text"
                      required
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-l-lg focus:ring-2 focus:ring-[#3498db] text-gray-900 dark:text-white"
                    />
                    <button type="button" onClick={() => setSecretKey(generateSecretKey())} className="px-3 bg-gray-200 dark:bg-gray-700 rounded-r-lg border-y border-r border-gray-300 dark:border-gray-700 text-sm">Regenerate</button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Used to compute HMAC-SHA256 signatures.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Events</label>
                  <div className="space-y-2">
                    {AVAILABLE_EVENTS.map(ev => (
                      <label key={ev.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedEvents.includes(ev.id)}
                          onChange={() => toggleEvent(ev.id)}
                          className="rounded text-[#3498db] focus:ring-[#3498db]"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{ev.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center mt-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-[#3498db] focus:ring-[#3498db]"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable Webhook</label>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-lg">Save Webhook</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Webhooks;
