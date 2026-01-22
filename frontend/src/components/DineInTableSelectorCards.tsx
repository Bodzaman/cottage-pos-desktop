



import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, CheckCircle2, Link2, Utensils } from 'lucide-react';
import { toast } from 'sonner';
import { getTables } from '../utils/supabaseQueries';
import { QSAITheme, styles, effects } from '../utils/QSAIDesign';
import { TableStatus, getTableStatusLabel } from '../utils/tableTypes';
import { useTableOrdersStore } from '../utils/tableOrdersStore';
import { PosTableResponse } from 'types';

/**
 * Enhanced table interface for card view
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
  actualGuestCount: number;
  guestCount: number;
}

interface DineInTableSelectorCardsProps {
  selectedTable: number | null;
  onTableSelect: (tableNumber: number) => void;
  className?: string;
  tableOrders?: Record<number, any[]>;
}

/**
 * DineInTableSelectorCards - Visual card-based table selector
 * 
 * Features:
 * - Visual card layout for better UX
 * - Clear status indicators with colors
 * - Guest count vs capacity display
 * - Table linking indicators
 * - QSAI design consistency
 */
export function DineInTableSelectorCards({ 
  selectedTable, 
  onTableSelect, 
  tableOrders = {}, 
  className = '' 
}: DineInTableSelectorCardsProps) {
  // State management
  const [tables, setTables] = useState<DineInTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Access table orders store for persistent status
  const { persistedTableOrders, loadTableOrders } = useTableOrdersStore();
  
  /**
   * Transform API table data to internal DineInTable format
   */
  const transformApiTable = useCallback((apiTable: PosTableResponse): DineInTable => {
    const hasLocalOrders = tableOrders[apiTable.table_number] !== undefined;
    const hasPersistedOrders = persistedTableOrders[apiTable.table_number] !== undefined;
    
    // Get actual guest count from persisted orders
    const persistedOrder = persistedTableOrders[apiTable.table_number];
    const actualGuestCount = persistedOrder?.guest_count || 0;
    
    // Use the actual database status first, then override if we have local orders
    let status: TableStatus;
    if (hasPersistedOrders || hasLocalOrders) {
      status = 'SEATED';
    } else {
      // Map API status to TableStatus
      switch (apiTable.status.toLowerCase()) {
        case 'available':
          status = 'AVAILABLE';
          break;
        case 'occupied':
        case 'seated':
        case 'reserved':
          status = 'SEATED';
          break;
        case 'unavailable':
        default:
          status = 'AVAILABLE';
          break;
      }
    }
    
    return {
      tableNumber: apiTable.table_number,
      capacity: apiTable.capacity,
      status,
      lastUpdated: apiTable.last_updated,
      isLinkedTable: apiTable.is_linked_table,
      isLinkedPrimary: apiTable.is_linked_primary,
      hasLocalOrders,
      hasPersistedOrders,
      actualGuestCount,
      guestCount: actualGuestCount
    };
  }, [tableOrders, persistedTableOrders]);
  
  /**
   * Fetch tables from Supabase (direct query - no backend needed)
   */
  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Direct Supabase query
      const tablesData = await getTables();

      // Transform to PosTableResponse format and then to DineInTable
      const transformedTables = tablesData.map(t => {
        const apiTable: PosTableResponse = {
          table_number: t.table_number,
          capacity: t.capacity,
          status: t.status,
          last_updated: t.last_updated,
          is_linked_table: t.is_linked_table,
          is_linked_primary: t.is_linked_primary,
          guest_count: null
        };
        return transformApiTable(apiTable);
      });

      setTables(transformedTables);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tables';
      setError(errorMessage);
      toast.error('Error loading tables');
      console.error('Table fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [transformApiTable]);
  
  /**
   * Handle table selection
   */
  const handleTableSelect = useCallback((tableNumber: number) => {
    onTableSelect(tableNumber);
  }, [onTableSelect]);
  
  /**
   * Get status color for visual indicators
   */
  const getStatusColor = useCallback((status: TableStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return QSAITheme.status.success;
      case 'SEATED':
      case 'ORDERED':
        return QSAITheme.purple.primary;
      case 'BILL_REQUESTED':
      case 'PAYMENT_PROCESSING':
        return QSAITheme.accent.gold;
      default:
        return QSAITheme.text.muted;
    }
  }, []);
  
  /**
   * Get status icon
   */
  const getStatusIcon = useCallback((status: TableStatus) => {
    const iconProps = { className: "h-5 w-5" };
    
    switch (status) {
      case 'AVAILABLE':
        return <CheckCircle2 {...iconProps} />;
      case 'SEATED':
      case 'ORDERED':
        return <Users {...iconProps} />;
      case 'BILL_REQUESTED':
      case 'PAYMENT_PROCESSING':
        return <Clock {...iconProps} />;
      default:
        return <Utensils {...iconProps} />;
    }
  }, []);
  
  // Effect to load data on mount
  useEffect(() => {
    const loadData = async () => {
      await fetchTables();
    };
    
    loadData();
  }, [fetchTables]);
  
  // Re-transform tables when dependencies change
  useEffect(() => {
    if (tables.length > 0) {
      fetchTables();
    }
  }, [tableOrders, persistedTableOrders, fetchTables]);
  
  if (loading) {
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
          <div className="text-center">
            <p style={{ color: QSAITheme.text.primary }} className="text-lg font-semibold">Failed to load tables</p>
            <p style={{ color: QSAITheme.text.muted }} className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 
          className="text-lg font-semibold mb-2"
          style={{ color: QSAITheme.text.primary }}
        >
          Select Table
        </h3>
        <p 
          className="text-sm"
          style={{ color: QSAITheme.text.muted }}
        >
          Choose a table to take orders for dine-in service
        </p>
      </div>
      
      {/* Cards Grid */}
      <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
        {tables.map((table) => {
          const isSelected = selectedTable === table.tableNumber;
          const isAvailable = table.status === 'AVAILABLE';
          const isSeated = table.status === 'SEATED';
          
          return (
            <Card
              key={table.tableNumber}
              className="relative cursor-pointer transition-all duration-200 hover:scale-105"
              style={{
                ...styles.glassCard,
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
                      : 'none',
                background: isSelected
                  ? `linear-gradient(135deg, ${QSAITheme.background.card}, ${QSAITheme.purple.primary}15)`
                  : isAvailable
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.12))' // Emerald green background for available
                    : isSeated
                      ? 'linear-gradient(135deg, rgba(124, 93, 250, 0.08), rgba(124, 93, 250, 0.12))' // Purple background for seated
                      : QSAITheme.background.card
              }}
              onClick={() => handleTableSelect(table.tableNumber)}
            >
              {/* Linking Indicator */}
              {(table.isLinkedTable || table.isLinkedPrimary) && (
                <div className="absolute top-2 right-2">
                  <Badge 
                    variant="secondary" 
                    className="text-xs px-1.5 py-0.5"
                    style={{
                      background: QSAITheme.accent.turquoise + '20',
                      color: QSAITheme.accent.turquoise,
                      border: `1px solid ${QSAITheme.accent.turquoise}40`
                    }}
                  >
                    <Link2 className="h-3 w-3 mr-1" />
                    {table.isLinkedPrimary ? 'Primary' : 'Linked'}
                  </Badge>
                </div>
              )}
              
              {/* Card Content */}
              <div className="p-4">
                {/* Table Number */}
                <div className="text-center mb-3">
                  <div 
                    className="text-3xl font-bold"
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
                  <div 
                    className="text-xs font-medium"
                    style={{ color: QSAITheme.text.muted }}
                  >
                    TABLE
                  </div>
                </div>
                
                {/* Status Text - Clean design without indicator boxes */}
                <div className="text-center mb-3">
                  <span 
                    className="text-sm font-semibold"
                    style={{ 
                      color: isAvailable 
                        ? '#10B981' // Emerald green for "Available" text
                        : isSeated
                          ? '#7C5DFA' // Purple for "Seated" text
                          : QSAITheme.text.primary // Default white for other statuses
                    }}
                  >
                    {getTableStatusLabel(table.status)}
                  </span>
                </div>
                
                {/* Guest Count */}
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Users className="h-4 w-4" style={{ color: QSAITheme.text.muted }} />
                    <span 
                      className="text-sm font-semibold"
                      style={{ 
                        color: isAvailable 
                          ? '#10B981' // Emerald green for available table guest count
                          : isSeated
                            ? '#7C5DFA' // Purple for seated table guest count
                            : QSAITheme.text.primary // Default white for other statuses
                      }}
                    >
                      {table.status === 'AVAILABLE' 
                        ? `${table.capacity} seats` // Show capacity for available tables
                        : `${table.actualGuestCount}/${table.capacity} guests` // Show actual/capacity for occupied tables
                      }
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default DineInTableSelectorCards;
