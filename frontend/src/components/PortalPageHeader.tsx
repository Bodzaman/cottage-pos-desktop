import React from 'react';
import { motion } from 'framer-motion';
import { PortalButton } from './PortalButton';

interface PortalPageHeaderAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

interface PortalPageHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: PortalPageHeaderAction;
  className?: string;
}

/**
 * PortalPageHeader - Standard page header pattern for Customer Portal
 * Left: Icon badge + title + subtitle
 * Right: Contextual CTA button (varies per tab)
 * Mobile: Stacks vertically, CTA full-width
 */
export function PortalPageHeader({
  icon,
  title,
  subtitle,
  action,
  className = '',
}: PortalPageHeaderProps) {
  return (
    <motion.header
      className={`mb-6 md:mb-8 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Icon + Title */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Icon Badge */}
          <div className="p-2.5 md:p-3 rounded-xl bg-[#8B1538]/15 border border-[#8B1538]/20 backdrop-blur-sm shrink-0">
            <div className="text-[#8B1538] w-5 h-5 md:w-6 md:h-6 [&>svg]:w-full [&>svg]:h-full">
              {icon}
            </div>
          </div>

          {/* Title + Subtitle */}
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-400 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: CTA Button */}
        {action && (
          <PortalButton
            variant={action.variant || 'primary'}
            onClick={action.onClick}
            className="w-full md:w-auto shrink-0"
          >
            {action.icon}
            {action.label}
          </PortalButton>
        )}
      </div>
    </motion.header>
  );
}

export default PortalPageHeader;
