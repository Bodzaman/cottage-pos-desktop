import React, { useRef, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PriceNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  placeholder?: string;
  helpText?: string;
  min?: number;
  max?: number;
  step?: number;
  showCurrency?: boolean;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  tabIndex?: number;
  error?: string;
  id?: string;
}

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

  const inputId = id || `price-input-${tabIndex || Math.random()}`;
  const errorId = `${inputId}-error`;

  const displayValue = isTyping ? typingValue : (value > 0 ? value.toFixed(2) : '');

  const parseValue = (val: string): number => {
    const parsed = parseFloat(val.replace(/[^\d.]/g, ''));
    if (isNaN(parsed)) return 0;
    return Math.min(Math.max(parsed, min), max);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (/^\d*\.?\d*$/.test(newValue) || newValue === '') {
      setTypingValue(newValue);
      setIsTyping(true);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setIsTyping(true);
    const currentDisplay = value > 0 ? value.toFixed(2) : '';
    setTypingValue(currentDisplay);
    if (inputRef.current) {
      setTimeout(() => inputRef.current?.select(), 10);
    }
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    setIsTyping(false);
    const parsed = parseValue(typingValue);
    onChange(parsed);
    setTypingValue('');
    onBlur?.();
  };

  const adjustValue = (direction: 'up' | 'down') => {
    const currentValue = parseValue(displayValue);
    const newValue = direction === 'up' 
      ? Math.min(currentValue + step, max)
      : Math.max(currentValue - step, min);
    onChange(newValue);
    if (isTyping) {
      setTypingValue(newValue.toFixed(2));
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (isFocused || inputRef.current === document.activeElement) {
      e.preventDefault();
      const direction = e.deltaY < 0 ? 'up' : 'down';
      adjustValue(direction);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const currentTabIndex = tabIndex || 0;
      let nextTabIndex;
      if (!e.shiftKey) {
        nextTabIndex = currentTabIndex === 1 ? 2 : currentTabIndex === 2 ? 3 : 1;
      } else {
        nextTabIndex = currentTabIndex === 3 ? 2 : currentTabIndex === 2 ? 1 : 3;
      }
      const nextInput = document.querySelector(`input[tabindex="${nextTabIndex}"][data-focusable="true"]`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      adjustValue('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      adjustValue('down');
    }
  };

  useEffect(() => {
    if (inputRef.current && tabIndex !== undefined) {
      inputRef.current.tabIndex = tabIndex;
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
          {showCurrency && (
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-500 dark:text-gray-400 z-10">
              £
            </span>
          )}

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
              "pr-16",
              showCurrency && "pl-8",
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

        {isFocused && (
          <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full opacity-70" />
        )}
      </div>

      {helpText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}

      {error && (
        <div id={errorId} className="flex items-center gap-1.5 mt-1.5" role="alert" aria-live="polite">
          <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-500">{error}</span>
        </div>
      )}

      {isFocused && (
        <p className="text-xs text-purple-400 opacity-75">
          💡 Use scroll wheel or arrow keys to adjust by £{step.toFixed(2)}
        </p>
      )}
    </div>
  );
}

export default PriceNumberInput;
