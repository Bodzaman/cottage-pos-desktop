import React, { useRef, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props for PriceNumberInput component
 */
export interface PriceNumberInputProps {
  /** Current value */
  value: number;
  /** Change handler */
  onChange: (value: number) => void;
  /** Input label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Help text */
  helpText?: string;
  /** Minimum value (default: 0) */
  min?: number;
  /** Maximum value (default: 999.99) */
  max?: number;
  /** Step increment (default: 0.25) */
  step?: number;
  /** Show currency symbol (default: true) */
  showCurrency?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Focus handler */
  onFocus?: () => void;
  /** Blur handler */
  onBlur?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Tab index for navigation */
  tabIndex?: number;
  /** Error message to display */
  error?: string;
  /** Unique ID for ARIA attributes */
  id?: string;
}

/**
 * Apple-Style PriceNumberInput Component
 * 
 * Professional pricing input with Apple-inspired UX:
 * - Direct typing for any decimal value
 * - Increment/decrement buttons for precise adjustments
 * - Mouse wheel support for quick changes
 * - Real-time currency formatting
 * - Smooth animations and interactions
 * 
 * @example
 * ```tsx
 * <PriceNumberInput
 *   value={8.50}
 *   onChange={setPrice}
 *   label="Menu Item Price"
 *   placeholder="8.50"
 * />
 * ```
 */
export function PriceNumberInput({
  value,
  onChange,
  label,
  placeholder = "0.00",
  helpText,
  min = 0,
  max = 999.99,
  step = 0.25,
  showCurrency = true,
  disabled = false,
  onFocus,
  onBlur,
  className,
  tabIndex,
  error,
  id
}: PriceNumberInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingValue, setTypingValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate unique ID if not provided
  const inputId = id || `price-input-${tabIndex || Math.random()}`;
  const errorId = `${inputId}-error`;

  // Format value for display - show typing value while focused, formatted when blurred
  const displayValue = isTyping ? typingValue : (value > 0 ? value.toFixed(2) : '');

  // Parse and validate input
  const parseValue = (val: string): number => {
    const parsed = parseFloat(val.replace(/[^\d.]/g, ''));
    if (isNaN(parsed)) return 0;
    return Math.min(Math.max(parsed, min), max);
  };

  // Handle input change - only update typing state, don't call onChange yet
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Only allow valid typing patterns
    if (/^\d*\.?\d*$/.test(newValue) || newValue === '') {
      setTypingValue(newValue);
      setIsTyping(true);
    }
  };

  // Handle input focus
  const handleFocus = () => {
    setIsFocused(true);
    setIsTyping(true);
    
    // Set typing value to current display value for editing
    const currentDisplay = value > 0 ? value.toFixed(2) : '';
    setTypingValue(currentDisplay);
    
    // Select all text on focus for easy editing
    if (inputRef.current) {
      setTimeout(() => inputRef.current?.select(), 10);
    }
    onFocus?.();
  };

  // Handle input blur - this is where we format and save
  const handleBlur = () => {
    setIsFocused(false);
    setIsTyping(false);
    
    // Parse the typed value and save it
    const parsed = parseValue(typingValue);
    onChange(parsed);
    
    // Clear typing state
    setTypingValue('');
    onBlur?.();
  };

  // Handle increment/decrement
  const adjustValue = (direction: 'up' | 'down') => {
    const currentValue = parseValue(displayValue);
    const newValue = direction === 'up' 
      ? Math.min(currentValue + step, max)
      : Math.max(currentValue - step, min);
    
    onChange(newValue);
    
    // Update typing value if we're currently typing
    if (isTyping) {
      setTypingValue(newValue.toFixed(2));
    }
  };

  // Handle mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    if (isFocused || inputRef.current === document.activeElement) {
      e.preventDefault();
      const direction = e.deltaY < 0 ? 'up' : 'down';
      adjustValue(direction);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Tab navigation manually
    if (e.key === 'Tab') {
      e.preventDefault();
      
      // Find the next focusable price input based on current tabIndex
      const currentTabIndex = tabIndex || 0;
      let nextTabIndex;
      
      if (!e.shiftKey) {
        // Forward tab navigation
        nextTabIndex = currentTabIndex === 1 ? 2 : currentTabIndex === 2 ? 3 : 1;
      } else {
        // Backward tab navigation (Shift+Tab)
        nextTabIndex = currentTabIndex === 3 ? 2 : currentTabIndex === 2 ? 1 : 3;
      }
      
      // Find and focus the next input with the target tabIndex
      const nextInput = document.querySelector(`input[tabindex="${nextTabIndex}"][data-focusable="true"]`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
      return;
    }
    
    // Handle other keys as before
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      adjustValue('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      adjustValue('down');
    }
  };

  // Ensure input is always focusable
  useEffect(() => {
    if (inputRef.current && tabIndex !== undefined) {
      inputRef.current.tabIndex = tabIndex;
      // Force focus capability
      inputRef.current.style.pointerEvents = 'auto';
      inputRef.current.style.userSelect = 'auto';
    }
  }, [tabIndex]);

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </Label>
      )}
      
      <div className="relative group">
        <div className="relative flex items-center">
          {/* Currency Symbol */}
          {showCurrency && (
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-500 dark:text-gray-400 z-10">
              £
            </span>
          )}
          
          {/* Main Input */}
          <Input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onWheel={handleWheel}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            tabIndex={tabIndex}
            autoComplete="off"
            data-focusable="true"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              "pr-16", // Space for increment buttons
              showCurrency && "pl-8", // Space for currency symbol
              "bg-black/20 border-white/10 text-white placeholder:text-gray-400",
              error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20",
              "transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2",
              error ? "focus-visible:ring-red-500" : "focus-visible:ring-purple-500",
              isFocused && !error && "ring-2 ring-purple-500/30",
              isFocused && error && "ring-2 ring-red-500/30"
            )}
            style={{
              WebkitAppearance: 'none',
              MozAppearance: 'textfield'
            }}
          />
          
          {/* Increment/Decrement Buttons */}
          <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex flex-col">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => adjustValue('up')}
              disabled={disabled || value >= max}
              className={cn(
                "h-4 w-6 p-0 hover:bg-purple-500/20",
                "border-b border-white/10",
                "rounded-b-none rounded-t-sm"
              )}
            >
              <ChevronUp className="h-3 w-3 text-gray-400 hover:text-white" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => adjustValue('down')}
              disabled={disabled || value <= min}
              className={cn(
                "h-4 w-6 p-0 hover:bg-purple-500/20",
                "rounded-t-none rounded-b-sm"
              )}
            >
              <ChevronDown className="h-3 w-3 text-gray-400 hover:text-white" />
            </Button>
          </div>
        </div>
        
        {/* Visual Feedback */}
        {isFocused && (
          <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full opacity-70" />
        )}
      </div>
      
      {helpText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}
      
      {/* Error Message */}
      {error && (
        <div id={errorId} className="flex items-center gap-1.5 mt-1.5" role="alert" aria-live="polite">
          <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-500">{error}</span>
        </div>
      )}
      
      {/* Scroll Hint */}
      {isFocused && (
        <p className="text-xs text-purple-400 opacity-75">
          💡 Use scroll wheel or arrow keys to adjust by £{step.toFixed(2)}
        </p>
      )}
    </div>
  );
}

// Export as default for easier importing
export default PriceNumberInput;
