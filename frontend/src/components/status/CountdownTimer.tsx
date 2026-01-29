/**
 * CountdownTimer - Animated countdown to restaurant opening
 *
 * Shows time until the restaurant opens in a visually appealing format.
 * Updates every second for smooth animation.
 *
 * Features:
 * - Real-time countdown with second precision
 * - Animated number transitions
 * - Displays hours, minutes, seconds
 * - Shows "Opens at X" for times > 24 hours
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Utensils } from 'lucide-react';
import { useRestaurantStatusStore } from 'utils/restaurantStatusStore';
import { cn } from 'utils/cn';

interface CountdownTimerProps {
  /** Show in compact mode (single line) */
  compact?: boolean;
  /** Custom className */
  className?: string;
  /** Show the "Opens at" label */
  showLabel?: boolean;
}

interface TimeUnit {
  value: number;
  label: string;
}

export function CountdownTimer({
  compact = false,
  className,
  showLabel = true,
}: CountdownTimerProps) {
  const { timeUntilOpenSeconds, nextOpenAt, nextServiceName, isAcceptingOrders } =
    useRestaurantStatusStore();

  const [currentSeconds, setCurrentSeconds] = useState(timeUntilOpenSeconds || 0);

  // Update countdown every second
  useEffect(() => {
    if (timeUntilOpenSeconds === null || timeUntilOpenSeconds <= 0) {
      setCurrentSeconds(0);
      return;
    }

    setCurrentSeconds(timeUntilOpenSeconds);

    const interval = setInterval(() => {
      setCurrentSeconds((prev) => {
        if (prev <= 0) {
          // Refresh status when countdown reaches zero
          useRestaurantStatusStore.getState().fetchStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeUntilOpenSeconds]);

  // Don't show if restaurant is open or no countdown data
  if (isAcceptingOrders || currentSeconds <= 0) {
    return null;
  }

  // Calculate time units
  const hours = Math.floor(currentSeconds / 3600);
  const minutes = Math.floor((currentSeconds % 3600) / 60);
  const seconds = currentSeconds % 60;

  // For times > 24 hours, show "Opens at X" instead of countdown
  if (hours >= 24 && nextOpenAt) {
    try {
      const date = new Date(nextOpenAt);
      const dayName = date.toLocaleDateString('en-GB', { weekday: 'long' });
      const time = date.toLocaleTimeString('en-GB', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      return (
        <div className={cn('flex items-center gap-2', className)}>
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-[#B7BDC6]">
            Opens <span className="text-[#EAECEF] font-medium">{dayName}</span> at{' '}
            <span className="text-[#EAECEF] font-medium">{time}</span>
          </span>
        </div>
      );
    } catch {
      return null;
    }
  }

  // Compact mode - single line
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Clock className="w-4 h-4 text-amber-400" />
        <span className="text-sm">
          <span className="text-[#B7BDC6]">Opens in </span>
          <span className="text-[#EAECEF] font-medium tabular-nums">
            {hours > 0 && `${hours}h `}
            {minutes > 0 && `${minutes}m `}
            {hours === 0 && `${seconds}s`}
          </span>
        </span>
      </div>
    );
  }

  // Full countdown display
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      {/* Label */}
      {showLabel && (
        <div className="flex items-center gap-2 text-[#B7BDC6]">
          <Utensils className="w-4 h-4" />
          <span className="text-sm">
            {nextServiceName === 'lunch' ? 'Lunch' : 'Dinner'} opens in
          </span>
        </div>
      )}

      {/* Countdown boxes */}
      <div className="flex items-center gap-2">
        {hours > 0 && (
          <>
            <TimeBox value={hours} label="hours" />
            <Separator />
          </>
        )}
        <TimeBox value={minutes} label="min" />
        <Separator />
        <TimeBox value={seconds} label="sec" />
      </div>
    </div>
  );
}

// Time box component with animated number
function TimeBox({ value, label }: TimeUnit) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          'w-14 h-14 rounded-xl flex items-center justify-center',
          'bg-white/5 border border-white/10'
        )}
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-2xl font-bold text-[#EAECEF] tabular-nums"
          >
            {value.toString().padStart(2, '0')}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-xs text-[#B7BDC6] mt-1">{label}</span>
    </div>
  );
}

// Separator between time boxes
function Separator() {
  return (
    <div className="flex flex-col gap-1.5 pb-4">
      <span className="w-1.5 h-1.5 rounded-full bg-[#B7BDC6]" />
      <span className="w-1.5 h-1.5 rounded-full bg-[#B7BDC6]" />
    </div>
  );
}

export default CountdownTimer;
