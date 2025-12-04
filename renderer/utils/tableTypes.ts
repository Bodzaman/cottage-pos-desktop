



// Helper function to check if a table has new items that need to be sent to kitchen
export const tableHasNewItems = (table: TableData): boolean => {
  if (!table.activeOrderId) return false;
  
  const activeOrder = table.orders.find(order => order.orderId === table.activeOrderId);
  if (!activeOrder) return false;
  
  return activeOrder.items.some(item => !item.sentToKitchen || item.isNewItem);
};

// Helper function to mark items as sent to kitchen
export const markItemsAsSentToKitchen = (items: TableOrderItem[]): TableOrderItem[] => {
  return items.map(item => ({
    ...item,
    sentToKitchen: true,
    isNewItem: false,
    printedOnTicket: true,
    itemStatus: item.itemStatus === 'NEW' ? 'PREPARING' : item.itemStatus
  }));
};

// Helper function to get only new/unsent items from an order
export const getNewItems = (items: TableOrderItem[]): TableOrderItem[] => {
  return items.filter(item => !item.sentToKitchen || item.isNewItem);
};

// Helper function to calculate the total for a table order
export const calculateOrderTotal = (order: TableOrder): { subtotal: number, tax: number, serviceChargeAmount: number, discountAmount: number, total: number } => {
  const subtotal = order.items.reduce((sum, item) => {
    let itemTotal = item.price * item.quantity;
    // Add modifier prices if present
    if (item.modifiers && item.modifiers.length > 0) {
      item.modifiers.forEach(group => {
        group.options.forEach(option => {
          itemTotal += option.price * item.quantity;
        });
      });
    }
    return sum + itemTotal;
  }, 0);
  
  const tax = 0; // VAT is already included in menu prices
  const serviceChargeAmount = (subtotal * order.serviceCharge) / 100;
  const discountAmount = (subtotal * order.discount) / 100;
  
  const total = subtotal + serviceChargeAmount - discountAmount; // No VAT addition
  
  return { subtotal, tax, serviceChargeAmount, discountAmount, total };
};export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  option?: string;
  notes?: string;
  variantName?: string;
  modifiers?: Array<{
    groupId: string;
    groupName: string;
    options: Array<{
      optionId: string;
      name: string;
      price: number;
    }>;
  }>;
}// Table status types for the POS system

export type TableStatus = 
  | "AVAILABLE"
  | "SEATED"
  | "ORDERED"
  | "BILL_REQUESTED"
  | "PAYMENT_PROCESSING"
  | "PAYMENT_COMPLETE"
  | "LINKED"; // Added for table linking functionality


// Represents an item in a table order
export interface TableOrderItem extends OrderItem {
  sentToKitchen: boolean; // Whether this item has been sent to kitchen
  addedAt: Date; // When this item was added to the order
  printedOnTicket: boolean; // Whether this item has been printed on a kitchen ticket
  itemStatus: 'NEW' | 'PREPARING' | 'READY' | 'SERVED'; // Status of the item in the kitchen flow
  kitchenNotes?: string; // Additional notes for the kitchen
  isNewItem: boolean; // Indicates this is a new item added to an existing order
  lastKitchenPrintAt?: Date | null; // When this item was last printed on a kitchen ticket
}

export interface TableOrder {
  orderId: string; // Unique ID for this order
  items: TableOrderItem[]; // Items in this order
  createdAt: Date; // When this order was created
  lastUpdatedAt: Date; // When this order was last updated
  lastSentToKitchenAt: Date | null; // When order was last sent to kitchen
  billPrinted: boolean; // Whether the bill has been printed
  billPrintedAt: Date | null; // When the bill was last printed
  splitBillMode: boolean; // Whether the order is in split bill mode
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID'; // Payment status of the order
  serviceCharge: number; // Service charge percentage
  discount: number; // Discount percentage
  tip: number; // Tip amount
  notes: string; // General order notes
  completedAt?: Date | null; // When the order was completed
  kitchenTickets?: Array<{ // Track kitchen tickets printed for this order
    id: string;
    printedAt: Date;
    items: Array<string>; // IDs of items included in this ticket
    isNewItemsOnly: boolean;
  }>;
}

export interface TableData {
  tableNumber: number;
  status: TableStatus;
  occupiedAt: Date | null;
  guestCount: number;
  orders: TableOrder[]; // All orders for this table
  activeOrderId: string | null; // Currently active order ID
  sentToKitchen: boolean; // Whether current order items have been sent to kitchen
  hasNewItems: boolean; // Whether the current order has new items that haven't been sent to kitchen
  billPrinted: boolean; // Whether a bill has been printed for this table
  lastBillPrintedAt: Date | null; // When the bill was last printed
  capacity: number; // Number of seats at the table
  
