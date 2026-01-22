

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, CheckCircle2, ChevronRight, Info, Link2, Utensils, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { styles, effects, QSAITheme } from '../utils/QSAIDesign';
import { getTables } from '../utils/supabaseQueries';
import { PosTableResponse } from 'types';

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
  onSave: (guestCount: number, action: 'normal' | 'link' | 'continue_anyway', linkedTables?: number[]) => void;
  initialGuestCount: number;
  tableCapacity?: number; // Keep as optional fallback, but will be replaced by database value
}

/**
 * POSGuestCountModal Component
 * 
 * Enhanced modal dialog for collecting guest count when seating customers at a table.
 * Includes advanced capacity validation with integrated table linking options.
 * Uses real-time database data for accurate table capacity and availability.
 * Styled with QSAI design system for dark theme POS interface.
 */
export function POSGuestCountModal({ 
  isOpen, 
  onClose, 
  tableNumber, 
  onSave,
  initialGuestCount,
  tableCapacity = 4 // Default fallback capacity
}: Props) {
  
  const [guestCount, setGuestCount] = useState<number>(initialGuestCount);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLinkedTables, setSelectedLinkedTables] = useState<number[]>([]);
  const [allTables, setAllTables] = useState<TableData[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [actualTableCapacity, setActualTableCapacity] = useState<number>(tableCapacity);

  // Fetch real table data from database (direct Supabase query - no backend needed)
  const fetchTables = async () => {
    try {
      setIsLoadingTables(true);

      // Direct Supabase query
      const tables = await getTables();

      // Convert API response to internal format
      const tablesData: TableData[] = tables.map((table) => ({
        number: table.table_number,
        capacity: table.capacity,
        isAvailable: table.status.toUpperCase() === 'AVAILABLE',
        status: table.status
      }));

      setAllTables(tablesData);

      // Update actual table capacity from database
      const currentTable = tablesData.find(t => t.number === tableNumber);
      if (currentTable) {
        setActualTableCapacity(currentTable.capacity);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast.error('Error loading table data');
    } finally {
      setIsLoadingTables(false);
    }
  };

  // Reset state when modal opens/closes and fetch tables
  useEffect(() => {
    if (isOpen) {
      setGuestCount(initialGuestCount || 1);
      setIsLoading(false);
      setSelectedLinkedTables([]);
      setActualTableCapacity(tableCapacity); // Reset to fallback initially
      fetchTables(); // Fetch real table data
    }
  }, [isOpen, initialGuestCount, tableCapacity]);

  // Check if guest count exceeds table capacity (using real database capacity)
  const exceedsCapacity = guestCount > actualTableCapacity;
  
  // Calculate total capacity with linked tables (using real database data)
  const totalCapacity = actualTableCapacity + selectedLinkedTables.reduce((sum, tableNum) => {
    const table = allTables.find(t => t.number === tableNum);
    return sum + (table?.capacity || 0);
  }, 0);
  
  // Check if current selection accommodates all guests
  const hasValidCapacity = totalCapacity >= guestCount;
  
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
        if (!hasValidCapacity) {
          toast.error('Selected tables still don\'t provide enough capacity');
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
                {isLoadingTables ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
                    <span className="text-sm font-medium" style={{ color: QSAITheme.purple.primary }}>
                      Loading table data...
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-medium" style={{ color: QSAITheme.purple.primary }}>
                    Table {tableNumber} capacity: {actualTableCapacity} seats | Guests: {guestCount}
                  </span>
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
              
              {/* Guest Count Input - Native spinners hidden since we have custom +/- buttons */}
              <Input
                id="guest-count"
                type="number"
                min="1"
                max="20"
                value={guestCount}
                onChange={(e) => handleGuestCountChange(e.target.value)}
                className="text-center text-xl font-bold border-0 focus:border-0 focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
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

          {/* MIDDLE SECTION: Available Tables Selection (when capacity exceeded) */}
          {exceedsCapacity && (
            <div className="space-y-4">
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
                  
                  <div className="grid grid-cols-2 gap-3">
                    {availableTables.map(table => {
                      const isSelected = selectedLinkedTables.includes(table.number);
                      const wouldExceedNeeds = totalCapacity - table.capacity >= guestCount;
                      
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

              {/* Real-Time Calculation Display */}
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

        {/* BOTTOM SECTION: Enhanced Action Buttons */}
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
