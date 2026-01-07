import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, CheckCircle2, ChevronRight, Info, Link2, Utensils, Calculator, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { styles, effects, QSAITheme } from '../utils/QSAIDesign';
import { OrderItem } from '../utils/menuTypes';
import { PosTableResponse, TablesResponse } from 'types';

// Remove hardcoded mock data and replace with real database interface
interface TableData {
  number: number;
  capacity: number;
  isAvailable: boolean;
  status: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: number;
  onSave: (guestCount: number, action: 'normal' | 'link' | 'continue_anyway', linkedTableNumbers?: number[]) => void;
  initialGuestCount: number;
  tableCapacity?: number; // Keep as optional fallback, but will be replaced by database value
  restaurantTables?: RestaurantTable[]; // ✅ NEW: Real-time event-driven table data
  tablesLoading?: boolean; // ✅ NEW: Loading state for tables
}

/**
 * POSGuestCountModal Component
 * 
 * Enhanced modal dialog for collecting guest count when seating customers at a table.
 * Includes advanced capacity validation with integrated table linking options.
 * Uses real-time database data for accurate table capacity and availability.
 * Styled with QSAI design system for dark theme POS interface.
 * 
 * ✅ ALIGNED TO EVENT-DRIVEN ARCHITECTURE (MYA-1592):
 * - Receives real-time table data from parent (POSDesktop)
 * - No legacy API calls (get_tables)
 * - Uses pos_tables + orders (not table_orders)
 */
