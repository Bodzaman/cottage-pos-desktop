import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, X, Loader2, Info, CheckCircle2, HelpCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { FormStep, calculateFormProgress, getNextIncompleteStep } from '../utils/menuFormSteps';
import { toast } from 'sonner';

/**
 * Props for MenuItemFormProgressFooter component
 */
interface MenuItemFormProgressFooterProps {
  /** Array of form steps with current statuses */
  steps: FormStep[];
  
  /** Callback when Save button is clicked */
  onSave: () => void;
  
  /** Callback when Cancel button is clicked */
  onCancel: () => void;
  
  /** Whether form is currently being submitted */
  isSubmitting: boolean;
  
  /** Optional: Custom save button text */
  saveButtonText?: string;
  
  /** Optional: Additional CSS class */
  className?: string;
  
  /** Optional: Callback to scroll to a specific step */
  onScrollToStep?: (stepId: string) => void;
}

/**
 * MenuItemFormProgressFooter - Sticky footer with progress tracking and actions
 * 
 * Features:
 * - Progress bar showing completion percentage
 * - Required vs total steps counter
 * - "Next action" guidance for incomplete steps
 * - Save button (disabled until all required steps complete)
 * - Cancel button
 * - Loading states
 * - Sticky positioning
 * - Success state when all complete
 * 
 * @example
 * ```tsx
 * <MenuItemFormProgressFooter
 *   steps={stepsWithStatus}
 *   onSave={handleSubmit}
 *   onCancel={handleCancel}
 *   isSubmitting={isSubmitting}
 *   onScrollToStep={(stepId) => {
 *     // Expand and scroll to step
 *   }}
 * />
 * ```
 */
export const MenuItemFormProgressFooter: React.FC<MenuItemFormProgressFooterProps> = ({
  steps,
  onSave,
  onCancel,
  isSubmitting,
  saveButtonText = 'Save Menu Item',
  className,
  onScrollToStep
}) => {
  // 🆕 Track if completion toast has been shown
  const [hasShownCompletionToast, setHasShownCompletionToast] = React.useState(false);
  
  // Calculate progress metrics
  const requiredSteps = steps.filter(s => s.required);
  const completedRequired = requiredSteps.filter(s => s.status === 'complete').length;
  const totalRequired = requiredSteps.length;
  const progress = calculateFormProgress(steps);
  
  // Check if form can be saved
  const canSave = completedRequired === totalRequired;
  const nextStep = getNextIncompleteStep(steps);
  
  // Check if any steps have errors
  const hasErrors = steps.some(s => s.status === 'error');
  
  // 🆕 Detect completion and show toast
  React.useEffect(() => {
    // Show toast when reaching 100% for the first time
    if (progress === 100 && !hasShownCompletionToast && !hasErrors) {
      setHasShownCompletionToast(true);
      
      toast.success('Ready to save!', {
        description: 'All required fields complete',
      });
    }

    // Reset if form becomes incomplete again
    if (progress < 100 && hasShownCompletionToast) {
      setHasShownCompletionToast(false);
    }
  }, [progress, hasShownCompletionToast, hasErrors]);
  
  // 🆕 Determine if progress section should be visible
  const shouldShowProgress = progress < 100 || hasErrors;
  
  return (
    <div
      className={cn(
        'bg-[rgba(15,15,15,0.85)] backdrop-blur-2xl',
        'border-t border-white/[0.07]',
        'shadow-2xl',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* 🆕 Progress Bar Section - Only visible when incomplete */}
        {shouldShowProgress && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {canSave ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <Info className="w-4 h-4 text-[#A78BFA]" />
                )}
                <span className="text-sm font-medium text-white">
                  {canSave ? (
                    'Ready to save!'
                  ) : (
                    `Form Progress: ${Math.round(progress)}% complete`
                  )}
                </span>
              </div>
              
              <span className="text-xs text-gray-400">
                {completedRequired} of {totalRequired} required section{totalRequired !== 1 ? 's' : ''}
              </span>
            </div>
            
            {/* Progress Bar */}
            <Progress
              value={progress}
              className={cn(
                'h-2 bg-[rgba(30,30,30,0.6)]',
                canSave && 'bg-green-900/30'
              )}
              indicatorClassName={cn(
                'transition-all duration-500',
                canSave ? 'bg-green-500' : 'bg-[#7C3AED]'
              )}
            />
          </div>
        )}

        {/* Next Action Guidance - Only show when incomplete */}
        {!canSave && nextStep && (
          <Alert
            className={cn(
              'mb-4 border-[rgba(124,58,237,0.3)] bg-[rgba(124,58,237,0.1)]',
              hasErrors && 'border-red-500/30 bg-red-500/10'
            )}
          >
            <Info className="h-4 w-4 text-[#A78BFA]" />
            <AlertDescription className="text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-white">
                    {hasErrors ? 'Fix errors in:' : 'Next:'}
                  </strong>
                  {' '}
                  <span className="text-gray-300">
                    {nextStep.title}
                  </span>
                  {' '}
                  <span className="text-gray-400">
                    - {nextStep.description}
                  </span>
                </div>
                
                {onScrollToStep && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onScrollToStep(nextStep.id)}
                    className="text-[#A78BFA] hover:text-white hover:bg-[rgba(124,58,237,0.15)]"
                  >
                    Go to section →
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {/* 🗑️ REMOVED: Success Alert - Replaced by toast notification */}
        
        {/* Error Warning - Still show when errors present */}
        {hasErrors && (
          <Alert className="mb-4 border-red-500/30 bg-red-500/10" variant="destructive">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Please fix the errors in the highlighted sections before saving.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons - Always visible */}
        <div className="flex items-center justify-between gap-4">
          {/* Cancel Button */}
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="border-white/[0.1] hover:bg-white/[0.05] text-white"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>

          {/* Keyboard Shortcuts Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-white/[0.05]"
                aria-label="Keyboard shortcuts"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="center"
              className="w-72 bg-[rgba(26,26,26,0.95)] border-white/[0.07] p-4 backdrop-blur-xl"
            >
              <h4 className="text-sm font-semibold text-white mb-3">Keyboard Shortcuts</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ['Ctrl+S', 'Save form'],
                  ['Ctrl+Enter', 'Submit form'],
                  ['Ctrl+D', 'Duplicate item'],
                  ['Ctrl+Shift+R', 'Reset form'],
                  ['Esc', 'Cancel'],
                  ['Tab', 'Next field'],
                ].map(([key, label]) => (
                  <React.Fragment key={key}>
                    <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-300 text-xs font-mono text-center">
                      {key}
                    </kbd>
                    <span className="text-gray-400 text-xs">{label}</span>
                  </React.Fragment>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Save Button */}
          <Button
            type="button"
            onClick={onSave}
            disabled={!canSave || hasErrors || isSubmitting}
            className={cn(
              'min-w-[200px] font-semibold',
              canSave && !hasErrors
                ? 'bg-[#7C3AED] hover:bg-[#5B21B6] text-white'
                : 'bg-[rgba(30,30,30,0.6)] text-gray-500 cursor-not-allowed'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {saveButtonText}
              </>
            )}
          </Button>
        </div>

        {/* Optional: Additional Context */}
        {!canSave && !nextStep && totalRequired === 0 && (
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500">
              This form has no required sections. You can save at any time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuItemFormProgressFooter;
