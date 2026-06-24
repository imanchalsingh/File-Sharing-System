import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, LogOut } from "lucide-react";

interface SessionTimeoutProps {
  onLogout: () => void;
  timeoutMinutes?: number;
  warningMinutes?: number;
}

const SessionTimeout: React.FC<SessionTimeoutProps> = ({
  onLogout,
  timeoutMinutes = 30,
  warningMinutes = 1,
}) => {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(warningMinutes * 60);
  
  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = warningMinutes * 60 * 1000;
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    // Only update localStorage at most once every second to avoid performance issues
    const now = Date.now();
    const lastActivity = parseInt(localStorage.getItem("lastActivity") || "0", 10);
    
    if (now - lastActivity > 1000) {
      localStorage.setItem("lastActivity", now.toString());
    }
    
    if (showWarning) {
      setShowWarning(false);
      setRemainingSeconds(warningMinutes * 60);
    }
  }, [showWarning, warningMinutes]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("lastActivity");
    onLogout();
  }, [onLogout]);

  useEffect(() => {
    // Initialize activity tracker only if it doesn't exist to prevent overriding cross-tab state
    if (!localStorage.getItem("lastActivity")) {
      localStorage.setItem("lastActivity", Date.now().toString());
    }

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    const handleActivity = () => resetTimer();

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimer]);

  useEffect(() => {
    const checkInactivity = setInterval(() => {
      let lastActivity = parseInt(localStorage.getItem("lastActivity") || "0", 10);
      
      // Handle corrupted or missing localStorage data
      if (isNaN(lastActivity) || lastActivity === 0) {
        lastActivity = Date.now();
        localStorage.setItem("lastActivity", lastActivity.toString());
      }
      
      const idleTime = Date.now() - lastActivity;

      if (idleTime >= timeoutMs) {
        handleLogout();
      } else if (idleTime >= timeoutMs - warningMs && !showWarning) {
        setShowWarning(true);
        setRemainingSeconds(Math.ceil((timeoutMs - idleTime) / 1000));
      } else if (idleTime < timeoutMs - warningMs && showWarning) {
        // Active in another tab
        setShowWarning(false);
      }
    }, 1000);

    return () => {
      clearInterval(checkInactivity);
    };
  }, [timeoutMs, warningMs, handleLogout, showWarning]);

  // Handle countdown
  useEffect(() => {
    if (showWarning) {
      countdownRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      const currentCountdown = countdownRef.current;
      if (currentCountdown) clearInterval(currentCountdown);
    };
  }, [showWarning, handleLogout]);

  // If user dismisses warning
  const stayLoggedIn = () => {
    resetTimer();
  };

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-yellow-500/30 overflow-hidden"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <div className="p-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-yellow-500/10 rounded-full mb-6">
                <Clock className="w-8 h-8 text-yellow-500 animate-pulse" />
              </div>
              
              <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
                Session Expiring Soon
              </h2>
              
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                You have been inactive for a while. For your security, you will be automatically logged out in:
              </p>
              
              <div className="flex justify-center items-center gap-2 mb-8">
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 font-mono text-2xl font-bold text-[#e74c3c]">
                  {Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, '0')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Logout Now
                </button>
                <button
                  onClick={stayLoggedIn}
                  className="w-full py-2.5 rounded-xl text-white bg-gradient-to-r from-[#3498db] to-[#2ecc71] hover:shadow-lg hover:shadow-blue-500/25 transition-all font-medium"
                >
                  Stay Logged In
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SessionTimeout;
