import React from 'react';
import { colors } from 'utils/designSystem';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'shimmer' | 'none';
}

/**
 * Base skeleton component with shimmer animation
 * Follows design system styling with purple accent
 */
export function Skeleton({ 
  className = '', 
  width, 
  height, 
  variant = 'rectangular',
  animation = 'shimmer'
}: SkeletonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return { borderRadius: '50%' };
      case 'rounded':
        return { borderRadius: '8px' };
      case 'text':
        return { borderRadius: '4px', height: '1em' };
      default:
        return { borderRadius: '4px' };
    }
  };

  const getAnimationClass = () => {
    switch (animation) {
      case 'pulse':
        return 'animate-pulse';
      case 'shimmer':
        return 'skeleton-shimmer';
      default:
        return '';
    }
  };

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        .skeleton-shimmer {
          animation: shimmer 2s infinite linear;
          background: linear-gradient(
            90deg,
            rgba(42, 42, 42, 1) 0%,
            rgba(60, 45, 100, 0.6) 20%,
            rgba(124, 93, 250, 0.3) 50%,
            rgba(60, 45, 100, 0.6) 80%,
            rgba(42, 42, 42, 1) 100%
          );
          background-size: 1000px 100%;
        }
      `}</style>
      <div
        className={`${getAnimationClass()} ${className}`}
        style={{
          width: width || '100%',
          height: height || '20px',
          backgroundColor: colors.background.tertiary,
          ...getVariantStyles(),
        }}
      />
    </>
  );
}

/**
 * Wizard progress stepper skeleton
 */
export function WizardStepperSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center gap-2 flex-1">
          <Skeleton variant="circular" width={32} height={32} />
          <div className="flex-1">
            <Skeleton variant="text" width="60%" height={12} />
            <Skeleton variant="text" width="40%" height={10} className="mt-1" />
          </div>
          {step < 4 && (
            <Skeleton width={40} height={2} />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Form field skeleton
 */
export function FormFieldSkeleton({ rows = 1 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton variant="text" width="30%" height={14} />
      {rows === 1 ? (
        <Skeleton variant="rounded" height={40} />
      ) : (
        <Skeleton variant="rounded" height={rows * 24} />
      )}
      <Skeleton variant="text" width="20%" height={10} />
    </div>
  );
}

/**
 * Card skeleton for preview panels
 */
export function CardSkeleton() {
  return (
    <div 
      className="p-6 rounded-lg border"
      style={{ 
        backgroundColor: colors.background.secondary,
        borderColor: colors.border.medium
      }}
    >
      <div className="flex items-center gap-4 mb-4">
        <Skeleton variant="circular" width={60} height={60} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="40%" height={16} />
          <Skeleton variant="text" width="60%" height={12} />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="90%" />
      </div>
    </div>
  );
}

/**
 * Full wizard page skeleton
 */
export function WizardPageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton variant="text" width="40%" height={32} />
        <Skeleton variant="text" width="60%" height={16} />
      </div>

      {/* Stepper */}
      <WizardStepperSkeleton />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left panel - form fields */}
        <div className="space-y-6">
          <CardSkeleton />
          <div className="space-y-4">
            <FormFieldSkeleton />
            <FormFieldSkeleton />
            <FormFieldSkeleton rows={4} />
          </div>
        </div>

        {/* Right panel - preview */}
        <div className="space-y-4">
          <CardSkeleton />
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex justify-between pt-4">
        <Skeleton variant="rounded" width={100} height={40} />
        <div className="flex gap-2">
          <Skeleton variant="rounded" width={80} height={40} />
          <Skeleton variant="rounded" width={120} height={40} />
        </div>
      </div>
    </div>
  );
}

/**
 * Avatar upload skeleton with circular progress
 */
export function AvatarUploadSkeleton({ progress }: { progress?: number }) {
  return (
    <div className="relative">
      <Skeleton variant="circular" width={80} height={80} animation="pulse" />
      {progress !== undefined && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ color: colors.brand.purple }}
        >
          <span className="text-sm font-medium">{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  );
}
