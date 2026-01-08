import React from 'react';
import { RubyRedColors, rubyStyles, rubyEffects } from '../utils/RubyRedCustomerDesign';
import { cn } from '../utils/cn';

interface CustomerCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'light';
  glow?: boolean;
  onClick?: () => void;
}

/**
 * CustomerCard - Ruby Red themed card component
 * Mirrors QSAI's sophisticated card styling with ruby red accents
 */
export const CustomerCard: React.FC<CustomerCardProps> = ({
  children,
  className = '',
  variant = 'primary',
  glow = false,
  onClick
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          ...rubyStyles.glassCard,
          borderRadius: '0.75rem',
          padding: '2rem'
        };
      case 'secondary':
        return {
          background: RubyRedColors.background.tertiary,
          border: `1px solid ${RubyRedColors.border.light}`,
          borderRadius: '0.5rem',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
          padding: '1.5rem'
        };
      case 'light':
        return {
          background: RubyRedColors.white.pure,
          border: `1px solid ${RubyRedColors.white.platinum}`,
          borderRadius: '0.75rem',
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
          padding: '2rem'
        };
      default:
        return rubyStyles.glassCard;
    }
  };

  const cardStyles = {
    ...getVariantStyles(),
    ...(glow && {
      boxShadow: `${getVariantStyles().boxShadow}, ${rubyEffects.outerGlow('medium')}`
    }),
    ...(onClick && {
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    })
  };

  return (
    <div
      className={cn('transition-all duration-300', onClick && 'hover:scale-105', className)}
      style={cardStyles}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default CustomerCard;