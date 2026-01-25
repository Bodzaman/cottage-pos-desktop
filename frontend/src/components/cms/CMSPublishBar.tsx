import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Upload, RotateCcw, Globe, Loader2 } from 'lucide-react';
import { useUnpublishedChanges, usePublishAll, useDiscardChanges } from '../../utils/websiteCmsQueries';
import { colors } from '../../utils/InternalDesignSystem';

export function CMSPublishBar() {
  const { data: changes } = useUnpublishedChanges();
  const publishMutation = usePublishAll();
  const discardMutation = useDiscardChanges();

  const totalChanges = changes?.total_count ?? 0;
  const hasChanges = totalChanges > 0;

  return (
    <div className="flex items-center justify-between px-4 py-3 backdrop-blur-md"
      style={{ backgroundColor: 'rgba(26, 26, 26, 0.8)', borderBottom: `1px solid ${colors.border.light}` }}>
      {/* Draft Mode Indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-sm font-medium text-amber-300">Draft Mode</span>
        </div>
        <span className="text-xs text-white/50">
          Viewing unpublished changes. Changes will only be visible to the public after clicking "Publish All".
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {hasChanges && (
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-300 border-amber-500/30">
            {totalChanges} unpublished
          </Badge>
        )}

        {/* Discard Changes */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasChanges || discardMutation.isPending}
              className="text-white/70 hover:text-white"
              style={{ borderColor: colors.border.accent }}
            >
              {discardMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Discard Changes
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent style={{ backgroundColor: colors.background.secondary, border: `1px solid ${colors.border.medium}` }}>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Discard All Changes?</AlertDialogTitle>
              <AlertDialogDescription className="text-white/60">
                This will revert all draft changes back to the last published state.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/20 text-white/70">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => discardMutation.mutate()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Discard All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Publish All */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              disabled={!hasChanges || publishMutation.isPending}
              className="text-white hover:opacity-90"
              style={{ backgroundColor: colors.purple.primary }}
            >
              {publishMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Publish
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent style={{ backgroundColor: colors.background.secondary, border: `1px solid ${colors.border.medium}` }}>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Publish All Changes?</AlertDialogTitle>
              <AlertDialogDescription className="text-white/60">
                This will make all {totalChanges} draft changes live on the public website.
                Visitors will see the updated content immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/20 text-white/70">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => publishMutation.mutate()}
                className="text-white hover:opacity-90"
              style={{ backgroundColor: colors.purple.primary }}
              >
                Publish All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
