import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  Cloud,
  Shield,
  Zap,
  Lock,
  Globe,
  Eye,
  EyeOff,
  LogIn,
  Key,
  Mail,
} from "lucide-react";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
  });

  const handleRegisterRedirect = () => {
    navigate("/register");
  };

  const handleLogin = async () => {
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("http://localhost:5000/login", {
        email,
        password,
      });

      localStorage.setItem("authToken", response.data.authToken);
      localStorage.setItem("userEmail", email);

      // Show success message
      setErrorMsg(null);
      alert("Login successful! Welcome back.");
      navigate("/home");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrorMsg(
          error.response?.data?.error ||
            "Login failed. Please check your credentials.",
        );
      } else {
        setErrorMsg("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const featureCards = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure Access",
      description: "Bank-level encryption for all your data",
      color: "#3498db",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant Access",
      description: "Access your files instantly from any device",
      color: "#2ecc71",
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Anywhere Access",
      description: "Access from any location worldwide",
      color: "#9b59b6",
    },
  ];

  const demoAccounts = [
    { email: "demo@secureshare.com", password: "demo123", role: "Demo User" },
    { email: "admin@secureshare.com", password: "admin123", role: "Admin" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 font-sans p-4">
      <div className="container mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between py-6">
          <Link to="/" className="flex items-center space-x-2 group">
            <Cloud className="w-10 h-10 text-[#3498db] group-hover:rotate-12 transition-transform" />
            <span className="text-2xl font-bold text-white">SecureShare</span>
          </Link>
          <div className="text-gray-400">
            New to SecureShare?{" "}
            <button
              onClick={handleRegisterRedirect}
              className="text-[#3498db] hover:text-[#2980b9] font-medium transition-colors hover:underline"
            >
              Create Account
            </button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700 shadow-2xl">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#3498db] to-[#2ecc71] rounded-2xl mb-6">
                  <LogIn className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-white mb-3">
                  Welcome Back
                </h1>
                <p className="text-gray-400 text-lg">
                  Sign in to access your secure file storage
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 mb-2 font-medium">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none transition-all pl-12"
                      placeholder="you@example.com"
                    />
                    <Mail className="absolute left-4 top-3 w-5 h-5 text-gray-500" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-gray-300 font-medium">
                      Password
                    </label>
                    <button className="text-sm text-[#3498db] hover:text-[#2980b9] transition-colors">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none transition-all pl-12 pr-10"
                      placeholder="Enter your password"
                    />
                    <Key className="absolute left-4 top-3 w-5 h-5 text-gray-500" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-4 bg-[#e74c3c]/10 border border-[#e74c3c] rounded-lg">
                    <p className="text-[#e74c3c] text-sm flex items-center">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {errorMsg}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-[#3498db] to-[#2ecc71] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Signing In...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </button>

                <div className="text-center text-gray-400 text-sm">
                  By signing in, you agree to our{" "}
                  <a href="#" className="text-[#3498db] hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-[#3498db] hover:underline">
                    Privacy Policy
                  </a>
                </div>

                {/* Demo Accounts */}
                <div className="border-t border-gray-700 pt-6">
                  <h4 className="text-gray-300 font-medium mb-3 text-center">
                    Demo Accounts
                  </h4>
                  <div className="grid gap-2">
                    {demoAccounts.map((account, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setEmail(account.email);
                          setPassword(account.password);
                        }}
                        className="p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-left hover:border-gray-600 transition-colors group"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-white font-medium">
                              {account.role}
                            </div>
                            <div className="text-gray-400 text-sm">
                              {account.email}
                            </div>
                          </div>
                          <div className="px-3 py-1 bg-gray-800 rounded text-xs text-gray-400 group-hover:text-[#3498db] transition-colors">
                            Use
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Features */}
            <div className="space-y-8">
              {/* Welcome Card */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl">
                <div className="flex items-start mb-6">
                  <div className="p-3 bg-gradient-to-br from-[#3498db] to-[#2ecc71] rounded-xl mr-4">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Secure Access
                    </h3>
                    <p className="text-gray-400">
                      Your files are protected with military-grade encryption.
                      Sign in to access your secure file storage and sharing
                      platform.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 p-4 rounded-xl">
                    <div className="text-[#2ecc71] font-bold text-2xl mb-1">
                      24/7
                    </div>
                    <div className="text-gray-400 text-sm">
                      Access Available
                    </div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-xl">
                    <div className="text-[#f1c40f] font-bold text-2xl mb-1">
                      100%
                    </div>
                    <div className="text-gray-400 text-sm">Encrypted</div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-xl">
                    <div className="text-[#9b59b6] font-bold text-2xl mb-1">
                      Zero
                    </div>
                    <div className="text-gray-400 text-sm">
                      Knowledge Access
                    </div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-xl">
                    <div className="text-[#e74c3c] font-bold text-2xl mb-1">
                      256-bit
                    </div>
                    <div className="text-gray-400 text-sm">AES Encryption</div>
                  </div>
                </div>
              </div>

              {/* Feature Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                {featureCards.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-105 cursor-pointer group"
                    style={{ borderTopColor: feature.color }}
                  >
                    <div
                      className="p-3 rounded-lg mb-4 inline-block group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: `${feature.color}20` }}
                    >
                      <div style={{ color: feature.color }}>{feature.icon}</div>
                    </div>
                    <h4 className="text-white font-bold mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-gray-400 text-sm">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Recent Activity Card */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-bold">
                    Recent Security Updates
                  </h4>
                  <div className="px-3 py-1 bg-[#2ecc71]/20 text-[#2ecc71] text-xs rounded-full">
                    Secure
                  </div>
                </div>
                <ul className="space-y-3">
                  {[
                    {
                      text: "Enhanced two-factor authentication",
                      time: "2 hours ago",
                      color: "#3498db",
                    },
                    {
                      text: "New encryption protocol implemented",
                      time: "1 day ago",
                      color: "#9b59b6",
                    },
                    {
                      text: "Improved password hashing algorithm",
                      time: "3 days ago",
                      color: "#f1c40f",
                    },
                    {
                      text: "Security audit completed",
                      time: "1 week ago",
                      color: "#2ecc71",
                    },
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <div
                        className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <div className="flex-1">
                        <p className="text-gray-300 text-sm">{item.text}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {item.time}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Stats */}
              <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700">
                <h4 className="text-white font-bold mb-4">
                  SecureShare at a Glance
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Active Users</span>
                    <span className="text-white font-bold">500K+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Files Secured</span>
                    <span className="text-white font-bold">10M+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Uptime</span>
                    <span className="text-[#2ecc71] font-bold">99.9%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Support Response</span>
                    <span className="text-[#f1c40f] font-bold">
                      Under 1 hour
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>
            © 2024 SecureShare. All access is logged and monitored for security
            purposes.
          </p>
          <p className="mt-1 text-gray-600">
            Your security is our top priority.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Login;
