/**
 * Order Types - Order and order item definitions
 *
 * This file contains the canonical type definitions for order-related entities.
 * All field names use camelCase for TypeScript consistency.
 *
 * IMPORTANT: Snake_case aliases have been removed. Use the mapper functions
 * (mapApiOrderItemToOrderItem, mapOrderItemToApi) for API conversion.
 */

import type {
  OrderMode,
  OrderType,
  LegacyOrderType,
  OrderSubtype,
  OrderSource,
  PricingMode,
  OrderStatus,
  PaymentMethodType,
  PaymentStatus,
  ISOTimestamp,
} from './common';
import { normalizeOrderType } from './common';
import type { ModifierSelection, CustomizationSelection } from './menu';

// ================================
// ORDER ITEM
// ================================

/**
 * Order item definition
 * Represents a single item in an order
 *
 * NOTE: Includes snake_case aliases for API compatibility and direct object construction.
 * Use mapper functions (mapOrderItemToApi, mapApiOrderItemToOrderItem) for formal conversions.
 */
export interface OrderItem {
  // Core fields - id is optional to support both new and existing items
  id?: string;
  menuItemId?: string;
  menu_item_id?: string; // Snake_case alias
  variantId?: string | null;
  variant_id?: string | null; // Snake_case alias
  name: string;
  quantity: number;
  price: number;
  total?: number; // Computed total (quantity * price + customizations)

  // Variant info
  variantName?: string;
  variant_name?: string; // Snake_case alias

  // Notes and customizations
  notes?: string;
  proteinType?: string;
  protein_type?: string; // Snake_case alias
  imageUrl?: string;
  image_url?: string; // Snake_case alias
  modifiers?: ModifierSelection[];
  customizations?: CustomizationSelection[];

  // Category tracking for receipt organization - important for printing
  categoryId?: string;
  category_id?: string; // Snake_case alias
  categoryName?: string;
  category_name?: string; // Snake_case alias

  // Set meal fields
  itemType?: 'menu_item' | 'set_meal';
  item_type?: 'menu_item' | 'set_meal'; // Snake_case alias
  setMealCode?: string;
  set_meal_code?: string; // Snake_case alias
  setMealItems?: Array<{
    menuItemName: string;
    quantity: number;
    categoryName?: string;
  }>;
  set_meal_items?: Array<{
    menu_item_name: string;
    quantity: number;
    category_name?: string;
  }>; // Snake_case alias

  // Customer identification for kitchen tickets (dine-in split billing)
  customerName?: string;
  customer_name?: string; // Snake_case alias
  customerNumber?: number;
  customer_number?: number; // Snake_case alias
  customerTabId?: string;
  customer_tab_id?: string; // Snake_case alias

  // Kitchen display
  kitchenDisplayName?: string | null;
  kitchen_display_name?: string | null; // Snake_case alias

  // Display order
  displayOrder?: number;
  display_order?: number; // Snake_case alias

  // Kitchen status tracking
  status?: 'NEW' | 'PREPARING' | 'READY' | 'SERVED';

  // Section override for "Serve With" feature
  // When set, item prints/displays in this section instead of natural category section
  serveWithSectionId?: string | null;
  serve_with_section_id?: string | null; // Snake_case alias

  // For linked table billing - tracks which table the item came from
  sourceTableNumber?: number;
  source_table_number?: number; // Snake_case alias

  // Nested variant object for backend compatibility (dine_in_commands expects nested variant)
  variant?: {
    id: string;
    name: string;
    price?: number;
    protein_type?: string;
    protein_type_name?: string;
    price_adjustment?: number;
  };
}

/**
 * Normalized order item with required category fields
 * Use this type when category info is guaranteed to be present (e.g., for printing)
 */
export interface NormalizedOrderItem extends OrderItem {
  categoryId: string;
  categoryName: string;
}

/**
 * Order item for thermal receipt display
 * Simplified version for printing
 */
export interface ReceiptOrderItem {
  id: string;
  name: string;
  kitchenDisplayName?: string | null;
  quantity: number;
  price: number;
  variantName?: string;
  notes?: string;
  customizations?: Array<{ name: string; priceAdjustment: number }>;
  categoryName?: string;
}

// ================================
// ORDER
// ================================

/**
 * Base order definition
 */
export interface Order {
  id: string;
  orderType: OrderType;
  tableNumber?: number;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Completed order with full details
 * Used for order history and tracking
 */
export interface CompletedOrder {
  id: string;
  orderNumber?: string;
  orderType: OrderType | LegacyOrderType;  // Accepts both new and legacy formats
  orderSubtype?: OrderSubtype;  // NEW: WAITING, SEATED, etc.
  orderMode?: OrderMode;
  orderSource?: OrderSource;  // NEW: POS, ONLINE, VOICE, PHONE

