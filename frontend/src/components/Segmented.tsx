import React from 'react';
import { cn } from 'utils/cn';

interface SegmentedOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Segmented Control Component for Online Menu
 * Matches the delivery/collection toggle from the mock design
 */
export function Segmented({ options, value, onChange, className }: SegmentedProps) {
  return (
    <div className={cn(
      "inline-flex p-1 bg-gray-900/50 border border-gray-800 rounded-lg backdrop-blur-sm",
      className
    )}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
            value === option.value
              ? "bg-red-600 text-white shadow-lg"
              : "text-gray-400 hover:text-white hover:bg-gray-800/50"
          )}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}
