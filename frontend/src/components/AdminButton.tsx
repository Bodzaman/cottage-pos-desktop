import React, { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { colors } from 'utils/designSystem';

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const AdminButton = forwardRef<HTMLButtonElement, AdminButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingText = 'Loading...',
    leftIcon,
    rightIcon,
    fullWidth = false,
    className,
    children,
    disabled,
    ...props
  }, ref) => {
    
    // Variant-based styling
    const getVariantStyles = () => {
      switch (variant) {
        case 'primary':
          return {
            background: 'linear-gradient(145deg, rgba(124, 93, 250, 0.9), rgba(124, 93, 250, 0.7))',
            border: '1px solid rgba(124, 93, 250, 0.5)',
            color: '#FFFFFF',
            hoverBg: 'linear-gradient(145deg, rgba(124, 93, 250, 1), rgba(124, 93, 250, 0.9))',
            hoverBorder: '1px solid rgba(124, 93, 250, 0.8)',
            shadow: '0 4px 12px rgba(124, 93, 250, 0.3)',
            hoverShadow: '0 6px 20px rgba(124, 93, 250, 0.4)'
          };
        case 'secondary':
          return {
            background: 'linear-gradient(145deg, rgba(26, 26, 26, 0.9), rgba(26, 26, 26, 0.7))',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#FFFFFF',
            hoverBg: 'linear-gradient(145deg, rgba(26, 26, 26, 1), rgba(26, 26, 26, 0.9))',
            hoverBorder: '1px solid rgba(255, 255, 255, 0.3)',
            shadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            hoverShadow: '0 6px 20px rgba(0, 0, 0, 0.4)'
          };
        case 'outline':
          return {
            background: 'transparent',
            border: '1px solid rgba(124, 93, 250, 0.5)',
            color: 'rgba(124, 93, 250, 0.9)',
            hoverBg: 'rgba(124, 93, 250, 0.1)',
            hoverBorder: '1px solid rgba(124, 93, 250, 0.8)',
            shadow: '0 2px 8px rgba(124, 93, 250, 0.1)',
            hoverShadow: '0 4px 12px rgba(124, 93, 250, 0.2)'
          };
        case 'ghost':
          return {
            background: 'transparent',
            border: '1px solid transparent',
            color: 'rgba(255, 255, 255, 0.8)',
            hoverBg: 'rgba(255, 255, 255, 0.1)',
            hoverBorder: '1px solid rgba(255, 255, 255, 0.2)',
            shadow: 'none',
            hoverShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          };
        case 'destructive':
          return {
            background: 'linear-gradient(145deg, rgba(239, 68, 68, 0.9), rgba(239, 68, 68, 0.7))',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            color: '#FFFFFF',
            hoverBg: 'linear-gradient(145deg, rgba(239, 68, 68, 1), rgba(239, 68, 68, 0.9))',
            hoverBorder: '1px solid rgba(239, 68, 68, 0.8)',
            shadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
            hoverShadow: '0 6px 20px rgba(239, 68, 68, 0.4)'
          };
        case 'success':
          return {
            background: 'linear-gradient(145deg, rgba(34, 197, 94, 0.9), rgba(34, 197, 94, 0.7))',
            border: '1px solid rgba(34, 197, 94, 0.5)',
            color: '#FFFFFF',
            hoverBg: 'linear-gradient(145deg, rgba(34, 197, 94, 1), rgba(34, 197, 94, 0.9))',
            hoverBorder: '1px solid rgba(34, 197, 94, 0.8)',
            shadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
            hoverShadow: '0 6px 20px rgba(34, 197, 94, 0.4)'
          };
        default:
          return getVariantStyles();
      }
    };
    
    // Size-based styling
    const getSizeStyles = () => {
      switch (size) {
        case 'sm':
          return {
            height: '2rem', // h-8
            fontSize: '0.875rem', // text-sm
            padding: '0.25rem 0.75rem', // px-3 py-1
            iconSize: '0.875rem', // w-3.5 h-3.5
            gap: '0.375rem' // gap-1.5
          };
        case 'lg':
          return {
            height: '3rem', // h-12
            fontSize: '1.125rem', // text-lg
            padding: '0.75rem 1.5rem', // px-6 py-3
            iconSize: '1.25rem', // w-5 h-5
            gap: '0.5rem' // gap-2
          };
        case 'xl':
          return {
            height: '3.5rem', // h-14
            fontSize: '1.25rem', // text-xl
            padding: '1rem 2rem', // px-8 py-4
            iconSize: '1.5rem', // w-6 h-6
            gap: '0.625rem' // gap-2.5
          };
        default:
          return {
            height: '2.5rem', // h-10
            fontSize: '1rem', // text-base
            padding: '0.5rem 1rem', // px-4 py-2
            iconSize: '1rem', // w-4 h-4
            gap: '0.5rem' // gap-2
          };
      }
    };
    
    const variantStyles = getVariantStyles();
    const sizeStyles = getSizeStyles();
    const isDisabled = disabled || loading;
    
    return (
      <Button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base styling
          "relative overflow-hidden transition-all duration-300 ease-in-out",
          "backdrop-blur-sm border-0 outline-none ring-0",
          "focus:outline-none focus:ring-0",
          "transform hover:scale-[1.02] active:scale-[0.98]",
          // Full width
          fullWidth && "w-full",
          // Disabled state
          isDisabled && "opacity-50 cursor-not-allowed hover:scale-100",
          className
        )}
        style={{
          height: sizeStyles.height,
          fontSize: sizeStyles.fontSize,
          padding: sizeStyles.padding,
          background: variantStyles.background,
          border: variantStyles.border,
          color: variantStyles.color,
          boxShadow: variantStyles.shadow,
          backdropFilter: 'blur(8px)'
        }}
        onMouseEnter={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.background = variantStyles.hoverBg;
            e.currentTarget.style.border = variantStyles.hoverBorder;
            e.currentTarget.style.boxShadow = variantStyles.hoverShadow;
          }
          props.onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.background = variantStyles.background;
            e.currentTarget.style.border = variantStyles.border;
            e.currentTarget.style.boxShadow = variantStyles.shadow;
          }
          props.onMouseLeave?.(e);
        }}
        {...props}
      >
        {/* Content container */}
        <div 
          className="flex items-center justify-center relative z-10"
          style={{ gap: sizeStyles.gap }}
        >
          {/* Left Icon */}
          {leftIcon && !loading && (
            <span 
              className="flex items-center justify-center"
              style={{ width: sizeStyles.iconSize, height: sizeStyles.iconSize }}
            >
              {leftIcon}
            </span>
          )}
          
          {/* Loading Spinner */}
          {loading && (
            <div 
              className="animate-spin rounded-full border-2 border-current border-t-transparent"
              style={{ width: sizeStyles.iconSize, height: sizeStyles.iconSize }}
            />
          )}
          
          {/* Button Text */}
          <span className="font-medium">
            {loading ? loadingText : children}
          </span>
          
          {/* Right Icon */}
          {rightIcon && !loading && (
            <span 
              className="flex items-center justify-center"
              style={{ width: sizeStyles.iconSize, height: sizeStyles.iconSize }}
            >
              {rightIcon}
            </span>
          )}
        </div>
        
        {/* Shine overlay effect */}
        <div 
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)',
            transform: 'translateX(-100%)',
            animation: !isDisabled ? 'shine 2s infinite' : 'none'
          }}
        />
      </Button>
    );
  }
);

AdminButton.displayName = 'AdminButton';

// Add keyframe animation for shine effect
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shine {
      0% { transform: translateX(-100%); }
      50% { transform: translateX(100%); }
      100% { transform: translateX(100%); }
    }
  `;
  document.head.appendChild(style);
}
