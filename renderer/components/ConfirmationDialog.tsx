


import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { QSAITheme } from 'utils/QSAIDesign';

interface Props {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

/**
 * Reusable confirmation dialog component with QSAI design consistency
 * Used for confirming destructive actions like item deletion
 */
export default function ConfirmationDialog({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false
}: Props) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent 
        className="border-0 border-b-2"
        style={{
          backgroundColor: QSAITheme.background.primary,
          border: `1px solid ${QSAITheme.border.medium}`,
          borderBottomColor: QSAITheme.purple.primary
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle 
            className="flex items-center gap-2"
            style={{ color: QSAITheme.text.primary }}
          >
            {isDestructive && <Trash2 className="h-5 w-5" style={{ color: '#EF4444' }} />}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription style={{ color: QSAITheme.text.secondary }}>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={onCancel}
            className="border-0 hover:bg-white/10"
            style={{
              backgroundColor: 'transparent',
              borderColor: QSAITheme.border.medium,
              color: QSAITheme.text.secondary,
              border: `1px solid ${QSAITheme.border.medium}`
            }}
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="border-0 hover:opacity-90"
            style={{
              backgroundColor: isDestructive ? '#EF4444' : QSAITheme.purple.primary,
              color: 'white'
            }}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
