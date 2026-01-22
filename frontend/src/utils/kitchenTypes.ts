// Unified Kitchen Types for KDS V2
// Keep simple, predictable, and fully typed

export type KitchenOrderStatus =
  | "PENDING"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "DELAYED";

export interface KitchenOrderItem {
  id: string;
  name: string;
  quantity: number;
  modifiers?: string[];
  notes?: string;
  category?: string;
}

export interface UnifiedKitchenOrder {
  // Identity
  id: string; // Unique order ID (POS orderId or Supabase id)
  orderSource: "POS" | "ONLINE";

  // Order details
  orderType: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING";
  orderNumber: string; // Display number, e.g. #0A1B2C

  // Customer info
  customerName?: string;
  tableNumber?: number;
  phoneNumber?: string;

  // Items
  items: KitchenOrderItem[];
  specialInstructions?: string;

  // Timing
  createdAt: Date;
  scheduledFor?: Date;
  estimatedPrepTime: number; // Minutes
  waitingTime: number; // Derived in store

  // Status
  status: KitchenOrderStatus;
  isPriority: boolean; // Derived in store

  // Display helpers (derived)
  statusColor: string;
  timeDisplay: string;
}

export interface PriorityConfig {
  urgentThreshold: number; // default: 15
  collectionWarning: number; // default: 10
  deliveryWarning: number; // default: 15
}

export const defaultPriorityConfig: PriorityConfig = {
  urgentThreshold: 15,
  collectionWarning: 10,
  deliveryWarning: 15,
};
