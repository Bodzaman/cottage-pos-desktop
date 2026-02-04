/**
 * Set Meal React Query Hooks
 *
 * React Query-based data fetching for set meals.
 * Used by the SetMealsSection component on the Home page.
 */

import { useQuery } from '@tanstack/react-query';
import { getSetMeals } from './supabaseQueries';
import { supabase } from './supabaseClient';
import type { SetMeal } from './types';

// ==============================================================================
// QUERY KEYS
// ==============================================================================

export const setMealKeys = {
  all: ['set-meals'] as const,
  list: () => [...setMealKeys.all, 'list'] as const,
  detail: (id: string) => [...setMealKeys.all, 'detail', id] as const,
};

// ==============================================================================
// TYPES
// ==============================================================================

/**
 * Local SetMealItem type for display purposes
 * Different from menu.types.ts SetMealItem which is for database schema
 */
export interface SetMealItemDisplay {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  quantity: number;
  // Add required fields for compatibility with menu.types.SetMealItem
  menu_item_id?: string;
  menu_item_name?: string;
  item_price?: number;
}

/**
 * Set meal with display items and calculated total
 */
export interface SetMealWithItems extends Omit<SetMeal, 'items'> {
  items: SetMealItemDisplay[];
  total_individual_price: number;
}

// ==============================================================================
// FETCHERS
// ==============================================================================

async function fetchSetMealDetails(setMealId: string): Promise<SetMealWithItems | null> {
  const { data: setMeal, error } = await supabase
    .from('set_meals')
    .select('*, set_meal_items(id, menu_item_id, quantity, menu_items(name, description, image_url, price))')
    .eq('id', setMealId)
    .single();

  if (error || !setMeal) {
    console.error('[setMealQueries] Failed to fetch set meal details:', error);
    return null;
  }

  const items: SetMealItemDisplay[] = (setMeal.set_meal_items || []).map((item: any) => ({
    id: item.id,
    name: item.menu_items?.name || 'Unknown item',
    description: item.menu_items?.description,
    image_url: item.menu_items?.image_url,
    quantity: item.quantity || 1,
  }));

  const totalIndividualPrice = (setMeal.set_meal_items || []).reduce(
    (sum: number, item: any) => sum + (item.menu_items?.price || 0) * (item.quantity || 1),
    0
  );

  console.log('[setMealQueries] Fetched details for set meal:', setMeal.name);

  return {
    ...setMeal,
    items,
    total_individual_price: totalIndividualPrice,
  };
}

// ==============================================================================
// HOOKS
// ==============================================================================

/**
 * Hook to fetch the list of available set meals.
 * Uses React Query for automatic caching and deduplication.
 *
 * @example
 * ```tsx
 * const { data: setMeals, isLoading } = useSetMeals();
 *
 * if (isLoading) return <Loading />;
 *
 * return <SetMealGrid meals={setMeals} />;
 * ```
 */
export function useSetMeals() {
  return useQuery({
    queryKey: setMealKeys.list(),
    queryFn: () => getSetMeals(true), // true = only active set meals
    staleTime: 15 * 60 * 1000, // 15 minutes (set meals rarely change)
    gcTime: 60 * 60 * 1000,    // 1 hour retention
    placeholderData: [],       // Return empty array while loading
  });
}

/**
 * Hook to fetch detailed information about a specific set meal.
 * Includes all menu items with their quantities.
 *
 * @param setMealId - The ID of the set meal to fetch, or null to disable
 *
 * @example
 * ```tsx
 * const [selectedId, setSelectedId] = useState<string | null>(null);
 * const { data: details, isLoading } = useSetMealDetails(selectedId);
 *
 * // Query only runs when selectedId is set
 * ```
 */
export function useSetMealDetails(setMealId: string | null) {
  return useQuery({
    queryKey: setMealKeys.detail(setMealId!),
    queryFn: () => fetchSetMealDetails(setMealId!),
    enabled: !!setMealId, // Only fetch when we have an ID
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000,    // 1 hour retention
  });
}
