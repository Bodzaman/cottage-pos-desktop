import React from 'react';
import { NumberInput, NumberInputProps } from './NumberInput';

/**
 * Props for GuestNumberInput component
 * Extends NumberInputProps but with specialized defaults
 */
export interface GuestNumberInputProps extends Omit<NumberInputProps, 'min' | 'max' | 'dropdownOptions'> {
  /** Override min value (default: 1) */
  min?: number;
  /** Override max value (default: 50) */
  max?: number;
  /** Override dropdown options (default: guest-specific presets) */
  dropdownOptions?: number[];
}

/**
 * GuestNumberInput Component
 * 
 * Specialized NumberInput for guest count in reservations and table management.
 * Optimized for common restaurant table sizes and party sizes.
 * 
 * Features:
 * - Range: 1-50 (configurable)
 * - Presets: Common party sizes (1, 2, 4, 6, 8, 10, 12, 15, 20)
 * - Scroll-based interaction with visual feedback
 * - Smart dropdown with quick selection
 * - Consistent QSAI design system
 * 
 * @example
 * ```tsx
 * <GuestNumberInput
 *   value={guestCount}
 *   onChange={setGuestCount}
 *   label="Number of Guests"
 *   helpText="How many guests will be dining?"
 * />
 * ```
 */
export function GuestNumberInput({
  min = 1,
  max = 50,
  dropdownOptions = [1, 2, 4, 6, 8, 10, 12, 15, 20],
  placeholder = 'Select guests...',
  ...props
}: GuestNumberInputProps) {
  return (
    <NumberInput
      {...props}
      min={min}
      max={max}
      dropdownOptions={dropdownOptions}
      placeholder={placeholder}
      showDropdown={true}
    />
  );
}

// Export as default for easier importing
export default GuestNumberInput;
