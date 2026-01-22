import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Download, Clock } from 'lucide-react';
import { globalColors } from '../utils/QSAIDesign';

// Save Template Dialog
interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
  onTemplateNameChange: (name: string) => void;
  onSave: () => void;
}

export const SaveTemplateDialog = React.memo<SaveTemplateDialogProps>(({ 
  open,
  onOpenChange,
  templateName,
  onTemplateNameChange,
  onSave
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Download className="h-5 w-5 text-purple-500" />
            Save as Template
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Save this form configuration for quick reuse later. Templates preserve all settings except item ID.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="template-name" className="text-white">
            Template Name
          </Label>
          <Input
            id="template-name"
            value={templateName}
            onChange={(e) => onTemplateNameChange(e.target.value)}
            placeholder="e.g., Standard Curry Template"
            className="mt-2 bg-gray-800 border-gray-700 text-white"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSave();
              }
            }}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onTemplateNameChange('');
            }}
            className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={!templateName.trim()}
            style={{
              backgroundColor: globalColors.purple.primary,
              color: globalColors.text.primary
            }}
          >
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

SaveTemplateDialog.displayName = 'SaveTemplateDialog';

// Draft Restore Dialog
interface DraftData {
  formData: any;
  variants?: any[];
  timestamp: string;
}

interface DraftRestoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftData: DraftData | null;
  onRestore: () => void;
  onDiscard: () => void;
}

export const DraftRestoreDialog = React.memo<DraftRestoreDialogProps>(({ 
  open,
  onOpenChange,
  draftData,
  onRestore,
  onDiscard
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-500" />
            Draft Found
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            {draftData && (
              <>
                A draft was auto-saved on{' '}
                <strong>
                  {new Date(draftData.timestamp).toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </strong>
                . Would you like to restore it?
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="text-sm text-gray-400 space-y-2">
            <p>✓ Restoring will load all previously entered data</p>
            <p>✓ You can continue editing from where you left off</p>
            <p>✗ Discarding will permanently delete the draft</p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onDiscard}
            className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
          >
            Discard Draft
          </Button>
          <Button
            onClick={onRestore}
            disabled={!draftData}
            style={{
              backgroundColor: globalColors.purple.primary,
              color: globalColors.text.primary
            }}
          >
            Restore Draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

DraftRestoreDialog.displayName = 'DraftRestoreDialog';

// Cancel Confirmation Dialog
interface CancelConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const CancelConfirmationDialog = React.memo<CancelConfirmationDialogProps>(({ 
  open,
  onOpenChange,
  onConfirm
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-gray-900 border-gray-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300">
            You have unsaved changes. Are you sure you want to cancel? All changes will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700">
            Continue Editing
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Discard Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

CancelConfirmationDialog.displayName = 'CancelConfirmationDialog';
