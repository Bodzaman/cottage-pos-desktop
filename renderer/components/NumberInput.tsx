import React, { useState, useEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QSAITheme, styles, effects } from '../utils/QSAIDesign';

export interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  helpText?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  placeholder?: string;
  showDropdown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  dropdownOptions?: number[];
}

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
  const [inputMode, setInputMode] = useState<'dropdown' | 'manual'>('dropdown');
  const [inputValue, setInputValue] = useState(value.toString());
  const [isTyping, setIsTyping] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const selectOptions = dropdownOptions || Array.from({ length: Math.min(max - min + 1, 50) }, (_, i) => min + i);

  const sizeConfig = {
    sm: { height: '36px', fontSize: '14px' },
    md: { height: '48px', fontSize: '16px' },
    lg: { height: '56px', fontSize: '18px' }
  };

  const config = sizeConfig[size];

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const validateValue = (val: number): number => {
    if (isNaN(val)) return min;
    return Math.max(min, Math.min(max, Math.floor(val)));
  };

  const handleValueChange = (newValue: number, isScrollAction = false) => {
    const validatedValue = validateValue(newValue);

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

  const handleDropdownChange = (selectedValue: string) => {
    const numValue = parseInt(selectedValue);
    if (!isNaN(numValue)) {
      handleValueChange(numValue);
      setIsTyping(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsTyping(true);

    if (inputMode === 'dropdown' && newValue !== value.toString()) {
      setInputMode('manual');
    }

    const numValue = parseInt(newValue);
    if (!isNaN(numValue)) {
      handleValueChange(numValue);
    }
  };

  const handleInputFocus = () => {
    if (!isTyping && showDropdown) {
      setInputMode('dropdown');
    }
  };

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue);
    const validatedValue = validateValue(numValue);
    setInputValue(validatedValue.toString());
    onChange(validatedValue);
    setIsTyping(false);

    if (showDropdown) {
      setTimeout(() => {
        if (!isTyping) {
          setInputMode('dropdown');
        }
      }, 100);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (disabled || inputMode !== 'manual') return;

    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;
    const newValue = value + delta;

    if (newValue >= min && newValue <= max) {
      handleValueChange(newValue, true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (value < max) handleValueChange(value + 1, true);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (value > min) handleValueChange(value - 1, true);
        break;
      case 'Enter':
        e.preventDefault();
        handleInputBlur();
        break;
      case 'Escape':
        e.preventDefault();
        if (inputRef.current) inputRef.current.blur();
        break;
    }
  };

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor="number-input" className="text-sm font-medium" style={{ color: QSAITheme.text.secondary }}>
          {label}
        </Label>
      )}

      <div className="relative">
        {inputMode === 'dropdown' && showDropdown ? (
          <Select value={value.toString()} onValueChange={handleDropdownChange} disabled={disabled}>
            <SelectTrigger 
              className="border-0 focus:border-0 focus:ring-0 transition-all duration-200"
              style={{
                height: config.height,
                background: error ? 'rgba(239, 68, 68, 0.1)' : isScrolling ? `rgba(124, 93, 250, 0.1)` : QSAITheme.background.secondary,
                border: error ? '1px solid rgba(239, 68, 68, 0.3)' : isScrolling ? `1px solid ${QSAITheme.purple.primary}` : `1px solid ${QSAITheme.border.accent}`,
                color: QSAITheme.text.primary,
                borderRadius: '12px',
                fontSize: config.fontSize,
                boxShadow: isScrolling ? `0 0 0 2px rgba(124, 93, 250, 0.2)` : 'none'
              }}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="border-0" style={{ background: QSAITheme.background.panel, border: `1px solid ${QSAITheme.border.accent}`, borderRadius: '12px', maxHeight: '200px' }}>
              {selectOptions.map((option) => (
                <SelectItem key={option} value={option.toString()} className="focus:bg-purple-500/20" style={{ color: QSAITheme.text.primary, borderRadius: '8px' }}>
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
            disabled={disabled}
            placeholder={placeholder}
            className="text-center font-bold border-0 focus:border-0 focus:ring-0 transition-all duration-200 select-none"
            style={{
              height: config.height,
              background: error ? 'rgba(239, 68, 68, 0.1)' : isScrolling ? `rgba(124, 93, 250, 0.1)` : QSAITheme.background.secondary,
              border: error ? '1px solid rgba(239, 68, 68, 0.3)' : isScrolling ? `1px solid ${QSAITheme.purple.primary}` : `1px solid ${QSAITheme.border.accent}`,
              color: QSAITheme.text.primary,
              borderRadius: '12px',
              fontSize: config.fontSize,
              boxShadow: isScrolling ? `0 0 0 2px rgba(124, 93, 250, 0.2)` : 'none',
              cursor: 'ns-resize'
            }}
          />
        )}

        {inputMode === 'manual' && !isTyping && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200" style={{ opacity: isScrolling ? 0 : 0.6, borderRadius: '12px' }}>
            <span className="text-xs font-medium px-2 py-1 rounded-md" style={{ background: 'rgba(0, 0, 0, 0.1)', color: QSAITheme.text.muted }}>
              Scroll to change
            </span>
          </div>
        )}
      </div>

      {helpText && !error && (
        <p className="text-xs" style={{ color: QSAITheme.text.muted }}>{helpText}</p>
      )}

      {error && (
        <p className="text-xs font-medium" style={{ color: '#EF4444' }} role="alert">{error}</p>
      )}
    </div>
  );
}

export default NumberInput;