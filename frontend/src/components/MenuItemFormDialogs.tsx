import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Download, Clock } from 'lucide-react';

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
      <DialogContent className="bg-[rgba(26,26,26,0.95)] backdrop-blur-md border border-white/[0.07]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Download className="h-5 w-5 text-[#7C3AED]" />
            Save as Template
          </DialogTitle>
          <DialogDescription className="text-gray-400">
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
            className="mt-2 bg-surface-tertiary border-white/10 text-white"
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
            className="bg-surface-tertiary text-white border-white/[0.07] hover:bg-white/[0.05]"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={!templateName.trim()}
            className="bg-[#7C3AED] hover:bg-[#5B21B6] text-white"
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
      <DialogContent className="bg-[rgba(26,26,26,0.95)] backdrop-blur-md border border-white/[0.07]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-500" />
            Draft Found
          </DialogTitle>
          <DialogDescription className="text-gray-400">
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
            className="bg-surface-tertiary text-white border-white/[0.07] hover:bg-white/[0.05]"
          >
            Discard Draft
          </Button>
          <Button
            onClick={onRestore}
            disabled={!draftData}
            className="bg-[#7C3AED] hover:bg-[#5B21B6] text-white"
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
      <AlertDialogContent className="bg-[rgba(26,26,26,0.95)] backdrop-blur-md border border-white/[0.07]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            You have unsaved changes. Are you sure you want to cancel? All changes will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-surface-tertiary text-white border-white/[0.07] hover:bg-white/[0.05]">
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
