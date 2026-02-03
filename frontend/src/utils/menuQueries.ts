import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';
import brain from 'brain';
import { supabase, ensureSupabaseConfigured } from './supabaseClient';
import { toast } from 'sonner';
import type {
  Category,
  MenuItem,
  ProteinType,
  ItemVariant,
  Customization,
  SetMeal
} from './types';
import {
  getMenuWithOrdering,
  getProteinTypes as fetchProteinTypesFromDB,
  getCustomizations as fetchCustomizationsFromDB,
  getSetMeals as fetchSetMealsFromDB
} from './supabaseQueries';

// ============================================================================
// MENU CONTEXT TYPE
// ============================================================================

/**
 * Menu context determines data filtering:
 * - 'admin': Shows ALL items (draft + published) for editing
 * - 'pos': Shows only PUBLISHED items for ordering
 * - 'online': Shows only PUBLISHED items for customer-facing menu
 */
export type MenuContext = 'admin' | 'pos' | 'online';

/**
 * Centralized React Query hooks for all menu data fetching.
 * 
 * Benefits over menuCache:
 * - Eliminates manual polling (React Query handles background refetch)
 * - Automatic caching and stale-while-revalidate
 * - Built-in loading states and error handling
 * - Smart invalidation on mutations
 * - React Query DevTools for debugging
 * - Reduces unnecessary re-renders and network calls
 * 
 * Migration from menuCache pattern:
 * Before: const { fetchCategories, invalidateCategories } = useMenuData();
 * After:  const { data: categories, isLoading } = useCategories();
 */

// ============================================================================
// QUERY KEY FACTORY (for invalidation and prefetching)
// ============================================================================

/**
 * Query key factory for menu data.
 * Follows hierarchical pattern: [entity, ...filters]
 * 
 * Usage:
 * - queryClient.invalidateQueries({ queryKey: menuKeys.all }); // Invalidate ALL menu data
 * - queryClient.invalidateQueries({ queryKey: menuKeys.categories() }); // Invalidate categories only
 * - queryClient.invalidateQueries({ queryKey: menuKeys.menuItemsByCategory(categoryId) }); // Specific category
 */
export const menuKeys = {
  all: ['menu'] as const,
  categories: (context?: MenuContext) => [...menuKeys.all, 'categories', { context }] as const,
  menuItems: (context?: MenuContext) => [...menuKeys.all, 'items', { context }] as const,
  menuItemsByCategory: (categoryId: string, context?: MenuContext) => [...menuKeys.menuItems(context), 'by-category', categoryId] as const,
  proteinTypes: () => [...menuKeys.all, 'proteins'] as const,
  itemVariants: () => [...menuKeys.all, 'variants'] as const,
  customizations: (context?: MenuContext) => [...menuKeys.all, 'customizations', { context }] as const,
  setMeals: (context?: MenuContext) => [...menuKeys.all, 'set-meals', { context }] as const,
  completeMenu: (context?: MenuContext) => [...menuKeys.all, 'complete', { context }] as const,
  // NEW: POS bundle key for unified data fetching
  posBundle: (context?: MenuContext) => [...menuKeys.all, 'pos-bundle', { context }] as const,
} as const;

// ============================================================================
// QUERY HOOKS (data fetching)
// ============================================================================

// Normalizer for brain.get_menu_items() responses
let warnedMenuItemsShape = false;
function normalizeMenuItemsResponse(raw: any): MenuItem[] {
  // If already an array, return directly
  if (Array.isArray(raw)) return raw as MenuItem[];
  // Common case: { success: boolean, data: [...] }
  if (raw && Array.isArray(raw.data)) return raw.data as MenuItem[];
  // Less common: { items: [...] }
  if (raw && Array.isArray(raw.items)) return raw.items as MenuItem[];

  // Fallback: warn once and return empty array
  if (!warnedMenuItemsShape) {
    console.warn('menuQueries: Unexpected menu items response shape. Returning empty array.', raw);
    warnedMenuItemsShape = true;
  }
  return [] as MenuItem[];
}

