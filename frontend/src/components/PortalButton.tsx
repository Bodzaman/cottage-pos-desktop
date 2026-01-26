import React from 'react';
import { cn } from 'utils/cn';

interface PortalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children: React.ReactNode;
}

const variantClasses = {
  primary: [
    'bg-gradient-to-r from-[#8B1538] to-[#7A1230]',
    'text-white rounded-xl border border-[#8B1538]',
    'shadow-[0_0_20px_rgba(139,21,56,0.35)]',
    'hover:from-[#A01B42] hover:to-[#8B1538]',
    'hover:shadow-[0_0_28px_rgba(139,21,56,0.5)]',
    'active:scale-[0.98]',
  ].join(' '),
  secondary: [
    'bg-transparent border border-white/20',
    'text-gray-300 rounded-xl',
    'hover:bg-white/10 hover:text-white hover:border-white/30',
    'active:scale-[0.98]',
  ].join(' '),
  tertiary: [
    'bg-transparent text-[#8B1538]',
    'hover:text-[#A91D47] hover:underline underline-offset-4',
    'p-0',
  ].join(' '),
};

const sizeClasses = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-10 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10 p-0 justify-center',
};

/**
 * PortalButton - Standardized button component for Customer Portal
 * Three tiers: Primary (main CTA), Secondary (neutral), Tertiary (text)
 * Consistent sizing, alignment, and interaction states
 */
export function PortalButton({
  variant = 'primary',
  size = 'md',
  children,
  className,
  disabled,
  ...props
}: PortalButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium',
        'transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B1538]/50',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F0F]',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        variant !== 'tertiary' && sizeClasses[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default PortalButton;
