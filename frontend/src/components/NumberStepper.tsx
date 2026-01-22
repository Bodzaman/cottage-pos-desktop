
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
  min?: number;
  max?: number;
  label?: string;
}

// Common preset values for display/print order
const DEFAULT_PRESET_VALUES = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
];

export default function NumberStepper({
  value,
  onChange,
  placeholder = "Enter order...",
  className = "",
  disabled = false,
  presetValues = DEFAULT_PRESET_VALUES,
  incrementStep = 1,
  min = 0,
  max = 999,
  label
}: Props) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isManualInput, setIsManualInput] = useState(false);
  const [hasUserTyped, setHasUserTyped] = useState(false);

  // Update input value when external value changes
  useEffect(() => {
    if (!isManualInput) {
      setInputValue(value.toString());
    }
  }, [value, isManualInput]);

  // Handle increment/decrement
  const handleIncrement = () => {
    const newValue = Math.min(value + incrementStep, max);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(value - incrementStep, min);
    onChange(newValue);
  };

  // Handle manual input
  const handleInputChange = (inputVal: string) => {
    setInputValue(inputVal);
    setIsManualInput(true);
    setHasUserTyped(true);

    // Extract numeric value from input
    const numericValue = inputVal.replace(/[^0-9]/g, '');
    const parsedValue = parseInt(numericValue);
    
    if (!isNaN(parsedValue) && parsedValue >= min && parsedValue <= max) {
      onChange(parsedValue);
    } else if (numericValue === '') {
      onChange(0);
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
    setIsManualInput(false);
    setHasUserTyped(false);
    setInputValue(value.toString());
  };

  // Handle preset selection
  const handlePresetSelect = (presetValue: number) => {
    onChange(presetValue);
    setOpen(false);
    setIsManualInput(false);
    setHasUserTyped(false);
  };

  // Handle dropdown open/close
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setHasUserTyped(false);
      setIsManualInput(false);
    }
  };

  // Filter presets based on search
  const filteredPresets = presetValues.filter(preset => {
    // If user hasn't started typing yet, show all presets
    if (!hasUserTyped) {
      return true;
    }
    // If input is empty, show all presets
    if (inputValue === "") {
      return true;
    }
    // Otherwise filter based on search input
    return preset.toString().includes(inputValue);
  });

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
        title="Decrease by 1"
      >
        <Minus className="h-4 w-4" />
      </Button>

      {/* Number Input with Dropdown */}
      <Popover open={open} onOpenChange={handleOpenChange}>
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
              {value.toString() || placeholder}
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
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Search or enter custom..."
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
                    value={preset.toString()}
                    onSelect={() => handlePresetSelect(preset)}
                    className="hover:bg-white/10"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === preset ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {preset}
                    {preset === 0 && <span className="ml-auto text-xs opacity-60">First</span>}
                    {preset === 10 && <span className="ml-auto text-xs opacity-60">Default</span>}
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
        title="Increase by 1"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