// Helpers to fetch categories/proteins with graceful fallback ordering
async function fetchCategoriesOrdered(): Promise<Category[]> {
  await ensureSupabaseConfigured();
  // Use display_order as the canonical ordering field (added via migration)
  const res = await supabase
    .from('menu_categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (res.error) {
    // 42703: undefined_column - fallback if display_order doesn't exist
    const msg = res.error.message || '';
    const code = (res.error as any).code;
    if (code === '42703' || msg.includes('display_order')) {
      console.warn('⚠️ [React Query] display_order missing on menu_categories. Falling back to sort_order.');
      const fallback = await supabase
        .from('menu_categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (fallback.error) throw new Error(`Failed to fetch categories (fallback): ${fallback.error.message}`);
      // Map database columns to TypeScript interface
      return (fallback.data || []).map((cat: any) => ({
        ...cat,
        display_order: cat.display_order ?? cat.sort_order ?? 999,
        active: cat.is_active ?? cat.active ?? true,
      }));
    }
    throw new Error(`Failed to fetch categories: ${res.error.message}`);
  }

  // Map database columns to TypeScript interface
  return (res.data || []).map((cat: any) => ({
    ...cat,
    display_order: cat.display_order ?? cat.sort_order ?? 999,
    active: cat.is_active ?? cat.active ?? true,
  }));
}

async function fetchProteinTypesOrdered(): Promise<ProteinType[]> {
  await ensureSupabaseConfigured();
  const res = await supabase
    .from('menu_protein_types')
    .select('*')
    .order('display_order', { ascending: true });

  if (res.error) {
    const msg = res.error.message || '';
    const code = (res.error as any).code;
    if (code === '42703' || msg.includes('display_order')) {
      console.warn('⚠️ [React Query] display_order missing on menu_protein_types. Falling back to name ordering.');
      const fallback = await supabase
        .from('menu_protein_types')
        .select('*')
        .order('name', { ascending: true });
      if (fallback.error) throw new Error(`Failed to fetch protein types (fallback): ${fallback.error.message}`);
      return fallback.data || [];
    }
    throw new Error(`Failed to fetch protein types: ${res.error.message}`);
  }

  return res.data || [];
}

/**
 * Fetch menu categories with auto-refresh.
 * Replaces: fetchCategories() from useMenuData
 *
 * Configuration:
 * - staleTime: 2 minutes (data considered fresh)
 * - refetchOnWindowFocus: true (auto-refresh when user returns to tab)
 * - cacheTime: 10 minutes (keep in cache after component unmounts)
 */
export function useCategories(options?: Partial<Omit<UseQueryOptions<Category[]>, 'queryKey' | 'queryFn'>>) {
  return useQuery({
    queryKey: menuKeys.categories(),
    queryFn: async () => {
      return await fetchCategoriesOrdered();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes — menu changes rarely; mutations invalidate explicitly
    gcTime: 30 * 60 * 1000, // 30 minutes cache retention
    refetchOnWindowFocus: true, // Replaces polling
    retry: 2, // Production safety
    ...options,
  });
}

/**
 * Fetch all menu items with auto-refresh.
 * Replaces: fetchMenuItems() from useMenuData
 */
export function useMenuItems(options?: Partial<Omit<UseQueryOptions<MenuItem[]>, 'queryKey' | 'queryFn'>>) {
  return useQuery({
    queryKey: menuKeys.menuItems(),
    queryFn: async () => {
      const menuResult = await getMenuWithOrdering({ includeInactive: true, publishedOnly: false });
      if (!menuResult.success || !menuResult.data) {
        return [] as MenuItem[];
      }
      return (menuResult.data.items || []) as MenuItem[];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
    ...options,
  });
}

/**
 * Fetch menu items filtered by category.
 * Replaces: fetchMenuItemsByCategory(categoryId) from useMenuData
 */
export function useMenuItemsByCategory(
  categoryId: string,
  options?: Partial<Omit<UseQueryOptions<MenuItem[]>, 'queryKey' | 'queryFn'>>
) {
  return useQuery({
    queryKey: menuKeys.menuItemsByCategory(categoryId),
    queryFn: async () => {
      const response = await (brain as any).get_menu_items();
      const raw = await response.json();
      const allItems = normalizeMenuItemsResponse(raw);
      const filtered = allItems.filter((item: MenuItem) => item.category_id === categoryId);
      return filtered;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
    enabled: Boolean(categoryId), // Only fetch if categoryId provided
    ...options,
  });
}

/**
 * Fetch protein types with auto-refresh.
 * Replaces: fetchProteinTypes() from useMenuData
 */
export function useProteinTypes(options?: Partial<Omit<UseQueryOptions<ProteinType[]>, 'queryKey' | 'queryFn'>>) {
  return useQuery({
    queryKey: menuKeys.proteinTypes(),
    queryFn: async () => {
      return await fetchProteinTypesOrdered();
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
    ...options,
  });
}

/**
 * Fetch item variants with auto-refresh.
 * Replaces: fetchItemVariants() from useMenuData
 */
export function useItemVariants(options?: Partial<Omit<UseQueryOptions<ItemVariant[]>, 'queryKey' | 'queryFn'>>) {
  return useQuery({
    queryKey: menuKeys.itemVariants(),
    queryFn: async () => {
      await ensureSupabaseConfigured();

      const { data, error } = await supabase
        .from('menu_item_variants')
        .select(`
          *,
          protein_type:menu_protein_types(name)
        `);

      if (error) {
        console.error('Failed to fetch item variants:', error);
        throw new Error(`Failed to fetch item variants: ${error.message}`);
      }

      // Map protein_type.name to protein_type_name for backward compatibility
      const mapped = data?.map(variant => ({
        ...variant,
        protein_type_name: variant.protein_type?.name || null,
      })) || [];

      return mapped;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
    ...options,
  });
}

/**
 * Fetch customizations with auto-refresh.
 * Replaces: fetchCustomizations() from useMenuData
 *
 * Uses direct Supabase SDK for reliable data fetching (same as useMenuBundle).
 * The brain API backend was failing silently, so we bypass it.
 */
export function useCustomizations(options?: Partial<Omit<UseQueryOptions<Customization[]>, 'queryKey' | 'queryFn'>> & { context?: MenuContext }) {
  const { context = 'admin', ...queryOptions } = options || {};
  const publishedOnly = context !== 'admin';

  return useQuery({
    queryKey: menuKeys.customizations(context),
    queryFn: async () => {
      await ensureSupabaseConfigured();
      // Use direct Supabase SDK - same pattern as useMenuBundle
      const data = await fetchCustomizationsFromDB(publishedOnly);
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
    ...queryOptions,
  });
}

/**
 * Create or update a customization
 */
export function useUpsertCustomization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customization: Partial<Customization> & { name: string }) => {
      await ensureSupabaseConfigured();

      const { id, ...data } = customization;

      if (id) {
        // Update existing
        const { data: result, error } = await supabase
          .from('menu_customizations')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();

        if (error) throw new Error(`Failed to update customization: ${error.message}`);
        return result;
      } else {
        // Create new
        const { data: result, error } = await supabase
          .from('menu_customizations')
          .insert(data)
          .select()
          .single();

        if (error) throw new Error(`Failed to create customization: ${error.message}`);
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.customizations() });
      toast.success('Customization saved successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Delete a customization
 */
export function useDeleteCustomization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await ensureSupabaseConfigured();

      const { error } = await supabase
        .from('menu_customizations')
        .delete()
        .eq('id', id);

      if (error) throw new Error(`Failed to delete customization: ${error.message}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.customizations() });
      toast.success('Customization deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ============================================================================
// SET MEALS HOOKS
// ============================================================================

/**
 * Simplified SetMeal type for queries that don't need full item details.
 * Use SetMeal from menuTypes.ts for full set meal data including items.
 */
interface SetMealSummary {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  hero_image_url?: string | null;
  hero_image_asset_id?: string | null;
  set_price: number;
  active: boolean;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch set meals with auto-refresh.
 */
export function useSetMeals(activeOnly: boolean = false, options?: UseQueryOptions<SetMealSummary[]>) {
  return useQuery({
    queryKey: [...menuKeys.setMeals(), { activeOnly }],
    queryFn: async () => {
      await ensureSupabaseConfigured();

      let query = supabase
        .from('set_meals')
        .select('*')
        .order('name');

      if (activeOnly) {
        query = query.eq('active', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch set meals:', error);
        throw new Error(`Failed to fetch set meals: ${error.message}`);
      }

      return (data || []) as SetMeal[];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
    ...options,
  });
}

/**
 * Create a new set meal
 */
export function useCreateSetMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (setMeal: Omit<SetMeal, 'id' | 'created_at' | 'updated_at'>) => {
      await ensureSupabaseConfigured();

      const { data, error } = await supabase
        .from('set_meals')
        .insert(setMeal)
        .select()
        .single();

      if (error) throw new Error(`Failed to create set meal: ${error.message}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.setMeals() });
      toast.success('Set meal created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Update an existing set meal
 */
export function useUpdateSetMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SetMeal> & { id: string }) => {
      await ensureSupabaseConfigured();

      const { data, error } = await supabase
        .from('set_meals')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(`Failed to update set meal: ${error.message}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.setMeals() });
      toast.success('Set meal updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Delete a set meal
 */
export function useDeleteSetMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await ensureSupabaseConfigured();

      const { error } = await supabase
        .from('set_meals')
        .delete()
        .eq('id', id);

      if (error) throw new Error(`Failed to delete set meal: ${error.message}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.setMeals() });
      toast.success('Set meal deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ============================================================================
// COMPLETE MENU DATA HOOK
// ============================================================================

/**
 * Fetch complete menu data (all entities) with auto-refresh.
 * Replaces: fetchCompleteMenuData() from useMenuData
 *
 * Returns: { categories, menuItems, proteinTypes, itemVariants, customizations }
 */
export function useCompleteMenuData(options?: UseQueryOptions<{
  categories: Category[];
  menuItems: MenuItem[];
  proteinTypes: ProteinType[];
  itemVariants: ItemVariant[];
  customizations: Customization[];
}>) {
  return useQuery({
    queryKey: menuKeys.completeMenu(),
    queryFn: async () => {
      await ensureSupabaseConfigured();

      // Fetch all data in parallel, using helpers that handle fallbacks
      // Note: Using direct Supabase SDK for customizations (brain API was failing silently)
      const [categories, itemsRes, proteinTypes, variantsRes, customizations] = await Promise.all([
        fetchCategoriesOrdered(),
        brain.get_menu_items(),
        fetchProteinTypesOrdered(),
        supabase.from('menu_item_variants').select(`
          *,
          protein_type:menu_protein_types(name)
        `),
        fetchCustomizationsFromDB(false), // false = show all (not just published)
      ]);

      // Handle variant errors
      if (variantsRes.error) throw new Error(`Variants: ${variantsRes.error.message}`);

      // Parse brain responses
      const menuItemsRaw = await itemsRes.json();
      const menuItems = normalizeMenuItemsResponse(menuItemsRaw);

      // Map variants
      const itemVariants = variantsRes.data?.map(variant => ({
        ...variant,
        protein_type_name: variant.protein_type?.name || null,
      })) || [];

      const result = {
        categories: categories || [],
        menuItems: menuItems || [],
        proteinTypes: proteinTypes || [],
        itemVariants,
        customizations: customizations || [],
      };

      return result;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
    ...options,
  });
}

// ============================================================================
// MUTATION HOOKS (data updates)
// ============================================================================

/**
 * Example mutation hook pattern for creating/updating menu items.
 * Use this pattern for all CRUD operations.
 * 
 * Usage:
 * ```ts
 * const mutation = useCreateMenuItem();
 * mutation.mutate({ name: 'New Item', ... }, {
 *   onSuccess: () => toast.success('Created!'),
 * });
 * ```
 */
export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newItem: Partial<MenuItem>) => {
      const response = await (brain as any).create_menu_item(newItem as any);
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate affected queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: menuKeys.menuItems() });
      queryClient.invalidateQueries({ queryKey: menuKeys.completeMenu() });
    },
    onError: (error) => {
      console.error('Failed to create menu item:', error);
      toast.error('Failed to create menu item');
    },
  });
}

/**
 * Mutation for updating a menu item.
 */
export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MenuItem> }) => {
      const response = await (brain as any).update_menu_item({ menu_item_id: id, ...data } as any);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.menuItems() });
      queryClient.invalidateQueries({ queryKey: menuKeys.completeMenu() });
    },
    onError: (error) => {
      console.error('Failed to update menu item:', error);
      toast.error('Failed to update menu item');
    },
  });
}

