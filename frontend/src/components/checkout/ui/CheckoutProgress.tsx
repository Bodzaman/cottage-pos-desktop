/**
 * CheckoutProgress - Visual step indicator component
 *
 * Features:
 * - Horizontal steps on desktop, compact on mobile
 * - Active step with burgundy glow
 * - Completed steps with animated checkmark
 * - Clickable navigation to completed steps
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check, User, MapPin, Clock, CreditCard } from 'lucide-react';
import { cn } from 'utils/cn';

export interface CheckoutStep {
  id: string;
  label: string;
  icon: string;
}

interface CheckoutProgressProps {
  steps: CheckoutStep[];
  currentStep: string;
  completedSteps: Set<string>;
  onStepClick?: (stepId: string) => void;
  className?: string;
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  User,
  MapPin,
  Clock,
  CreditCard,
};

// Checkmark draw animation
const checkVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

// Step circle animation
const circleVariants = {
  inactive: { scale: 1 },
  active: {
    scale: 1,
    transition: { duration: 0.3 },
  },
  completed: {
    scale: [1, 1.2, 1],
    transition: { duration: 0.4 },
  },
};

// Glow animation for active step
const glowVariants = {
  inactive: { opacity: 0, scale: 0.8 },
  active: {
    opacity: [0.4, 0.6, 0.4],
    scale: [1, 1.1, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

function StepIcon({
  step,
  isActive,
  isCompleted,
  onClick,
  isClickable,
}: {
  step: CheckoutStep;
  isActive: boolean;
  isCompleted: boolean;
  onClick?: () => void;
  isClickable: boolean;
}) {
  const IconComponent = iconMap[step.icon] || User;

  return (
    <motion.button
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      className={cn(
        'relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full transition-all duration-300',
        isCompleted && 'bg-emerald-500/20 border-2 border-emerald-500',
        isActive && !isCompleted && 'bg-[#8B1538]/20 border-2 border-[#8B1538]',
        !isActive && !isCompleted && 'bg-[#17191D] border-2 border-white/10',
        isClickable && 'cursor-pointer hover:scale-105',
        !isClickable && 'cursor-default'
      )}
      variants={circleVariants}
      initial="inactive"
      animate={isCompleted ? 'completed' : isActive ? 'active' : 'inactive'}
      whileHover={isClickable ? { scale: 1.1 } : {}}
      whileTap={isClickable ? { scale: 0.95 } : {}}
    >
      {/* Active glow effect */}
      {isActive && !isCompleted && (
        <motion.div
          className="absolute inset-0 rounded-full bg-[#8B1538]"
          variants={glowVariants}
          initial="inactive"
          animate="active"
          style={{ filter: 'blur(8px)' }}
        />
      )}

      {/* Completed checkmark */}
      {isCompleted ? (
        <motion.svg
          viewBox="0 0 24 24"
          className="w-5 h-5 md:w-6 md:h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M5 12l5 5L19 7"
            variants={checkVariants}
            initial="hidden"
            animate="visible"
            className="text-emerald-500"
          />
        </motion.svg>
      ) : (
        <IconComponent
          className={cn(
            'w-4 h-4 md:w-5 md:h-5 relative z-10',
            isActive ? 'text-[#8B1538]' : 'text-[#B7BDC6]'
          )}
        />
      )}
    </motion.button>
  );
}

function StepConnector({
  isCompleted,
  isActive,
}: {
  isCompleted: boolean;
  isActive: boolean;
}) {
  return (
    <div className="flex-1 h-0.5 mx-2 md:mx-3 relative overflow-hidden rounded-full bg-white/10">
      <motion.div
        className={cn(
          'absolute inset-y-0 left-0 rounded-full',
          isCompleted ? 'bg-emerald-500' : isActive ? 'bg-[#8B1538]' : 'bg-transparent'
        )}
        initial={{ width: '0%' }}
        animate={{ width: isCompleted ? '100%' : isActive ? '50%' : '0%' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  );
}

export function CheckoutProgress({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  className,
}: CheckoutProgressProps) {
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop view */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = completedSteps.has(step.id);
          const isPast = index < currentStepIndex;
          const isClickable = isPast || isCompleted;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <StepIcon
                  step={step}
                  isActive={isActive}
                  isCompleted={isCompleted}
                  onClick={() => onStepClick?.(step.id)}
                  isClickable={isClickable}
                />
                <motion.span
                  className={cn(
                    'mt-2 text-xs md:text-sm font-medium transition-colors duration-300',
                    isActive && 'text-[#EAECEF]',
                    isCompleted && 'text-emerald-400',
                    !isActive && !isCompleted && 'text-[#B7BDC6]'
                  )}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {step.label}
                </motion.span>
              </div>

              {index < steps.length - 1 && (
                <StepConnector
                  isCompleted={completedSteps.has(step.id)}
                  isActive={index === currentStepIndex}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile compact view */}
      <div className="md:hidden">
        <div className="flex items-center justify-center gap-2">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = completedSteps.has(step.id);

            return (
              <motion.div
                key={step.id}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  isActive && 'w-8 bg-[#8B1538]',
                  isCompleted && 'w-4 bg-emerald-500',
                  !isActive && !isCompleted && 'w-4 bg-white/20'
                )}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 }}
              />
            );
          })}
        </div>
        <div className="mt-2 text-center">
          <span className="text-sm text-[#B7BDC6]">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          <span className="mx-2 text-white/20">·</span>
          <span className="text-sm font-medium text-[#EAECEF]">
            {steps[currentStepIndex]?.label}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CheckoutProgress;
