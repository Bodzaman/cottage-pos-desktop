import React from 'react';
import { NumberInput, NumberInputProps } from './NumberInput';

export interface QuantityNumberInputProps extends Omit<NumberInputProps, 'min' | 'max' | 'dropdownOptions'> {
  min?: number;
  max?: number;
  dropdownOptions?: number[];
}

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

export default QuantityNumberInput;