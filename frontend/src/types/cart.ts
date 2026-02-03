/**
 * Cart Types - Cart state and item definitions
 *
 * This file contains the complete type definitions for the cart system.
 * These types are used by the Zustand cart store and all cart-related components.
 */

import type { OrderMode } from './common';
import type { MenuItem } from './menu';

// ================================
// FLEXIBLE INPUT TYPES
// ================================

/**
 * Flexible MenuItem input type - accepts both camelCase and snake_case properties.
 * This enables compatibility with both types/menu.ts and utils/menuTypes.ts.
 */
export type MenuItemInput = {
  id: string;
  name: string;
  description?: string | null;
  // CamelCase pricing
  price?: number;
  basePrice?: number;
  priceDelivery?: number;
  priceTakeaway?: number;
  priceCollection?: number;
  imageUrl?: string | null;
  // Snake_case pricing (from menuTypes.ts)
  base_price?: number;
  price_delivery?: number;
  price_takeaway?: number;
  image_url?: string | null;
};

// ================================
// CART CUSTOMIZATION
// ================================

/**
 * Base customization interface for shared properties
 */
interface BaseCustomization {
  id: string;
  name: string;
  group?: string | null;
}

/**
 * Cart customization (add-ons, modifications)
 * Compatible with SelectedCustomization for modal interop
 */
export interface CartCustomization extends BaseCustomization {
  price: number;
  price_adjustment?: number; // Alias for compatibility
}

/**
 * Selected customization (for POS and order modals)
 * Uses snake_case for price_adjustment to match DB schema
 */
export interface SelectedCustomization extends BaseCustomization {
  price_adjustment: number;
  price?: number; // Alias for compatibility
  is_adhoc?: boolean; // True for staff-created one-off customizations
  is_free?: boolean; // True when price_adjustment is 0
}

/**
 * Type guard to convert CartCustomization[] to SelectedCustomization[]
 */
export function toSelectedCustomizations(items: CartCustomization[]): SelectedCustomization[] {
  return items.map(item => ({
    id: item.id,
    name: item.name,
    price_adjustment: item.price_adjustment ?? item.price,
    price: item.price,
    group: item.group ?? undefined,
  }));
}

/**
 * Type guard to convert SelectedCustomization[] to CartCustomization[]
 */
export function toCartCustomizations(items: SelectedCustomization[]): CartCustomization[] {
  return items.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price ?? item.price_adjustment,
    price_adjustment: item.price_adjustment,
    group: item.group,
  }));
}

// ================================
// CART ITEM
// ================================

/**
 * Cart item variant info
 * Extended to be compatible with ItemVariant from types/menu.ts
 */
export interface CartItemVariant {
  id?: string;
  name: string;
  price?: number;
  variantName?: string;
  variant_name?: string; // Snake_case alias
  imageUrl?: string;
  displayImageUrl?: string;
  customizations?: CartCustomization[];

  // Additional fields for ItemVariant compatibility
  menuItemId?: string;
  menu_item_id?: string;
  proteinTypeId?: string | null;
  protein_type_id?: string | null;
  isDefault?: boolean;
  is_default?: boolean;
  priceDineIn?: number | null;
  price_dine_in?: number | null;
  priceDelivery?: number | null;
  price_delivery?: number | null;
  priceTakeaway?: number | null;
  price_takeaway?: number | null;
}

/**
 * Cart item definition
 * Represents a single item in the shopping cart
 */
export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  description?: string;
  price: number;
  priceDelivery?: number;
  priceCollection?: number;
  quantity: number;
  variant?: CartItemVariant;
  variantName?: string | null;
  customizations?: CartCustomization[];
  imageUrl?: string | null;
  notes?: string;
  orderMode: OrderMode;

  // Price change tracking (for mode switching)
  priceChanged?: boolean;
  oldPrice?: number;

  // Extended fields
  extrasSelected?: any[];
  categoryId?: string;
  categoryName?: string;
}

