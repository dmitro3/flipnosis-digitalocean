import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const XPNotification = ({ message, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 500);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25,
            duration: 0.3 
          }}
          className="fixed top-4 right-4 z-50 max-w-sm"
        >
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg shadow-2xl border border-purple-400">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-lg font-bold mb-2">
                  🎉 XP Awarded!
                </div>
                <div className="text-sm leading-relaxed">
                  {message}
                </div>
              </div>
              <button
                onClick={handleClose}
                className="ml-4 text-white/70 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            {/* Progress bar */}
            <div className="mt-3 bg-white/20 rounded-full h-1">
              <motion.div
                className="bg-yellow-400 h-1 rounded-full"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: duration / 1000, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// XP Notification Manager
export const XPNotificationManager = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message }]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Expose addNotification globally
  useEffect(() => {
    window.showXPNotification = addNotification;
    return () => {
      delete window.showXPNotification;
    };
  }, []);

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-4">
      {notifications.map((notification, index) => (
        <motion.div
          key={notification.id}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25,
            delay: index * 0.1 
          }}
        >
          <XPNotification
            message={notification.message}
            onClose={() => removeNotification(notification.id)}
          />
        </motion.div>
      ))}
    </div>
  );
};

// Hook to use XP notifications
export const useXPNotifications = () => {
  const showNotification = (message) => {
    if (window.showXPNotification) {
      window.showXPNotification(message);
    }
  };

  return { showNotification };
};

export default XPNotification; 