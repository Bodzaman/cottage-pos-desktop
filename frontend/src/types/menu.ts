/**
 * Menu Types - Core menu entity definitions
 *
 * This file contains the canonical type definitions for menu-related entities.
 * All field names use camelCase for TypeScript consistency.
 * Mapper functions are provided for database field conversion.
 */

import type { InheritanceState, ImageSource, ItemType } from './common';

// ================================
// CATEGORY TYPES
// ================================

/**
 * Menu category definition
 * Represents a category in the menu hierarchy
 */
export interface MenuCategory {
  id: string;
  category_id?: string; // Alias for id
  name: string;
  category_name?: string; // Alias for name
  description?: string | null;
  menuOrder: number;
  menu_order?: number; // Snake_case alias
  display_order?: number; // Snake_case alias for menuOrder
  printOrder?: number;
  print_order?: number; // Snake_case alias
  printToKitchen: boolean;
  print_to_kitchen?: boolean; // Snake_case alias
  imageUrl?: string | null;
  image_url?: string | null; // Snake_case alias
  parentCategoryId?: string | null;
  parent_category_id?: string | null; // Snake_case alias
  parent_id?: string | null; // Alternative snake_case alias
  active: boolean;
  is_active?: boolean; // Snake_case alias
  isProteinType?: boolean;
  is_protein_type?: boolean; // Snake_case alias

  // Extended properties for UI
  children?: MenuCategory[];
  itemCount?: number;
}

/**
 * Extended category with additional computed properties
 */
export interface ExtendedMenuCategory extends MenuCategory {
  level?: number;
  path?: string[];
  hasChildren?: boolean;
}

// ================================
// PROTEIN TYPE
// ================================

/**
 * Protein type definition (e.g., Chicken, Lamb, Prawn)
 * Used for variant selections
 */
export interface ProteinType {
  id: string;
  name: string;
  priceAdjustment?: number | null;
  categoryId?: string;
  menuOrder: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ================================
// ITEM VARIANT
// ================================

/**
 * Menu item variant (different protein types, sizes, or preparations)
 */
export interface ItemVariant {
  id: string;
  menuItemId?: string; // Optional for form contexts where menu item doesn't exist yet
  menu_item_id?: string; // Snake_case alias
  proteinTypeId?: string | null;
  protein_type_id?: string | null; // Snake_case alias
  proteinType?: ProteinType;
  protein_type?: ProteinType; // Snake_case alias
  name?: string | null;
  variantName?: string | null;
  variant_name?: string | null; // Snake_case alias

  // Pricing
  price: number;
  priceDineIn?: number | null;
  price_dine_in?: number | null; // Snake_case alias
  priceDelivery?: number | null;
  price_delivery?: number | null; // Snake_case alias
  priceTakeaway?: number | null;
  price_takeaway?: number | null; // Snake_case alias

  // Variant properties
  isDefault: boolean;
  is_default?: boolean; // Snake_case alias
  descriptionOverride?: string | null;
  description_override?: string | null; // Snake_case alias
  spiceLevelOverride?: number | null;
  spice_level_override?: number | null; // Snake_case alias
  dietaryTagsOverride?: string[] | null;
  dietary_tags_override?: string[] | null; // Snake_case alias

  // Image with inheritance state
  imageUrl?: string | null;
  image_url?: string | null; // Snake_case alias
  imageAssetId?: string | null;
  image_asset_id?: string | null; // Snake_case alias
  imageState?: InheritanceState;
  image_state?: InheritanceState; // Snake_case alias
  displayImageUrl?: string | null;
  display_image_url?: string | null; // Snake_case alias
  imageSource?: ImageSource;
  image_source?: ImageSource; // Snake_case alias

  // Image variants for responsive images
  imageVariants?: {
    square?: { webp?: string | null; jpeg?: string | null };
    widescreen?: { webp?: string | null; jpeg?: string | null };
    thumbnail?: { webp?: string | null; jpeg?: string | null };
  } | null;
  image_variants?: {
    square?: { webp?: string | null; jpeg?: string | null };
    widescreen?: { webp?: string | null; jpeg?: string | null };
    thumbnail?: { webp?: string | null; jpeg?: string | null };
  } | null; // Snake_case alias

