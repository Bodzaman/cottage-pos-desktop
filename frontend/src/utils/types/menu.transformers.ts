/**
 * Menu Type Transformers
 *
 * Utility functions to transform between snake_case (database) and camelCase (legacy UI).
 * Use these during migration to maintain backward compatibility with existing components.
 *
 * Long-term goal: Remove these transformers once all components use snake_case directly.
 */

import type {
  MenuItem,
  ItemVariant,
  Category,
  SetMeal,
  OrderItem,
  PaymentResult,
  DeliverySettings,
} from './menu.types';

// ============================================================================
// GENERIC TRANSFORMERS
// ============================================================================

/**
 * Convert snake_case keys to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase keys to snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Transform object keys from snake_case to camelCase
 */
export function transformKeysToCamel<T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === 'object' && item !== null
        ? transformKeysToCamel(item as Record<string, unknown>)
        : item
    ) as unknown as Record<string, unknown>;
  }
  if (typeof obj !== 'object') return obj as unknown as Record<string, unknown>;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key);
    result[camelKey] =
      typeof value === 'object' && value !== null
        ? transformKeysToCamel(value as Record<string, unknown>)
        : value;
  }
  return result;
}

/**
 * Transform object keys from camelCase to snake_case
 */
export function transformKeysToSnake<T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === 'object' && item !== null
        ? transformKeysToSnake(item as Record<string, unknown>)
        : item
    ) as unknown as Record<string, unknown>;
  }
  if (typeof obj !== 'object') return obj as unknown as Record<string, unknown>;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnake(key);
    result[snakeKey] =
      typeof value === 'object' && value !== null
        ? transformKeysToSnake(value as Record<string, unknown>)
        : value;
  }
  return result;
}

// ============================================================================
// LEGACY CAMELCASE INTERFACES (for migration compatibility)
// ============================================================================

/**
 * @deprecated Use MenuItem from menu.types.ts instead
 * Legacy camelCase interface for backward compatibility
 */
export interface MenuItemCamelCase {
  id: string;
  name: string;
  kitchenDisplayName?: string | null;
  description: string | null;
  menuItemDescription?: string | null;
  longDescription?: string | null;
  publishedAt?: string | null;
  hasPublishedSnapshot?: boolean;
  imageUrl: string | null;
  imageVariants?: {
    square?: { webp?: string | null; jpeg?: string | null };
    widescreen?: { webp?: string | null; jpeg?: string | null };
    thumbnail?: { webp?: string | null; jpeg?: string | null };
  } | null;
  spiceIndicators: string | null;
  defaultSpiceLevel?: number | null;
  categoryId: string;
  categoryName?: string;
  featured: boolean;
  dietaryTags: string[] | null;
  itemCode?: string | null;
  displayOrder: number;
  menuOrder?: number;
  active: boolean;
  inheritCategoryPrintSettings?: boolean;
  price?: number;
  basePrice?: number;
  priceDineIn?: number;
  priceTakeaway?: number;
  priceDelivery?: number;
  priceCollection?: number;
  isSetMeal?: boolean;
  setMealId?: string | null;
  setMealCode?: string | null;
  hasVariants?: boolean;
  defaultVariant?: ItemVariantCamelCase | null;
  isAvailable?: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isHalal?: boolean;
  isDairyFree?: boolean;
  isNutFree?: boolean;
  chefsSpecial?: boolean;
  specialtyNotes?: string | null;
  variants: ItemVariantCamelCase[];
}

/**
 * @deprecated Use ItemVariant from menu.types.ts instead
 * Legacy camelCase interface for backward compatibility
 */
export interface ItemVariantCamelCase {
  id?: string;
  menuItemId?: string;
  proteinTypeId?: string;
  proteinTypeName?: string;
  variantName?: string;
  name: string;
  description?: string;
  descriptionOverride?: string;
  descriptionState?: 'inherited' | 'custom';
  price: number;
  priceDineIn?: number;
  priceDelivery?: number;
  priceTakeaway?: number;
  isDefault?: boolean;
  isActive?: boolean;
  imageUrl?: string;
  imageAssetId?: string;
  imageUrlOverride?: string;
  displayImageUrl?: string | null;
  imageState?: 'inherited' | 'custom';
  imageSource?: 'variant' | 'inherited' | 'none';
  displayOrder?: number;
  spiceLevel?: number;
  spiceLevelOverride?: number;
  allergens?: Record<string, 'contains' | 'may_contain'> | string[] | null;
  allergenNotes?: string;
  dietaryTagsOverride?: string[];
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isHalal?: boolean;
  isDairyFree?: boolean;
  isNutFree?: boolean;
  featured?: boolean;
}