/**
 * Mutation for deleting a menu item.
 */
export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await (brain as any).delete_menu_item({ menu_item_id: id });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.menuItems() });
      queryClient.invalidateQueries({ queryKey: menuKeys.completeMenu() });
    },
    onError: (error) => {
      console.error('Failed to delete menu item:', error);
      toast.error('Failed to delete menu item');
    },
  });
}

/**
 * Mutation for creating/updating a category.
 */
export function useUpsertCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (category: Partial<Category>) => {
      const { error } = await supabase
        .from('menu_categories')
        .upsert(category as any);

      if (error) throw error;
      return category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() });
      queryClient.invalidateQueries({ queryKey: menuKeys.completeMenu() });
    },
    onError: (error) => {
      console.error('Failed to save category:', error);
      toast.error('Failed to save category');
    },
  });
}

/**
 * Mutation for deleting a category.
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() });
      queryClient.invalidateQueries({ queryKey: menuKeys.completeMenu() });
    },
    onError: (error) => {
      console.error('Failed to delete category:', error);
      toast.error('Failed to delete category');
    },
  });
}

/**
 * Mutation for creating/updating a protein type.
 */
export function useUpsertProteinType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (proteinType: Partial<ProteinType>) => {
      const { error } = await supabase
        .from('menu_protein_types')
        .upsert(proteinType as any);

      if (error) throw error;
      return proteinType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.proteinTypes() });
      queryClient.invalidateQueries({ queryKey: menuKeys.itemVariants() });
      queryClient.invalidateQueries({ queryKey: menuKeys.completeMenu() });
    },
    onError: (error) => {
      console.error('Failed to save protein type:', error);
      toast.error('Failed to save protein type');
    },
  });
}

