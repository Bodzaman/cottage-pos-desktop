
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { List, Grid3X3 } from 'lucide-react';
import { QSAITheme } from '../utils/QSAIDesign';
import { DineInTableSelector } from './DineInTableSelector';
import { DineInTableSelectorCards } from './DineInTableSelectorCards';

interface DineInTableSelectorToggleProps {
  selectedTable: number | null;
  onTableSelect: (tableNumber: number) => void;
  className?: string;
  tableOrders?: Record<number, any[]>;
}

/**
 * DineInTableSelectorToggle - Allows switching between list and card views
 */
export function DineInTableSelectorToggle({
  selectedTable,
  onTableSelect,
  className = '',
  tableOrders = {}
}: DineInTableSelectorToggleProps) {
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards'); // Default to cards for better UX
  
  return (
    <div className={className}>
      {/* View Toggle */}
      <div className="mb-4 flex items-center justify-between">
        <h2 
          className="text-xl font-semibold"
          style={{ color: QSAITheme.text.primary }}
        >
          Table Selection
        </h2>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="flex items-center space-x-2"
            style={{
              background: viewMode === 'list' ? QSAITheme.purple.primary : 'transparent',
              borderColor: QSAITheme.border.light,
              color: viewMode === 'list' ? 'white' : QSAITheme.text.secondary
            }}
          >
            <List className="h-4 w-4" />
            <span>List</span>
          </Button>
          
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="flex items-center space-x-2"
            style={{
              background: viewMode === 'cards' ? QSAITheme.purple.primary : 'transparent',
              borderColor: QSAITheme.border.light,
              color: viewMode === 'cards' ? 'white' : QSAITheme.text.secondary
            }}
          >
            <Grid3X3 className="h-4 w-4" />
            <span>Cards</span>
          </Button>
        </div>
      </div>
      
      {/* Conditional Rendering */}
      {viewMode === 'list' ? (
        <DineInTableSelector
          selectedTable={selectedTable}
          onTableSelect={onTableSelect}
          tableOrders={tableOrders}
        />
      ) : (
        <DineInTableSelectorCards
          selectedTable={selectedTable}
          onTableSelect={onTableSelect}
          tableOrders={tableOrders}
        />
      )}
    </div>
  );
}

export default DineInTableSelectorToggle;
