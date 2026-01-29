import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Search, ShoppingCart, MessageSquare } from 'lucide-react';

type ThinkingVariant = 'dots' | 'skeleton' | 'pulse';
type ThinkingContext = 'searching' | 'cart' | 'thinking' | 'general';

interface ThinkingIndicatorProps {
  variant?: ThinkingVariant;
  context?: ThinkingContext;
  message?: string;
  agentName?: string;
}

/**
 * ThinkingIndicator - Contextual loading states for AI
 *
 * Variants:
 * - dots: Three bouncing dots (good for voice)
 * - skeleton: Animated skeleton lines (good for chat)
 * - pulse: Pulsing icon (good for compact spaces)
 */
export function ThinkingIndicator({
  variant = 'dots',
  context = 'general',
  message,
  agentName = 'AI',
}: ThinkingIndicatorProps) {
  const getIcon = () => {
    switch (context) {
      case 'searching':
        return <Search className="h-4 w-4" />;
      case 'cart':
        return <ShoppingCart className="h-4 w-4" />;
      case 'thinking':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  const getMessage = () => {
    if (message) return message;
    switch (context) {
      case 'searching':
        return 'Searching menu...';
      case 'cart':
        return 'Updating cart...';
      case 'thinking':
        return `${agentName} is thinking...`;
      default:
        return 'Processing...';
    }
  };

  if (variant === 'dots') {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-orange-500"
              animate={{
                y: [0, -6, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
        <span className="text-sm">{getMessage()}</span>
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className="space-y-2 p-3">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
          {getIcon()}
          <span>{getMessage()}</span>
        </div>
        <motion.div
          className="h-4 bg-muted rounded"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ width: '80%' }}
        />
        <motion.div
          className="h-4 bg-muted rounded"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          style={{ width: '60%' }}
        />
        <motion.div
          className="h-4 bg-muted rounded"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          style={{ width: '70%' }}
        />
      </div>
    );
  }

  // pulse variant
  return (
    <motion.div
      className="flex items-center gap-2 text-muted-foreground"
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      {getIcon()}
      <span className="text-sm">{getMessage()}</span>
    </motion.div>
  );
}

export default ThinkingIndicator;