// ================================
// CART STATE
// ================================

/**
 * Undo stack entry for restoring removed items
 */
export interface UndoStackEntry {
  item: CartItem;
  action: 'remove' | 'clear';
  timestamp: number;
}

/**
 * Last added item info for fly-to-cart animation
 */
export interface LastAddedItem {
  id: string;
  name: string;
  imageUrl?: string | null;
  position: { x: number; y: number };
}

/**
 * Complete cart state interface
 * Defines all properties and methods available in the cart store
 */
export interface CartState {
  // ================================
  // STATE PROPERTIES
  // ================================

  /** Cart items array */
  items: CartItem[];

  /** Total number of items (sum of quantities) */
  totalItems: number;

  /** Total cart amount */
  totalAmount: number;

  /** Current order mode (delivery/collection) */
  currentOrderMode: OrderMode;

  /** Last saved timestamp */
  lastSavedAt?: number | string;

  /** User ID (null for guest) */
  userId: string | null;

  /** Session ID for cart tracking */
  sessionId: string;

  /** Cart schema version for migrations */
  schemaVersion: number;

  /** Global cart drawer state (OnlineOrders sidebar) */
  isCartOpen: boolean;

  /** Chat cart drawer state (ChatLargeModal) */
  isChatCartOpen: boolean;

  /** Whether cart is empty (computed) */
  isEmpty?: boolean;

  /** Currently editing item ID */
  editingItemId: string | null;

  // ================================
  // UNDO SYSTEM STATE
  // ================================

  /** Stack of removed items for undo functionality */
  undoStack: UndoStackEntry[];

  /** ID of item currently being undone (for animation) */
  pendingUndo: string | null;

  // ================================
  // ANIMATION STATE
  // ================================

  /** Last added item info for fly-to-cart animation */
  lastAddedItem: LastAddedItem | null;

  /** Animation trigger key (changes trigger re-render) */
  animationTrigger: string | null;

  // ================================
  // COMPUTED METHODS
  // ================================

  /** Get cart age in days */
  getCartAge: () => number;

  /** Check if cart is stale (> 7 days) */
  isCartStale: () => boolean;

  /** Get formatted cart summary for AI context */
  getFormattedSummary: () => string;

  // ================================
  // CART DRAWER ACTIONS
  // ================================

  /** Open the cart drawer */
  openCart: () => void;

  /** Close the cart drawer */
  closeCart: () => void;

  /** Toggle the cart drawer */
  toggleCart: () => void;

  /** Close the chat cart drawer */
  closeChatCart: () => void;

  /** Toggle the chat cart drawer */
  toggleChatCart: () => void;

  /** Open the chat cart drawer */
  openChatCart: () => void;

  // ================================
  // EDITING ACTIONS
  // ================================

  /** Set the item being edited */
  setEditingItem: (itemId: string | null) => void;

  /** Clear the editing state */
  clearEditingItem: () => void;

  // ================================
  // ORDER MODE ACTIONS
  // ================================

  /** Set the order mode */
  setOrderMode: (mode: OrderMode) => void;

  /** Update prices based on order mode */
  updatePricesForMode: (newMode: OrderMode) => void;

  /** Clear price change flags after display */
  clearPriceChangeFlags: () => void;

  // ================================
  // CART ITEM ACTIONS
  // ================================

  /** Add an item to the cart (accepts both camelCase and snake_case MenuItem) */
  addItem: (
    item: MenuItemInput,
    variant: any,
    quantity: number,
    customizations?: CartCustomization[],
    orderMode?: OrderMode,
    notes?: string
  ) => Promise<void>;

  /** Remove an item from the cart */
  removeItem: (itemId: string) => Promise<void>;

  /** Update item quantity (immediate) */
  updateQuantity?: (itemId: string, quantity: number) => void;

