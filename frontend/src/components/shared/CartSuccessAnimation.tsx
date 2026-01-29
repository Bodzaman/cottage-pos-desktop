import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShoppingCart } from 'lucide-react';
import confetti from 'canvas-confetti';
import { triggerHaptic } from 'utils/haptics';

interface CartSuccessAnimationProps {
  show: boolean;
  itemName?: string;
  quantity?: number;
  action?: 'add' | 'remove' | 'update';
  onComplete?: () => void;
}

/**
 * CartSuccessAnimation - Delightful celebration when cart is updated
 *
 * Features:
 * - Confetti burst on add (configurable)
 * - Haptic feedback on mobile
 * - Animated check mark
 * - Auto-dismiss after animation
 */
export function CartSuccessAnimation({
  show,
  itemName,
  quantity = 1,
  action = 'add',
  onComplete,
}: CartSuccessAnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);

      // Trigger haptic feedback
      triggerHaptic('success');

      // Trigger confetti only on add
      if (action === 'add') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#f97316', '#fb923c', '#fdba74', '#22c55e', '#4ade80'],
          disableForReducedMotion: true,
        });
      }

      // Auto-dismiss after animation
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [show, action, onComplete]);

  const getMessage = () => {
    switch (action) {
      case 'add':
        return quantity > 1 ? `${quantity}x ${itemName} added!` : `${itemName} added!`;
      case 'remove':
        return `${itemName} removed`;
      case 'update':
        return `Cart updated`;
      default:
        return 'Cart updated';
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full shadow-lg shadow-green-500/30">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
              className="bg-white/20 rounded-full p-1"
            >
              {action === 'add' ? (
                <Check className="h-5 w-5" />
              ) : (
                <ShoppingCart className="h-5 w-5" />
              )}
            </motion.div>
            <span className="font-medium text-sm">{getMessage()}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CartSuccessAnimation;