  // Customer info
  customer?: {
    id?: string;
    name?: string;
    phone?: string;
    email?: string;
  };
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerId?: string;  // NEW: CRM customer ID

  // Table info (for dine-in)
  tableNumber?: number;
  tableId?: string;
  guestCount?: number;  // NEW: Number of guests

  // Order details
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  discountCode?: string;
  discount_code?: string;  // Snake_case alias
  deliveryFee?: number;
  delivery_fee?: number;  // Snake_case alias
  serviceFee?: number;
  service_fee?: number;  // Snake_case alias
  tax?: number;  // NEW: Calculated tax amount
  tip?: number;
  total: number;

  // Pricing metadata - NEW
  pricingMode?: PricingMode;  // Which pricing tier was used
  taxRate?: number;  // Tax rate at time of order (e.g., 0.20 for 20%)
  serviceFeeRate?: number;  // Service charge rate (e.g., 10 for 10%)

  // Status
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethodType;

  // Payment tracking - NEW
  stripePaymentIntentId?: string;
  idempotencyKey?: string;

  // AI Voice order fields
  isVoiceOrder?: boolean;
  is_voice_order?: boolean;  // Snake_case alias
  voiceTranscript?: string;
  voice_transcript?: string;  // Snake_case alias
  voiceAgentId?: string;
  voice_agent_id?: string;  // Snake_case alias
  voiceConfidence?: number;
  voice_confidence?: number;  // Snake_case alias

  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  scheduledFor?: string;
  acceptedAt?: string;  // NEW: When order was accepted
  estimated_time?: number;  // Estimated completion time in minutes

  // Notes
  specialInstructions?: string;
  kitchenNotes?: string;
  driverNotes?: string;
  cancellationReason?: string;  // NEW: If cancelled, why