  // Description with inheritance state
  description?: string | null;
  descriptionState?: InheritanceState;
  description_state?: InheritanceState; // Snake_case alias
  displayDescription?: string | null;
  display_description?: string | null; // Snake_case alias
  descriptionSource?: ImageSource;
  description_source?: ImageSource; // Snake_case alias

  // Dietary flags (variant-specific overrides)
  isVegetarian?: boolean;
  is_vegetarian?: boolean; // Snake_case alias
  isVegan?: boolean;
  is_vegan?: boolean; // Snake_case alias
  isGlutenFree?: boolean;
  is_gluten_free?: boolean; // Snake_case alias
  isHalal?: boolean;
  is_halal?: boolean; // Snake_case alias
  isDairyFree?: boolean;
  is_dairy_free?: boolean; // Snake_case alias
  isNutFree?: boolean;
  is_nut_free?: boolean; // Snake_case alias

  // Food-specific
  spiceLevel?: number;
  spice_level?: number; // Snake_case alias
  allergens?: Record<string, "contains" | "may_contain"> | string[] | null;
  allergenNotes?: string;
  allergen_notes?: string; // Snake_case alias

  // Availability
  availableForDelivery?: boolean;
  available_for_delivery?: boolean; // Snake_case alias
  availableForTakeaway?: boolean;
  available_for_takeaway?: boolean; // Snake_case alias
  availableForDineIn?: boolean;
  available_for_dine_in?: boolean; // Snake_case alias

  // System fields
  variantCode?: string | null;
  variant_code?: string | null; // Snake_case alias
  displayOrder?: number;
  display_order?: number; // Snake_case alias
  order?: number; // Short alias for displayOrder (used in some forms)
  featured?: boolean;
  createdAt?: string;
  created_at?: string; // Snake_case alias
  updatedAt?: string;
  updated_at?: string; // Snake_case alias

  // API compatibility fields
  active?: boolean; // Alias for isDefault or availability
  protein_type_name?: string; // API field for protein type name
}

/**
 * Simplified variant for cart display
 */
export interface CartMenuItemVariant {
  id: string;
  name: string;
  price: number;
  priceDineIn?: number;
  priceDelivery?: number;
  proteinTypeName?: string;
}

// ================================
// MENU ITEM
// ================================

/**
 * Menu item definition
 * Represents a single item on the menu
 */
export interface MenuItem {
  id: string;
  name: string;
  kitchenDisplayName?: string | null;
  kitchen_display_name?: string | null; // Snake_case alias
  description?: string | null;
  menu_item_description?: string | null; // Snake_case alias for description
  long_description?: string | null; // Extended description
  imageUrl?: string | null;
  image_url?: string | null; // Snake_case alias
  imageVariants?: {
    square?: { webp?: string | null; jpeg?: string | null };
    widescreen?: { webp?: string | null; jpeg?: string | null };
    thumbnail?: { webp?: string | null; jpeg?: string | null };
  } | null;
  image_variants?: {
    square?: { webp?: string | null; jpeg?: string | null };
    widescreen?: { webp?: string | null; jpeg?: string | null };
    thumbnail?: { webp?: string | null; jpeg?: string | null };
  } | null; // Snake_case alias
  spiceIndicators?: string | null;
  spice_indicators?: string | null; // Snake_case alias
  defaultSpiceLevel?: number | null;
  default_spice_level?: number | null; // Snake_case alias
  publishedAt?: string | null;
  categoryId: string;
  category_id?: string; // Snake_case alias
  categoryName?: string;
  category_name?: string; // Snake_case alias
  sectionName?: string; // Section name for grouping
  section_name?: string; // Snake_case alias
  featured: boolean;
  dietaryTags?: string[] | null;
  dietary_tags?: string[] | null; // Snake_case alias
  itemCode?: string | null;
  item_code?: string | null; // Snake_case alias
  menuOrder: number;
  display_order?: number; // Snake_case alias for menuOrder
  section_order?: number; // Alias for menuOrder within section
  active: boolean;
  is_active?: boolean; // Snake_case alias
  inheritCategoryPrintSettings?: boolean;
  inherit_category_print_settings?: boolean; // Snake_case alias

