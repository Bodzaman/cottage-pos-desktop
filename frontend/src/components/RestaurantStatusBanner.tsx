/**
 * RestaurantStatusBanner
 *
 * Shows real-time restaurant availability status to customers on the ordering page.
 * Polls the POS heartbeat system to detect when the restaurant is online/offline.
 *
 * States:
 * - Green: "Now Taking Orders" - POS is online and accepting orders
 * - Yellow: "Opens at X:XX" - Restaurant is closed (future: pre-order option)
 * - Red: "Temporarily Unavailable" - POS is offline (no heartbeat)
 *
 * Industry Standard: Similar to Uber Eats, DoorDash, Just Eat availability indicators.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Clock, AlertTriangle } from 'lucide-react';
import { useRestaurantAvailability } from '../hooks/useRestaurantAvailability';

// ============================================================================
// TYPES
// ============================================================================

interface RestaurantStatusBannerProps {
  /** Whether to show the banner (default: true) */
  show?: boolean;
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Sticky positioning for mobile scroll (default: false) */
  sticky?: boolean;
  /** Custom className for styling */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function RestaurantStatusBanner({
  show = true,
  compact = false,
  sticky = false,
  className = '',
}: RestaurantStatusBannerProps) {
  const {
    isOnline,
    isAcceptingOrders,
    customMessage,
    isLoading,
    error,
  } = useRestaurantAvailability();

  // Don't show if disabled
  if (!show) {
    return null;
  }

  // Determine banner state
  const getStatusConfig = () => {
    // Loading state
    if (isLoading) {
      return {
        type: 'loading' as const,
        icon: <Clock className="h-4 w-4 animate-pulse" />,
        text: 'Checking availability...',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-600 dark:text-gray-400',
        borderColor: 'border-gray-200 dark:border-gray-700',
      };
    }

    // Error state (fallback to assuming available)
    if (error) {
      return {
        type: 'warning' as const,
        icon: <AlertTriangle className="h-4 w-4" />,
        text: 'Unable to verify restaurant status',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        textColor: 'text-yellow-700 dark:text-yellow-400',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
      };
    }

    // POS offline - not accepting orders
    if (!isOnline || !isAcceptingOrders) {
      return {
        type: 'unavailable' as const,
        icon: <WifiOff className="h-4 w-4" />,
        text: customMessage || 'Restaurant is temporarily unavailable. Please try again shortly.',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        textColor: 'text-red-700 dark:text-red-400',
        borderColor: 'border-red-200 dark:border-red-800',
      };
    }

    // All good - accepting orders
    return {
      type: 'available' as const,
      icon: <Wifi className="h-4 w-4" />,
      text: 'Now Taking Orders',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-700 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-800',
    };
  };

  const config = getStatusConfig();

  // Compact mode - just a badge
  if (compact) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={config.type}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`
            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
            ${config.bgColor} ${config.textColor}
            ${className}
          `}
        >
          {config.icon}
          <span>{config.type === 'available' ? 'Open' : config.type === 'unavailable' ? 'Closed' : 'Checking...'}</span>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Full banner mode
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={config.type}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`
          w-full px-4 py-3 border-b
          ${config.bgColor} ${config.borderColor}
          ${sticky ? 'sticky top-0 z-30' : ''}
          ${className}
        `}
      >
        <div className="flex items-center justify-center gap-2">
          <span className={config.textColor}>
            {config.icon}
          </span>
          <span className={`text-sm font-medium ${config.textColor}`}>
            {config.text}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Inline status indicator for use in headers or navigation.
 * Just shows a colored dot with optional label.
 */
export function RestaurantStatusIndicator({
  showLabel = false,
  className = '',
}: {
  showLabel?: boolean;
  className?: string;
}) {
  const { isOnline, isAcceptingOrders, isLoading } = useRestaurantAvailability();

  const getConfig = () => {
    if (isLoading) {
      return { color: 'bg-gray-400', label: 'Checking...' };
    }
    if (!isOnline || !isAcceptingOrders) {
      return { color: 'bg-red-500', label: 'Closed' };
    }
    return { color: 'bg-green-500', label: 'Open' };
  };

  const config = getConfig();

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span
        className={`w-2 h-2 rounded-full ${config.color} ${isLoading ? 'animate-pulse' : ''}`}
      />
      {showLabel && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {config.label}
        </span>
      )}
    </div>
  );
}

export default RestaurantStatusBanner;
