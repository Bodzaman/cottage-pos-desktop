/**
 * Order Types - Order and order item definitions
 *
 * This file contains the canonical type definitions for order-related entities.
 * All field names use camelCase for TypeScript consistency.
 */

import type { OrderMode, OrderType, OrderStatus, PaymentMethodType, PaymentStatus, ISOTimestamp } from './common';
import type { ModifierSelection, CustomizationSelection } from './menu';

// ================================
// ORDER ITEM
// ================================

/**
 * Order item definition
 * Represents a single item in an order
 */
export interface OrderItem {
  id: string;
  menuItemId: string;
  variantId?: string | null;
  name: string;
  quantity: number;
  price: number;
  variantName?: string;
  notes?: string;
  proteinType?: string;
  imageUrl?: string;
  modifiers: ModifierSelection[];
  customizations?: CustomizationSelection[];

  // Category tracking for receipt organization
  categoryId?: string;
  categoryName?: string;

  // Set meal fields
  itemType?: 'menu_item' | 'set_meal';
  setMealCode?: string;
  setMealItems?: Array<{
    menuItemName: string;
    quantity: number;
    categoryName?: string;
  }>;

  // Customer identification for kitchen tickets
  customerName?: string;
  customerNumber?: number;
  customerTabId?: string;

  // Kitchen display
  kitchenDisplayName?: string | null;

  // Kitchen status tracking
  status?: 'NEW' | 'PREPARING' | 'READY' | 'SERVED';
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
  orderType: OrderType;
  orderMode?: OrderMode;

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

  // Table info (for dine-in)
  tableNumber?: number;
  tableId?: string;

  // Order details
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  discountCode?: string;
  deliveryFee?: number;
  serviceFee?: number;
  tip?: number;
  total: number;

  // Status
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethodType;

  // AI Voice order fields
  isVoiceOrder?: boolean;
  voiceTranscript?: string;
  voiceAgentId?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  scheduledFor?: string;

  // Notes
  specialInstructions?: string;
  kitchenNotes?: string;
  driverNotes?: string;

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
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  postcode: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
  deliveryNotes?: string;
}

/**
 * Customer address (alias for backwards compatibility)
 */
export interface CustomerAddress extends DeliveryAddress {
  customerId?: string;
  label?: string; // e.g., "Home", "Work"
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
 */
export function mapApiOrderToOrder(apiOrder: any): Order {
  return {
    id: apiOrder.id,
    orderType: apiOrder.order_type,
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
 * Map API order item to OrderItem (snake_case to camelCase)
 */
export function mapApiOrderItemToOrderItem(apiItem: any): OrderItem {
  return {
    id: apiItem.id,
    menuItemId: apiItem.menu_item_id,
    variantId: apiItem.variant_id,
    name: apiItem.name,
    quantity: apiItem.quantity ?? 1,
    price: apiItem.price ?? 0,
    variantName: apiItem.variant_name,
    notes: apiItem.notes,
    proteinType: apiItem.protein_type,
    imageUrl: apiItem.image_url,
    modifiers: apiItem.modifiers || [],
    customizations: apiItem.customizations || [],
    categoryId: apiItem.category_id,
    categoryName: apiItem.category_name,
    itemType: apiItem.item_type,
    setMealCode: apiItem.set_meal_code,
    setMealItems: apiItem.set_meal_items,
    customerName: apiItem.customer_name,
    customerNumber: apiItem.customer_number,
    customerTabId: apiItem.customer_tab_id,
    kitchenDisplayName: apiItem.kitchen_display_name,
    status: apiItem.status,
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
    status: item.status,
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
