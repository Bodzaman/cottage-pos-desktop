/**
 * Unified Variant Pricing System
 * 
 * Centralized pricing logic for menu items with variants.
 * Eliminates £0.00 displays and provides consistent pricing across:
 * - Admin Portal (card/list views)
 * - POS System
 * - Online Orders
 * - AI Chat & Voice Agents
 * 
 * @module variantPricing
 */

import type { MenuItem, MenuItemVariant } from './masterTypes';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Order mode types supported by the pricing system
 */
export type OrderMode = 'DINE-IN' | 'DELIVERY' | 'COLLECTION' | 'WAITING';

/**
 * Price type classification
 */
export type PriceType = 'single' | 'variant-from' | 'variant-range';

/**
 * Complete price display information for a menu item
 */
export interface PriceDisplay {
  /** The primary price to display (never £0.00) */
  displayPrice: number;
  
  /** Formatted string ready for UI (e.g., "from £5.25" or "£5.25 - £6.95") */
  formattedPrice: string;
  
  /** Type of pricing structure */
  priceType: PriceType;
  
  /** Whether this item has variants */
  hasVariants: boolean;
  
  /** Number of active variants */
  variantCount: number;
  
  /** Minimum price across all variants (if applicable) */
  minPrice?: number;
  
  /** Maximum price across all variants (if applicable) */
  maxPrice?: number;
}

/**
 * Variant summary information for UI badges/indicators
 */
export interface VariantSummary {
  /** Number of variants */
  count: number;
  
  /** List of protein/variant names */
  proteins: string[];
  
  /** Price range string (e.g., "£5.25 - £6.95") */
  priceRange: string;
  
  /** Cheapest option description (e.g., "Chicken at £5.25") */
  cheapestOption: string;
  
  /** Whether item has variants */
  hasVariants: boolean;
}

/**
 * Pricing validation result
 */
export interface ValidationResult {
  /** Whether pricing is valid */
  isValid: boolean;
  
  /** List of errors (blocking issues) */
  errors: string[];
  
  /** List of warnings (non-blocking issues) */
  warnings: string[];
}

/**
 * Pricing mode classification
 */
export type PricingMode = 'single' | 'variant' | 'invalid';

// ============================================================================
// CORE PRICING FUNCTIONS
// ============================================================================

/**
 * Determine the pricing mode for a menu item
 * 
 * This is the authoritative function for detecting how an item should be priced.
 * Returns 'single' for items with base prices, 'variant' for items with variants,
 * or 'invalid' if neither pricing strategy is properly configured.
 * 
 * @param item - Menu item to analyze
 * @param variants - Array of variants (optional, uses item.variants if not provided)
 * @returns Pricing mode classification
 * 
 * @example
 * ```ts
 * const mode = determinePricingMode(item, variants);
 * if (mode === 'invalid') {
 *   // Show pricing configuration guide
 * }
 * ```
 */
export function determinePricingMode(
  item: MenuItem | Partial<MenuItem>,
  variants?: MenuItemVariant[]
): PricingMode {
  const itemVariants = variants || item.variants || [];
  const hasVariants = itemVariants.length > 0;
  const basePrice = item.price ?? 0;
  const basePriceDineIn = item.price_dine_in ?? 0;
  const basePriceDelivery = item.price_delivery ?? 0;
  
  // Has any base price set?
  const hasBasePrice = basePrice > 0 || basePriceDineIn > 0 || basePriceDelivery > 0;
  
  // Case 1: Has variants with valid prices
  if (hasVariants) {
    const validVariants = itemVariants.filter(v => v.price > 0);
    if (validVariants.length > 0) {
      return 'variant';
    }
  }
  
  // Case 2: Has base price (single item)
  if (hasBasePrice && !hasVariants) {
    return 'single';
  }
  
  // Case 3: Invalid - no valid pricing configured
  return 'invalid';
}

/**
 * Get the appropriate price for a variant based on order mode
 * 
 * @param variant - The menu item variant
 * @param mode - Order mode (DINE-IN, DELIVERY, COLLECTION, WAITING)
 * @returns The price for the specified order mode
 * 
 * @example
 * ```ts
 * const price = getVariantPrice(variant, 'DINE-IN');
 * // Returns variant.price_dine_in || variant.price
 * ```
 */
