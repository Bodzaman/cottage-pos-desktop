/**
 * Realtime Menu Store Compatibility Layer
 *
 * Drop-in replacement for useRealtimeMenuStore during migration to React Query.
 * Returns the same API surface but powered by React Query under the hood.
 *
 * Benefits:
 * - Same API as original store - no changes needed in consuming components
 * - React Query handles caching, deduplication, stale-while-revalidate
 * - No module-level flags or race conditions
 * - Context-aware data filtering built-in
 *
 * Migration pattern:
 * ```ts
 * // BEFORE
 * import { useRealtimeMenuStore, setMenuStoreContext } from 'utils/realtimeMenuStore';
 * function POSDesktop() {
 *   useEffect(() => { setMenuStoreContext('pos'); }, []);
 *   const { menuItems, categories, isLoading } = useRealtimeMenuStore();
 * }
 *
 * // AFTER
 * import { useRealtimeMenuStoreCompat } from 'utils/realtimeMenuStoreCompat';
 * function POSDesktop() {
 *   const { menuItems, categories, isLoading } = useRealtimeMenuStoreCompat({ context: 'pos' });
 * }
 * ```
 */

import { useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useMenuBundle,
  useFilteredMenuItems,
  menuKeys,
  MenuContext,
  MenuBundle
} from './menuQueries';
import { useMenuUIStore } from './menuUIStore';
import { useMenuRealtimeSync } from './menuRealtimeSync';
import type {
  Category,
  MenuItem,
  ItemVariant,
  ProteinType,
  CustomizationBase,
  SetMeal,
  OrderItem
} from './menuTypes';
import type { TableData } from './tableTypes';

/**
 * Compatibility interface matching the original useRealtimeMenuStore API
 */
export interface MenuStoreCompatState {
  // Data state
  categories: Category[];
  menuItems: MenuItem[];
  setMeals: SetMeal[];
  proteinTypes: ProteinType[];
  customizations: CustomizationBase[];
  itemVariants: ItemVariant[];

  // Pre-computed lookup tables
  variantsByMenuItem: Record<string, ItemVariant[]>;
  proteinTypesById: Record<string, ProteinType>;
  menuItemsByCategory: Record<string, MenuItem[]>;

  // Category hierarchy
  parentCategories: Category[];
  childCategories: Category[];
  subcategories: Record<string, Category[]>;

  // Loading states
  isLoading: boolean;
  isConnected: boolean;
  lastUpdate: number;
  error: string | null;

  // Filtering state
  selectedParentCategory: string | null;
  selectedMenuCategory: string | null;
  searchQuery: string;
  filteredMenuItems: MenuItem[];

  // FlexibleBillingModal state
  flexibleBillingModal: {
    isOpen: boolean;
    orderItems: OrderItem[];
    linkedTables: TableData[];
    primaryTableNumber: number;
    splitMode: 'equal' | 'custom' | 'by-item';
  };

  // AI Context state
  aiContextLastUpdate: number;
  aiContextStatus: 'idle' | 'loading' | 'ready' | 'error';

  // Actions
  initialize: () => Promise<void>;
  refreshData: () => Promise<void>;
  forceFullRefresh: () => Promise<void>;
  invalidateCache: () => void;

  // Filtering actions
  setSelectedParentCategory: (categoryId: string | null) => void;
  setSelectedMenuCategory: (categoryId: string | null) => void;
  setSearchQuery: (query: string) => void;

  // FlexibleBillingModal actions
  openFlexibleBillingModal: (orderItems: OrderItem[], linkedTables: TableData[], primaryTableNumber: number) => void;
  closeFlexibleBillingModal: () => void;
  setFlexibleBillingMode: (mode: 'equal' | 'custom' | 'by-item') => void;
  updateFlexibleBillingItems: (items: OrderItem[]) => void;

  // Customization helpers
  getWebsiteCustomizations: () => CustomizationBase[];
  getCustomizationsByGroup: () => Record<string, CustomizationBase[]>;
}

/**
 * Hook that provides the same API as useRealtimeMenuStore but powered by React Query.
 *
 * This is a drop-in replacement for gradual migration.
 *
 * @param options.context - Menu context ('admin' | 'pos' | 'online')
 * @param options.enableRealtime - Whether to enable Supabase realtime subscriptions (default: true)
 */
