/**
 * DineInWorkspaceHeader - Unified header for the Dine-In Order Workspace
 *
 * Displays consistent session identity across all workspace views:
 * - Table number + linked tables badge
 * - Status badge (SEATED/OCCUPIED)
 * - Guest count (editable via modal)
 * - Live session timer (updates every 60s)
 * - Customer tabs pill navigation
 * - "+ Add Customer" button
 * - Notes entrypoint button
 * - Close button
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Users, User, Clock, StickyNote, UserPlus } from 'lucide-react';
import { QSAITheme } from 'utils/QSAIDesign';
import { getTimeOccupied } from 'utils/tableTypes';

/**
 * CustomerTab - Local interface matching Supabase schema (snake_case)
 */
interface CustomerTab {
  id: string;
  table_id?: number;
  tab_name: string;
  status: 'active' | 'paid' | 'closed';
}

interface DineInWorkspaceHeaderProps {
  // Table context
  tableNumber: number | null;
  linkedTables: number[];
  isPrimaryTable: boolean;

  // Order data
  order: {
    id: string;
    created_at: string;
    guest_count?: number;
    notes?: string;
  } | null;

  // Customer tabs
  customerTabs: CustomerTab[];
  activeTabId: string | null;
  onSetActiveTabId: (tabId: string | null) => void;

  // Actions
  onCreateTab: () => void;
  onEditGuestCount: () => void;
  onOpenNotes: () => void;
  onClose: () => void;

  // Staging indicator
  stagingItemCount: number;
}

export function DineInWorkspaceHeader({
  tableNumber,
  linkedTables,
  isPrimaryTable,
  order,
  customerTabs,
  activeTabId,
  onSetActiveTabId,
  onCreateTab,
  onEditGuestCount,
  onOpenNotes,
  onClose,
  stagingItemCount,
}: DineInWorkspaceHeaderProps) {
  // Live session timer state
  const [elapsedTime, setElapsedTime] = useState<string>('');

  // Update timer every 60 seconds
  useEffect(() => {
    if (!order?.created_at) {
      setElapsedTime('');
      return;
    }

    const updateTimer = () => {
      const createdAt = new Date(order.created_at);
      setElapsedTime(getTimeOccupied(createdAt));
    };

    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [order?.created_at]);

  const guestCount = order?.guest_count || customerTabs.length || 1;
  const hasNotes = !!order?.notes;

  return (
    <div
      className="flex flex-col gap-3 px-6 py-4 border-b flex-shrink-0"
      style={{
        background: QSAITheme.background.panel,
        borderColor: QSAITheme.border.light,
      }}
    >
      {/* Row 1: Table Info + Actions */}
      <div className="flex items-center justify-between">
        {/* Left: Table Identity */}
        <div className="flex items-center gap-3">
          {/* Table Number + Linked Tables */}
          <span className="text-2xl font-bold text-white">
            {linkedTables && linkedTables.length > 0
              ? `Table ${tableNumber} + Table ${linkedTables.join(' + Table ')}`
              : `Table ${tableNumber}`
            }
          </span>

          {/* Linked Table Badge */}
          {linkedTables && linkedTables.length > 0 && (
            <Badge
              variant="outline"
              className={isPrimaryTable
                ? "bg-purple-500/20 border-purple-500/40 text-purple-300 text-xs"
                : "bg-blue-500/20 border-blue-500/40 text-blue-300 text-xs"
              }
            >
              {isPrimaryTable ? 'PRIMARY' : `LINKED`}
            </Badge>
          )}

          {/* Status Badge */}
          <Badge
            variant="outline"
            className="bg-green-500/20 border-green-500/40 text-green-300 text-xs"
          >
            OCCUPIED
          </Badge>

          {/* Guest Count - Clickable */}
          <button
            onClick={onEditGuestCount}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-all hover:bg-white/10"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${QSAITheme.border.light}`,
            }}
          >
            <Users className="h-3.5 w-3.5" style={{ color: QSAITheme.text.muted }} />
            <span className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>
              {guestCount} {guestCount === 1 ? 'guest' : 'guests'}
            </span>
          </button>

          {/* Session Timer */}
          {elapsedTime && (
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-md"
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              <Clock className="h-3.5 w-3.5" style={{ color: '#F59E0B' }} />
              <span className="text-sm font-medium" style={{ color: '#F59E0B' }}>
                {elapsedTime}
              </span>
            </div>
          )}

          {/* Staging Indicator */}
          {stagingItemCount > 0 && (
            <Badge variant="secondary" className="bg-yellow-600 text-white">
              {stagingItemCount} unsaved
            </Badge>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Notes Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenNotes}
            className="flex items-center gap-1.5"
            style={{
              height: '36px',
              backgroundColor: hasNotes ? 'rgba(91, 33, 182, 0.2)' : 'transparent',
              borderColor: hasNotes ? QSAITheme.purple.primary : QSAITheme.border.medium,
              color: hasNotes ? QSAITheme.purple.light : QSAITheme.text.muted,
            }}
          >
            <StickyNote className="h-4 w-4" />
            Notes
            {hasNotes && (
              <span className="ml-1 h-2 w-2 rounded-full bg-purple-400" />
            )}
          </Button>

          {/* Close Button */}
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white h-10 w-10 p-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Row 2: Customer Tabs Navigation */}
      <div
        className="flex items-center justify-between px-3"
        style={{
          height: '44px',
          backgroundColor: QSAITheme.background.secondary,
          borderRadius: '8px',
        }}
      >
        {/* Left: Customer Tab Pills */}
        <div className="flex items-center gap-2">
          {/* Table-level pill (always visible) */}
          <Button
            variant={!activeTabId ? "default" : "outline"}
            size="sm"
            onClick={() => onSetActiveTabId(null)}
            className="flex items-center gap-1 px-3"
            style={{
              height: '32px',
              backgroundColor: !activeTabId ? QSAITheme.purple.primary : 'transparent',
              borderColor: !activeTabId ? QSAITheme.purple.primary : QSAITheme.border.medium,
              color: !activeTabId ? 'white' : QSAITheme.text.muted,
              borderRadius: '16px'
            }}
          >
            <Users size={14} />
            All Items
          </Button>

          {/* Customer Tab Pills */}
          {customerTabs
            .filter(tab => tab.status === 'active')
            .map((tab) => {
              const isActive = activeTabId === tab.id;
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSetActiveTabId(tab.id!)}
                  className="flex items-center gap-1 px-3"
                  style={{
                    height: '32px',
                    backgroundColor: isActive ? QSAITheme.purple.primary : 'transparent',
                    borderColor: isActive ? QSAITheme.purple.primary : QSAITheme.border.medium,
                    color: isActive ? 'white' : QSAITheme.text.muted,
                    borderRadius: '16px'
                  }}
                >
                  <User size={14} />
                  {tab.tab_name}
                </Button>
              );
            })}

          {/* Status Text when no tabs */}
          {customerTabs.filter(tab => tab.status === 'active').length === 0 && (
            <span className="text-sm ml-2" style={{ color: QSAITheme.text.muted }}>
              No customer tabs yet
            </span>
          )}
        </div>

        {/* Right: Add Customer Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onCreateTab}
          className="flex items-center gap-1 px-3"
          style={{
            height: '32px',
            backgroundColor: QSAITheme.purple.primary,
            borderColor: QSAITheme.purple.primary,
            color: 'white',
            borderRadius: '16px'
          }}
        >
          <UserPlus size={14} />
          Add Customer
        </Button>
      </div>
    </div>
  );
}

export default DineInWorkspaceHeader;
