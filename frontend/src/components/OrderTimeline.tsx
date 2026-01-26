import React from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Package, ChefHat, Truck, CheckCircle2, XCircle } from 'lucide-react';
import { PremiumTheme } from 'utils/CustomerDesignSystem';

// Order status steps in progression order
const ORDER_STEPS = [
  { status: 'pending', label: 'Placed', icon: Clock },
  { status: 'confirmed', label: 'Confirmed', icon: Check },
  { status: 'preparing', label: 'Preparing', icon: ChefHat },
  { status: 'ready', label: 'Ready', icon: Package },
  { status: 'completed', label: 'Completed', icon: CheckCircle2 },
];

const DELIVERY_STEPS = [
  { status: 'pending', label: 'Placed', icon: Clock },
  { status: 'confirmed', label: 'Confirmed', icon: Check },
  { status: 'preparing', label: 'Preparing', icon: ChefHat },
  { status: 'ready', label: 'Out for Delivery', icon: Truck },
  { status: 'completed', label: 'Delivered', icon: CheckCircle2 },
];

// Status to step index mapping
const STATUS_INDEX: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  ready: 3,
  out_for_delivery: 3,
  completed: 4,
  delivered: 4,
  cancelled: -1,
  refunded: -1,
};

interface Props {
  status: string;
  orderType: 'collection' | 'delivery';
  timestamps?: {
    placed?: string;
    confirmed?: string;
    preparing?: string;
    ready?: string;
    completed?: string;
  };
  compact?: boolean;
}

export function OrderTimeline({ status, orderType, timestamps, compact = false }: Props) {
  const steps = orderType === 'delivery' ? DELIVERY_STEPS : ORDER_STEPS;
  const currentIndex = STATUS_INDEX[status?.toLowerCase()] ?? 0;
  const isCancelled = status?.toLowerCase() === 'cancelled' || status?.toLowerCase() === 'refunded';

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 py-2">
        <div
          className="p-2 rounded-full"
          style={{ background: 'rgba(239, 68, 68, 0.2)' }}
        >
          <XCircle className="h-5 w-5 text-red-500" />
        </div>
        <span className="text-sm font-medium text-red-400">
          Order {status?.toLowerCase() === 'refunded' ? 'Refunded' : 'Cancelled'}
        </span>
      </div>
    );
  }

  if (compact) {
    // Compact horizontal view
    return (
      <div className="flex items-center justify-between gap-1 py-2">
        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.status}>
              {/* Step circle */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: isCurrent ? 1.1 : 1 }}
                className="flex flex-col items-center"
              >
                <div
                  className={`p-1.5 rounded-full transition-all duration-300 ${
                    isCurrent ? 'ring-2 ring-offset-2 ring-offset-[#0F0F0F]' : ''
                  }`}
                  style={{
                    background: isCompleted
                      ? `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[500]} 0%, ${PremiumTheme.colors.burgundy[600]} 100%)`
                      : 'rgba(255, 255, 255, 0.1)',
                    ringColor: isCurrent ? PremiumTheme.colors.burgundy[500] : 'transparent'
                  }}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      isCompleted ? 'text-white' : 'text-[#8B92A0]'
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] mt-1 ${
                    isCurrent ? 'font-medium text-[#EAECEF]' : 'text-[#8B92A0]'
                  }`}
                >
                  {step.label}
                </span>
              </motion.div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-1"
                  style={{
                    background: index < currentIndex
                      ? PremiumTheme.colors.burgundy[500]
                      : 'rgba(255, 255, 255, 0.1)'
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // Full vertical view with timestamps
  return (
    <div className="py-4">
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-4 top-4 bottom-4 w-0.5"
          style={{ background: 'rgba(255, 255, 255, 0.1)' }}
        />

        {/* Progress line */}
        <motion.div
          className="absolute left-4 top-4 w-0.5"
          style={{ background: PremiumTheme.colors.burgundy[500] }}
          initial={{ height: 0 }}
          animate={{
            height: `${Math.min(100, (currentIndex / (steps.length - 1)) * 100)}%`
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step, index) => {
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;
            const Icon = step.icon;

            // Get timestamp for this step
            const timestampKey = step.status as keyof typeof timestamps;
            const stepTimestamp = timestamps?.[timestampKey];

            return (
              <motion.div
                key={step.status}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 relative"
              >
                {/* Step circle */}
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: isCurrent ? 1.15 : 1 }}
                  className={`relative z-10 p-2 rounded-full transition-all duration-300 ${
                    isCurrent ? 'ring-2 ring-offset-2 ring-offset-[#0F0F0F]' : ''
                  }`}
                  style={{
                    background: isCompleted
                      ? `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[500]} 0%, ${PremiumTheme.colors.burgundy[600]} 100%)`
                      : 'rgba(255, 255, 255, 0.1)',
                    ringColor: isCurrent ? PremiumTheme.colors.burgundy[500] : 'transparent'
                  }}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      isCompleted ? 'text-white' : 'text-[#8B92A0]'
                    }`}
                  />
                </motion.div>

                {/* Step content */}
                <div className="flex-1 pt-0.5">
                  <p
                    className={`font-medium ${
                      isCurrent ? 'text-[#EAECEF]' : isCompleted ? 'text-[#B7BDC6]' : 'text-[#8B92A0]'
                    }`}
                  >
                    {step.label}
                    {isCurrent && (
                      <span
                        className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs"
                        style={{
                          background: `${PremiumTheme.colors.burgundy[500]}20`,
                          color: PremiumTheme.colors.burgundy[500]
                        }}
                      >
                        Current
                      </span>
                    )}
                  </p>
                  {stepTimestamp && (
                    <p className="text-xs text-[#8B92A0] mt-0.5">
                      {new Date(stepTimestamp).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
