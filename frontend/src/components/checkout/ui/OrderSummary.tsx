/**
 * OrderSummary - Collapsible order summary with inline editing
 *
 * Features:
 * - Collapsible on mobile, sticky on desktop
 * - Item thumbnails with quantity controls
 * - Animated price updates
 * - Promo code input
 * - Delivery fee display
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from 'utils/cartStore';
import { useCheckout } from '../CheckoutProvider';
import { PromoCodeInput } from './PromoCodeInput';
import { cn } from 'utils/cn';

interface OrderSummaryProps {
  className?: string;
  collapsible?: boolean;
}

// Animated counter for prices
function AnimatedPrice({ value, className }: { value: number; className?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      £{value.toFixed(2)}
    </motion.span>
  );
}

export function OrderSummary({ className, collapsible = false }: OrderSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsible);
  const { items, totalItems, updateQuantity, removeItem } = useCartStore();
  const {
    subtotal,
    deliveryFee,
    discount,
    total,
    orderMode,
    promoValidation,
    applyPromoCode,
    clearPromoCode,
  } = useCheckout();

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
    <motion.div
      className={cn(
        'rounded-2xl backdrop-blur-xl border overflow-hidden',
        className
      )}
      style={{
        background: 'rgba(23, 25, 29, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
      layout
    >
      {/* Header */}
      <button
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between p-4 md:p-5',
          collapsible && 'cursor-pointer hover:bg-white/5 transition-colors'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#8B1538]/20 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-[#8B1538]" />
          </div>
          <div className="text-left">
            <h3 className="text-base font-semibold text-[#EAECEF]">Order Summary</h3>
            <p className="text-sm text-[#B7BDC6]">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AnimatedPrice value={total} className="text-lg font-bold text-[#EAECEF]" />
          {collapsible && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-[#B7BDC6]" />
            </motion.div>
          )}
        </div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {/* Items list */}
            <div className="px-4 md:px-5 pb-4 space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5"
                >
                  {/* Item image */}
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-[#17191D] flex items-center justify-center">
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
                    <p className="text-sm font-semibold text-[#8B1538]">
                      £{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-white/10"
                      onClick={() => handleQuantityChange(item.id, -1)}
                    >
                      {item.quantity === 1 ? (
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      ) : (
                        <Minus className="w-3.5 h-3.5" />
                      )}
                    </Button>
                    <span className="w-6 text-center text-sm font-medium text-[#EAECEF]">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-white/10"
                      onClick={() => handleQuantityChange(item.id, 1)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Promo code */}
            <div className="px-4 md:px-5 pb-4">
              <PromoCodeInput
                value={promoValidation.code}
                status={promoValidation.status}
                message={promoValidation.message}
                discountAmount={promoValidation.discountAmount}
                onApply={applyPromoCode}
                onClear={clearPromoCode}
              />
            </div>

            {/* Price breakdown */}
            <div className="px-4 md:px-5 pb-5 space-y-2 border-t border-white/10 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-[#B7BDC6]">Subtotal</span>
                <AnimatedPrice value={subtotal} className="text-[#EAECEF]" />
              </div>

              {orderMode === 'delivery' && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#B7BDC6]">Delivery</span>
                  <AnimatedPrice value={deliveryFee} className="text-[#EAECEF]" />
                </div>
              )}

              {discount > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex justify-between text-sm"
                >
                  <span className="text-emerald-400">Discount</span>
                  <span className="text-emerald-400">-£{discount.toFixed(2)}</span>
                </motion.div>
              )}

              <div className="flex justify-between pt-2 border-t border-white/10">
                <span className="text-base font-semibold text-[#EAECEF]">Total</span>
                <AnimatedPrice
                  value={total}
                  className="text-lg font-bold text-[#EAECEF]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default OrderSummary;
