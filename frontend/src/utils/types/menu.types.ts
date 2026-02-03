/**
 * Menu System - Clean Type Definitions
 *
 * SINGLE SOURCE OF TRUTH for all menu-related types.
 * All types use snake_case to match database schema exactly.
 *
 * Migration Guide:
 * - Import from 'utils/types/menu.types' instead of 'utils/menuTypes'
 * - Use transformers in 'utils/types/menu.transformers' for camelCase if needed
 * - Old menuTypes.ts is deprecated and will be removed
 */

// ============================================================================
// CATEGORY TYPES
// ============================================================================

/**
 * Menu category definition
 * Source: categories table
 */
export interface Category {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  print_order: number;
  print_to_kitchen: boolean;
  image_url: string | null;
  parent_category_id: string | null;
  active: boolean;
  is_protein_type?: boolean;
}

// ============================================================================
// PROTEIN TYPES
// ============================================================================

/**
 * Protein type definition (e.g., Chicken, Lamb, Prawn)
 * Source: protein_types table
 */
export interface ProteinType {
  id: string;
  name: string;
  price_adjustment: number | null;
  category_id?: string;
  active: boolean;
}

// ============================================================================
// SET MEAL TYPES
// ============================================================================

/**
 * Set Meal Item - menu item within a set meal
 * Source: set_meal_items table
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

/**
 * Set Meal definition
 * Source: set_meals table
 */
export interface SetMeal {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  hero_image_url?: string | null;
  hero_image_asset_id?: string | null;
  set_price: number;
  active: boolean;
  items: SetMealItem[];
  individual_items_total: number;
  savings: number;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  item_type: 'set_meal';
  category_id?: string;
}

// ============================================================================
// MENU ITEM VARIANT TYPES
// ============================================================================

/**
 * Image variant URLs for responsive images
 */
export interface ImageVariants {
  square?: { webp?: string | null; jpeg?: string | null };
  widescreen?: { webp?: string | null; jpeg?: string | null };
  thumbnail?: { webp?: string | null; jpeg?: string | null };
}

/**
 * Variant inheritance state - controls how values are resolved
 * - 'inherited': Use parent menu item's value
 * - 'custom': Use variant's own override value
 */
export type VariantInheritanceState = 'inherited' | 'custom';

/**
 * Image source tracking for variants
 * - 'variant': Image set directly on variant
 * - 'inherited': Image inherited from parent menu item
 * - 'none': No image available
 */
export type VariantImageSource = 'variant' | 'inherited' | 'none';

/**
 * Menu item variant - different protein types, sizes, or preparations
 * Source: menu_item_variants table
 *
 * OVERRIDE PATTERN:
 * Some fields use an inheritance pattern where variants can either:
 * 1. Inherit values from the parent MenuItem (state = 'inherited')
 * 2. Use their own custom values (state = 'custom')
 *
 * Fields using this pattern:
 * - description: description_override + description_state
 * - image: image_url_override + image_state + image_source
 * - spice_level: spice_level_override (no state field)
 * - dietary_tags: dietary_tags_override (no state field)
 *
 * Use the resolveVariant* helper functions to get final resolved values.
 */
export interface ItemVariant {
  id?: string;
  menu_item_id?: string;

  // Protein/variant identification
  protein_type_id?: string;
  protein_type_name?: string;
  variant_name?: string;
  name: string;

  // Description (with inheritance)
  description?: string;                              // Base/resolved description
  description_override?: string;                     // Custom description if state='custom'
  description_state?: VariantInheritanceState;       // 'inherited' | 'custom'

  // Pricing
  price: number;
  price_dine_in?: number;
  price_delivery?: number;
  price_takeaway?: number;

  // Status
  is_default?: boolean;
  is_active?: boolean;
  display_order?: number;

  // Image (with inheritance)
  image_url?: string;                                // Base image URL
  image_asset_id?: string;                           // Asset ID for image management
  image_url_override?: string;                       // Custom image if state='custom'
  display_image_url?: string | null;                 // Final resolved image URL
  image_state?: VariantInheritanceState;             // 'inherited' | 'custom'
  image_source?: VariantImageSource;                 // Where image comes from

