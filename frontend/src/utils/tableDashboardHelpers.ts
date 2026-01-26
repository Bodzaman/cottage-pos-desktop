/**
 * Table Dashboard Helpers
 *
 * Utility functions to derive table card display data from existing sources.
 * Used by the DineInTableDashboard for the single-panel table view.
 *
 * SIMPLIFIED 4-STATE SYSTEM (POS-driven, no kitchen input required):
 * - AVAILABLE: Table free
 * - SEATED: Order created, no items yet
 * - ORDERING: Has items not sent to kitchen
 * - SENT_TO_KITCHEN: Items sent, kitchen working
 */

import type { RestaurantTable } from './useRestaurantTables';
import { getTimeOccupied } from './tableTypes';

// ================================
// TYPE DEFINITIONS
// ================================

/**
 * Simplified 4-state system - all statuses driven by POS actions only
 * No kitchen input required
 */
export type TableCardStatus =
  | 'AVAILABLE'        // Table free
  | 'SEATED'           // Order created, no items
  | 'ORDERING'         // Has unsent items
  | 'SENT_TO_KITCHEN'; // Items sent to kitchen

/**
 * Urgency levels for visual indicators (pulsing)
 */
export type UrgencyLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

/**
 * Urgency state for a table
 */
export interface TableUrgency {
  level: UrgencyLevel;
  reason?: string;
  minutesWaiting?: number;
}

/**
 * Urgency settings (configurable via POS Settings)
 */
export interface UrgencySettings {
  enabled: boolean;
  stale_order_hours: number;
  in_kitchen_high_minutes: number;
  seated_medium_minutes: number;
  ordering_medium_minutes: number;
}

/**
 * Default urgency settings
 */
export const DEFAULT_URGENCY_SETTINGS: UrgencySettings = {
  enabled: true,
  stale_order_hours: 8,
  in_kitchen_high_minutes: 45,
  seated_medium_minutes: 10,
  ordering_medium_minutes: 15,
};

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

  // Urgency indicators
  urgency: TableUrgency;

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

  // Financial data
  billTotal: number | null;
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
// STATUS COLORS & LABELS
// ================================

export const STATUS_COLORS: Record<TableCardStatus, string> = {
  AVAILABLE: '#B8D4C8',        // Sage - table free
  SEATED: '#7C5DFA',           // Purple - just sat
  ORDERING: '#F59E0B',         // Amber - adding items
  SENT_TO_KITCHEN: '#3B82F6'   // Blue - in kitchen
};

export const STATUS_LABELS: Record<TableCardStatus, string> = {
  AVAILABLE: 'Available',
  SEATED: 'Seated',
  ORDERING: 'Ordering',
  SENT_TO_KITCHEN: 'In Kitchen'
};

/**
 * Urgency indicator colors
 */
export const URGENCY_COLORS: Record<UrgencyLevel, string> = {
  none: 'transparent',
  low: '#10B981',      // Green - normal
  medium: '#F59E0B',   // Yellow/Amber - needs attention
  high: '#F97316',     // Orange - urgent
  critical: '#EF4444'  // Red - stale/zombie
};

// ================================
// STATUS DERIVATION
// ================================

/**
 * UNIFIED status derivation function.
 * Maps ALL database order statuses to our 4 simplified display states.
 *
 * This is the SINGLE SOURCE OF TRUTH for status display.
 *
 * @param orderStatus - The order status from database (e.g., 'CREATED', 'SENT_TO_KITCHEN', 'PAID')
 * @param hasUnsentItems - Whether order has items not yet sent to kitchen
 * @returns The simplified display status
 */
export function deriveTableCardStatus(
  orderStatus: string | undefined,
  hasUnsentItems: boolean = false
): TableCardStatus {
  if (!orderStatus) return 'AVAILABLE';

  switch (orderStatus) {
    // Order just created - check if items exist
    case 'CREATED':
      return hasUnsentItems ? 'ORDERING' : 'SEATED';

    // All "in kitchen" states map to SENT_TO_KITCHEN
    case 'SENT_TO_KITCHEN':
    case 'IN_PREP':
    case 'READY':
    case 'FOOD_READY':
    case 'SERVED':
    case 'PENDING_PAYMENT':
      return 'SENT_TO_KITCHEN';

    // Terminal states = table available
    case 'PAID':
    case 'COMPLETED':
    case 'CANCELLED':
    case 'CLOSED':
      return 'AVAILABLE';

    default:
      // For any unknown status with an active order, show as SEATED
      return 'SEATED';
  }
}

/**
 * Calculate urgency level for a table based on status and time elapsed.
 * All trigger thresholds are configurable via urgencySettings.
 *
 * @param status - The derived table status
 * @param createdAt - When the order was created
 * @param urgencySettings - Configurable thresholds (optional, uses defaults)
 * @returns Urgency state with level and reason
 */
export function calculateTableUrgency(
  status: TableCardStatus,
  createdAt: Date | null,
  urgencySettings: UrgencySettings = DEFAULT_URGENCY_SETTINGS
): TableUrgency {
  // No urgency for available tables or if disabled
  if (!urgencySettings.enabled || status === 'AVAILABLE' || !createdAt) {
    return { level: 'none' };
  }

  const minutesOccupied = Math.floor((Date.now() - createdAt.getTime()) / 60000);

  // Stale order detection (configurable hours → critical red pulse)
  if (minutesOccupied > urgencySettings.stale_order_hours * 60) {
    return {
      level: 'critical',
      reason: 'Stale order - likely abandoned',
      minutesWaiting: minutesOccupied
    };
  }

  switch (status) {
    case 'SENT_TO_KITCHEN':
      // Long time in kitchen → high urgency (orange pulse)
      if (minutesOccupied > urgencySettings.in_kitchen_high_minutes) {
        return { level: 'high', reason: 'Long kitchen wait', minutesWaiting: minutesOccupied };
      }
      return { level: 'none' };

    case 'ORDERING':
      // Items added but not sent → medium urgency (yellow pulse)
      if (minutesOccupied > urgencySettings.ordering_medium_minutes) {
        return { level: 'medium', reason: 'Items waiting to send', minutesWaiting: minutesOccupied };
      }
      return { level: 'low' };

    case 'SEATED':
      // Just seated, waiting to order → medium urgency (yellow pulse)
      if (minutesOccupied > urgencySettings.seated_medium_minutes) {
        return { level: 'medium', reason: 'Waiting to order', minutesWaiting: minutesOccupied };
      }
      return { level: 'low' };

    default:
      return { level: 'none' };
  }
}