  /** Update item quantity (alias for updateQuantity) */
  updateItemQuantity?: (itemId: string, quantity: number) => void;

  /** Update item quantity (debounced) */
  updateQuantityDebounced: (itemId: string, quantity: number) => void;

  /** Update item notes/special instructions */
  updateItemNotes?: (itemId: string, notes: string) => void;

  /** Update an existing item in the cart */
  updateItem?: (
    itemId: string,
    updates: Partial<CartItem>
  ) => void;

  /** Clear all items from the cart */
  clearCart: () => Promise<void>;

  // ================================
  // SYNC & PERSISTENCE
  // ================================

  /** Fetch cart from Supabase (legacy - now uses local persistence) */
  fetchCartFromSupabase: () => Promise<void>;

  /** Set cart from AI voice ordering response */
  setCartFromAI: (
    backendCartItems: any[],
    totalAmount: number,
    orderMode: OrderMode
  ) => void;

  /** Migrate guest cart to authenticated user */
  migrateGuestCartToUser: (userId: string) => Promise<void>;

  /** Save cart to backend */
  saveCartToBackend: (userId: string) => Promise<void>;

  // ================================
  // REAL-TIME SUBSCRIPTION
  // ================================

  /** Initialize real-time subscription */
  initRealtimeSubscription: () => void;

  /** Cleanup real-time subscription */
  cleanupRealtimeSubscription: () => void;

  // ================================
  // UNDO SYSTEM ACTIONS
  // ================================

  /** Push removed item to undo stack */
  pushToUndoStack: (item: CartItem, action: 'remove' | 'clear') => void;

  /** Undo the last remove action */
  undoLastAction: () => void;

  /** Clear a specific item from undo stack */
  clearFromUndoStack: (itemId: string) => void;

  /** Clear all items from undo stack */
  clearUndoStack: () => void;

  // ================================
  // ANIMATION ACTIONS
  // ================================

  /** Set last added item for fly animation */
  setLastAddedItem: (item: LastAddedItem | null) => void;

  /** Trigger animation (increments key) */
  triggerAnimation: () => void;

  /** Clear animation state */
  clearAnimationState: () => void;
}

// ================================
// CART SELECTORS
// ================================

/**
 * Type for cart item selector
 */
export type CartItemsSelector = (state: CartState) => CartItem[];

/**
 * Type for cart total selector
 */
export type CartTotalSelector = (state: CartState) => number;

/**
 * Type for cart item count selector
 */
export type CartItemCountSelector = (state: CartState) => number;

/**
 * Type for order mode selector
 */
export type OrderModeSelector = (state: CartState) => OrderMode;

// ================================
// CART HELPERS
// ================================

/**
 * Get the correct price for a given order mode
 */
export function getPriceForMode(
  mode: OrderMode,
  priceDelivery?: number,
  priceCollection?: number,
  fallbackPrice?: number
): number {
  if (mode === 'delivery') {
    return priceDelivery ?? priceCollection ?? fallbackPrice ?? 0;
  }
  return priceCollection ?? fallbackPrice ?? 0;
}

/**
 * Calculate total number of items in cart
 */
export function calculateTotalItems(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Calculate total cart amount
 */
export function calculateTotalAmount(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    const price = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
    return sum + price * item.quantity;
  }, 0);
}

/**
 * Generate a unique cart item ID
 */
export function generateCartItemId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ================================
// CART EVENT TYPES
// ================================

/**
 * Cart event for analytics
 */
export interface CartEvent {
  type: 'item_added' | 'item_removed' | 'quantity_changed' | 'cart_cleared' | 'mode_switched';
  itemId?: string;
  itemName?: string;
  quantity?: number;
  price?: number;
  orderMode?: OrderMode;
  timestamp: number;
}

/**
 * Cart analytics payload
 */
export interface CartAnalyticsPayload {
  sessionId: string;
  userId?: string | null;
  event: CartEvent;
  cartValue: number;
  itemCount: number;
}
