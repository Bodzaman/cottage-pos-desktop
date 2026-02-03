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

import { useMemo, useCallback, useRef } from 'react';
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
  Customization,
  SetMeal,
  OrderItem
} from './types';
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
  customizations: Customization[];
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
  getWebsiteCustomizations: () => Customization[];
  getCustomizationsByGroup: () => Record<string, Customization[]>;
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

  // 🔧 FIX: Store dataUpdatedAt in a ref to prevent unnecessary re-renders
  // dataUpdatedAt changes on every React Query access, even when data is unchanged
  // Using a ref allows us to access the latest value without triggering useMemo recalculation
  const dataUpdatedAtRef = useRef(dataUpdatedAt);
  dataUpdatedAtRef.current = dataUpdatedAt;

  // 🔧 FIX: Store refetch in a ref to make callbacks stable
  // refetch from React Query changes reference on every render, causing callbacks
  // that depend on it to change, which causes compatState to be recreated
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  // 🔧 FIX: Store bundle in a ref for customization helpers
  // This allows getWebsiteCustomizations and getCustomizationsByGroup to be stable
  const bundleRef = useRef(bundle);
  bundleRef.current = bundle;

  // 🔧 FIX: Stabilize bundle arrays - only update refs when content actually changes
  // This prevents re-renders when React Query returns new references for identical data
  const stableCategoriesRef = useRef(bundle?.categories || []);
  const stableMenuItemsRef = useRef(bundle?.menuItems || []);
  const stableParentCategoriesRef = useRef(bundle?.parentCategories || []);
  const stableChildCategoriesRef = useRef(bundle?.childCategories || []);

  // Helper to check if array content changed (by length and first/last id)
  const arrayContentChanged = <T extends { id?: string }>(
    newArr: T[] | undefined,
    oldArr: T[]
  ): boolean => {
    const arr = newArr || [];
    if (arr.length !== oldArr.length) return true;
    if (arr.length === 0) return false;
    return arr[0]?.id !== oldArr[0]?.id || arr[arr.length - 1]?.id !== oldArr[oldArr.length - 1]?.id;
  };

  // Update stable refs only when content changes
  if (arrayContentChanged(bundle?.categories, stableCategoriesRef.current)) {
    stableCategoriesRef.current = bundle?.categories || [];
  }
  if (arrayContentChanged(bundle?.menuItems, stableMenuItemsRef.current)) {
    stableMenuItemsRef.current = bundle?.menuItems || [];
  }
  if (arrayContentChanged(bundle?.parentCategories, stableParentCategoriesRef.current)) {
    stableParentCategoriesRef.current = bundle?.parentCategories || [];
  }
  if (arrayContentChanged(bundle?.childCategories, stableChildCategoriesRef.current)) {
    stableChildCategoriesRef.current = bundle?.childCategories || [];
  }

  // Memoized actions - using refs for stable callbacks
  const initialize = useCallback(async () => {
    await refetchRef.current();
  }, []);  // 🔧 FIX: Empty deps - uses ref for stable callback

  const refreshData = useCallback(async () => {
    await refetchRef.current();
  }, []);  // 🔧 FIX: Empty deps - uses ref for stable callback

  const forceFullRefresh = useCallback(async () => {
    // Invalidate all menu queries to force fresh data
    queryClient.invalidateQueries({ queryKey: menuKeys.all });
    await refetchRef.current();
  }, [queryClient]);  // 🔧 FIX: queryClient is stable from React Query

  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: menuKeys.posBundle(context) });
  }, [queryClient, context]);

  // Customization helpers - using refs for stable callbacks
  const getWebsiteCustomizations = useCallback(() => {
    if (!bundleRef.current) return [];
    return bundleRef.current.customizations.filter(
      customization => customization.is_active && customization.show_on_website
    );
  }, []);  // 🔧 FIX: Empty deps - uses ref for stable callback

  const getCustomizationsByGroup = useCallback(() => {
    if (!bundleRef.current) return {};
    const customizationsByGroup: Record<string, Customization[]> = {};

    bundleRef.current.customizations.forEach(customization => {
      if (customization.is_active && customization.show_on_website) {
        const group = customization.customization_group || 'Other';
        if (!customizationsByGroup[group]) {
          customizationsByGroup[group] = [];
        }
        customizationsByGroup[group].push(customization);
      }
    });

    return customizationsByGroup;
  }, []);  // 🔧 FIX: Empty deps - uses ref for stable callback

  // Build the compat state object
  const compatState = useMemo<MenuStoreCompatState>(() => ({
    // Data state - using stable refs for frequently-accessed arrays
    categories: stableCategoriesRef.current,
    menuItems: stableMenuItemsRef.current,
    setMeals: bundle?.setMeals || [],
    proteinTypes: bundle?.proteinTypes || [],
    customizations: bundle?.customizations || [],
    itemVariants: bundle?.itemVariants || [],

    // Pre-computed lookups - from React Query bundle
    variantsByMenuItem: bundle?.variantsByMenuItem || {},
    proteinTypesById: bundle?.proteinTypesById || {},
    menuItemsByCategory: bundle?.menuItemsByCategory || {},

    // Category hierarchy - using stable refs
    parentCategories: stableParentCategoriesRef.current,
    childCategories: stableChildCategoriesRef.current,
    subcategories: bundle?.subcategories || {},

    // Loading states
    isLoading: isQueryLoading,
    isConnected: !queryError && !isQueryLoading,
    lastUpdate: dataUpdatedAtRef.current || 0,  // 🔧 FIX: Use ref to avoid dependency
    error: queryError?.message || null,

    // Filtering state - from Zustand UI store
    selectedParentCategory,
    selectedMenuCategory,
    searchQuery,
    filteredMenuItems: filteredItems,

    // FlexibleBillingModal - from Zustand UI store
    flexibleBillingModal,

    // AI Context state
    aiContextLastUpdate: dataUpdatedAtRef.current || 0,  // 🔧 FIX: Use ref to avoid dependency
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
    // 🔧 FIX: Removed dataUpdatedAt - it changes on every query access causing unnecessary re-renders
    // The timestamp is accessed via dataUpdatedAtRef.current instead
    selectedParentCategory,
    selectedMenuCategory,
    searchQuery,
    filteredItems,
    flexibleBillingModal,
    aiContextStatus,
    // 🔧 FIX: Removed unstable callbacks from dependencies
    // These callbacks now use refs internally, so they're stable and don't need to be deps:
    // - initialize (uses refetchRef)
    // - refreshData (uses refetchRef)
    // - forceFullRefresh (uses refetchRef)
    // - getWebsiteCustomizations (uses bundleRef)
    // - getCustomizationsByGroup (uses bundleRef)
    invalidateCache,  // Kept: depends on stable queryClient and context prop
    // Zustand actions are stable by default
    setSelectedParentCategory,
    setSelectedMenuCategory,
    setSearchQuery,
    openFlexibleBillingModal,
    closeFlexibleBillingModal,
    setFlexibleBillingMode,
    updateFlexibleBillingItems
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
