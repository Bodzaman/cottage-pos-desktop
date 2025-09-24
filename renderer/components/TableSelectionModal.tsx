



import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Clock, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QSAITheme } from '../utils/QSAIDesign';
import brain from 'brain';
import { PosTableResponse, TablesResponse } from 'types';
import { useTableOrdersStore } from '../utils/tableOrdersStore';

interface TableSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTableSelect: (tableNumber: number) => void;
  selectedTable?: number | null;
}

interface TableData {
  tableNumber: number;
  capacity: number;
  status: 'AVAILABLE' | 'SEATED' | 'RESERVED';
  guestCount: number;
  hasOrders: boolean;
}

/**
 * TableSelectionModal - Modal for selecting tables in DINE-IN orders
 * Reuses existing table selector logic but in modal format
 * Styled with QSAI design system for consistency
 */
export function TableSelectionModal({
  isOpen,
  onClose,
  onTableSelect,
  selectedTable
}: TableSelectionModalProps) {
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Access persisted table orders for status checking
  const { persistedTableOrders } = useTableOrdersStore();

  // Load tables data
  useEffect(() => {
    if (isOpen) {
      loadTables();
    }
  }, [isOpen, persistedTableOrders]); // ✅ FIXED: React to persistedTableOrders changes for real-time updates

  const loadTables = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await brain.get_tables();
      const data: TablesResponse = await response.json();
      
      if (data.success && data.tables) {
        const transformedTables: TableData[] = data.tables.map(table => {
          // ✅ FIXED: Check persistedTableOrders correctly - it's Record<number, TableOrder>, not an array
          const tableOrder = persistedTableOrders[table.table_number];
          const hasPersistedOrders = tableOrder && tableOrder.order_items && tableOrder.order_items.length > 0;
          const isSeated = tableOrder && tableOrder.status === 'Seated';
          
          return {
            tableNumber: table.table_number,
            capacity: table.capacity,
            status: isSeated ? 'SEATED' : 'AVAILABLE',
            guestCount: tableOrder?.guest_count || 0,
            hasOrders: hasPersistedOrders || false
          };
        });
        
        setTables(transformedTables);
      } else {
        setError('Failed to load tables');
      }
    } catch (err) {
      console.error('Error loading tables:', err);
      setError('Error loading tables');
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = (tableNumber: number) => {
    onTableSelect(tableNumber);
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return '#10B981'; // Green
      case 'SEATED':
        return QSAITheme.purple.primary; // Purple
      case 'RESERVED':
        return '#F59E0B'; // Yellow
      default:
        return QSAITheme.text.secondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Available';
      case 'SEATED':
        return 'Seated';
      case 'RESERVED':
        return 'Reserved';
      default:
        return 'Unknown';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${QSAITheme.background.card} 0%, ${QSAITheme.background.tertiary} 100%)`,
            border: `1px solid ${QSAITheme.purple.primary}40`,
            boxShadow: `0 20px 40px rgba(0, 0, 0, 0.5), 0 0 40px ${QSAITheme.purple.primary}20`
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: QSAITheme.purple.primary + '40' }}>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: QSAITheme.text.primary }}>
                Select Table
              </h2>
              <p className="text-sm mt-1" style={{ color: QSAITheme.text.secondary }}>
                Choose a table for this dine-in order
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div 
                    className="animate-spin w-8 h-8 border-2 border-transparent rounded-full mx-auto mb-4"
                    style={{ borderTopColor: QSAITheme.purple.primary }}
                  />
                  <p style={{ color: QSAITheme.text.secondary }}>Loading tables...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p style={{ color: '#EF4444' }}>{error}</p>
                <Button
                  onClick={loadTables}
                  className="mt-4"
                  style={{
                    backgroundColor: QSAITheme.purple.primary,
                    color: 'white'
                  }}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tables.map((table) => (
                  <motion.div
                    key={table.tableNumber}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="cursor-pointer"
                    onClick={() => handleTableSelect(table.tableNumber)}
                  >
                    <Card 
                      className="p-4 border-2 transition-all duration-200"
                      style={{
                        backgroundColor: selectedTable === table.tableNumber 
                          ? QSAITheme.purple.primary + '20'
                          : QSAITheme.background.tertiary,
                        borderColor: selectedTable === table.tableNumber 
                          ? QSAITheme.purple.primary
                          : getStatusColor(table.status) + '40',
                        boxShadow: selectedTable === table.tableNumber
                          ? `0 0 20px ${QSAITheme.purple.primary}40`
                          : 'none'
                      }}
                    >
                      {/* Table Number */}
                      <div className="text-center mb-3">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
                          style={{ backgroundColor: getStatusColor(table.status) + '20' }}
                        >
                          <Utensils 
                            className="h-6 w-6" 
                            style={{ color: getStatusColor(table.status) }}
                          />
                        </div>
                        <h3 
                          className="text-lg font-bold"
                          style={{ color: QSAITheme.text.primary }}
                        >
                          Table {table.tableNumber}
                        </h3>
                      </div>

                      {/* Status Badge */}
                      <div className="flex justify-center mb-3">
                        <Badge 
                          className="text-xs px-2 py-1"
                          style={{
                            backgroundColor: getStatusColor(table.status) + '20',
                            color: getStatusColor(table.status),
                            border: `1px solid ${getStatusColor(table.status)}40`
                          }}
                        >
                          {getStatusText(table.status)}
                        </Badge>
                      </div>

                      {/* Table Info */}
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span style={{ color: QSAITheme.text.secondary }}>Capacity:</span>
                          <div className="flex items-center">
                            <Users className="h-3 w-3 mr-1" style={{ color: QSAITheme.text.secondary }} />
                            <span style={{ color: QSAITheme.text.primary }}>{table.capacity}</span>
                          </div>
                        </div>
                        
                        {table.hasOrders && (
                          <div className="flex items-center justify-between">
                            <span style={{ color: QSAITheme.text.secondary }}>Current:</span>
                            <div className="flex items-center">
                              <Users className="h-3 w-3 mr-1" style={{ color: QSAITheme.text.secondary }} />
                              <span style={{ color: QSAITheme.text.primary }}>{table.guestCount}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t" style={{ borderColor: QSAITheme.purple.primary + '40' }}>
            <Button
              variant="outline"
              onClick={onClose}
              style={{
                borderColor: QSAITheme.purple.primary + '40',
                color: QSAITheme.text.secondary
              }}
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default TableSelectionModal;
