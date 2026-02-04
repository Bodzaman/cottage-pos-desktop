import { OrderItem } from '../utils/types';
import { TableStatus, TableOrderItem, TableOrder, TableData } from '../utils/tableTypes';

/**
 * Helper functions for tracking orders in the DINE-IN workflow
 */

// Maps item status to human readable text
export const getItemStatusText = (status: 'NEW' | 'PREPARING' | 'READY' | 'SERVED'): string => {
  switch (status) {
    case 'NEW': return 'New Item';
    case 'PREPARING': return 'In Kitchen';
    case 'READY': return 'Ready to Serve';
    case 'SERVED': return 'Served';
    default: return 'Unknown';
  }
};

// Maps item status to a color
export const getItemStatusColor = (status: 'NEW' | 'PREPARING' | 'READY' | 'SERVED'): string => {
  switch (status) {
    case 'NEW': return 'amber';
    case 'PREPARING': return 'blue';
    case 'READY': return 'green';
    case 'SERVED': return 'gray';
    default: return 'gray';
  }
};

// Checks if a table has an open order
export const tableHasActiveOrder = (table: TableData): boolean => {
  return table.activeOrderId !== null;
};

// Gets the active order for a table or undefined if no active order
export const getActiveOrder = (table: TableData): TableOrder | undefined => {
  if (!table.activeOrderId) return undefined;
  return table.orders.find(order => order.orderId === table.activeOrderId);
};

// Gets all new items from an order (not sent to kitchen)
export const getNewItems = (order: TableOrder): TableOrderItem[] => {
  return order.items.filter(item => !item.sentToKitchen || item.isNewItem);
};

// Converts regular menu items to table order items
export const convertOrderItemsToTableItems = (orderItems: OrderItem[]): TableOrderItem[] => {
  return orderItems.map(item => ({
    ...item,
    sentToKitchen: false,
    addedAt: new Date(),
    printedOnTicket: false,
    itemStatus: 'NEW' as const,
    isNewItem: true,
  } as TableOrderItem));
};

// Generates a formatted order/bill number for printing
export const generateFormattedOrderNumber = (orderId: string): string => {
  // Extract numeric part if exists, or use timestamp
  const numericPart = orderId.match(/\d+/);
  if (numericPart) {
    return numericPart[0].substring(0, 6).padStart(6, '0');
  }

  // Fallback to timestamp
  return Date.now().toString().substring(7);
};

/**
 * Hook for tracking orders with real-time updates
 * Used by LiveNotificationSystem for order status notifications
 */
export interface OrderTrackingResult {
  orders: TableOrder[];
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  lastEvent: {
    type: string;
    eventType?: 'INSERT' | 'UPDATE' | 'DELETE';
    orderId?: string;
    orderData?: any;
    previousData?: any;
    timestamp: Date;
  } | null;
}

export interface UseOrderTrackingOptions {
  userId?: string;
  enabled?: boolean;
}

export function useOrderTracking(options: UseOrderTrackingOptions = {}): OrderTrackingResult {
  // Stub implementation - returns empty state
  // Real implementation would connect to Supabase realtime
  return {
    orders: [],
    connectionStatus: 'disconnected',
    lastEvent: null,
  };
}