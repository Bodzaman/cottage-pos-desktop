


import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Spice level definitions matching the requirements
export const SPICE_LEVELS = [
  { value: 0, label: 'None', emoji: '' },
  { value: 1, label: 'Mild & Creamy', emoji: '🧈' },
  { value: 2, label: 'Medium Strength', emoji: '🟠' },
  { value: 3, label: 'Spicy', emoji: '🌶️' },
  { value: 4, label: 'Very Spicy', emoji: '🌶️🌶️' },
  { value: 5, label: 'Very Very Spicy', emoji: '🌶️🌶️🌶️' },
  { value: 6, label: 'Extremely Spicy', emoji: '🌶️🌶️🌶️🌶️' }
];

interface SpiceLevelDropdownProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function SpiceLevelDropdown({ 
  value, 
  onChange, 
  label = "Spice Level", 
  disabled = false,
  className = ""
}: SpiceLevelDropdownProps) {
  
  const selectedLevel = SPICE_LEVELS.find(l => l.value === value) || SPICE_LEVELS[0];
  
  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="text-sm font-medium">{label}</Label>
      
      <Select 
        value={value.toString()} 
        onValueChange={(val) => onChange(parseInt(val))}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue>
            <div className="flex items-center space-x-2">
              {selectedLevel.emoji && (
                <span className="text-base">{selectedLevel.emoji}</span>
              )}
              <span>{selectedLevel.label}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SPICE_LEVELS.map((level) => (
            <SelectItem key={level.value} value={level.value.toString()}>
              <div className="flex items-center space-x-2">
                {level.emoji && (
                  <span className="text-base">{level.emoji}</span>
                )}
                <span>{level.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default SpiceLevelDropdown;
