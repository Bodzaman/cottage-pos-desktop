


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
  // Virtual fields for POS integration
  item_type: 'set_meal'; // Always 'set_meal' for Set Meals
  category_id?: string; // Will be assigned to SET MEALS category
}

/**
 * MenuItem variant (different protein types, sizes, or preparations of a menu item)
 */
export interface ItemVariant {
  id: string;
  menu_item_id: string;
  protein_type_id: string | null;
  protein_type_name?: string; // Populated from join with protein_types table
  name: string | null; // Optional custom name for the variant (also serves as POS Label override)
  variant_name?: string | null; // Generated variant name (e.g., "Chicken Tikka Massala")
  price: number; // Base price (takeaway price)
  price_dine_in: number | null; // Optional different price for dine-in
  price_delivery: number | null; // Optional different price for delivery
  is_default: boolean;
  description_override?: string | null;
  spice_level_override?: number | null;
  dietary_tags_override?: string[] | null;
  available_for_delivery?: boolean;
  available_for_takeaway?: boolean;
  available_for_dine_in?: boolean;
  variant_code?: string | null; // Hierarchical code for variant (e.g., MAIN-001A)
  created_at?: string;
  updated_at?: string;
}

/**
 * Menu item definition
 */
export interface MenuItem {
  id: string;
  name: string;
  kitchen_display_name?: string | null; // Optional optimized name for thermal receipt printing
  // Unified description field from database migration
  description: string | null;
  image_url: string | null;
  spice_indicators: string | null;
  category_id: string;
  // Array of ingredients for the dish
  featured: boolean;
  dietary_tags: string[] | null; // Array of dietary tags like 'Vegetarian', 'Vegan', etc.
  item_code?: string | null;
  display_order: number;
  active: boolean;
  inherit_category_print_settings?: boolean;
  // Add missing pricing fields from database
  price?: number; // Base price
  price_dine_in?: number; // Dine-in price
  price_takeaway?: number; // Takeaway/collection price
  price_delivery?: number; // Delivery price
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
  // Set Meal specific fields
  item_type?: 'menu_item' | 'set_meal'; // Distinguish between regular menu items and set meals
  set_meal_code?: string; // Set meal code (e.g., SM001)
  set_meal_items?: Array<{
    menu_item_name: string;
    quantity: number;
    category_name?: string;
  }>; // Items included in the set meal for display purposes
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
