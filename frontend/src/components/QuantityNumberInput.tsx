import React from 'react';
import { NumberInput, NumberInputProps } from './NumberInput';

/**
 * Props for QuantityNumberInput component
 * Extends NumberInputProps but with specialized defaults
 */
export interface QuantityNumberInputProps extends Omit<NumberInputProps, 'min' | 'max' | 'dropdownOptions'> {
  /** Override min value (default: 1) */
  min?: number;
  /** Override max value (default: 99) */
  max?: number;
  /** Override dropdown options (default: quantity-specific presets) */
  dropdownOptions?: number[];
}

/**
 * QuantityNumberInput Component
 * 
 * Specialized NumberInput for item quantities in orders and inventory.
 * Optimized for common restaurant quantity selections.
 * 
 * Features:
 * - Range: 1-99 (configurable)
 * - Presets: 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20
 * - Scroll-based interaction with visual feedback
 * - Smart dropdown with quick selection
 * - Consistent QSAI design system
 * 
 * @example
 * ```tsx
 * <QuantityNumberInput
 *   value={itemQuantity}
 *   onChange={setItemQuantity}
 *   label="Quantity"
 *   helpText="Number of items to order"
 * />
 * ```
 */
export function QuantityNumberInput({
  min = 1,
  max = 99,
  dropdownOptions = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20],
  placeholder = 'Select quantity...',
  ...props
}: QuantityNumberInputProps) {
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
export default QuantityNumberInput;
