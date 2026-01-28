/**
 * Real-time Menu Store - Unified source of truth for menu data
 * 
 * This store provides real-time synchronization between AdminMenu and POS
 * by subscribing to Supabase real-time changes and maintaining a unified
 * data structure for all menu-related components.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, ensureSupabaseConfigured } from './supabaseClient';
import { Category, MenuItem, ItemVariant, ProteinType, CustomizationBase, SetMeal } from './menuTypes';
import { OrderItem } from './menuTypes';
import { TableData } from './tableTypes';
import { toast } from 'sonner';
// Direct Supabase queries - replaces brain API calls
import {
  getMenuWithOrdering,
  getProteinTypes as fetchProteinTypes,
  getCustomizations as fetchCustomizations,
  getSetMeals,
  getPOSBundle,
  getItemDetails,
  getCategoryItems
} from './supabaseQueries';
import { aiContextManager, invalidateMenuContext } from './aiContextManager';
import { FIXED_SECTIONS, mapCategoryToSection } from './sectionMapping';
import { requestCoordinator } from './requestCoordinator';
import { networkMonitor } from './networkMonitor';

// Development mode flag
const isDev = import.meta.env?.DEV;

// ✅ UPDATED: Preserve variant_name from backend (which has name_pattern applied)
// Only generate a fallback display name if no variant_name exists
function transformVariantName(variant: any, proteinTypes: ProteinType[]): any {
  // PRESERVE: If variant_name exists from backend, keep it as-is
  // The backend applies the name_pattern (prefix/suffix/infix/custom) when generating variant_name
  if (variant.variant_name && variant.variant_name.trim()) {
    // Ensure we also have protein_type_name for display purposes
    if (!variant.protein_type_name && variant.protein_type_id) {
      const proteinType = proteinTypes.find(pt => pt.id === variant.protein_type_id);
      if (proteinType) {
        return {
          ...variant,
          protein_type_name: proteinType.name
        };
      }
    }
    return variant;
  }

  // FALLBACK: Only generate protein name if no variant_name provided (legacy data)
  let proteinTypeName = variant.protein_type_name;

  // If we don't have protein_type_name, look it up
  if (!proteinTypeName && variant.protein_type_id) {
    const proteinType = proteinTypes.find(pt => pt.id === variant.protein_type_id);
    proteinTypeName = proteinType?.name || null;
  }

  if (proteinTypeName) {
    // Convert to Title Case: "CHICKEN" -> "Chicken" (only for fallback display)
    const titleCaseName = proteinTypeName.charAt(0).toUpperCase() + proteinTypeName.slice(1).toLowerCase();

    return {
      ...variant,
      variant_name: titleCaseName, // Fallback: just the protein name
      protein_type_name: proteinTypeName
    };
  }

  return variant;
}

// FlexibleBillingModal types
export interface BillingOption {
  type: 'combined' | 'separate' | 'selective';
  tableNumbers?: number[];
  items: OrderItem[];
  total: number;
  selectedItems?: OrderItem[];
}

interface FlexibleBillingModalState {
  isOpen: boolean;
  orderItems: OrderItem[];
  linkedTables: TableData[];
  primaryTableNumber: number;
  splitMode: 'equal' | 'custom' | 'by-item';
}

interface MenuStoreState {
  // Data state
  categories: Category[];
  menuItems: MenuItem[];
  setMeals: SetMeal[];
  proteinTypes: ProteinType[];
  customizations: CustomizationBase[];
  itemVariants: ItemVariant[];
  
  // 🚀 NEW: Pre-computed lookup tables for O(1) access
  variantsByMenuItem: Record<string, ItemVariant[]>; // Indexed by menu_item_id
  proteinTypesById: Record<string, ProteinType>;     // Indexed by protein_type_id
  
  // Loading states
  isLoading: boolean;
  isConnected: boolean;
  lastUpdate: number;
  lastFetched?: number; // ✅ NEW: Track when data was fetched for cache invalidation
  error: string | null;
  
  // Computed data (derived from raw data)
  menuItemsByCategory: Record<string, MenuItem[]>;
  parentCategories: Category[];
  childCategories: Category[];
  subcategories: Record<string, Category[]>;
  
  // Filtering state and computed filtered data
  selectedParentCategory: string | null;
  selectedMenuCategory: string | null;
  searchQuery: string;
  filteredMenuItems: MenuItem[]; // This will now include Set Meals converted to MenuItem format
  
  // FlexibleBillingModal state
  flexibleBillingModal: FlexibleBillingModalState;
  
  // AI Context state
  aiContextLastUpdate: number;
  aiContextStatus: 'idle' | 'loading' | 'ready' | 'error';
  
  // Actions
  initialize: () => Promise<void>;
  refreshData: () => Promise<void>;
  fetchSupplementaryData: () => Promise<void>;
  fallbackRefreshData: () => Promise<void>;
  subscribeToChanges: () => void;
  unsubscribeFromChanges: () => void;
  triggerCorpusSync: () => Promise<void>;
  forceFullRefresh: () => Promise<void>; // Add force refresh method
  invalidateCache: () => void; // ✅ NEW: Manual cache invalidation
  
  // 🚀 NEW: Subscribe to specific category for selective data loading
  subscribeToCategory: (categoryId: string | null) => void;
  
  // NEW: Bundle-specific initialization without real-time subscriptions
  initializeDataOnly: () => Promise<void>;
  startRealtimeSubscriptions: () => void;
  
  // AI Context actions
  refreshAIContext: () => Promise<void>;
  getAIMenuContext: (options?: any) => Promise<any>;
  validateAIMenuItem: (query: string, categoryFilter?: string) => Promise<any>;
  invalidateAIContext: () => void;
  
  // Filtering actions
  setSelectedParentCategory: (categoryId: string | null) => void;
  setSelectedMenuCategory: (categoryId: string | null) => void;
  setSearchQuery: (query: string) => void;
  updateFilteredItems: () => void;
  
  // FlexibleBillingModal actions
  openFlexibleBillingModal: (orderItems: OrderItem[], linkedTables: TableData[], primaryTableNumber: number) => void;
  closeFlexibleBillingModal: () => void;
  setFlexibleBillingMode: (mode: 'equal' | 'custom' | 'by-item') => void;
  updateFlexibleBillingItems: (items: OrderItem[]) => void;
  
  // Internal state updates
  setCategories: (categories: Category[]) => void;
  setMenuItems: (items: MenuItem[]) => void;
  setSetMeals: (setMeals: SetMeal[]) => void; // Add Set Meals setter
  fetchSetMeals: () => Promise<void>; // Fetch Set Meals from backend
  setProteinTypes: (types: ProteinType[]) => void;
  setCustomizations: (customizations: CustomizationBase[]) => void;
  setItemVariants: (variants: ItemVariant[]) => void;
  updateDerivedData: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setConnected: (connected: boolean) => void;

  // Helper functions
  convertSetMealsToMenuItems: () => MenuItem[];
  
  // 🚀 NEW: Compute lookup tables
  computeLookups: () => void;

  // NEW: Customization helper methods
  getWebsiteCustomizations: () => CustomizationBase[];
  getCustomizationsByGroup: () => Record<string, CustomizationBase[]>;
}

// 🎯 DRAFT/PUBLISH WORKFLOW: Store context determines data filtering
// - 'admin': Shows ALL items (draft + published) for editing
// - 'pos': Shows only PUBLISHED items for ordering
// - 'online': Shows only PUBLISHED items for customer-facing menu
export type MenuStoreContext = 'admin' | 'pos' | 'online';

// Module-level context (set once per page load)
let currentStoreContext: MenuStoreContext = 'admin'; // Default to admin (shows all)

/**
 * Set the store context for this session
 * Call this BEFORE initializing the store (e.g., in page component useEffect)
 *
 * 🎯 DRAFT/PUBLISH WORKFLOW: When context changes, we need to force a refresh
 * to ensure the correct data (published vs all) is loaded
 */
