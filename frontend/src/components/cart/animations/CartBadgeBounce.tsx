/**
 * CartBadgeBounce - Reusable bounce animation wrapper
 *
 * Features:
 * - Bounce animation on trigger
 * - Pulse ring effect
 * - Can wrap any element
 * - Imperative trigger via ref
 */

import React, { forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PremiumTheme } from 'utils/premiumTheme';

export interface CartBadgeBounceRef {
  /** Trigger the bounce animation */
  bounce: () => void;
}

interface CartBadgeBounceProps {
  /** Child element to wrap */
  children: React.ReactNode;
  /** Custom class name */
  className?: string;
  /** Bounce duration in ms */
  duration?: number;
  /** Show pulse ring */
  showPulse?: boolean;
  /** Pulse color */
  pulseColor?: string;
}

export const CartBadgeBounce = forwardRef<CartBadgeBounceRef, CartBadgeBounceProps>(
  function CartBadgeBounce(
    {
      children,
      className,
      duration = 400,
      showPulse = true,
      pulseColor = PremiumTheme.colors.burgundy[400],
    },
    ref
  ) {
    const [isBouncing, setIsBouncing] = useState(false);

    // Trigger bounce animation
    const bounce = useCallback(() => {
      setIsBouncing(true);
      setTimeout(() => setIsBouncing(false), duration);
    }, [duration]);

    // Expose bounce method via ref
    useImperativeHandle(ref, () => ({
      bounce,
    }));

    // Bounce animation variants
    const bounceVariants = {
      initial: { scale: 1 },
      bounce: {
        scale: [1, 1.3, 0.9, 1.1, 1],
        transition: {
          duration: duration / 1000,
          ease: [0.34, 1.56, 0.64, 1],
        },
      },
    };

    return (
      <motion.div
        className={`relative inline-flex ${className}`}
        variants={bounceVariants}
        animate={isBouncing ? 'bounce' : 'initial'}
      >
        {children}

        {/* Pulse ring effect */}
        {showPulse && (
          <AnimatePresence>
            {isBouncing && (
              <>
                {/* First ring */}
                <motion.div
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 2, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ backgroundColor: pulseColor }}
                />
                {/* Second ring (delayed) */}
                <motion.div
                  initial={{ scale: 1, opacity: 0.3 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ backgroundColor: pulseColor }}
                />
              </>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    );
  }
);

export default CartBadgeBounce;
