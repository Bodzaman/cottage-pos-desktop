import React from 'react';
import { RubyRedColors, rubyStyles, rubyEffects } from '../utils/RubyRedCustomerDesign';
import { cn } from '../utils/cn';
import { LucideIcon } from 'lucide-react';

interface CustomerButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

/**
 * CustomerButton - Ruby Red themed button component
 * Mirrors QSAI's sophisticated button styling with ruby red gradients
 */
export const CustomerButton: React.FC<CustomerButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  glow = false,
  onClick
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: '0.5rem 1rem',
          fontSize: '0.875rem'
        };
      case 'lg':
        return {
          padding: '1rem 2rem',
          fontSize: '1.125rem'
        };
      default:
        return {
          padding: '0.75rem 1.5rem',
          fontSize: '1rem'
        };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: RubyRedColors.ruby.gradient.primary,
          color: RubyRedColors.white.pure,
          border: 'none',
          boxShadow: '0 4px 10px rgba(220, 38, 38, 0.2)'
        };
      case 'secondary':
        return {
          background: 'transparent',
          color: RubyRedColors.ruby.primary,
          border: `1px solid ${RubyRedColors.ruby.primary}`,
          boxShadow: 'none'
        };
      case 'ghost':
        return {
          background: 'transparent',
          color: RubyRedColors.text.secondary,
          border: 'none',
          boxShadow: 'none'
        };
      case 'gradient':
        return rubyStyles.gradientButton('medium');
      default:
        return {
          background: RubyRedColors.ruby.primary,
          color: RubyRedColors.white.pure,
          border: 'none'
        };
    }
  };

  const buttonStyles = {
    ...getVariantStyles(),
    ...getSizeStyles(),
    borderRadius: '0.5rem',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.3s ease',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    ...(glow && {
      boxShadow: `${getVariantStyles().boxShadow}, ${rubyEffects.outerGlow('medium')}`
    })
  };

  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  return (
    <button
      className={cn(
        'transition-all duration-300 hover:scale-105 active:scale-95',
        className
      )}
      style={buttonStyles}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {Icon && iconPosition === 'left' && <Icon className="h-4 w-4" />}
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      ) : (
        children
      )}
      {Icon && iconPosition === 'right' && <Icon className="h-4 w-4" />}
    </button>
  );
};

export default CustomerButton;