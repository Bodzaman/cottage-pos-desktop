/**
 * Common Types - Shared enums and utility types
 *
 * This file contains shared type definitions used across the application.
 * All values use lowercase to match React/TypeScript conventions.
 *
 * IMPORTANT: Order types use underscore format (DINE_IN not DINE-IN) to match database enums
 */

// ================================
// ORDER & DELIVERY MODES
// ================================

/**
 * Order mode for cart and checkout
 * Includes both lowercase (preferred) and uppercase (legacy) formats
 */
export type OrderMode = 'delivery' | 'collection' | 'dine-in' | 'DELIVERY' | 'COLLECTION' | 'DINE-IN' | 'DINE_IN';

/**
 * Order type for database storage (uppercase underscore format)
 * Matches database enum: order_type_enum
 *
 * NOTE: Includes 'DINE-IN' for legacy compatibility, prefer 'DINE_IN' for new code
 * WAITING is no longer a valid order type - use order_subtype='WAITING' instead
 */
export type OrderType = 'DINE_IN' | 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';

/**
 * Legacy order type for backwards compatibility
 * @deprecated Use OrderType instead. WAITING and DINE-IN are legacy formats.
 */
export type LegacyOrderType = 'DINE-IN' | 'DINE_IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';

/**
 * Order subtype for additional classification
 * - WAITING: Collection order where customer waits in-store
 * - SEATED: Dine-in order where customer is seated at table
 */
export type OrderSubtype = 'WAITING' | 'SEATED' | null;

/**
 * Order source - where the order originated from
 * Matches database enum: order_source_enum
 */
export type OrderSource = 'POS' | 'ONLINE' | 'VOICE' | 'PHONE';

/**
 * Pricing mode - which pricing tier was used
 * Important for receipt reprints and analytics
 */
export type PricingMode = 'DINE_IN' | 'COLLECTION' | 'DELIVERY';

/**
 * Convert OrderType (DB) to OrderMode (frontend)
 * @param orderType - Database order type (DINE_IN, COLLECTION, DELIVERY)
 * @param _subtype - Optional subtype (unused but included for API consistency)
 */
export function orderTypeToMode(orderType: OrderType | LegacyOrderType, _subtype?: OrderSubtype): OrderMode {
  // Normalize to handle both legacy (DINE-IN) and new (DINE_IN) formats
  const normalized = String(orderType).toUpperCase().replace('-', '_');

  switch (normalized) {
    case 'DINE_IN':
      return 'dine-in';
    case 'COLLECTION':
      return 'collection';
    case 'DELIVERY':
      return 'delivery';
    case 'WAITING':
      return 'collection'; // WAITING is a subtype of collection
    default:
      return 'collection';
  }
}

/**
 * Convert OrderMode (frontend) to OrderType (DB)
 * @param mode - Frontend order mode
 * @returns Standardized OrderType (DINE_IN, COLLECTION, DELIVERY)
 */
export function orderModeToType(mode: OrderMode): OrderType {
  switch (mode) {
    case 'dine-in':
      return 'DINE_IN';  // Changed from 'DINE-IN' to match DB enum
    case 'collection':
      return 'COLLECTION';
    case 'delivery':
      return 'DELIVERY';
    default:
      return 'COLLECTION';
  }
}

/**
 * Normalize legacy order type to standardized format
 * Handles: 'DINE-IN' -> 'DINE_IN', 'WAITING' -> 'COLLECTION'
 */
export function normalizeOrderType(orderType: string): OrderType {
  const normalized = String(orderType).toUpperCase().replace('-', '_');

  if (normalized === 'WAITING') {
    return 'COLLECTION';
  }

  if (normalized === 'DINE_IN' || normalized === 'COLLECTION' || normalized === 'DELIVERY') {
    return normalized as OrderType;
  }

  return 'COLLECTION'; // Default fallback
}

/**
 * Check if an order is a WAITING type order
 * WAITING orders are stored as COLLECTION with order_subtype='WAITING'
 */
