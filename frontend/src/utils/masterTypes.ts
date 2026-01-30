


/**
 * Master Types File - Single Source of Truth for Menu System
 * 
 * This file contains standardized type definitions for the entire menu system.
 * All components should import from this file to ensure consistency.
 * 
 * API Compatibility: This file maintains backward compatibility with existing 
 * API responses while providing consistent internal type safety.
 */

// ================================
// CORE ENTITY TYPES
// ================================

/**
 * Standardized Category interface
 * Maps database fields with compatibility for both is_active and active
 */
export interface MenuCategory {
  id: string;
  name: string;
  description?: string | null;
  menu_order: number; // Unified ordering field - replaces display_order and print_order
  print_to_kitchen: boolean;
  image_url?: string | null;
  parent_category_id?: string | null; // Hierarchical relationships
  active: boolean; // Internal standard - maps from is_active or active
  is_protein_type?: boolean; // Special category flag
  
  // Extended properties for UI components
  children?: MenuCategory[]; // For hierarchical display
  item_count?: number; // For category summaries
}

/**
 * Standardized MenuItem interface
 * Unified structure for all menu items across POS and website
 */
export interface MenuItem {
  id: string;
  name: string;
  description?: string | null; // CamelCase alias for compatibility
  menu_item_description?: string | null; // Unified description field
  long_description?: string | null; // Extended description
  image_url?: string | null;
  spice_indicators?: string | null;
  category_id: string;
  categoryId?: string; // CamelCase alias
  featured: boolean;
  dietary_tags?: string[] | null;
  item_code?: string | null;
  menu_order: number; // Unified ordering field - replaces display_order
  display_order?: number; // Alias for menu_order
  menuOrder?: number; // CamelCase alias
  active: boolean; // Internal standard
  is_active?: boolean; // Snake_case alias
  inherit_category_print_settings?: boolean;

  // Set meal properties
  is_set_meal?: boolean;
  set_meal_id?: string | null;
  set_meal_code?: string | null;

  // Pricing fields
  price?: number; // Base price alias
  base_price?: number;
  basePrice?: number; // CamelCase alias
  price_dine_in?: number;
  priceDineIn?: number; // CamelCase alias
  dine_in_price?: number; // Alternative alias
  price_delivery?: number;
  priceDelivery?: number; // CamelCase alias
  price_takeaway?: number;
  priceTakeaway?: number; // CamelCase alias

  // Variants and pricing
  variants: MenuItemVariant[];
  has_variants?: boolean; // Computed property
  hasVariants?: boolean; // CamelCase alias
  item_type?: 'food' | 'drinks_wine' | 'coffee_desserts'; // Item classification

  // Draft/Publish workflow
  published_at?: string | null; // Timestamp when item was last published, null = draft
  hasPublishedSnapshot?: boolean; // Flag indicating item has a snapshot and can be reverted
}

/**
 * Standardized Menu Item Variant interface
 * Handles all pricing variations and protein types
 */
export interface MenuItemVariant {
  id: string;
  menu_item_id: string;
  protein_type_id?: string | null;
  protein_type?: ProteinType; // Populated from join
  name?: string | null; // Custom variant name
  variant_name?: string | null; // Auto-generated full name (e.g., "Chicken Tikka Masala")
  
  // Pricing structure - standardized across all order types
  price: number; // Base price (takeaway)
  price_takeaway?: number | null; // Explicit takeaway price (alias for price)
  price_dine_in?: number | null;
  price_delivery?: number | null;
  
  // Variant properties
  is_default: boolean;
  description_override?: string | null;
  spice_level_override?: number | null;
  dietary_tags_override?: string[] | null;
  
  // Image and description with three-state inheritance
  image_url?: string | null; // Raw DB value
  image_asset_id?: string | null; // Raw DB value
  image_state?: 'inherited' | 'custom' | 'none'; // State tracking
  description?: string | null; // Raw DB value
  description_state?: 'inherited' | 'custom' | 'none'; // State tracking
  
  // Resolved display fields (computed by backend variant_resolver)
  display_image_url?: string | null; // What to actually display
  display_description?: string | null; // What to actually display
  image_source?: 'variant' | 'inherited' | 'none'; // Where it came from
  description_source?: 'variant' | 'inherited' | 'none'; // Where it came from
  
