/**
 * Standardized menu data model types for use across all components
 * in both the public website menu and POS system
 */

/**
 * Menu category definition
 */
export interface Category {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  print_order: number;
  print_to_kitchen: boolean;
  image_url: string | null;
  parent_category_id: string | null;  // Mapped from database parent_id (AdminMenu standard)
  active: boolean;                    // Mapped from database is_active (AdminMenu standard)
  is_protein_type?: boolean; // Flag to indicate if this category should be treated as a protein type
}

/**
 * Protein type definition (e.g., Chicken, Lamb, Prawn)
 */
export interface ProteinType {
  id: string;
  name: string;
  price_adjustment: number | null;
  category_id?: string;
  active: boolean;
}

/**
 * Set Meal Item definition (menu item within a set meal)
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
  // Draft/Publish workflow - same pattern as menu_items
  published_at?: string | null; // Timestamp when published, null = draft
  // Virtual fields for POS integration
  item_type: 'set_meal'; // Always 'set_meal' for Set Meals
  category_id?: string; // Will be assigned to SET MEALS category
}

/**
 * MenuItem variant (different protein types, sizes, or preparations of a menu item)
 */
export interface ItemVariant {
  id?: string;
  menu_item_id?: string;
  menuItemId?: string; // CamelCase alias
  protein_type_id?: string; // Made optional for compatibility
  proteinTypeId?: string; // CamelCase alias
  protein_type_name?: string;
  proteinTypeName?: string; // CamelCase alias
  variant_name?: string;
  variantName?: string; // CamelCase alias
  name: string;
  description?: string;
  description_override?: string; // Variant-specific description override
  descriptionOverride?: string; // CamelCase alias
  description_state?: 'inherited' | 'custom';
  descriptionState?: 'inherited' | 'custom'; // CamelCase alias
  price: number;
  price_dine_in?: number;
  priceDineIn?: number; // CamelCase alias
  price_delivery?: number;
  priceDelivery?: number; // CamelCase alias
  price_takeaway?: number;
  priceTakeaway?: number; // CamelCase alias
  is_default?: boolean;
  isDefault?: boolean; // CamelCase alias
  is_active?: boolean;
  image_url?: string;
  imageUrl?: string; // CamelCase alias
  image_asset_id?: string;
  imageAssetId?: string; // CamelCase alias
  image_url_override?: string;
  display_image_url?: string | null;
  displayImageUrl?: string | null; // CamelCase alias
  image_state?: 'inherited' | 'custom';
  imageState?: 'inherited' | 'custom'; // CamelCase alias
  image_source?: 'variant' | 'inherited' | 'none';
  imageSource?: 'variant' | 'inherited' | 'none'; // CamelCase alias
  display_order?: number;
  displayOrder?: number; // CamelCase alias

  // Food-specific variant fields
  spice_level?: number;
  spiceLevel?: number; // CamelCase alias
  spice_level_override?: number; // Variant-specific spice override
  spiceLevelOverride?: number; // CamelCase alias
  allergens?: string[];
  allergen_notes?: string;
  allergenNotes?: string; // CamelCase alias
  dietary_tags_override?: string[];
  dietaryTagsOverride?: string[]; // CamelCase alias

  // Dietary flags (variant-specific overrides)
  is_vegetarian?: boolean;
  isVegetarian?: boolean; // CamelCase alias
  is_vegan?: boolean;
  isVegan?: boolean; // CamelCase alias
  is_gluten_free?: boolean;
  isGlutenFree?: boolean; // CamelCase alias
  is_halal?: boolean;
  isHalal?: boolean; // CamelCase alias
  is_dairy_free?: boolean;
  isDairyFree?: boolean; // CamelCase alias
  is_nut_free?: boolean;
  isNutFree?: boolean; // CamelCase alias

  featured?: boolean;
}

/**
 * Menu item definition
 */
export interface MenuItem {
  id: string;
  name: string;
  kitchen_display_name?: string | null; // Optional optimized name for thermal receipt printing
  kitchenDisplayName?: string | null; // CamelCase alias
  // Unified description field from database migration
  description: string | null;
  menu_item_description?: string | null; // Legacy/alternate description field
  long_description?: string | null; // Extended description
  published_at?: string | null; // Publication timestamp
  publishedAt?: string | null; // CamelCase alias
  hasPublishedSnapshot?: boolean; // Flag indicating item has a snapshot and can be reverted
  image_url: string | null;
  imageUrl?: string | null; // CamelCase alias
  // ✅ NEW: Optimized image variants from media_assets table
  image_variants?: {
    square?: { webp?: string | null; jpeg?: string | null };
    widescreen?: { webp?: string | null; jpeg?: string | null };
    thumbnail?: { webp?: string | null; jpeg?: string | null };
  } | null;
  imageVariants?: {
    square?: { webp?: string | null; jpeg?: string | null };
    widescreen?: { webp?: string | null; jpeg?: string | null };
    thumbnail?: { webp?: string | null; jpeg?: string | null };
  } | null; // CamelCase alias
  spice_indicators: string | null;
  spiceIndicators?: string | null; // CamelCase alias
  default_spice_level?: number | null; // Default spice level for item
  defaultSpiceLevel?: number | null; // CamelCase alias
  category_id: string;
  categoryId?: string; // CamelCase alias for types/menu.ts compatibility
  categoryName?: string; // CamelCase property
  // Array of ingredients for the dish
  featured: boolean;
  dietary_tags: string[] | null; // Array of dietary tags like 'Vegetarian', 'Vegan', etc.
  dietaryTags?: string[] | null; // CamelCase alias
  item_code?: string | null;
  itemCode?: string | null; // CamelCase alias
  display_order: number;
  menuOrder?: number; // CamelCase alias for types/menu.ts compatibility
  active: boolean;
  inherit_category_print_settings?: boolean;
  inheritCategoryPrintSettings?: boolean; // CamelCase alias
  // Add missing pricing fields from database
  price?: number; // Base price
  base_price?: number; // Alias for price
  basePrice?: number; // CamelCase alias
  price_dine_in?: number; // Dine-in price
  priceDineIn?: number; // CamelCase alias
  price_takeaway?: number; // Takeaway/collection price
  priceTakeaway?: number; // CamelCase alias
  takeaway_price?: number; // Alias for price_takeaway
  price_delivery?: number; // Delivery price
  priceDelivery?: number; // CamelCase alias
  priceCollection?: number; // CamelCase property
  // Set meal fields
  is_set_meal?: boolean;
  isSetMeal?: boolean; // CamelCase alias
  set_meal_id?: string | null;
  setMealId?: string | null; // CamelCase alias
  set_meal_code?: string | null;
  setMealCode?: string | null; // CamelCase alias
  hasVariants?: boolean; // CamelCase property for types/menu.ts compatibility
  defaultVariant?: ItemVariant | null; // Default selected variant
  is_available?: boolean; // Availability flag
  isAvailable?: boolean; // CamelCase alias
  // Dietary flags
  vegetarian?: boolean;
  is_vegetarian?: boolean;
  vegan?: boolean;
  is_vegan?: boolean;
  gluten_free?: boolean;
  isGlutenFree?: boolean;
  halal?: boolean;
  is_halal?: boolean;
  dairy_free?: boolean;
  isDairyFree?: boolean;
  nut_free?: boolean;
  isNutFree?: boolean;
  // Menu variants (different protein types, sizes, or preparations)
  variants: ItemVariant[];
}

