import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

// Spice level definitions matching the requirements
export const SPICE_LEVELS = {
  NONE: { 
    value: 0, 
    label: 'Mild & Creamy', 
    display: '', 
    color: '#3B82F6', // Cool Blue
    bgColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3B82F6'
  },
  SPICY: { 
    value: 1, 
    label: 'Spicy', 
    display: '🌶️',
    color: '#10B981', // Warm Green
    bgColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981'
  },
  VERY_SPICY: { 
    value: 2, 
    label: 'Very Spicy', 
    display: '🌶️🌶️',
    color: '#F59E0B', // Golden Yellow
    bgColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#F59E0B'
  },
  VERY_VERY_SPICY: { 
    value: 3, 
    label: 'Very Very Spicy', 
    display: '🌶️🌶️🌶️',
    color: '#F97316', // Bright Orange
    bgColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: '#F97316'
  },
  EXTREMELY_SPICY: { 
    value: 4, 
    label: 'Extremely Spicy', 
    display: '🌶️🌶️🌶️🌶️',
    color: '#EF4444', // Fiery Red
    bgColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#EF4444'
  }
} as const;

export type SpiceLevelValue = typeof SPICE_LEVELS[keyof typeof SPICE_LEVELS]['value'];

interface SpiceLevelSelectorProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function SpiceLevelSelector({ 
  value, 
  onChange, 
  label = "Spice Level", 
  disabled = false,
  className = ""
}: SpiceLevelSelectorProps) {
  
  const spiceLevels = Object.values(SPICE_LEVELS);
  const selectedLevel = spiceLevels.find(l => l.value === value) || SPICE_LEVELS.NONE;
  
  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="text-sm font-medium">{label}</Label>
      
      <div className="space-y-3">
        {/* Visual selector buttons */}
        <div className="flex flex-wrap gap-2">
          {spiceLevels.map((level) => {
            const isSelected = value === level.value;
            
            return (
              <Button
                key={level.value}
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() => onChange(level.value)}
                title={level.label}
                className={`
                  relative group flex flex-col items-center px-4 py-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 min-w-[100px] h-auto
                  ${isSelected ? 'ring-2 ring-offset-2 ring-offset-gray-900' : ''}
                `}
                style={{
                  borderColor: level.borderColor,
                  backgroundColor: level.bgColor,
                  color: level.color,
                  '--tw-ring-color': level.color
                } as React.CSSProperties}
              >
                {/* Pepper display or None indicator */}
                <div className="text-lg mb-2 flex-shrink-0">
                  {level.display ? (
                    <span style={{ color: level.color }}>{level.display}</span>
                  ) : (
                    <span style={{ color: level.color }} className="font-medium text-sm">None</span>
                  )}
                </div>
                
                {/* Label */}
                <span 
                  className="text-xs text-center leading-tight font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
                  style={{ color: level.color }}
                >
                  {level.label}
                </span>
                
                {/* Selected indicator */}
                {isSelected && (
                  <div 
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-900" 
                    style={{ backgroundColor: level.color }}
                  />
                )}
              </Button>
            );
          })}
          
          {/* Clear selection button - only show when a level is selected */}
          {value > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => onChange(0)}
              className="h-auto px-4 py-3 text-red-400 hover:text-white hover:bg-red-600/80 border-red-500/50 hover:border-red-500 transition-all duration-200 flex flex-col items-center gap-1 min-w-[100px]"
              title="Clear spice level"
            >
              <X className="h-5 w-5" />
              <span className="text-xs font-medium">Clear</span>
            </Button>
          )}
        </div>
        
        {/* Selected level display - color changes based on selection */}
        <div 
          className="flex items-center space-x-3 p-4 rounded-lg border transition-all duration-200"
          style={{
            backgroundColor: selectedLevel.bgColor,
            borderColor: selectedLevel.borderColor,
            color: selectedLevel.color
          }}
        >
          <span className="text-lg flex-shrink-0">
            {selectedLevel.display || '○'}
          </span>
          <span className="text-sm font-medium">
            {selectedLevel.label}
            {value === 0 && ' (no spice indicator will be shown)'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Utility function to get spice level display for other components
export function getSpiceLevelDisplay(value: number): string {
  const level = Object.values(SPICE_LEVELS).find(l => l.value === value);
  return level?.display || '';
}

// Utility function to get spice level label for other components
export function getSpiceLevelLabel(value: number): string {
  const level = Object.values(SPICE_LEVELS).find(l => l.value === value);
  return level?.label || 'Mild & Creamy';
}

// Utility function to get spice level color for other components
export function getSpiceLevelColor(value: number): string {
  const level = Object.values(SPICE_LEVELS).find(l => l.value === value);
  return level?.color || '#3B82F6';
}

// Utility function to get spice level background color for other components
export function getSpiceLevelBgColor(value: number): string {
  const level = Object.values(SPICE_LEVELS).find(l => l.value === value);
  return level?.bgColor || 'rgba(59, 130, 246, 0.1)';
}

// Utility function to get spice level border color for other components
export function getSpiceLevelBorderColor(value: number): string {
  const level = Object.values(SPICE_LEVELS).find(l => l.value === value);
  return level?.borderColor || '#3B82F6';
}

export default SpiceLevelSelector;