import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormStep, StepStatus } from '../utils/menuFormSteps';

/**
 * Props for MenuItemFormStepper component
 */
interface MenuItemFormStepperProps {
  /** Array of form steps with current statuses */
  steps: FormStep[];
  
  /** Set of expanded step IDs */
  expandedSteps: Set<string>;
  
  /** Callback when step expand/collapse is toggled */
  onToggleStep: (stepId: string) => void;
  
  /** Render function for step content */
  renderStepContent: (stepId: string) => React.ReactNode;
  
  /** Optional: Get summary text for collapsed steps */
  getStepSummary?: (stepId: string) => string | null;
  
  /** Optional: Additional CSS class */
  className?: string;
}

/**
 * Get status-specific styling
 */
function getStatusStyles(status: StepStatus): string {
  switch (status) {
    case 'complete':
      return 'bg-green-500/20 border-green-500/30';
    case 'error':
      return 'bg-red-500/20 border-red-500/30';
    case 'incomplete':
      return 'bg-yellow-500/20 border-yellow-500/30';
    case 'not-started':
    default:
      return 'bg-gray-700/30 border-gray-600/30';
  }
}

/**
 * Get status icon component
 */
function getStatusIcon(status: StepStatus, StepIcon: React.ComponentType<any>) {
  const iconProps = { className: 'w-5 h-5' };
  
  switch (status) {
    case 'complete':
      return <CheckCircle2 {...iconProps} className="w-5 h-5 text-green-400" />;
    case 'error':
      return <AlertCircle {...iconProps} className="w-5 h-5 text-red-400" />;
    case 'incomplete':
      return <AlertTriangle {...iconProps} className="w-5 h-5 text-yellow-400" />;
    case 'not-started':
    default:
      return <StepIcon {...iconProps} className="w-5 h-5 text-gray-400" />;
  }
}

/**
 * Get card border styling based on status
 */
function getCardBorderStyle(status: StepStatus, isExpanded: boolean): string {
  const baseStyle = 'transition-all duration-300';
  
  if (isExpanded) {
    return cn(baseStyle, 'ring-2 ring-purple-500/50 border-purple-500/30');
  }
  
  switch (status) {
    case 'complete':
      return cn(baseStyle, 'border-green-500/30 hover:border-green-500/50');
    case 'error':
      return cn(baseStyle, 'border-red-500/50 hover:border-red-500/70');
    case 'incomplete':
      return cn(baseStyle, 'border-yellow-500/30 hover:border-yellow-500/50');
    default:
      return cn(baseStyle, 'border-white/10 hover:border-white/20');
  }
}

/**
 * Individual step component
 */
interface StepCardProps {
  step: FormStep;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  renderContent: () => React.ReactNode;
  summary: string | null;
}

const StepCard: React.FC<StepCardProps> = ({
  step,
  index,
  isExpanded,
  onToggle,
  renderContent,
  summary
}) => {
  const StepIcon = step.icon;
  
  return (
    <Card
      className={cn(
        'bg-gray-900/50',
        getCardBorderStyle(step.status, isExpanded)
      )}
    >
      <CardHeader
        className="cursor-pointer hover:bg-white/5 transition-colors"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={`step-content-${step.id}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Status Icon */}
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center border',
                getStatusStyles(step.status)
              )}
              aria-label={`Step ${index + 1} status: ${step.status}`}
            >
              {getStatusIcon(step.status, StepIcon)}
            </div>

            {/* Step Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-white text-base">
                  {index + 1}. {step.title}
                </span>
                
                {step.required ? (
                  <Badge
                    variant="destructive"
                    className="text-xs bg-red-600/20 text-red-300 border-red-500/30"
                  >
                    Required
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-xs border-gray-600 text-gray-400"
                  >
                    Optional
                  </Badge>
                )}
                
                {/* Status Badge */}
                {step.status === 'error' && (
                  <Badge
                    variant="destructive"
                    className="text-xs bg-red-500/20 text-red-300"
                  >
                    Has Errors
                  </Badge>
                )}
                {step.status === 'incomplete' && step.required && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                  >
                    Incomplete
                  </Badge>
                )}
                {step.status === 'complete' && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-green-500/20 text-green-300 border-green-500/30"
                  >
                    Complete
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-gray-400 mt-1">
                {step.description}
              </p>
              
              {/* Summary Preview (when collapsed and has data) */}
              {!isExpanded && summary && step.status !== 'not-started' && (
                <div className="mt-2 text-sm text-gray-300 bg-white/5 px-3 py-2 rounded border border-white/10">
                  {summary}
                </div>
              )}
            </div>
          </div>

          {/* Expand/Collapse Icon (no longer a button) */}
          <div
            className="ml-2 text-gray-400 hover:text-white transition-colors p-2"
            aria-label={isExpanded ? 'Collapse step' : 'Expand step'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
      </CardHeader>

      {/* Step Content (conditionally rendered) */}
      {isExpanded && (
        <CardContent
          id={`step-content-${step.id}`}
          className="pt-0 pb-6 animate-in slide-in-from-top-2 duration-300"
          role="region"
          aria-labelledby={`step-header-${step.id}`}
        >
          <div className="border-t border-white/10 pt-6">
            {renderContent()}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

/**
 * MenuItemFormStepper - Vertical stepper with progressive disclosure
 * 
 * Features:
 * - Collapsible steps with status indicators
 * - Visual hierarchy with icons and badges
 * - Smooth expand/collapse animations
 * - Keyboard navigation support
 * - Summary previews when collapsed
 * - Accessibility (ARIA attributes, roles)
 * 
 * @example
 * ```tsx
 * <MenuItemFormStepper
 *   steps={stepsWithStatus}
 *   expandedSteps={expandedSteps}
 *   onToggleStep={handleToggleStep}
 *   renderStepContent={(stepId) => {
 *     switch (stepId) {
 *       case 'basic': return <BasicInfoSection />;
 *       case 'pricing': return <PricingSection />;
 *       default: return null;
 *     }
 *   }}
 *   getStepSummary={(stepId) => getStepSummary(stepId, formData, variants)}
 * />
 * ```
 */
export const MenuItemFormStepper: React.FC<MenuItemFormStepperProps> = ({
  steps,
  expandedSteps,
  onToggleStep,
  renderStepContent,
  getStepSummary,
  className
}) => {
  return (
    <div className={cn('space-y-4', className)} role="region" aria-label="Form steps">
      {steps.map((step, index) => {
        const isExpanded = expandedSteps.has(step.id);
        const summary = getStepSummary ? getStepSummary(step.id) : null;
        
        return (
          <StepCard
            key={step.id}
            step={step}
            index={index}
            isExpanded={isExpanded}
            onToggle={() => onToggleStep(step.id)}
            renderContent={() => renderStepContent(step.id)}
            summary={summary}
          />
        );
      })}
    </div>
  );
};

export default MenuItemFormStepper;
