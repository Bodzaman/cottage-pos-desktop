import React from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import { PremiumTheme } from 'utils/premiumTheme';

interface ThinkingMessageSkeletonProps {
  botAvatar?: string;
  botName?: string;
  className?: string;
}

/**
 * Traditional thinking state component for chatbot
 * Shows avatar with breathing glow + "thinking..." animated dots
 * Appears when AI is processing before streaming begins
 */
export function ThinkingMessageSkeleton({ 
  botAvatar, 
  botName = 'Uncle Raj',
  className = '' 
}: ThinkingMessageSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex items-start space-x-3 ${className}`}
    >
      {/* Avatar with Breathing Glow Effect */}
      <div className="flex-shrink-0 mt-1 relative">
        {/* Animated Glow Ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: [
              `0 0 8px ${PremiumTheme.colors.burgundy[500]}50`,
              `0 0 25px ${PremiumTheme.colors.burgundy[500]}90`,
              `0 0 8px ${PremiumTheme.colors.burgundy[500]}50`,
            ],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Avatar Image */}
        {botAvatar ? (
          <img 
            src={botAvatar} 
            alt={botName}
            className="w-7 h-7 rounded-full object-cover relative z-10"
          />
        ) : (
          <div 
            className="w-7 h-7 rounded-full flex items-center justify-center relative z-10"
            style={{ backgroundColor: PremiumTheme.colors.burgundy[500] }}
          >
            <Bot className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Thinking Message with Animated Dots */}
      <div className="flex items-center space-x-1 mt-1">
        <span className="text-sm text-gray-400">
          {botName} is thinking
        </span>
        <div className="flex space-x-1">
          {[0, 1, 2].map((index) => (
            <motion.span
              key={index}
              className="text-sm text-gray-400"
              animate={{
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: index * 0.2,
              }}
            >
              .
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