  // Pricing
  price?: number;
  basePrice?: number;
  base_price?: number; // Snake_case alias
  priceDineIn?: number;
  price_dine_in?: number; // Snake_case alias
  dine_in_price?: number; // Alternative snake_case alias
  priceTakeaway?: number;
  price_takeaway?: number; // Snake_case alias
  priceDelivery?: number;
  price_delivery?: number; // Snake_case alias
  priceCollection?: number;

  // Set meal fields
  isSetMeal?: boolean;
  is_set_meal?: boolean; // Snake_case alias
  setMealId?: string | null;
  set_meal_id?: string | null; // Snake_case alias
  setMealCode?: string | null;
  set_meal_code?: string | null; // Snake_case alias

  // Variants
  variants: ItemVariant[];
  hasVariants?: boolean;
  defaultVariant?: ItemVariant | null; // Default selected variant

  // Availability
  is_available?: boolean; // Snake_case availability flag
  isAvailable?: boolean; // CamelCase alias

  // Dietary flags
  vegetarian?: boolean;
  is_vegetarian?: boolean; // Snake_case alias
  vegan?: boolean;
  is_vegan?: boolean; // Snake_case alias
  gluten_free?: boolean;
  isGlutenFree?: boolean; // CamelCase alias
  halal?: boolean;
  is_halal?: boolean; // Snake_case alias
  dairy_free?: boolean;
  isDairyFree?: boolean; // CamelCase alias
  nut_free?: boolean;
  isNutFree?: boolean; // CamelCase alias

  // Food-specific fields
  allergens?: Record<string, "contains" | "may_contain"> | string[] | null;
  allergenWarnings?: string;
  specialtyNotes?: string;
  chefsSpecial?: boolean;

  // Item classification
  itemType?: ItemType;
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
  suggestedReason: string;
  imageUrl?: string | null;
}

// ================================
// SET MEALS
// ================================

/**
 * Set meal item component
 */
export interface SetMealItem {
  id: string;
  menuItemId: string;
  menu_item_id?: string; // Snake_case alias
  menuItemName: string;
  menu_item_name?: string; // Snake_case alias
  name?: string; // Short alias for menuItemName
  menuItemImageUrl?: string | null;
  menu_item_image_url?: string | null; // Snake_case alias
  quantity: number;
  itemPrice: number;
  item_price?: number; // Snake_case alias
  price?: number; // Short alias for itemPrice
  categoryName?: string | null;
  category_name?: string | null; // Snake_case alias
}

/**
 * Set meal definition
 */
export interface SetMeal {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  heroImageUrl?: string | null;
  heroImageAssetId?: string | null;
  setPrice: number;
  active: boolean;
  items: SetMealItem[];
  individualItemsTotal: number;
  savings: number;
  createdAt: string;
  updatedAt: string;
  itemType: 'set_meal';
  categoryId?: string;
}

// ================================
// CUSTOMIZATIONS & MODIFIERS
// ================================

/**
 * Customization definition for menu items
 */
export interface Customization {
  id: string;
  name: string;
  price?: number | null;
  description?: string | null;
  customizationGroup?: string;
  menuOrder?: number;
  isExclusive?: boolean;
  isActive?: boolean;
  showOnPos?: boolean;
  showOnWebsite?: boolean;
  isGlobal?: boolean;
  itemIds?: string[];
}

/**
 * Modifier definition
 */
export interface Modifier {
  id: string;
  name: string;
  priceAdjustment: number;
  modifierGroupId: string;
  isRequired: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Selected modifier in an order
 */
export interface ModifierSelection {
  id: string;
  modifierId: string;
  modifier_id?: string; // Snake_case alias for modifierId
  optionId?: string;
  option_id?: string; // Snake_case alias for optionId
  name: string;
  priceAdjustment: number;
  price_adjustment?: number; // Snake_case alias for priceAdjustment
  price?: number; // Alias for priceAdjustment for compatibility
}

/**
 * Selected customization in an order
 */
export interface CustomizationSelection {
  id: string;
  customizationId?: string;
  customization_id?: string; // Snake_case alias
  name: string;
  priceAdjustment: number;
  price?: number; // Alias for priceAdjustment for compatibility
  price_adjustment?: number; // Snake_case alias
  group?: string;
  is_free?: boolean; // Marks free customizations
  is_adhoc?: boolean; // Marks ad-hoc (custom entered) customizations
}

// ================================
// FORM DATA TYPES
// ================================

/**
 * Form data structure for menu item editing
 */
export interface MenuItemFormData {
  id?: string;
  name?: string;
  kitchenDisplayName?: string;
  kitchen_display_name?: string; // Snake_case alias
  description?: string;
  menu_item_description?: string; // Snake_case alias
  categoryId?: string;
  category_id?: string; // Snake_case alias
  spiceIndicators?: string;
  spice_indicators?: string; // Snake_case alias
  featured?: boolean;
  active?: boolean;
  dietaryTags?: string[];
  dietary_tags?: string[]; // Snake_case alias
  itemCode?: string;
  item_code?: string; // Snake_case alias
  menuOrder?: number;
  menu_order?: number; // Snake_case alias
  display_order?: number; // Snake_case alias

