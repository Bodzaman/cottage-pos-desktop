/**
 * CartMini - Header badge with animation support
 *
 * Features:
 * - Badge showing item count
 * - Bounce animation on item add
 * - Pulse effect for attention
 * - Click to open cart
 * - Ref forwarding for fly animation target
 */

import React, { forwardRef, useRef, useImperativeHandle, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from 'utils/cartStore';
import { PremiumTheme } from 'utils/premiumTheme';

export interface CartMiniRef {
  /** Get the badge element's bounding rect for fly animation */
  getBoundingClientRect: () => DOMRect | null;
  /** Trigger bounce animation */
  triggerBounce: () => void;
}

interface CartMiniProps {
  /** Custom class name */
  className?: string;
  /** Show even when empty */
  showWhenEmpty?: boolean;
}

export const CartMini = forwardRef<CartMiniRef, CartMiniProps>(
  function CartMini({ className, showWhenEmpty = false }, ref) {
    const { totalItems, openCart } = useCartStore();
    const badgeRef = useRef<HTMLDivElement>(null);
    const [isBouncing, setIsBouncing] = useState(false);
    const [prevCount, setPrevCount] = useState(totalItems);

    // Expose ref methods
    useImperativeHandle(ref, () => ({
      getBoundingClientRect: () => {
        return badgeRef.current?.getBoundingClientRect() || null;
      },
      triggerBounce: () => {
        setIsBouncing(true);
        setTimeout(() => setIsBouncing(false), 400);
      },
    }));

    // Auto-bounce when item count increases
    useEffect(() => {
      if (totalItems > prevCount) {
        setIsBouncing(true);
        setTimeout(() => setIsBouncing(false), 400);
      }
      setPrevCount(totalItems);
    }, [totalItems, prevCount]);

    // Don't render if empty and not forced
    if (totalItems === 0 && !showWhenEmpty) {
      return null;
    }

    // Bounce animation variants
    const bounceVariants = {
      initial: { scale: 1 },
      bounce: {
        scale: [1, 1.3, 0.9, 1.1, 1],
        transition: {
          duration: 0.4,
          ease: [0.34, 1.56, 0.64, 1],
        },
      },
    };

    // Badge count animation
    const countVariants = {
      initial: { scale: 0.5, opacity: 0 },
      animate: {
        scale: 1,
        opacity: 1,
        transition: { duration: 0.2, ease: 'easeOut' },
      },
      exit: {
        scale: 0.5,
        opacity: 0,
        transition: { duration: 0.15 },
      },
    };

    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={openCart}
        className={`relative h-10 w-10 rounded-full ${className}`}
        style={{
          backgroundColor: PremiumTheme.colors.burgundy[500] + '20',
          color: PremiumTheme.colors.burgundy[400],
        }}
        aria-label={`Shopping cart with ${totalItems} items`}
      >
        {/* Icon container with bounce */}
        <motion.div
          ref={badgeRef}
          variants={bounceVariants}
          animate={isBouncing ? 'bounce' : 'initial'}
          className="relative"
        >
          <ShoppingBag className="w-5 h-5" />

          {/* Item count badge */}
          <AnimatePresence mode="wait">
            {totalItems > 0 && (
              <motion.div
                key={totalItems}
                variants={countVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute -top-2 -right-2 flex items-center justify-center"
              >
                <span
                  className="min-w-[18px] h-[18px] px-1 rounded-full text-xs font-bold flex items-center justify-center"
                  style={{
                    backgroundColor: PremiumTheme.colors.burgundy[500],
                    color: 'white',
                    boxShadow: `0 0 8px ${PremiumTheme.colors.burgundy[500]}80`,
                  }}
                >
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pulse ring when bouncing */}
          <AnimatePresence>
            {isBouncing && (
              <motion.div
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full"
                style={{
                  backgroundColor: PremiumTheme.colors.burgundy[400],
                }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </Button>
    );
  }
);

export default CartMini;