  // Table linking support
  linkedTableNumbers: number[]; // Array of table numbers linked to this table
  isLinkedTable: boolean; // Whether this table is part of a linked group
  isLinkedPrimary: boolean; // Whether this is the primary table in a linked group
  linkedGroupId: string | null; // Unique ID for the linked table group

  // For split bill functionality
  splitBills: Array<{
    id: string;
    name: string;
    items: Array<string>; // IDs of the items assigned to this split
    paid: boolean;
    amount: number; // Total amount for this split
  }>;
}

// Helper functions for table management
export const getTableStatusColor = (status: TableStatus, sentToKitchen: boolean, hasNewItems: boolean = false): string => {
  switch (status) {
    case "AVAILABLE":
      return "#2E7D32"; // Darker green for available tables
    case "SEATED":
      return "#7C5DFA"; // Purple for seated tables
    case "ORDERED":
      if (hasNewItems) return "#F59E0B"; // Amber for tables with new items not sent to kitchen
      return sentToKitchen ? "#9277FF" : "#6B4DEA"; // Different shades of purple for ordered tables
    case "BILL_REQUESTED":
      return "#7C5DFA"; // Purple for bill requested
    case "PAYMENT_PROCESSING":
      return "#9277FF"; // Light purple for payment processing
    case "PAYMENT_COMPLETE":
      return "#1B5E20"; // Dark green for payment complete
    case "LINKED":
      return "#FFA500"; // Orange for linked tables
    default:
      return "#6B7280"; // Gray for unknown status
  }
};

export const getTableStatusLabel = (status: TableStatus): string => {
  switch (status) {
    case "AVAILABLE":
      return "Available";
    case "SEATED":
      return "Seated";
    case "ORDERED":
      return "Ordered";
    case "BILL_REQUESTED":
      return "Bill Requested";
    case "PAYMENT_PROCESSING":
      return "Payment Processing";
    case "PAYMENT_COMPLETE":
      return "Payment Complete";
    case "LINKED":
      return "Linked";
    default:
      return "Unknown";
  }
};

export const getTimeOccupied = (occupiedAt: Date | null): string => {
  if (!occupiedAt) return "0m";
  
  const now = new Date();
  const diffMs = now.getTime() - occupiedAt.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffHours > 0) {
    return `${diffHours}h ${diffMins % 60}m`;
  } else {
    return `${diffMins}m`;
  }
};

// Generate a unique ID for orders
export const generateOrderId = (): string => {
  return 'ord_' + Math.random().toString(36).substring(2, 9);
};

// Initialize a new table with default values
export const initializeTable = (tableNumber: number, capacity: number = 4, status: TableStatus | string = "AVAILABLE"): TableData => {
  // Normalize status to uppercase format for consistency
  const normalizedStatus: TableStatus = typeof status === 'string' 
    ? status.toUpperCase() as TableStatus
    : status;
    
  return {
    tableNumber,
    status: normalizedStatus,
    occupiedAt: null,
    guestCount: 0,
    orders: [],
    activeOrderId: null,
    sentToKitchen: false,
    hasNewItems: false,
    billPrinted: false,
    lastBillPrintedAt: null,
    splitBills: [],
    capacity, // Store the capacity from API in the table data
    linkedTableNumbers: [],
    isLinkedTable: false,
    isLinkedPrimary: false,
    linkedGroupId: null
  };
};

// Initialize a new order for a table
export const initializeOrder = (): TableOrder => ({
  orderId: generateOrderId(),
  items: [],
  createdAt: new Date(),
  lastUpdatedAt: new Date(),
  lastSentToKitchenAt: null,
  billPrinted: false,
  billPrintedAt: null,
  splitBillMode: false,
  paymentStatus: 'UNPAID',
  serviceCharge: 10.0, // Default 10% service charge
  discount: 0,
  tip: 0,
  notes: '',
  completedAt: null,
  kitchenTickets: []
});

// Convert regular OrderItem to TableOrderItem
export const convertToTableOrderItem = (item: OrderItem): TableOrderItem => ({
  ...item,
  sentToKitchen: false,
  addedAt: new Date(),
  printedOnTicket: false,
  itemStatus: 'NEW',
  isNewItem: true,
  lastKitchenPrintAt: null
});

// Helper function to convert API status to TableStatus format
export const convertApiStatusToTableStatus = (apiStatus: string): TableStatus => {
  switch (apiStatus.toLowerCase()) {
    case 'available': return 'AVAILABLE';
    case 'occupied': return 'SEATED';
    case 'reserved': return 'SEATED';
    case 'unavailable': return 'PAYMENT_COMPLETE'; // Treat as temporarily unavailable
    default: return 'AVAILABLE';
  }
};
