
import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { colors } from 'utils/designSystem';

interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  icon?: React.ReactNode;
  variant?: 'default' | 'purple' | 'teal' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  showFloatingLabel?: boolean;
}

export const AdminInput = forwardRef<HTMLInputElement, AdminInputProps>(
  ({
    label,
    description,
    error,
    required = false,
    icon,
    variant = 'default',
    size = 'md',
    showFloatingLabel = false,
    className,
    id,
    ...props
  }, ref) => {
    const inputId = id || `admin-input-${Math.random().toString(36).substr(2, 9)}`;
    
    // Variant-based styling
    const getVariantStyles = () => {
      switch (variant) {
        case 'purple':
          return {
            background: 'rgba(26, 26, 26, 0.8)',
            border: '1px solid rgba(124, 93, 250, 0.3)',
            focusBorder: 'rgba(124, 93, 250, 0.8)',
            shadow: '0 0 0 3px rgba(124, 93, 250, 0.1)',
            glow: '0 0 8px rgba(124, 93, 250, 0.2)'
          };
        case 'teal':
          return {
            background: 'rgba(26, 26, 26, 0.8)',
            border: '1px solid rgba(14, 186, 177, 0.3)',
            focusBorder: 'rgba(14, 186, 177, 0.8)',
            shadow: '0 0 0 3px rgba(14, 186, 177, 0.1)',
            glow: '0 0 8px rgba(14, 186, 177, 0.2)'
          };
        case 'gold':
          return {
            background: 'rgba(26, 26, 26, 0.8)',
            border: '1px solid rgba(192, 192, 192, 0.3)',      // Silver border
            focusBorder: 'rgba(192, 192, 192, 0.8)',          // Silver focus
            shadow: '0 0 0 3px rgba(192, 192, 192, 0.1)',     // Silver shadow
            glow: '0 0 8px rgba(192, 192, 192, 0.2)'          // Silver glow
          };
        default:
          return {
            background: 'rgba(26, 26, 26, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            focusBorder: 'rgba(124, 93, 250, 0.6)',
            shadow: '0 0 0 3px rgba(124, 93, 250, 0.1)',
            glow: '0 0 8px rgba(124, 93, 250, 0.15)'
          };
      }
    };
    
    // Size-based styling
    const getSizeStyles = () => {
      switch (size) {
        case 'sm':
          return {
            height: '2rem', // h-8
            fontSize: '0.875rem', // text-sm
            padding: '0.25rem 0.75rem' // px-3 py-1
          };
        case 'lg':
          return {
            height: '3rem', // h-12
            fontSize: '1.125rem', // text-lg
            padding: '0.75rem 1rem' // px-4 py-3
          };
        default:
          return {
            height: '2.5rem', // h-10
            fontSize: '1rem', // text-base
            padding: '0.5rem 0.75rem' // px-3 py-2
          };
      }
    };
    
    const variantStyles = getVariantStyles();
    const sizeStyles = getSizeStyles();
    
    return (
      <div className="w-full space-y-2">
        {/* Label */}
        {label && (
          <Label 
            htmlFor={inputId} 
            className="text-white text-sm font-medium flex items-center gap-1"
          >
            {icon && <span className="text-lg">{icon}</span>}
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </Label>
        )}
        
        {/* Input Container */}
        <div className="relative group">
          <Input
            ref={ref}
            id={inputId}
            className={cn(
              // Base styling
              "transition-all duration-300 ease-in-out",
              "backdrop-blur-sm",
              "text-white placeholder:text-gray-400",
              "border-0 outline-none ring-0",
              // Focus states with enhanced styling
              "focus:outline-none focus:ring-0",
              // Error states
              error && "border-red-500/50 bg-red-900/10",
              className
            )}
            style={{
              ...sizeStyles,
              background: error ? 'rgba(239, 68, 68, 0.1)' : variantStyles.background,
              border: error ? '1px solid rgba(239, 68, 68, 0.5)' : variantStyles.border,
              boxShadow: `0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
              backdropFilter: 'blur(8px)'
            }}
            onFocus={(e) => {
              e.target.style.border = error ? '1px solid rgba(239, 68, 68, 0.8)' : variantStyles.focusBorder;
              e.target.style.boxShadow = error 
                ? '0 0 0 3px rgba(239, 68, 68, 0.1), 0 0 8px rgba(239, 68, 68, 0.2)'
                : `${variantStyles.shadow}, ${variantStyles.glow}, 0 4px 12px rgba(0, 0, 0, 0.15)`;
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              e.target.style.border = error ? '1px solid rgba(239, 68, 68, 0.5)' : variantStyles.border;
              e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)';
              props.onBlur?.(e);
            }}
            {...props}
          />
          
          {/* Focus ring overlay */}
          <div 
            className="absolute inset-0 rounded-md pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)',
              border: `1px solid ${variantStyles.focusBorder}`,
            }}
          />
        </div>
        
        {/* Description */}
        {description && (
          <p className="text-xs text-gray-400 leading-relaxed">
            {description}
          </p>
        )}
        
        {/* Error Message */}
        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <span className="text-red-400">⚠</span>
            {error}
          </p>
        )}
      </div>
    );
  }
);

AdminInput.displayName = 'AdminInput';