  // Source tracking
  source?: 'pos' | 'online' | 'voice' | 'phone';
  staffId?: string;
  staffName?: string;
}

/**
 * Order for online ordering display
 */
export interface OnlineOrder extends CompletedOrder {
  estimatedDeliveryTime?: string;
  estimatedPickupTime?: string;
  trackingUrl?: string;
  driverName?: string;
  driverPhone?: string;
}

/**
 * Kitchen order for display
 */
export interface KitchenOrder {
  id: string;
  orderNumber?: string;
  orderType: OrderType;
  tableNumber?: number;
  customerName?: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  priority?: 'normal' | 'rush' | 'vip';
  notes?: string;
  estimatedTime?: number; // minutes
}

// ================================
// DELIVERY
// ================================

/**
 * Delivery address
 */
export interface DeliveryAddress {
  id?: string;
  addressLine1?: string;
  address_line1?: string; // Snake_case alias - at least one should be present
  addressLine2?: string;
  address_line2?: string; // Snake_case alias
  city?: string;
  postcode?: string;
  postal_code?: string; // Snake_case alias
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
  is_default?: boolean; // Snake_case alias
  deliveryNotes?: string;
  delivery_instructions?: string; // Snake_case alias
}

/**
 * Customer address (alias for backwards compatibility)
 */
export interface CustomerAddress extends DeliveryAddress {
  customerId?: string;
  customer_id?: string; // Snake_case alias
  label?: string; // e.g., "Home", "Work"
  address_type?: string;
  country?: string;
  place_id?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Delivery validation request
 */
export interface DeliveryValidationRequest {
  postcode: string;
  addressLine1?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Delivery validation response
 */
export interface DeliveryValidationResponse {
  isValid: boolean;
  deliveryFee?: number;
  minimumOrder?: number;
  estimatedTime?: number;
  message?: string;
}

/**
 * Delivery settings for the restaurant
 */
export interface DeliverySettings {
  enabled: boolean;
  radius: number;
  restaurantLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  fees: Array<{
    maxDistance: number;
    cost: number;
  }>;
  minimumOrders: Array<{
    maxDistance: number;
    minimumAmount: number;
  }>;
}

// ================================
// TIP
// ================================

/**
 * Tip selection
 */
export interface TipSelection {
  type: 'percentage' | 'fixed' | 'none';
  value: number;
  amount: number;
}

// ================================
// API MAPPERS
// ================================

/**
 * Map API order data to Order (snake_case to camelCase)
 * Handles both legacy (DINE-IN) and new (DINE_IN) order type formats
 */
export function mapApiOrderToOrder(apiOrder: any): Order {
  return {
    id: apiOrder.id,
    orderType: normalizeOrderType(apiOrder.order_type),
    tableNumber: apiOrder.table_number,
    customerName: apiOrder.customer_name,
    customerPhone: apiOrder.customer_phone,
    customerAddress: apiOrder.customer_address,
    status: apiOrder.status,
    items: (apiOrder.items || []).map(mapApiOrderItemToOrderItem),
    subtotal: apiOrder.subtotal ?? 0,
    total: apiOrder.total ?? 0,
    createdAt: apiOrder.created_at,
    updatedAt: apiOrder.updated_at,
  };
}

/**
 * Map API order data to CompletedOrder with full details
 */
export function mapApiOrderToCompletedOrder(apiOrder: any): CompletedOrder {
  return {
    id: apiOrder.id,
    orderNumber: apiOrder.order_number,
    orderType: normalizeOrderType(apiOrder.order_type),
    orderSubtype: apiOrder.order_subtype,
    orderMode: apiOrder.order_mode,
    orderSource: apiOrder.order_source?.toUpperCase(),
    customer: apiOrder.customer,
    customerName: apiOrder.customer_name,
    customerPhone: apiOrder.customer_phone,
    customerEmail: apiOrder.customer_email,
    customerAddress: apiOrder.customer_address ?? apiOrder.delivery_address,
    customerId: apiOrder.customer_id,
    tableNumber: apiOrder.table_number,
    tableId: apiOrder.table_id,
    guestCount: apiOrder.guest_count,
    items: (apiOrder.items || []).map(mapApiOrderItemToOrderItem),
    subtotal: apiOrder.subtotal ?? 0,
    discount: apiOrder.discount ?? apiOrder.discount_amount,
    discountCode: apiOrder.discount_code ?? apiOrder.promo_code,
    deliveryFee: apiOrder.delivery_fee ?? 0,
    serviceFee: apiOrder.service_fee ?? apiOrder.service_charge ?? 0,
    tax: apiOrder.tax ?? apiOrder.tax_amount ?? 0,
    tip: apiOrder.tip ?? apiOrder.tip_amount ?? 0,
    total: apiOrder.total ?? apiOrder.total_amount ?? 0,
    pricingMode: apiOrder.pricing_mode,
    taxRate: apiOrder.tax_rate,
    serviceFeeRate: apiOrder.service_charge_rate ?? apiOrder.service_fee_rate,
    status: apiOrder.status,
    paymentStatus: apiOrder.payment_status,
    paymentMethod: apiOrder.payment_method,
    stripePaymentIntentId: apiOrder.stripe_payment_intent_id,
    idempotencyKey: apiOrder.idempotency_key,
    isVoiceOrder: apiOrder.is_voice_order,
    voiceTranscript: apiOrder.voice_transcript,
    voiceAgentId: apiOrder.voice_agent_id,
    voiceConfidence: apiOrder.voice_confidence,
    createdAt: apiOrder.created_at,
    updatedAt: apiOrder.updated_at,
    completedAt: apiOrder.completed_at,
    scheduledFor: apiOrder.scheduled_for ?? apiOrder.pickup_time,
    acceptedAt: apiOrder.accepted_at,
    specialInstructions: apiOrder.special_instructions ?? apiOrder.notes,
    kitchenNotes: apiOrder.kitchen_notes,
    driverNotes: apiOrder.driver_notes ?? apiOrder.delivery_notes,
    cancellationReason: apiOrder.cancellation_reason,
    source: apiOrder.order_source?.toLowerCase(),
    staffId: apiOrder.staff_id,
    staffName: apiOrder.staff_name,
  };
}

/**
 * Map API order item to OrderItem (snake_case to camelCase)
 */
export function mapApiOrderItemToOrderItem(apiItem: any): OrderItem {
  return {
    id: apiItem.id,
    menuItemId: apiItem.menu_item_id ?? apiItem.menuItemId ?? apiItem.item_id,
    variantId: apiItem.variant_id ?? apiItem.variantId,
    name: apiItem.name ?? apiItem.menu_item_name ?? apiItem.item_name,
    quantity: apiItem.quantity ?? 1,
    price: apiItem.price ?? apiItem.unit_price ?? 0,
    variantName: apiItem.variant_name ?? apiItem.variantName,
    notes: apiItem.notes ?? apiItem.special_instructions,
    proteinType: apiItem.protein_type ?? apiItem.proteinType,
    imageUrl: apiItem.image_url ?? apiItem.imageUrl,
    modifiers: apiItem.modifiers || [],
    customizations: apiItem.customizations || [],
    categoryId: apiItem.category_id ?? apiItem.categoryId,
    categoryName: apiItem.category_name ?? apiItem.categoryName,
    itemType: apiItem.item_type ?? apiItem.itemType,
    setMealCode: apiItem.set_meal_code ?? apiItem.setMealCode,
    setMealItems: apiItem.set_meal_items ?? apiItem.setMealItems,
    customerName: apiItem.customer_name ?? apiItem.customerName,
    customerNumber: apiItem.customer_number ?? apiItem.customerNumber,
    customerTabId: apiItem.customer_tab_id ?? apiItem.customerTabId,
    kitchenDisplayName: apiItem.kitchen_display_name ?? apiItem.kitchenDisplayName,
    displayOrder: apiItem.display_order ?? apiItem.displayOrder,
    status: apiItem.status ?? apiItem.preparation_status,
    serveWithSectionId: apiItem.serve_with_section_id ?? apiItem.serveWithSectionId,
  };
}

/**
 * Map Order to API format (camelCase to snake_case)
 */
export function mapOrderToApi(order: Order): any {
  return {
    id: order.id,
    order_type: order.orderType,
    table_number: order.tableNumber,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_address: order.customerAddress,
    status: order.status,
    items: order.items.map(mapOrderItemToApi),
    subtotal: order.subtotal,
    total: order.total,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
  };
}

/**
 * Map CompletedOrder to API format (camelCase to snake_case)
 */
export function mapCompletedOrderToApi(order: CompletedOrder): any {
  return {
    id: order.id,
    order_number: order.orderNumber,
    order_type: order.orderType,
    order_subtype: order.orderSubtype,
    order_source: order.orderSource,
    customer_id: order.customerId,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_email: order.customerEmail,
    delivery_address: order.customerAddress,
    table_number: order.tableNumber,
    table_id: order.tableId,
    guest_count: order.guestCount,
    items: order.items.map(mapOrderItemToApi),
    subtotal: order.subtotal,
    discount_amount: order.discount,
    discount_code: order.discountCode,
    delivery_fee: order.deliveryFee,
    service_charge: order.serviceFee,
    tax_amount: order.tax,
    tip_amount: order.tip,
    total_amount: order.total,
    pricing_mode: order.pricingMode,
    tax_rate: order.taxRate,
    service_charge_rate: order.serviceFeeRate,
    status: order.status,
    payment_status: order.paymentStatus,
    payment_method: order.paymentMethod,
    stripe_payment_intent_id: order.stripePaymentIntentId,
    idempotency_key: order.idempotencyKey,
    special_instructions: order.specialInstructions,
    kitchen_notes: order.kitchenNotes,
    delivery_notes: order.driverNotes,
    cancellation_reason: order.cancellationReason,
    staff_id: order.staffId,
    staff_name: order.staffName,
  };
}

/**
 * Map OrderItem to API format (camelCase to snake_case)
 */
export function mapOrderItemToApi(item: OrderItem): any {
  return {
    id: item.id,
    menu_item_id: item.menuItemId,
    variant_id: item.variantId,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    variant_name: item.variantName,
    notes: item.notes,
    protein_type: item.proteinType,
    image_url: item.imageUrl,
    modifiers: item.modifiers,
    customizations: item.customizations,
    category_id: item.categoryId,
    category_name: item.categoryName,
    item_type: item.itemType,
    set_meal_code: item.setMealCode,
    set_meal_items: item.setMealItems,
    customer_name: item.customerName,
    customer_number: item.customerNumber,
    customer_tab_id: item.customerTabId,
    kitchen_display_name: item.kitchenDisplayName,
    display_order: item.displayOrder,
    status: item.status,
    serve_with_section_id: item.serveWithSectionId,
  };
}

/**
 * Map API delivery address to DeliveryAddress
 */
export function mapApiDeliveryAddress(apiAddress: any): DeliveryAddress {
  return {
    id: apiAddress.id,
    addressLine1: apiAddress.address_line1 ?? apiAddress.addressLine1,
    addressLine2: apiAddress.address_line2 ?? apiAddress.addressLine2,
    city: apiAddress.city,
    postcode: apiAddress.postcode ?? apiAddress.postal_code,
    latitude: apiAddress.latitude,
    longitude: apiAddress.longitude,
    isDefault: apiAddress.is_default ?? apiAddress.isDefault,
    deliveryNotes: apiAddress.delivery_notes ?? apiAddress.deliveryNotes,
  };
}
