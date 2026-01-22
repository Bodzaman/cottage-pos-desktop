import React from 'react';
import { Input } from '@/components/ui/input';

interface TimePickerInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const TimePickerInput: React.FC<TimePickerInputProps> = ({ value, onChange, disabled }) => {
  return (
    <Input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="bg-gray-800 border-gray-700 text-white"
    />
  );
};