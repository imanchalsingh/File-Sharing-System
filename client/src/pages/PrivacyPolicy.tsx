import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  Cloud,
  Lock,
  CheckCircle,
  Sun,
  Moon,
  Globe,
  Users,
  BarChart,
  Eye,
  FileText,
  AlertCircle,
  Mail,
} from "lucide-react";

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();
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

  const sections = [
    {
      title: "1. Information We Collect",
      color: "#3498db",
      icon: <Eye className="w-5 h-5" />,
      text: "We collect information you provide directly when you create an account — including your full name, email address, and password. When you use our service, we also collect files you upload, sharing activity, download history, and file metadata such as names, sizes, and types. Additionally, we automatically gather technical data including your IP address, browser type and version, operating system, device identifiers, and usage patterns to help us improve the platform.",
    },
    {
      title: "2. How We Use Your Information",
      color: "#2ecc71",
      icon: <CheckCircle className="w-5 h-5" />,
      text: "Your data is used solely to provide, maintain, and improve SecureShare. This includes authenticating your identity, processing file uploads and downloads, managing sharing permissions, sending important service notifications, and generating anonymized analytics to enhance performance. We will never sell, rent, or trade your personal information to third parties. We may share data with trusted service providers (such as Cloudinary for file storage) strictly to operate our platform under confidentiality agreements.",
    },
    {
      title: "3. File Storage & Management",
      color: "#9b59b6",
      icon: <Cloud className="w-5 h-5" />,
      text: "All files you upload are stored securely via Cloudinary, a leading cloud storage provider. Files shared privately are only accessible through authenticated, time-limited links. Public files are accessible to anyone with the link. You retain full ownership of all content you upload. We do not access, analyze, or use your file contents for any purpose other than delivering the service. You may delete your files at any time, and upon deletion they are permanently removed from our servers within 30 days.",
    },
    {
      title: "4. Data Security",
      color: "#f39c12",
      icon: <Lock className="w-5 h-5" />,
      text: "We implement industry-standard security measures to protect your data. All data in transit is encrypted using TLS 1.3. Authentication is handled via JWT tokens with secure expiration policies. We employ 256-bit AES encryption for sensitive data at rest. Access to production systems is restricted to authorized personnel only, and all access is logged and audited. Despite these measures, no internet transmission is 100% secure — we encourage you to use strong passwords and enable any available security features.",
    },
    {
      title: "5. Cookies & Tracking",
      color: "#1abc9c",
      icon: <BarChart className="w-5 h-5" />,
      text: "We use essential cookies to maintain your login session and remember your preferences such as theme settings. We may use analytics cookies to understand how users interact with our platform in aggregate. We do not use advertising or tracking cookies. You can configure your browser to refuse cookies, though this may affect your ability to log in and use certain features. We respect Do Not Track (DNT) browser signals.",
    },
    {
      title: "6. Data Retention",
      color: "#e74c3c",
      icon: <FileText className="w-5 h-5" />,
      text: "We retain your account data for as long as your account remains active. If you delete your account, we will permanently remove your personal data within 30 days, except where retention is required by law. Files you delete are removed from active storage immediately and purged from backups within 30 days. Shared link records may be retained for up to 90 days for security and abuse prevention purposes.",
    },
    {
      title: "7. Your Rights",
      color: "#3498db",
      icon: <Users className="w-5 h-5" />,
      text: "You have the right to access all personal data we hold about you, request corrections to inaccurate data, request deletion of your data, export your data in a portable format, and withdraw consent for optional data processing at any time. To exercise any of these rights, contact us through the homepage. We will respond to all requests within 30 days. If you are located in the EU or UK, you have additional rights under GDPR including the right to lodge a complaint with your local data protection authority.",
    },
    {
      title: "8. Third-Party Services",
      color: "#9b59b6",
      icon: <Globe className="w-5 h-5" />,
      text: "We use Cloudinary for file storage and delivery. Their privacy practices are governed by Cloudinary's own Privacy Policy. We may also use monitoring services to track platform health and error reporting. These services receive only the minimum data necessary to perform their function. We do not integrate third-party advertising networks, social media trackers, or any service that would share your personal data for marketing purposes.",
    },
    {
      title: "9. Contact Us",
      color: "#2ecc71",
      icon: <Mail className="w-5 h-5" />,
      text: "If you have any questions, concerns, or requests related to this Privacy Policy or your personal data, please reach out via the Contact section on our homepage. For data deletion requests or security-related concerns, please mark your message as urgent. We are committed to resolving all privacy concerns promptly and transparently, and aim to respond within 48 hours.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">

      {/* Navbar - exact match to LandingPage */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cloud className="w-10 h-10 text-[#3498db]" />
            <span className="text-2xl font-bold bg-gradient-to-r from-[#3498db] to-[#2ecc71] bg-clip-text text-transparent">
              SecureShare
            </span>
          </div>

          <div className="hidden md:flex space-x-8">
            <Link to="/" className="hover:text-[#3498db] transition-colors font-medium">Features</Link>
            <Link to="/" className="hover:text-[#3498db] transition-colors font-medium">Pricing</Link>
            <Link to="/" className="hover:text-[#3498db] transition-colors font-medium">About</Link>
            <Link to="/" className="hover:text-[#3498db] transition-colors font-medium">Contact</Link>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 text-[#3498db] hover:text-[#2980b9] transition-colors font-semibold"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-2 bg-gradient-to-r from-[#3498db] to-[#2ecc71] rounded-lg font-semibold hover:opacity-90 transition-opacity text-white"
            >
              Get Started
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700/50 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors ml-4"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-6 py-16 text-center">
        <div className="inline-flex p-4 rounded-2xl bg-[#3498db]/10 mb-6">
          <Shield className="w-12 h-12 text-[#3498db]" />
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-4">
          Privacy{" "}
          <span className="bg-gradient-to-r from-[#3498db] via-[#9b59b6] to-[#2ecc71] bg-clip-text text-transparent">
            Policy
          </span>
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto mb-3">
          We take your privacy seriously. Here's exactly how we collect, use, and protect your data.
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Last updated: June 2026
        </p>
      </section>

      {/* Stats bar */}
      <div className="container mx-auto px-6 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { value: "256-bit", label: "AES Encryption", color: "#3498db" },
            { value: "0", label: "Data Sold", color: "#2ecc71" },
            { value: "30 days", label: "Deletion SLA", color: "#9b59b6" },
            { value: "GDPR", label: "Compliant", color: "#f39c12" },
          ].map((stat, i) => (
            <div key={i} className="text-center p-4 bg-white/80 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="text-xl font-bold mb-1" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-gray-600 dark:text-gray-300 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Content sections */}
      <section className="container mx-auto px-6 pb-20 max-w-4xl">
        <div className="space-y-6">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:-translate-y-1 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: `${section.color}20`, color: section.color }}
                >
                  {section.icon}
                </div>
                <h2 className="text-xl font-bold">{section.title}</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {section.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer - exact match to LandingPage */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-gradient-to-b from-transparent to-gray-100 dark:to-gray-950 mt-20">
        <div className="container mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <Cloud className="w-10 h-10 text-[#3498db]" />
                <span className="text-2xl font-bold bg-gradient-to-r from-[#3498db] to-[#2ecc71] bg-clip-text text-transparent">
                  SecureShare
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md mb-6">
                SecureShare provides fast, reliable, and secure file sharing for individuals, teams, and businesses. Built with privacy-first principles and enterprise-grade protection.
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

            {/* Company */}
            <div>
              <h4 className="font-semibold text-lg mb-4 text-[#2ecc71]">Company</h4>
              <ul className="space-y-3">
                {["About", "Blog", "Careers", "Contact"].map((item) => (
                  <li key={item}>
                    <Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-[#2ecc71] transition-colors duration-200">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold text-lg mb-4 text-[#9b59b6]">Resources</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/privacy" className="text-[#9b59b6] font-medium transition-colors duration-200">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-gray-600 dark:text-gray-400 hover:text-[#9b59b6] transition-colors duration-200">
                    Terms of Service
                  </Link>
                </li>
                {["Help Center", "Documentation"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#9b59b6] transition-colors duration-200">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 my-10"></div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 dark:text-gray-500 text-sm text-center md:text-left">
              © 2024 SecureShare. All rights reserved. Secure file sharing made simple and secure.
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

export default PrivacyPolicy;