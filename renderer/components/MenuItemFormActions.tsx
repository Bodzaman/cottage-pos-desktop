import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader2, X } from 'lucide-react';
import { globalColors } from '../utils/QSAIDesign';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FormActionsProps {
  isSubmitting: boolean;
  isEditing: boolean;
  onCancel: () => void;
  submitButtonText?: string;
}

/**
 * Menu Item Form Actions Component
 * 
 * Renders the form action buttons (Submit/Cancel) with loading states.
 * Handles unsaved changes confirmation on cancel.
 * 
 * Extracted from MenuItemForm for better separation of concerns.
 */
export const MenuItemFormActions = React.memo<FormActionsProps>(({ 
  isSubmitting,
  isEditing,
  onCancel,
  submitButtonText
}) => {
  return (
    <TooltipProvider>
      <div className="flex justify-end space-x-4 pt-6">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="border-gray-600 hover:bg-gray-800"
              style={{ color: globalColors.text.secondary }}
              aria-label="Cancel and return to menu list"
            >
              <X className="mr-2 h-4 w-4" aria-hidden="true" />
              Cancel
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-800 border-purple-500/30">
            <p className="text-sm font-medium text-gray-200">Cancel</p>
            <p className="text-xs text-gray-400 mt-1">Esc</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-white"
              style={{ backgroundColor: globalColors.purple.primary }}
              aria-label={isSubmitting ? 'Saving menu item...' : (submitButtonText || (isEditing ? 'Update Menu Item' : 'Create Menu Item'))}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                  {submitButtonText || (isEditing ? 'Update Menu Item' : 'Create Menu Item')}
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-800 border-purple-500/30">
            <p className="text-sm font-medium text-gray-200">
              {isEditing ? 'Update Menu Item' : 'Create Menu Item'}
            </p>
            <p className="text-xs text-gray-400 mt-1">⌘Enter or Ctrl+Enter</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
});

MenuItemFormActions.displayName = 'MenuItemFormActions';
