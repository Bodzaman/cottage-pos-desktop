


import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, CheckCircle2, ChevronRight, Info, Link2, Utensils, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { styles, effects, QSAITheme } from '../utils/QSAIDesign';
import { NumberInput } from './NumberInput';
import brain from 'brain';
import { PosTableResponse, TablesResponse } from 'types';

/**
 * Interface for internal table data structure
 */
interface TableData {
  number: number;
  capacity: number;
  isAvailable: boolean;
  status: string;
}

/**
 * Props interface for the POSGuestCountModal component
 */
interface Props {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: number;
  onSave: (guestCount: number, action: 'normal' | 'link' | 'continue_anyway', linkedTables?: number[]) => void;
  initialGuestCount: number;
  tableCapacity?: number; // Fallback capacity if database fails
}

/**
 * POSGuestCountModal Component
 * 
 * Enhanced modal dialog for collecting guest count when seating customers at a table.
 * Features:
 * - Real-time database integration for accurate table data
 * - Smart capacity validation with visual feedback
 * - Table linking functionality for larger parties
 * - Professional QSAI design system styling
 * - Advanced form controls with increment/decrement buttons
 * - Multiple action options: normal seating, table linking, continue anyway
 * - Real-time capacity calculations for linked tables
 * - Professional error handling and loading states
 */
