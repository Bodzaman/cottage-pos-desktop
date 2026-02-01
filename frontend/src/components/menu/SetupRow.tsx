/**
 * SetupRow Component
 *
 * A single row in the Menu Setup Dashboard representing one setup section.
 * Displays status indicator, counts badge, description, and action buttons.
 *
 * Visual states:
 * - ○ Empty circle (gray) - No items, needs setup
 * - ◐ Half circle (amber) - Some items, but has drafts
 * - ✓ Checkmark (green) - Configured and active
 * - ⚠️ Warning (red) - Prerequisites missing
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight, AlertCircle, Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SetupRowCounts {
  total: number;
  active?: number;
  drafts?: number;
}

export interface SetupRowProps {
  /** Row number for ordering display (1-5) */
  number: number;
  /** Section title (e.g., "Categories", "Menu Items") */
  title: string;
  /** Brief helper text describing the section */
  description: string;
  /** Counts for displaying badges */
  counts: SetupRowCounts;
  /** Whether this section is blocked by missing prerequisites */
  isBlocked?: boolean;
  /** Message to show when blocked */
  blockedMessage?: string;
  /** Callback when "+ Add" button is clicked */
  onAdd: () => void;
  /** Callback when "Manage →" button is clicked */
  onManage: () => void;
  /** Optional loading state */
  isLoading?: boolean;
}

type StatusType = 'empty' | 'has-drafts' | 'configured' | 'blocked';

function getStatus(counts: SetupRowCounts, isBlocked?: boolean): StatusType {
  if (isBlocked) return 'blocked';
  if (counts.total === 0) return 'empty';
  if (counts.drafts && counts.drafts > 0) return 'has-drafts';
  return 'configured';
}

function StatusIndicator({ status }: { status: StatusType }) {
  switch (status) {
    case 'empty':
      return <Circle className="w-4 h-4 text-gray-400" />;
    case 'has-drafts':
      return (
        <div className="w-4 h-4 relative">
          <Circle className="w-4 h-4 text-amber-500 absolute" />
          <div className="w-2 h-4 bg-background absolute left-2" />
        </div>
      );
    case 'configured':
      return <Check className="w-4 h-4 text-green-500" />;
    case 'blocked':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
  }
}

function CountsBadge({ counts, status }: { counts: SetupRowCounts; status: StatusType }) {
  if (status === 'empty') {
    return (
      <span className="text-xs text-red-500 border border-red-200 rounded-full px-2 py-0.5">
        0 items
      </span>
    );
  }

  const parts: string[] = [];

  if (counts.active !== undefined && counts.active > 0) {
    parts.push(`${counts.active} active`);
  } else if (counts.total > 0) {
    parts.push(`${counts.total} items`);
  }

  if (counts.drafts && counts.drafts > 0) {
    parts.push(`${counts.drafts} draft${counts.drafts > 1 ? 's' : ''}`);
  }

  const hasDrafts = counts.drafts && counts.drafts > 0;

  return (
    <span
      className={cn(
        'text-xs rounded-full px-2 py-0.5',
        hasDrafts
          ? 'text-amber-700 bg-amber-100'
          : 'text-green-700 bg-green-100'
      )}
    >
      {parts.join(' · ')}
    </span>
  );
}

export function SetupRow({
  number,
  title,
  description,
  counts,
  isBlocked = false,
  blockedMessage,
  onAdd,
  onManage,
  isLoading = false
}: SetupRowProps) {
  const status = getStatus(counts, isBlocked);

  return (
    <div
      className={cn(
        'border rounded-lg p-4 transition-colors',
        isBlocked ? 'bg-red-50/50 border-red-200' : 'bg-card hover:bg-accent/50'
      )}
    >
      <div className="flex items-center justify-between">
        {/* Left side: Number, Title, Status, Badge */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground w-5">
            {number}.
          </span>
          <span className="font-semibold">{title}</span>
          <StatusIndicator status={status} />
          {!isLoading && <CountsBadge counts={counts} status={status} />}
          {isLoading && (
            <span className="text-xs text-muted-foreground animate-pulse">
              Loading...
            </span>
          )}
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onAdd}
            disabled={isBlocked}
            className="h-8"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onManage}
            disabled={isBlocked}
            className="h-8"
          >
            Manage
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Description row */}
      <div className="mt-1 ml-8 text-sm text-muted-foreground">
        {isBlocked ? (
          <span className="text-red-600">{blockedMessage}</span>
        ) : (
          description
        )}
      </div>
    </div>
  );
}

export default SetupRow;
