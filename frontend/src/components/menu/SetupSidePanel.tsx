/**
 * SetupSidePanel Component
 *
 * A slide-in panel container for Menu Setup Dashboard.
 * Provides consistent layout for all 5 sections when user clicks "Manage →".
 *
 * Features:
 * - Slides in from right side
 * - Header with title and description
 * - Scrollable content area
 * - Close button (× or Escape key)
 * - Maintains max 2 levels of navigation (dashboard + panel)
 */

import React, { useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SetupSidePanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback when the panel should close */
  onClose: () => void;
  /** Panel title (e.g., "Categories", "Proteins") */
  title: string;
  /** Brief description of what this section manages */
  description: string;
  /** Content to render inside the panel */
  children: React.ReactNode;
  /** Optional: Quick add button text (e.g., "+ New Category") */
  addButtonText?: string;
  /** Optional: Callback when add button is clicked */
  onAdd?: () => void;
  /** Optional: Custom width class (default: sm:max-w-xl) */
  widthClass?: string;
  /** Optional: Additional class names for content area */
  contentClassName?: string;
}

export function SetupSidePanel({
  isOpen,
  onClose,
  title,
  description,
  children,
  addButtonText,
  onAdd,
  widthClass = 'sm:max-w-xl',
  contentClassName
}: SetupSidePanelProps) {
  // Handle Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className={cn(
          'flex flex-col h-full p-0',
          widthClass
        )}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b">
          <SheetHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-bold">{title}</SheetTitle>
              {addButtonText && onAdd && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onAdd}
                  className="h-9"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {addButtonText}
                </Button>
              )}
            </div>
            <SheetDescription className="text-sm">
              {description}
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* Scrollable Content */}
        <div className={cn(
          'flex-1 overflow-y-auto p-6',
          contentClassName
        )}>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * EmptyStateGuide Component
 *
 * Displays helpful guidance when a section is empty.
 * Used for first-time setup experience.
 */
export interface EmptyStateGuideProps {
  /** Icon to display */
  icon: React.ReactNode;
  /** Main message title */
  title: string;
  /** Helpful description text */
  description: string;
  /** Action button text */
  actionText: string;
  /** Callback when action button is clicked */
  onAction: () => void;
}

export function EmptyStateGuide({
  icon,
  title,
  description,
  actionText,
  onAction
}: EmptyStateGuideProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {description}
      </p>
      <Button onClick={onAction}>
        <Plus className="w-4 h-4 mr-2" />
        {actionText}
      </Button>
    </div>
  );
}

export default SetupSidePanel;