export function POSGuestCountModalClean({ 
  isOpen, 
  onClose, 
  tableNumber, 
  onSave,
  initialGuestCount,
  tableCapacity = 4
}: Props) {
  // State management
  const [guestCount, setGuestCount] = useState<number>(initialGuestCount);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLinkedTables, setSelectedLinkedTables] = useState<number[]>([]);
  const [allTables, setAllTables] = useState<TableData[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [actualTableCapacity, setActualTableCapacity] = useState<number>(tableCapacity);

  /**
   * Fetch real table data from database
   */
  const fetchTables = async () => {
    try {
      setIsLoadingTables(true);
      console.log('🔄 Fetching tables from database...');
      
      const response = await brain.get_tables();
      const data: TablesResponse = await response.json();
      
      if (data.success && Array.isArray(data.tables)) {
        // Convert API response to internal format
        const tablesData: TableData[] = data.tables.map((table: PosTableResponse) => ({
          number: table.table_number,
          capacity: table.capacity,
          isAvailable: table.status === 'available',
          status: table.status
        }));
        
        setAllTables(tablesData);
        console.log('✅ Tables loaded successfully:', tablesData.length);
        
        // Update actual table capacity from database
        const currentTable = tablesData.find(t => t.number === tableNumber);
        if (currentTable) {
          setActualTableCapacity(currentTable.capacity);
          console.log(`📊 Table ${tableNumber} capacity updated: ${currentTable.capacity} seats`);
        } else {
          console.warn(`⚠️  Table ${tableNumber} not found in database, using fallback capacity: ${tableCapacity}`);
        }
      } else {
        console.error('❌ Failed to fetch tables:', data.message);
        toast.error('Failed to load table data');
      }
    } catch (error) {
      console.error('❌ Error fetching tables:', error);
      toast.error('Error loading table data');
    } finally {
      setIsLoadingTables(false);
    }
  };

  /**
   * Reset state when modal opens and fetch fresh table data
   */
  useEffect(() => {
    if (isOpen) {
      console.log('🎯 POSGuestCountModal opened for table:', tableNumber);
      setGuestCount(initialGuestCount || 1);
      setIsLoading(false);
      setSelectedLinkedTables([]);
      setActualTableCapacity(tableCapacity);
      fetchTables();
    }
  }, [isOpen, initialGuestCount, tableCapacity, tableNumber]);

  // Calculated properties
  const exceedsCapacity = guestCount > actualTableCapacity;
  
  const totalCapacity = actualTableCapacity + selectedLinkedTables.reduce((sum, tableNum) => {
    const table = allTables.find(t => t.number === tableNum);
    return sum + (table?.capacity || 0);
  }, 0);
  
  const hasValidCapacity = totalCapacity >= guestCount;
  
  const availableTables = allTables.filter(table => 
    table.number !== tableNumber && table.isAvailable
  );

  /**
   * Handle guest count input changes
   */
  const handleGuestCountChange = (value: string) => {
    const count = parseInt(value) || 0;
    if (count >= 0 && count <= 50) { // Reasonable limits
      setGuestCount(count);
    }
  };

  /**
   * Handle table linking selection
   */
  const handleTableLinkToggle = (tableNum: number) => {
    setSelectedLinkedTables(prev => {
      if (prev.includes(tableNum)) {
        return prev.filter(num => num !== tableNum);
      } else {
        return [...prev, tableNum];
      }
    });
  };

  /**
   * Handle different seating actions
   */
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
        if (!hasValidCapacity) {
          toast.error('Selected tables still don\'t provide enough capacity');
          setIsLoading(false);
          return;
        }
        console.log(`🔗 Linking tables: ${tableNumber} + [${selectedLinkedTables.join(', ')}]`);
        onSave(guestCount, action, selectedLinkedTables);
      } else {
        console.log(`✅ ${action} seating for ${guestCount} guests at table ${tableNumber}`);
        onSave(guestCount, action);
      }
      
      onClose();
    } catch (error) {
      toast.error('Failed to process table selection');
      console.error('❌ Table selection error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-xl border-0"
        style={{
          background: QSAITheme.background.panel,
          boxShadow: `0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px ${QSAITheme.border.accent}`,
          borderRadius: '20px'
        }}
      >
        {/* Header Section */}
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
          {/* Table Capacity Info */}
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
                {isLoadingTables ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
                    <span className="text-sm font-medium" style={{ color: QSAITheme.purple.primary }}>
                      Loading table data...
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>
                    Table {tableNumber} capacity: {actualTableCapacity} seats | Guests: {guestCount}
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Guest Count Input Section */}
          <NumberInput
            value={guestCount}
            onChange={setGuestCount}
            label="Number of Guests"
            min={1}
            max={50}
            disabled={isLoading}
            showDropdown={false}
            size="md"
            helpText="Scroll or use arrow keys to change the number"
          />

          {/* Table Linking Section (shown when capacity exceeded) */}
          {exceedsCapacity && (
            <div className="space-y-4">
              {/* Capacity Warning */}
              <Card 
                className="p-4 border-0"
                style={{
                  background: `rgba(124, 93, 250, 0.1)`,
                  border: `1px solid ${QSAITheme.border.accent}`,
                  borderRadius: '12px'
                }}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" style={{ color: QSAITheme.purple.primary }} />
                    <span className="text-sm font-medium" style={{ color: QSAITheme.purple.primary }}>
                      Party size exceeds table capacity ({actualTableCapacity} seats)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: QSAITheme.text.muted }}>
                    <Link2 className="h-4 w-4" />
                    <span>Select additional tables to link for larger parties</span>
                  </div>
                </div>
              </Card>

              {/* Available Tables Grid */}
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
                    <Utensils className="h-4 w-4" style={{ color: QSAITheme.purple.primary }} />
                    <span className="text-sm font-medium" style={{ color: QSAITheme.purple.primary }}>
                      Available Tables to Link
                    </span>
                  </div>
                  
                  {availableTables.length === 0 ? (
                    <div className="text-center py-4">
                      <span className="text-sm" style={{ color: QSAITheme.text.muted }}>
                        No available tables to link
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {availableTables.map(table => {
                        const isSelected = selectedLinkedTables.includes(table.number);
                        
                        return (
                          <div
                            key={table.number}
                            className="p-3 rounded-lg border cursor-pointer transition-all duration-200"
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
                  )}
                </div>
              </Card>

              {/* Real-Time Capacity Calculation */}
              {selectedLinkedTables.length > 0 && (
                <Card 
                  className="p-4 border-0"
                  style={{
                    background: hasValidCapacity 
                      ? 'rgba(124, 93, 250, 0.15)' 
                      : 'rgba(239, 68, 68, 0.1)',
                    border: hasValidCapacity 
                      ? `1px solid ${QSAITheme.purple.primary}` 
                      : '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '12px'
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" style={{ color: QSAITheme.purple.primary }} />
                      <span className="text-sm font-medium" style={{ color: QSAITheme.purple.primary }}>
                        Capacity Calculation
                      </span>
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <div style={{ color: QSAITheme.text.secondary }}>
                        Table {tableNumber} ({actualTableCapacity}) + {selectedLinkedTables.map(num => {
                          const table = allTables.find(t => t.number === num);
                          return `Table ${num} (${table?.capacity || 0})`;
                        }).join(' + ')} = <span className="font-medium">{totalCapacity} total seats</span>
                      </div>
                      <div className={`font-medium ${
                        hasValidCapacity ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {hasValidCapacity 
                          ? `✅ ${totalCapacity} seats for ${guestCount} guests` 
                          : `❌ Need ${guestCount - totalCapacity} more seats`
                        }
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons Section */}
        <div className="pt-6" style={{ borderTop: `1px solid ${QSAITheme.border.medium}` }}>
          {exceedsCapacity ? (
            // Enhanced buttons when capacity exceeded
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <Button
                  onClick={() => handleAction('link')}
                  disabled={isLoading || selectedLinkedTables.length === 0 || !hasValidCapacity}
                  className={`w-full h-12 font-medium transition-all duration-200 border-0 ${
                    selectedLinkedTables.length > 0 && hasValidCapacity
                      ? 'opacity-100'
                      : 'opacity-50'
                  }`}
                  style={{
                    background: selectedLinkedTables.length > 0 && hasValidCapacity
                      ? `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.dark} 100%)`
                      : `rgba(124, 93, 250, 0.3)`,
                    border: 'none',
                    borderRadius: '12px',
                    color: QSAITheme.text.primary,
                    textShadow: effects.textShadow('subtle')
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    <span>
                      {selectedLinkedTables.length === 0 
                        ? '🔗 Select Tables to Link'
                        : hasValidCapacity
                        ? `🔗 Confirm Linked Tables (${selectedLinkedTables.length})`
                        : '🔗 Need More Tables'
                      }
                    </span>
                  </div>
                </Button>
                
                <Button
                  onClick={() => handleAction('continue_anyway')}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full h-12 border-0"
                  style={{
                    background: QSAITheme.background.secondary,
                    border: `1px solid ${QSAITheme.border.medium}`,
                    color: QSAITheme.text.secondary,
                    borderRadius: '12px'
                  }}
                >
                  <span>Continue Anyway</span>
                </Button>
                
                <Button
                  onClick={onClose}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full h-12 border-0"
                  style={{
                    background: QSAITheme.background.secondary,
                    border: `1px solid ${QSAITheme.border.medium}`,
                    color: QSAITheme.text.secondary,
                    borderRadius: '12px'
                  }}
                >
                  <span>Cancel</span>
                </Button>
              </div>
            </div>
          ) : (
            // Normal two-button layout when within capacity
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
                onClick={() => handleAction('normal')}
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
                    {isLoading ? 'Processing...' : 'Confirm Seating'}
                  </span>
                  {!isLoading && <ChevronRight className="h-4 w-4" />}
                </div>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