export function getVariantPrice(variant: MenuItemVariant, mode: OrderMode = 'COLLECTION'): number {
  switch (mode) {
    case 'DINE-IN':
      return variant.price_dine_in ?? variant.price;
    case 'DELIVERY':
      return variant.price_delivery ?? variant.price;
    case 'COLLECTION':
    case 'WAITING':
    default:
      return variant.price;
  }
}

/**
 * Get price range for a list of variants
 * 
 * @param variants - Array of menu item variants
 * @param mode - Order mode for pricing context
 * @returns Object with min and max prices
 * 
 * @example
 * ```ts
 * const range = getVariantPriceRange(variants, 'DELIVERY');
 * // { min: 5.25, max: 6.95 }
 * ```
 */
export function getVariantPriceRange(
  variants: MenuItemVariant[],
  mode: OrderMode = 'COLLECTION'
): { min: number; max: number } {
  if (!variants || variants.length === 0) {
    return { min: 0, max: 0 };
  }

  const prices = variants.map(v => getVariantPrice(v, mode));
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
}

/**
 * Get display price for any menu item (handles both single-price and variant items)
 * 
 * This is the primary function for displaying prices in the UI.
 * Never returns £0.00 - always falls back to cheapest variant if base price is zero.
 * 
 * @param item - Menu item
 * @param variants - Array of variants (optional, uses item.variants if not provided)
 * @param mode - Order mode for pricing context
 * @returns Complete price display information
 * 
 * @example
 * ```ts
 * // Single-price item
 * const display = getItemDisplayPrice(item);
 * // { displayPrice: 5.10, formattedPrice: "£5.10", priceType: 'single', ... }
 * 
 * // Variant item
 * const display = getItemDisplayPrice(itemWithVariants, variants, 'DELIVERY');
 * // { displayPrice: 5.25, formattedPrice: "from £5.25", priceType: 'variant-from', ... }
 * ```
 */
export function getItemDisplayPrice(
  item: MenuItem | Partial<MenuItem>,
  variants?: MenuItemVariant[],
  mode: OrderMode = 'COLLECTION'
): PriceDisplay {
  // Use provided variants or fall back to item.variants
  const itemVariants = variants || item.variants || [];
  const hasVariants = itemVariants.length > 0;

  // Get base price based on mode
  let basePrice = 0;
  switch (mode) {
    case 'DINE-IN':
      basePrice = item.price_dine_in ?? item.price ?? 0;
      break;
    case 'DELIVERY':
      basePrice = item.price_delivery ?? item.price ?? 0;
      break;
    case 'COLLECTION':
    case 'WAITING':
    default:
      basePrice = item.price ?? 0;
  }

  // CASE 1: Single-price item (no variants, has valid base price)
  if (!hasVariants && basePrice > 0) {
    return {
      displayPrice: basePrice,
      formattedPrice: `£${basePrice.toFixed(2)}`,
      priceType: 'single',
      hasVariants: false,
      variantCount: 0
    };
  }

  // CASE 2: Variant-based pricing
  if (hasVariants) {
    const { min, max } = getVariantPriceRange(itemVariants, mode);

    // If all variants have same price
    if (min === max) {
      return {
        displayPrice: min,
        formattedPrice: `£${min.toFixed(2)}`,
        priceType: 'variant-from',
        hasVariants: true,
        variantCount: itemVariants.length,
        minPrice: min,
        maxPrice: max
      };
    }

    // If variants have different prices
    return {
      displayPrice: min,
      formattedPrice: `from £${min.toFixed(2)}`,
      priceType: 'variant-range',
      hasVariants: true,
      variantCount: itemVariants.length,
      minPrice: min,
      maxPrice: max
    };
  }

  // CASE 3: Fallback - no valid pricing found
  // This should ideally never happen if validation is working
  return {
    displayPrice: 0,
    formattedPrice: 'Price not set',
    priceType: 'single',
    hasVariants: false,
    variantCount: 0
  };
}