export function setMenuStoreContext(context: MenuStoreContext) {
  const previousContext = currentStoreContext;
  currentStoreContext = context;
  console.log(`🎯 [RealtimeMenuStore] Context set to: ${context}`);

  // 🎯 DRAFT/PUBLISH FIX: Clear cache when switching contexts to prevent draft items leaking
  // This is critical when switching from admin (sees all items) to pos/online (published only)
  if (previousContext !== null && previousContext !== context) {
    console.log(`🔄 [RealtimeMenuStore] Context changed from ${previousContext} to ${context}, clearing cache to force fresh data load`);

    // Clear the persisted localStorage cache
    try {
      localStorage.removeItem('cottage-tandoori-menu-cache');
    } catch (e) {
      console.warn('Failed to clear localStorage cache:', e);
    }

    // Reset in-memory state to force fresh data load
    // Use getState() to avoid creating a new subscription during context switch
    useRealtimeMenuStore.setState({
      menuItems: [],
      categories: [],
      itemVariants: [],
      setMeals: [],
      proteinTypes: [],
      customizations: [],
      filteredMenuItems: [],
      menuItemsByCategory: {},
      lastFetched: 0,
      isLoading: true // Show loading state while fresh data loads
    });
  }
}

/**
 * Get the current store context
 */
export function getMenuStoreContext(): MenuStoreContext {
  return currentStoreContext;
}

// Subscription management state
interface SubscriptionState {
  subscriptions: Map<string, any>;
  isSubscribing: boolean;
  abortController: AbortController | null;
  // NEW: Track active subscription filters
  activeItemsSubscriptionCategory: string | null;
}

// NEW: Items subscription cache (tracks which category we're subscribed to)
interface ItemsSubscriptionCache {
  category: string | null;
  channel: any | null;
}

const subscriptionState: SubscriptionState = {
  subscriptions: new Map(),
  isSubscribing: false,
  abortController: null,
  activeItemsSubscriptionCategory: null
};

// NEW: Cache for items subscription
const itemsSubscriptionCache: ItemsSubscriptionCache = {
  category: null,
  channel: null
};

// Helper function to safely cleanup subscriptions
function cleanupSubscriptions() {
  subscriptionState.subscriptions.forEach((subscription, channelName) => {
    try {
      supabase.removeChannel(subscription);
    } catch (error) {
      console.warn(`⚠️ Error cleaning up subscription ${channelName}:`, error);
    }
  });

  subscriptionState.subscriptions.clear();

  // Abort any ongoing subscription setup
  if (subscriptionState.abortController) {
    subscriptionState.abortController.abort();
    subscriptionState.abortController = null;
  }

  subscriptionState.isSubscribing = false;
}

// ✅ Cache freshness configuration
// Reduced from 24 hours to 1 hour to ensure menu data stays fresh
// while still providing instant startup from cache
const CACHE_TTL = 1 * 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Check if cached data is still fresh (< 1 hour old)
 */
function isCacheFresh(lastFetched?: number): boolean {
  if (!lastFetched) return false;
  const age = Date.now() - lastFetched;
  return age < CACHE_TTL;
}

