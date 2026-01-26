import React from 'react';
import { PortalPageHeader } from './PortalPageHeader';

interface PortalSectionAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

interface PortalSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: PortalSectionAction;
  className?: string;
}

/**
 * PortalSection - Section wrapper for Customer Portal
 * Content-sized sections (no forced min-height)
 * Consistent max-width container with responsive padding
 * Integrates PortalPageHeader for standard header pattern
 */
export function PortalSection({
  id,
  title,
  subtitle,
  icon,
  children,
  action,
  className = ''
}: PortalSectionProps) {
  return (
    <section
      id={id}
      className={`w-full py-6 md:py-8 ${className}`}
    >
      <div className="container mx-auto max-w-5xl px-4 md:px-6 lg:px-8">
        {/* Section Header with optional CTA */}
        <PortalPageHeader
          icon={icon}
          title={title}
          subtitle={subtitle}
          action={action}
        />

        {/* Section Content */}
        <div className="w-full">
          {children}
        </div>
      </div>
    </section>
  );
}

export default PortalSection;
