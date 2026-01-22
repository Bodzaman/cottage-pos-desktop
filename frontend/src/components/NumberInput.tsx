


import React, { useState, useEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QSAITheme, styles, effects } from '../utils/QSAIDesign';

/**
 * Props interface for the NumberInput component
 */
export interface NumberInputProps {
  /** Current value */
  value: number;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Label for the input */
  label?: string;
  /** Help text displayed below the input */
  helpText?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Error message to display */
  error?: string;
  /** Additional CSS classes */
  className?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether to show the dropdown with quick select options */
  showDropdown?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom dropdown options (if not provided, will use 1-99 range) */
  dropdownOptions?: number[];
}

/**
 * NumberInput Component
 * 
 * A pure scroll-based number input component with smart auto-detection UX.
 * Features:
 * - Pure scroll input: mouse wheel and touch scroll support
 * - Smart auto-detection: shows dropdown by default, switches to manual on typing
 * - Range: 1-99 by default (configurable)
 * - Clean, minimal UI without buttons
 * - Visual feedback during scroll interactions
 * - Consistent with QSAI purple design system
 * - Full accessibility support (keyboard navigation, screen reader support)
 * - Comprehensive validation and error handling
 * - Mobile responsive design
 * - TypeScript interfaces for type safety
 * 
 * @example
 * ```tsx
 * <NumberInput
 *   value={guestCount}
 *   onChange={setGuestCount}
 *   label="Number of Guests"
 *   min={1}
 *   max={50}
 *   showDropdown={true}
 * />
 * ```
 */
