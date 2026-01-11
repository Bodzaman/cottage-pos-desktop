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
 * Type alias for Category - allows components to use MenuCategory naming
 */
export type MenuCategory = Category;

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
  // Virtual fields for POS integration
  item_type: 'set_meal'; // Always 'set_meal' for Set Meals
  category_id?: string; // Will be assigned to SET MEALS category
}

/**
 * MenuItem variant (different protein types, sizes, or preparations of a menu item)
 *
 * Database Schema (item_variants table):
 * - image_url: EXISTS but often NULL (legacy field)
 * - image_asset_id: UUID linking to media_assets table (preferred)
 * - is_active and active: Both exist in DB (use is_active primarily)
 */
export interface ItemVariant {
  id?: string;
  menu_item_id: string;           // ✅ Required for variant lookup (FK to menu_items)
  protein_type_id: string;
  protein_type_name?: string;     // ✅ Enriched from JOIN with menu_protein_types
  name: string;
  variant_name?: string;          // ✅ Alternative name field from DB
  description?: string;
  description_state?: 'inherited' | 'custom';
  price: number;
  price_dine_in?: number;
  price_delivery?: number;
  is_default?: boolean;
  is_active?: boolean;            // ✅ Required for filtering active variants
  active?: boolean;               // ✅ DB has both is_active and active
  image_url?: string;             // May be NULL - check display_image_url
  image_asset_id?: string;        // UUID to media_assets table
  display_image_url?: string;     // ✅ Resolved URL from media_assets
  image_state?: 'inherited' | 'custom';
  display_order?: number;
  variant_code?: string;          // ✅ Variant code from DB

  // Food-specific variant fields
  spice_level?: number;
  allergens?: string[];
  allergen_notes?: string;
  dietary_tags_override?: string[];

  // Dietary flags (variant-specific overrides)
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  is_halal?: boolean;
  is_dairy_free?: boolean;
  is_nut_free?: boolean;

  featured?: boolean;
}

/**
 * Menu item definition
 *
 * Database Schema (menu_items table):
 * - base_price: Primary price field (NOT "price")
 * - image_asset_id: UUID linking to media_assets (NOT direct image_url)
 * - is_active: Active status field
 */
export interface MenuItem {
  id: string;
  name: string;
  kitchen_display_name?: string | null; // Optional optimized name for thermal receipt printing
  // Unified description field from database migration
  description: string | null;
  image_url: string | null;             // Enriched from media_assets via image_asset_id
  image_asset_id?: string | null;       // ✅ UUID linking to media_assets table
  // ✅ NEW: Optimized image variants from media_assets table
  image_variants?: {
    square?: { webp?: string | null; jpeg?: string | null };
    widescreen?: { webp?: string | null; jpeg?: string | null };
    thumbnail?: { webp?: string | null; jpeg?: string | null };
  } | null;
  spice_indicators: string | null;
  category_id: string;
  // Array of ingredients for the dish
  featured: boolean;
  dietary_tags: string[] | null; // Array of dietary tags like 'Vegetarian', 'Vegan', etc.
  item_code?: string | null;
  display_order: number;
  active: boolean;
  is_active?: boolean;                  // ✅ DB uses is_active (mapped to active)
  has_variants?: boolean;               // ✅ Whether item has multiple variants
  inherit_category_print_settings?: boolean;
  // Pricing fields from database
  base_price?: number;                  // ✅ Primary price field from DB
  price?: number;                       // Alias for backward compatibility
  price_dine_in?: number;               // Dine-in price
  price_takeaway?: number;              // Takeaway/collection price
  price_delivery?: number;              // Delivery price
  // Set meal fields
  is_set_meal?: boolean;
  set_meal_id?: string | null;
  set_meal_code?: string | null;
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
  price: string | number; // Base price (takeaway price)
  price_dine_in?: string | number;
  price_delivery?: string | number;
  protein_type_name?: string;
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
}

/**
 * Selected customization for an order item
 */
export interface CustomizationSelection {
  id: string;
  customization_id: string;
  name: string;
  price_adjustment: number;
  group?: string;
}

/**
 * Selected customization for staff modal and order management
 */
export interface SelectedCustomization {
  id: string;
  name: string;
  price: number;
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
  show_on_pos?: boolean;
  show_on_website?: boolean;
  is_global?: boolean;
  item_ids?: string[];
}

/**
 * Order item definition (a menu item added to an order)
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

/**
 * Media image preview metadata structure
 * Contains optimized image variant URLs from media_assets table
 */
export interface MediaImagePreviewMetadata {
  // Direct variant URL fields (legacy format)
  square_webp_url?: string | null;
  square_jpeg_url?: string | null;
  widescreen_webp_url?: string | null;
  widescreen_jpeg_url?: string | null;
  thumbnail_webp_url?: string | null;
  thumbnail_jpeg_url?: string | null;
  
  // Nested variants structure (alternate format)
  variants?: {
    square?: { webp_url?: string | null; jpeg_url?: string | null };
    widescreen?: { webp_url?: string | null; jpeg_url?: string | null };
    thumbnail?: { webp_url?: string | null; jpeg_url?: string | null };
  };
  
  // Variant keys using underscore format (third format)
  square_variants?: { webp_url?: string | null; jpeg_url?: string | null };
  widescreen_variants?: { webp_url?: string | null; jpeg_url?: string | null };
  thumbnail_variants?: { webp_url?: string | null; jpeg_url?: string | null };
}

/**
 * Variant information for signature dishes
 */
export interface VariantInfo {
  id: string;
  variant_name: string;
  price: number;
  image_url?: string;
  description?: string;
  featured?: boolean;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  is_halal?: boolean;
  is_dairy_free?: boolean;
  is_nut_free?: boolean;
}

/**
 * Signature Dish definition for featured menu items on public website
 */
export interface SignatureDish {
  id: string;
  title: string;
  description: string;
  main_image: string;
  spice_level: number;
  tags: string[];
  category: string;
  price: { [key: string]: string };
  has_variants: boolean;
  variants: VariantInfo[];
}
