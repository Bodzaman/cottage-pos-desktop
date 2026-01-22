/**
 * Variant Bulk Operations Utility
 * 
 * Provides bulk pricing operations for menu item variants:
 * - Copy prices between columns
 * - Apply markups (fixed or percentage)
 * - Round prices to nearest increment
 * - Validate pricing consistency
 */

import { MenuItemVariant } from './masterTypes';

/**
 * Bulk action types
 */
export type BulkAction =
  | { type: 'copy-dine-in-to-all' }
  | { type: 'copy-takeaway-to-all' }
  | { type: 'copy-delivery-to-all' }
  | { type: 'add-delivery-markup'; amount: number }
  | { type: 'percentage-increase'; percentage: number; columns?: PriceColumn[] }
  | { type: 'percentage-decrease'; percentage: number; columns?: PriceColumn[] }
  | { type: 'round-prices'; to: 0.05 | 0.10 | 0.25 | 0.50 | 1.00; columns?: PriceColumn[] }
  | { type: 'set-all-same'; price: number };

export type PriceColumn = 'dine_in' | 'takeaway' | 'delivery';

/**
 * Apply a bulk action to all variants
 * 
 * @param variants - Current variant array
 * @param action - Bulk action to perform
 * @returns Updated variant array
 */
export function applyBulkAction(
  variants: Partial<MenuItemVariant>[],
  action: BulkAction
): Partial<MenuItemVariant>[] {
  switch (action.type) {
    case 'copy-dine-in-to-all':
      return copyPriceToAllColumns(variants, 'dine_in');
    
    case 'copy-takeaway-to-all':
      return copyPriceToAllColumns(variants, 'takeaway');
    
    case 'copy-delivery-to-all':
      return copyPriceToAllColumns(variants, 'delivery');
    
    case 'add-delivery-markup':
      return addDeliveryMarkup(variants, action.amount);
    
    case 'percentage-increase':
      return adjustPricesByPercentage(variants, action.percentage, action.columns);
    
    case 'percentage-decrease':
      return adjustPricesByPercentage(variants, -action.percentage, action.columns);
    
    case 'round-prices':
      return roundPrices(variants, action.to, action.columns);
    
    case 'set-all-same':
      return setAllPricesSame(variants, action.price);
    
    default:
      console.warn('Unknown bulk action type:', action);
      return variants;
  }
}

/**
 * Copy prices from one column to all others
 */
function copyPriceToAllColumns(
  variants: Partial<MenuItemVariant>[],
  sourceColumn: PriceColumn
): Partial<MenuItemVariant>[] {
  return variants.map(variant => {
    let sourcePrice: number;
    
    // Get source price
    if (sourceColumn === 'dine_in') {
      sourcePrice = variant.price_dine_in ?? variant.price ?? 0;
    } else if (sourceColumn === 'takeaway') {
      sourcePrice = variant.price ?? 0;
    } else {
      sourcePrice = variant.price_delivery ?? variant.price ?? 0;
    }
    
    return {
      ...variant,
      price: sourcePrice,
      price_dine_in: sourcePrice,
      price_delivery: sourcePrice,
    };
  });
}

/**
 * Add a fixed markup to delivery prices only
 */
function addDeliveryMarkup(
  variants: Partial<MenuItemVariant>[],
  markup: number
): Partial<MenuItemVariant>[] {
  return variants.map(variant => ({
    ...variant,
    price_delivery: (variant.price_delivery ?? variant.price ?? 0) + markup,
  }));
}

/**
 * Adjust prices by percentage
 * 
 * @param variants - Variant array
 * @param percentage - Percentage to adjust (positive or negative)
 * @param columns - Which columns to adjust (default: all)
 */
function adjustPricesByPercentage(
  variants: Partial<MenuItemVariant>[],
  percentage: number,
  columns: PriceColumn[] = ['dine_in', 'takeaway', 'delivery']
): Partial<MenuItemVariant>[] {
  const multiplier = 1 + (percentage / 100);
  
  return variants.map(variant => {
    const updated = { ...variant };
    
    if (columns.includes('dine_in')) {
      updated.price_dine_in = roundToTwoDecimals(
        (variant.price_dine_in ?? variant.price ?? 0) * multiplier
      );
    }
    
    if (columns.includes('takeaway')) {
      updated.price = roundToTwoDecimals(
        (variant.price ?? 0) * multiplier
      );
    }
    
    if (columns.includes('delivery')) {
      updated.price_delivery = roundToTwoDecimals(
        (variant.price_delivery ?? variant.price ?? 0) * multiplier
      );
    }
    
    return updated;
  });
}

/**
 * Round prices to nearest increment (e.g., .05, .95)
 * 
 * @param variants - Variant array
 * @param increment - Rounding increment
 * @param columns - Which columns to round (default: all)
 */
