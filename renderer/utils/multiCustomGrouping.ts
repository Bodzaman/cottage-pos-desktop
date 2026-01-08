import { OrderItem } from './menuTypes';

export interface MultiCustomGroup {
  groupId: string;
  menuItemId: string;
  variantId: string;
  name: string;
  variantName: string;
  items: OrderItem[];
  totalQuantity: number;
  totalPrice: number;
  basePrice: number;
  image_url?: string;
}

/**
 * Identifies if an order item is part of a multi-custom group
 */
export function isMultiCustomItem(item: OrderItem): boolean {
  return item.id.startsWith('multi_custom_');
}

/**
 * Extracts the timestamp prefix from a multi-custom item ID to group related items
 * Format: multi_custom_{timestamp}_{random}
 */
export function getMultiCustomGroupId(item: OrderItem): string | null {
  if (!isMultiCustomItem(item)) return null;
  
  // Extract the timestamp part from multi_custom_{timestamp}_{random}
  const parts = item.id.split('_');
  if (parts.length >= 3) {
    return `${item.menu_item_id}_${item.variant_id}_${parts[2].substring(0, 8)}`; // Use first 8 chars of timestamp
  }
  
  return null;
}

/**
 * Groups related multi-custom items together
 */
export function groupMultiCustomItems(orderItems: OrderItem[]): {
  multiCustomGroups: MultiCustomGroup[];
  regularItems: OrderItem[];
} {
  const multiCustomGroups: Map<string, MultiCustomGroup> = new Map();
  const regularItems: OrderItem[] = [];
  
  for (const item of orderItems) {
    if (isMultiCustomItem(item)) {
      const groupId = getMultiCustomGroupId(item);
      
      if (groupId) {
        if (!multiCustomGroups.has(groupId)) {
          // Create new group
          multiCustomGroups.set(groupId, {
            groupId,
            menuItemId: item.menu_item_id,
            variantId: item.variant_id,
            name: item.name,
            variantName: item.variantName || '',
            items: [],
            totalQuantity: 0,
            totalPrice: 0,
            basePrice: 0,
            image_url: item.image_url
          });
        }
        
        const group = multiCustomGroups.get(groupId)!;
        group.items.push(item);
        group.totalQuantity += item.quantity;
        group.totalPrice += item.price * item.quantity;
        
        // Calculate base price (price without customizations)
        if (group.basePrice === 0) {
          // Use the first item's base price
          const customizationPrice = (item.customizations || []).reduce((total, customization) => {
            return total + (customization.price_adjustment || 0);
          }, 0);
          group.basePrice = item.price - customizationPrice;
        }
      } else {
        // Fallback: treat as regular item if we can't parse the group ID
        regularItems.push(item);
      }
    } else {
      regularItems.push(item);
    }
  }
  
  return {
    multiCustomGroups: Array.from(multiCustomGroups.values()),
    regularItems
  };
}

/**
 * Generates a proper variant name for a multi-custom portion
 * Instead of "Portion 1", "Portion 2", use "Prawn Massala 1", "Prawn Massala 2"
 */
export function generatePortionVariantName(groupName: string, variantName: string, portionIndex: number): string {
  // If variantName already contains the group name, use it directly
  if (variantName.toLowerCase().includes(groupName.toLowerCase())) {
    return `${variantName} ${portionIndex + 1}`;
  }
  
  // Otherwise combine them
  return `${variantName} ${portionIndex + 1}`;
}

/**
 * Calculates the total customization cost for an order item
 */
export function calculateCustomizationCost(item: OrderItem): number {
  const customizationCost = (item.customizations || []).reduce((total, customization) => {
    return total + (customization.price_adjustment || 0);
  }, 0);
  
  const modifierCost = (item.modifiers || []).reduce((total, group) => {
    return total + group.options.reduce((groupTotal, option) => {
      return groupTotal + (option.price || 0);
    }, 0);
  }, 0);
  
  return customizationCost + modifierCost;
}

/**
 * Gets the base price of an item (without customizations)
 */
export function getBasePrice(item: OrderItem): number {
  const customizationCost = calculateCustomizationCost(item);
  return item.price - customizationCost;
}
