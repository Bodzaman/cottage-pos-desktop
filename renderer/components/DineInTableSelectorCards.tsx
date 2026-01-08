import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, CheckCircle2, Link2, Utensils } from 'lucide-react';
import { toast } from 'sonner';
import { QSAITheme, styles, effects } from '../utils/QSAIDesign';
import { TableStatus, getTableStatusLabel } from '../utils/tableTypes';
import { useRestaurantTables, type RestaurantTable } from '../utils/useRestaurantTables';
import { getLinkedTableColor, getLinkedTableBadgeText } from '../utils/linkedTableColors';

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
  linkedTableGroupId?: string | null;
  linkedWithTables?: number[] | null;
}

interface DineInTableSelectorCardsProps {
  selectedTable: number | null;
  onTableSelect: (tableNumber: number) => void;
  className?: string;
  tableOrders?: Record<number, any[]>;
}

/**
 * DineInTableSelectorCards - ✅ 100% EVENT-DRIVEN ARCHITECTURE (MYA-1607)
 * 
 * Features:
 * - Real-time table status via useRestaurantTables hook
 * - Zero polling - WebSocket subscriptions only
 * - Single source of truth: pos_tables table
 * - QSAI design consistency
 * - Linked table visual indicators with matching glow borders
 * 
 * Performance: Real-time updates < 500ms latency
 */
export function DineInTableSelectorCards({ 
  selectedTable, 
  onTableSelect, 
  tableOrders = {}, 
  className = '' 
}: DineInTableSelectorCardsProps) {
  // ✅ EVENT-DRIVEN: Real-time subscription to pos_tables (no polling)
  const { 
    tables: restaurantTables,
    loading,
    error 
  } = useRestaurantTables();
  
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
      case 'VACANT':
        return QSAITheme.status.success;
      case 'SEATED':
      case 'DINING':
        return QSAITheme.purple.primary;
      case 'REQUESTING_CHECK':
      case 'PAYING':
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
      case 'VACANT':
        return <CheckCircle2 {...iconProps} />;
      case 'SEATED':
      case 'DINING':
        return <Users {...iconProps} />;
      case 'REQUESTING_CHECK':
      case 'PAYING':
        return <Clock {...iconProps} />;
      default:
        return <Utensils {...iconProps} />;
    }
  }, []);
  
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
        {restaurantTables.map((table) => {
          const isSelected = selectedTable === parseInt(table.table_number);
          const isAvailable = table.status === 'VACANT';
          const isSeated = table.status === 'SEATED' || table.status === 'DINING';
          
          // Get linked table color scheme if this table is part of a linked group
          const linkedColor = getLinkedTableColor(table.linked_table_group_id);

          // Determine border and glow based on linked table group or status
          let borderStyle: string;
          let boxShadowStyle: string;
          let backgroundStyle: string;
          
          if (linkedColor) {
            // Linked table gets matching color border/glow
            borderStyle = `2px solid ${linkedColor.border}`;
            boxShadowStyle = `0 0 16px ${linkedColor.glow}, 0 0 24px ${linkedColor.glow}`;
            backgroundStyle = `linear-gradient(135deg, ${linkedColor.background}, ${QSAITheme.background.card})`;
          } else if (isSelected) {
            borderStyle = `2px solid ${QSAITheme.purple.primary}`;
            boxShadowStyle = `0 0 0 1px ${QSAITheme.purple.primary}40, ${effects.outerGlow('medium')}`;
            backgroundStyle = `linear-gradient(135deg, ${QSAITheme.background.card}, ${QSAITheme.purple.primary}15)`;
          } else if (isAvailable) {
            borderStyle = '2px solid rgba(16, 185, 129, 0.3)';
            boxShadowStyle = '0 0 12px rgba(16, 185, 129, 0.25)';
            backgroundStyle = 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.12))';
          } else if (isSeated) {
            borderStyle = '2px solid rgba(124, 93, 250, 0.3)';
            boxShadowStyle = '0 0 12px rgba(124, 93, 250, 0.25)';
            backgroundStyle = 'linear-gradient(135deg, rgba(124, 93, 250, 0.08), rgba(124, 93, 250, 0.12))';
          } else {
            borderStyle = `1px solid ${QSAITheme.border.light}`;
            boxShadowStyle = 'none';
            backgroundStyle = QSAITheme.background.card;
          }
          
          return (
            <Card
              key={table.id}
              className="relative cursor-pointer transition-all duration-200 hover:scale-105"
              style={{
                ...styles.glassCard,
                border: borderStyle,
                boxShadow: boxShadowStyle,
                background: backgroundStyle
              }}
              onClick={() => handleTableSelect(parseInt(table.table_number))}
            >
              {/* Linking Indicator */}
              {(table.is_linked_table || table.is_linked_primary) && (
                <div className="absolute top-2 right-2">
                  <Badge 
                    variant="secondary" 
                    className="text-xs px-1.5 py-0.5"
                    style={{
                      background: linkedColor ? linkedColor.background : QSAITheme.accent.turquoise + '20',
                      color: linkedColor ? linkedColor.primary : QSAITheme.accent.turquoise,
                      border: `1px solid ${linkedColor ? linkedColor.border : QSAITheme.accent.turquoise + '40'}`
                    }}
                  >
                    <Link2 className="h-3 w-3 mr-1 inline" />
                    {getLinkedTableBadgeText(
                      table.is_linked_primary || false,
                      table.linked_with_tables,
                      parseInt(table.table_number)
                    )}
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
                    {table.table_number}
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
                    {table.status === 'VACANT' ? 'Available' : 
                     table.status === 'SEATED' ? 'Seated' :
                     table.status === 'DINING' ? 'Dining' :
                     table.status === 'REQUESTING_CHECK' ? 'Bill Requested' :
                     table.status === 'PAYING' ? 'Payment Processing' :
                     table.status === 'CLEANING' ? 'Cleaning' : 'Unknown'}
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
                      {table.capacity} seats
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
