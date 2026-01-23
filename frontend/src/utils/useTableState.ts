import { useMemo } from 'react';
import { useRestaurantTables } from './useRestaurantTables';
import { useActiveOrders } from './useActiveOrders';
import type {
  TableConfig,
  TableState,
  DineInOrder,
  TableDisplayStatus,
  LinkedTableGroup,
  LinkedTableColor
} from '../types/dine-in';
import { deriveTableDisplayStatus, isOrderActive, calculateDuration } from '../types/dine-in';

/**
 * Unified Table State Hook
 *
 * This is the SINGLE SOURCE OF TRUTH for table state in the dine-in system.
 * It combines:
 * - Static table configuration (from pos_tables)
 * - Runtime order state (from orders table)
 *
 * Key principle: Orders are the source of truth. Tables are just configuration.
 * All runtime state (occupied, guest count, linking) is derived from orders.
 */

// Linked table color schemes for visual grouping
const LINKED_TABLE_COLORS: LinkedTableColor[] = [
  {
    name: 'purple',
    primary: '#A855F7',
    glow: 'rgba(168, 85, 247, 0.5)',
    background: 'rgba(168, 85, 247, 0.1)',
    border: 'rgba(168, 85, 247, 0.5)'
  },
  {
    name: 'cyan',
    primary: '#06B6D4',
    glow: 'rgba(6, 182, 212, 0.5)',
    background: 'rgba(6, 182, 212, 0.1)',
    border: 'rgba(6, 182, 212, 0.5)'
  },
  {
    name: 'orange',
    primary: '#F97316',
    glow: 'rgba(249, 115, 22, 0.5)',
    background: 'rgba(249, 115, 22, 0.1)',
    border: 'rgba(249, 115, 22, 0.5)'
  },
  {
    name: 'pink',
    primary: '#EC4899',
    glow: 'rgba(236, 72, 153, 0.5)',
    background: 'rgba(236, 72, 153, 0.1)',
    border: 'rgba(236, 72, 153, 0.5)'
  },
  {
    name: 'green',
    primary: '#22C55E',
    glow: 'rgba(34, 197, 94, 0.5)',
    background: 'rgba(34, 197, 94, 0.1)',
    border: 'rgba(34, 197, 94, 0.5)'
  }
];

// Map group IDs to colors (rotating through available colors)
const groupColorMap = new Map<string, LinkedTableColor>();
let colorIndex = 0;

function getColorForGroup(groupId: string): LinkedTableColor {
  if (!groupColorMap.has(groupId)) {
    groupColorMap.set(groupId, LINKED_TABLE_COLORS[colorIndex % LINKED_TABLE_COLORS.length]);
    colorIndex++;
  }
  return groupColorMap.get(groupId)!;
}

/**
 * Find the order associated with a table
 * Checks both tableId and linkedTables array
 */
function findOrderForTable(orders: DineInOrder[], tableId: string, tableNumber: number): DineInOrder | undefined {
  // First, check for direct table_id match
  const directMatch = orders.find(order =>
    order.tableId === tableId && isOrderActive(order.status)
  );
  if (directMatch) return directMatch;

  // Then check if this table is in any order's linkedTables
  const linkedMatch = orders.find(order =>
    order.linkedTables.includes(tableNumber) && isOrderActive(order.status)
  );

  return linkedMatch;
}

/**
 * Derive complete TableState from TableConfig and optional order
 */
function deriveTableState(
  table: TableConfig,
  order: DineInOrder | undefined,
  allOrders: DineInOrder[]
): TableState {
  const isOccupied = !!order && isOrderActive(order.status);

  // Determine if this table is linked and if it's the primary
  const isLinked = isOccupied && order && order.linkedTables.length > 1;
  const isPrimary = isOccupied && order && order.tableId === table.id;

  // Get linked table numbers (excluding self)
  const linkedWith = isLinked && order
    ? order.linkedTables.filter(tn => tn !== table.tableNumber)
    : [];

  // Calculate duration if occupied
  const duration = isOccupied && order ? calculateDuration(order.createdAt) : undefined;

  // Get customer tab names (would need to fetch from customer_tabs table)
  // For now, this is a placeholder - tabs will be loaded separately
  const customerTabNames: string[] = [];
  const hasMultipleTabs = false;

  return {
    // Base table config
    id: table.id,
    tableNumber: table.tableNumber,
    capacity: table.capacity,
    section: table.section,
    shape: table.shape,
    position: table.position,

    // Derived state from order
    isOccupied,
    guestCount: isOccupied && order ? order.guestCount : null,
    status: deriveTableDisplayStatus(order),
    activeOrderId: isOccupied && order ? order.id : undefined,
    duration,

    // Linking state (derived from order)
    isLinked: !!isLinked,
    isPrimary: !!isPrimary,
    linkedWith,
    linkedGroupId: isOccupied && order ? order.tableGroupId : undefined,

    // Customer tabs
    customerTabNames,
    hasMultipleTabs
  };
}

