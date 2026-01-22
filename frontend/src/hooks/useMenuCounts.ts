/**
 * useMenuCounts Hook
 *
 * Computes counts for the Menu Management sidebar:
 * - Total menu items count
 * - Draft (unpublished) items count
 * - Set meals count
 * - Customizations (add-ons) count
 */

import { useMemo } from 'react';
import { useMenuItems } from '../utils/menuQueries';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';

export interface MenuCounts {
  items: number;
  itemDrafts: number;
  setMeals: number;
  addons: number;
}

/**
 * Hook to compute menu section counts for the sidebar
 */
export function useMenuCounts(): MenuCounts {
  const { data: menuItems = [] } = useMenuItems();

  // Get set meals and customizations from the realtime store
  const setMeals = useRealtimeMenuStore((state) => state.setMeals);
  const customizations = useRealtimeMenuStore((state) => state.customizations);

  return useMemo(() => {
    // Count all menu items
    const itemsCount = menuItems.length;

    // Count unpublished (draft) items - items without published_at timestamp
    const draftCount = menuItems.filter((item: any) => !item.published_at).length;

    // Count set meals
    const setMealsCount = setMeals?.length || 0;

    // Count customizations
    const addonsCount = customizations?.length || 0;

    return {
      items: itemsCount,
      itemDrafts: draftCount,
      setMeals: setMealsCount,
      addons: addonsCount,
    };
  }, [menuItems, setMeals, customizations]);
}

export default useMenuCounts;
