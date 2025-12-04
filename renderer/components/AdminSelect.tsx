
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { colors } from 'utils/designSystem';

interface AdminSelectProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  icon?: React.ReactNode;
  variant?: 'default' | 'purple' | 'teal' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
}

export const AdminSelect: React.FC<AdminSelectProps> = ({
  label,
  description,
  error,
  required = false,
  icon,
  variant = 'default',
  size = 'md',
  placeholder = 'Select an option...',
  value,
  onValueChange,
  disabled = false,
  className,
  children,
  options
}) => {
  const selectId = `admin-select-${Math.random().toString(36).substr(2, 9)}`;
  
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
          contentBg: 'rgba(26, 26, 26, 0.95)'
        };
      case 'teal':
        return {
          background: 'rgba(26, 26, 26, 0.8)',
          border: '1px solid rgba(14, 186, 177, 0.3)',
          focusBorder: 'rgba(14, 186, 177, 0.8)',
          shadow: '0 0 0 3px rgba(14, 186, 177, 0.1)',
          glow: '0 0 8px rgba(14, 186, 177, 0.2)',
          contentBg: 'rgba(26, 26, 26, 0.95)'
        };
      case 'gold':
        return {
          background: 'rgba(26, 26, 26, 0.8)',
          border: '1px solid rgba(192, 192, 192, 0.3)',      // Silver border
          focusBorder: 'rgba(192, 192, 192, 0.8)',          // Silver focus
          shadow: '0 0 0 3px rgba(192, 192, 192, 0.1)',     // Silver shadow
          glow: '0 0 8px rgba(192, 192, 192, 0.2)',         // Silver glow
          contentBg: 'rgba(26, 26, 26, 0.95)'
        };
      default:
        return {
          background: 'rgba(26, 26, 26, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          focusBorder: 'rgba(124, 93, 250, 0.6)',
          shadow: '0 0 0 3px rgba(124, 93, 250, 0.1)',
          glow: '0 0 8px rgba(124, 93, 250, 0.15)',
          contentBg: 'rgba(26, 26, 26, 0.95)'
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
          padding: '0.25rem 2rem 0.25rem 0.75rem' // px-3 py-1 pr-8
        };
      case 'lg':
        return {
          height: '3rem', // h-12
          fontSize: '1.125rem', // text-lg
          padding: '0.75rem 2.5rem 0.75rem 1rem' // px-4 py-3 pr-10
        };
      default:
        return {
          height: '2.5rem', // h-10
          fontSize: '1rem', // text-base
          padding: '0.5rem 2rem 0.5rem 0.75rem' // px-3 py-2 pr-8
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
          htmlFor={selectId} 
          className="text-white text-sm font-medium flex items-center gap-1"
        >
          {icon && <span className="text-lg">{icon}</span>}
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </Label>
      )}
      
      {/* Select Container */}
      <div className="relative group">
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
          <SelectTrigger 
            id={selectId}
            className={cn(
              // Base styling
              "transition-all duration-300 ease-in-out",
              "backdrop-blur-sm",
              "text-white",
              "border-0 outline-none ring-0",
              "focus:outline-none focus:ring-0",
              // Error states
              error && "border-red-500/50 bg-red-900/10",
              // Disabled states
              disabled && "opacity-50 cursor-not-allowed",
              className
            )}
            style={{
              ...sizeStyles,
              background: error ? 'rgba(239, 68, 68, 0.1)' : variantStyles.background,
              border: error ? '1px solid rgba(239, 68, 68, 0.5)' : variantStyles.border,
              boxShadow: `0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
              backdropFilter: 'blur(8px)'
            }}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          
          <SelectContent 
            className={cn(
              "backdrop-blur-lg border-0",
              "shadow-2xl"
            )}
            style={{
              background: variantStyles.contentBg,
              border: `1px solid ${variantStyles.border}`,
              boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2), ${variantStyles.glow}`,
              backdropFilter: 'blur(12px)'
            }}
          >
            {/* Render options if provided */}
            {options ? (
              options.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                  className="text-white hover:bg-white/10 focus:bg-white/10 transition-colors duration-200"
                >
                  {option.label}
                </SelectItem>
              ))
            ) : (
              children
            )}
          </SelectContent>
        </Select>
        
        {/* Focus effect overlay */}
        <div 
          className="absolute inset-0 rounded-md pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)',
            border: `1px solid ${variantStyles.focusBorder}`,
            boxShadow: `${variantStyles.shadow}, ${variantStyles.glow}`
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
};

AdminSelect.displayName = 'AdminSelect';
