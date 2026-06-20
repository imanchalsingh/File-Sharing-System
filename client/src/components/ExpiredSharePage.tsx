import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Home, AlertTriangle, Cloud, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
} as const;

const iconVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: { duration: 0.6, ease: 'easeOut', delay: 0.2 },
  },
} as const;

const ExpiredSharePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700 overflow-hidden"
      >
        {/* Top gradient accent */}
        <div className="h-1.5 bg-gradient-to-r from-[#e74c3c] via-[#f39c12] to-[#e74c3c]" />

        <div className="p-8 text-center">
          {/* Branding */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Cloud className="w-6 h-6 text-[#3498db]" />
            <span className="text-lg font-bold text-white">SecureShare</span>
          </div>

          {/* Icon */}
          <motion.div
            variants={iconVariants}
            initial="hidden"
            animate="visible"
            className="relative w-20 h-20 mx-auto mb-6"
          >
            <div className="w-full h-full rounded-full bg-[#e74c3c]/10 border border-[#e74c3c]/20 flex items-center justify-center">
              <Clock className="w-10 h-10 text-[#e74c3c]" />
            </div>
            {/* X overlay accent */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#e74c3c] flex items-center justify-center shadow-lg shadow-[#e74c3c]/30">
              <span className="text-white text-xs font-bold">✕</span>
            </div>
          </motion.div>

          {/* Title */}
          <h1
            id="expired-page-title"
            className="text-2xl font-bold text-white mb-3"
          >
            This Link Has Expired
          </h1>

          {/* Description */}
          <p className="text-gray-400 text-sm leading-relaxed mb-2">
            The share link you're trying to access has expired or is no longer
            available.
          </p>

          {/* Suggestion */}
          <div className="flex items-start gap-2.5 bg-[#f39c12]/10 border border-[#f39c12]/20 rounded-xl px-4 py-3 mt-6 mb-8">
            <AlertTriangle className="w-4 h-4 text-[#f39c12] mt-0.5 flex-shrink-0" />
            <p className="text-sm text-[#f39c12]/90 text-left">
              Contact the file owner for a new link.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              id="expired-page-home-link"
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl
                bg-gradient-to-r from-[#3498db] to-[#2ecc71]
                text-white font-medium text-sm
                hover:shadow-lg hover:shadow-[#3498db]/25
                hover:scale-[1.02] active:scale-[0.98]
                transition-all duration-200"
            >
              <Home className="w-4 h-4" />
              Go to Home
            </Link>
            <Link
              id="expired-page-login-link"
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl
                border border-gray-600 hover:border-gray-500
                text-gray-300 hover:text-white font-medium text-sm
                hover:bg-white/5
                transition-all duration-200"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-gray-700/50 text-center">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} SecureShare • Secure file sharing
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ExpiredSharePage;
