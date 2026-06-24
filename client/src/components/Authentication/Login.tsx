import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
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
  Sun,
  Moon,
} from "lucide-react";
import { toast } from "react-toastify";

const featureCards = [
  { title: "Secure", description: "Military grade encryption", color: "#e74c3c", icon: <Shield /> },
  { title: "Fast", description: "Lightning fast transfers", color: "#3498db", icon: <Zap /> },
  { title: "Global", description: "Access from anywhere", color: "#2ecc71", icon: <Globe /> }
];

const demoAccounts = [
  { email: "admin@example.com", password: "password123", role: "admin" },
  { email: "user@example.com", password: "password123", role: "user" }
];

const Login: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [theme, setTheme] = useState<string>(
    localStorage.getItem("theme") === "dark" ? "dark" : "light"
  );

  const handleRegisterRedirect = () => {
    navigate("/register");
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);

    if (next === "dark") {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    }

    localStorage.setItem("theme", next);
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    // Validation
    if (!email || !password) {
      setErrorMsg("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (!email.includes("@")) {
      setErrorMsg("Please enter a valid email");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        "/login",
        { email, password },
        { withCredentials: true }
      );

      if (response.data.success) {
        if (response.data.requires2FA) {
          setRequires2FA(true);
          setTempToken(response.data.tempToken);
          toast.info("Two-factor authentication required");
          return;
        }

        localStorage.setItem("user", JSON.stringify(response.data.user));
        if (response.data.authToken) {
          localStorage.setItem("authToken", response.data.authToken);
        }
        toast.success("Login successful!");
        window.location.href = "/home";  // ✅ CHANGE KARO
      } else {
        setErrorMsg(response.data.error || "Invalid email or password");
      }
    } catch (error: unknown) {
      setErrorMsg("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    if (!totpCode || totpCode.length < 6) {
      setErrorMsg("Please enter a valid 6-digit code or backup code");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/login/2fa", {
        tempToken,
        token: totpCode
      });

      if (response.data.success) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
        if (response.data.authToken) {
          localStorage.setItem("authToken", response.data.authToken);
        }
        toast.success("Login successful!");
        window.location.href = "/home";  // ✅ CHANGE KARO
      }
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  // Handle sign up redirect
  const handleSignUp = () => {
    navigate("/signup");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 font-sans p-4">
      <div className="container mx-auto">
        <header className="flex items-center justify-between py-6">
          <Link to="/" className="flex items-center space-x-2 group">
            <Cloud className="w-10 h-10 text-[#3498db] group-hover:rotate-12 transition-transform" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              SecureShare
            </span>
          </Link>

          <div className="text-gray-600 dark:text-gray-400">
            New to SecureShare?{" "}
            <button
              type="button"
              onClick={handleRegisterRedirect}
              className="text-[#3498db] hover:text-[#2980b9] font-medium transition-colors hover:underline"
            >
              Create Account
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700/50 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors ml-4"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-2xl">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#3498db] to-[#2ecc71] rounded-2xl mb-6">
                  <LogIn className="w-8 h-8 text-white" />
                </div>

                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                  Welcome Back
                </h1>

                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  {requires2FA ? "Enter your 2FA verification code" : "Sign in to access your secure file storage"}
                </p>
              </div>

              {requires2FA ? (
                <form className="space-y-6" onSubmit={handleVerify2FA}>
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                      Authentication Code
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none pl-12 tracking-widest font-mono text-lg"
                        placeholder="000000"
                        maxLength={8}
                      />
                      <Shield className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Enter the 6-digit code from your authenticator app, or an 8-character backup code.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="p-4 bg-[#e74c3c]/10 border border-[#e74c3c] rounded-lg">
                      <p className="text-[#e74c3c] text-sm">{errorMsg}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#3498db] text-white rounded-lg font-medium hover:bg-[#2980b9] transition-colors"
                  >
                    {loading ? "Verifying..." : "Verify Code"}
                  </button>

                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setRequires2FA(false);
                        setTotpCode("");
                        setTempToken("");
                        setErrorMsg(null);
                      }}
                      className="text-sm text-[#3498db] hover:text-[#2980b9] transition-colors"
                    >
                      Back to login
                    </button>
                  </div>
                </form>
              ) : (
                <form
                  className="space-y-6"
                  autoComplete="off"
                  onSubmit={handleLogin}
                >
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                    Email Address
                  </label>

                  <div className="relative">
                    <input
                      type="email"
                      autoComplete="off"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none pl-12"
                      placeholder="you@example.com"
                    />
                    <Mail className="absolute left-4 top-3 w-5 h-5 text-gray-500" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-gray-700 dark:text-gray-300 font-medium">
                      Password
                    </label>

                    <button
                      type="button"
                      className="text-sm text-[#3498db] hover:text-[#2980b9] transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      autoComplete="new-password"
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none pl-12 pr-10"
                      placeholder="Enter your password"
                    />
                    <Key className="absolute left-4 top-3 w-5 h-5 text-gray-400 dark:text-gray-500" />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
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
                    <p className="text-[#e74c3c] text-sm">{errorMsg}</p>
                  </div>
                )}


                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#3498db] text-white rounded-lg font-medium hover:bg-[#2980b9] transition-colors"
                >
                  {loading ? "Signing In..." : "Sign In"}
                </button>

                <div className="text-center text-gray-600 dark:text-gray-400 text-sm">
                  By signing in, you agree to our{" "}
                  <a href="#" className="text-[#3498db] hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-[#3498db] hover:underline">
                    Privacy Policy
                  </a>
                </div>

                <div className="border-t border-gray-700 pt-6">
                  <h4 className="text-gray-600 dark:text-gray-400 font-medium mb-3 text-center">
                    Demo Accounts (To be removed in production)
                  </h4>

                  <div className="grid gap-2">
                    {demoAccounts.map((account, index) => (
                      <button
                        type="button"
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
              </form>
              )}
            </div>

            <div className="space-y-8">
              <div className="bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-2xl">
                <div className="flex items-start mb-6">
                  <div className="p-3 bg-gradient-to-br from-[#3498db] to-[#2ecc71] rounded-xl mr-4">
                    <Lock className="w-8 h-8 text-white" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Secure Access
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Your files are protected with military-grade encryption.
                      Sign in to access your secure file storage and sharing
                      platform.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-xl">
                    <div className="text-[#2ecc71] font-bold text-2xl mb-1">
                      24/7
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                      Access Available
                    </div>
                  </div>

                  <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-xl">
                    <div className="text-[#f1c40f] font-bold text-2xl mb-1">
                      100%
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                      Encrypted
                    </div>
                  </div>

                  <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-xl">
                    <div className="text-[#9b59b6] font-bold text-2xl mb-1">
                      Zero
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                      Knowledge Access
                    </div>
                  </div>

                  <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-xl">
                    <div className="text-[#e74c3c] font-bold text-2xl mb-1">
                      256-bit
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                      AES Encryption
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {featureCards.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:scale-105 cursor-pointer group"
                    style={{ borderTopColor: feature.color }}
                  >
                    <div
                      className="p-3 rounded-lg mb-4 inline-block group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: `${feature.color}20` }}
                    >
                      <div style={{ color: feature.color }}>{feature.icon}</div>
                    </div>

                    <h4 className="text-gray-900 dark:text-white font-bold mb-2">
                      {feature.title}
                    </h4>

                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-white/70 dark:bg-gray-800/30 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-gray-900 dark:text-white font-bold mb-4">
                  SecureShare at a Glance
                </h4>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Active Users
                    </span>
                    <span className="text-gray-900 dark:text-white font-bold">
                      500K+
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Files Secured
                    </span>
                    <span className="text-gray-900 dark:text-white font-bold">
                      10M+
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Uptime
                    </span>
                    <span className="text-[#2ecc71] font-bold">99.9%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Support Response
                    </span>
                    <span className="text-[#f1c40f] font-bold">
                      Under 1 hour
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-gray-600 dark:text-gray-500 text-sm">
          <p>
            © 2024 SecureShare. All access is logged and monitored for security
            purposes.
          </p>
          <p className="mt-1 text-gray-500 dark:text-gray-600">
            Your security is our top priority.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Login;