// ============================================================================
// SPECIFIC TRANSFORMERS
// ============================================================================

/**
 * Transform MenuItem from snake_case to camelCase
 * @deprecated Use snake_case MenuItem directly when possible
 */
export function toMenuItemCamelCase(item: MenuItem): MenuItemCamelCase {
  return {
    id: item.id,
    name: item.name,
    kitchenDisplayName: item.kitchen_display_name,
    description: item.description,
    menuItemDescription: item.menu_item_description,
    longDescription: item.long_description,
    publishedAt: item.published_at,
    hasPublishedSnapshot: item.has_published_snapshot,
    imageUrl: item.image_url,
    imageVariants: item.image_variants,
    spiceIndicators: item.spice_indicators,
    defaultSpiceLevel: item.default_spice_level,
    categoryId: item.category_id,
    categoryName: item.category_name,
    featured: item.featured,
    dietaryTags: item.dietary_tags,
    itemCode: item.item_code,
    displayOrder: item.display_order,
    menuOrder: item.display_order,
    active: item.active,
    inheritCategoryPrintSettings: item.inherit_category_print_settings,
    price: item.price,
    basePrice: item.base_price,
    priceDineIn: item.price_dine_in,
    priceTakeaway: item.price_takeaway,
    priceDelivery: item.price_delivery,
    priceCollection: item.price_takeaway,
    isSetMeal: item.is_set_meal,
    setMealId: item.set_meal_id,
    setMealCode: item.set_meal_code,
    hasVariants: item.has_variants,
    defaultVariant: item.default_variant ? toVariantCamelCase(item.default_variant) : null,
    isAvailable: item.is_available,
    isVegetarian: item.is_vegetarian ?? item.vegetarian,
    isVegan: item.is_vegan ?? item.vegan,
    isGlutenFree: item.is_gluten_free ?? item.gluten_free,
    isHalal: item.is_halal ?? item.halal,
    isDairyFree: item.is_dairy_free ?? item.dairy_free,
    isNutFree: item.is_nut_free ?? item.nut_free,
    chefsSpecial: item.chefs_special,
    specialtyNotes: item.specialty_notes,
    variants: item.variants.map(toVariantCamelCase),
  };
}

/**
 * Transform ItemVariant from snake_case to camelCase
 * @deprecated Use snake_case ItemVariant directly when possible
 */
export function toVariantCamelCase(variant: ItemVariant): ItemVariantCamelCase {
  return {
    id: variant.id,
    menuItemId: variant.menu_item_id,
    proteinTypeId: variant.protein_type_id,
    proteinTypeName: variant.protein_type_name,
    variantName: variant.variant_name,
    name: variant.name,
    description: variant.description,
    descriptionOverride: variant.description_override,
    descriptionState: variant.description_state,
    price: variant.price,
    priceDineIn: variant.price_dine_in,
    priceDelivery: variant.price_delivery,
    priceTakeaway: variant.price_takeaway,
    isDefault: variant.is_default,
    isActive: variant.is_active,
    imageUrl: variant.image_url,
    imageAssetId: variant.image_asset_id,
    imageUrlOverride: variant.image_url_override,
    displayImageUrl: variant.display_image_url,
    imageState: variant.image_state,
    imageSource: variant.image_source,
    displayOrder: variant.display_order,
    spiceLevel: variant.spice_level,
    spiceLevelOverride: variant.spice_level_override,
    allergens: variant.allergens,
    allergenNotes: variant.allergen_notes,
    dietaryTagsOverride: variant.dietary_tags_override,
    isVegetarian: variant.is_vegetarian,
    isVegan: variant.is_vegan,
    isGlutenFree: variant.is_gluten_free,
    isHalal: variant.is_halal,
    isDairyFree: variant.is_dairy_free,
    isNutFree: variant.is_nut_free,
    featured: variant.featured,
  };
}

/**
 * Transform MenuItem from camelCase to snake_case (for API calls)
 */
