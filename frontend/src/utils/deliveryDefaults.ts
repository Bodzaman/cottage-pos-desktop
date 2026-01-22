/**
 * Delivery Settings Defaults
 *
 * Safe fallback defaults for delivery-related settings.
 * Real values are loaded from the database via restaurant settings.
 * These defaults ensure the app functions even before settings are loaded.
 */

// TODO: These are safe fallback defaults - real values come from DB/restaurant settings
export const DEFAULT_MIN_ORDER = 0;
export const DEFAULT_DELIVERY_FEE = 0;
export const DEFAULT_FREE_DELIVERY_THRESHOLD = 0;

export const DEFAULT_DELIVERY_SETTINGS = {
  minOrder: 0,
  deliveryFee: 0,
  freeDeliveryThreshold: 0,
  deliveryRadius: 0,
  estimatedTime: '30-45 mins',
  isEnabled: true,
};

/**
 * Calculate tax amount based on subtotal and tax rate
 * TODO: This should use restaurant tax settings from DB when available
 *
 * @param amount - The subtotal amount to calculate tax on
 * @param taxRate - Tax rate as a percentage (e.g., 20 for 20%)
 * @returns The calculated tax amount
 */
export function calculateTax(amount: number, taxRate: number = 0): number {
  if (amount <= 0 || taxRate <= 0) return 0;
  return Number((amount * (taxRate / 100)).toFixed(2));
}

/**
 * Calculate delivery fee based on order amount and settings
 * Returns 0 if order meets free delivery threshold
 */
export function calculateDeliveryFee(
  orderAmount: number,
  deliveryFee: number = DEFAULT_DELIVERY_FEE,
  freeDeliveryThreshold: number = DEFAULT_FREE_DELIVERY_THRESHOLD
): number {
  if (freeDeliveryThreshold > 0 && orderAmount >= freeDeliveryThreshold) {
    return 0;
  }
  return deliveryFee;
}

/**
 * Check if order meets minimum order requirement
 */
export function meetsMinimumOrder(
  orderAmount: number,
  minOrder: number = DEFAULT_MIN_ORDER
): boolean {
  return orderAmount >= minOrder;
}
