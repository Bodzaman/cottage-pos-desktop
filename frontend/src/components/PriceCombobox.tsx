
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Plus, Minus } from 'lucide-react';
import { colors } from 'utils/designSystem';

interface Props {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  presetValues?: number[];
  incrementStep?: number;
  showCurrency?: boolean;
  currencySymbol?: string;
  min?: number;
  max?: number;
}

// Common preset price values for restaurants
const DEFAULT_PRESET_VALUES = [
  0.00, 0.50, 1.00, 1.50, 2.00, 2.50, 3.00, 3.50, 4.00, 4.50, 5.00,
  5.50, 6.00, 6.50, 7.00, 7.50, 8.00, 8.50, 9.00, 9.50, 10.00,
  10.50, 11.00, 11.50, 12.00, 12.50, 13.00, 13.50, 14.00, 14.50, 15.00,
  16.00, 17.00, 18.00, 19.00, 20.00, 22.00, 25.00, 30.00
];

export default function PriceCombobox({
  value,
  onChange,
  placeholder = "Enter price...",
  className = "",
  disabled = false,
  presetValues = DEFAULT_PRESET_VALUES,
  incrementStep = 0.50,
  showCurrency = true,
  currencySymbol = "£",
  min = 0,
  max = 999.99
}: Props) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isManualInput, setIsManualInput] = useState(false);

  // Format price for display
  const formatPrice = (price: number): string => {
    if (showCurrency) {
      return `${currencySymbol}${price.toFixed(2)}`;
    }
    return price.toFixed(2);
  };

  // Update input value when external value changes
  useEffect(() => {
    if (!isManualInput) {
      setInputValue(value > 0 ? formatPrice(value) : "");
    }
  }, [value, showCurrency, currencySymbol, isManualInput]);

  // Handle increment/decrement
  const handleIncrement = () => {
    const newValue = Math.min(value + incrementStep, max);
    onChange(Math.round(newValue * 100) / 100); // Round to 2 decimal places
  };

  const handleDecrement = () => {
    const newValue = Math.max(value - incrementStep, min);
    onChange(Math.round(newValue * 100) / 100); // Round to 2 decimal places
  };

  // Handle manual input
  const handleInputChange = (inputVal: string) => {
    setInputValue(inputVal);
    setIsManualInput(true);

    // Extract numeric value from input
    const numericValue = inputVal.replace(/[^0-9.]/g, '');
    const parsedValue = parseFloat(numericValue);
    
    if (!isNaN(parsedValue) && parsedValue >= min && parsedValue <= max) {
      onChange(Math.round(parsedValue * 100) / 100);
    } else if (numericValue === '' || numericValue === '.') {
      onChange(0);
    }
  };

  // Handle input blur (format the display value)
  const handleInputBlur = () => {
    setIsManualInput(false);
    if (value > 0) {
      setInputValue(formatPrice(value));
    } else {
      setInputValue("");
    }
  };

  // Handle preset selection
  const handlePresetSelect = (presetValue: number) => {
    onChange(presetValue);
    setOpen(false);
    setIsManualInput(false);
  };

  // Filter presets based on search
  const filteredPresets = presetValues.filter(preset => 
    formatPrice(preset).toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Decrement Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className="h-9 w-9 p-0 border-0 hover:scale-105 transition-all duration-200"
        style={{
          backgroundColor: colors.background.tertiary,
          border: `1px solid ${colors.border.light}`,
          color: colors.text.secondary
        }}
      >
        <Minus className="h-4 w-4" />
      </Button>

      {/* Price Input with Dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex-1 justify-between border-0 transition-all duration-200 hover:scale-[1.01] focus:scale-[1.01]"
            style={{
              backgroundColor: colors.background.tertiary,
              border: `1px solid ${colors.border.light}`,
              color: colors.text.primary,
              borderRadius: "0.5rem"
            }}
            disabled={disabled}
          >
            <span className="truncate">
              {value > 0 ? formatPrice(value) : placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[200px] p-0" 
          style={{
            backgroundColor: colors.background.overlay,
            border: `1px solid ${colors.border.medium}`,
            backdropFilter: "blur(12px)"
          }}
        >
          <Command>
            <CommandInput 
              placeholder="Search prices or enter custom..."
              value={inputValue}
              onValueChange={handleInputChange}
              onBlur={handleInputBlur}
              className=""
              style={{
                backgroundColor: 'transparent',
                color: colors.text.primary,
                border: 'none'
              }}
            />
            <CommandList>
              <CommandEmpty>No preset found. Press Enter to use custom value.</CommandEmpty>
              <CommandGroup>
                {filteredPresets.map((preset) => (
                  <CommandItem
                    key={preset}
                    value={formatPrice(preset)}
                    onSelect={() => handlePresetSelect(preset)}
                    className="hover:bg-white/10"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === preset ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {formatPrice(preset)}
                    {preset === 0 && <span className="ml-auto text-xs opacity-60">Free</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Increment Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className="h-9 w-9 p-0 hover:scale-105 transition-all duration-200"
        style={{
          backgroundColor: colors.background.tertiary,
          border: `1px solid ${colors.border.light}`,
          color: colors.text.secondary
        }}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
