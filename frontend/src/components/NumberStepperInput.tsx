
import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { colors } from 'utils/designSystem';

interface NumberStepperInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  icon?: React.ReactNode;
  variant?: 'default' | 'purple' | 'teal' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  step?: number;
  min?: number;
  max?: number;
  value?: number;
  onChange?: (value: number) => void;
  showSteppers?: boolean;
  precision?: number; // For decimal places
  prefix?: string; // e.g., "£" for currency
  suffix?: string; // e.g., "kg" for weight
}

export const NumberStepperInput = forwardRef<HTMLInputElement, NumberStepperInputProps>(
  ({
    label,
    description,
    error,
    required = false,
    icon,
    variant = 'default',
    size = 'md',
    step = 1,
    min,
    max,
    value = 0,
    onChange,
    showSteppers = true,
    precision = 0,
    prefix,
    suffix,
    className,
    id,
    disabled,
    ...props
  }, ref) => {
    const inputId = id || `number-stepper-${Math.random().toString(36).substr(2, 9)}`;
    
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
            buttonColor: 'rgba(124, 93, 250, 0.8)',
            buttonHover: 'rgba(124, 93, 250, 1)'
          };
        case 'teal':
          return {
            background: 'rgba(26, 26, 26, 0.8)',
            border: '1px solid rgba(14, 186, 177, 0.3)',
            focusBorder: 'rgba(14, 186, 177, 0.8)',
            shadow: '0 0 0 3px rgba(14, 186, 177, 0.1)',
            glow: '0 0 8px rgba(14, 186, 177, 0.2)',
            buttonColor: 'rgba(14, 186, 177, 0.8)',
            buttonHover: 'rgba(14, 186, 177, 1)'
          };
        case 'gold':
          return {
            background: 'rgba(26, 26, 26, 0.8)',
            border: '1px solid rgba(192, 192, 192, 0.3)',      // Silver border
            focusBorder: 'rgba(192, 192, 192, 0.8)',          // Silver focus
            shadow: '0 0 0 3px rgba(192, 192, 192, 0.1)',     // Silver shadow
            glow: '0 0 8px rgba(192, 192, 192, 0.2)',         // Silver glow
            buttonColor: 'rgba(192, 192, 192, 0.8)',          // Silver button
            buttonHover: 'rgba(192, 192, 192, 1)'             // Silver button hover
          };
        default:
          return {
            background: 'rgba(26, 26, 26, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            focusBorder: 'rgba(124, 93, 250, 0.6)',
            shadow: '0 0 0 3px rgba(124, 93, 250, 0.1)',
            glow: '0 0 8px rgba(124, 93, 250, 0.15)',
            buttonColor: 'rgba(124, 93, 250, 0.7)',
            buttonHover: 'rgba(124, 93, 250, 0.9)'
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
            buttonSize: '1.5rem', // w-6 h-6
            iconSize: '0.75rem', // w-3 h-3
            padding: '0.25rem 0.75rem' // px-3 py-1
          };
        case 'lg':
          return {
            height: '3rem', // h-12
            fontSize: '1.125rem', // text-lg
            buttonSize: '2.5rem', // w-10 h-10
            iconSize: '1.25rem', // w-5 h-5
            padding: '0.75rem 1rem' // px-4 py-3
          };
        default:
          return {
            height: '2.5rem', // h-10
            fontSize: '1rem', // text-base
            buttonSize: '2rem', // w-8 h-8
            iconSize: '1rem', // w-4 h-4
            padding: '0.5rem 0.75rem' // px-3 py-2
          };
      }
    };
    
    const variantStyles = getVariantStyles();
    const sizeStyles = getSizeStyles();
    
    // Format value for display
    const formatValue = (val: number) => {
      if (precision > 0) {
        return val.toFixed(precision);
      }
      return val.toString();
    };
    
    // Handle increment/decrement
    const handleIncrement = () => {
      if (disabled) return;
      const newValue = value + step;
      if (max === undefined || newValue <= max) {
        onChange?.(Number(formatValue(newValue)));
      }
    };
    
    const handleDecrement = () => {
      if (disabled) return;
      const newValue = value - step;
      if (min === undefined || newValue >= min) {
        onChange?.(Number(formatValue(newValue)));
      }
    };
    
    // Handle direct input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value) || 0;
      onChange?.(val);
    };
    
    const isMinDisabled = min !== undefined && value <= min;
    const isMaxDisabled = max !== undefined && value >= max;
    
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
        
        {/* Number Input Container */}
        <div className="relative group flex items-center">
          {/* Decrement Button */}
          {showSteppers && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || isMinDisabled}
              onClick={handleDecrement}
              className={cn(
                "p-0 transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed",
                "border-0 hover:bg-transparent"
              )}
              style={{
                width: sizeStyles.buttonSize,
                height: sizeStyles.buttonSize,
                color: (disabled || isMinDisabled) ? 'rgba(255, 255, 255, 0.3)' : variantStyles.buttonColor
              }}
              onMouseEnter={(e) => {
                if (!disabled && !isMinDisabled) {
                  e.currentTarget.style.color = variantStyles.buttonHover;
                  e.currentTarget.style.filter = 'drop-shadow(0 0 4px currentColor)';
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled && !isMinDisabled) {
                  e.currentTarget.style.color = variantStyles.buttonColor;
                  e.currentTarget.style.filter = 'none';
                }
              }}
            >
              <Minus style={{ width: sizeStyles.iconSize, height: sizeStyles.iconSize }} />
            </Button>
          )}
          
          {/* Input Field */}
          <div className="relative flex-1 mx-2">
            {/* Prefix */}
            {prefix && (
              <span 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 pointer-events-none z-10"
                style={{ fontSize: sizeStyles.fontSize }}
              >
                {prefix}
              </span>
            )}
            
            <Input
              ref={ref}
              id={inputId}
              type="number"
              step={step}
              min={min}
              max={max}
              value={formatValue(value)}
              onChange={handleInputChange}
              disabled={disabled}
              className={cn(
                // Base styling
                "transition-all duration-300 ease-in-out text-center",
                "backdrop-blur-sm",
                "text-white placeholder:text-gray-400",
                "border-0 outline-none ring-0",
                "focus:outline-none focus:ring-0",
                // Prefix/suffix padding
                prefix && "pl-8",
                suffix && "pr-8",
                // Error states
                error && "border-red-500/50 bg-red-900/10",
                className
              )}
              style={{
                height: sizeStyles.height,
                fontSize: sizeStyles.fontSize,
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
                props.onFocus?.(e as any);
              }}
              onBlur={(e) => {
                e.target.style.border = error ? '1px solid rgba(239, 68, 68, 0.5)' : variantStyles.border;
                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)';
                props.onBlur?.(e as any);
              }}
              {...props}
            />
            
            {/* Suffix */}
            {suffix && (
              <span 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 pointer-events-none z-10"
                style={{ fontSize: sizeStyles.fontSize }}
              >
                {suffix}
              </span>
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
          
          {/* Increment Button */}
          {showSteppers && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || isMaxDisabled}
              onClick={handleIncrement}
              className={cn(
                "p-0 transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed",
                "border-0 hover:bg-transparent"
              )}
              style={{
                width: sizeStyles.buttonSize,
                height: sizeStyles.buttonSize,
                color: (disabled || isMaxDisabled) ? 'rgba(255, 255, 255, 0.3)' : variantStyles.buttonColor
              }}
              onMouseEnter={(e) => {
                if (!disabled && !isMaxDisabled) {
                  e.currentTarget.style.color = variantStyles.buttonHover;
                  e.currentTarget.style.filter = 'drop-shadow(0 0 4px currentColor)';
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled && !isMaxDisabled) {
                  e.currentTarget.style.color = variantStyles.buttonColor;
                  e.currentTarget.style.filter = 'none';
                }
              }}
            >
              <Plus style={{ width: sizeStyles.iconSize, height: sizeStyles.iconSize }} />
            </Button>
          )}
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

NumberStepperInput.displayName = 'NumberStepperInput';
