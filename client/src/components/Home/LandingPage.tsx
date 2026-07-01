import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  Shield,
  Zap,
  Users,
  CheckCircle,
  BarChart,
  Cloud,
  Lock,
  Globe,
  Sun,
  Moon,
  X,
  File,
  Menu,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  progress: number;
  done: boolean;
}

const formatSize = (bytes: number): string => {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + " GB";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " B";
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [theme, setTheme] = useState(
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setUploadProgress((prev) => (prev >= 100 ? 0 : prev + 10));
    }, 500);
    return () => clearInterval(interval);
  }, []);

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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    e.preventDefault();
    closeMobileMenu();
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  const simulateUpload = (file: File) => {
    const id = Math.random().toString(36).slice(2);
    const newFile: UploadedFile = {
      id,
      name: file.name,
      size: formatSize(file.size),
      progress: 0,
      done: false,
    };
    setUploadedFiles((prev) => [...prev, newFile]);

    const speed = Math.random() * 15 + 8;
    const interval = setInterval(() => {
      setUploadedFiles((prev) =>
        prev.map((f) => {
          if (f.id !== id) return f;
          const next = Math.min(f.progress + speed, 100);
          return { ...f, progress: next, done: next >= 100 };
        }),
      );
    }, 300);

    setTimeout(() => clearInterval(interval), 5000);
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(simulateUpload);
  }, []);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Lightning Fast",
      description:
        "Upload and download files at blazing speeds with our optimized infrastructure",
      color: "#f1c40f",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Military Grade Security",
      description: "End-to-end encryption with zero-knowledge architecture",
      color: "#3498db",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Team Collaboration",
      description: "Share files with teams and control permissions granularly",
      color: "#9b59b6",
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Global Access",
      description: "Access your files from anywhere in the world",
      color: "#2ecc71",
    },
  ];

  const stats = [
    { value: "10M+", label: "Files Shared", color: "#1abc9c" },
    { value: "500K+", label: "Active Users", color: "#3498db" },
    { value: "99.9%", label: "Uptime", color: "#f39c12" },
    { value: "256-bit", label: "Encryption", color: "#9b59b6" },
  ];

  const plans = [
    {
      name: "Free",
      price: "$0",
      features: [
        "5GB Storage",
        "2GB File Size",
        "Basic Sharing",
        "7-Day History",
      ],
      color: "#34495e",
      accent: "#3498db",
    },
    {
      name: "Pro",
      price: "$9.99",
      popular: true,
      features: [
        "100GB Storage",
        "10GB File Size",
        "Advanced Sharing",
        "30-Day History",
        "Password Protection",
      ],
      color: "#2c3e50",
      accent: "#f1c40f",
    },
    {
      name: "Business",
      price: "$29.99",
      features: [
        "1TB Storage",
        "50GB File Size",
        "Team Collaboration",
        "Unlimited History",
        "Custom Branding",
        "Priority Support",
      ],
      color: "#34495e",
      accent: "#e74c3c",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Navigation - FIXED: md se lg breakpoint par change kiya */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Cloud className="w-8 h-8 sm:w-10 sm:h-10 text-[#3498db]" />
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#3498db] to-[#2ecc71] bg-clip-text text-transparent">
                SecureShare
              </span>
            </div>

            {/* Desktop Navigation Links - lg breakpoint (1024px) */}
            <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
              <a
                href="#features"
                onClick={(e) => handleNavClick(e, "features")}
                className="text-gray-600 dark:text-gray-300 hover:text-[#3498db] dark:hover:text-[#3498db] transition-colors font-medium text-sm xl:text-base"
              >
                Features
              </a>
              <a
                href="#pricing"
                onClick={(e) => handleNavClick(e, "pricing")}
                className="text-gray-600 dark:text-gray-300 hover:text-[#3498db] dark:hover:text-[#3498db] transition-colors font-medium text-sm xl:text-base"
              >
                Pricing
              </a>
              <a
                href="#about"
                onClick={(e) => handleNavClick(e, "about")}
                className="text-gray-600 dark:text-gray-300 hover:text-[#3498db] dark:hover:text-[#3498db] transition-colors font-medium text-sm xl:text-base"
              >
                About
              </a>
              <a
                href="#contact"
                onClick={(e) => handleNavClick(e, "contact")}
                className="text-gray-600 dark:text-gray-300 hover:text-[#3498db] dark:hover:text-[#3498db] transition-colors font-medium text-sm xl:text-base"
              >
                Contact
              </a>
            </div>

            {/* Right side buttons */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 rounded-lg bg-gray-200 dark:bg-gray-700/50 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Desktop Buttons - Hidden on tablet and mobile */}
              <div className="hidden lg:flex items-center space-x-2 xl:space-x-3">
                <button
                  onClick={() => navigate("/login")}
                  className="px-3 xl:px-4 py-1.5 xl:py-2 text-[#3498db] hover:text-[#2980b9] transition-colors font-semibold text-sm xl:text-base"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="px-4 xl:px-6 py-1.5 xl:py-2 bg-gradient-to-r from-[#3498db] to-[#2ecc71] rounded-lg font-semibold hover:opacity-90 transition-opacity text-white text-sm xl:text-base whitespace-nowrap"
                >
                  Get Started
                </button>
              </div>

              {/* Mobile Menu Button - Shows below 1024px */}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-1.5 sm:p-2 rounded-lg bg-gray-200 dark:bg-gray-700/50 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <div
            className={`
              lg:hidden transition-all duration-300 ease-in-out overflow-hidden
              ${isMobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}
            `}
          >
            <div className="pt-3 pb-2 space-y-1 border-t border-gray-200 dark:border-gray-700 mt-3">
              <a
                href="#features"
                onClick={(e) => handleNavClick(e, "features")}
                className="block px-3 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
              >
                Features
              </a>
              <a
                href="#pricing"
                onClick={(e) => handleNavClick(e, "pricing")}
                className="block px-3 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
              >
                Pricing
              </a>
              <a
                href="#about"
                onClick={(e) => handleNavClick(e, "about")}
                className="block px-3 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
              >
                About
              </a>
              <a
                href="#contact"
                onClick={(e) => handleNavClick(e, "contact")}
                className="block px-3 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
              >
                Contact
              </a>
              <div className="flex flex-col space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                <button
                  onClick={() => {
                    closeMobileMenu();
                    navigate("/login");
                  }}
                  className="px-3 py-2.5 text-center text-[#3498db] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-semibold"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    closeMobileMenu();
                    navigate("/login");
                  }}
                  className="px-3 py-2.5 text-center bg-gradient-to-r from-[#3498db] to-[#2ecc71] rounded-lg font-semibold hover:opacity-90 transition-opacity text-white"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 cursor-default select-none">
          Secure File Sharing
          <span className="block bg-gradient-to-r from-[#3498db] via-[#9b59b6] to-[#2ecc71] bg-clip-text text-transparent">
            Made Simple
          </span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto">
          Transfer files securely with end-to-end encryption. Share large files,
          collaborate with teams, and protect your data with enterprise-grade
          security.
        </p>

        {/* Drag & Drop Upload Zone */}
        <div className="max-w-2xl mx-auto bg-white/80 dark:bg-gray-800 rounded-2xl p-8 mb-12 border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
          {/* Drop Zone */}
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 p-10 mb-6 flex flex-col items-center justify-center gap-4
              ${
                isDragging
                  ? "border-[#3498db] bg-[#3498db]/10 scale-[1.02]"
                  : "border-gray-300 dark:border-gray-600 hover:border-[#3498db] hover:bg-[#3498db]/5"
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {isDragging ? (
              <>
                <div className="w-16 h-16 rounded-full bg-[#3498db]/20 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-[#3498db] animate-bounce" />
                </div>
                <p className="text-[#3498db] font-semibold text-lg">
                  Drop your files here!
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <div>
                  <p className="text-gray-700 dark:text-gray-300 font-semibold text-lg">
                    Drag & drop files here
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    or{" "}
                    <span className="text-[#3498db] underline">
                      click to browse
                    </span>
                  </p>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Supports all file types • Max 2GB per file
                </p>
              </>
            )}
          </div>

          {/* File List */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-3 mb-6">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <File className="w-4 h-4 text-[#3498db] shrink-0" />
                      <span className="text-sm font-medium truncate max-w-[260px]">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                        {file.size}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {file.done ? (
                        <CheckCircle className="w-4 h-4 text-[#2ecc71]" />
                      ) : (
                        <span className="text-xs text-[#3498db]">
                          {Math.round(file.progress)}%
                        </span>
                      )}
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#3498db] to-[#2ecc71] transition-all duration-300 rounded-full"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Demo progress (shown when no files uploaded) */}
          {uploadedFiles.length === 0 && (
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>project_final.zip • 2.4 GB</span>
                <span className="text-[#2ecc71]">{uploadProgress}%</span>
              </div>
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#3498db] to-[#2ecc71] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Encrypting and uploading securely...
              </p>
            </div>
          )}

          <button
            onClick={() => navigate("/login")}
            className="mt-2 px-8 py-3 bg-gradient-to-r from-[#3498db] to-[#2980b9] rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity w-full text-white"
          >
            <Upload className="inline mr-2 w-5 h-5" />
            Upload Your Files Now
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 bg-white/80 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div
                className="text-3xl font-bold mb-2"
                style={{ color: stat.color }}
              >
                {stat.value}
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">
          Powerful Features
        </h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`p-8 rounded-2xl transition-all duration-300 hover:scale-105 cursor-pointer ${
                activeFeature === index
                  ? "border-2 bg-opacity-20"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              }`}
              style={{
                borderColor:
                  activeFeature === index ? feature.color : undefined,
                backgroundColor:
                  activeFeature === index ? `${feature.color}20` : undefined,
              }}
              onClick={() => setActiveFeature(index)}
            >
              <div className="flex items-center mb-6">
                <div
                  className="p-3 rounded-xl mr-4"
                  style={{
                    backgroundColor: `${feature.color}20`,
                    color: feature.color,
                  }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold">{feature.title}</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-16 max-w-2xl mx-auto">
          Choose the perfect plan for your needs. All plans include our core
          security features.
        </p>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-2xl p-8 relative hover:scale-105 ${
                plan.popular
                  ? "border-2"
                  : "border border-gray-200 dark:border-gray-700"
              }`}
              style={{
                borderColor: plan.popular ? plan.accent : "",
                backgroundColor: theme === "dark" ? "#1f2937" : "white",
              }}
            >
              {plan.popular && (
                <div
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-sm font-semibold text-gray-900"
                  style={{ backgroundColor: plan.accent }}
                >
                  MOST POPULAR
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-3 text-[#2ecc71]" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded-lg font-semibold transition-opacity hover:opacity-90 ${plan.popular ? "text-gray-900" : ""}`}
                style={{
                  backgroundColor: plan.popular
                    ? plan.accent
                    : theme === "dark"
                      ? "#4a5568"
                      : "#e2e8f0",
                  color: plan.popular
                    ? "#1a202c"
                    : theme === "dark"
                      ? "white"
                      : "black",
                }}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <Cloud className="w-20 h-20 mx-auto mb-6 text-[#3498db] animate-pulse" />
          <h2 className="text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-[#3498db] via-[#9b59b6] to-[#2ecc71] bg-clip-text text-transparent">
              About SecureShare
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
            SecureShare is a modern file-sharing platform built for individuals,
            teams, and organizations that demand speed, reliability, and
            security. Store, transfer, and collaborate on files with
            enterprise-grade protection and a seamless user experience.
          </p>
        </div>

        <div className="bg-gradient-to-r from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-10 border border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 mb-12">
          <h3 className="text-3xl font-bold text-center mb-4">Our Mission</h3>
          <p className="text-lg text-center text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            To make secure file sharing simple, accessible, and trustworthy by
            combining powerful collaboration tools with privacy-first
            architecture and enterprise-grade security.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            {
              icon: <Zap className="w-8 h-8" />,
              title: "Lightning Fast",
              description:
                "Optimized infrastructure ensures fast uploads and downloads.",
              color: "#f1c40f",
            },
            {
              icon: <Shield className="w-8 h-8" />,
              title: "Secure by Design",
              description:
                "Advanced encryption keeps your files protected at every step.",
              color: "#3498db",
            },
            {
              icon: <Users className="w-8 h-8" />,
              title: "Team Collaboration",
              description:
                "Share files securely and collaborate with your team in real time.",
              color: "#9b59b6",
            },
            {
              icon: <Globe className="w-8 h-8" />,
              title: "Global Access",
              description: "Access your files from anywhere, on any device.",
              color: "#2ecc71",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:border-gray-400 dark:hover:border-gray-600 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 cursor-pointer"
            >
              <div
                className="inline-flex p-3 rounded-xl mb-4 transition-transform duration-300 hover:scale-110"
                style={{
                  backgroundColor: `${feature.color}20`,
                  color: feature.color,
                }}
              >
                {feature.icon}
              </div>
              <h4 className="text-xl font-bold mb-2">{feature.title}</h4>
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center mb-6">
              <Lock className="w-7 h-7 mr-3 text-[#3498db]" />
              <h3 className="text-2xl font-bold">Security Highlights</h3>
            </div>
            <ul className="space-y-4">
              {[
                "End-to-end encryption",
                "256-bit AES security",
                "Zero-knowledge architecture",
                "Role-based access control",
                "Detailed activity monitoring",
                "Regular security audits",
              ].map((item, index) => (
                <li key={index} className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-[#2ecc71]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center mb-6">
              <Users className="w-7 h-7 mr-3 text-[#9b59b6]" />
              <h3 className="text-2xl font-bold">Why Choose SecureShare?</h3>
            </div>
            <ul className="space-y-4">
              {[
                "Simple and intuitive experience",
                "Fast and reliable file transfers",
                "Enterprise-grade protection",
                "Collaboration-friendly workflows",
                "Scalable for teams of all sizes",
                "Trusted by thousands worldwide",
              ].map((item, index) => (
                <li key={index} className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-[#3498db]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {[
            { value: "500K+", label: "Active Users", color: "#3498db" },
            { value: "10M+", label: "Files Shared", color: "#2ecc71" },
            { value: "99.9%", label: "Uptime", color: "#f39c12" },
            { value: "256-bit", label: "Encryption", color: "#9b59b6" },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 text-center shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer"
            >
              <div
                className="text-3xl font-bold mb-2"
                style={{ color: stat.color }}
              >
                {stat.value}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-[#3498db]/10 to-[#3498db]/5 rounded-2xl p-6 border border-[#3498db]/20 hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
            <Shield className="w-8 h-8 mb-4 text-[#3498db]" />
            <h4 className="text-xl font-bold mb-3">Privacy First</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Your data remains protected through strong encryption and
              privacy-focused infrastructure.
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#2ecc71]/10 to-[#2ecc71]/5 rounded-2xl p-6 border border-[#2ecc71]/20 hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
            <Users className="w-8 h-8 mb-4 text-[#2ecc71]" />
            <h4 className="text-xl font-bold mb-3">Built For Teams</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Empower collaboration with secure sharing, permissions, and
              centralized file management.
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#9b59b6]/10 to-[#9b59b6]/5 rounded-2xl p-6 border border-[#9b59b6]/20 hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
            <Globe className="w-8 h-8 mb-4 text-[#9b59b6]" />
            <h4 className="text-xl font-bold mb-3">Global Availability</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Access files securely from anywhere in the world with reliable
              infrastructure and high availability.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-r from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700">
          <h2 className="text-4xl font-bold mb-6">Ready to Share Securely?</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
            Join millions of users who trust us with their files. No credit card
            required to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-3 bg-gradient-to-r from-[#3498db] to-[#2ecc71] rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity text-white"
            >
              Start Free Trial
            </button>
            <button className="px-8 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
              Schedule a Demo
            </button>
          </div>
          <p className="mt-8 text-gray-600 dark:text-gray-400 text-sm">
            Free plan includes 5GB storage • 2GB file size limit • All security
            features
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-gradient-to-b from-transparent to-gray-100 dark:to-gray-950 mt-20">
        <div className="container mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <Cloud className="w-10 h-10 text-[#3498db]" />
                <span className="text-2xl font-bold bg-gradient-to-r from-[#3498db] to-[#2ecc71] bg-clip-text text-transparent">
                  SecureShare
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md mb-6">
                SecureShare provides fast, reliable, and secure file sharing for
                individuals, teams, and businesses. Built with privacy-first
                principles and enterprise-grade protection.
              </p>
              <div className="flex gap-4">
                <div className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="font-bold text-[#3498db]">500K+</div>
                  <div className="text-xs text-gray-500">Users</div>
                </div>
                <div className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="font-bold text-[#2ecc71]">10M+</div>
                  <div className="text-xs text-gray-500">Files Shared</div>
                </div>
                <div className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="font-bold text-[#9b59b6]">99.9%</div>
                  <div className="text-xs text-gray-500">Uptime</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4 text-[#3498db]">
                Product
              </h4>
              <ul className="space-y-3">
                {["Features", "Pricing", "Security", "API"].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-gray-600 dark:text-gray-400 hover:text-[#3498db] transition-colors duration-200"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4 text-[#2ecc71]">
                Company
              </h4>
              <ul className="space-y-3">
                {["About", "Blog", "Careers", "Contact"].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-gray-600 dark:text-gray-400 hover:text-[#2ecc71] transition-colors duration-200"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4 text-[#9b59b6]">
                Resources
              </h4>
              <ul className="space-y-3">
                {[
                  { label: "Privacy Policy", to: "/privacy" },
                  { label: "Terms of Service", to: "/terms" },
                  { label: "Help Center", to: "#" },
                  { label: "Documentation", to: "#" },
                ].map((item) => (
                  <li key={item.label}>
                    {item.to.startsWith("/") ? (
                      <Link
                        to={item.to}
                        className="text-gray-600 dark:text-gray-400 hover:text-[#9b59b6] transition-colors duration-200"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <a
                        href={item.to}
                        className="text-gray-600 dark:text-gray-400 hover:text-[#9b59b6] transition-colors duration-200"
                      >
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 my-10"></div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 dark:text-gray-500 text-sm text-center md:text-left">
              © 2024 SecureShare. All rights reserved. Secure file sharing made
              simple and secure.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <span className="flex items-center gap-2 text-[#2ecc71]">
                <Shield className="w-4 h-4" />
                Enterprise Security
              </span>
              <span className="flex items-center gap-2 text-[#3498db]">
                <Lock className="w-4 h-4" />
                256-bit Encryption
              </span>
              <span className="flex items-center gap-2 text-[#9b59b6]">
                <Globe className="w-4 h-4" />
                Global Access
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