export function useRealtimeMenuStoreCompat(options: {
  context?: MenuContext;
  enableRealtime?: boolean;
} = {}): MenuStoreCompatState {
  const { context = 'pos', enableRealtime = true } = options;
  const queryClient = useQueryClient();

  // React Query data
  const {
    data: bundle,
    isLoading: isQueryLoading,
    error: queryError,
    refetch,
    dataUpdatedAt
  } = useMenuBundle({ context });

  // UI state from thin Zustand store
  const {
    selectedParentCategory,
    selectedMenuCategory,
    searchQuery,
    setSelectedParentCategory,
    setSelectedMenuCategory,
    setSearchQuery,
    flexibleBillingModal,
    openFlexibleBillingModal,
    closeFlexibleBillingModal,
    setFlexibleBillingMode,
    updateFlexibleBillingItems,
    aiContextStatus,
    setAIContextStatus
  } = useMenuUIStore();

  // Computed filtered items using React Query data
  const { filteredItems } = useFilteredMenuItems({
    context,
    searchQuery,
    selectedParentCategory,
    selectedMenuCategory
  });

  // Realtime subscriptions (invalidate React Query cache on changes)
  useMenuRealtimeSync({ context, enabled: enableRealtime });

  // Memoized actions
  const initialize = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const refreshData = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const forceFullRefresh = useCallback(async () => {
    // Invalidate all menu queries to force fresh data
    queryClient.invalidateQueries({ queryKey: menuKeys.all });
    await refetch();
  }, [queryClient, refetch]);

  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: menuKeys.posBundle(context) });
  }, [queryClient, context]);

  // Customization helpers
  const getWebsiteCustomizations = useCallback(() => {
    if (!bundle) return [];
    return bundle.customizations.filter(
      customization => customization.is_active && customization.show_on_website
    );
  }, [bundle]);

  const getCustomizationsByGroup = useCallback(() => {
    if (!bundle) return {};
    const customizationsByGroup: Record<string, CustomizationBase[]> = {};

    bundle.customizations.forEach(customization => {
      if (customization.is_active && customization.show_on_website) {
        const group = customization.customization_group || 'Other';
        if (!customizationsByGroup[group]) {
          customizationsByGroup[group] = [];
        }
        customizationsByGroup[group].push(customization);
      }
    });

    return customizationsByGroup;
  }, [bundle]);

  // Build the compat state object
  const compatState = useMemo<MenuStoreCompatState>(() => ({
    // Data state - from React Query
    categories: bundle?.categories || [],
    menuItems: bundle?.menuItems || [],
    setMeals: bundle?.setMeals || [],
    proteinTypes: bundle?.proteinTypes || [],
    customizations: bundle?.customizations || [],
    itemVariants: bundle?.itemVariants || [],

    // Pre-computed lookups - from React Query bundle
    variantsByMenuItem: bundle?.variantsByMenuItem || {},
    proteinTypesById: bundle?.proteinTypesById || {},
    menuItemsByCategory: bundle?.menuItemsByCategory || {},

    // Category hierarchy - from React Query bundle
    parentCategories: bundle?.parentCategories || [],
    childCategories: bundle?.childCategories || [],
    subcategories: bundle?.subcategories || {},

    // Loading states
    isLoading: isQueryLoading,
    isConnected: !queryError && !isQueryLoading,
    lastUpdate: dataUpdatedAt || 0,
    error: queryError?.message || null,

    // Filtering state - from Zustand UI store
    selectedParentCategory,
    selectedMenuCategory,
    searchQuery,
    filteredMenuItems: filteredItems,

    // FlexibleBillingModal - from Zustand UI store
    flexibleBillingModal,

    // AI Context state
    aiContextLastUpdate: dataUpdatedAt || 0,
    aiContextStatus,

    // Actions
    initialize,
    refreshData,
    forceFullRefresh,
    invalidateCache,

    // Filtering actions - from Zustand UI store
    setSelectedParentCategory,
    setSelectedMenuCategory,
    setSearchQuery,

    // FlexibleBillingModal actions - from Zustand UI store
    openFlexibleBillingModal,
    closeFlexibleBillingModal,
    setFlexibleBillingMode,
    updateFlexibleBillingItems,

    // Customization helpers
    getWebsiteCustomizations,
    getCustomizationsByGroup
  }), [
    bundle,
    isQueryLoading,
    queryError,
    dataUpdatedAt,
    selectedParentCategory,
    selectedMenuCategory,
    searchQuery,
    filteredItems,
    flexibleBillingModal,
    aiContextStatus,
    initialize,
    refreshData,
    forceFullRefresh,
    invalidateCache,
    setSelectedParentCategory,
    setSelectedMenuCategory,
    setSearchQuery,
    openFlexibleBillingModal,
    closeFlexibleBillingModal,
    setFlexibleBillingMode,
    updateFlexibleBillingItems,
    getWebsiteCustomizations,
    getCustomizationsByGroup
  ]);

  return compatState;
}

/**
 * Helper to get menu data imperatively (for non-React contexts).
 * This reads from React Query cache if available.
 */
export function getMenuDataFromCache(queryClient: ReturnType<typeof useQueryClient>, context: MenuContext = 'pos'): Partial<MenuBundle> {
  const cached = queryClient.getQueryData<MenuBundle>(menuKeys.posBundle(context));
  return cached || {};
}

/**
 * Helper functions for backwards compatibility with getMenuDataForPOS pattern
 */
export function useMenuDataForPOS() {
  const store = useRealtimeMenuStoreCompat({ context: 'pos' });

  return {
    categories: store.categories,
    menuItems: store.menuItems,
    parentCategories: store.parentCategories,
    childCategories: store.childCategories,
    subcategories: store.subcategories,
    menuItemsByCategory: store.menuItemsByCategory,
    proteinTypes: store.proteinTypes,
    customizations: store.customizations,
    itemVariants: store.itemVariants,
    isLoading: store.isLoading,
    isConnected: store.isConnected,
    lastUpdate: store.lastUpdate,
    error: store.error
  };
}
