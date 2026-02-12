import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  Shield,
  Zap,
  Users,
  Cloud,
  Lock,
  Globe,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
  });

  const handleLogin = () => {
    navigate("/login");
  };

  const handleRegister = async () => {
    setErrorMsg(null);

    // Basic validation
    if (!username || !email || !password) {
      setErrorMsg("All fields are required.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/register", {
        username,
        email,
        password,
      });

      if (res.data) {
        alert("Registration successful! Please login.");
        navigate("/home");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("Registration error:", error.response);
        setErrorMsg(
          error.response?.data?.error ||
            error.response?.data?.message ||
            "Registration failed. Please check your details.",
        );
      } else {
        setErrorMsg("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const featureCards = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Bank-Level Security",
      description: "End-to-end encryption for all your files",
      color: "#3498db",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast",
      description: "Upload speeds up to 1GB/s",
      color: "#2ecc71",
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Global Access",
      description: "Access files from anywhere",
      color: "#9b59b6",
    },
  ];

  const passwordStrength = () => {
    if (!password) return { width: "0%", color: "#e74c3c", text: "Weak" };
    if (password.length < 6)
      return { width: "33%", color: "#e74c3c", text: "Weak" };
    if (password.length < 10)
      return { width: "66%", color: "#f1c40f", text: "Medium" };
    return { width: "100%", color: "#2ecc71", text: "Strong" };
  };

  const strength = passwordStrength();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 font-sans p-4">
      <div className="container mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between py-6">
          <Link to="/" className="flex items-center space-x-2">
            <Cloud className="w-10 h-10 text-[#3498db]" />
            <span className="text-2xl font-bold text-white">SecureShare</span>
          </Link>
          <div className="text-gray-400">
            Already have an account?{" "}
            <button
              onClick={handleLogin}
              className="text-[#3498db] hover:text-[#2980b9] font-medium transition-colors"
            >
              Sign In
            </button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700 shadow-2xl">
              <div className="text-center mb-10">
                <h1 className="text-4xl font-bold text-white mb-3">
                  Join SecureShare
                </h1>
                <p className="text-gray-400 text-lg">
                  Create your account and start sharing files securely
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 mb-2 font-medium">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none transition-all"
                      placeholder="Enter your full name"
                    />
                    <Users className="absolute right-3 top-3 w-5 h-5 text-gray-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 font-medium">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none transition-all"
                      placeholder="you@example.com"
                    />
                    <svg
                      className="absolute right-3 top-3 w-5 h-5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none transition-all pr-10"
                      placeholder="Create a strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {password && (
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Password strength</span>
                        <span
                          style={{ color: strength.color }}
                          className="font-medium"
                        >
                          {strength.text}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: strength.width,
                            backgroundColor: strength.color,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <ul className="mt-3 space-y-1">
                    <li
                      className={`flex items-center text-sm ${password.length >= 6 ? "text-[#2ecc71]" : "text-gray-500"}`}
                    >
                      <Check
                        className={`w-4 h-4 mr-2 ${password.length >= 6 ? "opacity-100" : "opacity-0"}`}
                      />
                      At least 6 characters
                    </li>
                  </ul>
                </div>

                {errorMsg && (
                  <div className="p-4 bg-[#e74c3c]/10 border border-[#e74c3c] rounded-lg">
                    <p className="text-[#e74c3c] text-sm">{errorMsg}</p>
                  </div>
                )}

                <button
                  onClick={handleRegister}
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
                      Creating Account...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </button>

                <div className="text-center text-gray-400 text-sm">
                  By signing up, you agree to our{" "}
                  <a href="#" className="text-[#3498db] hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-[#3498db] hover:underline">
                    Privacy Policy
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column - Features */}
            <div className="space-y-8">
              {/* Project Info Card */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl">
                <div className="flex items-start mb-6">
                  <div className="p-3 bg-[#3498db]/20 rounded-xl mr-4">
                    <Cloud className="w-8 h-8 text-[#3498db]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      SecureShare
                    </h3>
                    <p className="text-gray-400">
                      A modern file sharing system with enterprise-grade
                      security and blazing fast transfers. Share files securely
                      with end-to-end encryption and real-time collaboration.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 p-4 rounded-xl">
                    <div className="text-[#2ecc71] font-bold text-2xl mb-1">
                      10GB
                    </div>
                    <div className="text-gray-400 text-sm">Free Storage</div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-xl">
                    <div className="text-[#f1c40f] font-bold text-2xl mb-1">
                      2GB
                    </div>
                    <div className="text-gray-400 text-sm">Max File Size</div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-xl">
                    <div className="text-[#9b59b6] font-bold text-2xl mb-1">
                      256-bit
                    </div>
                    <div className="text-gray-400 text-sm">Encryption</div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-xl">
                    <div className="text-[#e74c3c] font-bold text-2xl mb-1">
                      99.9%
                    </div>
                    <div className="text-gray-400 text-sm">Uptime SLA</div>
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

              {/* Security Card */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-xl">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-[#e74c3c]/20 rounded-lg mr-3">
                    <Lock className="w-5 h-5 text-[#e74c3c]" />
                  </div>
                  <h4 className="text-white font-bold">Security Features</h4>
                </div>
                <ul className="space-y-2">
                  {[
                    "End-to-end encryption",
                    "Two-factor authentication",
                    "Zero-knowledge architecture",
                    "GDPR compliant",
                    "Regular security audits",
                  ].map((item, index) => (
                    <li
                      key={index}
                      className="flex items-center text-gray-400 text-sm"
                    >
                      <div className="w-1.5 h-1.5 bg-[#3498db] rounded-full mr-3"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Testimonials */}
              <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700">
                <h4 className="text-white font-bold mb-4">Trusted by Teams</h4>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#3498db] to-[#2ecc71] rounded-full mr-3"></div>
                    <div>
                      <p className="text-gray-300 text-sm">
                        "The security and speed are unmatched. Perfect for our
                        remote team."
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        - Sarah, Project Manager
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#9b59b6] to-[#3498db] rounded-full mr-3"></div>
                    <div>
                      <p className="text-gray-300 text-sm">
                        "Switched from Dropbox and never looked back. Encryption
                        gives us peace of mind."
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        - Mark, Startup Founder
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>
            © 2024 SecureShare. All files are encrypted before leaving your
            device.
          </p>
          <p className="mt-1 text-gray-600">
            File sharing made secure and simple.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Register;
