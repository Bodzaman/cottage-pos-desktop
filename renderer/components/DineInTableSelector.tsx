import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Grid3X3, CheckCircle2, Users, Clock, XCircle, Link2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import brain from 'brain';
import { QSAITheme, styles, effects } from '../utils/QSAIDesign';
import { TableStatus, getTableStatusLabel, getTableStatusColor } from '../utils/tableTypes';
import { useTableOrdersStore } from '../utils/tableOrdersStore';
import { useTableConfigStore } from '../utils/tableConfigStore';
import { PosTableResponse, TablesResponse } from 'types';
import { ScrollArea } from '@/components/ui/scroll-area';
import ManagementPasswordDialog from './ManagementPasswordDialog';
import cn from 'classnames';

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
  isLoading = false
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
  
  // ✅ NEW: Access table config store (replaces network fetch)
  const { 
    tables: tableConfig,
    isLoading: configLoading,
    error 
  } = useTableConfigStore();
  
  // Reset functionality state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [tableToReset, setTableToReset] = useState<number | null>(null);
  
  // Combine external loading state with internal fetch loading
  const showLoading = isLoading || configLoading;
  
  // ============================================================================
  // REACTIVE TABLE CALCULATION
  // ============================================================================
  
  /**
   * Calculate dynamic table state from store subscription
   * This replaces the previous fetchTables() approach with reactive updates
   */
  const tables: DineInTable[] = React.useMemo(() => {
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
        hasLocalOrders,
        hasPersistedOrders,
        actualGuestCount,
        guestCount: actualGuestCount
      };
    });
  }, [tableConfig, tableOrders, persistedTableOrders]);
  
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
      console.log('✅ Table reset complete - reactive store will update UI automatically');
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
  
  // Debug log to show reactive updates working
  useEffect(() => {
    console.log('🔄 DineInTableSelector reactive update:', {
      persistedTableCount: Object.keys(persistedTableOrders).length,
      localTableCount: Object.keys(tableOrders).length,
      totalTables: tables.length,
      seatedTables: tables.filter(t => t.status === 'SEATED').length
    });
  }, [persistedTableOrders, tableOrders, tables]);

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
            
            return (
              <div
                key={table.tableNumber}
                className="relative cursor-pointer transition-all duration-200 hover:scale-105 p-2 rounded-lg flex flex-col justify-center"
                style={{
                  // Clean card styling without glassCard conflicts
                  backdropFilter: 'blur(4px)',
                  // Fixed height instead of aspect-square
                  height: '80px', // Reduced from 120px for better space efficiency
                  minHeight: '80px', // Ensure minimum height
                  maxHeight: '80px', // Cap maximum height
                  border: isSelected 
                    ? `2px solid ${QSAITheme.purple.primary}`
                    : isAvailable
                      ? '2px solid rgba(16, 185, 129, 0.4)' // ✅ FIXED: Brighter emerald green border for AVAILABLE
                      : isSeated
                        ? '2px solid rgba(124, 93, 250, 0.4)' // ✅ FIXED: Brighter purple border for SEATED
                        : `1px solid ${QSAITheme.border.light}`,
                  boxShadow: isSelected
                    ? `0 0 0 1px ${QSAITheme.purple.primary}40, ${effects.outerGlow('medium')}`
                    : isAvailable
                      ? '0 0 16px rgba(16, 185, 129, 0.3)' // ✅ FIXED: Brighter emerald green glow for AVAILABLE
                      : isSeated
                        ? '0 0 16px rgba(124, 93, 250, 0.3)' // ✅ FIXED: Brighter purple glow for SEATED
                        : '0 6px 16px rgba(0, 0, 0, 0.2)',
                  background: isSelected
                    ? `linear-gradient(135deg, ${QSAITheme.background.card}, ${QSAITheme.purple.primary}15)`
                    : isAvailable
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.10), rgba(16, 185, 129, 0.15))' // ✅ FIXED: Brighter emerald green background for AVAILABLE
                      : isSeated
                        ? 'linear-gradient(135deg, rgba(124, 93, 250, 0.10), rgba(124, 93, 250, 0.15))' // ✅ FIXED: Brighter purple background for SEATED
                        : '#1E1E1E'
                }}
                onClick={() => handleTableSelect(table.tableNumber)}
              >
                {/* Table Number - Smaller but still prominent */}
                <div className="text-center mb-0.5">
                  <div 
                    className="text-lg font-bold leading-none"
                    style={{ 
                      color: isAvailable 
                        ? '#10B981' // ✅ CONFIRMED: Emerald green for AVAILABLE table numbers
                        : isSeated
                          ? '#7C5DFA' // ✅ CONFIRMED: Purple for SEATED table numbers
                          : QSAITheme.text.primary // Default white for other statuses
                    }}
                  >
                    {table.tableNumber}
                  </div>
                </div>
                
                {/* Status Text - Ultra compact */}
                <div className="text-center mb-0.5">
                  <div 
                    className="text-xs font-medium leading-none"
                    style={{ 
                      color: isAvailable 
                        ? '#10B981' // ✅ CONFIRMED: Emerald green for "Available" text
                        : isSeated
                          ? '#7C5DFA' // ✅ CONFIRMED: Purple for "Seated" text
                          : QSAITheme.text.primary // Default white for other statuses
                    }}
                  >
                    {getTableStatusLabel(table.status)}
                  </div>
                </div>
                
                {/* Seat Count - Compact format with smart content */}
                <div className="text-center">
                  <span 
                    className="text-xs font-medium leading-none"
                    style={{ 
                      color: isAvailable 
                        ? '#10B981' // ✅ CONFIRMED: Emerald green for AVAILABLE table seat count
                        : isSeated
                          ? '#7C5DFA' // ✅ CONFIRMED: Purple for SEATED table seat count
                          : QSAITheme.text.primary // Default white for other statuses
                    }}
                  >
                    {table.status === 'AVAILABLE' 
                      ? `${table.capacity}` // Just the number for available tables
                      : `${table.actualGuestCount}` // Just guest count for occupied tables
                    }
                  </span>
                </div>
                
                {/* Reset Button - Only show for seated tables */}
                {isSeated && (
                  <button
                    className="absolute bottom-1 left-1 p-1 transition-all duration-200 hover:scale-110"
                    style={{
                      background: 'transparent',
                      border: 'none'
                    }}
                    onClick={(e) => handleResetClick(table.tableNumber, e)}
                    title={`Clear Table ${table.tableNumber}`}
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
