import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Lock,
  Cloud,
  Shield,
  CheckCircle,
  Sun,
  Moon,
  Globe,
  Users,
  FileText,
  AlertCircle,
  Scale,
  Ban,
  RefreshCw,
} from "lucide-react";

const TermsOfService: React.FC = () => {
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
      title: "1. Acceptance of Terms",
      color: "#3498db",
      icon: <CheckCircle className="w-5 h-5" />,
      text: "By creating an account or accessing SecureShare in any way, you confirm that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. If you are using SecureShare on behalf of an organization, you represent that you have authority to bind that organization to these terms. If you do not agree with any part of these terms, you must not use the platform.",
    },
    {
      title: "2. Permitted Use",
      color: "#2ecc71",
      icon: <Shield className="w-5 h-5" />,
      text: "You may use SecureShare to upload, store, share, and manage files for lawful purposes only. Permitted uses include personal file storage, professional collaboration, document distribution, and secure file sharing with clients or team members. You must not use the platform to distribute malware, spam, or harmful software; store or share illegal content including pirated material or content that violates third-party intellectual property; conduct phishing attacks or any form of fraud; or attempt to reverse-engineer, hack, or disrupt the platform.",
    },
    {
      title: "3. Account Responsibility",
      color: "#9b59b6",
      icon: <Users className="w-5 h-5" />,
      text: "You are solely responsible for maintaining the security and confidentiality of your account credentials. This includes choosing a strong password, not sharing your password with others, logging out of shared devices, and enabling any available security features. All activity that occurs under your account — whether by you or a third party — is your responsibility. You must notify us immediately if you suspect unauthorized access. We are not liable for any loss resulting from unauthorized use of your account.",
    },
    {
      title: "4. Content & Intellectual Property",
      color: "#f39c12",
      icon: <FileText className="w-5 h-5" />,
      text: "You retain full ownership of all files and content you upload to SecureShare. By uploading content, you grant us a limited, non-exclusive, royalty-free license to store, process, and deliver your content solely for the purpose of providing the service. This license terminates when you delete the content or close your account. You represent that you have all necessary rights to upload and share the content you provide, and that doing so does not infringe any third-party intellectual property, privacy, or other rights.",
    },
    {
      title: "5. Prohibited Content",
      color: "#e74c3c",
      icon: <Ban className="w-5 h-5" />,
      text: "The following types of content are strictly prohibited on SecureShare: illegal content including child sexual abuse material, content that promotes violence or terrorism, copyrighted material you do not have rights to distribute, malware, viruses, or malicious code of any kind, content designed to deceive or defraud users, and content that violates any applicable law or regulation. Violations will result in immediate account termination and may be reported to relevant authorities.",
    },
    {
      title: "6. Service Availability",
      color: "#1abc9c",
      icon: <RefreshCw className="w-5 h-5" />,
      text: "We strive to maintain 99.9% uptime for SecureShare and provide reliable, fast service. However, we do not guarantee uninterrupted access and may experience scheduled maintenance, unexpected outages, or service degradation. We will make reasonable efforts to notify users of planned maintenance in advance. We are not liable for any loss or damage resulting from service interruptions. We reserve the right to modify, suspend, or discontinue any part of the service at any time.",
    },
    {
      title: "7. Termination",
      color: "#9b59b6",
      icon: <AlertCircle className="w-5 h-5" />,
      text: "You may close your account at any time through your account settings. Upon closure, your data will be deleted within 30 days. We reserve the right to suspend or permanently terminate your account without prior notice if you violate these Terms of Service, engage in abusive behavior toward other users or our staff, use the service in a way that could harm others or the platform, or if we are required to do so by law. Upon termination, your right to access the service ceases immediately.",
    },
    {
      title: "8. Limitation of Liability",
      color: "#e74c3c",
      icon: <Scale className="w-5 h-5" />,
      text: 'SecureShare is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that the service will be error-free, secure, or continuously available. To the maximum extent permitted by law, SecureShare and its team shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data, revenue, or profits, arising from your use of or inability to use the service.',
    },
    {
      title: "9. Changes to Terms",
      color: "#3498db",
      icon: <FileText className="w-5 h-5" />,
      text: "We may update these Terms of Service from time to time to reflect changes in our practices, legal requirements, or service features. We will notify you of significant changes via email or a prominent notice on the platform at least 14 days before the changes take effect. Your continued use of SecureShare after changes take effect constitutes your acceptance of the updated terms. If you do not agree with updated terms, you must stop using the service.",
    },
    {
      title: "10. Governing Law",
      color: "#2ecc71",
      icon: <Globe className="w-5 h-5" />,
      text: "These Terms of Service shall be governed by and construed in accordance with applicable laws. Any disputes arising from these terms or your use of SecureShare shall be resolved through good-faith negotiation first. If a resolution cannot be reached, disputes shall be submitted to binding arbitration. You agree that any legal proceedings will be conducted on an individual basis and not as part of a class action. Nothing in these terms limits your rights as a consumer under applicable consumer protection laws.",
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
        <div className="inline-flex p-4 rounded-2xl bg-[#9b59b6]/10 mb-6">
          <Lock className="w-12 h-12 text-[#9b59b6]" />
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-4">
          Terms of{" "}
          <span className="bg-gradient-to-r from-[#9b59b6] via-[#3498db] to-[#2ecc71] bg-clip-text text-transparent">
            Service
          </span>
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto mb-3">
          Please read these terms carefully before using SecureShare. They govern your use of our platform.
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Last updated: June 2026
        </p>
      </section>

      {/* Stats bar */}
      <div className="container mx-auto px-6 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { value: "10 Sections", label: "Clear Terms", color: "#3498db" },
            { value: "14 days", label: "Change Notice", color: "#2ecc71" },
            { value: "30 days", label: "Data Deletion", color: "#9b59b6" },
            { value: "Fair Use", label: "Policy", color: "#f39c12" },
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
                  <Link to="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-[#9b59b6] transition-colors duration-200">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-[#9b59b6] font-medium transition-colors duration-200">
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

export default TermsOfService;