export const useRealtimeMenuStore = create<MenuStoreState>(
  persist(
    (set, get) => ({
      // Initial state
      categories: [],
      menuItems: [],
      setMeals: [], // Add Set Meals to initial state
      proteinTypes: [],
      customizations: [],
      itemVariants: [],
      
      // 🚀 NEW: Pre-computed lookup tables for O(1) access
      variantsByMenuItem: {},
      proteinTypesById: {},
      
      isLoading: true, // ✅ START AS TRUE: Skeleton shows immediately on mount
      isConnected: false,
      lastUpdate: 0,
      lastFetched: 0,
      error: null,
      
      // Computed data
      menuItemsByCategory: {},
      parentCategories: [],
      childCategories: [],
      subcategories: {},
      
      // Filtering state
      selectedParentCategory: null,
      selectedMenuCategory: null,
      searchQuery: '',
      filteredMenuItems: [],
      
      // FlexibleBillingModal state
      flexibleBillingModal: {
        isOpen: false,
        orderItems: [],
        linkedTables: [],
        primaryTableNumber: 0,
        splitMode: 'equal'
      },

      // AI Context state
      aiContextLastUpdate: 0,
      aiContextStatus: 'idle' as const,

      // Actions
      initialize: async () => {
        // Prevent concurrent menu store initializations
        if (isMenuStoreInitializing) {
          return;
        }
        
        isMenuStoreInitializing = true;
        set({ isLoading: true, error: null });
        
        // Create abort controller for this initialization
        const abortController = new AbortController();
        
        try {
          // Ensure Supabase is configured with correct credentials first
          const configSuccess = await ensureSupabaseConfigured();
          
          // Check if initialization was aborted
          if (abortController.signal.aborted) {
            return;
          }
          
          // Get store instance to call methods
          const state = get();
          
          // Load initial data
          await state.refreshData();
          
          // Check again after async operation
          if (abortController.signal.aborted) {
            return;
          }
          
          // Set up real-time subscriptions
          state.subscribeToChanges();

          set({
            isLoading: false,
            isConnected: true,
            lastUpdate: Date.now()
          });

        } catch (error) {
          if (abortController.signal.aborted) {
            return;
          }

          console.error('❌ Error initializing real-time menu store:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize menu store',
            isConnected: false
          });

          // Show user-friendly error
          toast.error('Failed to connect to menu data. Using cached data.');
        } finally {
          // Always reset the global flag
          isMenuStoreInitializing = false;
        }
      },
      
      refreshData: async () => {
        // 🚀 NEW: Wrap with request coordinator for deduplication
        return requestCoordinator.fetch('menu:refresh', async () => {
          const abortController = new AbortController();

          try {
            set({ isLoading: true, error: null });

            // Track request
            networkMonitor.requestMade();

            // 🎯 DRAFT/PUBLISH WORKFLOW: Filter based on store context
            // POS and Online contexts only see published items
            const publishedOnly = currentStoreContext !== 'admin';

            // ✅ Direct Supabase query - no backend needed
            const result = await getMenuWithOrdering({ publishedOnly });

            if (result.success && result.data) {
              const menuData = result.data;
              const { categories, items } = menuData;

              // Categories are already mapped by supabaseQueries
              get().setCategories(categories || []);
              get().setMenuItems(items || []);

              // ✅ Extract embedded variants from items into itemVariants array
              if (items && items.length > 0) {
                const allVariants: any[] = [];
                items.forEach((item: any) => {
                  if (item.variants && Array.isArray(item.variants)) {
                    // Variants are already embedded in each item from the query
                    allVariants.push(...item.variants);
                  }
                });

                get().setItemVariants(allVariants);
              }

              // ✅ Fetch Set Meals BEFORE updating filtered items
              await get().fetchSetMeals();

              // ✅ Fetch only protein types and customizations (variants already extracted)
              await get().fetchSupplementaryData();

              // ✅ Call updateFilteredItems ONCE at the end
              get().updateFilteredItems();

              set({ isLoading: false, isConnected: true, lastFetched: Date.now() });
              if (isDev) {
                // 📸 Image URL diagnostic logging
                const itemsWithImages = items?.filter((i: any) => i.image_url) || [];
                const itemsWithoutImages = items?.filter((i: any) => !i.image_url) || [];
                if (itemsWithImages.length > 0) {
                }
                if (itemsWithoutImages.length > 0) {
                }
              }
            } else {
              console.error(' Failed to fetch menu with ordering');
              networkMonitor.requestFailed();
              // Fallback to old method if query fails
              await get().fallbackRefreshData();
            }
          } catch (error) {
            networkMonitor.requestFailed();
            set({
              error: error instanceof Error ? error.message : 'Failed to refresh menu data',
              isConnected: false
            });

            // Try fallback method
            try {
              await get().fallbackRefreshData();
              set({ isConnected: true });
            } catch (fallbackError) {
              console.error('❌ Fallback refresh also failed:', fallbackError);
              toast.error('Failed to refresh menu data');
            }
          }
        });
      },
      
      // Fallback method using direct database queries
      fallbackRefreshData: async () => {
        // Ensure Supabase client is properly configured first
        await ensureSupabaseConfigured();

        // 🎯 DRAFT/PUBLISH WORKFLOW: Filter based on store context
        // POS and Online contexts only see published items, Admin sees all
        const publishedOnly = currentStoreContext !== 'admin';

        // Build items query with context-aware publish filter
        let itemsQuery = supabase
          .from('menu_items')
          .select('*')
          .eq('is_active', true)
          .order('display_order');

        // Add published_at filter for POS/Online contexts
        if (publishedOnly) {
          itemsQuery = itemsQuery.not('published_at', 'is', null);
        }

        // Fetch all data in parallel with proper error handling
        const dataPromises = [
          supabase.from('menu_categories').select('*').order('display_order'),
          itemsQuery,
          supabase.from('menu_protein_types').select('*').order('name'),
          supabase.from('menu_customizations').select('*').eq('is_active', true).order('menu_order'),
          supabase.from('item_variants').select(`
            *,
            menu_protein_types:protein_type_id(id, name)
          `).order('menu_item_id')
        ];
        
        const results = await Promise.allSettled(dataPromises);
        
        // Process results safely
        const [categoriesResult, itemsResult, proteinResult, customizationResult, variantsResult] = results;
        
        // Process categories
        if (categoriesResult.status === 'fulfilled' && !categoriesResult.value.error) {
          if (categoriesResult.value.data) {
            const mappedCategories = categoriesResult.value.data.map((item: any) => ({
              ...item,
              parent_category_id: item.parent_category_id || item.parent_id,
              active: item.is_active
            }));
            get().setCategories(mappedCategories);
          }
        } else {
        }
        
        // Process menu items  
        if (itemsResult.status === 'fulfilled' && !itemsResult.value.error) {
          if (itemsResult.value.data) {
            // ✅ FIX (MYA-1446): Map is_active → active for consistency
            const mappedItems = itemsResult.value.data.map((item: any) => ({
              ...item,
              active: item.is_active ?? item.active ?? true
            }));
            get().setMenuItems(mappedItems);
          }
        } else {
        }
        
        // Process protein types
        if (proteinResult.status === 'fulfilled' && !proteinResult.value.error && proteinResult.value.data) {
          get().setProteinTypes(proteinResult.value.data);
        }
        
        // Process customizations
        if (customizationResult.status === 'fulfilled' && !customizationResult.value.error && customizationResult.value.data) {
          get().setCustomizations(customizationResult.value.data);
        }
        
        // Process variants
        if (variantsResult.status === 'fulfilled' && !variantsResult.value.error && variantsResult.value.data) {
          const enhancedVariants = variantsResult.value.data.map(variant => ({
            ...variant,
            protein_type_name: variant.menu_protein_types?.name || null
          }));
          get().setItemVariants(enhancedVariants);
        }
      },
      
      // Fetch supplementary data separately - Direct Supabase queries
      fetchSupplementaryData: async () => {
        try {
          // 🎯 DRAFT/PUBLISH WORKFLOW: Respect store context for customizations
          // Same pattern as menu items - only show published in POS/Online contexts
          const publishedOnly = currentStoreContext !== 'admin';

          // ✅ Direct Supabase queries - no backend needed
          const [proteinTypes, customizations] = await Promise.all([
            fetchProteinTypes(),
            fetchCustomizations(publishedOnly)
          ]);

          // Process protein types
          if (proteinTypes && proteinTypes.length > 0) {
            get().setProteinTypes(proteinTypes);
          }

          // Process customizations
          if (customizations && customizations.length > 0) {
            get().setCustomizations(customizations);
          }

        } catch (error) {
        }
      },
      
      subscribeToChanges: () => {
        // Prevent multiple subscription attempts
        if (subscriptionState.isSubscribing) {
          return;
        }

        subscriptionState.isSubscribing = true;

        try {
          // Cleanup existing subscriptions first
          cleanupSubscriptions();

          // Create new abort controller for this subscription setup
          subscriptionState.abortController = new AbortController();

          // 🎯 DRAFT/PUBLISH WORKFLOW: Determine if we should filter for published only
          // POS and Online contexts should only receive changes for published items
          const publishedOnly = currentStoreContext !== 'admin';

          // Subscribe to menu_categories changes
          const categoriesChannel = supabase
            .channel('menu_categories_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_categories' }, (payload) => {
              handleCategoriesChange(payload);
            })
            .subscribe();

          subscriptionState.subscriptions.set('categories', categoriesChannel);

          // Subscribe to menu items changes
          // 🎯 For POS/Online: Filter handler checks published_at since Supabase realtime
          // doesn't support IS NOT NULL filters directly
          const itemsChannel = supabase
            .channel('menu_items_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, (payload) => {
              // 🎯 DRAFT/PUBLISH FILTER: Handle unpublished items in POS/Online contexts
              if (publishedOnly) {
                const newRecord = payload.new as any;
                const oldRecord = payload.old as any;

                // For INSERT/UPDATE, check if the new record is published
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                  if (!newRecord?.published_at) {
                    // Item is a draft - for POS/Online, we need to REMOVE it from state
                    // (it was either a new draft we shouldn't show, or a published item that became a draft)
                    console.log(`🚫 [Realtime] Removing unpublished item from POS/Online: ${newRecord?.name || newRecord?.id}`);

                    // Remove the item from state instead of just skipping
                    const store = useRealtimeMenuStore.getState();
                    const currentItems = store.menuItems;
                    const filteredItems = currentItems.filter((item: any) => item.id !== newRecord?.id);

                    // Only update if the item was actually in the list
                    if (filteredItems.length !== currentItems.length) {
                      store.setMenuItems(filteredItems);
                      store.updateFilteredItems();
                      console.log(`✅ [Realtime] Removed draft item "${newRecord?.name}" from POS/Online menu`);
                    }
                    return;
                  }
                }

                // For DELETE, we should process it (if item was published, it should be removed)
                // Note: deleted items won't have the new record, so we check old
              }

              handleMenuItemsChange(payload);
            })
            .subscribe();

          subscriptionState.subscriptions.set('items', itemsChannel);

          // Subscribe to menu_customizations changes
          const customizationsChannel = supabase
            .channel('menu_customizations_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'customizations' }, (payload) => {
              handleCustomizationsChange(payload);
            })
            .subscribe();

          subscriptionState.subscriptions.set('customizations', customizationsChannel);

          // Subscribe to menu_item_variants changes
          const variantsChannel = supabase
            .channel('menu_item_variants_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'item_variants' }, (payload) => {
              handleVariantsChange(payload);
            })
            .subscribe();

          subscriptionState.subscriptions.set('variants', variantsChannel);

          set({ isConnected: true });
          subscriptionState.isSubscribing = false;

        } catch (error) {
          subscriptionState.isSubscribing = false;
          set({ isConnected: false, error: 'Failed to establish real-time connection' });
        }
      },
      
      unsubscribeFromChanges: () => {
        cleanupSubscriptions();
        set({ isConnected: false });
      },
      
      // 🚀 NEW: Subscribe to specific category for selective data loading
      subscribeToCategory: (categoryId: string | null) => {
        // Track active category subscription
        subscriptionState.activeItemsSubscriptionCategory = categoryId;
        
        // Note: For now, this is primarily for tracking purposes
        // Full selective subscription implementation can be added later for network optimization
        // The actual filtering happens in updateFilteredItems()
      },
      
      triggerCorpusSync: async () => {
        // ✅ Corpus sync is a backend feature - in offline mode just refresh data
        // The corpus sync was used for AI features that required backend processing
        try {
          await get().refreshData();
        } catch (error) {
          set({ error: 'Failed to refresh menu data' });
        }
      },
      
      // NEW: Initialize data only without real-time subscriptions
      initializeDataOnly: async () => {
        // Prevent concurrent menu store initializations
        if (isMenuStoreInitializing) {
          return;
        }
        
        isMenuStoreInitializing = true;
        set({ isLoading: true, error: null });
        
        // Create abort controller for this initialization
        const abortController = new AbortController();
        
        try {
          // Ensure Supabase is configured with correct credentials first
          const configSuccess = await ensureSupabaseConfigured();
          
          // ✅ NEW: Only refresh data if bundle is NOT fresh
          await get().refreshData();

          set({
            isLoading: false,
            isConnected: true,
            lastUpdate: Date.now()
          });

        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize menu store',
            isConnected: false
          }); 
        } finally {
          // Always reset the global flag
          isMenuStoreInitializing = false;
        }
      },
      
      // NEW: Start real-time subscriptions separately
      startRealtimeSubscriptions: () => {
        const state = get();

        // Start real-time subscriptions
        state.subscribeToChanges();
      },

      // Force full refresh method
      forceFullRefresh: async () => {
        // Reset state
        set({
          categories: [],
          menuItems: [],
          setMeals: [],
          proteinTypes: [],
          customizations: [],
          itemVariants: [],
          isLoading: true,
          error: null,
          lastUpdate: 0
        });

        // Fetch all data fresh
        await get().refreshData();
        await get().fetchSetMeals();

        // Refresh combined data
        get().updateDerivedData();
      },
      
      // AI Context actions - These features require backend AI processing
      // In offline mode, they gracefully return without errors
      refreshAIContext: async () => {
        // ✅ AI context refresh requires backend - mark as ready since we have local data
        set({ aiContextLastUpdate: Date.now(), aiContextStatus: 'ready' });
      },

      getAIMenuContext: async (options?: any) => {
        // ✅ AI context is a backend feature - return local menu data instead
        const { menuItems, categories } = get();
        return {
          items: menuItems,
          categories: categories,
          offline: true
        };
      },
      
      invalidateAIContext: () => {
        invalidateMenuContext();
        set({ aiContextStatus: 'idle' });
      },

      validateAIMenuItem: async (query: string, categoryFilter?: string) => {
        // Local menu item validation - matches by name
        const { menuItems } = get();
        const items = categoryFilter
          ? menuItems.filter(item => item.category_id === categoryFilter)
          : menuItems;
        const match = items.find(item =>
          item.name.toLowerCase().includes(query.toLowerCase())
        );
        return match || null;
      },

      // Filtering methods
      setSelectedParentCategory: (categoryId: string | null) => {
        set({ selectedParentCategory: categoryId });
        get().updateFilteredItems();
      },
      
      setSelectedMenuCategory: (categoryId: string | null) => {
        set({ selectedMenuCategory: categoryId });
        get().updateFilteredItems();
      },
      
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
        get().updateFilteredItems();
      },
      
      updateFilteredItems: () => {
        const { menuItems, categories, selectedParentCategory, selectedMenuCategory, searchQuery, setMeals } = get();
        
        // 1. Start with all menu items
        let filtered = [...menuItems];

        // 2. Filter by category
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
            // Check if this is a synthetic section parent (section-xxx)
            if (selectedCategory.id.startsWith('section-')) {
              // Filter by all child categories under this section
              const childCategoryIds = categories
                .filter(cat => cat.parent_category_id === selectedMenuCategory && cat.active)
                .map(cat => cat.id);
              
              if (childCategoryIds.length > 0) {
                filtered = filtered.filter(item => childCategoryIds.includes(item.category_id));
              } else {
                filtered = filtered.filter(item => item.category_id === selectedMenuCategory);
              }
            } else if (selectedCategory && !selectedCategory.parent_category_id) {
              // Legacy parent category - find all child categories
              const childCategoryIds = categories
                .filter(cat => cat.parent_category_id === selectedMenuCategory && cat.active)
                .map(cat => cat.id);
              
              if (childCategoryIds.length > 0) {
                // Filter by child category IDs
                filtered = filtered.filter(item => childCategoryIds.includes(item.category_id));
              } else {
                // No children, filter by this category directly
                filtered = filtered.filter(item => item.category_id === selectedMenuCategory);
              }
            } else {
              // Regular category - filter normally
              filtered = filtered.filter(item => item.category_id === selectedMenuCategory);
            }
          }
        }

        // 3. Apply fuzzy priority-based search filter
        if (searchQuery && searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          
          // Helper: Get category name for an item
          const getCategoryName = (item: MenuItem): string => {
            const category = categories.find(cat => cat.id === item.category_id);
            return category?.name || '';
          };
          
          // Score each item based on match priority
          const scoredItems = filtered.map(item => {
            const itemName = item.name.toLowerCase();
            const itemDescription = (item.menu_item_description || '').toLowerCase();
            const categoryName = getCategoryName(item).toLowerCase();
            
            let score = 0;
            
            // Priority 1: Exact name match (highest priority)
            if (itemName === query) {
              score = 1000;
            }
            // Priority 2: Name starts with query
            else if (itemName.startsWith(query)) {
              score = 800;
            }
            // Priority 3: Name contains query (word boundary)
            else if (itemName.includes(` ${query}`) || itemName.includes(query)) {
              score = 600;
            }
            // Priority 4: Category name contains query
            else if (categoryName.includes(query)) {
              score = 400;
            }
            // Priority 5: Description contains query (lowest priority)
            else if (itemDescription.includes(query)) {
              score = 200;
            }
            
            return { item, score };
          });
          
          // Filter out items with score 0 (no match) and sort by score (highest first)
          filtered = scoredItems
            .filter(({ score }) => score > 0)
            .sort((a, b) => b.score - a.score)
            .map(({ item }) => item);
        }

        // 4. Combine with Set Meals converted to MenuItem format
        const setMealItems = get().convertSetMealsToMenuItems();
        const combinedItems = [...filtered, ...setMealItems];

        set({ filteredMenuItems: combinedItems });
      },

      // Internal state updates
      setCategories: (categories: Category[]) => {
        const isDev = import.meta.env?.DEV;

        // ✅ FIX (MYA-1379): Use real UUID-based section records from database
        // NO LONGER inject virtual "section-*" records - database already has the correct UUIDs

        // Simply use the categories as-is from the database
        const activeCategories = categories.filter(cat => cat.active);

        // Build hierarchical structure
        const parentCategories = activeCategories.filter(cat => !cat.parent_category_id);
        const subcategories: Record<string, Category[]> = {};

        parentCategories.forEach(parent => {
          subcategories[parent.id] = activeCategories
            .filter(cat => cat.parent_category_id === parent.id)
            .sort((a, b) => a.display_order - b.display_order);
        });

        set({
          categories: activeCategories,
          parentCategories,
          childCategories: activeCategories.filter(cat => cat.parent_category_id),
          subcategories
        });
      },

      setMenuItems: (items: MenuItem[]) => {
        // Clear skeleton state from all items when setting full data
        const cleanItems = items.map(item => {
          const cleanItem = { ...item };
          delete (cleanItem as any)._isSkeletonState;
          return cleanItem;
        });

        set({ menuItems: cleanItems });
        get().updateDerivedData();
      },
      
      setProteinTypes: (proteinTypes: ProteinType[]) => {
        set({ proteinTypes });
        // Recompute lookups when protein types change
        get().computeLookups();
      },
      
      setCustomizations: (customizations: CustomizationBase[]) => {
        set({ customizations });
      },

      setItemVariants: (variants: ItemVariant[]) => {
        set({ itemVariants: variants });
        // Recompute lookups when variants change
        get().computeLookups();
      },

      updateDerivedData: () => {
        const { categories, menuItems } = get();

        // Group menu items by category
        const menuItemsByCategory: Record<string, MenuItem[]> = {};
        (menuItems || []).forEach(item => {
          if (!menuItemsByCategory[item.category_id]) {
            menuItemsByCategory[item.category_id] = [];
          }
          menuItemsByCategory[item.category_id].push(item);
        });

        // Separate parent and child categories
        // Note: Using AdminMenu's mapped field names (parent_category_id, active)
        const parentCategories = categories.filter(cat => !cat.parent_category_id);
        const childCategories = categories.filter(cat => cat.parent_category_id);

        // Set parent categories
        set({
          menuItemsByCategory,
          parentCategories,
          childCategories,
          subcategories: {}
        });

        // ✅ OPTIMIZATION: Remove updateFilteredItems() call - will be called once at end of bundle load
        // get().updateFilteredItems();
      },
      
      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
      setConnected: (isConnected: boolean) => set({ isConnected }),

      // Set Meals methods
      setSetMeals: (setMeals: SetMeal[]) => {
        set({ setMeals });
        // ✅ OPTIMIZATION: Remove updateFilteredItems() call - will be called once at end of bundle load
        // get().updateFilteredItems();
      },

      fetchSetMeals: async () => {
        try {
          // 🎯 DRAFT/PUBLISH WORKFLOW: Respect store context for Set Meals
          // Same pattern as menu items - only show published in POS/Online contexts
          const publishedOnly = currentStoreContext !== 'admin';
          const setMealsData = await getSetMeals(true, publishedOnly);

          if (Array.isArray(setMealsData)) {
            get().setSetMeals(setMealsData);
          } else {
            get().setSetMeals([]);
          }
        } catch (error) {
          get().setSetMeals([]);
        }
      },

      convertSetMealsToMenuItems: () => {
        const { setMeals, categories } = get();

        // Find or create SET MEALS category
        let setMealsCategory = categories.find(cat => cat.name === 'SET MEALS');
        const setMealsCategoryId = setMealsCategory?.id || 'set-meals-category';

        // 🎯 DRAFT/PUBLISH WORKFLOW: Safety filter - only show published in POS/Online
        const publishedOnly = currentStoreContext !== 'admin';

        // Convert Set Meals to MenuItem format
        const setMealMenuItems: MenuItem[] = setMeals
          .filter(setMeal => setMeal.active)
          .filter(setMeal => !publishedOnly || setMeal.published_at) // Only published in POS/Online
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
            menu_order: 999, // Display Set Meals at the end using unified field
            active: setMeal.active,
            inherit_category_print_settings: false,
            // Add price field from set_price
            price: setMeal.set_price,
            // Add Set Meal specific properties
            set_meal_data: {
              individual_items_total: setMeal.individual_items_total,
              savings: setMeal.savings,
              items: setMeal.items
            },
            item_type: 'set_meal' as const
          } as unknown as MenuItem));

        return setMealMenuItems;
      },

      // 🚀 NEW: Compute pre-indexed lookup tables for O(1) access
      computeLookups: () => {
        const { itemVariants, proteinTypes } = get();

        // Build variantsByMenuItem lookup: Record<menu_item_id, ItemVariant[]>
        const variantsByMenuItem: Record<string, ItemVariant[]> = {};
        itemVariants.forEach(variant => {
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

        // Build proteinTypesById lookup: Record<id, ProteinType>
        const proteinTypesById: Record<string, ProteinType> = {};
        proteinTypes.forEach(proteinType => {
          proteinTypesById[proteinType.id] = proteinType;
        });

        set({ variantsByMenuItem, proteinTypesById });
      },

      getWebsiteCustomizations: () => {
        const { customizations } = get();
        return customizations.filter(customization =>
          customization.is_active && customization.show_on_website
        );
      },

      getCustomizationsByGroup: () => {
        const { customizations } = get();
        const customizationsByGroup: Record<string, CustomizationBase[]> = {};

        customizations.forEach(customization => {
          if (customization.is_active && customization.show_on_website) {
            const group = customization.customization_group || 'Other';
            if (!customizationsByGroup[group]) {
              customizationsByGroup[group] = [];
            }
            customizationsByGroup[group].push(customization);
          }
        });

        return customizationsByGroup;
      },

      // FlexibleBillingModal actions
      openFlexibleBillingModal: (orderItems, linkedTables, primaryTableNumber) => {
        set({
          flexibleBillingModal: {
            isOpen: true,
            orderItems,
            linkedTables,
            primaryTableNumber,
            splitMode: 'equal'
          }
        });
      },

      closeFlexibleBillingModal: () => {
        set({
          flexibleBillingModal: {
            isOpen: false,
            orderItems: [],
            linkedTables: [],
            primaryTableNumber: 0,
            splitMode: 'equal'
          }
        });
      },

      setFlexibleBillingMode: (mode) => {
        set((state) => ({
          flexibleBillingModal: {
            ...state.flexibleBillingModal,
            splitMode: mode
          }
        }));
      },

      updateFlexibleBillingItems: (items) => {
        set((state) => ({
          flexibleBillingModal: {
            ...state.flexibleBillingModal,
            orderItems: items
          }
        }));
      },

      // ✅ NEW: Manual cache invalidation method
      invalidateCache: () => {
        set({
          lastFetched: 0, // Reset timestamp to force refresh
          isLoading: true
        });

        // Trigger a fresh data load
        get().refreshData();
      },
    }),
    {
      name: 'cottage-tandoori-menu-cache',
      version: 1,
      
      // ✅ Partialize: Only persist menu data, exclude transient state
      partialize: (state) => ({
        menuItems: state.menuItems,
        categories: state.categories,
        itemVariants: state.itemVariants,
        proteinTypes: state.proteinTypes,
        setMeals: state.setMeals,
        customizations: state.customizations,
        lastFetched: state.lastFetched,
        
        // Also persist computed lookups for faster hydration
        variantsByMenuItem: state.variantsByMenuItem,
        proteinTypesById: state.proteinTypesById,
      }),
      
      // ✅ Smart hydration: Set isLoading based on cache freshness
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }
        
        const cacheFresh = isCacheFresh(state.lastFetched);
        
        // ✅ SMART HYDRATION: Set isLoading based on cache freshness
        if (cacheFresh && state.menuItems?.length > 0) {
          // Cache is fresh - show immediately, no loading state
          state.isLoading = false;
        } else {
          // Cache is stale or empty - show loading skeleton
          state.isLoading = true;
        }
        
        // Always start disconnected (subscriptions start separately)
        state.isConnected = false;
        state.error = null;
      },
    }
  )
);

