import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Link2, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { styles, effects } from '../utils/QSAIDesign';
import { TableData } from '../utils/tableTypes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  primaryTableNumber: number;
  primaryTableCapacity: number;
  totalGuestCount: number;
  availableTables: TableData[];
  onConfirm: (linkedTableNumbers: number[]) => void;
  className?: string;
}

export function TableLinkingModal({ 
  isOpen, 
  onClose, 
  primaryTableNumber,
  primaryTableCapacity,
  totalGuestCount,
  availableTables,
  onConfirm,
  className = ''
}: Props) {
  const [selectedTables, setSelectedTables] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedTables([]);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Calculate total capacity including primary table and selected linked tables
  const getTotalCapacity = () => {
    const linkedCapacity = selectedTables.reduce((total, tableNum) => {
      const table = availableTables.find(t => t.tableNumber === tableNum);
      return total + (table?.capacity || 0);
    }, 0);
    return primaryTableCapacity + linkedCapacity;
  };

  // Check if current selection meets guest count requirements
  const meetsRequirements = getTotalCapacity() >= totalGuestCount;
  const remainingSeatsNeeded = Math.max(0, totalGuestCount - getTotalCapacity());

  // Handle table selection/deselection
  const toggleTableSelection = (tableNumber: number) => {
    setSelectedTables(prev => {
      if (prev.includes(tableNumber)) {
        return prev.filter(num => num !== tableNumber);
      } else {
        return [...prev, tableNumber].sort((a, b) => a - b);
      }
    });
  };

  // Handle confirmation
  const handleConfirm = async () => {
    if (!meetsRequirements) {
      toast.error(`Please select tables with at least ${remainingSeatsNeeded} more seats`);
      return;
    }

    if (selectedTables.length === 0) {
      toast.error('Please select at least one table to link');
      return;
    }

    setIsLoading(true);
    
    try {
      onConfirm(selectedTables);
      toast.success(`Linked ${selectedTables.length + 1} tables for ${totalGuestCount} guests`);
    } catch (error) {
      toast.error('Failed to link tables');
      console.error('Table linking error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter available tables (exclude primary table and already occupied tables)
  const linkableTables = availableTables.filter(table => 
    table.tableNumber !== primaryTableNumber && 
    table.status === 'AVAILABLE' &&
    !table.isLinkedTable
  );

  const handleLinkTable = (linkedTableNumber: number) => {
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-2xl backdrop-blur-xl border-0 max-h-[90vh] overflow-y-auto"
        style={{
          background: 'rgba(30, 30, 30, 0.95)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(124, 93, 250, 0.2)',
          borderRadius: '16px'
        }}
      >
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="p-2 rounded-xl"
              style={{
                background: 'rgba(124, 93, 250, 0.15)',
                border: '1px solid rgba(124, 93, 250, 0.3)'
              }}
            >
              <Link2 className="h-5 w-5" style={{ color: '#7c5dfa' }} />
            </div>
            <div>
              <DialogTitle 
                className="text-xl font-semibold tracking-wide"
                style={{
                  ...styles.gradientText('medium'),
                  textShadow: effects.textShadow('medium')
                }}
              >
                Link Tables for Large Party
              </DialogTitle>
              <DialogDescription className="text-sm opacity-70">
                Select additional tables to accommodate {totalGuestCount} guests
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Primary Table Info */}
          <Card 
            className="p-4 border-0"
            style={{
              background: 'rgba(124, 93, 250, 0.1)',
              border: '1px solid rgba(124, 93, 250, 0.2)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-300">Primary Table</span>
              </div>
              <Badge 
                className="bg-purple-500/20 text-purple-300 border-purple-400/30"
              >
                Table {primaryTableNumber}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>{primaryTableCapacity} seats</span>
              </div>
              <div className="text-purple-400">
                Primary selection - always included
              </div>
            </div>
          </Card>

          {/* Capacity Status */}
          <Card 
            className="p-4 border-0"
            style={{
              background: meetsRequirements 
                ? 'rgba(46, 125, 50, 0.1)' 
                : 'rgba(245, 158, 11, 0.1)',
              border: meetsRequirements 
                ? '1px solid rgba(46, 125, 50, 0.3)' 
                : '1px solid rgba(245, 158, 11, 0.3)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {meetsRequirements ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                )}
                <span className="text-sm font-medium text-gray-300">
                  Total Capacity: {getTotalCapacity()} seats
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Guest Count: {totalGuestCount}</div>
                {!meetsRequirements && (
                  <div className="text-xs text-amber-400">
                    Need {remainingSeatsNeeded} more seats
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Available Tables for Linking */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">
                Select Additional Tables ({linkableTables.length} available)
              </span>
            </div>
            
            {linkableTables.length === 0 ? (
              <Card className="p-4 border-0 bg-gray-800/50 border-gray-600">
                <div className="text-center text-gray-400 text-sm">
                  No additional tables available for linking
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {linkableTables.map((table) => {
                  const isSelected = selectedTables.includes(table.tableNumber);
                  return (
                    <Card
                      key={table.tableNumber}
                      className={`p-3 cursor-pointer transition-all duration-200 border-0 ${
                        isSelected ? 'ring-2 ring-purple-400' : 'hover:bg-gray-700/50'
                      }`}
                      style={{
                        background: isSelected 
                          ? 'rgba(124, 93, 250, 0.15)' 
                          : 'rgba(55, 65, 81, 0.5)',
                        border: isSelected 
                          ? '1px solid rgba(124, 93, 250, 0.4)' 
                          : '1px solid rgba(75, 85, 99, 0.3)'
                      }}
                      onClick={() => toggleTableSelection(table.tableNumber)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-200">
                            Table {table.tableNumber}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {table.capacity} seats
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-purple-400" />
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Tables Summary */}
          {selectedTables.length > 0 && (
            <Card 
              className="p-4 border-0"
              style={{
                background: 'rgba(124, 93, 250, 0.1)',
                border: '1px solid rgba(124, 93, 250, 0.2)'
              }}
            >
              <div className="space-y-2">
                <div className="text-sm font-medium text-purple-300">
                  Selected Linked Tables:
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedTables.map(tableNum => {
                    const table = availableTables.find(t => t.tableNumber === tableNum);
                    return (
                      <Badge 
                        key={tableNum}
                        className="bg-purple-500/20 text-purple-300 border-purple-400/30"
                      >
                        Table {tableNum} ({table?.capacity} seats)
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 border-gray-600 hover:bg-gray-700"
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !meetsRequirements || selectedTables.length === 0}
            className="flex-1"
            style={{
              background: meetsRequirements 
                ? 'linear-gradient(135deg, #7c5dfa 0%, #6366f1 100%)' 
                : 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
              border: 'none'
            }}
          >
            <div className="flex items-center gap-2">
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              <span>
                {isLoading ? 'Linking...' : `Link ${selectedTables.length + 1} Tables`}
              </span>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
