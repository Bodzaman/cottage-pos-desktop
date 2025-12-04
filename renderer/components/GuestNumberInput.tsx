import React from 'react';
import { NumberInput, NumberInputProps } from './NumberInput';

export interface GuestNumberInputProps extends Omit<NumberInputProps, 'min' | 'max' | 'dropdownOptions'> {
  min?: number;
  max?: number;
  dropdownOptions?: number[];
}

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

export default GuestNumberInput;