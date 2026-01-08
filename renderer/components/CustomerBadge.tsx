import React from 'react';
import { RubyRedColors, rubyStyles } from '../utils/RubyRedCustomerDesign';
import { cn } from '../utils/cn';

interface CustomerBadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * CustomerBadge - Ruby Red themed badge component
 * Mirrors QSAI's sophisticated badge styling with ruby red accents
 */
export const CustomerBadge: React.FC<CustomerBadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = ''
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: '0.25rem 0.5rem',
          fontSize: '0.75rem'
        };
      case 'lg':
        return {
          padding: '0.5rem 1rem',
          fontSize: '0.875rem'
        };
      default:
        return {
          padding: '0.375rem 0.75rem',
          fontSize: '0.75rem'
        };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: RubyRedColors.ruby.primary,
          color: RubyRedColors.white.pure
        };
      case 'secondary':
        return {
          background: RubyRedColors.background.tertiary,
          color: RubyRedColors.text.secondary,
          border: `1px solid ${RubyRedColors.border.light}`
        };
      case 'success':
        return {
          background: RubyRedColors.status.successLight,
          color: RubyRedColors.status.success
        };
      case 'warning':
        return {
          background: RubyRedColors.status.warningLight,
          color: RubyRedColors.status.warning
        };
      case 'error':
        return {
          background: RubyRedColors.status.errorLight,
          color: RubyRedColors.ruby.primary
        };
      default:
        return {
          background: RubyRedColors.ruby.primary,
          color: RubyRedColors.white.pure
        };
    }
  };

  const badgeStyles = {
    ...getVariantStyles(),
    ...getSizeStyles(),
    borderRadius: '9999px',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease-in-out'
  };

  return (
    <span
      className={cn('inline-flex items-center justify-center', className)}
      style={badgeStyles}
    >
      {children}
    </span>
  );
};

export default CustomerBadge;