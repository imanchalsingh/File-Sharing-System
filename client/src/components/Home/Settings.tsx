import React, { useState, useEffect } from "react";
import { Settings as SettingsIcon, Shield, Copy, Check, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import api, { authApi } from "../../services/api";
import { User, Lock, Mail } from "lucide-react";

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  
  // Profile state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    // Check current 2FA status
    const fetchStatus = async () => {
      try {
        const response = await api.get("/auth");
        if (response.data.user) {
          setUsername(response.data.user.username || "");
          setEmail(response.data.user.email || "");
          // Assuming we might need to modify the getUser controller if it doesn't return this,
          // but we can also just try to enable it and see if it works.
          // For now, let's assume it's part of the user object or we can just show the setup.
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStatus();
  }, []);

  const handleGenerate2FA = async () => {
    setLoading(true);
    try {
      const response = await api.post("/2fa/generate");
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
      setShowSetup(true);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to generate 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/2fa/enable", {
        secret,
        token: verificationCode
      });
      
      if (response.data.success) {
        toast.success("2FA Enabled Successfully");
        setTwoFactorEnabled(true);
        setBackupCodes(response.data.backupCodes);
        setShowSetup(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Password is required to disable 2FA");
      return;
    }
    setLoading(true);
    try {
      const response = await api.post("/2fa/disable", { password });
      if (response.data.success) {
        toast.success("2FA Disabled");
        setTwoFactorEnabled(false);
        setPassword("");
        setBackupCodes([]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to disable 2FA");
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authApi.updateProfile({ username, email });
      if (response.success) {
        toast.success("Profile updated successfully");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("New passwords do not match");
    }
    setLoading(true);
    try {
      const response = await authApi.updatePassword({ currentPassword, newPassword });
      if (response.success) {
        toast.success("Password updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <SettingsIcon className="w-8 h-8 mr-3 text-[#3498db]" />
          Account Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your security preferences and account settings.
        </p>
      </div>

      {/* Profile Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center mb-6">
          <User className="w-6 h-6 mr-2 text-[#3498db]" />
          Profile Information
        </h2>
        
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Display Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#3498db] outline-none"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#3498db] outline-none"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#3498db] text-white rounded-lg hover:bg-[#2980b9] transition-colors font-medium flex items-center"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : null}
            Save Changes
          </button>
        </form>
      </div>

      {/* Password Update */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center mb-6">
          <Lock className="w-6 h-6 mr-2 text-[#e74c3c]" />
          Change Password
        </h2>
        
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#3498db] outline-none"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#3498db] outline-none"
              required
              minLength={6}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#3498db] outline-none"
              required
              minLength={6}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#e74c3c] text-white rounded-lg hover:bg-[#c0392b] transition-colors font-medium flex items-center"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : null}
            Update Password
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center mb-6">
          <Shield className="w-6 h-6 mr-2 text-[#2ecc71]" />
          Two-Factor Authentication (2FA)
        </h2>

        {!twoFactorEnabled && !showSetup && (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Add an extra layer of security to your account. Once enabled, you'll be prompted to enter a code from an authenticator app (like Google Authenticator or Authy) during login.
            </p>
            <button
              onClick={handleGenerate2FA}
              disabled={loading}
              className="px-6 py-2 bg-[#3498db] text-white rounded-lg hover:bg-[#2980b9] transition-colors font-medium flex items-center"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : null}
              Setup 2FA
            </button>
          </div>
        )}

        {showSetup && !twoFactorEnabled && (
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Step 1: Scan QR Code</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Open your authenticator app and scan this QR code, or manually enter the setup key.
              </p>
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {qrCode && (
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                  </div>
                )}
                <div className="flex-1 space-y-2 w-full">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Setup Key</label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm break-all font-mono">
                      {secret}
                    </code>
                    <button
                      onClick={copySecret}
                      className="p-3 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      title="Copy Key"
                    >
                      {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Step 2: Verify Setup</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Enter the 6-digit code generated by your authenticator app to complete setup.
              </p>
              <form onSubmit={handleEnable2FA} className="flex gap-4 max-w-sm">
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center text-lg tracking-widest outline-none focus:ring-2 focus:ring-[#3498db]"
                  required
                />
                <button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className="px-6 py-2 bg-[#2ecc71] text-white rounded-lg hover:bg-[#27ae60] transition-colors font-medium disabled:opacity-50"
                >
                  Verify
                </button>
              </form>
            </div>
          </div>
        )}

        {twoFactorEnabled && (
          <div className="space-y-6">
            <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <Check className="w-6 h-6 text-green-500 mr-3" />
              <p className="text-green-800 dark:text-green-400 font-medium">
                Two-Factor Authentication is currently enabled.
              </p>
            </div>

            {backupCodes.length > 0 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-500 mb-2">Recovery Codes</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-4">
                  Save these recovery codes in a secure place. They can be used to access your account if you lose your authenticator device. Each code can only be used once.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {backupCodes.map((code, idx) => (
                    <code key={idx} className="p-2 bg-yellow-100 dark:bg-yellow-800/50 rounded font-mono text-center text-yellow-900 dark:text-yellow-100">
                      {code}
                    </code>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleDisable2FA} className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
              <h3 className="font-semibold text-red-800 dark:text-red-400 mb-2">Disable 2FA</h3>
              <p className="text-sm text-red-600 dark:text-red-400/80 mb-4">
                To disable two-factor authentication, please enter your password.
              </p>
              <div className="flex gap-4 max-w-sm">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="flex-1 px-4 py-2 border border-red-200 dark:border-red-800/50 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-red-400"
                  required
                />
                <button
                  type="submit"
                  disabled={loading || !password}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
                >
                  Disable
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