/**
 * Mutation for deleting a protein type.
 */
export function useDeleteProteinType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('menu_protein_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.proteinTypes() });
      queryClient.invalidateQueries({ queryKey: menuKeys.itemVariants() });
      queryClient.invalidateQueries({ queryKey: menuKeys.completeMenu() });
    },
    onError: (error) => {
      console.error('Failed to delete protein type:', error);
      toast.error('Failed to delete protein type');
    },
  });
}

// ============================================================================
// MENU BUNDLE HOOK (Unified Data Fetching)
// ============================================================================

/**
 * Menu bundle data structure - all menu data in one place
 */
export interface MenuBundle {
  categories: Category[];
  menuItems: MenuItem[];
  itemVariants: ItemVariant[];
  proteinTypes: ProteinType[];
  customizations: Customization[];
  setMeals: SetMeal[];
  // Computed lookups for O(1) access
  variantsByMenuItem: Record<string, ItemVariant[]>;
  proteinTypesById: Record<string, ProteinType>;
  menuItemsByCategory: Record<string, MenuItem[]>;
  parentCategories: Category[];
  childCategories: Category[];
  subcategories: Record<string, Category[]>;
}

/**
 * Build computed lookups from raw menu data
 */
function buildMenuLookups(data: {
  categories: Category[];
  menuItems: MenuItem[];
  itemVariants: ItemVariant[];
  proteinTypes: ProteinType[];
}): Pick<MenuBundle, 'variantsByMenuItem' | 'proteinTypesById' | 'menuItemsByCategory' | 'parentCategories' | 'childCategories' | 'subcategories'> {
  // Build variantsByMenuItem lookup
  const variantsByMenuItem: Record<string, ItemVariant[]> = {};
  data.itemVariants.forEach(variant => {
    const menuItemId = variant.menu_item_id;
    if (!variantsByMenuItem[menuItemId]) {
      variantsByMenuItem[menuItemId] = [];
    }
    variantsByMenuItem[menuItemId].push(variant);
  });
  // Sort variants by display_order within each menu item
  Object.keys(variantsByMenuItem).forEach(menuItemId => {
    variantsByMenuItem[menuItemId].sort((a, b) =>
      (a.display_order || 0) - (b.display_order || 0)
    );
  });

  // Build proteinTypesById lookup
  const proteinTypesById: Record<string, ProteinType> = {};
  data.proteinTypes.forEach(proteinType => {
    proteinTypesById[proteinType.id] = proteinType;
  });

  // Build menuItemsByCategory
  const menuItemsByCategory: Record<string, MenuItem[]> = {};
  data.menuItems.forEach(item => {
    if (!menuItemsByCategory[item.category_id]) {
      menuItemsByCategory[item.category_id] = [];
    }
    menuItemsByCategory[item.category_id].push(item);
  });

  // Build category hierarchy
  const activeCategories = data.categories.filter(cat => cat.active);
  const parentCategories = activeCategories.filter(cat => !cat.parent_category_id);
  const childCategories = activeCategories.filter(cat => cat.parent_category_id);

  const subcategories: Record<string, Category[]> = {};
  parentCategories.forEach(parent => {
    subcategories[parent.id] = activeCategories
      .filter(cat => cat.parent_category_id === parent.id)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  });

  return {
    variantsByMenuItem,
    proteinTypesById,
    menuItemsByCategory,
    parentCategories,
    childCategories,
    subcategories
  };
}

