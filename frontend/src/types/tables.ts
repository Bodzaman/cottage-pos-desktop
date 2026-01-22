/**
 * Table Types - Table management and dine-in order definitions
 *
 * This file contains type definitions for table management,
 * customer tabs, and dine-in order workflows.
 */

import type { TableStatus, OrderStatus, PaymentStatus, OrderType, ISOTimestamp } from './common';
import type { OrderItem } from './orders';

// ================================
// TABLE DEFINITIONS
// ================================

/**
 * Table definition for POS system
 */
export interface Table {
  id: number;
  name: string;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  section?: string;
  floor?: number;
  position?: { x: number; y: number };
}

/**
 * Extended table data with order information
 */
export interface TableData extends Table {
  order?: TableOrder;
  customerCount?: number;
  seatedAt?: string;
  serverName?: string;
  serverId?: string;
}

// ================================
// TABLE ORDER
// ================================

/**
 * Table order definition
 * Represents an order for a specific table
 */
export interface TableOrder {
  id: string;
  tableId: number;
  tableNumber: number;
  orderType: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  customerTabs?: CustomerTab[];
  subtotal: number;
  total: number;
  tip?: number;
  discount?: number;
  discountCode?: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  notes?: string;
  serverName?: string;
  serverId?: string;
}

/**
 * Persisted table order (from database)
 */
export interface PersistentTableOrder {
  id: string;
  tableId: number;
  tableNumber: number;
  orderType: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  total: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

// ================================
// CUSTOMER TAB
// ================================

/**
 * Customer tab for splitting orders
 * Allows multiple customers at a table to have separate bills
 */
export interface CustomerTab {
  id: string;
  tableId: number;
  name: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paidAmount?: number;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
}

/**
 * Customer tab summary for display
 */
export interface CustomerTabSummary {
  id: string;
  name: string;
  itemCount: number;
  total: number;
  paymentStatus: PaymentStatus;
}

// ================================
// TABLE ORDER ITEM
// ================================

/**
 * Extended order item for table orders
 * Includes customer tab assignment
 */
export interface TableOrderItem extends OrderItem {
  customerTabId?: string;
  customerName?: string;
  customerNumber?: number;
  sentToKitchen?: boolean;
  sentAt?: string;
}

// ================================
// TABLE ORDERS STORE STATE
// ================================

/**
 * Table orders store state
 * Complete interface for the tableOrdersStore
 */
export interface TableOrdersState {
  // ================================
  // STATE PROPERTIES
  // ================================

  /** In-memory table orders (session state) */
  tableOrders: Record<number, TableOrder>;

  /** Persisted table orders (from Supabase) */
  persistedTableOrders: Record<number, PersistentTableOrder>;

  /** Loading state */
  isLoading: boolean;

  /** Syncing state */
  isSyncing: boolean;

  /** Error state */
  error: string | null;

  /** Currently selected table ID */
  selectedTableId: number | null;

  /** Customer tabs by table ID */
  customerTabs: Record<number, CustomerTab[]>;

  /** Active customer tab by table ID */
  activeCustomerTab: Record<number, string | null>;

  /** Optimistic customer tabs (for UI updates before sync) */
  optimisticCustomerTabs: Record<number, CustomerTab[]>;

  // ================================
  // TABLE ACTIONS
  // ================================

  /** Select a table */
  selectTable: (tableId: number | null) => void;

  /** Load table orders from database */
  loadTableOrders: () => Promise<void>;

  /** Get order for a specific table */
  getTableOrder: (tableId: number) => TableOrder | undefined;

  /** Create a new table order */
  createTableOrder: (tableId: number, tableNumber: number) => Promise<TableOrder>;

  /** Update a table order */
  updateTableOrder: (tableId: number, updates: Partial<TableOrder>) => Promise<void>;

  /** Close a table order */
  closeTableOrder: (tableId: number) => Promise<void>;

  // ================================
  // ITEM ACTIONS
  // ================================

  /** Add item to table order */
  addItemToTable: (tableId: number, item: OrderItem, customerTabId?: string) => Promise<void>;

  /** Remove item from table order */
  removeItemFromTable: (tableId: number, itemId: string) => Promise<void>;

  /** Update item quantity */
  updateItemQuantity: (tableId: number, itemId: string, quantity: number) => Promise<void>;