  // Spice level (with override)
  spice_level?: number;                              // Base/inherited spice level
  spice_level_override?: number;                     // Custom spice level

  // Allergens & dietary
  allergens?: Record<string, 'contains' | 'may_contain'> | string[] | null;
  allergen_notes?: string;
  dietary_tags_override?: string[];                  // Custom dietary tags

  // Dietary flags (variant-specific)
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  is_halal?: boolean;
  is_dairy_free?: boolean;
  is_nut_free?: boolean;

  featured?: boolean;
}

// ============================================================================
// MENU ITEM TYPES
// ============================================================================

/**
 * Menu item definition
 * Source: menu_items table
 */
export interface MenuItem {
  id: string;
  name: string;
  kitchen_display_name?: string | null;
  description: string | null;
  menu_item_description?: string | null;
  long_description?: string | null;
  published_at?: string | null;
  has_published_snapshot?: boolean;
  image_url: string | null;
  image_variants?: ImageVariants | null;
  spice_indicators: string | null;
  default_spice_level?: number | null;
  category_id: string;
  category_name?: string;
  featured: boolean;
  dietary_tags: string[] | null;
  item_code?: string | null;
  display_order: number;
  active: boolean;
  inherit_category_print_settings?: boolean;
  price?: number;
  base_price?: number;
  price_dine_in?: number;
  price_takeaway?: number;
  takeaway_price?: number;
  price_delivery?: number;
  is_set_meal?: boolean;
  set_meal_id?: string | null;
  set_meal_code?: string | null;
  has_variants?: boolean;
  default_variant?: ItemVariant | null;
  is_available?: boolean;
  vegetarian?: boolean;
  is_vegetarian?: boolean;
  vegan?: boolean;
  is_vegan?: boolean;
  gluten_free?: boolean;
  is_gluten_free?: boolean;
  halal?: boolean;
  is_halal?: boolean;
  dairy_free?: boolean;
  is_dairy_free?: boolean;
  nut_free?: boolean;
  is_nut_free?: boolean;
  chefs_special?: boolean;
  specialty_notes?: string | null;
  variants: ItemVariant[];
}

/**
 * Suggested menu item for AI voice ordering
 */
export interface SuggestedMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  suggested_reason: string;
  image_url?: string | null;
}

/**
 * Cart-specific variant type - simplified for cart display
 */
export interface CartItemVariant {
  id: string;
  name: string;
  variant_name?: string;
  price: string | number;
  price_dine_in?: string | number;
  price_delivery?: string | number;
  price_adjustment?: number;
  protein_type_name?: string;
  protein_type?: string;
  protein_type_id?: string;
  is_active?: boolean;
  image_url?: string;
  image_variants?: Record<string, unknown>;
}

// ============================================================================
// MODIFIER & CUSTOMIZATION TYPES
// ============================================================================

/**
 * Modifier definition (add-ons or special requests)
 * Source: modifiers table
 */
