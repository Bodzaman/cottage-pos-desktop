import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Minus } from 'lucide-react';

export interface VoiceCartUpdate {
  action: 'add' | 'remove';
  itemName: string;
  quantity?: number;
  price?: string;
}

interface VoiceCartToastProps {
  update: VoiceCartUpdate | null;
  isVisible: boolean;
}

/**
 * VoiceCartToast (Issue 8)
 *
 * Floating pill that appears during voice calls when items are added/removed from cart.
 * Auto-dismisses after 3 seconds.
 */
export function VoiceCartToast({ update, isVisible }: VoiceCartToastProps) {
  if (!update) return null;

  const isAdd = update.action === 'add';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20"
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm"
            style={{
              background: isAdd
                ? 'rgba(22, 163, 74, 0.9)'  // green-600
                : 'rgba(220, 38, 38, 0.9)', // red-600
              border: `1px solid ${isAdd ? 'rgba(74, 222, 128, 0.3)' : 'rgba(252, 165, 165, 0.3)'}`,
            }}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
              {isAdd ? (
                <Plus className="w-4 h-4 text-white" />
              ) : (
                <Minus className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="text-white">
              <p className="text-sm font-semibold">
                {isAdd ? 'Added' : 'Removed'}: {update.itemName}
              </p>
              {update.price && (
                <p className="text-xs opacity-80">
                  {update.quantity && update.quantity > 1 ? `${update.quantity}x ` : ''}
                  {update.price}
                </p>
              )}
            </div>
            <ShoppingCart className="w-4 h-4 text-white/60 ml-1" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