export function NumberInput({
  value,
  onChange,
  min = 1,
  max = 99,
  label,
  helpText,
  disabled = false,
  error,
  className = '',
  placeholder = 'Select or type number',
  showDropdown = true,
  size = 'md',
  dropdownOptions
}: NumberInputProps) {
  // State management
  const [inputMode, setInputMode] = useState<'dropdown' | 'manual'>('dropdown');
  const [inputValue, setInputValue] = useState(value.toString());
  const [isTyping, setIsTyping] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Generate dropdown options if not provided
  const selectOptions = dropdownOptions || Array.from({ length: Math.min(max - min + 1, 50) }, (_, i) => min + i);
  
  // Size configurations
  const sizeConfig = {
    sm: {
      height: '36px',
      fontSize: '14px'
    },
    md: {
      height: '48px',
      fontSize: '16px'
    },
    lg: {
      height: '56px',
      fontSize: '18px'
    }
  };
  
  const config = sizeConfig[size];
  
  // Sync internal input value with external value
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);
  
  /**
   * Validate and normalize a number value
   */
  const validateValue = (val: number): number => {
    if (isNaN(val)) return min;
    return Math.max(min, Math.min(max, Math.floor(val)));
  };
  
  /**
   * Handle value change with validation and visual feedback
   */
  const handleValueChange = (newValue: number, isScrollAction = false) => {
    const validatedValue = validateValue(newValue);
    
    // Add visual feedback for scroll actions
    if (isScrollAction) {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    }
    
    onChange(validatedValue);
  };
  
  /**
   * Handle dropdown selection
   */
  const handleDropdownChange = (selectedValue: string) => {
    const numValue = parseInt(selectedValue);
    if (!isNaN(numValue)) {
      handleValueChange(numValue);
      setIsTyping(false);
    }
  };
  
  /**
   * Handle manual input changes with smart detection
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsTyping(true);
    
    // Auto-switch to manual mode when user starts typing
    if (inputMode === 'dropdown' && newValue !== value.toString()) {
      setInputMode('manual');
    }
    
    const numValue = parseInt(newValue);
    if (!isNaN(numValue)) {
      handleValueChange(numValue);
    }
  };
  
  /**
   * Handle input focus - show dropdown by default
   */
  const handleInputFocus = () => {
    if (!isTyping && showDropdown) {
      setInputMode('dropdown');
    }
  };
  
  /**
   * Handle manual input blur (validate and correct)
   */
  const handleInputBlur = () => {
    const numValue = parseInt(inputValue);
    const validatedValue = validateValue(numValue);
    setInputValue(validatedValue.toString());
    onChange(validatedValue);
    setIsTyping(false);
    
    // Reset to dropdown mode after blur if no custom typing occurred
    if (showDropdown) {
      setTimeout(() => {
        if (!isTyping) {
          setInputMode('dropdown');
        }
      }, 100);
    }
  };
  
  /**
   * Handle mouse wheel scroll
   */
  const handleWheel = (e: React.WheelEvent) => {
    if (disabled || inputMode !== 'manual') return;
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;
    const newValue = value + delta;
    
    if (newValue >= min && newValue <= max) {
      handleValueChange(newValue, true);
    }
  };
  
  /**
   * Handle touch start for mobile scroll detection
   */
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || inputMode !== 'manual') return;
    
    const touch = e.touches[0];
    const startY = touch.clientY;
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      const currentTouch = moveEvent.touches[0];
      const deltaY = startY - currentTouch.clientY;
      const sensitivity = 20; // Adjust sensitivity
      
      if (Math.abs(deltaY) > sensitivity) {
        const delta = deltaY > 0 ? 1 : -1;
        const newValue = value + delta;
        
        if (newValue >= min && newValue <= max) {
          handleValueChange(newValue, true);
        }
      }
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };
  
  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (value < max) {
          handleValueChange(value + 1, true);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (value > min) {
          handleValueChange(value - 1, true);
        }
        break;
      case 'Enter':
        e.preventDefault();
        handleInputBlur();
        break;
      case 'Escape':
        e.preventDefault();
        if (inputRef.current) {
          inputRef.current.blur();
        }
        break;
    }
  };
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);
  
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <Label 
          htmlFor="number-input" 
          className="text-sm font-medium"
          style={{ color: QSAITheme.text.secondary }}
        >
          {label}
        </Label>
      )}
      
      {/* Main Input Container */}
      <div className="relative">
        {/* Smart Input Field */}
        {inputMode === 'dropdown' && showDropdown ? (
          <Select
            value={value.toString()}
            onValueChange={handleDropdownChange}
            disabled={disabled}
          >
            <SelectTrigger 
              className="border-0 focus:border-0 focus:ring-0 transition-all duration-200"
              style={{
                height: config.height,
                background: error 
                  ? 'rgba(239, 68, 68, 0.1)' 
                  : isScrolling
                  ? `rgba(124, 93, 250, 0.1)`
                  : QSAITheme.background.secondary,
                border: error
                  ? '1px solid rgba(239, 68, 68, 0.3)'
                  : isScrolling
                  ? `1px solid ${QSAITheme.purple.primary}`
                  : `1px solid ${QSAITheme.border.accent}`,
                color: QSAITheme.text.primary,
                borderRadius: '12px',
                fontSize: config.fontSize,
                boxShadow: isScrolling ? `0 0 0 2px rgba(124, 93, 250, 0.2)` : 'none'
              }}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent
              className="border-0"
              style={{
                background: QSAITheme.background.panel,
                border: `1px solid ${QSAITheme.border.accent}`,
                borderRadius: '12px',
                maxHeight: '200px'
              }}
            >
              {selectOptions.map((option) => (
                <SelectItem 
                  key={option} 
                  value={option.toString()}
                  className="focus:bg-purple-500/20"
                  style={{
                    color: QSAITheme.text.primary,
                    borderRadius: '8px'
                  }}
                >
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            ref={inputRef}
            id="number-input"
            type="number"
            min={min}
            max={max}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            disabled={disabled}
            placeholder={placeholder}
            className="text-center font-bold border-0 focus:border-0 focus:ring-0 transition-all duration-200 select-none"
            style={{
              height: config.height,
              background: error 
                ? 'rgba(239, 68, 68, 0.1)' 
                : isScrolling
                ? `rgba(124, 93, 250, 0.1)`
                : QSAITheme.background.secondary,
              border: error
                ? '1px solid rgba(239, 68, 68, 0.3)'
                : isScrolling
                ? `1px solid ${QSAITheme.purple.primary}`
                : `1px solid ${QSAITheme.border.accent}`,
              color: QSAITheme.text.primary,
              borderRadius: '12px',
              fontSize: config.fontSize,
              boxShadow: isScrolling ? `0 0 0 2px rgba(124, 93, 250, 0.2)` : 'none',
              cursor: 'ns-resize'
            }}
            aria-label={label || 'Number input'}
            aria-describedby={error ? 'number-input-error' : helpText ? 'number-input-help' : undefined}
          />
        )}
        
        {/* Scroll Hint Overlay */}
        {inputMode === 'manual' && !isTyping && !disabled && (
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200"
            style={{
              opacity: isScrolling ? 0 : 0.6,
              borderRadius: '12px'
            }}
          >
            <span 
              className="text-xs font-medium px-2 py-1 rounded-md"
              style={{
                background: 'rgba(0, 0, 0, 0.1)',
                color: QSAITheme.text.muted
              }}
            >
              Scroll to change
            </span>
          </div>
        )}
      </div>
      
      {/* Help Text */}
      {helpText && !error && (
        <p 
          id="number-input-help"
          className="text-xs"
          style={{ color: QSAITheme.text.muted }}
        >
          {helpText}
        </p>
      )}
      
      {/* Error Message */}
      {error && (
        <p 
          id="number-input-error"
          className="text-xs font-medium"
          style={{ color: '#EF4444' }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// Export the component as default for easier importing
export default NumberInput;
