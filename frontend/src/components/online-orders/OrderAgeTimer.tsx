/**
 * OrderAgeTimer Component
 * Real-time countdown timer showing time remaining until order timeout
 * With visual color escalation based on urgency
 */

import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderAgeTimerProps {
  createdAt: Date;
  acceptanceDeadline?: Date;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

type UrgencyLevel = 'normal' | 'warning' | 'critical' | 'overdue';

const URGENCY_COLORS = {
  normal: {
    bg: 'bg-green-500/10',
    text: 'text-green-600',
    border: 'border-green-500',
    icon: 'text-green-500',
  },
  warning: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-600',
    border: 'border-yellow-500',
    icon: 'text-yellow-500',
  },
  critical: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-600',
    border: 'border-orange-500',
    icon: 'text-orange-500',
  },
  overdue: {
    bg: 'bg-red-500/10',
    text: 'text-red-600',
    border: 'border-red-500',
    icon: 'text-red-500',
  },
};

const SIZE_CLASSES = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function OrderAgeTimer({
  createdAt,
  acceptanceDeadline,
  showIcon = true,
  size = 'md',
  className,
}: OrderAgeTimerProps) {
  const [timeDisplay, setTimeDisplay] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('normal');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();

      if (acceptanceDeadline) {
        // Show countdown to deadline
        const msRemaining = acceptanceDeadline.getTime() - now.getTime();
        const minutesRemaining = Math.floor(msRemaining / 60000);
        const secondsRemaining = Math.floor((msRemaining % 60000) / 1000);

        if (msRemaining <= 0) {
          setTimeDisplay('OVERDUE');
          setUrgency('overdue');
        } else if (minutesRemaining < 2) {
          setTimeDisplay(`${minutesRemaining}:${secondsRemaining.toString().padStart(2, '0')}`);
          setUrgency('critical');
        } else if (minutesRemaining < 5) {
          setTimeDisplay(`${minutesRemaining}:${secondsRemaining.toString().padStart(2, '0')}`);
          setUrgency('warning');
        } else {
          setTimeDisplay(`${minutesRemaining}:${secondsRemaining.toString().padStart(2, '0')}`);
          setUrgency('normal');
        }
      } else {
        // Show time since order was placed
        const msElapsed = now.getTime() - createdAt.getTime();
        const minutesElapsed = Math.floor(msElapsed / 60000);
        const secondsElapsed = Math.floor((msElapsed % 60000) / 1000);

        setTimeDisplay(`${minutesElapsed}:${secondsElapsed.toString().padStart(2, '0')}`);

        if (minutesElapsed >= 8) {
          setUrgency('critical');
        } else if (minutesElapsed >= 5) {
          setUrgency('warning');
        } else {
          setUrgency('normal');
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [createdAt, acceptanceDeadline]);

  const colors = URGENCY_COLORS[urgency];
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-mono font-medium',
        colors.bg,
        colors.text,
        sizeClass,
        urgency === 'critical' && 'animate-pulse',
        urgency === 'overdue' && 'animate-pulse',
        className
      )}
    >
      {showIcon && (
        urgency === 'overdue' || urgency === 'critical' ? (
          <AlertTriangle className={cn('w-3.5 h-3.5', colors.icon)} />
        ) : (
          <Clock className={cn('w-3.5 h-3.5', colors.icon)} />
        )
      )}
      <span>{timeDisplay}</span>
    </div>
  );
}

export default OrderAgeTimer;
