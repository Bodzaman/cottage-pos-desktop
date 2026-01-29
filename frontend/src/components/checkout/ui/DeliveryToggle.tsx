/**
 * DeliveryToggle - Premium toggle for Delivery/Collection mode
 *
 * Features:
 * - Glass morphism container
 * - Animated sliding pill indicator
 * - Icons with micro-animations
 * - Shows delivery fee inline
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Truck, Store } from 'lucide-react';
import { cn } from 'utils/cn';

interface DeliveryToggleProps {
  value: 'delivery' | 'collection';
  onChange: (value: 'delivery' | 'collection') => void;
  deliveryFee?: number;
  disabled?: boolean;
  className?: string;
}

// Spring animation for pill
const pillSpring = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
};

// Icon bounce animation
const iconVariants = {
  inactive: { scale: 1, y: 0 },
  active: {
    scale: [1, 1.2, 1],
    y: [0, -2, 0],
    transition: { duration: 0.3 },
  },
};

export function DeliveryToggle({
  value,
  onChange,
  deliveryFee = 3.0,
  disabled = false,
  className,
}: DeliveryToggleProps) {
  const isDelivery = value === 'delivery';

  return (
    <div
      className={cn(
        'relative p-1.5 rounded-2xl backdrop-blur-xl border transition-all duration-300',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      style={{
        background: 'rgba(23, 25, 29, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
      }}
    >
      {/* Sliding pill background */}
      <motion.div
        className="absolute top-1.5 bottom-1.5 rounded-xl"
        style={{
          width: 'calc(50% - 6px)',
          background: 'linear-gradient(135deg, #8B1538 0%, #7A1230 100%)',
          boxShadow: '0 4px 12px rgba(139, 21, 56, 0.4)',
        }}
        initial={false}
        animate={{
          x: isDelivery ? 4 : 'calc(100% + 8px)',
        }}
        transition={pillSpring}
      />

      <div className="relative flex">
        {/* Delivery option */}
        <button
          onClick={() => onChange('delivery')}
          disabled={disabled}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-colors duration-300',
            isDelivery ? 'text-white' : 'text-[#B7BDC6] hover:text-[#EAECEF]'
          )}
        >
          <motion.div
            variants={iconVariants}
            initial="inactive"
            animate={isDelivery ? 'active' : 'inactive'}
          >
            <Truck className="w-5 h-5" />
          </motion.div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold">Delivery</span>
            <span
              className={cn(
                'text-xs transition-colors duration-300',
                isDelivery ? 'text-white/70' : 'text-[#B7BDC6]/70'
              )}
            >
              +£{deliveryFee.toFixed(2)}
            </span>
          </div>
        </button>

        {/* Collection option */}
        <button
          onClick={() => onChange('collection')}
          disabled={disabled}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-colors duration-300',
            !isDelivery ? 'text-white' : 'text-[#B7BDC6] hover:text-[#EAECEF]'
          )}
        >
          <motion.div
            variants={iconVariants}
            initial="inactive"
            animate={!isDelivery ? 'active' : 'inactive'}
          >
            <Store className="w-5 h-5" />
          </motion.div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold">Collection</span>
            <span
              className={cn(
                'text-xs transition-colors duration-300',
                !isDelivery ? 'text-white/70' : 'text-[#B7BDC6]/70'
              )}
            >
              Free
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}

export default DeliveryToggle;