  /** Move item to different customer tab */
  moveItemToTab: (tableId: number, itemId: string, targetTabId: string) => Promise<void>;

  // ================================
  // CUSTOMER TAB ACTIONS
  // ================================

  /** Create a new customer tab */
  createCustomerTab: (tableId: number, name: string) => Promise<CustomerTab>;

  /** Update a customer tab */
  updateCustomerTab: (tableId: number, tabId: string, updates: Partial<CustomerTab>) => Promise<void>;

  /** Delete a customer tab */
  deleteCustomerTab: (tableId: number, tabId: string) => Promise<void>;

  /** Set active customer tab */
  setActiveCustomerTab: (tableId: number, tabId: string | null) => void;

  /** Get customer tabs for a table */
  getCustomerTabs: (tableId: number) => CustomerTab[];

  // ================================
  // PAYMENT ACTIONS
  // ================================

  /** Mark tab as paid */
  markTabPaid: (tableId: number, tabId: string, paymentMethod: string, amount: number) => Promise<void>;

  /** Split bill equally */
  splitBillEqually: (tableId: number, numberOfSplits: number) => Promise<void>;

  /** Calculate table totals */
  calculateTableTotals: (tableId: number) => { subtotal: number; total: number };

  // ================================
  // SYNC ACTIONS
  // ================================

  /** Sync with database */
  syncWithDatabase: () => Promise<void>;

  /** Initialize real-time subscription */
  initRealtimeSubscription: () => void;

  /** Cleanup subscription */
  cleanupSubscription: () => void;

  // ================================
  // UTILITY ACTIONS
  // ================================

  /** Reset store state */
  reset: () => void;

  /** Set loading state */
  setLoading: (loading: boolean) => void;

  /** Set error state */
  setError: (error: string | null) => void;
}

// ================================
// API MAPPERS
// ================================

/**
 * Map API table order to TableOrder
 */
export function mapApiTableOrderToTableOrder(apiOrder: any): TableOrder {
  return {
    id: apiOrder.id,
    tableId: apiOrder.table_id,
    tableNumber: apiOrder.table_number,
    orderType: apiOrder.order_type || 'DINE-IN',
    status: apiOrder.status || 'PENDING',
    items: (apiOrder.items || apiOrder.order_items || []).map(mapApiTableOrderItem),
    customerTabs: apiOrder.customer_tabs,
    subtotal: apiOrder.subtotal ?? 0,
    total: apiOrder.total ?? 0,
    tip: apiOrder.tip,
    discount: apiOrder.discount,
    discountCode: apiOrder.discount_code,
    paymentStatus: apiOrder.payment_status || 'UNPAID',
    createdAt: apiOrder.created_at,
    updatedAt: apiOrder.updated_at,
    completedAt: apiOrder.completed_at,
    notes: apiOrder.notes,
    serverName: apiOrder.server_name,
    serverId: apiOrder.server_id,
  };
}

/**
 * Map API table order item
 */
export function mapApiTableOrderItem(apiItem: any): TableOrderItem {
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
    customerTabId: apiItem.customer_tab_id,
    customerName: apiItem.customer_name,
    customerNumber: apiItem.customer_number,
    sentToKitchen: apiItem.sent_to_kitchen,
    sentAt: apiItem.sent_at,
    kitchenDisplayName: apiItem.kitchen_display_name,
    status: apiItem.status,
    itemType: apiItem.item_type,
    setMealCode: apiItem.set_meal_code,
    setMealItems: apiItem.set_meal_items,
  };
}

/**
 * Map API customer tab
 */
export function mapApiCustomerTab(apiTab: any): CustomerTab {
  return {
    id: apiTab.id,
    tableId: apiTab.table_id,
    name: apiTab.name,
    items: (apiTab.items || []).map(mapApiTableOrderItem),
    subtotal: apiTab.subtotal ?? 0,
    total: apiTab.total ?? 0,
    paymentStatus: apiTab.payment_status || 'UNPAID',
    paymentMethod: apiTab.payment_method,
    paidAmount: apiTab.paid_amount,
    createdAt: apiTab.created_at,
    updatedAt: apiTab.updated_at,
    isActive: apiTab.is_active ?? true,
  };
}
