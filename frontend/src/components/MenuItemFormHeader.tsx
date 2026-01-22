import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertCircle, FileText, Check, Keyboard, Trash2 } from 'lucide-react';
import { globalColors } from '../utils/QSAIDesign';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface FormHeaderProps {
  isEditing: boolean;
  formTitle: string;
  isDirty: boolean;
  lastAutosaveTime: Date | null;
  completionPercentage: number;
  estimatedTimeMinutes: number;
  statusMessage: string;
  errorMessage: string;
  onDiscardDraft: () => void;
}

/**
 * Menu Item Form Header Component
 * 
 * Displays form title, status badges, completion progress, and autosave timestamp.
 * Provides visual feedback about form state and user progress.
 * 
 * Extracted from MenuItemForm for better organization.
 */
export const MenuItemFormHeader = React.memo<FormHeaderProps>(({ 
  isEditing,
  formTitle,
  isDirty,
  lastAutosaveTime,
  completionPercentage,
  estimatedTimeMinutes,
  statusMessage,
  errorMessage,
  onDiscardDraft
}) => {
  return (
    <Card 
      className="mb-6" 
      style={{
        backgroundColor: '#1E1E1E',
        border: '1px solid rgba(255, 255, 255, 0.03)',
        borderBottom: '1px solid rgba(91, 33, 182, 0.15)'
      }}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-2xl" style={{ color: globalColors.text.primary }}>
              {formTitle}
            </CardTitle>
            
            {/* 🆕 PHASE 2.1: Unsaved Changes Indicator */}
            {isDirty && (
              <Badge 
                variant="outline" 
                className="border-orange-500/50 text-orange-400 bg-orange-500/10"
                aria-label="Form has unsaved changes"
              >
                <AlertCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                Unsaved Changes
              </Badge>
            )}
            
            {/* 🆕 PHASE 2.4: Completion Progress Badge */}
            <Badge 
              variant="outline"
              className="border-purple-500/50 text-purple-400 bg-purple-500/10"
              aria-label={`Form ${completionPercentage}% complete`}
            >
              {completionPercentage < 100 ? (
                <FileText className="h-3 w-3 mr-1" aria-hidden="true" />
              ) : (
                <Check className="h-3 w-3 mr-1" aria-hidden="true" />
              )}
              {completionPercentage}% Complete
            </Badge>
            
            {/* 🆕 PHASE 2.4: Estimated Time Badge */}
            {completionPercentage < 100 && (
              <Badge 
                variant="outline"
                className="border-blue-500/50 text-blue-400 bg-blue-500/10"
                aria-label={`Estimated ${estimatedTimeMinutes} minutes remaining`}
              >
                <Clock className="h-3 w-3 mr-1" aria-hidden="true" />
                ~{estimatedTimeMinutes} min left
              </Badge>
            )}
          </div>
          
          {/* 🆕 PHASE 2.2: Autosave Timestamp */}
          {lastAutosaveTime && (
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className="border-green-500/50 text-green-400 bg-green-500/10"
                aria-label={`Draft saved at ${lastAutosaveTime.toLocaleTimeString()}`}
              >
                <Clock className="h-3 w-3 mr-1" aria-hidden="true" />
                Draft saved at {lastAutosaveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Badge>
              <button
                type="button"
                onClick={onDiscardDraft}
                className="text-xs text-gray-400 hover:text-red-400 underline"
                aria-label="Discard saved draft"
              >
                Discard Draft
              </button>
            </div>
          )}
        </div>
      </CardHeader>
    </Card>
  );
});

MenuItemFormHeader.displayName = 'MenuItemFormHeader';
