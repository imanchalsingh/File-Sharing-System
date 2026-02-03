import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setUploadProgress((prev) => (prev >= 100 ? 0 : prev + 10));
    }, 500);
    return () => clearInterval(interval);
  }, []);

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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cloud className="w-10 h-10 text-[#3498db]" />
            <span className="text-2xl font-bold bg-gradient-to-r from-[#3498db] to-[#2ecc71] bg-clip-text text-transparent">
              SecureShare
            </span>
          </div>
          <div className="hidden md:flex space-x-8">
            <a
              href="#features"
              className="hover:text-[#3498db] transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="hover:text-[#3498db] transition-colors"
            >
              Pricing
            </a>
            <a href="#about" className="hover:text-[#3498db] transition-colors">
              About
            </a>
            <a
              href="#contact"
              className="hover:text-[#3498db] transition-colors"
            >
              Contact
            </a>
          </div>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 text-[#3498db] hover:text-[#2980b9] transition-colors">
              Sign In
            </button>
            <button className="px-6 py-2 bg-gradient-to-r from-[#3498db] to-[#2ecc71] rounded-lg font-semibold hover:opacity-90 transition-opacity">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          Secure File Sharing
          <span className="block bg-gradient-to-r from-[#3498db] via-[#9b59b6] to-[#2ecc71] bg-clip-text text-transparent">
            Made Simple
          </span>
        </h1>
        <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
          Transfer files securely with end-to-end encryption. Share large files,
          collaborate with teams, and protect your data with enterprise-grade
          security.
        </p>

        {/* Upload Demo */}
        <div className="max-w-2xl mx-auto bg-gray-800 rounded-2xl p-8 mb-12 border border-gray-700">
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
              <span>project_final.zip • 2.4 GB</span>
              <span className="text-[#2ecc71]">{uploadProgress}%</span>
            </div>
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#3498db] to-[#2ecc71] transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-400">
              Encrypting and uploading securely...
            </p>
          </div>

          <button onClick={()=>{
            navigate('/home')
          }} className="mt-8 px-8 py-3 bg-gradient-to-r from-[#3498db] to-[#2980b9] rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity w-full">
            <Upload className="inline mr-2 w-5 h-5" />
            Upload Your Files Now
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-6 bg-gray-800 rounded-xl">
              <div
                className="text-3xl font-bold mb-2"
                style={{ color: stat.color }}
              >
                {stat.value}
              </div>
              <div className="text-gray-300">{stat.label}</div>
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
                activeFeature === index ? "border-2" : "border border-gray-700"
              }`}
              style={{
                borderColor: activeFeature === index ? feature.color : "",
                backgroundColor:
                  activeFeature === index ? `${feature.color}20` : "#1f2937",
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
              <p className="text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Feature Details */}
        <div className="mt-16 p-8 bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl border border-gray-700">
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex-1 min-w-[300px]">
              <h3
                className="text-3xl font-bold mb-6"
                style={{ color: features[activeFeature].color }}
              >
                {features[activeFeature].title}
              </h3>
              <p className="text-gray-300 mb-6">
                Experience the power of our file sharing platform with
                industry-leading features designed for modern teams.
              </p>
              <ul className="space-y-3">
                {[
                  "Real-time collaboration",
                  "Advanced permission controls",
                  "Automatic versioning",
                  "Detailed analytics",
                ].map((item, i) => (
                  <li key={i} className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-3 text-[#2ecc71]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 min-w-[300px] mt-8 md:mt-0">
              <div className="bg-gray-800 p-6 rounded-xl">
                <BarChart className="w-12 h-12 mx-auto mb-4 text-[#3498db]" />
                <div className="space-y-4">
                  {[70, 85, 60, 95].map((height, i) => (
                    <div key={i} className="flex items-center">
                      <div className="w-24 text-gray-400">Q{i + 1} 2024</div>
                      <div className="flex-1 h-6 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${height}%`,
                            background: `linear-gradient(90deg, ${features[activeFeature].color}, ${features[(activeFeature + 1) % features.length].color})`,
                          }}
                        ></div>
                      </div>
                      <div className="w-12 text-right">{height}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">
          Choose the perfect plan for your needs. All plans include our core
          security features.
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-2xl p-8 relative transition-transform hover:scale-105 ${
                plan.popular ? "border-2" : "border border-gray-700"
              }`}
              style={{
                borderColor: plan.popular ? plan.accent : "",
                backgroundColor: plan.color,
              }}
            >
              {plan.popular && (
                <div
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: plan.accent }}
                >
                  MOST POPULAR
                </div>
              )}

              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-gray-400">/month</span>
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
                className={`w-full py-3 rounded-lg font-semibold transition-opacity hover:opacity-90 ${
                  plan.popular ? "text-white" : ""
                }`}
                style={{
                  backgroundColor: plan.popular ? plan.accent : "#4a5568",
                  color: plan.popular ? "#1a202c" : "white",
                }}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Security Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <Lock className="w-20 h-20 mx-auto mb-8 text-[#3498db]" />
          <h2 className="text-4xl font-bold mb-6">Enterprise-Grade Security</h2>
          <p className="text-xl text-gray-300 mb-12">
            Your files are protected with military-grade encryption and secure
            global infrastructure.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: "🔒", title: "End-to-End Encryption", color: "#3498db" },
              { icon: "🌐", title: "Global CDN", color: "#2ecc71" },
              { icon: "📊", title: "Activity Logs", color: "#f39c12" },
              { icon: "👥", title: "Role-Based Access", color: "#9b59b6" },
            ].map((item, index) => (
              <div key={index} className="p-6 bg-gray-800 rounded-xl">
                <div className="text-3xl mb-4">{item.icon}</div>
                <div className="font-semibold" style={{ color: item.color }}>
                  {item.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700">
          <h2 className="text-4xl font-bold mb-6">Ready to Share Securely?</h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join millions of users who trust us with their files. No credit card
            required to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-gradient-to-r from-[#3498db] to-[#2ecc71] rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity">
              Start Free Trial
            </button>
            <button className="px-8 py-3 border-2 border-gray-600 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors">
              Schedule a Demo
            </button>
          </div>
          <p className="mt-8 text-gray-400 text-sm">
            Free plan includes 5GB storage • 2GB file size limit • All security
            features
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-6 md:mb-0">
              <Cloud className="w-8 h-8 text-[#3498db]" />
              <span className="text-xl font-bold">SecureShare</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h4 className="font-semibold mb-4 text-[#3498db]">Product</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      API
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-[#2ecc71]">Company</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Careers
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-[#f39c12]">Legal</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Terms
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Security
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-[#9b59b6]">Connect</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Twitter
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      LinkedIn
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      GitHub
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
            © 2024 SecureShare. All rights reserved. File sharing made secure
            and simple.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