/**
 * Suggested menu item for AI voice ordering dynamic suggestions
 */
export interface SuggestedMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  suggestedReason: string;
  image_url?: string | null;
}

/**
 * Cart-specific variant type - simplified for cart display
 */
export interface MenuItemVariant {
  id: string;
  name: string;
  variant_name?: string;
  price: string | number; // Base price (takeaway price)
  price_dine_in?: string | number;
  price_delivery?: string | number;
  price_adjustment?: number;
  protein_type_name?: string;
  protein_type?: string;
  protein_type_id?: string;
  is_active?: boolean;
  image_url?: string;
  image_variants?: Record<string, any>;
}

/**
 * Modifier definition (add-ons or special requests for menu items)
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
  option_id?: string; // Add missing option_id property
  name: string;
  price_adjustment: number;
  price?: number; // Alias for price_adjustment
}

/**
 * Selected customization for an order item
 * ✅ FIX: Simplified to use only 'id' field (removed redundant customization_id)
 */
export interface CustomizationSelection {
  id: string;
  customization_id?: string; // Optional alias for id (for backward compatibility)
  name: string;
  price_adjustment: number;
  group?: string;
}

/**
 * Customization definition for menu items
 */
export interface CustomizationBase {
  id: string;
  name: string;
  price: number | null;
  description?: string | null;
  customization_group?: string;
  display_order?: number;
  is_exclusive?: boolean;
  is_active?: boolean;
  active?: boolean; // Alias for is_active
  show_on_pos?: boolean;
  show_on_website?: boolean;
  is_global?: boolean;
  item_ids?: string[];
  menu_item_ids?: string[]; // Alias for item_ids
}

/**
 * Order item definition (a menu item added to an order)
 */
export interface OrderItem {
  id: string;
  menu_item_id: string;
  variant_id: string | null; // ✅ FIX: Make nullable to support single items
  name: string;
  quantity: number;
  price: number;
  variantName?: string;
  notes?: string;
  protein_type?: string;
  image_url?: string; // Add image URL for thumbnails in order summary
  modifiers: ModifierSelection[];
  customizations?: CustomizationSelection[];
  // Category tracking for receipt section organization
  category_id?: string;
  category_name?: string;
  // Set Meal specific fields
  item_type?: 'menu_item' | 'set_meal'; // Distinguish between regular menu items and set meals
  set_meal_code?: string; // Set meal code (e.g., SM001)
  set_meal_items?: Array<{
    menu_item_name: string;
    quantity: number;
    category_name?: string;
  }>; // Items included in the set meal for display purposes
  // Customer identification for kitchen tickets (MYA-1103)
  customer_name?: string;        // e.g., "John" or "Customer 1"
  customer_number?: number;      // e.g., 1, 2, 3
  customer_tab_id?: string;      // UUID of customer tab
  // Kitchen display name for thermal receipts
  kitchen_display_name?: string | null;
}

/**
 * Delivery settings for the POS system
 */
export interface DeliverySettings {
  enabled: boolean;
  radius: number;
  restaurantLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  fees: {
    maxDistance: number;
    cost: number;
  }[];
  minimumOrders: {
    maxDistance: number;
    minimumAmount: number;
  }[];
}

/**
 * Order definition for the POS system
 */
export interface Order {
  id: string;
  order_type: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING";
  table_number?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  status: "PENDING" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
  items: OrderItem[];
  subtotal: number;
  total: number;
  created_at: string;
  updated_at: string;
}

/**
 * Table definition for the POS system
 */
export interface Table {
  id: number;
  name: string;
  capacity: number;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED";
  current_order_id?: string;
}

/**
 * Payment method types
 */
export type PaymentMethodType = 'CARD' | 'CASH' | 'CUSTOMER_PAYS' | 'ALREADY_PAID' | 'SMS_PAYMENT_LINK' | 'QR_AT_DOOR';

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
