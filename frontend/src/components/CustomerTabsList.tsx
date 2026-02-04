import React from 'react';
import { Button } from '@/components/ui/button';
import { User, Users } from 'lucide-react';
import { QSAITheme } from 'utils/QSAIDesign';
import { CustomerTab } from '../brain/data-contracts';
import { useTableOrdersStore } from 'utils/tableOrdersStore';

interface Props {
  tableNumber: number;
  activeCustomerTab: CustomerTab | null;
  onCustomerTabSelect: (customerTab: CustomerTab | null) => void;
  className?: string;
}

/**
 * Customer tabs list component for individual customer management within tables
 * Shows horizontal tabs for each customer at the table with QSAI design consistency
 * Enhanced with item count badges and clear visual hierarchy
 */
export function CustomerTabsList({
  tableNumber,
  activeCustomerTab,
  onCustomerTabSelect,
  className
}: Props) {
  // Get customer tabs for current table from store
  const { getCustomerTabsForTable, persistedTableOrders } = useTableOrdersStore();
  const customerTabs = getCustomerTabsForTable(tableNumber);
  
  // Get table-level order items count
  const tableOrder = persistedTableOrders[tableNumber];
  const tableLevelItemCount = tableOrder?.order_items?.length || 0;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Users size={16} style={{ color: QSAITheme.purple.primary }} />
        <span style={{ color: QSAITheme.text.primary }} className="text-sm font-medium">
          Customer Tabs - Table {tableNumber}
        </span>
        {customerTabs.length > 0 && (
          <span style={{ color: QSAITheme.text.muted }} className="text-xs">
            ({customerTabs.length + 1} tab{customerTabs.length > 0 ? 's' : ''})
          </span>
        )}
      </div>

      {/* Customer Tabs Row */}
      <div className="flex gap-2 flex-wrap">
        {/* Table-level tab (default) */}
        <Button
          variant={!activeCustomerTab ? "default" : "outline"}
          size="sm"
          onClick={() => onCustomerTabSelect(null)}
          className="flex items-center gap-2 relative"
          style={{
            backgroundColor: !activeCustomerTab ? QSAITheme.purple.primary : 'transparent',
            borderColor: !activeCustomerTab ? QSAITheme.purple.primary : QSAITheme.border.medium,
            color: !activeCustomerTab ? 'white' : QSAITheme.text.primary,
            boxShadow: !activeCustomerTab ? `0 0 0 2px ${QSAITheme.purple.glow}` : 'none'
          }}
        >
          <Users size={14} />
          Table {tableNumber}
          {tableLevelItemCount > 0 && (
            <span 
              className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: !activeCustomerTab ? 'rgba(255,255,255,0.2)' : QSAITheme.purple.light,
                color: !activeCustomerTab ? 'white' : 'white'
              }}
            >
              {tableLevelItemCount}
            </span>
          )}
        </Button>

        {/* Individual Customer Tabs */}
        {customerTabs.map(customerTab => {
          const isActive = activeCustomerTab?.id === customerTab.id;
          const itemCount = customerTab.order_items?.length || 0;
          
          return (
            <Button
              key={customerTab.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onCustomerTabSelect(customerTab as any)}
              className="flex items-center gap-2 relative"
              style={{
                backgroundColor: isActive ? QSAITheme.purple.primary : 'transparent',
                borderColor: isActive ? QSAITheme.purple.primary : QSAITheme.border.medium,
                color: isActive ? 'white' : QSAITheme.text.primary,
                boxShadow: isActive ? `0 0 0 2px ${QSAITheme.purple.glow}` : 'none'
              }}
            >
              <User size={14} />
              {customerTab.tab_name}
              {customerTab.guest_id && (
                <span className="text-xs opacity-75">#{customerTab.guest_id}</span>
              )}
              {itemCount > 0 && (
                <span 
                  className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : QSAITheme.purple.light,
                    color: 'white'
                  }}
                >
                  {itemCount}
                </span>
              )}
            </Button>
          );
        })}
      </div>
      
      {/* No customer tabs state */}
      {customerTabs.length === 0 && (
        <div 
          className="text-xs p-2 rounded-md text-center"
          style={{ 
            backgroundColor: QSAITheme.background.secondary,
            color: QSAITheme.text.muted,
            border: `1px dashed ${QSAITheme.border.medium}`
          }}
        >
          No individual customer tabs yet. Use "New Customer" to create customer-specific orders.
        </div>
      )}
      
      {/* Active customer tab info */}
      {activeCustomerTab && (
        <div 
          className="text-xs p-2 rounded-md"
          style={{ 
            backgroundColor: QSAITheme.background.secondary,
            color: QSAITheme.text.secondary,
            border: `1px solid ${QSAITheme.purple.primary}20`
          }}
        >
          <span style={{ color: QSAITheme.purple.primary, fontWeight: 'bold' }}>
            {activeCustomerTab.tab_name}
          </span>
          {activeCustomerTab.order_items?.length > 0 ? (
            <span> • {activeCustomerTab.order_items.length} item{activeCustomerTab.order_items.length !== 1 ? 's' : ''}</span>
          ) : (
            <span> • No items yet</span>
          )}
        </div>
      )}
    </div>
  );
}

export default CustomerTabsList;