export interface UseTableStateReturn {
  tableStates: TableState[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getTableState: (tableNumber: number) => TableState | undefined;
  getTableStateById: (tableId: string) => TableState | undefined;
  linkedGroups: LinkedTableGroup[];
  getColorForLinkedGroup: (groupId: string) => LinkedTableColor;
  occupiedCount: number;
  availableCount: number;
}

/**
 * Main hook for unified table state
 *
 * Usage:
 * ```
 * const { tableStates, loading, getTableState } = useTableState();
 *
 * tableStates.map(table => (
 *   <TableCard
 *     key={table.id}
 *     table={table}
 *     isOccupied={table.isOccupied}
 *     guestCount={table.guestCount}
 *     isLinked={table.isLinked}
 *   />
 * ));
 * ```
 */
export function useTableState(): UseTableStateReturn {
  // Get table configuration
  const {
    tables: rawTables,
    loading: tablesLoading,
    error: tablesError,
    refetch: refetchTables
  } = useRestaurantTables();

  // Get active orders
  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders
  } = useActiveOrders();

  // Transform raw tables to TableConfig
  const tableConfigs = useMemo((): TableConfig[] => {
    return rawTables.map(t => ({
      id: t.id,
      tableNumber: parseInt(t.table_number, 10),
      capacity: t.capacity,
      section: t.section || undefined,
      shape: undefined, // Not stored in current pos_tables
      position: undefined // Not stored in current pos_tables
    }));
  }, [rawTables]);

  // Derive table states from configs + orders
  const tableStates = useMemo((): TableState[] => {
    return tableConfigs.map(table => {
      const order = findOrderForTable(orders, table.id, table.tableNumber);
      return deriveTableState(table, order, orders);
    });
  }, [tableConfigs, orders]);

  // Calculate linked groups
  const linkedGroups = useMemo((): LinkedTableGroup[] => {
    const groups: LinkedTableGroup[] = [];
    const processedGroups = new Set<string>();

    orders.forEach(order => {
      if (order.linkedTables.length > 1 && isOrderActive(order.status)) {
        // Generate a group ID if not present
        const groupId = order.tableGroupId || `auto-${order.id}`;

        if (!processedGroups.has(groupId)) {
          processedGroups.add(groupId);

          // Find primary table number
          const primaryTable = tableConfigs.find(t => t.id === order.tableId);
          const primaryTableNumber = primaryTable?.tableNumber || order.tableNumber || 0;

          groups.push({
            groupId,
            primaryTableNumber,
            tableNumbers: order.linkedTables,
            totalGuestCount: order.guestCount,
            orderId: order.id
          });
        }
      }
    });

    return groups;
  }, [orders, tableConfigs]);

  // Combined refetch
  const refetch = async () => {
    await Promise.all([refetchTables(), refetchOrders()]);
  };

  // Helper: Get table state by number
  const getTableState = (tableNumber: number): TableState | undefined => {
    return tableStates.find(t => t.tableNumber === tableNumber);
  };

  // Helper: Get table state by ID
  const getTableStateById = (tableId: string): TableState | undefined => {
    return tableStates.find(t => t.id === tableId);
  };

  // Stats
  const occupiedCount = tableStates.filter(t => t.isOccupied).length;
  const availableCount = tableStates.filter(t => !t.isOccupied).length;

  return {
    tableStates,
    loading: tablesLoading || ordersLoading,
    error: tablesError || ordersError,
    refetch,
    getTableState,
    getTableStateById,
    linkedGroups,
    getColorForLinkedGroup: getColorForGroup,
    occupiedCount,
    availableCount
  };
}

/**
 * Hook to get state for a specific table with real-time updates
 */
export function useSingleTableState(tableNumber: number) {
  const { tableStates, loading, error, refetch } = useTableState();

  const tableState = useMemo(() => {
    return tableStates.find(t => t.tableNumber === tableNumber);
  }, [tableStates, tableNumber]);

  return {
    tableState,
    loading,
    error,
    refetch
  };
}

// Export colors for external use
export { LINKED_TABLE_COLORS, getColorForGroup };
