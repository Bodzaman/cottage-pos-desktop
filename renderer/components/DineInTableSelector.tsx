


import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Grid3X3, CheckCircle2, Users, Clock, XCircle, Link2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import brain from 'brain';
import { QSAITheme, styles, effects } from '../utils/QSAIDesign';
import { TableStatus, getTableStatusLabel, getTableStatusColor } from '../utils/tableTypes';
import { useTableOrdersStore } from '../utils/tableOrdersStore';
import { PosTableResponse, TablesResponse } from 'types';
import { ScrollArea } from '@/components/ui/scroll-area';
import ManagementPasswordDialog from './ManagementPasswordDialog';

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
 */
export function DineInTableSelector({ 
  selectedTable, 
  onTableSelect, 
  tableOrders = {}, 
  className = '' 
}: DineInTableSelectorProps) {
  // ============================================================================
  // REACTIVE STATE MANAGEMENT
  // ============================================================================
  
  // Access table orders store for reactive state
  const { 
    persistedTableOrders, 
    completeTableOrder,
    isLoading,
    forceRefresh 
  } = useTableOrdersStore();
  
  // Reset functionality state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [tableToReset, setTableToReset] = useState<number | null>(null);
  
  // Static table configuration (fetched once on mount)
  const [tableConfig, setTableConfig] = useState<PosTableResponse[]>([]);
  const [configLoading, setConfigLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
  // ONE-TIME TABLE CONFIGURATION LOADING
  // ============================================================================
  
  /**
   * Load static table configuration once on mount
   * This only fetches table structure, not dynamic state
   */
  const loadTableConfiguration = useCallback(async () => {
    try {
      setConfigLoading(true);
      setError(null);
      
      const response = await brain.get_tables();
      const data: TablesResponse = await response.json();
      
      if (data.success && Array.isArray(data.tables)) {
        setTableConfig(data.tables);
      } else {
        setError(data.message || 'Failed to fetch table configuration');
        toast.error('Failed to load table configuration');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch table configuration';
      setError(errorMessage);
      toast.error('Error loading table configuration');
      console.error('Table configuration fetch error:', err);
    } finally {
      setConfigLoading(false);
    }
  }, []);
  
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
  // INITIALIZATION EFFECTS
  // ============================================================================
  
  // Load table configuration once on mount
  useEffect(() => {
    loadTableConfiguration();
  }, [loadTableConfiguration]);
  
  // Initialize table orders store on mount
  useEffect(() => {
    const initializeStore = async () => {
      try {
        await useTableOrdersStore.getState().loadTableOrders();
        console.log('✅ Table orders store initialized');
      } catch (error) {
        console.error('❌ Failed to initialize table orders store:', error);
      }
    };
    
    initializeStore();
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

  if (configLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div 
          className="flex items-center justify-center py-12 rounded-lg"
          style={styles.glassCard}
        >
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" 
                 style={{ borderColor: QSAITheme.purple.primary }} />
            <span style={{ color: QSAITheme.text.secondary }}>Loading tables...</span>
          </div>
        </div>
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
    <div className={`h-full flex flex-col overflow-hidden ${className}`}>
      {/* Tables Grid - 4 columns, no duplicate header */}
      <ScrollArea className="h-full flex-1 overflow-auto">
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
                      ? '2px solid rgba(16, 185, 129, 0.3)' // Emerald green border for available
                      : isSeated
                        ? '2px solid rgba(124, 93, 250, 0.3)' // Purple border for seated
                        : `1px solid ${QSAITheme.border.light}`,
                  boxShadow: isSelected
                    ? `0 0 0 1px ${QSAITheme.purple.primary}40, ${effects.outerGlow('medium')}`
                    : isAvailable
                      ? '0 0 12px rgba(16, 185, 129, 0.25)' // Emerald green glow for available
                      : isSeated
                        ? '0 0 12px rgba(124, 93, 250, 0.25)' // Purple glow for seated
                        : '0 6px 16px rgba(0, 0, 0, 0.2)',
                  background: isSelected
                    ? `linear-gradient(135deg, ${QSAITheme.background.card}, ${QSAITheme.purple.primary}15)`
                    : isAvailable
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.12))' // Emerald green background for available
                      : isSeated
                        ? 'linear-gradient(135deg, rgba(124, 93, 250, 0.08), rgba(124, 93, 250, 0.12))' // Purple background for seated
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
                        ? '#10B981' // Emerald green for available table numbers
                        : isSeated
                          ? '#7C5DFA' // Purple for seated table numbers
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
                        ? '#10B981' // Emerald green for "Available" text
                        : isSeated
                          ? '#7C5DFA' // Purple for "Seated" text
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
                        ? '#10B981' // Emerald green for available table seat count
                        : isSeated
                          ? '#7C5DFA' // Purple for seated table seat count
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
}

export default DineInTableSelector;
