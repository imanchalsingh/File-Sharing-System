import React from "react";
import { motion } from "framer-motion";

const HomeContent: React.FC = () => {
  return (
    <div className="h-[90%] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 60 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="max-w-3xl text-center bg-white/70 backdrop-blur-md p-10 rounded-3xl shadow-xl"
      >
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-4xl md:text-5xl font-extrabold text-red-500 mb-4"
        >
          Share Files. Fast. Secure.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-lg md:text-xl text-gray-600 mb-6"
        >
          Upload, access, and share your documents with ease and security. No
          complications. Just a smooth file-sharing experience.
        </motion.p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="bg-red-500 hover:bg-red-600 text-white text-lg px-5 py-2 rounded-full font-semibold shadow-md transition duration-300 cursor-pointer"
        >
          Get Started
        </motion.button>
      </motion.div>
    </div>
  );
};

export default HomeContent;