export interface Modifier {
  id: string;
  name: string;
  price_adjustment: number;
  modifier_group_id: string;
  is_required: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Selected modifier for an order item
 */
export interface ModifierSelection {
  id: string;
  modifier_id: string;
  option_id?: string;
  name: string;
  price_adjustment: number;
  price?: number;
}

/**
 * Selected customization for an order item
 */
export interface CustomizationSelection {
  id: string;
  customization_id?: string;
  name: string;
  price_adjustment: number;
  price?: number;
  group?: string;
  is_adhoc?: boolean;
  is_free?: boolean;
}

/**
 * Customization definition for menu items
 * Source: customizations table
 */
export interface Customization {
  id: string;
  name: string;
  price: number | null;
  description?: string | null;
  customization_group?: string;
  display_order?: number;
  is_exclusive?: boolean;
  is_active?: boolean;
  active?: boolean;
  show_on_pos?: boolean;
  show_on_website?: boolean;
  ai_voice_agent?: boolean;
  is_global?: boolean;
  item_ids?: string[];
  menu_item_ids?: string[];
}

// ============================================================================
// ORDER ITEM TYPES
// ============================================================================

/**
 * Set meal item reference in order
 */
export interface OrderSetMealItem {
  menu_item_name: string;
  quantity: number;
  category_name?: string;
}

/**
 * Order item variant reference
 */
export interface OrderItemVariant {
  id: string;
  name: string;
  price?: number;
  protein_type?: string;
  protein_type_name?: string;
  price_adjustment?: number;
}

/**
 * Order item definition (a menu item added to an order)
 * Source: dine_in_order_items or order_items table
 */
export interface OrderItem {
  id?: string;
  menu_item_id: string;
  variant_id: string | null;
  menuItemId?: string;
  variantId?: string | null;
  name: string;
  quantity: number;
  price: number;
  total?: number;
  variant_name?: string;
  variantName?: string | null;
  notes?: string;
  protein_type?: string;
  image_url?: string;
  modifiers?: ModifierSelection[];
  customizations?: CustomizationSelection[];
  category_id?: string;
  category_name?: string;
  item_type?: 'menu_item' | 'set_meal';
  set_meal_code?: string;
  set_meal_items?: OrderSetMealItem[];
  customer_name?: string;
  customer_number?: number;
  customer_tab_id?: string;
  kitchen_display_name?: string | null;
  serve_with_section_id?: string | null;
  serveWithSectionId?: string | null;
  variant?: OrderItemVariant;
}

// ============================================================================
// DELIVERY TYPES
// ============================================================================

/**
 * Delivery fee tier
 */
export interface DeliveryFeeTier {
  max_distance: number;
  cost: number;
}

/**
 * Minimum order tier
 */
export interface MinimumOrderTier {
  max_distance: number;
  minimum_amount: number;
}

/**
 * Restaurant location
 */
export interface RestaurantLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

/**
 * Delivery settings for the POS system
 */
export interface DeliverySettings {
  enabled: boolean;
  radius: number;
  restaurant_location: RestaurantLocation;
  fees: DeliveryFeeTier[];
  minimum_orders: MinimumOrderTier[];
}

// ============================================================================
// ORDER TYPES
// ============================================================================

/**
 * Order type enum - Uses underscore format to match database ENUM
 * WAITING is handled as order_subtype='WAITING' with order_type='COLLECTION'
 */
export type OrderType = 'DINE_IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';

/**
 * Order status enum
 */
export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

/**
 * Order definition for the POS system
 * Source: orders table
 */
export interface Order {
  id: string;
  order_type: OrderType;
  table_number?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  total: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TABLE TYPES
// ============================================================================

/**
 * Table status enum
 */
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

/**
 * Table definition for the POS system
 * Source: pos_tables table
 */
export interface Table {
  id: number;
  name: string;
  capacity: number;
  status: TableStatus;
  current_order_id?: string;
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

/**
 * Payment method types
 */
export type PaymentMethod =
  | 'CARD'
  | 'CASH'
  | 'CUSTOMER_PAYS'
  | 'ALREADY_PAID'
  | 'SMS_PAYMENT_LINK'
  | 'QR_AT_DOOR';

/**
 * Payment result interface for POS transactions
 */
export interface PaymentResult {
  method: PaymentMethod;
  amount: number;
  change?: number;
  cash_received?: number;
  reference?: string;
  tip_amount?: number;
  total_with_tip?: number;
}

// ============================================================================
// MENU BUNDLE TYPE (for React Query hooks)
// ============================================================================

/**
 * Complete menu data bundle
 * Used by useMenuBundle hook
 */
export interface MenuBundle {
  categories: Category[];
  items: MenuItem[];
  proteins: ProteinType[];
  customizations: Customization[];
  set_meals: SetMeal[];
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if an item is a set meal
 */
export function isSetMeal(item: MenuItem | SetMeal): item is SetMeal {
  return 'item_type' in item && item.item_type === 'set_meal';
}

/**
 * Check if a variant has a protein type
 */
export function hasProteinType(variant: ItemVariant): boolean {
  return !!(variant.protein_type_id || variant.protein_type_name);
}

/**
 * Check if menu item has variants
 */
export function hasVariants(item: MenuItem): boolean {
  return item.variants && item.variants.length > 0;
}
