/**
 * BulkActionToolbar
 *
 * Sticky toolbar that appears when items are selected.
 * Provides bulk operations: Activate, Deactivate, Delete, Publish.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  Trash2,
  Upload,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { colors } from '../utils/InternalDesignSystem';

interface BulkActionToolbarProps {
  /** Number of selected items */
  selectedCount: number;
  /** Handler to clear selection */
  onClearSelection: () => void;
  /** Handler for activating selected items */
  onActivate: () => Promise<void>;
  /** Handler for deactivating selected items */
  onDeactivate: () => Promise<void>;
  /** Handler for deleting selected items */
  onDelete: () => Promise<void>;
  /** Handler for publishing selected items (optional) */
  onPublish?: () => Promise<void>;
  /** Whether the toolbar is visible */
  isVisible: boolean;
  /** Class name for styling */
  className?: string;
}

type ActionType = 'activate' | 'deactivate' | 'delete' | 'publish' | null;

export const BulkActionToolbar: React.FC<BulkActionToolbarProps> = ({
  selectedCount,
  onClearSelection,
  onActivate,
  onDeactivate,
  onDelete,
  onPublish,
  isVisible,
  className,
}) => {
  const [loadingAction, setLoadingAction] = useState<ActionType>(null);

  // Handle action with loading state
  const handleAction = async (
    action: ActionType,
    handler: () => Promise<void>,
    successMessage: string
  ) => {
    if (loadingAction) return;

    setLoadingAction(action);
    try {
      await handler();
      toast.success(successMessage);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} items`);
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle delete with confirmation
  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedCount} item${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`)) {
      return;
    }

    await handleAction('delete', onDelete, `${selectedCount} item${selectedCount > 1 ? 's' : ''} deleted`);
  };

  if (!isVisible || selectedCount === 0) {
    return null;
  }

  return (
    <div
      role="toolbar"
      aria-label={`Bulk actions for ${selectedCount} selected item${selectedCount > 1 ? 's' : ''}`}
      className={cn(
        'fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50',
        'rounded-xl shadow-2xl',
        'px-2 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-4',
        'animate-in slide-in-from-bottom-4 duration-200',
        'max-w-[95vw]',
        className
      )}
      style={{
        backgroundColor: colors.background.secondary,
        border: `1px solid ${colors.border.accent}`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Selection Count */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Badge
          variant="secondary"
          className="px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs sm:text-sm"
          style={{
            backgroundColor: 'rgba(124, 58, 237, 0.2)',
            color: colors.purple.primary,
            border: `1px solid ${colors.border.accent}`,
          }}
        >
          {selectedCount}
        </Badge>
        <span
          className="text-xs sm:text-sm hidden xs:inline"
          style={{ color: colors.text.secondary }}
        >
          item{selectedCount > 1 ? 's' : ''} selected
        </span>
      </div>

      {/* Divider - hidden on very small screens */}
      <div
        className="h-5 sm:h-6 w-px hidden xs:block"
        style={{ backgroundColor: colors.border.accent }}
      />

      {/* Action Buttons */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Activate */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAction('activate', onActivate, `${selectedCount} item${selectedCount > 1 ? 's' : ''} activated`)}
          disabled={loadingAction !== null}
          className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 px-2 sm:px-3"
          aria-label="Activate selected items"
        >
          {loadingAction === 'activate' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          <span className="hidden sm:inline ml-1.5">Activate</span>
        </Button>

        {/* Deactivate */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAction('deactivate', onDeactivate, `${selectedCount} item${selectedCount > 1 ? 's' : ''} deactivated`)}
          disabled={loadingAction !== null}
          className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 px-2 sm:px-3"
          aria-label="Deactivate selected items"
        >
          {loadingAction === 'deactivate' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <span className="hidden sm:inline ml-1.5">Deactivate</span>
        </Button>

        {/* Delete */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleDelete}
          disabled={loadingAction !== null}
          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 px-2 sm:px-3"
          aria-label="Delete selected items"
        >
          {loadingAction === 'delete' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          <span className="hidden sm:inline ml-1.5">Delete</span>
        </Button>

        {/* Publish (optional) */}
        {onPublish && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction('publish', onPublish, `${selectedCount} item${selectedCount > 1 ? 's' : ''} published`)}
            disabled={loadingAction !== null}
            className="px-2 sm:px-3 transition-all duration-200"
            style={{
              borderColor: colors.border.accent,
              color: colors.purple.primary,
            }}
            aria-label="Publish selected items"
          >
            {loadingAction === 'publish' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span className="hidden sm:inline ml-1.5">Publish</span>
          </Button>
        )}
      </div>

      {/* Divider - hidden on very small screens */}
      <div
        className="h-5 sm:h-6 w-px hidden xs:block"
        style={{ backgroundColor: colors.border.accent }}
      />

      {/* Clear Selection */}
      <Button
        size="sm"
        variant="ghost"
        onClick={onClearSelection}
        disabled={loadingAction !== null}
        className="hover:text-white px-2 sm:px-3 transition-all duration-200"
        style={{
          color: colors.text.secondary,
        }}
        aria-label="Clear selection"
      >
        <X className="h-4 w-4" />
        <span className="hidden sm:inline ml-1.5">Clear</span>
      </Button>
    </div>
  );
};

export default BulkActionToolbar;