  // Food-specific fields
  spiceLevel?: number;
  spice_level?: number; // Snake_case alias
  allergens?: Record<string, "contains" | "may_contain"> | string[] | null;
  allergenWarnings?: string;
  allergen_warnings?: string; // Snake_case alias
  specialtyNotes?: string;
  specialty_notes?: string; // Snake_case alias
  chefsSpecial?: boolean;
  chefs_special?: boolean; // Snake_case alias

  // Kitchen print settings
  printToKitchen?: boolean;
  print_to_kitchen?: boolean; // Snake_case alias
  inheritCategoryPrintSettings?: boolean;
  inherit_category_print_settings?: boolean; // Snake_case alias

  // Pricing
  price?: number;
  base_price?: number; // Snake_case alias
  priceDineIn?: number;
  price_dine_in?: number; // Snake_case alias
  priceDelivery?: number;
  price_delivery?: number; // Snake_case alias
  priceTakeaway?: number;
  price_takeaway?: number; // Snake_case alias

  // Variants
  variants?: ItemVariant[];
  has_variants?: boolean;

  // Drinks & Wine serving sizes
  servingSize125ml?: boolean;
  serving_size_125ml?: boolean; // Snake_case alias
  servingSize125mlPrice?: number;
  serving_size_125ml_price?: number; // Snake_case alias
  servingSize175ml?: boolean;
  serving_size_175ml?: boolean; // Snake_case alias
  servingSize175mlPrice?: number;
  serving_size_175ml_price?: number; // Snake_case alias
  servingSize250ml?: boolean;
  serving_size_250ml?: boolean; // Snake_case alias
  servingSize250mlPrice?: number;
  serving_size_250ml_price?: number; // Snake_case alias
  servingSizeBottle?: boolean;
  serving_size_bottle?: boolean; // Snake_case alias
  servingSizeBottlePrice?: number;
  serving_size_bottle_price?: number; // Snake_case alias

  // Coffee & Desserts serving sizes
  servingSizeRegular?: boolean;
  serving_size_regular?: boolean; // Snake_case alias
  servingSizeRegularPrice?: number;
  serving_size_regular_price?: number; // Snake_case alias
  servingSizeLarge?: boolean;
  serving_size_large?: boolean; // Snake_case alias
  servingSizeLargePrice?: number;
  serving_size_large_price?: number; // Snake_case alias
  servingSizeDecaf?: boolean;
  serving_size_decaf?: boolean; // Snake_case alias
  servingSizeDecafPrice?: number;
  serving_size_decaf_price?: number; // Snake_case alias

