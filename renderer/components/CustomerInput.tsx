import React from 'react';
import { RubyRedColors } from '../utils/RubyRedCustomerDesign';
import { cn } from '../utils/cn';

interface CustomerInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'tel';
  className?: string;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
}

/**
 * CustomerInput - Ruby Red themed input component
 * Mirrors QSAI's sophisticated input styling with ruby red accents
 */
export const CustomerInput: React.FC<CustomerInputProps> = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
  disabled = false,
  error = false,
  errorMessage
}) => {
  const inputStyles = {
    background: RubyRedColors.background.tertiary,
    border: `1px solid ${error ? RubyRedColors.ruby.primary : RubyRedColors.border.light}`,
    borderRadius: '0.5rem',
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    color: RubyRedColors.text.primary,
    fontFamily: 'inherit',
    width: '100%',
    transition: 'all 0.2s ease-in-out',
    '&:focus': {
      outline: 'none',
      borderColor: RubyRedColors.ruby.primary,
      boxShadow: `0 0 0 3px rgba(220, 38, 38, 0.1)`
    },
    '&::placeholder': {
      color: RubyRedColors.text.muted
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full focus:outline-none focus:ring-2 focus:ring-ruby-500/20"
        style={inputStyles}
      />
      {error && errorMessage && (
        <p className="mt-1 text-sm" style={{ color: RubyRedColors.ruby.primary }}>
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default CustomerInput;