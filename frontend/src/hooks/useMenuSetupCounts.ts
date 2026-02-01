/**
 * useMenuSetupCounts Hook
 *
 * Provides comprehensive counts for all 5 Menu Setup Dashboard sections:
 * 1. Categories - total and active count
 * 2. Proteins - total and active count
 * 3. Menu Items - total and draft count
 * 4. Set Meals - total and draft count
 * 5. Customizations - total, active, and draft count
 *
 * Uses React Query for efficient data fetching with caching.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';

export interface SectionCounts {
  total: number;
  active?: number;
  drafts?: number;
}

export interface MenuSetupCounts {
  categories: SectionCounts;
  proteins: SectionCounts;
  menuItems: SectionCounts;
  setMeals: SectionCounts;
  customizations: SectionCounts;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetch all counts in parallel for efficiency
 */
async function fetchMenuSetupCounts(): Promise<Omit<MenuSetupCounts, 'isLoading' | 'error'>> {
  // Run all queries in parallel
  const [
    categoriesResult,
    proteinsResult,
    menuItemsResult,
    setMealsResult,
    customizationsResult
  ] = await Promise.all([
    // Categories: count total and active
    supabase
      .from('categories')
      .select('id, active')
      .order('display_order'),

    // Proteins: count total and active
    supabase
      .from('protein_types')
      .select('id, active')
      .order('name'),

    // Menu Items: count total and drafts (published_at IS NULL = draft)
    supabase
      .from('menu_items')
      .select('id, active, published_at')
      .order('display_order'),

    // Set Meals: count total and drafts
    supabase
      .from('set_meals')
      .select('id, active, published_at')
      .order('created_at'),

    // Customizations: count total, active, and drafts
    supabase
      .from('customizations')
      .select('id, is_active, published_at')
      .order('display_order')
  ]);

  // Process categories
  const categories = categoriesResult.data || [];
  const categoryCounts: SectionCounts = {
    total: categories.length,
    active: categories.filter(c => c.active).length
  };

  // Process proteins
  const proteins = proteinsResult.data || [];
  const proteinCounts: SectionCounts = {
    total: proteins.length,
    active: proteins.filter(p => p.active).length
  };

  // Process menu items
  const menuItems = menuItemsResult.data || [];
  const menuItemCounts: SectionCounts = {
    total: menuItems.length,
    active: menuItems.filter(i => i.active).length,
    drafts: menuItems.filter(i => !i.published_at).length
  };

  // Process set meals
  const setMeals = setMealsResult.data || [];
  const setMealCounts: SectionCounts = {
    total: setMeals.length,
    active: setMeals.filter(m => m.active).length,
    drafts: setMeals.filter(m => !m.published_at).length
  };

  // Process customizations
  const customizations = customizationsResult.data || [];
  const customizationCounts: SectionCounts = {
    total: customizations.length,
    active: customizations.filter(c => c.is_active).length,
    drafts: customizations.filter(c => !c.published_at).length
  };

  return {
    categories: categoryCounts,
    proteins: proteinCounts,
    menuItems: menuItemCounts,
    setMeals: setMealCounts,
    customizations: customizationCounts
  };
}

/**
 * Hook to get counts for all menu setup sections
 *
 * @returns Counts for all 5 sections with loading and error states
 */
export function useMenuSetupCounts(): MenuSetupCounts {
  const { data, isLoading, error } = useQuery({
    queryKey: ['menu-setup-counts'],
    queryFn: fetchMenuSetupCounts,
    staleTime: 30000, // 30 seconds - counts don't change frequently
    refetchOnWindowFocus: true,
  });

  return {
    categories: data?.categories || { total: 0, active: 0 },
    proteins: data?.proteins || { total: 0, active: 0 },
    menuItems: data?.menuItems || { total: 0, active: 0, drafts: 0 },
    setMeals: data?.setMeals || { total: 0, active: 0, drafts: 0 },
    customizations: data?.customizations || { total: 0, active: 0, drafts: 0 },
    isLoading,
    error: error as Error | null
  };
}

export default useMenuSetupCounts;
