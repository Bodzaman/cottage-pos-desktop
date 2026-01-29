/**
 * UndoToast - Custom toast component for undo actions
 *
 * Features:
 * - Slide-in animation from bottom
 * - Progress bar showing timeout
 * - Undo button with hover state
 * - Auto-dismiss after duration
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Undo2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PremiumTheme } from 'utils/premiumTheme';

interface UndoToastProps {
  /** Item name that was removed */
  itemName: string;
  /** Number of items removed (for batch undo) */
  itemCount?: number;
  /** Callback when undo is clicked */
  onUndo: () => void;
  /** Callback when dismissed */
  onDismiss: () => void;
  /** Duration before auto-dismiss (ms) */
  duration?: number;
}

export function UndoToast({
  itemName,
  itemCount = 1,
  onUndo,
  onDismiss,
  duration = 5000,
}: UndoToastProps) {
  const [progress, setProgress] = useState(100);

  // Progress bar countdown
  useEffect(() => {
    const interval = 50; // Update every 50ms
    const decrement = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev - decrement;
        if (next <= 0) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [duration, onDismiss]);

  // Handle undo click
  const handleUndo = () => {
    onUndo();
  };

  // Handle dismiss click
  const handleDismiss = () => {
    onDismiss();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg max-w-sm"
      style={{
        backgroundColor: PremiumTheme.colors.dark[800],
        border: `1px solid ${PremiumTheme.colors.border.medium}`,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: PremiumTheme.colors.burgundy[500] + '30',
        }}
      >
        <Undo2
          className="w-4 h-4"
          style={{ color: PremiumTheme.colors.burgundy[400] }}
        />
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{ color: PremiumTheme.colors.text.primary }}
        >
          {itemCount > 1 ? `${itemCount} items removed` : `${itemName} removed`}
        </p>

        {/* Progress bar */}
        <div
          className="h-0.5 mt-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: PremiumTheme.colors.dark[700] }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              backgroundColor: PremiumTheme.colors.burgundy[400],
            }}
            transition={{ duration: 0.05, ease: 'linear' }}
          />
        </div>
      </div>

      {/* Undo button */}
      <Button
        size="sm"
        variant="outline"
        onClick={handleUndo}
        className="h-8 px-3 text-xs font-semibold"
        style={{
          borderColor: PremiumTheme.colors.burgundy[500],
          color: PremiumTheme.colors.burgundy[400],
          backgroundColor: 'transparent',
        }}
      >
        Undo
      </Button>

      {/* Dismiss button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDismiss}
        className="h-6 w-6 flex-shrink-0"
        style={{ color: PremiumTheme.colors.text.muted }}
      >
        <X className="w-3.5 h-3.5" />
      </Button>
    </motion.div>
  );
}

export default UndoToast;