// Real-time event handlers
function handleCategoriesChange(payload: any) {
  const store = useRealtimeMenuStore.getState();
  
  if (payload.eventType === 'INSERT') {
    const newCategory = {
      ...payload.new,
      parent_category_id: payload.new.parent_category_id || payload.new.parent_id,
      active: payload.new.is_active ?? payload.new.active
    } as Category;
    
    store.setCategories([...store.categories, newCategory]);
    toast.success(`Category "${newCategory.name}" added`);
  } else if (payload.eventType === 'UPDATE') {
    const updatedCategory = {
      ...payload.new,
      parent_category_id: payload.new.parent_category_id || payload.new.parent_id,
      active: payload.new.is_active ?? payload.new.active
    } as Category;
    
    const categories = store.categories.map(cat => 
      cat.id === updatedCategory.id ? updatedCategory : cat
    );
    store.setCategories(categories);
    toast.success(`Category "${updatedCategory.name}" updated`);
  } else if (payload.eventType === 'DELETE') {
    const deletedCategory = payload.old as Category;
    const categories = store.categories.filter(cat => cat.id !== deletedCategory.id);
    store.setCategories(categories);
    toast.success(`Category "${deletedCategory.name}" removed`);
  }
  
  // Trigger corpus sync after category changes
  store.triggerCorpusSync();
}

