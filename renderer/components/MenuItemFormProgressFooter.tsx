import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, X, Loader2, Info, CheckCircle2 } from 'lucide-react';
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
        duration: 3000,
        position: 'top-right'
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
        'bg-gray-900/95 backdrop-blur-md',
        'border-t border-white/10',
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
                  <Info className="w-4 h-4 text-purple-400" />
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
                'h-2 bg-gray-800',
                canSave && 'bg-green-900/30'
              )}
              indicatorClassName={cn(
                'transition-all duration-500',
                canSave ? 'bg-green-500' : 'bg-purple-500'
              )}
            />
          </div>
        )}

        {/* Next Action Guidance - Only show when incomplete */}
        {!canSave && nextStep && (
          <Alert
            className={cn(
              'mb-4 border-purple-500/30 bg-purple-500/10',
              hasErrors && 'border-red-500/30 bg-red-500/10'
            )}
          >
            <Info className="h-4 w-4 text-purple-400" />
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
                    className="text-purple-300 hover:text-purple-200 hover:bg-purple-500/20"
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
            className="border-white/20 hover:bg-white/5 text-white"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>

          {/* Save Button */}
          <Button
            type="button"
            onClick={onSave}
            disabled={!canSave || hasErrors || isSubmitting}
            className={cn(
              'min-w-[200px] font-semibold',
              canSave && !hasErrors
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
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