  // Availability flags
  available_for_delivery?: boolean;
  available_for_takeaway?: boolean;
  available_for_dine_in?: boolean;

  // Dietary flags
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  is_halal?: boolean;
  is_dairy_free?: boolean;
  is_nut_free?: boolean;

  // Spice and allergen info
  spice_level?: number | null;
  allergens?: Record<string, "contains" | "may_contain"> | string[] | null;
  allergen_notes?: string | null;

  // Display flags
  featured?: boolean;

  // System fields
  variant_code?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Standardized Protein Type interface
 * Used for variant protein selections
 */
export interface ProteinType {
  id: string;
  name: string;
  price_adjustment?: number | null;
  category_id?: string;
  menu_order: number; // Unified ordering field - replaces display_order
  active: boolean; // Internal standard
  created_at?: string;
  updated_at?: string;
}

/**
 * Standardized Customization interface
 * Unified modifier and add-on system
 */
export interface Customization {
  id: string;
  name: string;
  price?: number | null;
  description?: string | null;
  customization_group?: string;
  menu_order?: number; // Unified ordering field - replaces display_order
  is_exclusive?: boolean;
  is_active?: boolean; // Maps to active internally
  show_on_pos?: boolean;
  show_on_website?: boolean;
  ai_voice_agent?: boolean; // Voice orders can request this add-on
  is_global?: boolean;
  item_ids?: string[];
  published_at?: string | null; // Timestamp when published (null = draft)
}

/**
 * Standardized Set Meal interface
 */
export interface SetMeal {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  hero_image_url?: string | null;
  hero_image_asset_id?: string | null;
  set_price: number;
  active: boolean; // Internal standard
  items: SetMealItem[];
  individual_items_total: number;
  savings: number;
  created_at: string;
  updated_at: string;

  // Draft/Publish workflow - same pattern as menu_items
  published_at?: string | null; // Timestamp when published, null = draft

  // POS integration fields
  item_type: 'set_meal';
  category_id?: string;
}

/**
 * Set Meal Item component
 */
export interface SetMealItem {
  id: string;
  menu_item_id: string;
  menu_item_name: string;
  menu_item_image_url?: string | null;
  quantity: number;
  item_price: number;
  category_name?: string | null;
}

// ================================
// ORDER & CART TYPES
// ================================

/**
 * Order Item for carts and orders
 */
export interface OrderItem {
  id: string;
  menu_item_id: string;
  variant_id: string;
  name: string;
  quantity: number;
  price: number;
  variantName?: string;
  notes?: string;
  protein_type?: string;
  image_url?: string;
  modifiers: ModifierSelection[];
  customizations?: CustomizationSelection[];
  
