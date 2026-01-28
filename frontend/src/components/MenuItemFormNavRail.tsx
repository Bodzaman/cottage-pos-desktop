import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormStep, StepStatus } from '../utils/menuFormSteps';

interface NavRailProps {
  steps: FormStep[];
  activeStepId: string;
  onStepClick: (stepId: string) => void;
}

function getStatusDotColor(status: StepStatus): string {
  switch (status) {
    case 'complete':
      return 'bg-green-500';
    case 'error':
      return 'bg-red-500';
    case 'incomplete':
      return 'bg-yellow-500';
    case 'not-started':
    default:
      return 'bg-gray-600';
  }
}

/**
 * Desktop sidebar navigation rail for menu item form.
 * Shows step icons with status indicators and active highlighting.
 */
export const MenuItemFormNavRail: React.FC<NavRailProps> = ({
  steps,
  activeStepId,
  onStepClick,
}) => {
  return (
    <nav
      className="hidden lg:flex flex-col w-52 shrink-0 border-r border-white/[0.07] bg-[rgba(15,15,15,0.5)] backdrop-blur-md overflow-y-auto"
      aria-label="Form sections"
    >
      <div className="py-3">
        {steps.map((step) => {
          const StepIcon = step.icon;
          const isActive = step.id === activeStepId;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepClick(step.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                'hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-inset',
                isActive && 'bg-[rgba(124,58,237,0.1)] border-l-2 border-[#7C3AED]',
                !isActive && 'border-l-2 border-transparent'
              )}
              aria-current={isActive ? 'step' : undefined}
            >
              <div className="relative shrink-0">
                <StepIcon
                  className={cn(
                    'w-4 h-4',
                    isActive ? 'text-[#A78BFA]' : 'text-gray-500'
                  )}
                />
                {/* Status dot */}
                <span
                  className={cn(
                    'absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full',
                    getStatusDotColor(step.status)
                  )}
                  aria-label={`Status: ${step.status}`}
                />
              </div>
              <span
                className={cn(
                  'text-sm truncate',
                  isActive ? 'text-white font-medium' : 'text-gray-400'
                )}
              >
                {step.title}
              </span>
              {step.status === 'complete' && (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 ml-auto shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

/**
 * Mobile horizontal tab bar for menu item form.
 * Shows step icons with status dots in a compact horizontal strip.
 */
export const MenuItemFormTabBar: React.FC<NavRailProps> = ({
  steps,
  activeStepId,
  onStepClick,
}) => {
  return (
    <nav
      className="flex lg:hidden overflow-x-auto border-b border-white/[0.07] bg-[rgba(15,15,15,0.5)] backdrop-blur-md"
      aria-label="Form sections"
    >
      <div className="flex min-w-max">
        {steps.map((step) => {
          const StepIcon = step.icon;
          const isActive = step.id === activeStepId;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepClick(step.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap transition-colors',
                'hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-inset',
                isActive && 'border-b-2 border-[#7C3AED] text-white',
                !isActive && 'border-b-2 border-transparent text-gray-400'
              )}
              aria-current={isActive ? 'step' : undefined}
            >
              <div className="relative">
                <StepIcon className="w-4 h-4" />
                <span
                  className={cn(
                    'absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full',
                    getStatusDotColor(step.status)
                  )}
                />
              </div>
              <span>{step.title}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MenuItemFormNavRail;
