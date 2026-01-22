import { TableData, TableOrder, TableOrderItem, markItemsAsSentToKitchen, getNewItems, TableStatus } from './tableTypes';

// Simple print job interface for logging
interface PrintJob {
  id: string;
  type: string;
  data: any;
}

export type PrintJobType = 'KITCHEN_TICKET' | 'CUSTOMER_BILL' | 'PAYMENT_RECEIPT';

export interface KitchenWorkflowResult {
  success: boolean;
  tableNumber: number;
  ticketId: string;
  items: TableOrderItem[];
  orderId: string;
}

export interface BillResult {
  success: boolean;
  tableNumber: number;
  billId: string;
  totalAmount: number;
  orderId: string;
}

// In-memory table storage for workflow operations
const tableDataStore: Map<number, TableData> = new Map();

// Service to handle kitchen workflow operations
export class KitchenWorkflowService {
  private static instance: KitchenWorkflowService;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): KitchenWorkflowService {
    if (!KitchenWorkflowService.instance) {
      KitchenWorkflowService.instance = new KitchenWorkflowService();
    }
    return KitchenWorkflowService.instance;
  }

  // Get table data from store
  private getTableData(tableNumber: number): TableData | null {
    return tableDataStore.get(tableNumber) || null;
  }

  // Get active order from table
  private getActiveOrder(table: TableData): TableOrder | null {
    if (!table.activeOrderId) return null;
    return table.orders.find(order => order.orderId === table.activeOrderId) || null;
  }

  // Send a table's order to the kitchen
  // Send order to kitchen and print kitchen ticket
  public sendToKitchen(tableNumber: number, activeOrderId: string): Promise<KitchenWorkflowResult | null> {
    // Get active table
    const activeTable = this.getTableData(tableNumber);
    if (!activeTable) return Promise.resolve(null);

    // Get active order
    const activeOrder = this.getActiveOrder(activeTable);
    if (!activeOrder) return Promise.resolve(null);

    // Get new/unsent items
    const itemsToSend = getNewItems(activeOrder.items);
    const newItemsOnly = true;

    // If no new items, return
    if (itemsToSend.length === 0) {
      return Promise.resolve(null);
    }

    // Log kitchen ticket processing
    console.log('Sending to kitchen:', {
      tableNumber,
      orderId: activeOrderId,
      itemCount: itemsToSend.length
    });

    return Promise.resolve({
      id: `ticket_${Date.now()}`,
      type: 'KITCHEN_TICKET' as PrintJobType,
      data: { tableNumber, items: itemsToSend, orderId: activeOrderId }
    }).then(kitchenTicket => {
      if (kitchenTicket) {
        // Mark all items as sent to kitchen
        const updatedItems = markItemsAsSentToKitchen(activeOrder.items);

        // Create kitchen ticket record
        const kitchenTicketId = `ticket_${Date.now()}`;
        const kitchenTicketRecord = {
          id: kitchenTicketId,
          printedAt: new Date(),
          items: itemsToSend.map(item => item.id),
          isNewItemsOnly: newItemsOnly
        };

        // Return the result
        return {
          success: true,
          tableNumber,
          ticketId: kitchenTicketId,
          items: itemsToSend,
          orderId: activeOrderId
        };
      }
      return null;
    });
  }

  // Print a bill for a table
  public printBill(tableNumber: number, activeOrderId: string): Promise<BillResult | null> {
    // Get active table
    const activeTable = this.getTableData(tableNumber);
    if (!activeTable) return Promise.resolve(null);

    // Get active order
    const activeOrder = this.getActiveOrder(activeTable);
    if (!activeOrder) return Promise.resolve(null);

    // Calculate total amount
    const totalAmount = activeOrder.items.reduce((total, item) => {
      let itemTotal = item.price * item.quantity;

      // Add modifier prices
      if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach(group => {
          group.options.forEach(option => {
            itemTotal += option.price * item.quantity;
          });
        });
      }
      return total + itemTotal;
    }, 0);

    // Log customer bill processing
    console.log('Printing bill:', {
      tableNumber,
      orderId: activeOrderId,
      totalAmount
    });

    return Promise.resolve({
      id: `bill_${Date.now()}`,
      type: 'CUSTOMER_BILL' as PrintJobType,
      data: { tableNumber, totalAmount, orderId: activeOrderId }
    }).then(billJob => {
      if (billJob) {
        return {
          success: true,
          tableNumber,
          billId: billJob.id,
          totalAmount,
          orderId: activeOrderId
        };
      }
      return null;
    });
  }

  // Add items to an existing order
  public addItemsToOrder(
    tableNumber: number,
    newItems: TableOrderItem[],
    updateTableData: (updatedTable: TableData) => void,
    table: TableData
  ): boolean {
    try {
      // Get the active order
      const activeOrderId = table.activeOrderId;
      if (!activeOrderId) {
        console.error('No active order found for table', tableNumber);
        return false;
      }

      const activeOrder = table.orders.find(order => order.orderId === activeOrderId);
      if (!activeOrder) {
        console.error('Active order not found in table orders');
        return false;
      }

      // Mark new items as new and not sent to kitchen
      const itemsToAdd = newItems.map(item => ({
        ...item,
        sentToKitchen: false,
        addedAt: new Date(),
        printedOnTicket: false,
        itemStatus: 'NEW' as const,
        isNewItem: true
      }));

      // Add new items to the order
      activeOrder.items = [...activeOrder.items, ...itemsToAdd];
      activeOrder.lastUpdatedAt = new Date();

      // Update the table status
      table.hasNewItems = true;

      // Update the table data
      updateTableData(table);

      return true;
    } catch (error) {
      console.error('Error adding items to order:', error);
      return false;
    }
  }

  // Set table data in store
  public setTableData(tableNumber: number, data: TableData): void {
    tableDataStore.set(tableNumber, data);
  }

  // Remove table data from store
  public removeTableData(tableNumber: number): void {
    tableDataStore.delete(tableNumber);
  }

  // Get all tables
  public getAllTables(): TableData[] {
    return Array.from(tableDataStore.values());
  }
}

// Export a singleton instance
export const kitchenWorkflowService = KitchenWorkflowService.getInstance();
