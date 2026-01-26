import React from 'react';
import { cn } from 'utils/cn';

interface PremiumCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  subsurface?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

/**
 * PremiumCard - Glassmorphic card component for Customer Portal
 * Semi-transparent dark background with subtle border
 * Optional subsurface lighting for premium depth effect
 * Consistent styling across all portal sections
 */
export function PremiumCard({
  children,
  className,
  hover = false,
  padding = 'none',
  subsurface = false,
}: PremiumCardProps) {
  return (
    <div
      className={cn(
        "relative backdrop-blur-md rounded-2xl border border-white/10",
        "transition-all duration-300",
        paddingClasses[padding],
        hover && "hover:border-[#8B1538]/30 hover:shadow-lg hover:shadow-[#8B1538]/10",
        className
      )}
      style={{
        background: 'rgba(26, 26, 26, 0.7)',
        boxShadow: subsurface
          ? 'inset 0 1px 0 0 rgba(255,255,255,0.05), inset 0 0 20px rgba(139,21,56,0.03), 0 1px 2px rgba(0,0,0,0.2)'
          : undefined,
      }}
    >
      {/* Top edge highlight for subsurface lighting effect */}
      {subsurface && (
        <div
          className="absolute inset-x-0 top-0 h-px rounded-t-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)'
          }}
        />
      )}
      {children}
    </div>
  );
}

export default PremiumCard;
