/**
 * MobileCheckoutSheet - Bottom sheet for viewing order summary on mobile
 *
 * Features:
 * - Swipe down to dismiss
 * - Order items with quantity controls
 * - Animated transitions
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from 'utils/cartStore';
import { useCheckout } from '../CheckoutProvider';
import { cn } from 'utils/cn';

interface MobileCheckoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function MobileCheckoutSheet({
  isOpen,
  onClose,
  className,
}: MobileCheckoutSheetProps) {
  const { items, updateQuantity, removeItem } = useCartStore();
  const { subtotal, deliveryFee, discount, total, orderMode } = useCheckout();

  const sheetRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 300], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      const newQuantity = item.quantity + delta;
      if (newQuantity <= 0) {
        removeItem(itemId);
      } else {
        updateQuantity(itemId, newQuantity);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ y, opacity }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50',
              'max-h-[85vh] rounded-t-3xl overflow-hidden',
              'flex flex-col',
              className
            )}
          >
            {/* Sheet content */}
            <div
              className="flex flex-col h-full"
              style={{ background: '#17191D' }}
            >
              {/* Handle */}
              <div className="flex justify-center py-3">
                <div className="w-12 h-1.5 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-[#EAECEF]">Your Order</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Items list */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="w-12 h-12 text-[#B7BDC6] mx-auto mb-3 opacity-50" />
                    <p className="text-[#B7BDC6]">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                      >
                        {/* Item image */}
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-14 h-14 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-[#0B0C0E] flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-[#B7BDC6]" />
                          </div>
                        )}

                        {/* Item details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#EAECEF] truncate">
                            {item.name}
                          </p>
                          {item.variant?.name && (
                            <p className="text-xs text-[#B7BDC6]">{item.variant.name}</p>
                          )}
                          <p className="text-sm font-semibold text-[#8B1538] mt-1">
                            £{(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-white/10"
                            onClick={() => handleQuantityChange(item.id, -1)}
                          >
                            {item.quantity === 1 ? (
                              <Trash2 className="w-4 h-4 text-red-400" />
                            ) : (
                              <Minus className="w-4 h-4" />
                            )}
                          </Button>
                          <span className="w-6 text-center text-sm font-medium text-[#EAECEF]">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-white/10"
                            onClick={() => handleQuantityChange(item.id, 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price breakdown */}
              {items.length > 0 && (
                <div className="px-5 py-4 border-t border-white/10 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#B7BDC6]">Subtotal</span>
                    <span className="text-[#EAECEF]">£{subtotal.toFixed(2)}</span>
                  </div>

                  {orderMode === 'delivery' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#B7BDC6]">Delivery</span>
                      <span className="text-[#EAECEF]">£{deliveryFee.toFixed(2)}</span>
                    </div>
                  )}

                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-400">Discount</span>
                      <span className="text-emerald-400">-£{discount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-2 border-t border-white/10">
                    <span className="text-base font-semibold text-[#EAECEF]">Total</span>
                    <motion.span
                      key={total}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-lg font-bold text-[#EAECEF]"
                    >
                      £{total.toFixed(2)}
                    </motion.span>
                  </div>
                </div>
              )}

              {/* Safe area padding */}
              <div className="h-safe-area-inset-bottom" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default MobileCheckoutSheet;