function handleMenuItemsChange(payload: any) {
  const store = useRealtimeMenuStore.getState();
  
  if (payload.eventType === 'INSERT') {
    // ✅ FIX (MYA-1446): Map is_active → active for consistency with backend
    const newItem = {
      ...payload.new,
      active: payload.new.is_active ?? payload.new.active ?? true
    } as MenuItem;
    store.setMenuItems([...store.menuItems, newItem]);
    toast.success(`Menu item "${newItem.name}" added`);
  } else if (payload.eventType === 'UPDATE') {
    // ✅ FIX (MYA-1446): Map is_active → active for consistency with backend
    const updatedItem = {
      ...payload.new,
      active: payload.new.is_active ?? payload.new.active ?? true
    } as MenuItem;
    const menuItems = store.menuItems.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    );
    store.setMenuItems(menuItems);
    toast.success(`Menu item "${updatedItem.name}" updated`);
  } else if (payload.eventType === 'DELETE') {
    const deletedItem = payload.old as MenuItem;
    const menuItems = store.menuItems.filter(item => item.id !== deletedItem.id);
    store.setMenuItems(menuItems);
    toast.success(`Menu item "${deletedItem.name}" removed`);
  }
  
  // Trigger corpus sync after menu item changes
  store.triggerCorpusSync();
}

