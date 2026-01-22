/**
 * Common Types - Shared enums and utility types
 *
 * This file contains shared type definitions used across the application.
 * All values use lowercase to match React/TypeScript conventions.
 */

// ================================
// ORDER & DELIVERY MODES
// ================================

/**
 * Order mode for cart and checkout
 * Standardized to lowercase per project conventions
 */
export type OrderMode = 'delivery' | 'collection' | 'dine-in';

/**
 * Order type for POS system (legacy uppercase format for DB compatibility)
 * Maps to OrderMode for frontend use
 */
export type OrderType = 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';

/**
 * Convert OrderType (DB) to OrderMode (frontend)
 */
export function orderTypeToMode(orderType: OrderType): OrderMode {
  switch (orderType) {
    case 'DINE-IN':
      return 'dine-in';
    case 'COLLECTION':
      return 'collection';
    case 'DELIVERY':
      return 'delivery';
    case 'WAITING':
      return 'collection'; // Waiting orders default to collection
    default:
      return 'collection';
  }
}

/**
 * Convert OrderMode (frontend) to OrderType (DB)
 */
export function orderModeToType(mode: OrderMode): OrderType {
  switch (mode) {
    case 'dine-in':
      return 'DINE-IN';
    case 'collection':
      return 'COLLECTION';
    case 'delivery':
      return 'DELIVERY';
    default:
      return 'COLLECTION';
  }
}

// ================================
// ORDER STATUS
// ================================

/**
 * Order status for kitchen and tracking
 */
export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

/**
 * Kitchen item status
 */
export type KitchenItemStatus = 'NEW' | 'PREPARING' | 'READY' | 'SERVED';

// ================================
// PAYMENT
// ================================

/**
 * Payment method types
 */
export type PaymentMethodType =
  | 'CARD'
  | 'CASH'
  | 'CUSTOMER_PAYS'
  | 'ALREADY_PAID'
  | 'SMS_PAYMENT_LINK'
  | 'QR_AT_DOOR';

/**
 * Payment status
 */
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';

/**
 * Payment result interface for POS transactions
 */
export interface PaymentResult {
  method: PaymentMethodType;
  amount: number;
  change?: number;
  cashReceived?: number;
  reference?: string;
  tipAmount?: number;
  totalWithTip?: number;
}

// ================================
// TABLE STATUS
// ================================

/**
 * Table status for dine-in management
 */
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'SEATED' | 'ORDERED';

// ================================
// ITEM TYPES
// ================================

/**
 * Menu item classification types
 */
export type ItemType = 'food' | 'drinks_wine' | 'coffee_desserts' | 'menu_item' | 'set_meal';

/**
 * Image/description inheritance state
 */
export type InheritanceState = 'inherited' | 'custom' | 'none';

/**
 * Image source tracking
 */
export type ImageSource = 'variant' | 'inherited' | 'none';

// ================================
// FORM STATUS
// ================================

/**
 * Form step status for multi-step forms
 */
export type StepStatus = 'complete' | 'incomplete' | 'error' | 'not-started';

// ================================
// UTILITY TYPES
// ================================

/**
 * Generic ID type for database entities
 */
export type EntityId = string;

/**
 * Timestamp string (ISO 8601 format)
 */
export type ISOTimestamp = string;

/**
 * Nullable type helper
 */
export type Nullable<T> = T | null;

/**
 * Optional type helper
 */
export type Optional<T> = T | undefined;

/**
 * Deep partial type helper
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Required fields type helper
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
