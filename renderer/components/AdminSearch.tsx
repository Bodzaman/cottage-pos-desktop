
import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { colors } from 'utils/designSystem';

interface AdminSearchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  description?: string;
  variant?: 'default' | 'purple' | 'teal' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  showClearButton?: boolean;
  onClear?: () => void;
  searchIcon?: React.ReactNode;
}

export const AdminSearch = forwardRef<HTMLInputElement, AdminSearchProps>(
  ({
    label,
    description,
    variant = 'default',
    size = 'md',
    showClearButton = true,
    onClear,
    searchIcon,
    className,
    value,
    onChange,
    id,
    ...props
  }, ref) => {
    const inputId = id || `admin-search-${Math.random().toString(36).substr(2, 9)}`;
    
    // Variant-based styling
    const getVariantStyles = () => {
      switch (variant) {
        case 'purple':
          return {
            background: 'rgba(26, 26, 26, 0.8)',
            border: '1px solid rgba(124, 93, 250, 0.3)',
            focusBorder: 'rgba(124, 93, 250, 0.8)',
            shadow: '0 0 0 3px rgba(124, 93, 250, 0.1)',
            glow: '0 0 8px rgba(124, 93, 250, 0.2)',
            iconColor: 'rgba(124, 93, 250, 0.7)'
          };
        case 'teal':
          return {
            background: 'rgba(26, 26, 26, 0.8)',
            border: '1px solid rgba(14, 186, 177, 0.3)',
            focusBorder: 'rgba(14, 186, 177, 0.8)',
            shadow: '0 0 0 3px rgba(14, 186, 177, 0.1)',
            glow: '0 0 8px rgba(14, 186, 177, 0.2)',
            iconColor: 'rgba(14, 186, 177, 0.7)'
          };
        case 'gold':
          return {
            background: 'rgba(26, 26, 26, 0.8)',
            border: '1px solid rgba(192, 192, 192, 0.3)',      // Silver border
            focusBorder: 'rgba(192, 192, 192, 0.8)',          // Silver focus
            shadow: '0 0 0 3px rgba(192, 192, 192, 0.1)',     // Silver shadow
            glow: '0 0 8px rgba(192, 192, 192, 0.2)',         // Silver glow
            iconColor: 'rgba(192, 192, 192, 0.7)'             // Silver icon
          };
        default:
          return {
            background: 'rgba(26, 26, 26, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            focusBorder: 'rgba(124, 93, 250, 0.6)',
            shadow: '0 0 0 3px rgba(124, 93, 250, 0.1)',
            glow: '0 0 8px rgba(124, 93, 250, 0.15)',
            iconColor: 'rgba(255, 255, 255, 0.5)'
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
            paddingLeft: '2rem', // pl-8
            paddingRight: showClearButton && value ? '2rem' : '0.75rem', // pr-8 or pr-3
            iconSize: '0.875rem', // w-3.5 h-3.5
            iconLeft: '0.5rem' // left-2
          };
        case 'lg':
          return {
            height: '3rem', // h-12
            fontSize: '1.125rem', // text-lg
            paddingLeft: '3rem', // pl-12
            paddingRight: showClearButton && value ? '3rem' : '1rem', // pr-12 or pr-4
            iconSize: '1.25rem', // w-5 h-5
            iconLeft: '0.75rem' // left-3
          };
        default:
          return {
            height: '2.5rem', // h-10
            fontSize: '1rem', // text-base
            paddingLeft: '2.5rem', // pl-10
            paddingRight: showClearButton && value ? '2.5rem' : '0.75rem', // pr-10 or pr-3
            iconSize: '1rem', // w-4 h-4
            iconLeft: '0.625rem' // left-2.5
          };
      }
    };
    
    const variantStyles = getVariantStyles();
    const sizeStyles = getSizeStyles();
    
    const handleClear = () => {
      if (onClear) {
        onClear();
      } else if (onChange) {
        // Create a synthetic event for onChange
        const syntheticEvent = {
          target: { value: '' },
          currentTarget: { value: '' }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };
    
    return (
      <div className="w-full space-y-2">
        {/* Label */}
        {label && (
          <Label 
            htmlFor={inputId} 
            className="text-white text-sm font-medium flex items-center gap-2"
          >
            <Search style={{ width: sizeStyles.iconSize, height: sizeStyles.iconSize }} />
            {label}
          </Label>
        )}
        
        {/* Search Container */}
        <div className="relative group">
          {/* Search Icon */}
          <div 
            className="absolute z-10 flex items-center justify-center pointer-events-none"
            style={{
              left: sizeStyles.iconLeft,
              top: '50%',
              transform: 'translateY(-50%)',
              width: sizeStyles.iconSize,
              height: sizeStyles.iconSize,
              color: variantStyles.iconColor
            }}
          >
            {searchIcon || <Search style={{ width: sizeStyles.iconSize, height: sizeStyles.iconSize }} />}
          </div>
          
          {/* Input Field */}
          <Input
            ref={ref}
            id={inputId}
            type="search"
            value={value}
            onChange={onChange}
            className={cn(
              // Base styling
              "transition-all duration-300 ease-in-out",
              "backdrop-blur-sm",
              "text-white placeholder:text-gray-400",
              "border-0 outline-none ring-0",
              "focus:outline-none focus:ring-0",
              className
            )}
            style={{
              height: sizeStyles.height,
              fontSize: sizeStyles.fontSize,
              paddingLeft: sizeStyles.paddingLeft,
              paddingRight: sizeStyles.paddingRight,
              background: variantStyles.background,
              border: variantStyles.border,
              boxShadow: `0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
              backdropFilter: 'blur(8px)'
            }}
            onFocus={(e) => {
              e.target.style.border = variantStyles.focusBorder;
              e.target.style.boxShadow = `${variantStyles.shadow}, ${variantStyles.glow}, 0 4px 12px rgba(0, 0, 0, 0.15)`;
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              e.target.style.border = variantStyles.border;
              e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)';
              props.onBlur?.(e);
            }}
            {...props}
          />
          
          {/* Clear Button */}
          {showClearButton && value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute z-10 flex items-center justify-center transition-all duration-200 hover:scale-110 group/clear"
              style={{
                right: sizeStyles.iconLeft,
                top: '50%',
                transform: 'translateY(-50%)',
                width: sizeStyles.iconSize,
                height: sizeStyles.iconSize,
                color: 'rgba(255, 255, 255, 0.5)'
              }}
            >
              <X 
                style={{ width: sizeStyles.iconSize, height: sizeStyles.iconSize }} 
                className="group-hover/clear:text-red-400 transition-colors duration-200"
              />
            </button>
          )}
          
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
      </div>
    );
  }
);

AdminSearch.displayName = 'AdminSearch';
