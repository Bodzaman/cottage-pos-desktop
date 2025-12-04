import React from 'react';
import { NumberInput, NumberInputProps } from './NumberInput';

export interface OrderNumberInputProps extends Omit<NumberInputProps, 'min' | 'max' | 'dropdownOptions'> {
  min?: number;
  max?: number;
  dropdownOptions?: number[];
}

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

export default OrderNumberInput;