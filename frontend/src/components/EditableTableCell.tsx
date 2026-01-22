/**
 * EditableTableCell Component
 * 
 * Inline editable table cell with click-to-edit functionality.
 * Supports text and currency input with keyboard shortcuts.
 * 
 * Features:
 * - Click to edit
 * - Enter to save
 * - Escape to cancel
 * - Auto-save on blur
 * - Visual feedback for editing state
 */

import React, { useState, useEffect, useRef } from 'react';
import { TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EditableCellProps {
  value: string | number;
  type: 'text' | 'currency';
  isEditing: boolean;
  onEdit: () => void;
  onSave: (value: string | number) => void;
  onCancel: () => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
}

/**
 * Format currency value for display
 */
function formatCurrency(value: number): string {
  return `£${value.toFixed(2)}`;
}

/**
 * Parse currency input (handles £ symbols and formatting)
 */
function parseCurrencyInput(input: string): number {
  const cleaned = input.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}

export const EditableTableCell: React.FC<EditableCellProps> = ({
  value,
  type,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  className = '',
  disabled = false,
  placeholder = '',
  min,
  max,
}) => {
  const [editValue, setEditValue] = useState<string>(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync edit value when external value changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(String(value));
    }
  }, [value, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    let finalValue: string | number;

    if (type === 'currency') {
      finalValue = parseCurrencyInput(editValue);
      
      // Validate min/max
      if (min !== undefined && finalValue < min) {
        finalValue = min;
      }
      if (max !== undefined && finalValue > max) {
        finalValue = max;
      }
    } else {
      finalValue = editValue.trim();
    }

    onSave(finalValue);
  };

  const handleCancel = () => {
    setEditValue(String(value)); // Reset to original value
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  // Display mode (not editing)
  if (!isEditing) {
    const displayValue = type === 'currency' 
      ? formatCurrency(Number(value))
      : value;

    return (
      <TableCell
        onClick={disabled ? undefined : onEdit}
        className={cn(
          'cursor-pointer transition-colors',
          !disabled && 'hover:bg-gray-800/50 hover:ring-1 hover:ring-purple-500/30',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
        title={disabled ? undefined : 'Click to edit'}
      >
        <div className="flex items-center justify-between">
          <span className={cn(
            'font-mono text-sm',
            type === 'currency' && 'text-green-400 dark:text-green-400'
          )}>
            {displayValue}
          </span>
          {!disabled && (
            <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
              ✎
            </span>
          )}
        </div>
      </TableCell>
    );
  }

  // Edit mode
  return (
    <TableCell className={cn('p-1', className)}>
      <Input
        ref={inputRef}
        type={type === 'currency' ? 'number' : 'text'}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={cn(
          'h-8 text-sm font-mono',
          type === 'currency' && 'text-green-400 dark:text-green-400'
        )}
        placeholder={placeholder}
        step={type === 'currency' ? '0.01' : undefined}
        min={type === 'currency' ? min : undefined}
        max={type === 'currency' ? max : undefined}
      />
    </TableCell>
  );
};

EditableTableCell.displayName = 'EditableTableCell';
