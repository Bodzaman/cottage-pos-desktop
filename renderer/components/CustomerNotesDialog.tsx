/**
 * CustomerNotesDialog - Dialog for editing order/table notes
 * 
 * Allows staff to add special instructions, preferences, or important
 * information about the order or table session.
 * 
 * Features:
 * - Editable textarea for notes
 * - Auto-save on dialog close with changes
 * - Visual indicator when notes exist
 * - Used in DineInFullReviewModal footer View Actions
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Save, X } from 'lucide-react';
import { QSAITheme } from 'utils/QSAIDesign';

interface CustomerNotesDialogProps {
  open: boolean;
  onClose: () => void;
  initialNotes?: string;
  onSave: (notes: string) => Promise<void>;
  tableNumber?: number;
}

export function CustomerNotesDialog({
  open,
  onClose,
  initialNotes = '',
  onSave,
  tableNumber
}: CustomerNotesDialogProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync with initial notes when dialog opens
  useEffect(() => {
    if (open) {
      setNotes(initialNotes || '');
      setHasChanges(false);
    }
  }, [open, initialNotes]);

  // Track changes
  useEffect(() => {
    setHasChanges(notes !== (initialNotes || ''));
  }, [notes, initialNotes]);

  const handleSave = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      await onSave(notes.trim());
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error('Failed to save notes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirm = window.confirm('You have unsaved changes. Discard them?');
      if (!confirm) return;
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl"
        style={{
          background: QSAITheme.background.panel,
          borderColor: QSAITheme.border.light,
        }}
      >
        <DialogHeader>
          <DialogTitle
            className="text-xl font-bold"
            style={{ color: QSAITheme.text.primary }}
          >
            Order Notes
            {tableNumber && (
              <span
                className="ml-2 text-sm font-normal"
                style={{ color: QSAITheme.text.muted }}
              >
                (Table {tableNumber})
              </span>
            )}
          </DialogTitle>
          <DialogDescription style={{ color: QSAITheme.text.muted }}>
            Add special instructions, preferences, or important information about this order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label
              htmlFor="notes"
              className="text-sm font-medium"
              style={{ color: QSAITheme.text.secondary }}
            >
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Enter any special instructions, dietary requirements, or preferences..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={8}
              className="resize-none"
              style={{
                background: QSAITheme.background.secondary,
                borderColor: QSAITheme.border.medium,
                color: QSAITheme.text.primary,
              }}
              disabled={isSaving}
            />
            <p
              className="text-xs"
              style={{ color: QSAITheme.text.muted }}
            >
              {notes.length} characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              style={{
                borderColor: QSAITheme.border.medium,
                color: QSAITheme.text.secondary,
              }}
              className="hover:bg-white/5"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              variant="ghost"
              className="transition-all hover:opacity-90"
              style={{
                background: `${hasChanges ? QSAITheme.accent.primary : QSAITheme.background.tertiary} !important`,
                color: '#FFFFFF',
                opacity: hasChanges ? 1 : 0.5,
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Notes
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
