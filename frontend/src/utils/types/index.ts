/**
 * Types Index
 *
 * Barrel export for all type definitions.
 * Import from 'utils/types' for clean imports.
 *
 * Usage:
 *   import { MenuItem, Category, ItemVariant } from 'utils/types';
 *   import { toMenuItemCamelCase } from 'utils/types';
 */

// Core menu types (snake_case - matches database)
export type {
  Category,
  ProteinType,
  SetMealItem,
  SetMeal,
  ImageVariants,
  ItemVariant,
  MenuItem,
  SuggestedMenuItem,
  CartItemVariant,
  Modifier,
  ModifierSelection,
  CustomizationSelection,
  Customization,
  OrderSetMealItem,
  OrderItemVariant,
  OrderItem,
  DeliveryFeeTier,
  MinimumOrderTier,
  RestaurantLocation,
  DeliverySettings,
  OrderType,
  OrderStatus,
  Order,
  TableStatus,
  Table,
  PaymentMethod,
  PaymentResult,
  MenuBundle,
} from './menu.types';

// Type guards
export { isSetMeal, hasProteinType, hasVariants } from './menu.types';

// Transformers (for migration compatibility)
export {
  snakeToCamel,
  camelToSnake,
  transformKeysToCamel,
  transformKeysToSnake,
  toMenuItemCamelCase,
  toVariantCamelCase,
  toMenuItemSnakeCase,
  toVariantSnakeCase,
  toPaymentResultSnakeCase,
  toDeliverySettingsSnakeCase,
} from './menu.transformers';

// Legacy camelCase types (deprecated - use snake_case from menu.types)
export type {
  MenuItemCamelCase,
  ItemVariantCamelCase,
} from './menu.transformers';

// Legacy type aliases for backward compatibility
// These will be removed in a future version
import type { Category, Customization, CartItemVariant } from './menu.types';

/** @deprecated Use Category instead */
export type MenuCategory = Category;

/** @deprecated Use CartItemVariant instead */
export type MenuItemVariant = CartItemVariant;

/** @deprecated Use Customization instead */
export type CustomizationBase = Customization;
