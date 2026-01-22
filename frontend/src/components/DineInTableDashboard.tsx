/**
 * DineInTableDashboard
 *
 * Centered single-panel table dashboard for Dine-In mode.
 * Replaces the 3-panel layout when DINE-IN order type is selected.
 * Features a summary header and max-width centered grid.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { Loader2, Users, Clock, Armchair } from 'lucide-react';
import { toast } from 'sonner';
import { QSAITheme } from '../utils/QSAIDesign';
import { TableDashboardCard } from './TableDashboardCard';
import ManagementPasswordDialog from './ManagementPasswordDialog';
import { useTableOrdersStore } from '../utils/tableOrdersStore';
import {
  deriveTableCardData,
  DashboardCustomerTab,
  DashboardPersistedOrder,
  TableCardData
} from '../utils/tableDashboardHelpers';
import type { RestaurantTable } from '../utils/useRestaurantTables';
import { buildLinkedGroupColorMap, getLinkedTableColorFromMap } from '../utils/linkedTableColors';

interface DineInTableDashboardProps {
  tables: RestaurantTable[];
  persistedTableOrders: Record<number, DashboardPersistedOrder>;
  customerTabs: DashboardCustomerTab[];
  onTableSelect: (tableNumber: number, tableStatus?: string) => void;
  selectedTableNumber: number | null;
  isLoading?: boolean;
}

/**
 * Loading skeleton for the dashboard
 */
function TableDashboardSkeleton() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-[#121212]">
      <div className="flex flex-col items-center gap-3">
        <Loader2
          className="h-8 w-8 animate-spin"
          style={{ color: QSAITheme.purple?.primary || '#7C5DFA' }}
        />
        <span style={{ color: QSAITheme.text?.secondary || '#A0A0A0' }}>
          Loading tables...
        </span>
      </div>
    </div>
  );
}

/**
 * Empty state when no tables exist
 */
function EmptyTablesState() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-[#121212]">
      <div className="text-center">
        <p
          className="text-lg font-semibold"
          style={{ color: QSAITheme.text?.primary || '#FFFFFF' }}
        >
          No tables configured
        </p>
        <p
          className="text-sm mt-1"
          style={{ color: QSAITheme.text?.muted || '#6B7280' }}
        >
          Add tables in the admin settings to get started
        </p>
      </div>
    </div>
  );
}

/**
 * Floor Summary Header - Shows aggregate metrics
 */
interface FloorSummaryProps {
  enrichedTables: TableCardData[];
}

function FloorSummaryHeader({ enrichedTables }: FloorSummaryProps) {
  const metrics = useMemo(() => {
    const totalTables = enrichedTables.length;
    const seatedTables = enrichedTables.filter(t => t.status !== 'AVAILABLE');
    const seatedCount = seatedTables.length;

    // Sum all guests
    const totalGuests = seatedTables.reduce((sum, t) => sum + (t.guestCount || 0), 0);

    // Calculate average time (parse durationText like "45m" or "1h 23m")
    const durations = seatedTables
      .map(t => {
        if (!t.durationText) return 0;
        const hourMatch = t.durationText.match(/(\d+)h/);
        const minMatch = t.durationText.match(/(\d+)m/);
        const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
        const mins = minMatch ? parseInt(minMatch[1]) : 0;
        return hours * 60 + mins;
      })
      .filter(d => d > 0);

    const avgMinutes = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    return {
      seatedCount,
      totalTables,
      totalGuests,
      avgTime: avgMinutes > 0 ? `${avgMinutes}m` : '-'
    };
  }, [enrichedTables]);

  return (
    <div
      className="flex items-center justify-center gap-8 py-3 px-4 mb-4 rounded-lg"
      style={{
        background: 'rgba(124, 93, 250, 0.08)',
        border: '1px solid rgba(124, 93, 250, 0.2)'
      }}
    >
      {/* Tables Seated */}
      <div className="flex items-center gap-2">
        <Armchair className="h-4 w-4" style={{ color: '#7C5DFA' }} />
        <span className="text-sm" style={{ color: QSAITheme.text?.secondary || '#A0A0A0' }}>
          <span className="font-semibold" style={{ color: '#FFFFFF' }}>
            {metrics.seatedCount}/{metrics.totalTables}
          </span>
          {' '}Tables Seated
        </span>
      </div>

      <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>

      {/* Total Guests */}
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4" style={{ color: '#10B981' }} />
        <span className="text-sm" style={{ color: QSAITheme.text?.secondary || '#A0A0A0' }}>
          <span className="font-semibold" style={{ color: '#FFFFFF' }}>
            {metrics.totalGuests}
          </span>
          {' '}Guests
        </span>
      </div>

      <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>

      {/* Average Time */}
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" style={{ color: '#F59E0B' }} />
        <span className="text-sm" style={{ color: QSAITheme.text?.secondary || '#A0A0A0' }}>
          Avg:{' '}
          <span className="font-semibold" style={{ color: '#FFFFFF' }}>
            {metrics.avgTime}
          </span>
        </span>
      </div>
    </div>
  );
}

