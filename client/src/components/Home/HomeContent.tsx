import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaCloudUploadAlt,
  FaLock,
  FaGlobe,
  FaMobileAlt,
  FaBolt,
  FaUserFriends,
  FaDatabase,
  FaShieldAlt,
  FaShareAlt,
} from "react-icons/fa";
import img from "./fss.png";

const HomeContent: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col lg:flex-row items-center justify-between px-6 sm:px-10 lg:px-20 gap-10 bg-gray-50 bg-gradient-to-br from-white via-[#5c7de060] to-[#84a0f466]  rounded-2xl shadow-md overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 z-0 opacity-20 " />

        {/* Left - Headline + CTA */}
        <motion.div
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex-1 text-center lg:text-left z-10 max-w-xl flex flex-col items-center lg:items-start"
        >
          {/* Headline */}
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight order-1"
            style={{ fontFamily: "Notable"  }}
          >
            <span className="bg-gradient-to-l from-[#032282] to-[#4270fa] bg-clip-text text-transparent drop-shadow-md">
              Share Files.
            </span>
            <br />
            <span className="text-gray-800">Fast. Secure.</span>
          </motion.h1>

          {/* Paragraph */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-4 text-base sm:text-lg md:text-xl text-gray-600 max-w-md order-2"
          >
            Upload, access, and share your files instantly. No complications —
            just speed and security.
          </motion.p>

          {/* Image (mobile order 3, desktop stays on right) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
            className="flex justify-center w-full lg:hidden order-3"
          >
            <motion.img
              src='{img}'
              alt="File Sharing Illustration"
              className="w-[220px] sm:w-[280px] md:w-[360px] drop-shadow-2xl"
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            />
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-6 sm:mt-8 order-4"
          >
            <button
              onClick={() => navigate("/home/myfiles")}
              className="px-6 sm:px-8 py-2.5 sm:py-2 rounded-full cursor-pointer bg-[#4a6bd1] hover:bg-[#3158cd] text-white text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              🚀 Get Started
            </button>
          </motion.div>
        </motion.div>

        {/* Right Image (hidden on mobile, visible on desktop) */}
        <motion.div
          initial={{ opacity: 0, x: 80, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
          className="flex-1 justify-center z-10 hidden lg:flex"
        >
          <motion.img
            src={img}
            alt="File Sharing Illustration"
            className="w-[380px] lg:w-[450px] drop-shadow-2xl"
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Scroll Down Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-gray-500 text-sm sm:text-base order-5"
        >
          <div className="animate-bounce">⬇ Scroll Down</div>
        </motion.div>
      </section>

      {/* Section 1 - Features */}
      <section className="py-16 px-6 md:px-16 bg-gray-50 mt-7 shadow-lg rounded-2xl bg-gradient-to-br from-white via-[#4a6cd160] to-[#4a6cd196] ">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
          Why Choose Our File Sharing System?
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              icon: <FaCloudUploadAlt className="text-[#496ace] text-4xl mb-3" />,
              title: "Fast Uploads",
              desc: "Upload files quickly with optimized cloud servers.",
            },
            {
              icon: <FaLock className="text-[#496ace] text-4xl mb-3" />,
              title: "End-to-End Security",
              desc: "Your files are fully encrypted for maximum safety.",
            },
            {
              icon: <FaGlobe className="text-[#496ace] text-4xl mb-3" />,
              title: "Access Anywhere",
              desc: "Share & access files anytime, anywhere in the world.",
            },
          ].map((f, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition text-center"
            >
              {f.icon}
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {f.title}
              </h3>
              <p className="text-gray-600">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12 mt-7">
          Powerful Features to Make Sharing Easy
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              icon: <FaMobileAlt className="text-[#496ace] text-4xl mb-3" />,
              title: "Mobile Friendly",
              desc: "Upload & manage files directly from your phone.",
            },
            {
              icon: <FaBolt className="text-[#496ace] text-4xl mb-3" />,
              title: "Lightning Fast",
              desc: "Experience smooth transfers without delays.",
            },
            {
              icon: <FaUserFriends className="text-[#496ace] text-4xl mb-3" />,
              title: "Team Collaboration",
              desc: "Share files with your team effortlessly.",
            },
          ].map((f, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              viewport={{ once: true }}
              className="bg-gray-50 p-6 rounded-2xl shadow-md hover:shadow-xl transition text-center"
            >
              {f.icon}
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {f.title}
              </h3>
              <p className="text-gray-600">{f.desc}</p>
            </motion.div>
          ))}
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12 mt-7">
          Security & Reliability at Core
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              icon: <FaDatabase className="text-[#496ace] text-4xl mb-3" />,
              title: "Cloud Storage",
              desc: "Store unlimited files with reliable servers.",
            },
            {
              icon: <FaShieldAlt className="text-[#496ace] text-4xl mb-3" />,
              title: "Data Protection",
              desc: "We prioritize your data privacy & protection.",
            },
            {
              icon: <FaShareAlt className="text-[#496ace] text-4xl mb-3" />,
              title: "One-Click Sharing",
              desc: "Generate secure links to share instantly.",
            },
          ].map((f, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition text-center"
            >
              {f.icon}
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {f.title}
              </h3>
              <p className="text-gray-600">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomeContent;
