/**
 * Robust utilities for displaying order items safely
 * Prevents '[object Object]' display issues by handling various data structures
 */

/**
 * Safely extract item name from various data structures
 * Handles cases where item name might be:
 * - A simple string (expected)
 * - An object with name property 
 * - An object without name property
 * - null/undefined values
 */
export function extractItemName(item: any): string {
  // Return fallback if item is null/undefined
  if (!item) {
    return 'Unknown Item';
  }
  
  // If item.name is a string, return it directly
  if (typeof item.name === 'string' && item.name.trim()) {
    return item.name.trim();
  }
  
  // If item.name is an object, try to extract name from it
  if (typeof item.name === 'object' && item.name) {
    // Try common name properties
    if (typeof item.name.name === 'string' && item.name.name.trim()) {
      return item.name.name.trim();
    }
    if (typeof item.name.item_name === 'string' && item.name.item_name.trim()) {
      return item.name.item_name.trim();
    }
    if (typeof item.name.title === 'string' && item.name.title.trim()) {
      return item.name.title.trim();
    }
    // If object has no recognizable name property, use first string value found
    const firstStringValue = Object.values(item.name).find(val => typeof val === 'string' && val.trim());
    if (firstStringValue) {
      return String(firstStringValue).trim();
    }
  }
  
  // Fallback: try other common item properties
  if (typeof item.item_name === 'string' && item.item_name.trim()) {
    return item.item_name.trim();
  }
  if (typeof item.title === 'string' && item.title.trim()) {
    return item.title.trim();
  }
  if (typeof item.description === 'string' && item.description.trim()) {
    return item.description.trim();
  }
  
  // Last resort: if item itself is a string
  if (typeof item === 'string' && item.trim()) {
    return item.trim();
  }
  
  // Ultimate fallback
  return 'Unknown Item';
}

/**
 * Safely extract variant name from various data structures
 */
export function extractVariantName(item: any): string | undefined {
  if (!item) return undefined;
  
  // Direct variant_name property
  if (typeof item.variant_name === 'string' && item.variant_name.trim()) {
    return item.variant_name.trim();
  }
  
  // Alternative variant properties
  if (typeof item.variant === 'string' && item.variant.trim()) {
    return item.variant.trim();
  }
  
  // If variant is an object, try to extract name
  if (typeof item.variant === 'object' && item.variant) {
    if (typeof item.variant.name === 'string' && item.variant.name.trim()) {
      return item.variant.name.trim();
    }
  }
  
  return undefined;
}

/**
 * Safely extract quantity with fallback
 */
export function extractQuantity(item: any): number {
  if (!item) return 1;
  
  const qty = item.quantity || item.qty || item.count;
  
  if (typeof qty === 'number' && qty > 0) {
    return qty;
  }
  
  if (typeof qty === 'string') {
    const parsed = parseInt(qty, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  
  return 1; // Default quantity
}

/**
 * Safely extract price with fallback
 */
export function extractPrice(item: any): number {
  if (!item) return 0;
  
  const price = item.price || item.cost || item.amount;
  
  if (typeof price === 'number' && price >= 0) {
    return price;
  }
  
  if (typeof price === 'string') {
    // Remove currency symbols and parse
    const cleaned = price.replace(/[£$€¥,]/g, '');
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  
  return 0; // Default price
}

/**
 * Create a formatted display string for an order item
 * This is the main function to use for robust item display
 */
export function formatOrderItemDisplay(item: any): string {
  const name = extractItemName(item);
  const quantity = extractQuantity(item);
  const variant = extractVariantName(item);
  
  let display = `${quantity}x ${name}`;
  
  if (variant) {
    display += ` (${variant})`;
  }
  
  return display;
}

/**
 * Safely format order items list for display
 * Used in notifications, summaries, etc.
 */
export function formatOrderItemsList(items: any[]): string {
  if (!Array.isArray(items) || items.length === 0) {
    return 'No items';
  }
  
  return items.map(item => formatOrderItemDisplay(item)).join(', ');
}

/**
 * Debug function to log item structure for troubleshooting
 * Use console.log directly for debugging
 */
export function debugItemStructure(item: any, label: string = 'Item'): void {
  console.log(`🔍 ${label} structure:`, {
    raw: item,
    extractedName: extractItemName(item),
    extractedVariant: extractVariantName(item),
    extractedQuantity: extractQuantity(item),
    extractedPrice: extractPrice(item)
  });
}