/**
 * Legacy function for backward compatibility.
 * Derives order status from persisted order items.
 * @deprecated Use deriveTableCardStatus instead
 */
export function deriveOrderStatus(
  order: DashboardPersistedOrder | undefined
): 'ORDERING' | 'SENT_TO_KITCHEN' | null {
  if (!order) return null;

  const items = order.items || [];
  if (items.length === 0) return null;

  // Check if any items haven't been sent to kitchen
  const hasUnsentItems = items.some(item => !item.sent_to_kitchen_at);

  return hasUnsentItems ? 'ORDERING' : 'SENT_TO_KITCHEN';
}

/**
 * Legacy function for backward compatibility.
 * Determine the overall table card status.
 * @deprecated Use deriveTableCardStatus instead
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

  if (orderStatus === 'ORDERING') {
    return 'ORDERING';
  }

  if (orderStatus === 'SENT_TO_KITCHEN') {
    return 'SENT_TO_KITCHEN';
  }

  // Default to SEATED if occupied but no items yet
  return 'SEATED';
}

// ================================
// MAIN DERIVATION FUNCTION
// ================================

/**
 * Derive complete table card data from multiple sources
 *
 * @param table - The restaurant table from useRestaurantTables
 * @param persistedTableOrders - Map of table number to persisted orders
 * @param customerTabs - Customer tabs for the table
 * @param urgencySettings - Optional urgency threshold settings
 */
export function deriveTableCardData(
  table: RestaurantTable,
  persistedTableOrders: Record<number, DashboardPersistedOrder>,
  customerTabs: DashboardCustomerTab[],
  urgencySettings: UrgencySettings = DEFAULT_URGENCY_SETTINGS
): TableCardData {
  const tableNumber = parseInt(table.table_number);
  const order = persistedTableOrders[tableNumber];

  // Filter customer tabs for this table (handle both field name conventions)
  const tableTabs = customerTabs.filter(tab => {
    const tabTableNumber = tab.table_number ?? tab.tableId;
    return tabTableNumber === tableNumber;
  });

  // Derive status using the unified function
  const status = deriveTableStatus(table, order);

  // Derive duration
  const seatedAt = order?.created_at ? new Date(order.created_at) : null;
  const durationText = seatedAt ? getTimeOccupied(seatedAt) : '';

  // Calculate urgency
  const urgency = calculateTableUrgency(status, seatedAt, urgencySettings);

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
    urgency,
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
    tabsOverflowCount: overflowCount,
    billTotal: null, // Will be populated from activeOrders in DineInTableDashboard
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
      case 'ORDERING':
        return {
          border: '2px solid rgba(245, 158, 11, 0.50)',
          boxShadow: '0 0 5px rgba(245, 158, 11, 0.40), 0 0 22px rgba(245, 158, 11, 0.12)',
          background: `radial-gradient(ellipse at 35% 25%, rgba(245, 158, 11, 0.08) 0%, transparent 60%), ${BASE_BG}`,
          tableNumberColor: '#F59E0B',
          tableNumberGlow: '0 0 10px rgba(245, 158, 11, 0.45)'
        };
      case 'SENT_TO_KITCHEN':
        return {
          border: '2px solid rgba(59, 130, 246, 0.50)',
          boxShadow: '0 0 5px rgba(59, 130, 246, 0.40), 0 0 22px rgba(59, 130, 246, 0.12)',
          background: `radial-gradient(ellipse at 35% 25%, rgba(59, 130, 246, 0.08) 0%, transparent 60%), ${BASE_BG}`,
          tableNumberColor: '#3B82F6',
          tableNumberGlow: '0 0 10px rgba(59, 130, 246, 0.45)'
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

    case 'ORDERING':
      // Amber neon ring — adding items
      return {
        border: '1px solid rgba(245, 158, 11, 0.30)',
        boxShadow: '0 0 4px rgba(245, 158, 11, 0.25), 0 0 16px rgba(245, 158, 11, 0.08)',
        background: `radial-gradient(ellipse at 35% 25%, rgba(245, 158, 11, 0.04) 0%, transparent 60%), ${BASE_BG}`,
        tableNumberColor: '#F59E0B',
        tableNumberGlow: '0 0 8px rgba(245, 158, 11, 0.30)'
      };

    case 'SENT_TO_KITCHEN':
      // Blue neon ring — in kitchen
      return {
        border: '1px solid rgba(59, 130, 246, 0.30)',
        boxShadow: '0 0 4px rgba(59, 130, 246, 0.25), 0 0 16px rgba(59, 130, 246, 0.08)',
        background: `radial-gradient(ellipse at 35% 25%, rgba(59, 130, 246, 0.04) 0%, transparent 60%), ${BASE_BG}`,
        tableNumberColor: '#3B82F6',
        tableNumberGlow: '0 0 8px rgba(59, 130, 246, 0.30)'
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
