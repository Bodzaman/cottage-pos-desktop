/**
 * POSOnlineStatusControl
 *
 * Staff control for pausing/resuming online orders from the POS interface.
 * Shows current status and allows setting custom messages for customers.
 *
 * Features:
 * - Toggle switch to pause/resume online orders
 * - Visual status indicator (green/red dot)
 * - Custom message input when orders are paused
 * - Loading state during updates
 */

import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, Loader2, Check, X } from 'lucide-react';
import { usePOSStatusControl } from '../hooks/usePOSStatusControl';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

interface POSOnlineStatusControlProps {
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function POSOnlineStatusControl({
  compact = false,
  className = '',
}: POSOnlineStatusControlProps) {
  const {
    isOnline,
    isAcceptingOrders,
    manualAcceptingOrders,
    customMessage,
    isLoading,
    isUpdating,
    updateStatus,
  } = usePOSStatusControl();

  // Local state for the custom message input
  const [localMessage, setLocalMessage] = useState(customMessage || '');
  const [showMessageInput, setShowMessageInput] = useState(false);

  // Sync local message with server value when it changes
  useEffect(() => {
    if (customMessage !== undefined) {
      setLocalMessage(customMessage || '');
    }
  }, [customMessage]);

  // Handle toggle
  const handleToggle = async (checked: boolean) => {
    if (checked) {
      // Resuming orders - clear message
      await updateStatus(true, null);
      setShowMessageInput(false);
      setLocalMessage('');
    } else {
      // Pausing orders - show message input
      setShowMessageInput(true);
    }
  };

  // Handle saving the paused state with message
  const handleSavePaused = async () => {
    await updateStatus(false, localMessage || null);
    setShowMessageInput(false);
  };

  // Handle canceling the pause
  const handleCancelPause = () => {
    setShowMessageInput(false);
    setLocalMessage(customMessage || '');
  };

  // Determine display state - use manual value for toggle (staff control)
  const isCurrentlyAccepting = manualAcceptingOrders && !showMessageInput;
  const isPOSOffline = !isOnline;

  // Compact mode - just a small indicator
  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className={`w-2 h-2 rounded-full ${
            isPOSOffline
              ? 'bg-gray-500'
              : isCurrentlyAccepting
              ? 'bg-green-500'
              : 'bg-red-500'
          } ${isLoading ? 'animate-pulse' : ''}`}
        />
        <span className="text-xs text-white/60">
          {isPOSOffline ? 'Offline' : isCurrentlyAccepting ? 'Online' : 'Paused'}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg
        transition-all duration-300
        ${isPOSOffline
          ? 'bg-gray-500/10 border border-gray-500/30'
          : isCurrentlyAccepting
          ? 'bg-green-500/10 border border-green-500/30'
          : 'bg-red-500/10 border border-red-500/30'
        }
        ${className}
      `}
    >
      {/* Status indicator */}
      <div className="flex items-center gap-2">
        {isLoading || isUpdating ? (
          <Loader2 className="w-4 h-4 text-white/60 animate-spin" />
        ) : isPOSOffline ? (
          <WifiOff className="w-4 h-4 text-gray-400" />
        ) : isCurrentlyAccepting ? (
          <Wifi className="w-4 h-4 text-green-400" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-400" />
        )}

        <span className="text-xs text-white/70 whitespace-nowrap">
          Online Orders
        </span>
      </div>

      {/* Toggle switch - always enabled for manual control */}
      <Switch
        checked={isCurrentlyAccepting}
        onCheckedChange={handleToggle}
        disabled={isUpdating || isLoading}
        className={`
          ${isCurrentlyAccepting ? 'data-[state=checked]:bg-green-500' : 'data-[state=unchecked]:bg-red-500'}
        `}
      />

      {/* Message input section (shown when pausing) */}
      <AnimatePresence>
        {showMessageInput && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 overflow-hidden"
          >
            <Input
              type="text"
              placeholder="Message (e.g., Back in 10 min)"
              value={localMessage}
              onChange={(e) => setLocalMessage(e.target.value)}
              className="w-44 h-7 text-xs bg-black/30 border-white/20 text-white placeholder:text-white/40"
              disabled={isUpdating}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSavePaused();
                if (e.key === 'Escape') handleCancelPause();
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSavePaused}
              disabled={isUpdating}
              className="h-7 w-7 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/20"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancelPause}
              disabled={isUpdating}
              className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show current message when paused (and not editing) */}
      {!isCurrentlyAccepting && !showMessageInput && customMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2"
        >
          <span className="text-xs text-red-300/80 italic truncate max-w-32">
            {customMessage}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowMessageInput(true)}
            className="h-6 px-2 text-xs text-white/50 hover:text-white hover:bg-white/10"
          >
            Edit
          </Button>
        </motion.div>
      )}

      {/* POS Offline warning */}
      {isPOSOffline && (
        <span className="text-xs text-gray-400 italic">
          POS Offline
        </span>
      )}
    </div>
  );
}

export default POSOnlineStatusControl;
