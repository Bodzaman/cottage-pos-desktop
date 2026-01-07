import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from 'app';
import { supabase, ensureSupabaseConfigured } from './supabaseClient';
import { toast } from 'sonner';
import type { 
  Category, 
  MenuItem, 
  ProteinType, 
  ItemVariant, 
  CustomizationBase 
} from './menuTypes';

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
  categories: () => [...menuKeys.all, 'categories'] as const,
  menuItems: () => [...menuKeys.all, 'items'] as const,
  menuItemsByCategory: (categoryId: string) => [...menuKeys.menuItems(), 'by-category', categoryId] as const,
  proteinTypes: () => [...menuKeys.all, 'proteins'] as const,
  itemVariants: () => [...menuKeys.all, 'variants'] as const,
  customizations: () => [...menuKeys.all, 'customizations'] as const,
  completeMenu: () => [...menuKeys.all, 'complete'] as const,
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
  console.log('🔄 [React Query] Fetching categories...');
  // Database has sort_order, not display_order
  const res = await supabase
    .from('menu_categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (res.error) {
    // 42703: undefined_column
    const msg = res.error.message || '';
    const code = (res.error as any).code;
    if (code === '42703' || msg.includes('sort_order')) {
      console.warn('⚠️ [React Query] sort_order missing on menu_categories. Falling back to name ordering.');
      const fallback = await supabase
        .from('menu_categories')
        .select('*')
        .order('name', { ascending: true });
      if (fallback.error) throw new Error(`Failed to fetch categories (fallback): ${fallback.error.message}`);
      console.log('✅ [React Query] Categories fetched (fallback by name):', fallback.data?.length || 0);
      // Map database columns to TypeScript interface
      return (fallback.data || []).map((cat: any) => ({
        ...cat,
        display_order: cat.sort_order ?? cat.display_order ?? 999,
        active: cat.is_active ?? cat.active ?? true,
      }));
    }
    throw new Error(`Failed to fetch categories: ${res.error.message}`);
  }

  console.log('✅ [React Query] Categories fetched:', res.data?.length || 0);
  // Map database columns to TypeScript interface
  return (res.data || []).map((cat: any) => ({
    ...cat,
    display_order: cat.sort_order ?? cat.display_order ?? 999,
    active: cat.is_active ?? cat.active ?? true,
  }));
}

