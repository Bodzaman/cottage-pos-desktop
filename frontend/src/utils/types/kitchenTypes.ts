// ui/src/utils/types/kitchenTypes.ts

// Core unified order interface
export interface UnifiedKitchenOrder {
  // Identity
  id: string; // Unique order ID
  orderSource: "POS" | "ONLINE"; // Source system (primitive string)

  // Order details
  orderType: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING";
  orderNumber: string; // Display number (e.g., "#045")

  // Customer info
  customerName?: string; // Optional for dine-in
  tableNumber?: number; // Only for DINE-IN
  phoneNumber?: string; // For COLLECTION/DELIVERY

  // Items
  items: KitchenOrderItem[];
  specialInstructions?: string;

  // Timing
  createdAt: Date; // Order creation time
  scheduledFor?: Date; // Pickup/delivery time
  estimatedPrepTime: number; // Minutes
  waitingTime: number; // Minutes since creation

  // Status
  status: KitchenOrderStatus;
  isPriority: boolean; // Urgent flag

  // Display helpers
  statusColor: string; // Border color
  timeDisplay: string; // "15 min" formatted
}

export interface KitchenOrderItem {
  id: string;
  name: string;
  quantity: number;
  modifiers?: string[];
  notes?: string;
  category?: string; // For kitchen station routing
}

export type KitchenOrderStatus =
  | "PENDING" // Just received
  | "PREPARING" // Being cooked
  | "READY" // Ready for pickup/serve
  | "COMPLETED" // Served/picked up
  | "DELAYED"; // Flagged as delayed

// Priority calculation config
export interface PriorityConfig {
  urgentThreshold: number; // Minutes (default: 15)
  collectionWarning: number; // Minutes before pickup (default: 10)
  deliveryWarning: number; // Minutes before delivery (default: 15)
}
