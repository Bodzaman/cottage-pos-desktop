/**
 * MobileStickyFooter - Fixed bottom bar for mobile checkout
 *
 * Features:
 * - Fixed at bottom with blur backdrop
 * - Shows item count and total
 * - Animated price changes
 * - Progress indicator
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from 'utils/cn';

interface MobileStickyFooterProps {
  itemCount: number;
  total: number;
  ctaLabel: string;
  onCTAClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  currentStep: number | string;
  totalSteps: number;
  onViewCart?: () => void;
  className?: string;
}

export function MobileStickyFooter({
  itemCount,
  total,
  ctaLabel,
  onCTAClick,
  disabled = false,
  isLoading = false,
  currentStep,
  totalSteps,
  onViewCart,
  className,
}: MobileStickyFooterProps) {
  // Calculate progress percentage
  const stepIndex = typeof currentStep === 'number' ? currentStep : 0;
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 lg:hidden',
        'safe-area-bottom',
        className
      )}
    >
      {/* Progress bar */}
      <div className="h-1 bg-white/10">
        <motion.div
          className="h-full bg-[#8B1538]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* Main content */}
      <div
        className="px-4 py-4 backdrop-blur-xl border-t"
        style={{
          background: 'rgba(23, 25, 29, 0.95)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Left side - Order summary */}
          <button
            onClick={onViewCart}
            className="flex items-center gap-3 min-w-0"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-[#8B1538]/20 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-[#8B1538]" />
              </div>
              {/* Item count badge */}
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#8B1538] flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{itemCount}</span>
              </div>
            </div>

            <div className="flex flex-col items-start min-w-0">
              <span className="text-xs text-[#B7BDC6]">Total</span>
              <motion.span
                key={total}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-bold text-[#EAECEF]"
              >
                £{total.toFixed(2)}
              </motion.span>
            </div>

            <ChevronUp className="w-4 h-4 text-[#B7BDC6]" />
          </button>

          {/* Right side - CTA button */}
          <Button
            onClick={onCTAClick}
            disabled={disabled || isLoading}
            className={cn(
              'h-12 px-6 text-base font-semibold',
              'bg-gradient-to-r from-[#8B1538] to-[#7A1230]',
              'hover:from-[#7A1230] hover:to-[#691025]',
              'text-white border-0 shadow-lg',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'min-w-[140px]'
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              ctaLabel
            )}
          </Button>
        </div>
      </div>

      {/* Safe area spacer for devices with home indicator */}
      <div
        className="h-safe-area-inset-bottom"
        style={{ background: 'rgba(23, 25, 29, 0.95)' }}
      />
    </motion.div>
  );
}

export default MobileStickyFooter;