async function fetchProteinTypesOrdered(): Promise<ProteinType[]> {
  await ensureSupabaseConfigured();
  console.log('🔄 [React Query] Fetching protein types...');
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
      console.log('✅ [React Query] Protein types fetched (fallback by name):', fallback.data?.length || 0);
      return fallback.data || [];
    }
    throw new Error(`Failed to fetch protein types: ${res.error.message}`);
  }

  console.log('✅ [React Query] Protein types fetched:', res.data?.length || 0);
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
export function useCategories(options?: UseQueryOptions<Category[]>) {
  return useQuery({
    queryKey: menuKeys.categories(),
    queryFn: async () => {
      return await fetchCategoriesOrdered();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (more aggressive than old 5min TTL)
    gcTime: 10 * 60 * 1000, // 10 minutes cache time (formerly cacheTime)
    refetchOnWindowFocus: true, // Replaces polling
    retry: 2, // Production safety
    ...options,
  });
}

/**
 * Fetch all menu items with auto-refresh.
 * Replaces: fetchMenuItems() from useMenuData
 */
export function useMenuItems(options?: UseQueryOptions<MenuItem[]>) {
  return useQuery({
    queryKey: menuKeys.menuItems(),
    queryFn: async () => {
      console.log('🔄 [React Query] Fetching menu items...');
      
      const response = await apiClient.get_menu_items();
      const raw = await response.json();
      const items = normalizeMenuItemsResponse(raw);
      
      console.log('✅ [React Query] Menu items fetched:', items.length);
      return items;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
  options?: UseQueryOptions<MenuItem[]>
) {
  return useQuery({
    queryKey: menuKeys.menuItemsByCategory(categoryId),
    queryFn: async () => {
      console.log(`🔄 [React Query] Fetching items for category: ${categoryId}`);
      
      const response = await apiClient.get_menu_items();
      const raw = await response.json();
      const allItems = normalizeMenuItemsResponse(raw);
      const filtered = allItems.filter((item: MenuItem) => item.category_id === categoryId);
      
      console.log(`✅ [React Query] Category items fetched: ${filtered.length}`);
      return filtered;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
export function useProteinTypes(options?: UseQueryOptions<ProteinType[]>) {
  return useQuery({
    queryKey: menuKeys.proteinTypes(),
    queryFn: async () => {
      return await fetchProteinTypesOrdered();
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
    ...options,
  });
}

/**
 * Fetch item variants with auto-refresh.
 * Replaces: fetchItemVariants() from useMenuData
 */
export function useItemVariants(options?: UseQueryOptions<ItemVariant[]>) {
  return useQuery({
    queryKey: menuKeys.itemVariants(),
    queryFn: async () => {
      console.log('🔄 [React Query] Fetching item variants...');
      await ensureSupabaseConfigured();
      
      const { data, error } = await supabase
        .from('menu_item_variants')
        .select(`
          *,
          protein_type:menu_protein_types(name)
        `);
      
      if (error) {
        console.error('❌ [React Query] Item variants fetch failed:', error);
        throw new Error(`Failed to fetch item variants: ${error.message}`);
      }
      
      // Map protein_type.name to protein_type_name for backward compatibility
      const mapped = data?.map(variant => ({
        ...variant,
        protein_type_name: variant.protein_type?.name || null,
      })) || [];
      
      console.log('✅ [React Query] Item variants fetched:', mapped.length);
      return mapped;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
    ...options,
  });
}

/**
 * Fetch customizations with auto-refresh.
 * Replaces: fetchCustomizations() from useMenuData
 */
export function useCustomizations(options?: UseQueryOptions<CustomizationBase[]>) {
  return useQuery({
    queryKey: menuKeys.customizations(),
    queryFn: async () => {
      console.log('🔄 [React Query] Fetching customizations...');
      
      const response = await apiClient.get_customizations();
      const data = await response.json();
      
      console.log('✅ [React Query] Customizations fetched:', data?.length || 0);
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
    ...options,
  });
}

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
  customizations: CustomizationBase[];
}>) {
  return useQuery({
    queryKey: menuKeys.completeMenu(),
    queryFn: async () => {
      console.log('🔄 [React Query] Fetching complete menu data...');
      await ensureSupabaseConfigured();
      
      // Fetch all data in parallel, using helpers that handle fallbacks
      const [categories, itemsRes, proteinTypes, variantsRes, customizationsRes] = await Promise.all([
        fetchCategoriesOrdered(),
        apiClient.get_menu_items(),
        fetchProteinTypesOrdered(),
        supabase.from('menu_item_variants').select(`
          *,
          protein_type:menu_protein_types(name)
        `),
        apiClient.get_customizations(),
      ]);
      
      // Handle variant errors
      if (variantsRes.error) throw new Error(`Variants: ${variantsRes.error.message}`);
      
      // Parse brain responses
      const menuItemsRaw = await itemsRes.json();
      const customizations = await customizationsRes.json();
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
      
      console.log('✅ [React Query] Complete menu data fetched:', {
        categories: result.categories.length,
        items: result.menuItems.length,
        proteins: result.proteinTypes.length,
        variants: result.itemVariants.length,
        customizations: result.customizations.length,
      });
      
      return result;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
      console.log('➕ [React Query] Creating menu item...');
      const response = await apiClient.create_menu_item(newItem as any);
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate affected queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: menuKeys.menuItems() });
      queryClient.invalidateQueries({ queryKey: menuKeys.completeMenu() });
      console.log('✅ [React Query] Menu item created, cache invalidated');
    },
    onError: (error) => {
      console.error('❌ [React Query] Create menu item failed:', error);
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
      console.log(`🔄 [React Query] Updating menu item: ${id}`);
      const response = await apiClient.update_menu_item({ menu_item_id: id, ...data } as any);
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.menuItems() });
      queryClient.invalidateQueries({ queryKey: menuKeys.completeMenu() });
      console.log('✅ [React Query] Menu item updated, cache invalidated');
    },
    onError: (error) => {
      console.error('❌ [React Query] Update menu item failed:', error);
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
      console.log(`🗑️ [React Query] Deleting menu item: ${id}`);
      const response = await apiClient.delete_menu_item({ menu_item_id: id });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.menuItems() });
      queryClient.invalidateQueries({ queryKey: menuKeys.completeMenu() });
      console.log('✅ [React Query] Menu item deleted, cache invalidated');
    },
    onError: (error) => {
      console.error('❌ [React Query] Delete menu item failed:', error);
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
      console.log('💾 [React Query] Upserting category...');
      
      const { error } = await supabase
        .from('menu_categories')
        .upsert(category as any);
      
      if (error) throw error;
      return category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() });
      queryClient.invalidateQueries({ queryKey: menuKeys.completeMenu() });
      console.log('✅ [React Query] Category upserted, cache invalidated');
    },
    onError: (error) => {
      console.error('❌ [React Query] Upsert category failed:', error);
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
      console.log(`🗑️ [React Query] Deleting category: ${id}`);
      
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() });
      queryClient.invalidateQueries({ queryKey: menuKeys.completeMenu() });
      console.log('✅ [React Query] Category deleted, cache invalidated');
    },
    onError: (error) => {
      console.error('❌ [React Query] Delete category failed:', error);
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
      console.log('💾 [React Query] Upserting protein type...');
      
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
      console.log('✅ [React Query] Protein type upserted, cache invalidated');
    },
    onError: (error) => {
      console.error('❌ [React Query] Upsert protein type failed:', error);
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
      console.log(`🗑️ [React Query] Deleting protein type: ${id}`);
      
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
      console.log('✅ [React Query] Protein type deleted, cache invalidated');
    },
    onError: (error) => {
      console.error('❌ [React Query] Delete protein type failed:', error);
      toast.error('Failed to delete protein type');
    },
  });
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
  console.log('🔄 [React Query] Invalidating ALL menu data...');
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
    const response = await apiClient.get_storage_item({ key: 'menu_refresh_event' });
    const eventData = await response.json();
    
    if (eventData?.data?.event_type === 'menu_published') {
      const lastCheckKey = 'last_menu_refresh_check';
      const lastCheck = localStorage.getItem(lastCheckKey);
      const eventTimestamp = eventData.data.timestamp;
      
      // Only refresh if this is a new event
      if (!lastCheck || eventTimestamp > lastCheck) {
        console.log('🔄 [React Query] Detected menu publish event, refreshing...', {
          eventId: eventData.data.trigger_id,
          timestamp: eventTimestamp
        });
        
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
