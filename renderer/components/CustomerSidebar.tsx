import React from 'react';
import { RubyRedColors, rubyStyles } from '../utils/RubyRedCustomerDesign';
import { cn } from '../utils/cn';
import { LucideIcon } from 'lucide-react';

interface CustomerNavItemProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * CustomerNavItem - Ruby Red themed navigation item
 * Mirrors QSAI's sophisticated navigation styling
 */
export const CustomerNavItem: React.FC<CustomerNavItemProps> = ({
  icon: Icon,
  label,
  isActive = false,
  onClick,
  className = ''
}) => {
  const navItemStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    fontWeight: 500,
    transition: 'all 0.2s ease-in-out',
    cursor: onClick ? 'pointer' : 'default',
    width: '100%',
    border: 'none',
    background: isActive ? RubyRedColors.ruby.primary : 'transparent',
    color: isActive ? RubyRedColors.white.pure : RubyRedColors.text.secondary,
    ...(isActive && {
      boxShadow: '0 4px 8px rgba(220, 38, 38, 0.2)'
    })
  };

  return (
    <button
      className={cn(
        'transition-all duration-200 hover:scale-105 active:scale-95',
        !isActive && 'hover:bg-white/5',
        className
      )}
      style={navItemStyles}
      onClick={onClick}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
};

interface CustomerSidebarProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * CustomerSidebar - Ruby Red themed sidebar component
 * Mirrors QSAI's sophisticated sidebar styling
 */
export const CustomerSidebar: React.FC<CustomerSidebarProps> = ({
  children,
  className = ''
}) => {
  const sidebarStyles = {
    background: RubyRedColors.background.secondary,
    borderRight: `1px solid ${RubyRedColors.background.tertiary}`,
    width: '320px',
    height: '100vh',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column' as const
  };

  return (
    <aside
      className={cn('flex flex-col', className)}
      style={sidebarStyles}
    >
      {children}
    </aside>
  );
};

export default CustomerSidebar;