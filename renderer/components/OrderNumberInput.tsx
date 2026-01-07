import React from 'react';
import { NumberInput, NumberInputProps } from './NumberInput';

/**
 * Props for OrderNumberInput component
 * Extends NumberInputProps but with specialized defaults
 */
export interface OrderNumberInputProps extends Omit<NumberInputProps, 'min' | 'max' | 'dropdownOptions'> {
  /** Override min value (default: 0) */
  min?: number;
  /** Override max value (default: 999) */
  max?: number;
  /** Override dropdown options (default: order-specific presets) */
  dropdownOptions?: number[];
}

/**
 * OrderNumberInput Component
 * 
 * Specialized NumberInput for display order and print order fields.
 * Optimized for restaurant menu ordering with common presets.
 * 
 * Features:
 * - Range: 0-999 (configurable)
 * - Presets: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 20, 25, 50
 * - Scroll-based interaction with visual feedback
 * - Smart dropdown with quick selection
 * - Consistent QSAI design system
 * 
 * @example
 * ```tsx
 * <OrderNumberInput
 *   value={displayOrder}
 *   onChange={setDisplayOrder}
 *   label="Display Order"
 *   helpText="Controls menu display order (lower numbers first)"
 * />
 * ```
 */
export function OrderNumberInput({
  min = 0,
  max = 999,
  dropdownOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 20, 25, 50],
  placeholder = 'Select order...',
  ...props
}: OrderNumberInputProps) {
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
export default OrderNumberInput;
