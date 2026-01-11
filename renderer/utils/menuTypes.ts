/**
 * Standardized menu data model types for use across all components
 * in both the public website menu and POS system
 */

/**
 * Menu category definition
 * 
 * Database Schema (menu_categories table):
 * - sorting: Uses sort_order (mapped to display_order)
 * - status: Uses is_active (mapped to active)
 * - print: Uses print_order and print_to_kitchen
 */
export interface Category {
  id: string;
  name: string;
  description: string | null;
  display_order: number;              // Mapped from DB sort_order
  sort_order?: number;                // Raw DB field
  print_order: number;                // DB print_order
  display_print_order?: number;       // DB display_print_order
  print_to_kitchen: boolean;          // DB print_to_kitchen
  image_url: string | null;
  parent_category_id: string | null;  // Mapped from database parent_category_id
  active: boolean;                    // Mapped from database is_active
  is_active?: boolean;                // Raw DB field
  is_protein_type?: boolean;          // Flag to indicate if this category should be treated as a protein type
  category_prefix?: string;
  code_prefix?: string;
  created_at?: string;
  updated_at?: string;
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
 * Database Schema (menu_item_variants table):
 * - image_url: EXISTS but often NULL (legacy field)
 * - image_asset_id: UUID linking to media_assets table (preferred)
 * - is_active and active: Both exist in DB (use is_active primarily)
 */
export interface ItemVariant {
  id: string;                     // UUID (PK)
  menu_item_id: string;           // ✅ Required for variant lookup (FK to menu_items)
  protein_type_id: string;        // UUID (FK to menu_protein_types)
  protein_type_name?: string;     // ✅ Enriched from JOIN or lookup
  name: string;                   // DB 'name' field
  variant_name: string;           // ✅ Direct variant name from DB
  description?: string;
  description_state?: 'inherited' | 'custom';
  price: number;                  // Primary price (takeaway)
  price_dine_in?: number;         // DB price_dine_in
  price_delivery?: number;        // DB price_delivery
  is_default?: boolean;           // DB is_default
  is_active?: boolean;            // ✅ Required for filtering active variants
  active?: boolean;               // ✅ DB has both is_active and active
  image_url?: string;             // Legacy field
  image_asset_id?: string;        // UUID to media_assets table
  display_image_url?: string;     // ✅ Resolved URL from media_assets via asset_id
  image_state?: 'inherited' | 'custom';
  display_order?: number;         // DB display_order
  variant_code?: string;          // ✅ Variant code from DB (e.g. V001)

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
 * - pricing: Uses base_price (NOT "price")
 * - images: Uses image_asset_id (links to media_assets)
 * - status: Uses is_active
 */
export interface MenuItem {
  id: string;
  name: string;
  kitchen_display_name?: string | null; // Optional optimized name for thermal receipt printing
  // Unified description field from database migration
  description: string | null;
  menu_item_description?: string | null; // Legacy field sometimes returned by API
  image_url: string | null;             // Enriched from media_assets via image_asset_id
  image_asset_id?: string | null;       // ✅ UUID linking to media_assets table
  image_widescreen_asset_id?: string | null; // ✅ Secondary asset ID from DB
  preferred_aspect_ratio?: string | null;
  
  // ✅ NEW: Optimized image variants from media_assets table
  image_variants?: {
    square?: { webp?: string | null; jpeg?: string | null };
    widescreen?: { webp?: string | null; jpeg?: string | null };
    thumbnail?: { webp?: string | null; jpeg?: string | null };
  } | null;
  
  spice_indicators?: string | null;
  spice_level?: number;                 // DB spice_level integer
  category_id: string;
  featured: boolean;                    // Mapped from DB chefs_special or similar
  chefs_special?: boolean;              // Raw DB field
  dietary_tags: string[] | null;        // Array of dietary tags like 'Vegetarian', 'Vegan', etc.
  item_code?: string | null;
  display_order: number;                // Mapped from DB display_print_order or similar
  display_print_order?: number;         // Raw DB field
  
  active: boolean;                      // Mapped from database is_active
  is_active?: boolean;                  // ✅ DB uses is_active
  is_available?: boolean;               // DB is_available
  
  has_variants?: boolean;               // ✅ Whether item has multiple variants (DB column)
  inherit_category_print_settings?: boolean;
  
  // Pricing fields from database
  base_price: number;                   // ✅ Primary price field from DB (Required)
  price?: number;                       // Alias for backward compatibility
  price_dine_in?: number;               // DB price_dine_in
  price_takeaway?: number;              // DB price_takeaway
  price_delivery?: number;              // DB price_delivery
  
  // Dietary flags (mapped from DB columns)
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  
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
  variant?: {
    id: string;
    name: string;
    price: number;
  } | null;
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
 * 
 * Database Schema (orders table):
 * - Tracking: order_number (string)
 * - Financials: subtotal, total_amount, tax_amount, delivery_fee
 */
export interface Order {
  id: string;                         // UUID (PK)
  order_number: string;               // Display order number (e.g. "T-1234")
  order_type: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING";
  order_source?: "POS" | "WEBSITE" | "APP";
  table_number?: string | number;     // DB is text
  table_id?: string;                  // UUID (FK to pos_tables)
  
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;          // For delivery/collection
  customer_id?: string;               // UUID (FK to customers)
  
  status: "PENDING" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
  payment_method?: string;            // CASH, CARD, etc.
  payment_status?: string;            // pending, completed, etc.
  
  items: OrderItem[];                 // JSONB in DB
  
  subtotal: number;                   // DB subtotal
  total: number;                      // Alias for total_amount
  total_amount: number;               // DB total_amount
  tax_amount?: number;                // DB tax_amount
  delivery_fee?: number;              // DB delivery_fee
  discount_amount?: number;           // DB discount_amount
  service_charge?: number;            // DB service_charge
  tip_amount?: number;                // DB tip_amount
  
  special_instructions?: string;
  notes?: string;
  
  created_at: string;
  updated_at: string;
  completed_at?: string;
  status_updated_at?: string;
  
  staff_id?: string;                  // UUID of staff member
  server_name?: string;               // Aggregated server name
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
