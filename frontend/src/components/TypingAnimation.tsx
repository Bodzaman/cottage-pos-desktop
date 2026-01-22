import React from 'react';
import { motion } from 'framer-motion';

/**
 * Simple typing animation component for chat messages
 * Shows three bouncing dots to indicate AI is typing
 */
export const TypingAnimation: React.FC = () => {
  return (
    <div className="flex items-center space-x-1 p-2">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-2 h-2 bg-current rounded-full opacity-60"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: index * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
      <span className="ml-2 text-sm opacity-70">AI is typing...</span>
    </div>
  );
};

export default TypingAnimation;
