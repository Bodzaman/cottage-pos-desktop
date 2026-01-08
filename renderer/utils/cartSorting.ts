import { CartItem } from './cartStore';
import { MenuItem } from 'utils/menuTypes';

/**
 * Category section hierarchy for sorting cart items
 * Matches SECTION_NAMES from category_section_ordering API
 */
const SECTION_ORDER_MAP = {
  1: 'STARTERS',
  2: 'MAIN COURSE',
  3: 'SIDE DISHES',
  4: 'ACCOMPANIMENTS',
  5: 'DESSERTS & COFFEE',
  6: 'DRINKS & WINE',
  7: 'SET MEALS'
};

/**
 * Sort cart items by menu category hierarchy
 * 
 * Orders items from Starters (1) → Set Meals (7)
 * Uses section_order from MenuItem data
 * Items without section_order appear last
 * 
 * @param cartItems - Array of cart items to sort
 * @param menuItems - Full menu data to look up section_order
 * @returns Sorted cart items array
 */
export function sortCartItemsByCategory(
  cartItems: CartItem[],
  menuItems?: MenuItem[]
): CartItem[] {
  // If no menu data, return items unsorted
  if (!menuItems || menuItems.length === 0) {
    return cartItems;
  }

  // Create lookup map: menuItemId → section_order
  const sectionOrderMap = new Map<string, number>();
  
  menuItems.forEach(item => {
    if (item.id && item.section_order !== null && item.section_order !== undefined) {
      sectionOrderMap.set(item.id, item.section_order);
    }
  });

  // Sort cart items by section_order (ascending)
  return [...cartItems].sort((a, b) => {
    const orderA = sectionOrderMap.get(a.menuItemId) ?? 999; // Items without order go last
    const orderB = sectionOrderMap.get(b.menuItemId) ?? 999;
    
    return orderA - orderB;
  });
}

/**
 * Get section name for a cart item (useful for debugging/grouping)
 */
export function getCartItemSection(
  cartItem: CartItem,
  menuItems?: MenuItem[]
): string | null {
  if (!menuItems || menuItems.length === 0) return null;
  
  const menuItem = menuItems.find(item => item.id === cartItem.menuItemId);
  return menuItem?.section_name || null;
}
