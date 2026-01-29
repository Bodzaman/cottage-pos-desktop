/**
 * RestaurantStatusBadge - Compact status indicator
 *
 * A small badge showing restaurant open/closed status.
 * Use in headers, cards, or inline with other content.
 *
 * Features:
 * - Pulsing dot animation when open
 * - Shows "Opens at X" when closed
 * - Countdown timer when < 1 hour to open
 * - Click to expand full hours
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronDown } from 'lucide-react';
import {
  useRestaurantStatusStore,
  useTimeUntilOpen,
} from 'utils/restaurantStatusStore';
import { cn } from 'utils/cn';

interface RestaurantStatusBadgeProps {
  /** Show expanded view with today's hours */
  showHours?: boolean;
  /** Compact mode - just dot and "Open"/"Closed" */
  compact?: boolean;
  /** Custom className */
  className?: string;
  /** Show as a floating badge (absolute positioned) */
  floating?: boolean;
}

export function RestaurantStatusBadge({
  showHours = false,
  compact = false,
  className,
  floating = false,
}: RestaurantStatusBadgeProps) {
  const {
    isAcceptingOrders,
    isOnline,
    isLoading,
    displayMessage,
    todaysHours,
    currentService,
    nextServiceName,
  } = useRestaurantStatusStore();

  const timeUntilOpen = useTimeUntilOpen();
  const [isExpanded, setIsExpanded] = useState(false);

  // Start polling when component mounts
  useEffect(() => {
    const store = useRestaurantStatusStore.getState();
    if (!store._isPolling) {
      store.startPolling();
    }
  }, []);

  // Determine status type
  const isOpen = isAcceptingOrders && isOnline;
  const isOpeningSoon = !isOpen && timeUntilOpen !== null;

  // Get status text
  const getStatusText = () => {
    if (isLoading) return 'Checking...';
    if (isOpen) return 'Now Taking Orders';
    if (isOpeningSoon) {
      // Show countdown if < 1 hour
      const store = useRestaurantStatusStore.getState();
      const seconds = store.timeUntilOpenSeconds;
      if (seconds && seconds < 3600) {
        return `Opens in ${timeUntilOpen}`;
      }
      return `Opens ${timeUntilOpen}`;
    }
    return 'Currently Closed';
  };

  // Get status color
  const getStatusColor = () => {
    if (isLoading) return 'bg-gray-500';
    if (isOpen) return 'bg-emerald-500';
    if (isOpeningSoon) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Compact version - just dot and text
  if (compact) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5',
          floating && 'absolute top-2 right-2',
          className
        )}
      >
        <motion.span
          className={cn('w-2 h-2 rounded-full', getStatusColor())}
          animate={isOpen ? { scale: [1, 1.2, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        <span className="text-xs font-medium text-[#B7BDC6]">
          {isOpen ? 'Open' : 'Closed'}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex flex-col',
        floating && 'absolute top-4 right-4',
        className
      )}
    >
      {/* Main badge */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
          'transition-all duration-200',
          'border',
          isOpen
            ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
            : isOpeningSoon
              ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'
              : 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
        )}
      >
        {/* Pulsing dot */}
        <span className="relative flex h-2.5 w-2.5">
          {isOpen && (
            <motion.span
              className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
              animate={{ scale: [1, 1.5, 1], opacity: [0.75, 0, 0.75] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          )}
          <span
            className={cn('relative inline-flex rounded-full h-2.5 w-2.5', getStatusColor())}
          />
        </span>

        {/* Status text */}
        <span
          className={cn(
            'text-sm font-medium',
            isOpen
              ? 'text-emerald-400'
              : isOpeningSoon
                ? 'text-amber-400'
                : 'text-red-400'
          )}
        >
          {getStatusText()}
        </span>

        {/* Expand icon */}
        {showHours && todaysHours && (
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform',
              isExpanded && 'rotate-180',
              isOpen ? 'text-emerald-400' : 'text-[#B7BDC6]'
            )}
          />
        )}
      </button>

      {/* Expanded hours */}
      <AnimatePresence>
        {isExpanded && showHours && todaysHours && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
              <Clock className="w-4 h-4 text-[#B7BDC6]" />
              <div className="text-sm">
                <span className="text-[#B7BDC6]">Today: </span>
                <span className="text-[#EAECEF]">{todaysHours}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default RestaurantStatusBadge;
