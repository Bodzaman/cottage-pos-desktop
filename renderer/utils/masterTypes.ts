/**
 * Master Types File - Form & Admin Extensions
 * 
 * This file extends base types from menuTypes.ts with form-specific fields.
 * 
 * **IMPORTANT - Type Usage Guide:**
 * - For runtime/POS/cart/orders → import from 'utils/menuTypes'
 * - For admin forms/management → import from 'utils/masterTypes'
 * 
 * This file should ONLY contain:
 * 1. Re-exports of base types from menuTypes
 * 2. Form-specific extensions (MenuItemFormData)
 * 3. API mapping helpers
 * 4. Admin-specific type aliases
 */

import type { 
  Category, 
  MenuItem, 
  ItemVariant, 
  ProteinType as BaseProteinType,
  SetMeal,
  SetMealItem,
  OrderItem,
  Order,
  CustomizationBase,
  ModifierSelection,
  CustomizationSelection
} from './menuTypes';

// ================================
// RE-EXPORTS FROM menuTypes
// ================================

/**
 * Re-export base types with standardized names
 * These are the canonical runtime types
 */
export type { 
  Category, 
  MenuItem, 
  ItemVariant,
  SetMeal,
  SetMealItem,
  OrderItem,
  Order,
  ModifierSelection,
  CustomizationSelection
} from './menuTypes';

/**
 * Alias for backward compatibility
 * @deprecated Use Category from menuTypes instead
 */
export type MenuCategory = Category;

/**
 * Alias for backward compatibility  
 * @deprecated Use ItemVariant from menuTypes instead
 */
export type MenuItemVariant = ItemVariant;

/**
 * ProteinType with menu_order field for admin consistency
 */
export interface ProteinType extends BaseProteinType {
  menu_order?: number; // Admin display order (maps from display_order)
  created_at?: string;
  updated_at?: string;
}

/**
 * Customization type with admin fields
 */
export interface Customization extends CustomizationBase {
  menu_order?: number; // Unified ordering field
}

// ================================
// FORM-SPECIFIC TYPES
// ================================

/**
 * Form data structure for menu item editing
 * Extends base MenuItem with all possible form fields
 */
export interface MenuItemFormData {
  id?: string;
  name: string;
  kitchen_display_name?: string; // Optional field for optimized thermal receipt printing
  menu_item_description?: string;
  category_id: string;
  spice_indicators?: string;
  featured?: boolean;
  dietary_tags?: string[];
  item_code?: string;
  menu_order?: number; // Unified ordering field - replaces display_order
  
  // ✅ Food-specific fields (matches database schema)
  spice_level?: number; // Replaces old default_spice_level
  allergens?: string[]; // Existing allergens array
  allergen_warnings?: string; // New: Text warnings for allergens
  specialty_notes?: string; // New: Chef's notes (max 1000 chars)
  chefs_special?: boolean; // New: Flag for chef's specials
  
  // Pricing fields for different serving sizes
  price?: number;
  price_dine_in?: number;
  price_delivery?: number;
  
  // Variant fields
  variants?: ItemVariant[];
  
  // Drinks & Wine specific fields
  serving_size_125ml?: boolean;
  serving_size_125ml_price?: number;
  serving_size_175ml?: boolean;
  serving_size_175ml_price?: number;
  serving_size_250ml?: boolean;
  serving_size_250ml_price?: number;
  serving_size_bottle?: boolean;
  serving_size_bottle_price?: number;
  
  // Coffee & Desserts specific fields
  serving_size_regular?: boolean;
  serving_size_regular_price?: number;
  serving_size_large?: boolean;
  serving_size_large_price?: number;
  serving_size_decaf?: boolean;
  serving_size_decaf_price?: number;
  
  // Beer specific fields
  serving_size_half_pint?: boolean;
  serving_size_half_pint_price?: number;
  serving_size_pint?: boolean;
  serving_size_pint_price?: number;
}

// ================================
// API COMPATIBILITY LAYER
// ================================

