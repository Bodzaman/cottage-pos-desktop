/**
 * FlyToCart - Add-to-cart fly animation
 *
 * Features:
 * - Item thumbnail flies from menu to cart badge
 * - Bezier curve path for natural motion
 * - Scale down as it approaches cart
 * - Fade out on arrival
 * - Triggers cart badge bounce
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { PremiumTheme } from 'utils/premiumTheme';

interface Position {
  x: number;
  y: number;
}

export interface FlyToCartProps {
  /** Whether the animation is active */
  isActive: boolean;
  /** Item image URL or fallback icon */
  itemImage?: string;
  /** Item name for alt text */
  itemName?: string;
  /** Starting position (click location) */
  startPosition: Position;
  /** Ending position (cart badge location) */
  endPosition: Position;
  /** Callback when animation completes */
  onComplete: () => void;
  /** Animation duration in ms */
  duration?: number;
}

// Animation duration
const DEFAULT_DURATION = 600;

// Starting and ending sizes
const START_SIZE = 60;
const END_SIZE = 20;

export function FlyToCart({
  isActive,
  itemImage,
  itemName = 'Item',
  startPosition,
  endPosition,
  onComplete,
  duration = DEFAULT_DURATION,
}: FlyToCartProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isActive && !isAnimating) {
      setIsAnimating(true);
    }
  }, [isActive, isAnimating]);

  // Calculate bezier control point for curved path
  const controlPoint = {
    x: (startPosition.x + endPosition.x) / 2,
    y: Math.min(startPosition.y, endPosition.y) - 100, // Arc above both points
  };

  // Handle animation complete
  const handleAnimationComplete = () => {
    setIsAnimating(false);
    onComplete();
  };

  // Don't render on server
  if (typeof window === 'undefined') return null;

  // Create portal to render above everything
  return createPortal(
    <AnimatePresence>
      {isAnimating && (
        <motion.div
          initial={{
            x: startPosition.x - START_SIZE / 2,
            y: startPosition.y - START_SIZE / 2,
            scale: 1,
            opacity: 1,
          }}
          animate={{
            x: [
              startPosition.x - START_SIZE / 2,
              controlPoint.x - (START_SIZE + END_SIZE) / 4,
              endPosition.x - END_SIZE / 2,
            ],
            y: [
              startPosition.y - START_SIZE / 2,
              controlPoint.y - (START_SIZE + END_SIZE) / 4,
              endPosition.y - END_SIZE / 2,
            ],
            scale: [1, 0.6, 0.3],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: duration / 1000,
            ease: [0.34, 1.56, 0.64, 1], // Spring-like easing
            times: [0, 0.6, 1],
          }}
          onAnimationComplete={handleAnimationComplete}
          className="fixed pointer-events-none z-[9999]"
          style={{
            width: START_SIZE,
            height: START_SIZE,
          }}
        >
          {/* Flying item */}
          <div
            className="w-full h-full rounded-xl overflow-hidden shadow-lg"
            style={{
              backgroundColor: PremiumTheme.colors.dark[800],
              border: `2px solid ${PremiumTheme.colors.burgundy[500]}`,
              boxShadow: `0 4px 20px ${PremiumTheme.colors.burgundy[500]}60`,
            }}
          >
            {itemImage ? (
              <img
                src={itemImage}
                alt={itemName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-lg font-bold"
                style={{
                  background: `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[500]} 0%, ${PremiumTheme.colors.burgundy[600]} 100%)`,
                  color: 'white',
                }}
              >
                {itemName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Trail effect */}
          <motion.div
            initial={{ scale: 1, opacity: 0.3 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.3, repeat: 2, repeatDelay: 0.1 }}
            className="absolute inset-0 rounded-xl"
            style={{
              backgroundColor: PremiumTheme.colors.burgundy[400],
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default FlyToCart;