export function toMenuItemSnakeCase(item: MenuItemCamelCase): MenuItem {
  return {
    id: item.id,
    name: item.name,
    kitchen_display_name: item.kitchenDisplayName,
    description: item.description,
    menu_item_description: item.menuItemDescription,
    long_description: item.longDescription,
    published_at: item.publishedAt,
    has_published_snapshot: item.hasPublishedSnapshot,
    image_url: item.imageUrl,
    image_variants: item.imageVariants,
    spice_indicators: item.spiceIndicators,
    default_spice_level: item.defaultSpiceLevel,
    category_id: item.categoryId,
    category_name: item.categoryName,
    featured: item.featured,
    dietary_tags: item.dietaryTags,
    item_code: item.itemCode,
    display_order: item.displayOrder,
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
    has_variants: item.hasVariants,
    default_variant: item.defaultVariant ? toVariantSnakeCase(item.defaultVariant) : null,
    is_available: item.isAvailable,
    is_vegetarian: item.isVegetarian,
    is_vegan: item.isVegan,
    is_gluten_free: item.isGlutenFree,
    is_halal: item.isHalal,
    is_dairy_free: item.isDairyFree,
    is_nut_free: item.isNutFree,
    chefs_special: item.chefsSpecial,
    specialty_notes: item.specialtyNotes,
    variants: item.variants.map(toVariantSnakeCase),
  };
}

/**
 * Transform ItemVariant from camelCase to snake_case (for API calls)
 */
export function toVariantSnakeCase(variant: ItemVariantCamelCase): ItemVariant {
  return {
    id: variant.id,
    menu_item_id: variant.menuItemId,
    protein_type_id: variant.proteinTypeId,
    protein_type_name: variant.proteinTypeName,
    variant_name: variant.variantName,
    name: variant.name,
    description: variant.description,
    description_override: variant.descriptionOverride,
    description_state: variant.descriptionState,
    price: variant.price,
    price_dine_in: variant.priceDineIn,
    price_delivery: variant.priceDelivery,
    price_takeaway: variant.priceTakeaway,
    is_default: variant.isDefault,
    is_active: variant.isActive,
    image_url: variant.imageUrl,
    image_asset_id: variant.imageAssetId,
    image_url_override: variant.imageUrlOverride,
    display_image_url: variant.displayImageUrl,
    image_state: variant.imageState,
    image_source: variant.imageSource,
    display_order: variant.displayOrder,
    spice_level: variant.spiceLevel,
    spice_level_override: variant.spiceLevelOverride,
    allergens: variant.allergens,
    allergen_notes: variant.allergenNotes,
    dietary_tags_override: variant.dietaryTagsOverride,
    is_vegetarian: variant.isVegetarian,
    is_vegan: variant.isVegan,
    is_gluten_free: variant.isGlutenFree,
    is_halal: variant.isHalal,
    is_dairy_free: variant.isDairyFree,
    is_nut_free: variant.isNutFree,
    featured: variant.featured,
  };
}

/**
 * Transform PaymentResult from camelCase to snake_case
 */
export function toPaymentResultSnakeCase(result: {
  method: string;
  amount: number;
  change?: number;
  cashReceived?: number;
  reference?: string;
  tipAmount?: number;
  totalWithTip?: number;
}): PaymentResult {
  return {
    method: result.method as PaymentResult['method'],
    amount: result.amount,
    change: result.change,
    cash_received: result.cashReceived,
    reference: result.reference,
    tip_amount: result.tipAmount,
    total_with_tip: result.totalWithTip,
  };
}

/**
 * Transform DeliverySettings from camelCase to snake_case
 */
export function toDeliverySettingsSnakeCase(settings: {
  enabled: boolean;
  radius: number;
  restaurantLocation: { latitude: number; longitude: number; address?: string };
  fees: Array<{ maxDistance: number; cost: number }>;
  minimumOrders: Array<{ maxDistance: number; minimumAmount: number }>;
}): DeliverySettings {
  return {
    enabled: settings.enabled,
    radius: settings.radius,
    restaurant_location: settings.restaurantLocation,
    fees: settings.fees.map((f) => ({ max_distance: f.maxDistance, cost: f.cost })),
    minimum_orders: settings.minimumOrders.map((m) => ({
      max_distance: m.maxDistance,
      minimum_amount: m.minimumAmount,
    })),
  };
}
