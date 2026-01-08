import { TableData, TableOrderItem, TableOrder, TableStatus } from './tableTypes';

// Simple print job interface for logging
interface PrintJob {
  id: string;
  type: string;
  data: any;
}

export type PrintJobType = 'KITCHEN_TICKET' | 'CUSTOMER_BILL' | 'PAYMENT_RECEIPT';

/**
 * Kitchen workflow provides utilities for the DINE-IN flow between
 * front-of-house operations and kitchen operations
 */

// Represents a kitchen ticket for an order
export interface KitchenTicket {
  id: string;
  orderId: string;
  tableNumber: number;
  printedAt: Date;
  items: string[]; // IDs of items included in this ticket
  isNewItemsOnly: boolean;
  printJob: PrintJob | null;
}

// Represents a customer bill
export interface CustomerBill {
  id: string;
  orderId: string;
  tableNumber: number;
  printedAt: Date;
  total: number;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  serviceChargePercent: number;
  discountAmount: number;
  discountPercent: number;
  printJob: PrintJob | null;
}

// Get only new items from a table order
export const getNewOrderItems = (tableData: TableData): TableOrderItem[] => {
  if (!tableData.activeOrderId) return [];
  
  const activeOrder = tableData.orders.find(order => order.orderId === tableData.activeOrderId);
  if (!activeOrder) return [];
  
  return activeOrder.items.filter(item => !item.sentToKitchen || item.isNewItem);
};

// Check if a table has new items not yet sent to kitchen
export const tableHasNewItems = (tableData: TableData): boolean => {
  return getNewOrderItems(tableData).length > 0;
};

// Check if all items in an order have been sent to kitchen
export const allItemsSentToKitchen = (order: TableOrder): boolean => {
  return order.items.length > 0 && order.items.every(item => item.sentToKitchen);
};

// Track progress of kitchen items (for future KDS integration)
export const updateKitchenItemStatus = (
  order: TableOrder,
  itemId: string,
  newStatus: 'NEW' | 'PREPARING' | 'READY' | 'SERVED'
): TableOrder => {
  return {
    ...order,
    items: order.items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          itemStatus: newStatus,
          // Update timestamps based on status changes
          ...(newStatus === 'READY' && { readyAt: new Date() }),
          ...(newStatus === 'SERVED' && { servedAt: new Date() })
        };
      }
      return item;
    })
  };
};

// Generate a kitchen ticket ID
export const generateKitchenTicketId = (): string => {
  return `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
};

// Generate a bill ID
export const generateBillId = (): string => {
  return `bill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
};