/**
 * PromoCodeInput - Promo code input with validation states
 *
 * Features:
 * - Input with apply button
 * - Loading, success, and error states
 * - Clear functionality
 * - Sparkle animation on success
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, X, Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from 'utils/cn';

interface PromoCodeInputProps {
  value: string;
  status: 'idle' | 'validating' | 'valid' | 'invalid';
  message?: string;
  discountAmount?: number;
  onApply: (code: string) => Promise<void>;
  onClear: () => void;
  className?: string;
}

// Sparkle animation variants
const sparkleVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i: number) => ({
    scale: [0, 1, 0],
    opacity: [0, 1, 0],
    x: [0, (i % 2 === 0 ? 1 : -1) * 20],
    y: [0, -20 - i * 5],
    transition: {
      duration: 0.6,
      delay: i * 0.1,
      ease: 'easeOut',
    },
  }),
};

export function PromoCodeInput({
  value,
  status,
  message,
  discountAmount,
  onApply,
  onClear,
  className,
}: PromoCodeInputProps) {
  const [inputValue, setInputValue] = useState(value || '');
  const [showSparkles, setShowSparkles] = useState(false);

  const handleApply = async () => {
    if (inputValue.trim().length >= 3) {
      await onApply(inputValue.trim());
      if (status === 'valid') {
        setShowSparkles(true);
        setTimeout(() => setShowSparkles(false), 1000);
      }
    }
  };

  const handleClear = () => {
    setInputValue('');
    onClear();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  // Show success state
  if (status === 'valid') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative flex items-center justify-between p-3 rounded-xl border',
          'bg-emerald-500/10 border-emerald-500/30',
          className
        )}
      >
        {/* Sparkle effects */}
        <AnimatePresence>
          {showSparkles &&
            [0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                custom={i}
                variants={sparkleVariants}
                initial="hidden"
                animate="visible"
                className="absolute left-1/2"
                style={{ top: '50%' }}
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </motion.div>
            ))}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Check className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-400">{value}</p>
            {discountAmount && (
              <p className="text-xs text-emerald-300/70">
                £{discountAmount.toFixed(2)} off
              </p>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20"
          onClick={handleClear}
        >
          <X className="w-4 h-4" />
        </Button>
      </motion.div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B7BDC6]" />
          <Input
            type="text"
            placeholder="Promo code"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            disabled={status === 'validating'}
            className={cn(
              'pl-10 bg-white/5 border-white/10 text-[#EAECEF] placeholder:text-[#B7BDC6]/50',
              'focus:border-[#8B1538] focus:ring-[#8B1538]/20',
              status === 'invalid' && 'border-red-500/50 focus:border-red-500'
            )}
          />
        </div>

        <Button
          onClick={handleApply}
          disabled={inputValue.length < 3 || status === 'validating'}
          className={cn(
            'px-4 bg-[#8B1538] hover:bg-[#7A1230] text-white',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {status === 'validating' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Apply'
          )}
        </Button>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {status === 'invalid' && message && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xs text-red-400"
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PromoCodeInput;
