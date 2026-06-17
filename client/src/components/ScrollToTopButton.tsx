import React, { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { calculateScrollPercentage, animateScrollTo } from "../utils/scroll";

interface ScrollToTopButtonProps {
  threshold?: number;
  duration?: number;
  showProgress?: boolean;
  ariaLabel?: string;
}

const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({
  threshold = 300,
  duration = 500,
  showProgress = true,
  ariaLabel = "Scroll to top",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const cancelScrollRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setIsVisible(scrollY > threshold);

      if (showProgress) {
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        setScrollProgress(calculateScrollPercentage(scrollY, docHeight, winHeight));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Run initially to capture initial state
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (cancelScrollRef.current) {
        cancelScrollRef.current();
      }
    };
  }, [threshold, showProgress]);

  const handleScrollToTop = () => {
    // Cancel any ongoing scroll animations first
    if (cancelScrollRef.current) {
      cancelScrollRef.current();
    }
    
    // Start custom animation
    cancelScrollRef.current = animateScrollTo(0, duration, () => {
      cancelScrollRef.current = null;
    });
  };

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - scrollProgress * circumference;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          onClick={handleScrollToTop}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center p-0.5 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-lg shadow-[#3498db]/10 dark:shadow-black/40 hover:shadow-xl hover:shadow-[#3498db]/20 transition-shadow focus:outline-none focus:ring-2 focus:ring-[#3498db] focus:ring-offset-2 dark:focus:ring-offset-gray-900 cursor-pointer select-none group"
          aria-label={ariaLabel}
          title={ariaLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={showProgress ? Math.round(scrollProgress * 100) : undefined}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          {showProgress ? (
            <div className="relative w-12 h-12 flex items-center justify-center">
              {/* SVG Circular Progress Ring */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 48 48">
                {/* Track circle */}
                <circle
                  cx="24"
                  cy="24"
                  r={radius}
                  className="stroke-gray-200/50 dark:stroke-gray-700/50"
                  strokeWidth="3.5"
                  fill="none"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="24"
                  cy="24"
                  r={radius}
                  className="stroke-[#3498db]"
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.1, ease: "easeOut" }}
                />
              </svg>
              {/* Inner Icon */}
              <span className="relative z-10 text-gray-700 dark:text-gray-200 group-hover:text-[#3498db] transition-colors duration-200">
                <ArrowUp className="w-5 h-5 stroke-[2.5]" />
              </span>
            </div>
          ) : (
            <div className="w-12 h-12 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:text-[#3498db] transition-colors duration-200">
              <ArrowUp className="w-5 h-5 stroke-[2.5]" />
            </div>
          )}
          
          {/* Screen Reader Progress text */}
          {showProgress && (
            <span className="sr-only">
              Scroll progress: {Math.round(scrollProgress * 100)}%
            </span>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTopButton;