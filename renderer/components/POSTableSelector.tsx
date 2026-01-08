import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Grid3X3, CheckCircle2, Users, Clock, XCircle, Link2, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { styles, effects, QSAITheme } from '../utils/QSAIDesign';
import { TableStatus, getTableStatusLabel, getTableStatusColor } from '../utils/tableTypes';
import { useTableOrdersStore } from '../utils/tableOrdersStore';
import ManagementPasswordDialog from './ManagementPasswordDialog';

// Use the styling from QSAIDesign
const { glassCard, purpleAccentGradient } = styles;

interface Props {
  selectedTable: number | null;
  onTableSelect: (tableNumber: number) => void;
  className?: string;
  // Local table orders state from POSDesktop to show seated status
  tableOrders?: Record<number, any[]>;
}

// Table interface to match the pos_tables API response
interface PosTable {
  table_number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'unavailable';
  last_updated: string;
}

// Mapped table interface for POS system
interface MappedTable {
  table_number: number;
  capacity: number;
  status: TableStatus;
  last_updated: string;
  isLinkedTable: boolean;
  isLinkedPrimary: boolean;
}

export function POSTableSelector({ selectedTable, onTableSelect, tableOrders = {}, className = '' }: Props) {
  const [tables, setTables] = useState<MappedTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [tableToReset, setTableToReset] = useState<number | null>(null);
  
  // Access table orders store for persistent table status
  const tableOrdersStore = useTableOrdersStore();
  const { persistedTableOrders } = tableOrdersStore;

  // Fetch tables from API
  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get_tables();
      const data = await response.json();
      
      if (data.success && Array.isArray(data.tables)) {
        // Map API statuses to POS system enum values
        const mappedTables = data.tables.map((table: any) => ({
          ...table,
          status: mapApiStatusToPosStatus(table.status, table.table_number),
          isLinkedTable: table.is_linked_table,
          isLinkedPrimary: table.is_linked_primary
        }));
        
        setTables(mappedTables);
      } else {
        throw new Error(data.message || 'Failed to fetch tables');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tables';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Get status badge styling using POS system colors
  const getStatusStyle = (status: TableStatus) => {
    const statusColor = getTableStatusColor(status, false);
    const statusLabel = getTableStatusLabel(status);
    
    return {
      statusColor,
      statusLabel
    };
  };

  useEffect(() => {
    fetchTables();
  }, []); // Keep empty dependencies to prevent infinite calls
  
  // Handle status mapping during render - use useMemo to prevent recreation on every render
  const tablesWithLocalStatus = useMemo(() => {
    return tables.map(table => {
      // Direct status mapping to avoid callback dependency issues
      const hasPersistedOrder = persistedTableOrders[table.table_number] !== undefined;
      const hasLocalOrders = tableOrders[table.table_number] !== undefined;
      
      let mappedStatus: TableStatus;
      if (hasPersistedOrder || hasLocalOrders) {
        mappedStatus = 'SEATED';
      } else {
        switch (table.status.toLowerCase()) {
          case 'available':
            mappedStatus = 'AVAILABLE';
            break;
          case 'occupied':
            mappedStatus = 'SEATED';
            break;
          case 'reserved':
            mappedStatus = 'SEATED';
            break;
          case 'unavailable':
            mappedStatus = 'AVAILABLE';
            break;
          default:
            mappedStatus = 'AVAILABLE';
        }
      }
      
      return {
        ...table,
        status: mappedStatus
      };
    });
  }, [tables, persistedTableOrders, tableOrders]);

  // Handle table reset with password protection
  const handleTableReset = (tableNumber: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent table selection
    setTableToReset(tableNumber);
    setShowPasswordDialog(true);
  };

  // Execute table reset after password verification
  const executeTableReset = async () => {
    if (!tableToReset) return;

    try {
      // Use the table orders store's complete method which handles backend call and state cleanup
      const success = await tableOrdersStore.completeTableOrder(tableToReset);

      if (success) {
        toast.success(`Table ${tableToReset} has been reset to available`);
        
        // Refresh tables list to reflect status change
        await fetchTables();
        
        // Clear selection if the reset table was selected
        if (selectedTable === tableToReset) {
          onTableSelect(null);
        }
      } else {
        toast.error(`Failed to reset table ${tableToReset}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to reset table ${tableToReset}`;
      toast.error(errorMessage);
    } finally {
      setTableToReset(null);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Password Dialog */}
      <ManagementPasswordDialog
        isOpen={showPasswordDialog}
        onClose={() => {
          setShowPasswordDialog(false);
          setTableToReset(null);
        }}
        onAuthenticated={executeTableReset}
      />

      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 space-y-6">
          <div className="relative">
            <div 
              className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-transparent"
              style={{
                borderTopColor: '#7c5dfa',
                borderRightColor: 'rgba(124, 93, 250, 0.3)',
                borderBottomColor: 'rgba(124, 93, 250, 0.1)'
              }}
            ></div>
          </div>
          <p className="text-sm opacity-60 font-medium">Loading tables...</p>
        </div>
      ) : error ? (
        <div 
          className="text-center p-8 rounded-xl border backdrop-blur-sm"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            color: '#ef4444'
          }}
        >
          <XCircle className="h-16 w-16 mx-auto mb-4 opacity-60" />
          <p className="font-medium mb-3 text-lg">{error}</p>
          <button 
            onClick={fetchTables}
            className="px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105 font-medium"
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#ef4444'
            }}
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="h-[calc(100vh-24rem)] overflow-y-auto">
          <div className="grid grid-cols-4 gap-2">
            {tablesWithLocalStatus.map((table) => {
              const statusStyle = getStatusStyle(table.status);
              const isSelected = selectedTable === table.table_number;
              const isSeated = table.status === 'SEATED' || persistedTableOrders[table.table_number] !== undefined;
            
              return (
                <div key={table.table_number} className="relative">
                  <button
                    onClick={() => {
                      console.log('🔥 Table clicked:', table.table_number, 'status:', table.status);
                      console.log('🔥 Calling onTableSelect with:', table.table_number);
                      onTableSelect(table.table_number);
                    }}
                    className={`relative p-2 rounded-lg border transition-all duration-200 text-xs hover:scale-105 w-full ${
                      isSelected 
                        ? 'border-purple-400 bg-purple-500/20 text-purple-300 shadow-lg' 
                        : table.status === "AVAILABLE"
                          ? 'border-green-600/50 bg-green-600/10 text-green-400 hover:bg-green-600/20 hover:border-green-500'
                          : 'border-purple-600/50 bg-purple-600/10 text-purple-400 hover:bg-purple-600/20 hover:border-purple-500'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-medium">T{table.table_number}</div>
                      <div className="text-[10px] mt-1">
                        {statusStyle.statusLabel}
                      </div>
                      <div className="text-[9px] text-gray-400">
                        {table.capacity} seats
                      </div>
                    </div>
                    
                    {/* Clear/Reset button for seated tables */}
                    {isSeated && (
                      <button
                        onClick={(e) => handleTableReset(table.table_number, e)}
                        className="absolute top-1 right-1 p-1 rounded-full transition-all duration-200 hover:scale-110 group"
                        style={{
                          background: `linear-gradient(135deg, rgba(239, 68, 68, 0.8) 0%, rgba(220, 38, 38, 0.9) 100%)`,
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                        }}
                        title="Clear/Reset Table (Management Password Required)"
                      >
                        <RotateCcw className="h-3 w-3 text-white group-hover:rotate-180 transition-transform duration-300" />
                      </button>
                    )}
                    
                    {/* Visual connection lines for linked tables */}
                    {table.isLinkedTable && (
                      <>
                        {/* Dotted connector line */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div 
                            className="absolute top-1/2 left-full w-6 h-0.5 transform -translate-y-1/2"
                            style={{
                              background: `repeating-linear-gradient(
                                90deg,
                                ${QSAITheme.purple.primary} 0%,
                                ${QSAITheme.purple.primary} 40%,
                                transparent 40%,
                                transparent 60%
                              )`,
                              boxShadow: `0 0 6px ${QSAITheme.purple.glow}`,
                              opacity: 0.8
                            }}
                          />
                        
                          {/* Connector dots at ends */}
                          <div 
                            className="absolute top-1/2 left-full w-2 h-2 rounded-full transform -translate-y-1/2 -translate-x-1"
                            style={{
                              background: QSAITheme.purple.primary,
                              boxShadow: `0 0 4px ${QSAITheme.purple.glow}`
                            }}
                          />
                        </div>
                        
                        {/* Link icon overlay */}
                        <div className="absolute top-1 right-1">
                          <div 
                            className="w-5 h-5 rounded-full flex items-center justify-center" 
                            style={{
                              background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`,
                              boxShadow: `0 2px 4px rgba(0,0,0,0.3), 0 0 8px ${QSAITheme.purple.glow}`,
                              border: '1px solid rgba(255,255,255,0.2)'
                            }}
                          >
                            <Link2 className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      </>
                    )}
                    
                    {/* Primary table indicator for linked groups */}
                    {table.isLinkedPrimary && (
                      <div className="absolute bottom-1 left-1 flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md" style={{
                        background: `linear-gradient(135deg, ${QSAITheme.accent.gold}20 0%, ${QSAITheme.accent.gold}30 100%)`,
                        color: QSAITheme.accent.gold,
                        border: `1px solid ${QSAITheme.accent.gold}60`,
                        boxShadow: `0 2px 4px rgba(0,0,0,0.2), 0 0 6px ${QSAITheme.accent.gold}30`
                      }}>
                        <Link2 className="h-3 w-3" />
                        <span>PRIMARY</span>
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