/**
 * DineInTableDashboard - Main dashboard component
 */
export function DineInTableDashboard({
  tables,
  persistedTableOrders,
  customerTabs,
  onTableSelect,
  selectedTableNumber,
  isLoading = false
}: DineInTableDashboardProps) {
  // State for table reset with password verification
  const [tableToReset, setTableToReset] = useState<number | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  // Get completeTableOrder from store
  const { completeTableOrder } = useTableOrdersStore();

  // Derive enriched table data for all tables
  const enrichedTables = useMemo(() => {
    return tables
      .map(table => deriveTableCardData(table, persistedTableOrders, customerTabs))
      .sort((a, b) => a.tableNumber - b.tableNumber);
  }, [tables, persistedTableOrders, customerTabs]);

  // Build color map for linked table groups (dynamic sequential assignment)
  const linkedGroupColorMap = useMemo(() => {
    return buildLinkedGroupColorMap(tables);
  }, [tables]);

  // Handle reset button click - opens password dialog
  const handleResetClick = useCallback((tableNumber: number) => {
    setTableToReset(tableNumber);
    setShowPasswordDialog(true);
  }, []);

  // Handle successful password verification - reset the table
  const handlePasswordConfirm = useCallback(async () => {
    if (!tableToReset) return;

    try {
      await completeTableOrder(tableToReset);
      toast.success(`Table ${tableToReset} has been cleared successfully`);

      // Clear selection if the reset table was selected
      if (selectedTableNumber === tableToReset) {
        onTableSelect(0);
      }
    } catch (error) {
      console.error('Failed to reset table:', error);
      toast.error(`Failed to clear Table ${tableToReset}`);
    }

    // Reset dialog state
    setShowPasswordDialog(false);
    setTableToReset(null);
  }, [tableToReset, completeTableOrder, selectedTableNumber, onTableSelect]);

  // Handle dialog close
  const handleDialogClose = useCallback(() => {
    setShowPasswordDialog(false);
    setTableToReset(null);
  }, []);

  // Handle loading state
  if (isLoading) {
    return <TableDashboardSkeleton />;
  }

  // Handle empty state
  if (tables.length === 0) {
    return <EmptyTablesState />;
  }

  return (
    <div
      className="h-full w-full overflow-hidden flex justify-center"
      style={{
        background: '#121212',
        borderRadius: '8px'
      }}
    >
      {/* Centered Container with Max Width */}
      <div className="w-full max-w-[1400px] h-full flex flex-col px-6 py-4">
        {/* Floor Summary Header */}
        <FloorSummaryHeader enrichedTables={enrichedTables} />

        {/* Scrollable Grid Container */}
        <div
          className="flex-1 overflow-auto"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(124, 93, 250, 0.3) transparent'
          }}
        >
          {/* Responsive Grid - Compact cards for minimal scrolling */}
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gridAutoRows: '140px'
            }}
          >
            {enrichedTables.map(tableData => (
              <TableDashboardCard
                key={tableData.tableNumber}
                data={tableData}
                isSelected={selectedTableNumber === tableData.tableNumber}
                onClick={() => onTableSelect(tableData.tableNumber, tableData.status)}
                onResetClick={handleResetClick}
                linkedColor={getLinkedTableColorFromMap(tableData.linkedTableGroupId, linkedGroupColorMap)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Management Password Dialog for table reset */}
      <ManagementPasswordDialog
        isOpen={showPasswordDialog}
        onClose={handleDialogClose}
        onAuthenticated={handlePasswordConfirm}
      />
    </div>
  );
}

export default DineInTableDashboard;
