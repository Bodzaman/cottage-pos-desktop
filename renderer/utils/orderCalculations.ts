import { OrderItem } from 'utils/menuTypes';

/**
 * Shared calculation utilities for order summary components
 * Used by both POSOrderSummary and DineInOrderSummary to ensure consistency
 */

/**
 * Calculate the subtotal for an array of order items
 */
export function calculateSubtotal(orderItems: OrderItem[]): number {
  return orderItems.reduce((sum, item) => {
    let itemTotal = item.price * item.quantity;
    
    // Add customization costs
    if (item.customizations) {
      const customizationTotal = item.customizations.reduce(
        (custSum, customization) => custSum + ((customization.price_adjustment || 0) * item.quantity),
        0
      );
      itemTotal += customizationTotal;
    }
    
    return sum + itemTotal;
  }, 0);
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(subtotal: number, discountAmount: number = 0, discountPercent: number = 0): number {
  if (discountPercent > 0) {
    return subtotal * (discountPercent / 100);
  }
  return discountAmount;
}

/**
 * Calculate final total including discounts (VAT always included in menu prices)
 */
export function calculateTotal(subtotal: number, discountAmount: number = 0, discountPercent: number = 0): number {
  const discount = calculateDiscount(subtotal, discountAmount, discountPercent);
  return Math.max(0, subtotal - discount);
}

/**
 * Get item total including customizations
 */
export function getItemTotal(item: OrderItem): number {
  let total = item.price * item.quantity;
  
  if (item.customizations) {
    const customizationTotal = item.customizations.reduce(
      (sum, customization) => sum + ((customization.price_adjustment || 0) * item.quantity),
      0
    );
    total += customizationTotal;
  }
  
  return total;
}