function roundPrices(
  variants: Partial<MenuItemVariant>[],
  increment: number,
  columns: PriceColumn[] = ['dine_in', 'takeaway', 'delivery']
): Partial<MenuItemVariant>[] {
  return variants.map(variant => {
    const updated = { ...variant };
    
    if (columns.includes('dine_in') && variant.price_dine_in !== undefined) {
      updated.price_dine_in = roundToIncrement(variant.price_dine_in, increment);
    }
    
    if (columns.includes('takeaway') && variant.price !== undefined) {
      updated.price = roundToIncrement(variant.price, increment);
    }
    
    if (columns.includes('delivery') && variant.price_delivery !== undefined) {
      updated.price_delivery = roundToIncrement(variant.price_delivery, increment);
    }
    
    return updated;
  });
}

/**
 * Set all prices to the same value
 */
function setAllPricesSame(
  variants: Partial<MenuItemVariant>[],
  price: number
): Partial<MenuItemVariant>[] {
  return variants.map(variant => ({
    ...variant,
    price,
    price_dine_in: price,
    price_delivery: price,
  }));
}

/**
 * Round to nearest increment
 * Common patterns:
 * - 0.05 → rounds to .95, .00, .05
 * - 0.10 → rounds to .90, .00, .10
 * - 1.00 → rounds to whole pounds
 */
function roundToIncrement(value: number, increment: number): number {
  return Math.round(value / increment) * increment;
}

/**
 * Round to 2 decimal places
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Validate variant pricing consistency
 * Returns warnings if prices look unusual
 */
export function validateVariantPricing(
  variants: Partial<MenuItemVariant>[]
): {
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  variants.forEach((variant, index) => {
    const variantName = variant.name || `Variant ${index + 1}`;
    const takeaway = variant.price ?? 0;
    const dineIn = variant.price_dine_in ?? takeaway;
    const delivery = variant.price_delivery ?? takeaway;
    
    // Error: Zero or negative prices
    if (takeaway <= 0 || dineIn <= 0 || delivery <= 0) {
      errors.push(`${variantName} has invalid prices (must be > £0)`);
    }
    
    // Warning: Delivery cheaper than takeaway
    if (delivery < takeaway) {
      warnings.push(`${variantName}: Delivery (£${delivery.toFixed(2)}) is cheaper than Takeaway (£${takeaway.toFixed(2)})`);
    }
    
    // Warning: Dine-in significantly different from takeaway
    const priceDiff = Math.abs(dineIn - takeaway);
    if (priceDiff > 2.00) {
      warnings.push(`${variantName}: Large price difference between Dine-In and Takeaway (£${priceDiff.toFixed(2)})`);
    }
    
    // Warning: Unusual delivery markup
    const deliveryMarkup = delivery - takeaway;
    if (deliveryMarkup < 0 || deliveryMarkup > 5.00) {
      warnings.push(`${variantName}: Unusual delivery markup (£${deliveryMarkup.toFixed(2)})`);
    }
  });
  
  return { warnings, errors };
}

/**
 * Check for duplicate variant names
 */
export function findDuplicateVariantNames(
  variants: Partial<MenuItemVariant>[]
): {
  hasDuplicates: boolean;
  duplicateNames: string[];
  duplicateIndices: Set<number>;
} {
  const nameMap = new Map<string, number[]>();
  const duplicateNames: string[] = [];
  const duplicateIndices = new Set<number>();
  
  variants.forEach((variant, index) => {
    const normalizedName = (variant.name || '').trim().toLowerCase();
    
    if (normalizedName) {
      if (!nameMap.has(normalizedName)) {
        nameMap.set(normalizedName, []);
      }
      nameMap.get(normalizedName)!.push(index);
    }
  });
  
  // Find duplicates
  nameMap.forEach((indices, name) => {
    if (indices.length > 1) {
      duplicateNames.push(name);
      indices.forEach(idx => duplicateIndices.add(idx));
    }
  });
  
  return {
    hasDuplicates: duplicateNames.length > 0,
    duplicateNames,
    duplicateIndices,
  };
}

/**
 * Calculate price statistics for variants
 */
export function calculatePriceStats(
  variants: Partial<MenuItemVariant>[]
): {
  min: number;
  max: number;
  average: number;
  range: number;
} {
  if (variants.length === 0) {
    return { min: 0, max: 0, average: 0, range: 0 };
  }
  
  const prices = variants.map(v => v.price ?? 0);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const average = prices.reduce((a, b) => a + b, 0) / prices.length;
  const range = max - min;
  
  return {
    min: roundToTwoDecimals(min),
    max: roundToTwoDecimals(max),
    average: roundToTwoDecimals(average),
    range: roundToTwoDecimals(range),
  };
}

/**
 * Suggest optimal delivery markup based on variant prices
 */
export function suggestDeliveryMarkup(
  variants: Partial<MenuItemVariant>[]
): number {
  const stats = calculatePriceStats(variants);
  
  // £1 standard for most items
  if (stats.average <= 10.00) return 1.00;
  
  // £1.50 for mid-range items
  if (stats.average <= 20.00) return 1.50;
  
  // £2 for premium items
  return 2.00;
}
