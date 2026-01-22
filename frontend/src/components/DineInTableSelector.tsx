import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Grid3X3, CheckCircle2, Users, Clock, XCircle, Link2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import brain from 'brain';
import { QSAITheme, styles, effects } from '../utils/QSAIDesign';
import { TableStatus, getTableStatusLabel, getTableStatusColor } from '../utils/tableTypes';
import { getLinkedTableColor } from '../utils/linkedTableColors';
import { useTableOrdersStore } from '../utils/tableOrdersStore';
import { useTableConfigStore } from '../utils/tableConfigStore';
import { PosTableResponse, TablesResponse } from 'types';
import { ScrollArea } from '@/components/ui/scroll-area';
import ManagementPasswordDialog from './ManagementPasswordDialog';
import cn from 'classnames';
import type { RestaurantTable } from '../utils/useRestaurantTables';

/**
 * Clean architecture interfaces for DineInTableSelector
 */
interface DineInTable {
  tableNumber: number;
  capacity: number;
  status: TableStatus;
  lastUpdated: string;
  isLinkedTable: boolean;
  isLinkedPrimary: boolean;
  linkedTableGroupId: string | null;
  linkedWithTables: number[] | null;
  hasLocalOrders: boolean;
  hasPersistedOrders: boolean;
  // NEW: Actual guest count from active orders
  actualGuestCount: number;
  guestCount: number; // Alias for backward compatibility
}

interface DineInTableSelectorProps {
  selectedTable: number | null;
  onTableSelect: (tableNumber: number, tableStatus?: string) => void;
  className?: string;
  // Local table orders state from POSDesktop to show seated status
  tableOrders?: Record<number, any[]>;
  isLoading?: boolean; // ✅ NEW: Loading state
  // ✅ NEW: Optional tables from event-driven architecture (DINE-IN mode)
  tables?: RestaurantTable[];
}

/**
 * DineInTableSelector - Clean architecture implementation for dine-in mode
 * 
 * Features:
 * - Reactive state management via table orders store subscription
 * - QSAI design system integration
 * - Table linking visual indicators
 * - Guest count management
 * - Real-time status updates
 * - Password-protected table reset
 * 
 * Performance: Uses reactive store pattern for instant rendering (< 200ms first paint)
 * PERFORMANCE: Memoized to prevent re-renders when props unchanged
 */
