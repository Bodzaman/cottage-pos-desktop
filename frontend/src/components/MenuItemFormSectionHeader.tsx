import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StepStatus } from '../utils/menuFormSteps';
import type { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  icon: LucideIcon;
  status: StepStatus;
  required?: boolean;
}

/**
 * Shared section divider for form sections.
 * Replaces the per-step Card headers with a clean, consistent divider.
 */
export const MenuItemFormSectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon: Icon,
  status,
  required = false,
}) => {
  return (
    <div className="flex items-center gap-3 pt-8 pb-4 border-b border-white/[0.07] first:pt-0">
      <Icon className="w-4 h-4 text-[#A78BFA] shrink-0" aria-hidden="true" />
      <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
        {title}
      </h3>
      {status === 'complete' && (
        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
      )}
      {status === 'error' && (
        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
      )}
      {required && status !== 'complete' && (
        <span className="text-xs text-gray-500">Required</span>
      )}
    </div>
  );
};

export default MenuItemFormSectionHeader;