/**
 * API Response Types - maintain exact compatibility with backend
 */
export interface MenuCategoryData {
  id: string;
  name: string;
  display_order: number;
  active: boolean; // API returns 'active'
  description?: string | null;
  parent_category_id?: string | null;
}

export interface MenuItemData {
  id: string;
  name: string;
  menu_item_description?: string | null;
  category_id: string;
  category_name?: string;
  display_order: number;
  active: boolean; // API returns 'active'
  featured: boolean;
  spice_indicators?: string | null;
  dietary_tags?: string[] | null;
  image_url?: string | null;
  has_variants?: boolean;
  item_type?: string;
}

// ================================
// TYPE COMPATIBILITY HELPERS
// ================================

/**
 * Converts API category data to internal Category type
 * Handles field name mapping and normalization
 */
export function mapApiCategoryToMenuCategory(apiCategory: any): Category {
  return {
    id: apiCategory.id,
    name: apiCategory.name,
    description: apiCategory.description,
    display_order: apiCategory.menu_order || apiCategory.display_order || 0,
    print_order: apiCategory.print_order || apiCategory.display_order || 0,
    print_to_kitchen: apiCategory.print_to_kitchen ?? true,
    image_url: apiCategory.image_url,
    parent_category_id: apiCategory.parent_category_id || apiCategory.parent_id,
    active: apiCategory.active ?? apiCategory.is_active ?? true,
    is_protein_type: apiCategory.is_protein_type,
  };
}

/**
 * Converts API menu item data to internal MenuItem type
 */
export function mapApiItemToMenuItem(apiItem: any): MenuItem {
  return {
    id: apiItem.id,
    name: apiItem.name,
    kitchen_display_name: apiItem.kitchen_display_name,
    description: apiItem.menu_item_description || apiItem.description,
    image_url: apiItem.image_url,
    image_variants: apiItem.image_variants,
    spice_indicators: apiItem.spice_indicators,
    category_id: apiItem.category_id,
    featured: apiItem.featured ?? false,
    dietary_tags: apiItem.dietary_tags,
    item_code: apiItem.item_code,
    display_order: apiItem.menu_order || apiItem.display_order || 0,
    active: apiItem.active ?? apiItem.is_active ?? true,
    inherit_category_print_settings: apiItem.inherit_category_print_settings,
    is_set_meal: apiItem.is_set_meal,
    set_meal_id: apiItem.set_meal_id,
    set_meal_code: apiItem.set_meal_code,
    variants: apiItem.variants || [],
    price: apiItem.price,
    price_dine_in: apiItem.price_dine_in,
    price_takeaway: apiItem.price_takeaway,
    price_delivery: apiItem.price_delivery,
  };
}

/**
 * Converts API protein type data to internal ProteinType
 */
export function mapApiProteinToProteinType(apiProtein: any): ProteinType {
  return {
    id: apiProtein.id,
    name: apiProtein.name,
    price_adjustment: apiProtein.price_adjustment,
    category_id: apiProtein.category_id,
    active: apiProtein.active ?? apiProtein.is_active ?? true,
    menu_order: apiProtein.menu_order || apiProtein.display_order || 0,
    created_at: apiProtein.created_at,
    updated_at: apiProtein.updated_at,
  };
}

// ================================
// UTILITY TYPES
// ================================

/**
 * Order Type - Canonical definition for all order modes across the application
 * Used by POS, online ordering, receipts, and analytics
 */
export type OrderType = 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING' | 'ONLINE_ORDERS';
export type PaymentMethodType = 'CARD' | 'CASH' | 'CUSTOMER_PAYS' | 'ALREADY_PAID' | 'SMS_PAYMENT_LINK' | 'QR_AT_DOOR';
export type ItemType = 'food' | 'drinks_wine' | 'coffee_desserts';
export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

// ================================
// DEFAULT EXPORT
// ================================

export default {
  mapApiCategoryToMenuCategory,
  mapApiItemToMenuItem,
  mapApiProteinToProteinType,
};
