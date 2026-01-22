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
  name: string;
  description?: string | null;
  menuOrder: number;
  printOrder?: number;
  printToKitchen: boolean;
  imageUrl?: string | null;
  parentCategoryId?: string | null;
  active: boolean;
  isProteinType?: boolean;

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
  menuItemId: string;
  proteinTypeId?: string | null;
  proteinType?: ProteinType;
  name?: string | null;
  variantName?: string | null;

  // Pricing
  price: number;
  priceDineIn?: number | null;
  priceDelivery?: number | null;
  priceTakeaway?: number | null;

  // Variant properties
  isDefault: boolean;
  descriptionOverride?: string | null;
  spiceLevelOverride?: number | null;
  dietaryTagsOverride?: string[] | null;

  // Image with inheritance state
  imageUrl?: string | null;
  imageAssetId?: string | null;
  imageState?: InheritanceState;
  displayImageUrl?: string | null;
  imageSource?: ImageSource;

  // Description with inheritance state
  description?: string | null;
  descriptionState?: InheritanceState;
  displayDescription?: string | null;
  descriptionSource?: ImageSource;

  // Dietary flags (variant-specific overrides)
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isHalal?: boolean;
  isDairyFree?: boolean;
  isNutFree?: boolean;

  // Food-specific
  spiceLevel?: number;
  allergens?: string[];
  allergenNotes?: string;

  // Availability
  availableForDelivery?: boolean;
  availableForTakeaway?: boolean;
  availableForDineIn?: boolean;

  // System fields
  variantCode?: string | null;
  displayOrder?: number;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  description?: string | null;
  imageUrl?: string | null;
  imageVariants?: {
    square?: { webp?: string | null; jpeg?: string | null };
    widescreen?: { webp?: string | null; jpeg?: string | null };
    thumbnail?: { webp?: string | null; jpeg?: string | null };
  } | null;
  spiceIndicators?: string | null;
  defaultSpiceLevel?: number | null;
  publishedAt?: string | null;
  categoryId: string;
  categoryName?: string;
  featured: boolean;
  dietaryTags?: string[] | null;
  itemCode?: string | null;
  menuOrder: number;
  active: boolean;
  inheritCategoryPrintSettings?: boolean;

  // Pricing
  price?: number;
  basePrice?: number;
  priceDineIn?: number;
  priceTakeaway?: number;
  priceDelivery?: number;
  priceCollection?: number;

  // Set meal fields
  isSetMeal?: boolean;
  setMealId?: string | null;
  setMealCode?: string | null;

  // Variants
  variants: ItemVariant[];
  hasVariants?: boolean;

  // Food-specific fields
  defaultSpiceLevel?: number;
  allergens?: string[];
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
  menuItemName: string;
  menuItemImageUrl?: string | null;
  quantity: number;
  itemPrice: number;
  categoryName?: string | null;
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
  optionId?: string;
  name: string;
  priceAdjustment: number;
}

/**
 * Selected customization in an order
 */
export interface CustomizationSelection {
  id: string;
  customizationId?: string;
  name: string;
  priceAdjustment: number;
  group?: string;
}

// ================================
// FORM DATA TYPES
// ================================

/**
 * Form data structure for menu item editing
 */
export interface MenuItemFormData {
  id?: string;
  name: string;
  kitchenDisplayName?: string;
  description?: string;
  categoryId: string;
  spiceIndicators?: string;
  featured?: boolean;
  dietaryTags?: string[];
  itemCode?: string;
  menuOrder?: number;

  // Food-specific fields
  spiceLevel?: number;
  allergens?: string[];
  allergenWarnings?: string;
  specialtyNotes?: string;
  chefsSpecial?: boolean;

  // Pricing
  price?: number;
  priceDineIn?: number;
  priceDelivery?: number;
  priceTakeaway?: number;

  // Variants
  variants?: ItemVariant[];

  // Drinks & Wine serving sizes
  servingSize125ml?: boolean;
  servingSize125mlPrice?: number;
  servingSize175ml?: boolean;
  servingSize175mlPrice?: number;
  servingSize250ml?: boolean;
  servingSize250mlPrice?: number;
  servingSizeBottle?: boolean;
  servingSizeBottlePrice?: number;

  // Coffee & Desserts serving sizes
  servingSizeRegular?: boolean;
  servingSizeRegularPrice?: number;
  servingSizeLarge?: boolean;
  servingSizeLargePrice?: number;
  servingSizeDecaf?: boolean;
  servingSizeDecafPrice?: number;

  // Beer serving sizes
  servingSizeHalfPint?: boolean;
  servingSizeHalfPintPrice?: number;
  servingSizePint?: boolean;
  servingSizePintPrice?: number;
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
