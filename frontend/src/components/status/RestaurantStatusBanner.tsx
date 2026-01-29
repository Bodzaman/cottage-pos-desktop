/**
 * RestaurantStatusBanner (Enhanced)
 *
 * Full-width banner showing restaurant availability status.
 * Enhanced version with countdown timer, opening hours, and better UX.
 *
 * Features:
 * - Countdown timer when < 1 hour to open
 * - "Opens at X:XX" with service name
 * - Today's hours display
 * - Animated transitions
 * - Multiple variants (full, slim, card)
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Clock, AlertTriangle, Utensils, X } from 'lucide-react';
import {
  useRestaurantStatusStore,
  useTimeUntilOpen,
} from 'utils/restaurantStatusStore';
import { CountdownTimer } from './CountdownTimer';
import { cn } from 'utils/cn';

// ============================================================================
// TYPES
// ============================================================================

type BannerVariant = 'full' | 'slim' | 'card';

interface RestaurantStatusBannerProps {
  /** Whether to show the banner (default: true) */
  show?: boolean;
  /** Banner variant: full (default), slim, or card */
  variant?: BannerVariant;
  /** Sticky positioning (default: false) */
  sticky?: boolean;
  /** Show countdown timer when closed */
  showCountdown?: boolean;
  /** Show today's hours */
  showHours?: boolean;
  /** Allow dismissing the banner (only for 'available' state) */
  dismissible?: boolean;
  /** Custom className */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function RestaurantStatusBanner({
  show = true,
  variant = 'full',
  sticky = false,
  showCountdown = true,
  showHours = false,
  dismissible = false,
  className,
}: RestaurantStatusBannerProps) {
  const {
    isOnline,
    isAcceptingOrders,
    customMessage,
    displayMessage,
    isLoading,
    error,
    currentService,
    todaysHours,
    nextServiceName,
    unavailableReason,
  } = useRestaurantStatusStore();

  const timeUntilOpen = useTimeUntilOpen();
  const [isDismissed, setIsDismissed] = React.useState(false);

  // Start polling when component mounts
  useEffect(() => {
    const store = useRestaurantStatusStore.getState();
    if (!store._isPolling) {
      store.startPolling();
    }
  }, []);

  // Reset dismissed state when status changes to unavailable
  useEffect(() => {
    if (!isAcceptingOrders) {
      setIsDismissed(false);
    }
  }, [isAcceptingOrders]);

  // Don't show if disabled or dismissed
  if (!show || (isDismissed && isAcceptingOrders)) {
    return null;
  }

  // Determine banner configuration
  const getStatusConfig = () => {
    // Loading state
    if (isLoading) {
      return {
        type: 'loading' as const,
        icon: <Clock className="h-4 w-4 animate-pulse" />,
        title: 'Checking availability...',
        message: null,
        bgColor: 'bg-gray-900/50',
        borderColor: 'border-white/10',
        iconColor: 'text-[#B7BDC6]',
        titleColor: 'text-[#B7BDC6]',
      };
    }

    // Error state
    if (error) {
      return {
        type: 'warning' as const,
        icon: <AlertTriangle className="h-4 w-4" />,
        title: 'Unable to verify status',
        message: 'Please refresh or try again',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        iconColor: 'text-amber-400',
        titleColor: 'text-amber-400',
      };
    }

    // POS offline - show countdown if available
    if (!isOnline && unavailableReason === 'pos_offline') {
      return {
        type: 'offline' as const,
        icon: <WifiOff className="h-4 w-4" />,
        title: 'Temporarily Unavailable',
        message: displayMessage || customMessage || 'Please try again shortly',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        iconColor: 'text-red-400',
        titleColor: 'text-red-400',
      };
    }

    // Outside hours - show countdown
    if (!isAcceptingOrders && (unavailableReason === 'outside_hours' || unavailableReason === 'closed_today')) {
      const serviceName = nextServiceName === 'lunch' ? 'Lunch' : nextServiceName === 'dinner' ? 'Dinner' : 'Orders';
      return {
        type: 'closed' as const,
        icon: <Clock className="h-4 w-4" />,
        title: timeUntilOpen ? `${serviceName} opens ${timeUntilOpen}` : 'Currently Closed',
        message: displayMessage || todaysHours ? `Today: ${todaysHours}` : null,
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        iconColor: 'text-amber-400',
        titleColor: 'text-amber-400',
      };
    }

    // Manual pause
    if (!isAcceptingOrders && unavailableReason === 'manual_pause') {
      return {
        type: 'paused' as const,
        icon: <Clock className="h-4 w-4" />,
        title: 'Orders Paused',
        message: customMessage || displayMessage || 'We\'ll be back shortly',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        iconColor: 'text-amber-400',
        titleColor: 'text-amber-400',
      };
    }

    // Not accepting for other reasons
    if (!isAcceptingOrders) {
      return {
        type: 'unavailable' as const,
        icon: <WifiOff className="h-4 w-4" />,
        title: 'Currently Unavailable',
        message: displayMessage || customMessage || 'Please check back soon',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        iconColor: 'text-red-400',
        titleColor: 'text-red-400',
      };
    }

    // All good - accepting orders
    return {
      type: 'available' as const,
      icon: <Utensils className="h-4 w-4" />,
      title: 'Now Taking Orders',
      message: todaysHours && showHours ? `Today: ${todaysHours}` : null,
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      titleColor: 'text-emerald-400',
    };
  };

  const config = getStatusConfig();
  const isUnavailable = ['offline', 'closed', 'paused', 'unavailable'].includes(config.type);
  const showCountdownTimer = showCountdown && isUnavailable && timeUntilOpen !== null;

  // Slim variant - minimal height
  if (variant === 'slim') {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={config.type}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            'w-full py-2 px-4 border-b',
            config.bgColor,
            config.borderColor,
            sticky && 'sticky top-0 z-30',
            className
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <span className={config.iconColor}>{config.icon}</span>
            <span className={cn('text-sm font-medium', config.titleColor)}>
              {config.title}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Card variant - for embedding in pages
  if (variant === 'card') {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={config.type}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={cn(
            'rounded-xl p-4 border',
            config.bgColor,
            config.borderColor,
            className
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                config.type === 'available' ? 'bg-emerald-500/20' : 'bg-white/10'
              )}
            >
              <span className={config.iconColor}>{config.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('font-medium', config.titleColor)}>{config.title}</p>
              {config.message && (
                <p className="text-sm text-[#B7BDC6] mt-0.5">{config.message}</p>
              )}
              {showCountdownTimer && (
                <div className="mt-3">
                  <CountdownTimer compact />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Full variant (default)
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={config.type}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'w-full px-4 py-3 border-b',
          config.bgColor,
          config.borderColor,
          sticky && 'sticky top-0 z-30',
          className
        )}
      >
        <div className="flex items-center justify-center gap-3">
          {/* Icon */}
          <span className={config.iconColor}>{config.icon}</span>

          {/* Content */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className={cn('text-sm font-medium', config.titleColor)}>
              {config.title}
            </span>
            {config.message && (
              <>
                <span className="hidden sm:inline text-[#B7BDC6]">•</span>
                <span className="text-sm text-[#B7BDC6]">{config.message}</span>
              </>
            )}
          </div>

          {/* Dismiss button */}
          {dismissible && config.type === 'available' && (
            <button
              onClick={() => setIsDismissed(true)}
              className="ml-auto p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-[#B7BDC6]" />
            </button>
          )}
        </div>

        {/* Countdown timer (for unavailable states) */}
        {showCountdownTimer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex justify-center mt-3"
          >
            <CountdownTimer compact />
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default RestaurantStatusBanner;