/**
 * Format variant price as a user-friendly string
 * 
 * @param variants - Array of menu item variants
 * @param mode - Order mode for pricing context
 * @returns Formatted price string (e.g., "from £5.25" or "£5.25 - £6.95")
 * 
 * @example
 * ```ts
 * formatVariantPrice(variants); // "from £5.25"
 * formatVariantPrice(singleVariant); // "£5.25"
 * ```
 */
export function formatVariantPrice(
  variants: MenuItemVariant[],
  mode: OrderMode = 'COLLECTION'
): string {
  if (!variants || variants.length === 0) {
    return 'No variants';
  }

  const { min, max } = getVariantPriceRange(variants, mode);

  if (min === max) {
    return `£${min.toFixed(2)}`;
  }

  // Show full range if prices differ significantly (>£0.50)
  if (max - min > 0.5) {
    return `£${min.toFixed(2)} - £${max.toFixed(2)}`;
  }

  // Otherwise just show "from" price
  return `from £${min.toFixed(2)}`;
}

// ============================================================================
// VARIANT SELECTION HELPERS
// ============================================================================

/**
 * Get the cheapest variant from a list
 * 
 * @param variants - Array of menu item variants
 * @param mode - Order mode for pricing context
 * @returns The cheapest variant, or null if no variants
 * 
 * @example
 * ```ts
 * const cheapest = getCheapestVariant(variants, 'DELIVERY');
 * // Returns the variant with lowest delivery price
 * ```
 */
export function getCheapestVariant(
  variants: MenuItemVariant[],
  mode: OrderMode = 'COLLECTION'
): MenuItemVariant | null {
  if (!variants || variants.length === 0) {
    return null;
  }

  return variants.reduce((cheapest, current) => {
    const cheapestPrice = getVariantPrice(cheapest, mode);
    const currentPrice = getVariantPrice(current, mode);
    return currentPrice < cheapestPrice ? current : cheapest;
  });
}

/**
 * Get the default variant, or fall back to first/cheapest variant
 * 
 * @param variants - Array of menu item variants
 * @param mode - Order mode for pricing context
 * @returns The default/first variant, or null if no variants
 * 
 * @example
 * ```ts
 * const defaultVariant = getDefaultVariant(variants);
 * // Returns variant with is_default=true, or cheapest variant
 * ```
 */
export function getDefaultVariant(
  variants: MenuItemVariant[],
  mode: OrderMode = 'COLLECTION'
): MenuItemVariant | null {
  if (!variants || variants.length === 0) {
    return null;
  }

  // Look for explicitly marked default variant
  const defaultVariant = variants.find(v => v.is_default);
  if (defaultVariant) {
    return defaultVariant;
  }

  // Fall back to cheapest variant
  return getCheapestVariant(variants, mode);
}

// ============================================================================
// VARIANT SUMMARY & INFO
// ============================================================================

/**
 * Get variant summary for UI badges and indicators
 * 
 * @param variants - Array of menu item variants
 * @param mode - Order mode for pricing context
 * @returns Summary object with count, proteins, price range, etc.
 * 
 * @example
 * ```ts
 * const summary = getVariantSummary(variants);
 * // {
 * //   count: 3,
 * //   proteins: ['Chicken', 'Lamb', 'King Prawn'],
 * //   priceRange: '£5.25 - £6.95',
 * //   cheapestOption: 'Chicken at £5.25',
 * //   hasVariants: true
 * // }
 * ```
 */
