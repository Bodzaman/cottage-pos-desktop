/**
 * Dine-In System - Unified Type Definitions
 *
 * This is the SINGLE SOURCE OF TRUTH for all dine-in related types.
 * Based on industry-standard POS architecture (Toast, Square, NCR Aloha).
 *
 * Key principle: Orders are the source of truth. Tables are just configuration.
 */

// ============================================================================
// TABLE TYPES (Static Configuration - from pos_tables)
// ============================================================================

/**
 * Table configuration - static data that rarely changes
 * Source: pos_tables table
 */
export interface TableConfig {
  id: string;                    // UUID from pos_tables
  tableNumber: number;           // Display number (e.g., 1, 2, 3)
  capacity: number;              // Number of seats
  section?: string;              // Floor/section assignment
  shape?: TableShape;            // Visual shape for floor plan
  position?: TablePosition;      // Position on floor plan
}

export type TableShape = 'square' | 'round' | 'rectangular';

export interface TablePosition {
  x: number;
  y: number;
}

// ============================================================================
// ORDER TYPES (Runtime State - from orders table)
// ============================================================================

/**
 * Order status progression
 */
export type OrderStatus =
  | 'CREATED'           // Order created, no items sent
  | 'SENT_TO_KITCHEN'   // Items sent to kitchen
  | 'IN_PREP'           // Kitchen preparing
  | 'READY'             // Ready for service
  | 'SERVED'            // Food served to table
  | 'PENDING_PAYMENT'   // Bill requested
  | 'PAID'              // Payment received
  | 'COMPLETED'         // Order finalized
  | 'CANCELLED';        // Order cancelled

/**
 * Dine-in order - the source of truth for table runtime state
 * Source: orders table
 */
export interface DineInOrder {
  id: string;                    // UUID
  tableId: string;               // FK to pos_tables.id (UUID)
  tableNumber?: number;          // Denormalized for convenience
  tableGroupId?: string;         // For linked tables (shared by all linked)
  guestCount: number;            // Number of guests
  linkedTables: number[];        // Table numbers in linked group
  status: OrderStatus;
  serverName?: string;
  serverId?: string;
  subtotal: number;
  tax: number;
  total: number;
  totalAmount?: number;          // Alias for compatibility
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// ORDER ITEM TYPES
// ============================================================================

/**
 * Item status in kitchen workflow
 */
export type ItemStatus =
  | 'pending'      // Not yet sent to kitchen
  | 'sent'         // Sent to kitchen
  | 'preparing'    // Kitchen is preparing
  | 'ready'        // Ready for service
  | 'served'       // Served to customer
  | 'void';        // Voided/cancelled

/**
 * Order item - individual item in an order
 * Source: dine_in_order_items table
 */
export interface DineInOrderItem {
  id: string;
  orderId: string;
  customerTabId?: string;        // For split billing
  tableNumber?: number;          // Denormalized
  menuItemId: string;
  variantId?: string;
  categoryId?: string;
  name: string;                  // Item name
  variantName?: string;
  proteinType?: string;
  proteinTypeName?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  customizations: Customization[];
  notes?: string;
  status: ItemStatus;
  sentToKitchenAt?: string;
  imageUrl?: string;
  kitchenDisplayName?: string;
  displayOrder?: number;
  categoryName?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Item customization
 */
export interface Customization {
  id?: string;
  name: string;
  price?: number;
  groupName?: string;
}

// ============================================================================
// CUSTOMER TAB TYPES (Split Billing)
// ============================================================================

/**
 * Customer tab status
 */
export type CustomerTabStatus = 'active' | 'paid' | 'cancelled';

/**
 * Customer tab - for split billing
 * Source: customer_tabs table
 */
export interface CustomerTab {
  id: string;
  orderId: string;
  tableNumber: number;
  tabName: string;
  guestId?: string;
  items: DineInOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  tipAmount?: number;
  discountAmount?: number;
  status: CustomerTabStatus;
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// DERIVED TABLE STATE (Computed, not stored)
// ============================================================================

/**
 * Display status for table cards
 */
export type TableDisplayStatus =
  | 'AVAILABLE'        // Empty, ready for seating
  | 'SEATED'           // Guests seated, no items yet
  | 'AWAITING_ORDER'   // Has items not sent to kitchen
  | 'FOOD_SENT'        // Food sent to kitchen
  | 'REQUESTING_CHECK' // Bill requested
  | 'PAYING';          // Payment in progress

/**
 * Complete table state - computed from TableConfig + Order
 * This is what the dashboard uses for display
 */
export interface TableState extends TableConfig {
  // Derived from order presence
  isOccupied: boolean;

  // Derived from order data
  guestCount: number | null;
  status: TableDisplayStatus;
  activeOrderId?: string;
  duration?: string;              // Time since seating

  // Derived from order linking data
  isLinked: boolean;
  isPrimary: boolean;
  linkedWith: number[];           // Other table numbers in group
  linkedGroupId?: string;

  // Derived from customer tabs
  customerTabNames: string[];
  hasMultipleTabs: boolean;
}

// ============================================================================
// LINKED TABLE TYPES
// ============================================================================

/**
 * Linked table color scheme for visual grouping
 */
export interface LinkedTableColor {
  name: string;
  primary: string;
  glow: string;
  background: string;
  border: string;
}

/**
 * Linked table group summary
 */
export interface LinkedTableGroup {
  groupId: string;
  primaryTableNumber: number;
  tableNumbers: number[];
  totalGuestCount: number;
  orderId: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Create order request
 */
export interface CreateOrderRequest {
  tableId: string;
  guestCount?: number;
  linkedTables?: number[];
  tableGroupId?: string;
  serverId?: string;
  serverName?: string;
}

/**
 * Add item to order request
 */
export interface AddItemRequest {
  orderId: string;
  menuItemId: string;
  variantId?: string;
  quantity: number;
  customizations?: Customization[];
  notes?: string;
  customerTabId?: string;
}

/**
 * Update linked tables request
 */
export interface UpdateLinkedTablesRequest {
  orderId: string;
  linkedTables: number[];
  tableGroupId: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Order filter options
 */
export interface OrderFilters {
  tableId?: string;
  status?: OrderStatus[];
  fromDate?: string;
  toDate?: string;
}

/**
 * Real-time subscription event
 */
export interface OrderEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  old?: DineInOrder;
  new?: DineInOrder;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Derive table display status from order
 */
export function deriveTableDisplayStatus(order?: DineInOrder): TableDisplayStatus {
  if (!order) return 'AVAILABLE';

  switch (order.status) {
    case 'CREATED':
      return 'SEATED';
    case 'SENT_TO_KITCHEN':
    case 'IN_PREP':
    case 'READY':
      return 'FOOD_SENT';
    case 'SERVED':
      return 'FOOD_SENT';
    case 'PENDING_PAYMENT':
      return 'REQUESTING_CHECK';
    case 'PAID':
    case 'COMPLETED':
      return 'AVAILABLE';
    case 'CANCELLED':
      return 'AVAILABLE';
    default:
      return 'SEATED';
  }
}

/**
 * Check if order status indicates table is occupied
 */
export function isOrderActive(status: OrderStatus): boolean {
  return ![
    'PAID',
    'COMPLETED',
    'CANCELLED'
  ].includes(status);
}

/**
 * Calculate time duration from timestamp
 */
export function calculateDuration(startTime: string): string {
  const start = new Date(startTime);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) {
    return `${diffMins}m`;
  }

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours}h ${mins}m`;
}
