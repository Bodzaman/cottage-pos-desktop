/**
 * PricePulse - Animated price display with pulse effect
 *
 * Features:
 * - Smooth count-up/down animation
 * - Pulse glow on change (green decrease, amber increase)
 * - Scale bump during change
 * - Number interpolation for smooth transitions
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { PremiumTheme } from 'utils/premiumTheme';

interface PricePulseProps {
  /** Current value */
  value: number;
  /** Currency symbol */
  currency?: string;
  /** Custom class name */
  className?: string;
  /** Animation duration in ms */
  duration?: number;
  /** Font size */
  fontSize?: string;
  /** Font weight */
  fontWeight?: string;
  /** Show pulse glow effect */
  showGlow?: boolean;
}

export function PricePulse({
  value,
  currency = '£',
  className,
  duration = 400,
  fontSize = '1.125rem', // text-lg
  fontWeight = '700', // font-bold
  showGlow = true,
}: PricePulseProps) {
  const [previousValue, setPreviousValue] = useState(value);
  const [changeDirection, setChangeDirection] = useState<'up' | 'down' | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Spring for smooth number interpolation
  const spring = useSpring(value, {
    stiffness: 100,
    damping: 20,
    duration: duration / 1000,
  });

  // Transform to formatted string
  const displayValue = useTransform(spring, (val) =>
    val.toFixed(2)
  );

  // Detect value change
  useEffect(() => {
    if (value !== previousValue) {
      // Determine direction
      const direction = value > previousValue ? 'up' : 'down';
      setChangeDirection(direction);

      // Clear previous timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      // Reset after animation
      animationTimeoutRef.current = setTimeout(() => {
        setChangeDirection(null);
      }, duration);

      setPreviousValue(value);
    }

    // Update spring target
    spring.set(value);

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [value, previousValue, duration, spring]);

  // Get glow color based on direction
  const getGlowColor = () => {
    if (!changeDirection) return 'transparent';
    return changeDirection === 'down'
      ? PremiumTheme.colors.status.success
      : PremiumTheme.colors.gold[400];
  };

  // Animation variants
  const pulseVariants = {
    initial: { scale: 1 },
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 0.3,
        ease: [0.34, 1.56, 0.64, 1],
      },
    },
  };

  return (
    <motion.span
      className={className}
      style={{
        fontSize,
        fontWeight,
        color: PremiumTheme.colors.text.primary,
        display: 'inline-flex',
        alignItems: 'center',
        position: 'relative',
      }}
      variants={pulseVariants}
      animate={changeDirection ? 'pulse' : 'initial'}
    >
      {/* Currency symbol */}
      <span>{currency}</span>

      {/* Animated number */}
      <motion.span>{displayValue}</motion.span>

      {/* Glow effect */}
      {showGlow && changeDirection && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="absolute inset-0 rounded"
          style={{
            boxShadow: `0 0 15px 5px ${getGlowColor()}`,
            pointerEvents: 'none',
          }}
        />
      )}
    </motion.span>
  );
}

export default PricePulse;
