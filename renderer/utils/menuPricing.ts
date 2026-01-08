import type { MenuItem, ItemVariant } from './menuTypes';

/**
 * Order modes for pricing
 */
export type OrderMode = 'delivery' | 'collection' | 'dine-in';

/**
 * Get the appropriate price for a menu item or variant based on order mode
 * 
 * Priority order:
 * 1. Mode-specific price (price_delivery, price_takeaway, price_dine_in)
 * 2. Base price (price or base_price field)
 * 3. Fallback to 0
 * 
 * @param item - Menu item or variant
 * @param mode - Order mode ('delivery' | 'collection' | 'dine-in')
 * @returns Price as number
 */
export function getOnlinePrice(
  item: MenuItem | ItemVariant,
  mode: OrderMode = 'collection'
): number {
  // Type guard: check if it's a variant (has 'price' field directly)
  const isVariant = 'price' in item && typeof item.price === 'number';
  
  if (isVariant) {
    // For variants, use the variant's price fields
    const variant = item as ItemVariant;
    
    switch (mode) {
      case 'delivery':
        return variant.price_delivery ?? variant.price ?? 0;
      case 'dine-in':
        return variant.price_dine_in ?? variant.price ?? 0;
      case 'collection':
      default:
        // Collection uses takeaway pricing
        return variant.price_takeaway ?? variant.price ?? 0;
    }
  } else {
    // For menu items, use the menu item's price fields
    const menuItem = item as MenuItem;
    
    switch (mode) {
      case 'delivery':
        return menuItem.price_delivery ?? menuItem.price ?? menuItem.base_price ?? 0;
      case 'dine-in':
        return menuItem.price_dine_in ?? menuItem.price ?? menuItem.base_price ?? 0;
      case 'collection':
      default:
        // Collection uses takeaway pricing
        return menuItem.price_takeaway ?? menuItem.price ?? menuItem.base_price ?? 0;
    }
  }
}

/**
 * Check if a menu item or variant is available for online ordering
 * 
 * Checks the canonical availability flag:
 * - For menu items: is_active
 * - For variants: is_active
 * 
 * @param item - Menu item or variant
 * @returns true if item is available, false otherwise
 */
export function isItemAvailable(item: MenuItem | ItemVariant): boolean {
  // Both MenuItem and ItemVariant should have is_active field
  return item.is_active ?? false;
}

/**
 * Format price for display with currency symbol
 * 
 * @param price - Price as number
 * @param currency - Currency symbol (default: '£')
 * @returns Formatted price string (e.g., '£9.50')
 */
export function formatPrice(price: number, currency: string = '£'): string {
  return `${currency}${price.toFixed(2)}`;
}

/**
 * Get price label for order mode
 * 
 * @param mode - Order mode
 * @returns Human-readable label
 */
export function getPriceModeLabel(mode: OrderMode): string {
  switch (mode) {
    case 'delivery':
      return 'Delivery';
    case 'dine-in':
      return 'Dine In';
    case 'collection':
    default:
      return 'Collection';
  }
}
