/**
 * Table Dashboard Helpers
 *
 * Utility functions to derive table card display data from existing sources.
 * Used by the DineInTableDashboard for the single-panel table view.
 */

import type { RestaurantTable } from './useRestaurantTables';
import { getTimeOccupied } from './tableTypes';

// ================================
// TYPE DEFINITIONS
// ================================

export type TableCardStatus = 'AVAILABLE' | 'SEATED' | 'AWAITING_ORDER' | 'FOOD_SENT';

export interface TableCardData {
  // Core identifiers
  tableNumber: number;
  tableUuid: string;

  // Capacity & Guest info
  capacity: number;
  guestCount: number | null;

  // Status
  status: TableCardStatus;
  statusLabel: string;
  statusColor: string;

  // Timing
  seatedAt: Date | null;
  durationText: string;

  // Linked tables
  isLinked: boolean;
  isPrimary: boolean;
  linkedTableNumbers: number[];
  linkedDisplay: string | null;
  linkedTableGroupId: string | null; // For color map lookup

  // Customer tabs
  tabNames: string[];
  hasMultipleTabs: boolean;
  tabsDisplay: string | null;
  tabsDisplayFormatted: string | null; // Shows first 1-2 names + "+X" if more
  tabsOverflowCount: number; // Number of additional tabs not shown
}

// Customer tab interface (simplified for dashboard use)
// Supports both snake_case (from Supabase) and camelCase (from types)
export interface DashboardCustomerTab {
  id: string;
  table_number?: number;
  tableId?: number;
  tab_name?: string;
  name?: string;
}

// Persisted order interface (from tableOrdersStore)
export interface DashboardPersistedOrder {
  id: string;
  table_number: number;
  guest_count?: number;
  created_at?: string;
  items?: Array<{
    id: string;
    sent_to_kitchen_at?: string | null;
    status?: string;
  }>;
}

// ================================
// STATUS COLORS
// ================================

export const STATUS_COLORS: Record<TableCardStatus, string> = {
  AVAILABLE: '#10B981',      // Emerald green
  SEATED: '#7C5DFA',         // Purple
  AWAITING_ORDER: '#F59E0B', // Amber
  FOOD_SENT: '#9277FF'       // Light purple
};

export const STATUS_LABELS: Record<TableCardStatus, string> = {
  AVAILABLE: 'Empty',
  SEATED: 'Seated',
  AWAITING_ORDER: 'Awaiting Order',
  FOOD_SENT: 'Food Sent'
};

// ================================
// STATUS DERIVATION
// ================================

/**
 * Derive order status from persisted order items
 */
export function deriveOrderStatus(
  order: DashboardPersistedOrder | undefined
): 'AWAITING_ORDER' | 'FOOD_SENT' | null {
  if (!order) return null;

  const items = order.items || [];
  if (items.length === 0) return null;

  // Check if any items haven't been sent to kitchen
  const hasUnsentItems = items.some(item => !item.sent_to_kitchen_at);

  return hasUnsentItems ? 'AWAITING_ORDER' : 'FOOD_SENT';
}

/**
 * Determine the overall table card status
 */
export function deriveTableStatus(
  table: RestaurantTable,
  order: DashboardPersistedOrder | undefined
): TableCardStatus {
  // Check if table has an order (is occupied)
  const isOccupied = order !== undefined ||
    table.status === 'SEATED' ||
    table.status === 'DINING';

  if (!isOccupied) {
    return 'AVAILABLE';
  }

  // If occupied, check order status
  const orderStatus = deriveOrderStatus(order);

  if (orderStatus === 'AWAITING_ORDER') {
    return 'AWAITING_ORDER';
  }

  if (orderStatus === 'FOOD_SENT') {
    return 'FOOD_SENT';
  }

  // Default to SEATED if occupied but no items yet
  return 'SEATED';
}

// ================================
// MAIN DERIVATION FUNCTION
// ================================

/**
 * Derive complete table card data from multiple sources
 */