function handleCustomizationsChange(payload: any) {
  const store = useRealtimeMenuStore.getState();
  
  if (payload.eventType === 'INSERT') {
    const newCustomization = payload.new as CustomizationBase;
    store.setCustomizations([...store.customizations, newCustomization]);
  } else if (payload.eventType === 'UPDATE') {
    const updatedCustomization = payload.new as CustomizationBase;
    const customizations = store.customizations.map(custom => 
      custom.id === updatedCustomization.id ? updatedCustomization : custom
    );
    store.setCustomizations(customizations);
  } else if (payload.eventType === 'DELETE') {
    const deletedCustomization = payload.old as CustomizationBase;
    const customizations = store.customizations.filter(custom => custom.id !== deletedCustomization.id);
    store.setCustomizations(customizations);
  }
}

function handleVariantsChange(payload: any) {
  const store = useRealtimeMenuStore.getState();
  
  if (payload.eventType === 'INSERT') {
    const newVariant = payload.new as ItemVariant;
    store.setItemVariants([...store.itemVariants, newVariant]);
  } else if (payload.eventType === 'UPDATE') {
    const updatedVariant = payload.new as ItemVariant;
    const variants = store.itemVariants.map(variant => 
      variant.id === updatedVariant.id ? updatedVariant : variant
    );
    store.setItemVariants(variants);
  } else if (payload.eventType === 'DELETE') {
    const deletedVariant = payload.old as ItemVariant;
    const variants = store.itemVariants.filter(variant => variant.id !== deletedVariant.id);
    store.setItemVariants(variants);
  }
  // 🚀 Note: computeLookups() is automatically called inside setItemVariants()
}