export function POSGuestCountModal({ 
  isOpen, 
  onClose, 
  tableNumber, 
  onSave,
  initialGuestCount,
  tableCapacity = 4, // Default fallback capacity
  restaurantTables = [], // ✅ NEW: Event-driven table data
  tablesLoading = false // ✅ NEW: Loading state
}: Props) {
  console.log('🎯 POSGuestCountModal Rendered:', { isOpen, tableNumber, tableCapacity, restaurantTablesCount: restaurantTables.length });
  
  const [guestCount, setGuestCount] = useState<number>(initialGuestCount);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLinkedTables, setSelectedLinkedTables] = useState<number[]>([]);
  const [actualTableCapacity, setActualTableCapacity] = useState<number>(tableCapacity);

  // ✅ PHASE 7.3: Linked table detection
  const [isLinkedTable, setIsLinkedTable] = useState(false);
  const [linkedTableNumbers, setLinkedTableNumbers] = useState<number[]>([]);
  const [combinedLinkedCapacity, setCombinedLinkedCapacity] = useState(0);

  // ✅ NEW: Convert event-driven restaurantTables to internal TableData format
  const allTables: TableData[] = restaurantTables.map(t => ({
    number: parseInt(t.table_number), // ✅ FIXED: Use correct property name from TableData interface
    capacity: t.capacity,
    status: t.status,
    isAvailable: t.status === 'AVAILABLE' || t.status === 'VACANT' // ✅ FIXED: Accept both AVAILABLE and VACANT statuses
  }));

  console.log('🔍 DEBUG allTables:', allTables.map(t => ({ number: t.number, status: t.status, isAvailable: t.isAvailable })));

  // Reset state when modal opens/closes and fetch tables
  useEffect(() => {
    if (isOpen && restaurantTables.length > 0) {
      console.log('🎯 POSGuestCountModal opened for table:', tableNumber);
      setGuestCount(initialGuestCount || 1);
      setIsLoading(false);
      setSelectedLinkedTables([]);
      
      // Find actual table capacity from event-driven data
      const currentTable = restaurantTables.find(t => parseInt(t.table_number) === tableNumber);
      const capacity = currentTable?.capacity || tableCapacity;
      setActualTableCapacity(capacity);

      // ✅ PHASE 7.3: Detect if this table is part of a linked group
      const isPartOfLinkedGroup = currentTable?.is_linked_table || currentTable?.is_linked_primary;
      setIsLinkedTable(!!isPartOfLinkedGroup);

      if (isPartOfLinkedGroup && currentTable?.linked_with_tables) {
        // Get linked table numbers
        const linkedNumbers = currentTable.linked_with_tables;
        setLinkedTableNumbers(linkedNumbers);

        // Calculate combined capacity (current table + all linked tables)
        const totalLinkedCapacity = linkedNumbers.reduce((sum, num) => {
          const linkedTable = restaurantTables.find(t => parseInt(t.table_number) === num);
          return sum + (linkedTable?.capacity || 0);
        }, capacity); // Start with current table's capacity

        setCombinedLinkedCapacity(totalLinkedCapacity);

        console.log('🔗 LINKED TABLE DETECTED:', {
          tableNumber,
          linkedWith: linkedNumbers,
          currentCapacity: capacity,
          combinedCapacity: totalLinkedCapacity,
          isPrimary: currentTable.is_linked_primary
        });
      } else {
        setLinkedTableNumbers([]);
        setCombinedLinkedCapacity(0);
      }
      
      console.log('✅ Using event-driven table data:', {
        tablesCount: restaurantTables.length,
        currentTable: currentTable?.table_number,
        capacity
      });
    }
  }, [isOpen, tableNumber, initialGuestCount, tableCapacity, restaurantTables]);

  // Check if guest count exceeds table capacity (using real database capacity)
  const exceedsCapacity = guestCount > actualTableCapacity;
  
  // Calculate total capacity with linked tables (using real database data)
  const totalCapacity = actualTableCapacity + selectedLinkedTables.reduce((sum, tableNum) => {
    const table = allTables.find(t => t.number === tableNum);
    return sum + (table?.capacity || 0);
  }, 0);
  
  // Get available tables (excluding current table and occupied tables) from real database data
  const availableTables = allTables.filter(table => 
    table.number !== tableNumber && table.isAvailable
  );

  // Handle guest count changes
  const handleGuestCountChange = (value: string) => {
    const count = parseInt(value) || 0;
    setGuestCount(count);
  };

  // Handle increment/decrement
  const incrementGuests = () => {
    const newCount = guestCount + 1;
    setGuestCount(newCount);
  };

  const decrementGuests = () => {
    if (guestCount > 1) {
      const newCount = guestCount - 1;
      setGuestCount(newCount);
    }
  };

  // Handle linking table selection
  const handleTableLinkToggle = (tableNum: number) => {
    setSelectedLinkedTables(prev => {
      if (prev.includes(tableNum)) {
        return prev.filter(num => num !== tableNum);
      } else {
        return [...prev, tableNum];
      }
    });
  };

  // Handle different actions
  const handleAction = async (action: 'normal' | 'link' | 'continue_anyway') => {
    if (guestCount < 1) {
      toast.error('Guest count must be at least 1');
      return;
    }

    setIsLoading(true);
    
    try {
      if (action === 'link') {
        if (selectedLinkedTables.length === 0) {
          toast.error('Please select at least one table to link');
          setIsLoading(false);
          return;
        }
        onSave(guestCount, action, selectedLinkedTables);
      } else {
        onSave(guestCount, action);
      }
      
      onClose();
    } catch (error) {
      toast.error('Failed to process table selection');
      console.error('Table selection error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-xl border-0"
        style={{
          background: QSAITheme.background.panel, // #1E1E1E - consistent with POS
          boxShadow: `0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px ${QSAITheme.border.accent}`,
          borderRadius: '20px'
        }}
      >
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="p-3 rounded-xl"
              style={{
                background: `rgba(124, 93, 250, 0.15)`,
                border: `1px solid ${QSAITheme.border.accent}`,
                boxShadow: effects.innerGlow('subtle')
              }}
            >
              <Users className="h-6 w-6" style={{ color: QSAITheme.purple.primary }} />
            </div>
            <div>
              <DialogTitle 
                className="text-xl font-semibold tracking-wide"
                style={{
                  ...styles.gradientText('medium'),
                  textShadow: effects.textShadow('medium')
                }}
              >
                Seat Table {tableNumber}
              </DialogTitle>
              <DialogDescription className="text-sm opacity-70" style={{ color: QSAITheme.text.muted }}>
                How many guests will be dining at this table?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* TOP SECTION: Table Capacity Info */}
          <Card 
            className="p-4 border-0"
            style={{
              background: `rgba(124, 93, 250, 0.1)`,
              border: `1px solid ${QSAITheme.border.accent}`,
              borderRadius: '12px'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" style={{ color: QSAITheme.purple.primary }} />
                {tablesLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
                    <span className="text-sm font-medium" style={{ color: QSAITheme.purple.primary }}>
                      Loading table data...
                    </span>
                  </div>
                ) : isLinkedTable && linkedTableNumbers.length > 0 ? (
                  // ✅ PHASE 7.3: Show linked table capacity (informational only)
                  <div className="space-y-1">
                    <span className="text-sm font-medium" style={{ color: QSAITheme.purple.primary }}>
                      Table {tableNumber} + {linkedTableNumbers.map(num => `Table ${num}`).join(' + ')}
                    </span>
                    <div className="text-xs" style={{ color: QSAITheme.text.muted }}>
                      Combined Capacity: {combinedLinkedCapacity} seats ({actualTableCapacity} + {linkedTableNumbers.map(num => {
                        const linkedTable = restaurantTables.find(t => parseInt(t.table_number) === num);
                        return linkedTable?.capacity || 0;
                      }).join(' + ')})
                    </div>
                    {guestCount > combinedLinkedCapacity && (
                      <div className="text-xs" style={{ color: QSAITheme.purple.primary }}>
                        Seating {guestCount} guests ({guestCount - combinedLinkedCapacity} over capacity - flexible seating)
                      </div>
                    )}
                  </div>
                ) : (
                  // Regular single table
                  <div className="space-y-1">
                    <span className="text-sm font-medium" style={{ color: QSAITheme.purple.primary }}>
                      Table {tableNumber} capacity: {actualTableCapacity} seats | Guests: {guestCount}
                    </span>
                    {guestCount > actualTableCapacity && (
                      <div className="text-xs" style={{ color: QSAITheme.text.muted }}>
                        ({guestCount - actualTableCapacity} over capacity - flexible seating)
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* TOP SECTION: Guest Count Input */}
          <div className="space-y-3">
            <Label htmlFor="guest-count" className="text-sm font-medium" style={{ color: QSAITheme.text.secondary }}>
              Number of Guests
            </Label>
            
            <div className="flex items-center gap-3">
              {/* Decrement Button */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={decrementGuests}
                disabled={guestCount <= 1 || isLoading}
                className="h-12 w-12 rounded-full border-0 hover:border-0 transition-all duration-200"
                style={{
                  background: QSAITheme.background.secondary,
                  border: `1px solid ${QSAITheme.border.accent}`,
                  color: QSAITheme.text.secondary,
                  '&:hover': {
                    background: QSAITheme.background.tertiary,
                    border: `1px solid ${QSAITheme.purple.primary}`,
                    transform: 'translateY(-1px)',
                    boxShadow: effects.outerGlow('subtle')
                  }
                }}
              >
                <span className="text-lg font-bold">−</span>
              </Button>
              
              {/* Guest Count Input */}
              <Input
                id="guest-count"
                type="number"
                min="1"
                max="20"
                value={guestCount}
                onChange={(e) => handleGuestCountChange(e.target.value)}
                className="text-center text-xl font-bold border-0 focus:border-0 focus:ring-0"
                style={{ 
                  width: '90px', 
                  height: '48px',
                  background: QSAITheme.background.secondary,
                  border: `1px solid ${QSAITheme.border.accent}`,
                  color: QSAITheme.text.primary,
                  borderRadius: '12px'
                }}
              />
              
              {/* Increment Button */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={incrementGuests}
                disabled={isLoading}
                className="h-12 w-12 rounded-full border-0 hover:border-0 transition-all duration-200"
                style={{
                  background: QSAITheme.background.secondary,
                  border: `1px solid ${QSAITheme.border.accent}`,
                  color: QSAITheme.text.secondary,
                  '&:hover': {
                    background: QSAITheme.background.tertiary,
                    border: `1px solid ${QSAITheme.purple.primary}`,
                    transform: 'translateY(-1px)',
                    boxShadow: effects.outerGlow('subtle')
                  }
                }}
              >
                <span className="text-lg font-bold">+</span>
              </Button>
            </div>
          </div>

          {/* MIDDLE SECTION: Optional Table Linking (Only when capacity exceeded) */}
          {exceedsCapacity && availableTables.length > 0 && !isLinkedTable && (
            <div className="space-y-4">
              <Card 
                className="p-4 border-0"
                style={{
                  background: QSAITheme.background.secondary,
                  border: `1px solid ${QSAITheme.border.accent}`,
                  borderRadius: '12px'
                }}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Link2 className="h-4 w-4" style={{ color: QSAITheme.purple.primary }} />
                    <span className="text-sm font-medium" style={{ color: QSAITheme.purple.primary }}>
                      Link Additional Tables (Optional)
                    </span>
                  </div>
                  <div className="text-xs mb-3" style={{ color: QSAITheme.text.muted }}>
                    Select tables to link for larger parties or flexible seating arrangements
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {availableTables.map(table => {
                      const isSelected = selectedLinkedTables.includes(table.number);
                      
                      return (
                        <div
                          key={table.number}
                          className={`p-3 rounded-lg border cursor-pointer transition-all duration-200`}
                          onClick={() => handleTableLinkToggle(table.number)}
                          style={{
                            background: isSelected 
                              ? `rgba(124, 93, 250, 0.2)` 
                              : QSAITheme.background.tertiary,
                            border: isSelected
                              ? `1px solid ${QSAITheme.purple.primary}`
                              : `1px solid ${QSAITheme.border.medium}`,
                            borderRadius: '8px'
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleTableLinkToggle(table.number)}
                              className="rounded"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium" style={{ color: QSAITheme.text.secondary }}>
                                  Table {table.number}
                                </span>
                                <span className="text-xs" style={{ color: QSAITheme.text.muted }}>
                                  {table.capacity} seats
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>

              {/* Show capacity calculation when tables are selected */}
              {selectedLinkedTables.length > 0 && (
                <Card 
                  className="p-4 border-0"
                  style={{
                    background: 'rgba(124, 93, 250, 0.15)',
                    border: `1px solid ${QSAITheme.purple.primary}`,
                    borderRadius: '12px'
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" style={{ color: QSAITheme.purple.primary }} />
                      <span className="text-sm font-medium" style={{ color: QSAITheme.purple.primary }}>
                        Combined Capacity
                      </span>
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <div style={{ color: QSAITheme.text.secondary }}>
                        Table {tableNumber} ({actualTableCapacity}) + {selectedLinkedTables.map(num => {
                          const table = allTables.find(t => t.number === num);
                          return `Table ${num} (${table?.capacity || 0})`;
                        }).join(' + ')} = <span className="font-medium">{totalCapacity} total seats</span>
                      </div>
                      <div className="font-medium" style={{ color: QSAITheme.purple.primary }}>
                        Total: {totalCapacity} seats for {guestCount} guests
                        {guestCount > totalCapacity && ` (${guestCount - totalCapacity} over - flexible seating)`}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM SECTION: Simplified Action Buttons */}
        <div className="pt-6" style={{ borderTop: `1px solid ${QSAITheme.border.medium}` }}>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 h-12 border-0"
              style={{
                background: QSAITheme.background.secondary,
                border: `1px solid ${QSAITheme.border.medium}`,
                color: QSAITheme.text.secondary,
                borderRadius: '12px'
              }}
            >
              Cancel
            </Button>
            
            <Button
              onClick={() => {
                if (selectedLinkedTables.length > 0) {
                  handleAction('link');
                } else {
                  handleAction('normal');
                }
              }}
              disabled={isLoading || guestCount < 1}
              className="flex-1 h-12 font-medium border-0"
              style={{
                background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.dark} 100%)`,
                border: 'none',
                borderRadius: '12px',
                color: QSAITheme.text.primary,
                textShadow: effects.textShadow('subtle')
              }}
            >
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <span>
                  {isLoading ? 'Processing...' : selectedLinkedTables.length > 0 ? 'Link Tables' : 'Seat Guests'}
                </span>
                {!isLoading && <ChevronRight className="h-4 w-4" />}
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