export function isWaitingOrder(orderType: OrderType | LegacyOrderType, subtype?: OrderSubtype | null): boolean {
  // Legacy: direct WAITING type
  if (String(orderType).toUpperCase() === 'WAITING') {
    return true;
  }
  // New: COLLECTION with subtype='WAITING'
  return normalizeOrderType(String(orderType)) === 'COLLECTION' && subtype === 'WAITING';
}

/**
 * Get display label for order type/subtype combination
 * @param orderType - Database order type
 * @param subtype - Optional subtype (WAITING, SEATED)
 * @returns Human-readable label
 */
export function getOrderTypeLabel(orderType: OrderType | LegacyOrderType, subtype?: OrderSubtype | null): string {
  const normalized = normalizeOrderType(String(orderType));

  // Handle subtypes
  if (normalized === 'COLLECTION' && subtype === 'WAITING') {
    return 'Waiting Area';
  }
  if (normalized === 'DINE_IN' && subtype === 'SEATED') {
    return 'Dine-In (Seated)';
  }

  // Handle legacy WAITING type
  if (String(orderType).toUpperCase() === 'WAITING') {
    return 'Waiting Area';
  }

  // Standard labels
  switch (normalized) {
    case 'DELIVERY':
      return 'Delivery';
    case 'COLLECTION':
      return 'Collection';
    case 'DINE_IN':
      return 'Dine-In';
    default:
      return String(orderType);
  }
}

/**
 * Get order type and subtype from legacy order type
 * Converts WAITING and DINE-IN to normalized format
 */
export function parseOrderType(legacyType: string): { type: OrderType; subtype: OrderSubtype } {
  const upper = String(legacyType).toUpperCase();

  if (upper === 'WAITING') {
    return { type: 'COLLECTION', subtype: 'WAITING' };
  }

  return {
    type: normalizeOrderType(legacyType),
    subtype: null
  };
}

// ================================
// ORDER STATUS
// ================================

/**
 * Order status for order lifecycle tracking
 * Matches database enum: order_status_enum
 */
export type OrderStatus =
  | 'PENDING'           // Order created, awaiting acceptance
  | 'AWAITING_ACCEPT'   // Payment confirmed, waiting manual acceptance
  | 'CONFIRMED'         // Order accepted
  | 'PREPARING'         // Kitchen preparing
  | 'READY'             // Ready for pickup/delivery
  | 'COMPLETED'         // Order fulfilled
  | 'CANCELLED';        // Order cancelled

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
  | 'QR_AT_DOOR'
  | 'ONLINE';  // Added for Stripe online payments

/**
 * Payment status - matches database enum: payment_status_enum
 * Includes legacy values for backwards compatibility
 */
export type PaymentStatus =
  | 'PENDING'     // Order created, no payment yet
  | 'PROCESSING'  // Payment submitted to Stripe
  | 'PAID'        // Payment confirmed
  | 'FAILED'      // Payment declined
  | 'REFUNDED'    // Payment refunded
  | 'CANCELLED'   // Cancelled before processing
  | 'UNPAID'      // Legacy: same as PENDING
  | 'PARTIAL';    // Legacy: partial payment received

/**
 * Legacy payment status for backwards compatibility
 * @deprecated Use PaymentStatus instead
 */
export type LegacyPaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';

/**
 * Normalize legacy payment status to new format
 */
export function normalizePaymentStatus(status: string): PaymentStatus {
  const upper = String(status).toUpperCase();

  switch (upper) {
    case 'UNPAID':
      return 'PENDING';
    case 'PARTIAL':
      return 'PENDING'; // Partial treated as pending for simplicity
    case 'PAID':
    case 'CAPTURED':
    case 'AUTHORIZED':
      return 'PAID';
    case 'REFUNDED':
      return 'REFUNDED';
    case 'FAILED':
      return 'FAILED';
    case 'CANCELLED':
      return 'CANCELLED';
    case 'PROCESSING':
      return 'PROCESSING';
    default:
      return 'PENDING';
  }
}

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
