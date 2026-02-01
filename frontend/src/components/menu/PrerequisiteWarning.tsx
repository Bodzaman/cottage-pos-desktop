/**
 * PrerequisiteWarning Component
 *
 * Displays a warning when a menu section is blocked due to missing prerequisites.
 * Provides clear guidance on what needs to be completed first.
 *
 * Used in the Menu Setup Dashboard when:
 * - Menu Items is selected but no Categories exist
 * - Any other dependency checks fail
 */

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Prerequisite {
  /** Unique identifier for this prerequisite */
  id: string;
  /** Display name (e.g., "Add at least one category") */
  label: string;
  /** Whether this prerequisite is satisfied */
  completed: boolean;
  /** Action to take when clicking the fix button */
  onFix?: () => void;
  /** Button text for the fix action */
  fixButtonText?: string;
}

export interface PrerequisiteWarningProps {
  /** Title of the blocked section (e.g., "Menu Items") */
  title: string;
  /** Description of why this is blocked */
  description?: string;
  /** List of prerequisites to complete */
  prerequisites: Prerequisite[];
  /** Additional class names */
  className?: string;
}

export function PrerequisiteWarning({
  title,
  description = 'Before proceeding, complete these steps:',
  prerequisites,
  className
}: PrerequisiteWarningProps) {
  const incompleteCount = prerequisites.filter(p => !p.completed).length;
  const isFullyBlocked = incompleteCount === prerequisites.length;

  return (
    <Alert
      variant="destructive"
      className={cn(
        'border-amber-500 bg-amber-50 text-amber-900',
        '[&>svg]:text-amber-500',
        className
      )}
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="font-semibold">
        {title} - Setup Required
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm text-amber-800">{description}</p>

        <div className="space-y-2">
          {prerequisites.map((prereq) => (
            <div
              key={prereq.id}
              className={cn(
                'flex items-center justify-between gap-2 p-2 rounded',
                prereq.completed ? 'bg-green-100' : 'bg-amber-100'
              )}
            >
              <div className="flex items-center gap-2">
                {prereq.completed ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-amber-400" />
                )}
                <span
                  className={cn(
                    'text-sm',
                    prereq.completed && 'line-through text-green-700'
                  )}
                >
                  {prereq.label}
                </span>
              </div>

              {!prereq.completed && prereq.onFix && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-amber-700 hover:text-amber-900 hover:bg-amber-200"
                  onClick={prereq.onFix}
                >
                  {prereq.fixButtonText || 'Fix'}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Hook to build prerequisites for Menu Items section
 */
export function useMenuItemsPrerequisites(
  categoryCount: number,
  onAddCategory: () => void
): Prerequisite[] {
  return [
    {
      id: 'categories',
      label: 'Add at least one category',
      completed: categoryCount > 0,
      onFix: onAddCategory,
      fixButtonText: 'Add Category'
    }
  ];
}

export default PrerequisiteWarning;