  // Beer serving sizes
  servingSizeHalfPint?: boolean;
  serving_size_half_pint?: boolean; // Snake_case alias
  servingSizeHalfPintPrice?: number;
  serving_size_half_pint_price?: number; // Snake_case alias
  servingSizePint?: boolean;
  serving_size_pint?: boolean; // Snake_case alias
  servingSizePintPrice?: number;
  serving_size_pint_price?: number; // Snake_case alias
}

// ================================
// API MAPPERS
// ================================

/**
 * Map API category data to MenuCategory (snake_case to camelCase)
 */
export function mapApiCategoryToMenuCategory(apiCategory: any): MenuCategory {
  return {
    id: apiCategory.id,
    name: apiCategory.name,
    description: apiCategory.description,
    menuOrder: apiCategory.menu_order ?? apiCategory.display_order ?? 0,
    printOrder: apiCategory.print_order,
    printToKitchen: apiCategory.print_to_kitchen ?? true,
    imageUrl: apiCategory.image_url,
    parentCategoryId: apiCategory.parent_category_id ?? apiCategory.parent_id,
    active: apiCategory.active ?? apiCategory.is_active ?? true,
    isProteinType: apiCategory.is_protein_type,
  };
}

/**
 * Map API menu item data to MenuItem (snake_case to camelCase)
 */
export function mapApiItemToMenuItem(apiItem: any): MenuItem {
  return {
    id: apiItem.id,
    name: apiItem.name,
    kitchenDisplayName: apiItem.kitchen_display_name,
    description: apiItem.menu_item_description ?? apiItem.description,
    imageUrl: apiItem.image_url,
    imageVariants: apiItem.image_variants,
    spiceIndicators: apiItem.spice_indicators,
    categoryId: apiItem.category_id,
    categoryName: apiItem.category_name,
    featured: apiItem.featured ?? false,
    dietaryTags: apiItem.dietary_tags,
    itemCode: apiItem.item_code,
    menuOrder: apiItem.menu_order ?? apiItem.display_order ?? 0,
    active: apiItem.active ?? apiItem.is_active ?? true,
    inheritCategoryPrintSettings: apiItem.inherit_category_print_settings,
    price: apiItem.price,
    basePrice: apiItem.base_price,
    priceDineIn: apiItem.price_dine_in,
    priceTakeaway: apiItem.price_takeaway,
    priceDelivery: apiItem.price_delivery,
    priceCollection: apiItem.price_collection ?? apiItem.price_takeaway,
    isSetMeal: apiItem.is_set_meal,
    setMealId: apiItem.set_meal_id,
    setMealCode: apiItem.set_meal_code,
    variants: (apiItem.variants || []).map(mapApiVariantToItemVariant),
    hasVariants: Boolean(apiItem.variants?.length),
    defaultSpiceLevel: apiItem.default_spice_level ?? apiItem.spice_level,
    allergens: apiItem.allergens,
    allergenWarnings: apiItem.allergen_warnings,
    specialtyNotes: apiItem.specialty_notes,
    chefsSpecial: apiItem.chefs_special,
    itemType: apiItem.item_type,
  };
}

/**
 * Map API variant data to ItemVariant (snake_case to camelCase)
 */
export function mapApiVariantToItemVariant(apiVariant: any): ItemVariant {
  return {
    id: apiVariant.id,
    menuItemId: apiVariant.menu_item_id,
    proteinTypeId: apiVariant.protein_type_id,
    proteinType: apiVariant.protein_type
      ? mapApiProteinToProteinType(apiVariant.protein_type)
      : undefined,
    name: apiVariant.name,
    variantName: apiVariant.variant_name,
    price: apiVariant.price ?? 0,
    priceDineIn: apiVariant.price_dine_in,
    priceDelivery: apiVariant.price_delivery,
    priceTakeaway: apiVariant.price_takeaway,
    isDefault: apiVariant.is_default ?? false,
    descriptionOverride: apiVariant.description_override,
    spiceLevelOverride: apiVariant.spice_level_override,
    dietaryTagsOverride: apiVariant.dietary_tags_override,
    imageUrl: apiVariant.image_url,
    imageAssetId: apiVariant.image_asset_id,
    imageState: apiVariant.image_state,
    displayImageUrl: apiVariant.display_image_url,
    imageSource: apiVariant.image_source,
    description: apiVariant.description,
    descriptionState: apiVariant.description_state,
    displayDescription: apiVariant.display_description,
    descriptionSource: apiVariant.description_source,
    isVegetarian: apiVariant.is_vegetarian,
    isVegan: apiVariant.is_vegan,
    isGlutenFree: apiVariant.is_gluten_free,
    isHalal: apiVariant.is_halal,
    isDairyFree: apiVariant.is_dairy_free,
    isNutFree: apiVariant.is_nut_free,
    spiceLevel: apiVariant.spice_level,
    allergens: apiVariant.allergens,
    allergenNotes: apiVariant.allergen_notes,
    availableForDelivery: apiVariant.available_for_delivery,
    availableForTakeaway: apiVariant.available_for_takeaway,
    availableForDineIn: apiVariant.available_for_dine_in,
    variantCode: apiVariant.variant_code,
    displayOrder: apiVariant.display_order,
    featured: apiVariant.featured,
    createdAt: apiVariant.created_at,
    updatedAt: apiVariant.updated_at,
  };
}

/**
 * Map API protein type data to ProteinType (snake_case to camelCase)
 */
export function mapApiProteinToProteinType(apiProtein: any): ProteinType {
  return {
    id: apiProtein.id,
    name: apiProtein.name,
    priceAdjustment: apiProtein.price_adjustment,
    categoryId: apiProtein.category_id,
    menuOrder: apiProtein.menu_order ?? apiProtein.display_order ?? 0,
    active: apiProtein.active ?? apiProtein.is_active ?? true,
    createdAt: apiProtein.created_at,
    updatedAt: apiProtein.updated_at,
  };
}

/**
 * Map MenuItem to API format (camelCase to snake_case)
 */
export function mapMenuItemToApi(item: MenuItem): any {
  return {
    id: item.id,
    name: item.name,
    kitchen_display_name: item.kitchenDisplayName,
    menu_item_description: item.description,
    image_url: item.imageUrl,
    spice_indicators: item.spiceIndicators,
    category_id: item.categoryId,
    featured: item.featured,
    dietary_tags: item.dietaryTags,
    item_code: item.itemCode,
    menu_order: item.menuOrder,
    active: item.active,
    inherit_category_print_settings: item.inheritCategoryPrintSettings,
    price: item.price,
    base_price: item.basePrice,
    price_dine_in: item.priceDineIn,
    price_takeaway: item.priceTakeaway,
    price_delivery: item.priceDelivery,
    is_set_meal: item.isSetMeal,
    set_meal_id: item.setMealId,
    set_meal_code: item.setMealCode,
    default_spice_level: item.defaultSpiceLevel,
    allergens: item.allergens,
    allergen_warnings: item.allergenWarnings,
    specialty_notes: item.specialtyNotes,
    chefs_special: item.chefsSpecial,
    item_type: item.itemType,
  };
}

// ================================
// SIGNATURE DISH TYPES
// ================================

/**
 * Variant information for signature dishes display
 */
export interface SignatureVariantInfo {
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
 * Signature dish for featured items display
 */
export interface SignatureDish {
  id: string;
  title: string;
  description: string;
  main_image: string;
  spice_level: number;
  tags: string[];
  category: string;
  price: Record<string, string>;
  has_variants: boolean;
  variants: SignatureVariantInfo[];
}

// ================================
// LEGACY COMPATIBILITY
// ================================

/**
 * @deprecated Use MenuCategory instead
 */
export type Category = MenuCategory;

/**
 * @deprecated Use ItemVariant instead
 */
export type MenuItemVariant = ItemVariant;

/**
 * VariantInfo alias for SignatureVariantInfo (used in DishDetailsModal)
 */
export type VariantInfo = SignatureVariantInfo;