export function getVariantSummary(
  variants: MenuItemVariant[],
  mode: OrderMode = 'COLLECTION'
): VariantSummary {
  if (!variants || variants.length === 0) {
    return {
      count: 0,
      proteins: [],
      priceRange: 'No variants',
      cheapestOption: 'N/A',
      hasVariants: false
    };
  }

  // Extract protein names (filter out nulls/undefined)
  const proteins = variants
    .map(v => v.protein_type_name || v.name)
    .filter((name): name is string => Boolean(name));

  // Get cheapest variant info
  const cheapest = getCheapestVariant(variants, mode);
  const cheapestName = cheapest?.protein_type_name || cheapest?.name || 'Unknown';
  const cheapestPrice = cheapest ? getVariantPrice(cheapest, mode) : 0;

  return {
    count: variants.length,
    proteins,
    priceRange: formatVariantPrice(variants, mode),
    cheapestOption: `${cheapestName} at £${cheapestPrice.toFixed(2)}`,
    hasVariants: true
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate item pricing is complete and correct
 * 
 * Checks:
 * - If has_variants=true, must have at least 1 variant with price > 0
 * - If has_variants=false, base price must be > 0
 * - If base price is £0.00, must have variants
 * - All variant prices must be valid numbers
 * 
 * @param item - Menu item to validate
 * @param variants - Array of variants (optional, uses item.variants if not provided)
 * @returns Validation result with errors and warnings
 * 
 * @example
 * ```ts
 * const result = validateItemPricing(item, variants);
 * if (!result.isValid) {
 *   console.error('Pricing errors:', result.errors);
 * }
 * ```
 */
export function validateItemPricing(
  item: MenuItem | Partial<MenuItem>,
  variants?: MenuItemVariant[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const itemVariants = variants || item.variants || [];
  const hasVariants = itemVariants.length > 0;
  
  // ✅ FIX: Check ALL price types (aligned with backend validation)
  const hasDineInPrice = (item.price_dine_in ?? 0) > 0;
  const hasTakeawayPrice = (item.price_takeaway ?? 0) > 0;
  const hasDeliveryPrice = (item.price_delivery ?? 0) > 0;
  const hasAnyPrice = hasDineInPrice || hasTakeawayPrice || hasDeliveryPrice;
  
  // Legacy base price (for backward compatibility)
  const basePrice = item.price ?? 0;
  const hasBasePrice = basePrice > 0;

  // ✅ VALIDATION RULE: Single items must have at least one price type set
  // Matches backend logic: price_dine_in OR price_takeaway OR price_delivery > 0
  if (!hasVariants && !hasAnyPrice && !hasBasePrice) {
    errors.push(
      'Please set at least one price: Dine In, Takeaway, or Delivery.\n' +
      'Single-price items require pricing before they can be saved.'
    );
  }

  // ✅ VALIDATION RULE: Items with variants must have at least one variant with price > 0
  if (hasVariants) {
    const validVariants = itemVariants.filter(v => v.price > 0);
    if (validVariants.length === 0) {
      errors.push(
        'Item has variants but none have valid prices.\n' +
        'At least one variant must have a price greater than £0.00.'
      );
    }

    // Check for invalid variant prices
    itemVariants.forEach((v, idx) => {
      if (typeof v.price !== 'number' || isNaN(v.price)) {
        errors.push(`Variant ${idx + 1} has invalid price: ${v.price}`);
      }
      if (v.price < 0) {
        errors.push(`Variant ${idx + 1} has negative price: ${v.price}`);
      }
    });
  }

  // ⚠️ WARNING: Item has both base price and variants
  if ((hasAnyPrice || hasBasePrice) && hasVariants) {
    warnings.push(
      'This item has both individual prices AND variants.\n' +
      'When variants are used, individual prices are ignored - customers will choose from variant options.'
    );
  }

  // ⚠️ WARNING: All variants have same price
  if (hasVariants && itemVariants.length > 1) {
    const { min, max } = getVariantPriceRange(itemVariants);
    if (min === max) {
      warnings.push(
        'All variants have the same price.\n' +
        'Consider using single pricing instead of variants if there\'s no price difference.'
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Check if item has valid pricing (quick validation)
 * 
 * @param item - Menu item to check
 * @param variants - Array of variants (optional)
 * @returns True if item has valid pricing
 * 
 * @example
 * ```ts
 * if (hasValidPricing(item, variants)) {
 *   // Proceed with display
 * }
 * ```
 */
export function hasValidPricing(
  item: MenuItem | Partial<MenuItem>,
  variants?: MenuItemVariant[]
): boolean {
  const result = validateItemPricing(item, variants);
  return result.isValid;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Core pricing functions
  getItemDisplayPrice,
  getVariantPrice,
  getVariantPriceRange,
  formatVariantPrice,
  
  // Variant selection helpers
  getCheapestVariant,
  getDefaultVariant,
  
  // Variant summary
  getVariantSummary,
  
  // Validation
  validateItemPricing,
  hasValidPricing
};
