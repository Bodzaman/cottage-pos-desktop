import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Grid3X3, CheckCircle2, Users, Clock, XCircle, Link2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { QSAITheme, styles, effects } from '../utils/QSAIDesign';
import { TableStatus, getTableStatusLabel, getTableStatusColor } from '../utils/tableTypes';
import { useRestaurantTables, type RestaurantTable } from '../utils/useRestaurantTables';
import { PosTableResponse, TablesResponse } from 'types';
import { ScrollArea } from '@/components/ui/scroll-area';
import ManagementPasswordDialog from './ManagementPasswordDialog';
import cn from 'classnames';
import { getLinkedTableColor, getLinkedTableBadgeText } from '../utils/linkedTableColors';

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
}

/**
 * DineInTableSelector - ✅ 100% EVENT-DRIVEN ARCHITECTURE (MYA-1595)
 * 
 * Features:
 * - Real-time table status via useRestaurantTables hook
 * - Zero polling - WebSocket subscriptions only
 * - Single source of truth: pos_tables table
 * - QSAI design system integration
 * - Password-protected table reset
 * 
 * Performance: Real-time updates < 500ms latency
 */
const DineInTableSelector = React.memo(function DineInTableSelector({ 
  selectedTable, 
  onTableSelect, 
  tableOrders = {}, 
  className = ''
}: DineInTableSelectorProps) {
  // ============================================================================
  // ✅ EVENT-DRIVEN STATE MANAGEMENT (MYA-1592)
  // ============================================================================
  
  // Real-time subscription to pos_tables (no polling)
  const { 
    tables: restaurantTables,
    loading: isLoading,
    error 
  } = useRestaurantTables();
  
  // Reset functionality state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [tableToReset, setTableToReset] = useState<number | null>(null);
  
  // ============================================================================
  // ✅ TRANSFORM EVENT-DRIVEN DATA TO UI FORMAT
  // ============================================================================
  
  /**
   * Map RestaurantTable (event-driven) to DineInTable (UI format)
   * Status mapping:
   * - VACANT → AVAILABLE (green)
   * - SEATED/DINING/REQUESTING_CHECK/PAYING → SEATED (purple)
   */
  const tables: DineInTable[] = useMemo(() => {
    return restaurantTables.map(table => {
      const tableNumber = parseInt(table.table_number);
      const hasLocalOrders = tableOrders[tableNumber] !== undefined;
      
      // Map event-driven status to TableStatus
      let status: TableStatus;
      if (table.status === 'VACANT' || table.status === 'CLEANING') {
        status = 'AVAILABLE';
      } else if (table.status === 'REQUESTING_CHECK') {
        status = 'BILL_REQUESTED';
      } else if (table.status === 'PAYING') {
        status = 'PAYMENT_PROCESSING';
      } else {
        // SEATED or DINING
        status = 'SEATED';
      }
      
      return {
        tableNumber,
        capacity: table.capacity,
        status,
        lastUpdated: table.updated_at,
        isLinkedTable: table.is_linked_table || false,
        isLinkedPrimary: table.is_linked_primary || false,
        linkedTableGroupId: table.linked_table_group_id || null,
        linkedWithTables: table.linked_with_tables || null,
        hasLocalOrders,
        hasPersistedOrders: status === 'SEATED', // If not AVAILABLE, it's persisted
        actualGuestCount: 0, // TODO: Get from orders table via current_order_id
        guestCount: 0
      };
    });
  }, [restaurantTables, tableOrders]);
  
  // ============================================================================
  // ✅ EVENT-DRIVEN RESET FUNCTIONALITY
  // ============================================================================
  
  const handleResetClick = useCallback((tableNumber: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTableToReset(tableNumber);
    setShowPasswordDialog(true);
  }, []);
  
  const handlePasswordConfirm = useCallback(async () => {
    if (!tableToReset) return;
    
    try {
      // ✅ Call event-driven clear-table endpoint
      const response = await apiClient.clear_table({
        table_number: tableToReset
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(data.message || `Table ${tableToReset} has been cleared successfully`);
        
        // Clear selected table if it was the reset table
        if (selectedTable === tableToReset) {
          onTableSelect(0);
        }
        
        // ✅ Real-time subscription will auto-update UI
        console.log(`✅ Table ${tableToReset} cleared -`, data.orders_cancelled ? `${data.orders_cancelled} order(s) cancelled` : 'no active orders');
      } else {
        throw new Error(data.message || 'Failed to reset table');
      }
      
      setShowPasswordDialog(false);
      setTableToReset(null);
    } catch (error) {
      console.error('Failed to reset table:', error);
      toast.error(`Failed to clear Table ${tableToReset}`);
    }
  }, [tableToReset, selectedTable, onTableSelect]);
  
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
    console.log('🔵 [DineInTableSelector] handleTableSelect wrapper called:', tableNumber);
    
    // Find the table to get its status
    const table = tables.find(t => t.tableNumber === tableNumber);
    console.log('🔵 [DineInTableSelector] Found table:', table);
    
    const tableStatus = table?.status || 'AVAILABLE';
    console.log('🔵 [DineInTableSelector] Calling onTableSelect prop with:', { tableNumber, tableStatus });
    
    onTableSelect(tableNumber, tableStatus);
    
    console.log('🔵 [DineInTableSelector] onTableSelect prop call completed');
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
  if (isLoading) {
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
          gridAutoRows: '80px',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          padding: '8px'
        }}>
          {tables.map((table) => {
            const isSelected = selectedTable === table.tableNumber;
            const isAvailable = table.status === 'AVAILABLE';
            const isSeated = table.status === 'SEATED';
            
            // 🎨 Check for linked table color FIRST (takes priority)
            const linkedColor = getLinkedTableColor(table.linkedTableGroupId);
            
            // Determine styling based on linked status or regular status
            let borderStyle: string;
            let boxShadowStyle: string;
            let backgroundStyle: string;
            
            if (linkedColor) {
              // Linked table gets matching color border/glow
              borderStyle = `2px solid ${linkedColor.border}`;
              boxShadowStyle = `0 0 16px ${linkedColor.glow}, 0 0 24px ${linkedColor.glow}`;
              backgroundStyle = `linear-gradient(135deg, ${linkedColor.background}, ${linkedColor.background})`;
            } else if (isSelected) {
              borderStyle = `2px solid ${QSAITheme.purple.primary}`;
              boxShadowStyle = `0 0 0 1px ${QSAITheme.purple.primary}40, ${effects.outerGlow('medium')}`;
              backgroundStyle = `linear-gradient(135deg, ${QSAITheme.background.card}, ${QSAITheme.purple.primary}15)`;
            } else if (isAvailable) {
              borderStyle = '2px solid rgba(16, 185, 129, 0.4)';
              boxShadowStyle = '0 0 16px rgba(16, 185, 129, 0.3)';
              backgroundStyle = 'linear-gradient(135deg, rgba(16, 185, 129, 0.10), rgba(16, 185, 129, 0.15))';
            } else if (isSeated) {
              borderStyle = '2px solid rgba(124, 93, 250, 0.4)';
              boxShadowStyle = '0 0 16px rgba(124, 93, 250, 0.3)';
              backgroundStyle = 'linear-gradient(135deg, rgba(124, 93, 250, 0.10), rgba(124, 93, 250, 0.15))';
            } else {
              borderStyle = `1px solid ${QSAITheme.border.light}`;
              boxShadowStyle = '0 6px 16px rgba(0, 0, 0, 0.2)';
              backgroundStyle = '#1E1E1E';
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
                {/* 🔗 Linked Table Icon (Minimalist) */}
                {linkedColor && (table.isLinkedPrimary || table.isLinkedTable) && (
                  <div
                    className="absolute top-1 right-1"
                    style={{
                      width: '14px',
                      height: '14px'
                    }}
                  >
                    <Link2 
                      className="w-full h-full" 
                      style={{ color: linkedColor.primary }}
                    />
                  </div>
                )}
                
                {/* Table Number */}
                <div className="text-center mb-0.5">
                  <div 
                    className="text-lg font-bold leading-none"
                    style={{ 
                      color: isAvailable 
                        ? '#10B981'
                        : isSeated
                          ? '#7C5DFA'
                          : QSAITheme.text.primary
                    }}
                  >
                    {table.tableNumber}
                  </div>
                </div>
                
                {/* Status Text */}
                <div className="text-center mb-0.5">
                  <div 
                    className="text-xs font-medium leading-none"
                    style={{ 
                      color: linkedColor
                        ? linkedColor.primary
                        : isAvailable 
                          ? '#10B981'
                          : isSeated
                            ? '#7C5DFA'
                            : QSAITheme.text.primary
                    }}
                  >
                    {linkedColor && (table.isLinkedPrimary || table.isLinkedTable)
                      ? 'Linked Group'
                      : getTableStatusLabel(table.status)
                    }
                  </div>
                </div>
                
                {/* Seat Count */}
                <div className="text-center">
                  <span 
                    className="text-xs font-medium leading-none"
                    style={{ 
                      color: isAvailable 
                        ? '#10B981'
                        : isSeated
                          ? '#7C5DFA'
                          : QSAITheme.text.primary
                    }}
                  >
                    {table.status === 'AVAILABLE' 
                      ? `${table.capacity}`
                      : `${table.actualGuestCount}`
                    }
                  </span>
                </div>
                
                {/* Reset/Unlink Button - Show for occupied tables or linked tables */}
                {(!isAvailable || (table.isLinkedTable || table.isLinkedPrimary)) && (
                  <button
                    className="absolute bottom-1 left-1 p-1 transition-all duration-200 hover:scale-110"
                    style={{
                      background: 'transparent',
                      border: 'none'
                    }}
                    onClick={(e) => handleResetClick(table.tableNumber, e)}
                    title={(table.isLinkedTable || table.isLinkedPrimary) ? `Unlink Table ${table.tableNumber}` : `Clear Table ${table.tableNumber}`}
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
