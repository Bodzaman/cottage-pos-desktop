/**
 * Types - Central Type Definitions
 *
 * This is the main entry point for all type definitions in the application.
 * Import types from here rather than individual files for consistency.
 *
 * @example
 * import { MenuItem, OrderItem, CartItem, OrderMode } from 'types';
 */

// ================================
// COMMON TYPES
// ================================
export {
  // Order modes
  type OrderMode,
  type OrderType,
  orderTypeToMode,
  orderModeToType,

  // Status types
  type OrderStatus,
  type KitchenItemStatus,
  type PaymentStatus,
  type TableStatus,

  // Payment
  type PaymentMethodType,
  type PaymentResult,

  // Item types
  type ItemType,
  type InheritanceState,
  type ImageSource,

  // Form status
  type StepStatus,

  // Utility types
  type EntityId,
  type ISOTimestamp,
  type Nullable,
  type Optional,
  type DeepPartial,
  type RequiredFields,
} from './common';

// ================================
// MENU TYPES
// ================================
export {
  // Category
  type MenuCategory,
  type ExtendedMenuCategory,
  type Category, // Legacy alias

  // Protein
  type ProteinType,

  // Variants
  type ItemVariant,
  type CartMenuItemVariant,
  type MenuItemVariant, // Legacy alias

  // Menu items
  type MenuItem,
  type SuggestedMenuItem,

  // Set meals
  type SetMeal,
  type SetMealItem,

  // Customizations & modifiers
  type Customization,
  type Modifier,
  type ModifierSelection,
  type CustomizationSelection,

  // Form data
  type MenuItemFormData,

  // API mappers
  mapApiCategoryToMenuCategory,
  mapApiItemToMenuItem,
  mapApiVariantToItemVariant,
  mapApiProteinToProteinType,
  mapMenuItemToApi,
} from './menu';

// ================================
// ORDER TYPES
// ================================
export {
  // Order items
  type OrderItem,
  type ReceiptOrderItem,

  // Orders
  type Order,
  type CompletedOrder,
  type OnlineOrder,
  type KitchenOrder,

  // Delivery
  type DeliveryAddress,
  type CustomerAddress,
  type DeliveryValidationRequest,
  type DeliveryValidationResponse,
  type DeliverySettings,

  // Tips
  type TipSelection,

  // API mappers
  mapApiOrderToOrder,
  mapApiOrderItemToOrderItem,
  mapOrderToApi,
  mapOrderItemToApi,
  mapApiDeliveryAddress,
} from './orders';

// ================================
// CART TYPES
// ================================
export {
  // Cart customization
  type CartCustomization,
  type SelectedCustomization,

  // Cart items
  type CartItem,
  type CartItemVariant,

  // Cart state
  type CartState,

  // Selectors
  type CartItemsSelector,
  type CartTotalSelector,
  type CartItemCountSelector,
  type OrderModeSelector,

  // Helpers
  getPriceForMode,
  calculateTotalItems,
  calculateTotalAmount,
  generateCartItemId,

  // Events
  type CartEvent,
  type CartAnalyticsPayload,
} from './cart';

// ================================
// TABLE TYPES
// ================================
export {
  // Tables
  type Table,
  type TableData,

  // Table orders
  type TableOrder,
  type PersistentTableOrder,
  type TableOrderItem,

  // Customer tabs
  type CustomerTab,
  type CustomerTabSummary,

  // Store state
  type TableOrdersState,

  // API mappers
  mapApiTableOrderToTableOrder,
  mapApiTableOrderItem,
  mapApiCustomerTab,
} from './tables';

// ================================
// RE-EXPORTS FOR COMPATIBILITY
// ================================

// These are commonly imported types that should be available from 'types'
// This maintains backward compatibility with existing imports

/**
 * @deprecated Import directly from 'types' instead of using this namespace
 */
export const Types = {
  // This object is for IDE autocomplete hints only
  // Use direct exports instead
};