/**
 * Fetch complete menu bundle with auto-refresh.
 * This is the main hook for POS/Online menu data.
 *
 * Benefits over realtimeMenuStore:
 * - Single network request for all menu data
 * - React Query handles caching, deduplication, background refetch
 * - Context-aware filtering (admin sees all, pos/online see published only)
 * - No module-level flags or race conditions
 *
 * Usage:
 * ```ts
 * const { data: bundle, isLoading, refetch } = useMenuBundle({ context: 'pos' });
 * const { menuItems, categories, itemVariants } = bundle || {};
 * ```
 */
export function useMenuBundle(options?: {
  context?: MenuContext;
  enabled?: boolean;
}) {
  const { context = 'pos', enabled = true } = options || {};
  const publishedOnly = context !== 'admin';

  return useQuery({
    queryKey: menuKeys.posBundle(context),
    queryFn: async (): Promise<MenuBundle> => {
      await ensureSupabaseConfigured();

      // Fetch all data in parallel
      const [menuResult, proteinTypes, customizations, setMeals] = await Promise.all([
        getMenuWithOrdering({ publishedOnly }),
        fetchProteinTypesFromDB(),
        fetchCustomizationsFromDB(publishedOnly),
        fetchSetMealsFromDB(true, publishedOnly)
      ]);

      if (!menuResult.success || !menuResult.data) {
        throw new Error('Failed to fetch menu data');
      }

      const { categories, items: menuItems } = menuResult.data;

      // Extract variants from items (they come embedded in the query)
      const itemVariants: ItemVariant[] = [];
      menuItems.forEach((item: any) => {
        if (item.variants && Array.isArray(item.variants)) {
          itemVariants.push(...item.variants);
        }
      });

      // Build computed lookups
      const lookups = buildMenuLookups({
        categories: categories || [],
        menuItems: menuItems || [],
        itemVariants,
        proteinTypes: proteinTypes || []
      });

      const bundle: MenuBundle = {
        categories: categories || [],
        menuItems: menuItems || [],
        itemVariants,
        proteinTypes: proteinTypes || [],
        customizations: customizations || [],
        setMeals: setMeals || [],
        ...lookups
      };

      return bundle;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - menu data is relatively static
    gcTime: 60 * 60 * 1000, // 1 hour cache retention
    refetchOnWindowFocus: true,
    retry: 2,
    enabled
  });
}

/**
 * Hook to get filtered menu items based on search query and category selection.
 * This is a computed value derived from React Query data.
 *
 * Usage:
 * ```ts
 * const { filteredItems, isLoading } = useFilteredMenuItems({
 *   context: 'pos',
 *   searchQuery: 'chicken',
 *   selectedCategory: 'cat-123'
 * });
 * ```
 */
export function useFilteredMenuItems(options: {
  context?: MenuContext;
  searchQuery?: string;
  selectedParentCategory?: string | null;
  selectedMenuCategory?: string | null;
}) {
  const {
    context = 'pos',
    searchQuery = '',
    selectedParentCategory = null,
    selectedMenuCategory = null
  } = options;

  const { data: bundle, isLoading, error } = useMenuBundle({ context });

  // 🔧 FIX: Stabilize filteredItems reference to prevent unnecessary re-renders
  // React Query returns new bundle reference on each access, causing filteredItems
  // to be recalculated even when actual content is unchanged
  const filteredItemsRef = useRef<MenuItem[]>([]);

  const filteredItems = useMemo(() => {
    if (!bundle) return filteredItemsRef.current.length === 0 ? [] : filteredItemsRef.current;

    const { menuItems, categories, setMeals } = bundle;
    let filtered = [...menuItems];

    // Filter by category
    if (selectedParentCategory) {
      const childCategoryIds = categories
        .filter(cat => cat.parent_category_id === selectedParentCategory && cat.active)
        .map(cat => cat.id);

      if (childCategoryIds.length > 0) {
        filtered = filtered.filter(item => childCategoryIds.includes(item.category_id));
      }
    } else if (selectedMenuCategory) {
      const selectedCategory = categories.find(cat => cat.id === selectedMenuCategory);

      if (selectedCategory) {
        if (selectedCategory.id.startsWith('section-') || !selectedCategory.parent_category_id) {
          // Parent or section category - get all child items
          const childCategoryIds = categories
            .filter(cat => cat.parent_category_id === selectedMenuCategory && cat.active)
            .map(cat => cat.id);

          if (childCategoryIds.length > 0) {
            filtered = filtered.filter(item => childCategoryIds.includes(item.category_id));
          } else {
            filtered = filtered.filter(item => item.category_id === selectedMenuCategory);
          }
        } else {
          // Regular category
          filtered = filtered.filter(item => item.category_id === selectedMenuCategory);
        }
      }
    }

    // Apply fuzzy priority-based search filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();

      const getCategoryName = (item: MenuItem): string => {
        const category = categories.find(cat => cat.id === item.category_id);
        return category?.name || '';
      };

      const scoredItems = filtered.map(item => {
        const itemName = item.name.toLowerCase();
        const itemDescription = (item.menu_item_description || '').toLowerCase();
        const categoryName = getCategoryName(item).toLowerCase();

        let score = 0;

        if (itemName === query) {
          score = 1000;
        } else if (itemName.startsWith(query)) {
          score = 800;
        } else if (itemName.includes(` ${query}`) || itemName.includes(query)) {
          score = 600;
        } else if (categoryName.includes(query)) {
          score = 400;
        } else if (itemDescription.includes(query)) {
          score = 200;
        }

        return { item, score };
      });

      filtered = scoredItems
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ item }) => item);
    }

    // Convert set meals to menu item format and add to results
    const setMealsCategory = categories.find(cat => cat.name === 'SET MEALS');
    const setMealsCategoryId = setMealsCategory?.id || 'set-meals-category';

    const setMealItems: MenuItem[] = setMeals
      .filter(setMeal => setMeal.active)
      .map(setMeal => ({
        id: setMeal.id,
        name: setMeal.name,
        menu_item_description: setMeal.description || null,
        image_url: setMeal.hero_image_url || null,
        spice_indicators: null,
        category_id: setMealsCategoryId,
        featured: false,
        dietary_tags: null,
        item_code: setMeal.code,
        menu_order: 999,
        active: setMeal.active,
        inherit_category_print_settings: false,
        price: setMeal.set_price,
        set_meal_data: {
          individual_items_total: (setMeal as any).individual_items_total,
          savings: (setMeal as any).savings,
          items: (setMeal as any).items
        },
        item_type: 'set_meal' as const
      } as unknown as MenuItem));

    const result = [...filtered, ...setMealItems];

    // 🔧 FIX: Compare by IDs to maintain stable reference when content is unchanged
    // This prevents unnecessary re-renders of menu components
    const idsMatch = result.length === filteredItemsRef.current.length &&
      result.every((item, i) => item.id === filteredItemsRef.current[i]?.id);

    if (idsMatch) {
      return filteredItemsRef.current; // Return stable reference
    }

    filteredItemsRef.current = result;
    return result;
  }, [bundle, searchQuery, selectedParentCategory, selectedMenuCategory]);

  return {
    filteredItems,
    isLoading,
    error,
    bundle
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Manually invalidate all menu-related queries.
 * Useful for force refresh scenarios (e.g., after menu publish).
 * 
 * Usage:
 * ```ts
 * const queryClient = useQueryClient();
 * invalidateAllMenuData(queryClient);
 * ```
 */
export function invalidateAllMenuData(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: menuKeys.all });
}

/**
 * Check for menu publish events and refresh if needed.
 * Replaces: checkForRefreshEvents() from useMenuData
 * 
 * This can be called manually or via useEffect polling (temporarily)
 * until we implement Supabase real-time subscriptions.
 */
export async function checkForMenuPublishEvents(queryClient: ReturnType<typeof useQueryClient>): Promise<boolean> {
  try {
    const response = await (brain as any).get_storage_item({ key: 'menu_refresh_event' });
    const eventData = await response.json();
    
    if (eventData?.data?.event_type === 'menu_published') {
      const lastCheckKey = 'last_menu_refresh_check';
      const lastCheck = localStorage.getItem(lastCheckKey);
      const eventTimestamp = eventData.data.timestamp;
      
      // Only refresh if this is a new event
      if (!lastCheck || eventTimestamp > lastCheck) {
        invalidateAllMenuData(queryClient);
        localStorage.setItem(lastCheckKey, eventTimestamp);
        toast.success('Menu updated! Refreshing data...');

        return true;
      }
    }
    return false;
  } catch (error) {
    console.debug('No refresh events detected (this is normal)');
    return false;
  }
}
