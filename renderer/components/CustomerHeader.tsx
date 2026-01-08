

import React from 'react';
import { RubyRedColors, rubyStyles } from '../utils/RubyRedCustomerDesign';
import { cn } from '../utils/cn';

interface CustomerHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  gradient?: boolean;
  className?: string;
}

/**
 * CustomerHeader - Ruby Red themed header component
 * Mirrors QSAI's sophisticated header styling with ruby red gradients
 */
export const CustomerHeader: React.FC<CustomerHeaderProps> = ({
  title,
  subtitle,
  actions,
  gradient = true,
  className = ''
}) => {
  const titleStyles = gradient
    ? rubyStyles.rubyGradientText
    : {
        color: RubyRedColors.text.primary
      };

  const subtitleStyles = {
    color: RubyRedColors.text.secondary,
    fontSize: '1rem',
    fontWeight: 400,
    marginTop: '0.5rem'
  };

  const headerStyles = {
    padding: '2rem 0',
    borderBottomColor: RubyRedColors.border.light,
    marginBottom: '2rem'
  };

  return (
    <header
      className={cn('flex justify-between items-start border-b', className)}
      style={headerStyles}
    >
      <div className="flex-1">
        <h1
          className="text-3xl font-bold"
          style={titleStyles}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={subtitleStyles}>
            {subtitle}
          </p>
        )}
      </div>
      
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </header>
  );
};

export default CustomerHeader;