export function deriveTableCardData(
  table: RestaurantTable,
  persistedTableOrders: Record<number, DashboardPersistedOrder>,
  customerTabs: DashboardCustomerTab[]
): TableCardData {
  const tableNumber = parseInt(table.table_number);
  const order = persistedTableOrders[tableNumber];

  // Filter customer tabs for this table (handle both field name conventions)
  const tableTabs = customerTabs.filter(tab => {
    const tabTableNumber = tab.table_number ?? tab.tableId;
    return tabTableNumber === tableNumber;
  });

  // Derive status
  const status = deriveTableStatus(table, order);

  // Derive duration
  const seatedAt = order?.created_at ? new Date(order.created_at) : null;
  const durationText = seatedAt ? getTimeOccupied(seatedAt) : '';

  // Derive linked tables display
  const isLinked = table.is_linked_table || table.is_linked_primary || false;
  const linkedTableNumbers = table.linked_with_tables || [];
  const linkedDisplay = linkedTableNumbers.length > 0
    ? `Linked: T${linkedTableNumbers.join(' + T')}`
    : null;

  // Derive customer tabs display (handle both field name conventions)
  const tabNames = tableTabs
    .map(tab => tab.tab_name ?? tab.name)
    .filter((name): name is string => !!name);
  const tabsDisplay = tabNames.length > 0 ? tabNames.join(', ') : null;

  // Create formatted display with "+X" for overflow (show max 2 names)
  const MAX_VISIBLE_TABS = 2;
  const visibleTabNames = tabNames.slice(0, MAX_VISIBLE_TABS);
  const overflowCount = Math.max(0, tabNames.length - MAX_VISIBLE_TABS);
  const tabsDisplayFormatted = tabNames.length > 0
    ? overflowCount > 0
      ? `${visibleTabNames.join(', ')} +${overflowCount}`
      : visibleTabNames.join(', ')
    : null;

  return {
    tableNumber,
    tableUuid: table.id,
    capacity: table.capacity,
    guestCount: order?.guest_count || null,
    status,
    statusLabel: STATUS_LABELS[status],
    statusColor: STATUS_COLORS[status],
    seatedAt,
    durationText,
    isLinked,
    isPrimary: table.is_linked_primary || false,
    linkedTableNumbers,
    linkedDisplay,
    linkedTableGroupId: table.linked_table_group_id || null,
    tabNames,
    hasMultipleTabs: tableTabs.length > 1,
    tabsDisplay,
    tabsDisplayFormatted,
    tabsOverflowCount: overflowCount
  };
}

// ================================
// CARD STYLING HELPERS
// ================================

export interface CardStyles {
  border: string;
  boxShadow: string;
  background: string;
  tableNumberColor: string;
}

/**
 * Get card styles based on status
 */
export function getCardStyles(status: TableCardStatus, isSelected: boolean = false): CardStyles {
  const color = STATUS_COLORS[status];

  if (isSelected) {
    return {
      border: `2px solid ${color}`,
      boxShadow: `0 0 0 1px ${color}40, 0 0 20px ${color}30`,
      background: `linear-gradient(135deg, rgba(18, 18, 18, 0.95), ${color}15)`,
      tableNumberColor: color
    };
  }

  switch (status) {
    case 'AVAILABLE':
      return {
        border: '2px solid rgba(16, 185, 129, 0.3)',
        boxShadow: '0 0 16px rgba(16, 185, 129, 0.25)',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.12))',
        tableNumberColor: '#10B981'
      };

    case 'SEATED':
    case 'FOOD_SENT':
      return {
        border: '2px solid rgba(124, 93, 250, 0.3)',
        boxShadow: '0 0 16px rgba(124, 93, 250, 0.25)',
        background: 'linear-gradient(135deg, rgba(124, 93, 250, 0.08), rgba(124, 93, 250, 0.12))',
        tableNumberColor: '#7C5DFA'
      };

    case 'AWAITING_ORDER':
      return {
        border: '2px solid rgba(245, 158, 11, 0.3)',
        boxShadow: '0 0 16px rgba(245, 158, 11, 0.25)',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.12))',
        tableNumberColor: '#F59E0B'
      };

    default:
      return {
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: 'none',
        background: 'rgba(18, 18, 18, 0.8)',
        tableNumberColor: '#E0E0E0'
      };
  }
}

/**
 * Get badge styles for status indicators
 */
export function getStatusBadgeStyles(status: TableCardStatus): { background: string; color: string; border: string } {
  const color = STATUS_COLORS[status];

  return {
    background: `${color}20`,
    color: color,
    border: `1px solid ${color}40`
  };
}