  // Set meal fields
  item_type?: 'menu_item' | 'set_meal';
  set_meal_code?: string;
  set_meal_items?: Array<{
    menu_item_name: string;
    quantity: number;
    category_name?: string;
  }>;
}

/**
 * Selected modifier in an order
 */
export interface ModifierSelection {
  id: string;
  modifier_id: string;
  name: string;
  price_adjustment: number;
}

/**
 * Selected customization in an order
 */
export interface CustomizationSelection {
  id: string;
  customization_id: string;
  name: string;
  price_adjustment: number;
  group?: string;
}

/**
 * Standard Order interface
 */
export interface Order {
  id: string;
  order_type: 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
  table_number?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  items: OrderItem[];
  subtotal: number;
  total: number;
  created_at: string;
  updated_at: string;
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
 * Converts API category data to internal MenuCategory
 * Handles field name mapping and normalization
 */
export function mapApiCategoryToMenuCategory(apiCategory: any): MenuCategory {
  return {
    id: apiCategory.id,
    name: apiCategory.name,
    description: apiCategory.description,
    menu_order: apiCategory.menu_order || apiCategory.display_order || 0, // Unified field with fallback
    print_to_kitchen: apiCategory.print_to_kitchen ?? true,
    image_url: apiCategory.image_url,
    parent_category_id: apiCategory.parent_category_id || apiCategory.parent_id,
    active: apiCategory.active ?? apiCategory.is_active ?? true,
    is_protein_type: apiCategory.is_protein_type,
  };
}

/**
 * Converts API menu item data to internal MenuItem
 */
export function mapApiItemToMenuItem(apiItem: any): MenuItem {
  return {
    id: apiItem.id,
    name: apiItem.name,
    menu_item_description: apiItem.menu_item_description || apiItem.description,
    description: apiItem.description,
    image_url: apiItem.image_url,
    image_variants: apiItem.image_variants,
    spice_indicators: apiItem.spice_indicators,
    category_id: apiItem.category_id,
    featured: apiItem.featured ?? false,
    dietary_tags: apiItem.dietary_tags,
    item_code: apiItem.item_code,
    menu_order: apiItem.menu_order || apiItem.display_order || 0, // Unified field with fallback
    active: apiItem.active ?? apiItem.is_active ?? true,
    inherit_category_print_settings: apiItem.inherit_category_print_settings,
    is_set_meal: apiItem.is_set_meal,
    set_meal_id: apiItem.set_meal_id,
    set_meal_code: apiItem.set_meal_code,
    price: apiItem.price ?? apiItem.base_price,
    base_price: apiItem.base_price,
    price_dine_in: apiItem.price_dine_in,
    price_delivery: apiItem.price_delivery,
    price_takeaway: apiItem.price_takeaway,
    variants: apiItem.variants || [],
    has_variants: Boolean(apiItem.variants?.length),
    item_type: apiItem.item_type,
    // Draft/Publish workflow - CRITICAL: must pass through for draft detection
    published_at: apiItem.published_at,
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
    menu_order: apiProtein.menu_order || apiProtein.display_order || 0, // Unified field with fallback
    active: apiProtein.active ?? apiProtein.is_active ?? true,
    created_at: apiProtein.created_at,
    updated_at: apiProtein.updated_at,
  };
}

// ================================
// FORM DATA TYPES
// ================================

/**
 * Form data structure for menu item editing
 * Maintains compatibility with existing forms
 */
export interface MenuItemFormData {
  id?: string;
  name: string;
  kitchen_display_name?: string; // Optional field for optimized thermal receipt printing
  menu_item_description?: string;
  description?: string; // Alternative description field
  long_description?: string; // Long form description
  category_id: string;
  spice_indicators?: string;
  featured?: boolean;
  active?: boolean; // Item active status
  dietary_tags?: string[];
  item_code?: string;
  menu_order?: number; // Unified ordering field - replaces display_order
  display_order?: number; // Alias for menu_order

  // ✅ NEW: Food-specific fields (matches database schema)
  spice_level?: number; // Replaces old default_spice_level
  default_spice_level?: number; // Legacy alias for spice_level
  allergens?: Record<string, "contains" | "may_contain"> | string[] | null; // Existing allergens array
  allergen_info?: string; // Legacy allergen info text field
  allergen_warnings?: string; // New: Text warnings for allergens
  specialty_notes?: string; // New: Chef's notes (max 1000 chars)
  chefs_special?: boolean; // New: Flag for chef's specials

  // Drinks & Wine extended fields
  serving_sizes?: string[]; // Available serving sizes
  abv_percentage?: number; // Alcohol by volume percentage
  temperature?: string; // Serving temperature (e.g., "Chilled", "Room temp")

  // Pricing fields for different serving sizes
  price?: number;
  price_dine_in?: number;
  price_delivery?: number;
  price_takeaway?: number; // Takeaway price

  // Variant fields
  has_variants?: boolean; // Whether item has variants
  variants?: MenuItemVariant[];

  // Image/Media fields
  image_url?: string | null;
  image_url_widescreen?: string | null;
  image_asset_id?: string | null;
  image_widescreen_asset_id?: string | null;
  preferred_aspect_ratio?: 'square' | 'widescreen';

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
// UTILITY TYPES
// ================================

export type OrderType = 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
export type PaymentMethodType = 'CARD' | 'CASH' | 'CUSTOMER_PAYS' | 'ALREADY_PAID' | 'SMS_PAYMENT_LINK' | 'QR_AT_DOOR';
export type ItemType = 'food' | 'drinks_wine' | 'coffee_desserts';
export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

// ================================
// EXPORT LEGACY COMPATIBILITY
// ================================

// Re-export types for backward compatibility
// Note: Types are already exported directly from this file via named exports above
// Use: import { MenuCategory, MenuItem, ... } from './masterTypes';

// Legacy alias for Category
export type Category = MenuCategory;
