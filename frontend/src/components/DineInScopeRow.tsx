import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, User } from 'lucide-react';
import { QSAITheme } from 'utils/QSAIDesign';
import type { CustomerTab } from 'types';

interface DineInScopeRowProps {
  tableNumber: number;
  customerTabs: CustomerTab[];
  activeTabId: string | null;
  onTabSelect: (tabId: string | null) => void;
  onCreateTab: () => void;
  className?: string;
}

/**
 * Scope row showing table + customer pills.
 * Provides navigation between table-level order and individual customer tabs.
 *
 * Features:
 * - Height: 44px
 * - Table pill (purple, shows current table number)
 * - Customer pills (one per active tab)
 * - "+ New Customer" button
 * - Horizontal scroll if many customers
 */
export function DineInScopeRow({
  tableNumber,
  customerTabs,
  activeTabId,
  onTabSelect,
  onCreateTab,
  className = '',
}: DineInScopeRowProps) {
  const isTableSelected = activeTabId === null;

  return (
    <div
      className={`flex items-center gap-2 h-[44px] px-4 overflow-x-auto scrollbar-hide ${className}`}
      style={{
        backgroundColor: QSAITheme.background.secondary,
        borderBottom: `1px solid ${QSAITheme.border.light}`,
      }}
    >
      {/* Table pill - always visible */}
      <Button
        variant={isTableSelected ? 'default' : 'outline'}
        size="sm"
        className="flex items-center gap-1.5 h-8 px-3 flex-shrink-0"
        onClick={() => onTabSelect(null)}
        style={{
          backgroundColor: isTableSelected ? QSAITheme.purple.primary : 'transparent',
          borderColor: isTableSelected ? QSAITheme.purple.primary : QSAITheme.border.medium,
          color: isTableSelected ? 'white' : QSAITheme.text.secondary,
        }}
      >
        <Users className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">Table {tableNumber}</span>
      </Button>

      {/* Divider */}
      {customerTabs.length > 0 && (
        <div
          className="w-px h-5 flex-shrink-0"
          style={{ backgroundColor: QSAITheme.border.medium }}
        />
      )}

      {/* Customer tabs */}
      {customerTabs.map((tab) => {
        const isActive = activeTabId === tab.id;
        const itemCount = tab.order_items?.length || 0;

        return (
          <Button
            key={tab.id}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            className="flex items-center gap-1.5 h-8 px-3 flex-shrink-0"
            onClick={() => onTabSelect(tab.id)}
            style={{
              backgroundColor: isActive ? QSAITheme.purple.primary : 'transparent',
              borderColor: isActive ? QSAITheme.purple.primary : QSAITheme.border.medium,
              color: isActive ? 'white' : QSAITheme.text.secondary,
            }}
          >
            <User className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{tab.tab_name}</span>
            {itemCount > 0 && (
              <Badge
                className="h-4 px-1 text-[10px]"
                style={{
                  backgroundColor: isActive
                    ? 'rgba(255,255,255,0.2)'
                    : `${QSAITheme.purple.primary}20`,
                  color: isActive ? 'white' : QSAITheme.purple.light,
                }}
              >
                {itemCount}
              </Badge>
            )}
          </Button>
        );
      })}

      {/* Add new customer button */}
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-1 h-8 px-2 flex-shrink-0"
        onClick={onCreateTab}
        style={{ color: QSAITheme.text.muted }}
      >
        <Plus className="h-3.5 w-3.5" />
        <span className="text-xs">New Customer</span>
      </Button>
    </div>
  );
}

export default DineInScopeRow;
