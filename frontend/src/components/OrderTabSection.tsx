/**
 * OrderTabSection - Reusable section container for Order tab
 * Features:
 * - Consistent header with icon and title
 * - Subtle divider styling
 * - Dark theme integration with QSAITheme
 * - Responsive layout
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { QSAITheme } from 'utils/QSAIDesign';

interface Props {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function OrderTabSection({ icon: Icon, title, children, className = '' }: Props) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center gap-2 pb-2">
        <Icon 
          className="h-4 w-4" 
          style={{ color: QSAITheme.purple.primary }}
        />
        <h3 
          className="text-sm font-semibold uppercase tracking-wide"
          style={{ color: QSAITheme.text.secondary }}
        >
          {title}
        </h3>
      </div>
      
      {/* Section Content */}
      <div className="space-y-3">
        {children}
      </div>
      
      {/* Section Divider */}
      <div 
        className="h-px mt-4" 
        style={{ backgroundColor: QSAITheme.border.light }}
      />
    </div>
  );
}
