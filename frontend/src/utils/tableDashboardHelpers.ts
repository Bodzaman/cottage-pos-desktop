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
  AVAILABLE: '#B8D4C8',      // Muted sage/mint
  SEATED: '#7C5DFA',         // Purple
  AWAITING_ORDER: '#F59E0B', // Muted amber
  FOOD_SENT: '#D4A017'       // Warm gold/amber
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
  tableNumberGlow: string;
}

/**
 * Get card styles based on status.
 * Three-layer lighting: (1) thin neon ring on edge, (2) diffused backlight for depth,
 * (3) faint internal radial gradient for surface richness.
 */
export function getCardStyles(status: TableCardStatus, isSelected: boolean = false): CardStyles {
  const BASE_BG = 'rgba(24, 24, 27, 0.95)';

  if (isSelected) {
    switch (status) {
      case 'AVAILABLE':
        return {
          border: '2px solid rgba(160, 200, 180, 0.50)',
          boxShadow: '0 0 5px rgba(160, 200, 180, 0.40), 0 0 22px rgba(160, 200, 180, 0.12)',
          background: `radial-gradient(ellipse at 35% 25%, rgba(160, 200, 180, 0.08) 0%, transparent 60%), ${BASE_BG}`,
          tableNumberColor: '#D0EAE0',
          tableNumberGlow: '0 0 8px rgba(160, 200, 180, 0.40)'
        };
      case 'SEATED':
        return {
          border: '2px solid rgba(124, 93, 250, 0.50)',
          boxShadow: '0 0 5px rgba(124, 93, 250, 0.40), 0 0 22px rgba(124, 93, 250, 0.15)',
          background: `radial-gradient(ellipse at 35% 25%, rgba(124, 93, 250, 0.08) 0%, transparent 60%), ${BASE_BG}`,
          tableNumberColor: '#7C5DFA',
          tableNumberGlow: '0 0 10px rgba(124, 93, 250, 0.50)'
        };
      case 'AWAITING_ORDER':
        return {
          border: '2px solid rgba(245, 158, 11, 0.50)',
          boxShadow: '0 0 5px rgba(245, 158, 11, 0.40), 0 0 22px rgba(245, 158, 11, 0.12)',
          background: `radial-gradient(ellipse at 35% 25%, rgba(245, 158, 11, 0.08) 0%, transparent 60%), ${BASE_BG}`,
          tableNumberColor: '#F59E0B',
          tableNumberGlow: '0 0 10px rgba(245, 158, 11, 0.45)'
        };
      case 'FOOD_SENT':
        return {
          border: '2px solid rgba(212, 160, 23, 0.50)',
          boxShadow: '0 0 5px rgba(212, 160, 23, 0.40), 0 0 22px rgba(212, 160, 23, 0.12)',
          background: `radial-gradient(ellipse at 35% 25%, rgba(212, 160, 23, 0.08) 0%, transparent 60%), ${BASE_BG}`,
          tableNumberColor: '#D4A017',
          tableNumberGlow: '0 0 10px rgba(212, 160, 23, 0.45)'
        };
      default:
        return {
          border: '2px solid rgba(255, 255, 255, 0.25)',
          boxShadow: '0 0 5px rgba(255, 255, 255, 0.20), 0 0 18px rgba(255, 255, 255, 0.06)',
          background: BASE_BG,
          tableNumberColor: '#E0E0E0',
          tableNumberGlow: 'none'
        };
    }
  }

  switch (status) {
    case 'AVAILABLE':
      // Muted sage/mint — calm, ready, with subtle depth
      return {
        border: '1px solid rgba(160, 200, 180, 0.15)',
        boxShadow: '0 0 3px rgba(160, 200, 180, 0.12), 0 0 15px rgba(160, 200, 180, 0.05)',
        background: `radial-gradient(ellipse at 35% 25%, rgba(160, 200, 180, 0.035) 0%, transparent 60%), ${BASE_BG}`,
        tableNumberColor: '#B8D4C8',
        tableNumberGlow: '0 0 6px rgba(160, 200, 180, 0.20)'
      };

    case 'SEATED':
      // Purple neon ring — activated, strongest presence
      return {
        border: '1px solid rgba(124, 93, 250, 0.35)',
        boxShadow: '0 0 4px rgba(124, 93, 250, 0.30), 0 0 18px rgba(124, 93, 250, 0.10)',
        background: `radial-gradient(ellipse at 35% 25%, rgba(124, 93, 250, 0.05) 0%, transparent 60%), ${BASE_BG}`,
        tableNumberColor: '#7C5DFA',
        tableNumberGlow: '0 0 8px rgba(124, 93, 250, 0.35)'
      };

    case 'AWAITING_ORDER':
      // Amber neon ring — urgency
      return {
        border: '1px solid rgba(245, 158, 11, 0.30)',
        boxShadow: '0 0 4px rgba(245, 158, 11, 0.25), 0 0 16px rgba(245, 158, 11, 0.08)',
        background: `radial-gradient(ellipse at 35% 25%, rgba(245, 158, 11, 0.04) 0%, transparent 60%), ${BASE_BG}`,
        tableNumberColor: '#F59E0B',
        tableNumberGlow: '0 0 8px rgba(245, 158, 11, 0.30)'
      };

    case 'FOOD_SENT':
      // Warm gold neon ring
      return {
        border: '1px solid rgba(212, 160, 23, 0.30)',
        boxShadow: '0 0 4px rgba(212, 160, 23, 0.25), 0 0 16px rgba(212, 160, 23, 0.08)',
        background: `radial-gradient(ellipse at 35% 25%, rgba(212, 160, 23, 0.04) 0%, transparent 60%), ${BASE_BG}`,
        tableNumberColor: '#D4A017',
        tableNumberGlow: '0 0 8px rgba(212, 160, 23, 0.30)'
      };

    default:
      return {
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: 'none',
        background: BASE_BG,
        tableNumberColor: '#E0E0E0',
        tableNumberGlow: 'none'
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
