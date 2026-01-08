// Shared price computation utilities for Online Orders (Gallery and List)
// Keep logic minimal and consistent with PremiumMenuCard and CustomerCustomizationModal

import { MenuItem, ItemVariant } from './menuTypes';

export type OrderMode = 'delivery' | 'collection';

interface ComputeParams {
  item: MenuItem;
  variant?: ItemVariant | null;
  mode?: OrderMode;
  selectedCustomizationPrices?: number[]; // optional add-on prices
}

export function computeUnitPrice({ item, variant = null, mode = 'collection', selectedCustomizationPrices = [] }: ComputeParams): number {
  // Base price: variant price if present, else item price by mode
  const base = variant
    ? (mode === 'delivery' ? (variant.price_delivery ?? variant.price) : variant.price)
    : (mode === 'delivery' ? (item.price_delivery || item.price_takeaway || item.price || 0) : (item.price_takeaway || item.price || 0));

  const addons = selectedCustomizationPrices.reduce((sum, p) => sum + (p || 0), 0);
  return base + addons;
}

export function computeTotal(params: ComputeParams & { quantity: number }): number {
  const unit = computeUnitPrice(params);
  return unit * Math.max(1, params.quantity);
}

export function formatCurrency(value: number): string {
  // Always GBP with two decimals
  return `£${(value || 0).toFixed(2)}`;
}