// Helper functions for consumers
export const getMenuDataForPOS = () => {
  const store = useRealtimeMenuStore.getState();
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

// Global flag to prevent concurrent bundle loads
let isBundleLoading = false;
// Global flag to prevent concurrent menu store initializations
let isMenuStoreInitializing = false;
// NEW: Track when bundle was last loaded to prevent duplicate fetches
let bundleLoadTime = 0;
// NEW: Track if real-time subscriptions have been started
let realtimeSubscriptionsStarted = false;

// NEW: Fast POS bundle loader for initial startup - Direct Supabase query
export const loadPOSBundle = async () => {
  // Prevent concurrent bundle loads
  if (isBundleLoading) {
    return false;
  }

  const store = useRealtimeMenuStore.getState();

  isBundleLoading = true;

  try {
    store.setLoading(true);

    // ✅ Direct Supabase query - no backend needed
    const bundleData = await getPOSBundle();

    if (bundleData.success) {
      // Set bundle data immediately for fast rendering
      store.setCategories(bundleData.categories);

      // Convert bundle items to menu items format with skeleton state
      const bundleMenuItems = bundleData.items.map((item: any) => ({
        ...item,
        variants: [], // Will be loaded on-demand
        menu_item_description: null, // Will be loaded on-demand
        dietary_tags: null, // Will be loaded on-demand
        _isSkeletonState: true,
      }));

      store.setMenuItems(bundleMenuItems);

      // Set item variants so variantsByMenuItem lookup is populated
      // This enables variant images, pricing, and variant chips on POS cards
      if (bundleData.itemVariants && bundleData.itemVariants.length > 0) {
        store.setItemVariants(bundleData.itemVariants);
      }

      store.setLoading(false);
      store.setError(null);

      // Mark as bundle-loaded for faster subsequent access
      store.lastUpdate = Date.now();
      bundleLoadTime = Date.now();

      return true;
    } else {
      throw new Error('Failed to load POS bundle');
    }
  } catch (error) {
    console.error(' [POS Bundle] Failed to load bundle:', error);
    store.setError(error instanceof Error ? error.message : 'Failed to load POS bundle');
    store.setLoading(false);
    return false;
  } finally {
    // Always reset the loading flag, even if there's an error
    isBundleLoading = false;
  }
};

// NEW: Load full item details on-demand - Direct Supabase query
export const loadItemDetails = async (itemId: string) => {
  try {
    // ✅ Direct Supabase query - no backend needed
    const detailsData = await getItemDetails(itemId);

    if (detailsData.success && detailsData.data) {
      const store = useRealtimeMenuStore.getState();
      const currentItems = store.menuItems;

      // Update the specific item with full details
      const updatedItems = currentItems.map(item => {
        if (item.id === itemId) {
          return {
            ...detailsData.data!.item,
            variants: detailsData.data!.variants || []
          };
        }
        return item;
      });

      store.setMenuItems(updatedItems);

      // Also update variants store
      if (detailsData.data.variants) {
        store.setItemVariants(detailsData.data.variants);
      }

      return detailsData.data;
    }
    return null;
  } catch (error) {
    console.error(` [POS Bundle] Failed to load item details for ${itemId}:`, error);
    return null;
  }
};

// NEW: Load full category items when category is opened - Direct Supabase query
export const loadCategoryItems = async (categoryId: string) => {
  try {
    // ✅ Direct Supabase query - no backend needed
    const categoryData = await getCategoryItems(categoryId);

    if (categoryData.success && categoryData.data) {
      const store = useRealtimeMenuStore.getState();
      const currentItems = store.menuItems;

      // Update items in this category with full data
      const enrichedItems = categoryData.data.items;
      const updatedItems = currentItems.map(item => {
        const enrichedItem = enrichedItems.find((ei: any) => ei.id === item.id);
        return enrichedItem || item;
      });

      store.setMenuItems(updatedItems);

      // Extract and store variants
      const allVariants: any[] = [];
      enrichedItems.forEach((item: any) => {
        if (item.variants) {
          allVariants.push(...item.variants);
        }
      });

      if (allVariants.length > 0) {
        store.setItemVariants(allVariants);
      }

      return categoryData.data;
    }
    return null;
  } catch (error) {
    console.error(` [POS Bundle] Failed to load category items for ${categoryId}:`, error);
    return null;
  }
};

/**
 * Start real-time Supabase subscriptions with lazy loading support
 * 
 * SUBSCRIPTION LIFECYCLE:
 * 1. Called on first user interaction OR after 15s timeout
 * 2. Only starts once (protected by realtimeSubscriptionsStarted flag)
 * 3. Subscribes to: categories, menu_items, set_meals, protein_types, customizations, item_variants
 * 4. Updates store state in real-time when Supabase data changes
 * 
 * CLEANUP:
 * Must be paired with cleanupRealtimeMenuStore() on component unmount to prevent memory leaks
 * 
 * @see cleanupRealtimeMenuStore
 */
export const startRealtimeSubscriptionsIfNeeded = () => {
  const store = useRealtimeMenuStore.getState();
  
  if (!realtimeSubscriptionsStarted) {
    realtimeSubscriptionsStarted = true;
    store.subscribeToChanges();
  }
};

/**
 * Cleanup real-time Supabase subscriptions
 * 
 * CRITICAL: Must be called on component unmount to prevent memory leaks
 * 
 * SUBSCRIPTION LIFECYCLE:
 * 1. Unsubscribes from all active Supabase channels
 * 2. Resets store connection state (isConnected = false)
 * 3. Cleans up internal subscription tracking
 * 
 * USAGE:
 * ```tsx
 * useEffect(() => {
 *   // Component mount logic
 *   return () => {
 *     cleanupRealtimeMenuStore(); // Cleanup on unmount
 *   };
 * }, []);
 * ```
 * 
 * @see startRealtimeSubscriptionsIfNeeded
 */
export const cleanupRealtimeMenuStore = () => {
  useRealtimeMenuStore.getState().unsubscribeFromChanges();
  realtimeSubscriptionsStarted = false;
};
