import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Shield,
  Zap,
  Users,
  Globe,
  Smartphone,
  Database,
  Share2,
  Lock,
  BarChart3,
  Cloud,
  CheckCircle,
} from "lucide-react";

const HomeContent: React.FC = () => {
  const navigate = useNavigate();

  const heroFeatures = [
    {
      icon: <Shield className="w-5 h-5" />,
      text: "End-to-End Encryption",
      color: "#3498db",
    },
    {
      icon: <Zap className="w-5 h-5" />,
      text: "Lightning Fast Transfers",
      color: "#2ecc71",
    },
    {
      icon: <Globe className="w-5 h-5" />,
      text: "Global Access",
      color: "#9b59b6",
    },
  ];

  const mainFeatures = [
    {
      icon: <Upload className="w-8 h-8" />,
      title: "Instant Upload",
      description:
        "Upload files at blazing speeds with our optimized infrastructure",
      color: "#3498db",
      stats: "Upload speeds up to 1GB/s",
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: "Military Security",
      description: "256-bit AES encryption with zero-knowledge architecture",
      color: "#2ecc71",
      stats: "256-bit encryption",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Team Collaboration",
      description: "Share files with teams and control permissions granularly",
      color: "#9b59b6",
      stats: "Unlimited team members",
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Global CDN",
      description:
        "Access your files from anywhere with our global content network",
      color: "#f39c12",
      stats: "100+ locations",
    },
  ];

  const advancedFeatures = [
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Mobile Ready",
      description: "Full mobile support with native apps for iOS and Android",
      color: "#e74c3c",
    },
    {
      icon: <Database className="w-8 h-8" />,
      title: "Unlimited Storage",
      description: "Scale your storage needs without limitations",
      color: "#3498db",
    },
    {
      icon: <Share2 className="w-8 h-8" />,
      title: "Easy Sharing",
      description:
        "Generate secure links with password protection and expiration",
      color: "#2ecc71",
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Advanced Analytics",
      description:
        "Track downloads, views, and engagement with detailed reports",
      color: "#f39c12",
    },
  ];

  const securityFeatures = [
    "End-to-end encryption",
    "Two-factor authentication",
    "Zero-knowledge architecture",
    "GDPR & HIPAA compliant",
    "Regular security audits",
    "Real-time threat detection",
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-[100vh] flex flex-col lg:flex-row items-center justify-between px-4 sm:px-8 lg:px-12 gap-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden border border-gray-700">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, #3498db 2px, transparent 2px)`,
              backgroundSize: "50px 50px",
            }}
          ></div>
        </div>

        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex-1 text-center lg:text-left z-10 max-w-2xl"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#3498db]/20 to-[#2ecc71]/20 rounded-full border border-gray-700 mb-6"
          >
            <Shield className="w-4 h-4 mr-2 text-[#3498db]" />
            <span className="text-sm text-gray-300">
              Trusted by 500K+ users
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
          >
            <span className="bg-gradient-to-r from-[#3498db] via-[#9b59b6] to-[#2ecc71] bg-clip-text text-transparent">
              Secure File
            </span>
            <br />
            <span className="text-white">Sharing Made</span>
            <br />
            <span className="bg-gradient-to-r from-[#f39c12] via-[#e74c3c] to-[#3498db] bg-clip-text text-transparent">
              Simple & Fast
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-6 text-lg sm:text-xl text-gray-300 max-w-xl"
          >
            Transfer files securely with enterprise-grade encryption. Share
            large files, collaborate with teams, and protect your data with
            military-grade security.
          </motion.p>

          {/* Feature List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-8 flex flex-wrap gap-4"
          >
            {heroFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-center px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700"
              >
                <div className="mr-2" style={{ color: feature.color }}>
                  {feature.icon}
                </div>
                <span className="text-sm text-gray-300">{feature.text}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-10 flex flex-col sm:flex-row gap-4"
          >
            <button
              onClick={() => navigate("/home/myfiles")}
              className="px-8 py-3 bg-gradient-to-r from-[#3498db] to-[#2ecc71] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex items-center justify-center"
            >
              <Cloud className="w-5 h-5 mr-2" />
              Get Started Free
            </button>
          </motion.div>
        </motion.div>

        {/* Right Illustration */}
        <motion.div
          initial={{ opacity: 0, x: 80, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
          className="flex-1 flex justify-center z-10"
        >
          <div className="relative">
            {/* Animated Background Circle */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#3498db] to-[#2ecc71] rounded-full opacity-20 blur-3xl animate-pulse"></div>

            {/* File Upload Animation */}
            <div className="relative bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700 shadow-2xl">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-4 border-[#3498db] flex items-center justify-center">
                    <Upload className="w-12 h-12 text-[#3498db]" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#2ecc71] animate-spin"></div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">
                    project_final.zip • 2.4 GB
                  </span>
                  <span className="text-[#2ecc71]">85%</span>
                </div>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#3498db] to-[#2ecc71] rounded-full"
                    style={{ width: "85%" }}
                  ></div>
                </div>
                <p className="text-sm text-gray-400">
                  Encrypting and uploading securely...
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Main Features */}
      <section className="py-16 px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Everything You Need for{" "}
            <span className="bg-gradient-to-r from-[#3498db] to-[#2ecc71] bg-clip-text text-transparent">
              Secure File Sharing
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Powerful features designed for modern teams and individuals
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {mainFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:-translate-y-2 cursor-pointer group"
            >
              <div
                className="p-3 rounded-xl mb-4 inline-block group-hover:scale-110 transition-transform"
                style={{ backgroundColor: `${feature.color}20` }}
              >
                <div style={{ color: feature.color }}>{feature.icon}</div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400 mb-4">{feature.description}</p>
              <div
                className="text-sm font-medium"
                style={{ color: feature.color }}
              >
                {feature.stats}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-16 px-4 sm:px-8 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Advanced Features for{" "}
              <span className="bg-gradient-to-r from-[#9b59b6] to-[#3498db] bg-clip-text text-transparent">
                Power Users
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Take your file sharing to the next level with premium features
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {advancedFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-900/50 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors duration-300"
              >
                <div className="flex items-start">
                  <div
                    className="p-3 rounded-lg mr-4 flex-shrink-0"
                    style={{ backgroundColor: `${feature.color}20` }}
                  >
                    <div style={{ color: feature.color }}>{feature.icon}</div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-16 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="p-3 bg-[#3498db]/20 rounded-xl inline-block mb-6">
                <Shield className="w-8 h-8 text-[#3498db]" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Enterprise-Grade{" "}
                <span className="bg-gradient-to-r from-[#3498db] to-[#2ecc71] bg-clip-text text-transparent">
                  Security
                </span>
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Your files are protected with military-grade encryption and
                secure global infrastructure. We follow industry best practices
                to ensure your data stays safe.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {securityFeatures.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[#2ecc71] mr-3 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700"
            >
              <h3 className="text-2xl font-bold text-white mb-6 text-center">
                Security Statistics
              </h3>

              <div className="space-y-6">
                {[
                  {
                    label: "Encryption Strength",
                    value: "256-bit AES",
                    color: "#3498db",
                    percentage: 100,
                  },
                  {
                    label: "Uptime SLA",
                    value: "99.9%",
                    color: "#2ecc71",
                    percentage: 99.9,
                  },
                  {
                    label: "Threat Detection",
                    value: "Real-time",
                    color: "#f39c12",
                    percentage: 100,
                  },
                  {
                    label: "Data Centers",
                    value: "Global",
                    color: "#9b59b6",
                    percentage: 100,
                  },
                ].map((stat, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">{stat.label}</span>
                      <span
                        className="font-medium"
                        style={{ color: stat.color }}
                      >
                        {stat.value}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${stat.percentage}%`,
                          backgroundColor: stat.color,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-700">
                <div className="flex items-center justify-center text-gray-400 text-sm">
                  <Lock className="w-4 h-4 mr-2" />
                  All security features included in every plan
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-8 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <Cloud className="w-16 h-16 mx-auto mb-6 text-[#3498db]" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Share Files Securely?
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Join millions of users who trust us with their files. Get started
            with 10GB free storage.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/home/myfiles")}
              className="px-8 py-3 bg-gradient-to-r from-[#3498db] to-[#2ecc71] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              Start Free Trial
            </button>
          </div>

          <p className="mt-8 text-gray-500 text-sm">
            No credit card required • 10GB free storage • All security features
            included
          </p>
        </motion.div>
      </section>
    </div>
  );
};

export default HomeContent;