const DineInTableSelector = React.memo(function DineInTableSelector({ 
  selectedTable, 
  onTableSelect, 
  tableOrders = {}, 
  className = '', 
  isLoading = false,
  tables: externalTables // NEW: Accept tables from parent (event-driven)
}: DineInTableSelectorProps) {
  // ============================================================================
  // REACTIVE STATE MANAGEMENT
  // ============================================================================
  
  // Access table orders store for reactive state
  const { 
    persistedTableOrders, 
    completeTableOrder,
    isLoading: storeLoading,
    forceRefresh 
  } = useTableOrdersStore();
  
  // ✅ CONDITIONAL: Use table config store only if external tables not provided
  const { 
    tables: tableConfig,
    isLoading: configLoading,
    error 
  } = useTableConfigStore();
  
  // Reset functionality state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [tableToReset, setTableToReset] = useState<number | null>(null);
  
  // Combine external loading state with internal fetch loading
  const showLoading = isLoading || (externalTables ? false : configLoading);
  
  // ============================================================================
  // REACTIVE TABLE CALCULATION
  // ============================================================================
  
  /**
   * Calculate dynamic table state from store subscription
   * This replaces the previous fetchTables() approach with reactive updates
   * 
   * NEW: If externalTables provided (event-driven mode), transform to DineInTable format
   * Otherwise, use legacy tableConfig from store
   */
  const tables: DineInTable[] = React.useMemo(() => {
    // ✅ NEW: Event-driven mode - use external tables from hook
    if (externalTables && externalTables.length > 0) {
      return externalTables.map(table => {
        const tableNumber = parseInt(table.table_number);
        const hasLocalOrders = tableOrders[tableNumber] !== undefined;
        const hasPersistedOrders = persistedTableOrders[tableNumber] !== undefined;
        
        // Get actual guest count from persisted orders (fallback to 0)
        const persistedOrder = persistedTableOrders[tableNumber];
        const actualGuestCount = persistedOrder?.guest_count || 0;
        
        // Map RestaurantTable status to TableStatus (CORRECT ORDER - match Electron version)
        // Check for VACANT/CLEANING first, default to SEATED for occupied tables
        let status: TableStatus;
        if (table.status === 'VACANT' || table.status === 'CLEANING') {
          status = 'AVAILABLE';
        } else if (table.status === 'REQUESTING_CHECK') {
          status = 'BILL_REQUESTED';
        } else if (table.status === 'PAYING') {
          status = 'PAYMENT_PROCESSING';
        } else {
          // SEATED, DINING, or any other status = occupied
          status = 'SEATED';
        }

        return {
          tableNumber,
          capacity: table.capacity,
          status,
          lastUpdated: table.updated_at || new Date().toISOString(),
          isLinkedTable: table.is_linked_table || false,
          isLinkedPrimary: table.is_linked_primary || false,
          linkedTableGroupId: table.linked_table_group_id || null,
          linkedWithTables: table.linked_with_tables || null,
          hasLocalOrders,
          hasPersistedOrders,
          actualGuestCount,
          guestCount: actualGuestCount
        };
      });
    }

    // ✅ FALLBACK: Legacy mode - use tableConfig from store
    return tableConfig.map(config => {
      const hasLocalOrders = tableOrders[config.table_number] !== undefined;
      const hasPersistedOrders = persistedTableOrders[config.table_number] !== undefined;

      // Get actual guest count from persisted orders
      const persistedOrder = persistedTableOrders[config.table_number];
      const actualGuestCount = persistedOrder?.guest_count || 0;

      // Calculate reactive status based on store state
      let status: TableStatus;
      if (hasPersistedOrders || hasLocalOrders) {
        status = 'SEATED';
      } else {
        status = 'AVAILABLE';
      }

      return {
        tableNumber: config.table_number,
        capacity: config.capacity,
        status,
        lastUpdated: persistedOrder?.updated_at || new Date().toISOString(),
        isLinkedTable: config.is_linked_table || false,
        isLinkedPrimary: config.is_linked_primary || false,
        linkedTableGroupId: config.linked_table_group_id || null,
        linkedWithTables: config.linked_with_tables || null,
        hasLocalOrders,
        hasPersistedOrders,
        actualGuestCount,
        guestCount: actualGuestCount
      };
    });
  }, [tableConfig, tableOrders, persistedTableOrders, externalTables]);
  
  // ============================================================================
  // RESET FUNCTIONALITY 
  // ============================================================================
  
  const handleResetClick = useCallback((tableNumber: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent table selection
    setTableToReset(tableNumber);
    setShowPasswordDialog(true);
  }, []);
  
  const handlePasswordConfirm = useCallback(async () => {
    if (!tableToReset) return;
    
    try {
      await completeTableOrder(tableToReset);
      toast.success(`Table ${tableToReset} has been cleared successfully`);
      
      // Clear selected table if it was the reset table
      if (selectedTable === tableToReset) {
        onTableSelect(0); // Clear selection
      }
      
      // Reset dialog state
      setShowPasswordDialog(false);
      setTableToReset(null);
      
      // No manual fetchTables() call needed - reactive updates handle this!
    } catch (error) {
      console.error('Failed to reset table:', error);
      toast.error(`Failed to clear Table ${tableToReset}`);
    }
  }, [tableToReset, completeTableOrder, selectedTable, onTableSelect]);
  
  const handlePasswordCancel = useCallback(() => {
    setShowPasswordDialog(false);
    setTableToReset(null);
  }, []);
  
  // ============================================================================
  // TABLE INTERACTION HANDLERS
  // ============================================================================
  
  /**
   * Handle table selection
   */
  const handleTableSelect = useCallback((tableNumber: number) => {
    // Find the table to get its status
    const table = tables.find(t => t.tableNumber === tableNumber);
    const tableStatus = table?.status || 'AVAILABLE';
    
    onTableSelect(tableNumber, tableStatus);
  }, [onTableSelect, tables]);
  
  /**
   * Get table status styles
   */
  const getTableStyles = useCallback((table: DineInTable, isSelected: boolean) => {
    const baseStyles = {
      ...styles.glassCard,
      border: `1px solid ${QSAITheme.border.light}`,
      transition: 'all 0.2s ease',
      cursor: 'pointer'
    };
    
    if (isSelected) {
      return {
        ...baseStyles,
        border: `2px solid ${QSAITheme.purple.primary}`,
        boxShadow: `0 0 0 1px ${QSAITheme.purple.primary}40, ${effects.outerGlow('medium')}`,
        background: `linear-gradient(135deg, ${QSAITheme.background.card}, ${QSAITheme.purple.primary}15)`
      };
    }
    
    // Status-based styling
    if (table.status === 'AVAILABLE') {
      return {
        ...baseStyles,
        border: `1px solid ${QSAITheme.border.medium}`,
        '&:hover': {
          border: `1px solid ${QSAITheme.purple.light}40`,
          transform: 'translateY(-1px)',
          boxShadow: effects.outerGlow('subtle')
        }
      };
    }
    
    // Seated/occupied tables
    return {
      ...baseStyles,
      border: `1px solid ${QSAITheme.purple.primary}30`,
      background: `linear-gradient(135deg, ${QSAITheme.background.card}, ${QSAITheme.purple.primary}08)`,
      '&:hover': {
        border: `1px solid ${QSAITheme.purple.primary}50`,
        transform: 'translateY(-1px)'
      }
    };
  }, []);
  
  /**
   * Get status icon
   */
  const getStatusIcon = useCallback((table: DineInTable) => {
    const iconProps = { className: "h-4 w-4" };
    
    switch (table.status) {
      case 'AVAILABLE':
        return <CheckCircle2 {...iconProps} style={{ color: QSAITheme.status.success }} />;
      case 'SEATED':
      case 'ORDERED':
        return <Users {...iconProps} style={{ color: QSAITheme.purple.primary }} />;
      case 'BILL_REQUESTED':
      case 'PAYMENT_PROCESSING':
        return <Clock {...iconProps} style={{ color: QSAITheme.accent.gold }} />;
      case 'LINKED':
        return <Link2 {...iconProps} style={{ color: QSAITheme.accent.turquoise }} />;
      default:
        return <XCircle {...iconProps} style={{ color: QSAITheme.text.muted }} />;
    }
  }, []);
  
  /**
   * Get linking indicator
   */
  const getLinkingIndicator = useCallback((table: DineInTable) => {
    if (!table.isLinkedTable && !table.isLinkedPrimary) return null;
    
    return (
      <div className="absolute top-1 right-1">
        <Badge 
          variant="secondary" 
          className="text-xs px-1 py-0.5"
          style={{
            background: QSAITheme.accent.turquoise + '20',
            color: QSAITheme.accent.turquoise,
            border: `1px solid ${QSAITheme.accent.turquoise}40`
          }}
        >
          <Link2 className="h-3 w-3" />
          {table.isLinkedPrimary ? 'P' : 'L'}
        </Badge>
      </div>
    );
  }, []);
  
  // ============================================================================
  // REACTIVE UI UPDATE LOG
  // ============================================================================
  
  // Show loading skeleton
  if (showLoading) {
    return (
      <div className={cn("grid grid-cols-3 gap-3 p-4", className)}>
        {Array.from({ length: 9 }, (_, i) => (
          <div
            key={`skeleton-table-${i}`}
            className="h-20 rounded-lg animate-pulse"
            style={{ background: 'rgba(124, 93, 250, 0.1)' }}
          />
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div 
          className="flex items-center justify-center py-12 rounded-lg"
          style={{
            ...styles.glassCard,
            border: `1px solid ${QSAITheme.status.error}40`
          }}
        >
          <div className="flex items-center space-x-3">
            <XCircle className="h-8 w-8" style={{ color: QSAITheme.status.error }} />
            <div>
              <p style={{ color: QSAITheme.text.primary }}>Failed to load tables</p>
              <p style={{ color: QSAITheme.text.muted }} className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Tables Grid - 4 columns, no duplicate header */}
      <ScrollArea className="h-full flex-1">
        <div className="grid grid-cols-3 gap-2 p-2" style={{
          // Perfect 3-column layout - guaranteed fit for container width
          // Container height ~600px, with 80px cards = 7 rows + gaps/padding
          // 3 columns × 7 rows = 21 tables visible without scrolling
          // Each card gets ~90px width for excellent proportions and readability
          gridAutoRows: '80px', // Fixed 80px height for consistent, compact cards
          gridTemplateColumns: 'repeat(3, 1fr)', // 3 equal width columns - perfect fit
          gap: '8px', // Reduced gap for tighter layout
          padding: '8px' // Minimal padding
        }}>
          {tables.map((table) => {
            const isSelected = selectedTable === table.tableNumber;
            const isAvailable = table.status === 'AVAILABLE';
            const isSeated = table.status === 'SEATED';

            // Check for linked table color FIRST (takes priority over status styling)
            const linkedColor = getLinkedTableColor(table.linkedTableGroupId);
            const isLinked = table.isLinkedTable || table.isLinkedPrimary;

            // Determine styling based on linked status or regular status
            let borderStyle: string;
            let boxShadowStyle: string;
            let backgroundStyle: string;
            let textColor: string;

            if (linkedColor && isLinked) {
              // LINKED TABLE TAKES PRIORITY - use linked color scheme
              borderStyle = `2px solid ${linkedColor.border}`;
              boxShadowStyle = `0 0 16px ${linkedColor.glow}, 0 0 24px ${linkedColor.glow}`;
              backgroundStyle = `linear-gradient(135deg, ${linkedColor.background}, ${linkedColor.background})`;
              textColor = linkedColor.primary;
            } else if (isSelected) {
              borderStyle = `2px solid ${QSAITheme.purple.primary}`;
              boxShadowStyle = `0 0 0 1px ${QSAITheme.purple.primary}40, ${effects.outerGlow('medium')}`;
              backgroundStyle = `linear-gradient(135deg, ${QSAITheme.background.card}, ${QSAITheme.purple.primary}15)`;
              textColor = QSAITheme.purple.primary;
            } else if (isAvailable) {
              borderStyle = '2px solid rgba(16, 185, 129, 0.4)';
              boxShadowStyle = '0 0 16px rgba(16, 185, 129, 0.3)';
              backgroundStyle = 'linear-gradient(135deg, rgba(16, 185, 129, 0.10), rgba(16, 185, 129, 0.15))';
              textColor = '#10B981';
            } else if (isSeated) {
              borderStyle = '2px solid rgba(124, 93, 250, 0.4)';
              boxShadowStyle = '0 0 16px rgba(124, 93, 250, 0.3)';
              backgroundStyle = 'linear-gradient(135deg, rgba(124, 93, 250, 0.10), rgba(124, 93, 250, 0.15))';
              textColor = '#7C5DFA';
            } else {
              borderStyle = `1px solid ${QSAITheme.border.light}`;
              boxShadowStyle = '0 6px 16px rgba(0, 0, 0, 0.2)';
              backgroundStyle = '#1E1E1E';
              textColor = QSAITheme.text.primary;
            }

            return (
              <div
                key={table.tableNumber}
                className="relative cursor-pointer transition-all duration-200 hover:scale-105 p-2 rounded-lg flex flex-col justify-center"
                style={{
                  backdropFilter: 'blur(4px)',
                  height: '80px',
                  minHeight: '80px',
                  maxHeight: '80px',
                  border: borderStyle,
                  boxShadow: boxShadowStyle,
                  background: backgroundStyle
                }}
                onClick={() => handleTableSelect(table.tableNumber)}
              >
                {/* Linked Table Icon - Show on linked tables */}
                {linkedColor && isLinked && (
                  <div
                    className="absolute top-1 right-1"
                    style={{ width: '14px', height: '14px' }}
                  >
                    <Link2 className="w-full h-full" style={{ color: linkedColor.primary }} />
                  </div>
                )}

                {/* Table Number */}
                <div className="text-center mb-0.5">
                  <div
                    className="text-lg font-bold leading-none"
                    style={{ color: textColor }}
                  >
                    {table.tableNumber}
                  </div>
                </div>

                {/* Status Text - Show "Linked" for linked tables */}
                <div className="text-center mb-0.5">
                  <div
                    className="text-xs font-medium leading-none"
                    style={{ color: textColor }}
                  >
                    {linkedColor && isLinked
                      ? 'Linked'
                      : getTableStatusLabel(table.status)
                    }
                  </div>
                </div>

                {/* Seat Count */}
                <div className="text-center">
                  <span
                    className="text-xs font-medium leading-none"
                    style={{ color: textColor }}
                  >
                    {table.status === 'AVAILABLE'
                      ? `${table.capacity}`
                      : `${table.actualGuestCount}`
                    }
                  </span>
                </div>

                {/* Reset Button - Show for seated tables OR linked tables */}
                {(isSeated || isLinked) && (
                  <button
                    className="absolute bottom-1 left-1 p-1 transition-all duration-200 hover:scale-110"
                    style={{
                      background: 'transparent',
                      border: 'none'
                    }}
                    onClick={(e) => handleResetClick(table.tableNumber, e)}
                    title={isLinked ? `Unlink Table ${table.tableNumber}` : `Clear Table ${table.tableNumber}`}
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      
      {/* Password Dialog for Table Reset */}
      <ManagementPasswordDialog
        isOpen={showPasswordDialog}
        onClose={handlePasswordCancel}
        onAuthenticated={handlePasswordConfirm}
      />
    </div>
  );
});

export { DineInTableSelector };
export default DineInTableSelector;
