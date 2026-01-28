import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SessionTimeoutWarningProps {
  isVisible: boolean;
  message: string;
  timeRemainingMs: number;
  canExtend: boolean;
  onExtend: () => void;
  onDismiss: () => void;
}

export function SessionTimeoutWarning({
  isVisible,
  message,
  timeRemainingMs,
  canExtend,
  onExtend,
  onDismiss
}: SessionTimeoutWarningProps) {
  const minutes = Math.floor(timeRemainingMs / 60000);
  const seconds = Math.floor((timeRemainingMs % 60000) / 1000);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-orange-900/90 backdrop-blur-sm rounded-lg px-4 py-3 border border-orange-500/30 shadow-lg max-w-sm"
        >
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-orange-100 font-medium">{message}</p>
              {timeRemainingMs > 0 && (
                <p className="text-xs text-orange-300 mt-1">
                  Time remaining: {minutes}:{seconds.toString().padStart(2, '0')}
                </p>
              )}
              {canExtend && (
                <Button
                  onClick={onExtend}
                  size="sm"
                  className="mt-2 bg-orange-500 hover:bg-orange-600 text-white text-xs"
                >
                  Continue Session
                </Button>
              )}
            </div>
            <button onClick={onDismiss} className="text-orange-400 hover:text-orange-200">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
