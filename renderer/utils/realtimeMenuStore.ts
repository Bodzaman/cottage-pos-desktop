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
import brain from 'brain';
import { aiContextManager, invalidateMenuContext } from './aiContextManager';
import { FIXED_SECTIONS, mapCategoryToSection } from './sectionMapping';
import { requestCoordinator } from './requestCoordinator';
import { networkMonitor } from './networkMonitor';

// Development mode flag
const isDev = import.meta.env?.DEV;

// ✅ NEW: Helper function to transform variant_name to Title Case format
function transformVariantName(variant: any, proteinTypes: ProteinType[]): any {
  // If variant_name is already in Title Case format (contains spaces and mixed case), keep it
  if (variant.variant_name && /[a-z]/.test(variant.variant_name) && /[A-Z]/.test(variant.variant_name)) {
    return variant;
  }
  
  // Otherwise, generate Title Case from protein_type_name or lookup
  let proteinTypeName = variant.protein_type_name;
  
  // If we don't have protein_type_name, look it up
  if (!proteinTypeName && variant.protein_type_id) {
    const proteinType = proteinTypes.find(pt => pt.id === variant.protein_type_id);
    proteinTypeName = proteinType?.name || null;
  }
  
  if (proteinTypeName) {
    // Convert to Title Case: "CHICKEN" -> "Chicken"
    const titleCaseName = proteinTypeName.charAt(0).toUpperCase() + proteinTypeName.slice(1).toLowerCase();
    
    return {
      ...variant,
      variant_name: titleCaseName,
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

// Subscription management state
interface SubscriptionState {
  subscriptions: Map<string, any>;
  isSubscribing: boolean;
  abortController: AbortController | null;
  // NEW: Track active subscription filters
  activeItemsSubscriptionCategory: string | null;
  itemsSubscriptionCache: Map<string, { channel: any; timestamp: number }>;
}

const subscriptionState: SubscriptionState = {
  subscriptions: new Map(),
  isSubscribing: false,
  abortController: null,
  activeItemsSubscriptionCategory: null,
  itemsSubscriptionCache: new Map()
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

// ✅ NEW: Cache freshness configuration
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Check if cached data is still fresh (< 24 hours old)
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
            
            // ✅ CRITICAL FIX: Use brain API that handles image conversion properly
            const response = await brain.get_menu_with_ordering();
            const result = await response.json();
            
            if (result.success && result.data) {
              const menuData = result.data;
              const { categories, items } = menuData;
              
              // Map categories - ✅ FIX: Use parent_category_id directly from DB instead of mapping parent_id
              const mappedCategories = (categories || []).map((item: any) => ({
                ...item,
                parent_category_id: item.parent_category_id || item.parent_id,
                active: item.is_active
              }));
              
              // Set categories and items with proper image_url from API
              get().setCategories(mappedCategories);
              get().setMenuItems(items || []);

              // ✅ NEW FIX: Extract embedded variants from items into itemVariants array
              if (items && items.length > 0) {
                const allVariants: any[] = [];
                items.forEach((item: any) => {
                  if (item.variants && Array.isArray(item.variants)) {
                    // Variants are already embedded in each item from the API
                    allVariants.push(...item.variants);
                  }
                });
                
                get().setItemVariants(allVariants);
              }
              
              // ✅ FIX: Fetch Set Meals BEFORE updating filtered items
              await get().fetchSetMeals();
        
              // ✅ OPTIMIZATION: Fetch only protein types and customizations (variants already extracted)
              await get().fetchSupplementaryData();
        
              // ✅ OPTIMIZATION: Call updateFilteredItems ONCE at the end
              get().updateFilteredItems();

              set({ isLoading: false, isConnected: true, lastFetched: Date.now() });
            } else {
              console.error('❌ Failed to fetch menu with ordering:', result.message);
              networkMonitor.requestFailed();
              // Fallback to old method if new API fails
              await get().fallbackRefreshData();
            }
          } catch (error) {
            console.error('❌ Error refreshing menu data:', error);
            networkMonitor.requestFailed();
            set({ 
              error: error instanceof Error ? error.message : 'Failed to refresh menu data',
              isLoading: false,
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
        
        // Fetch all data in parallel with proper error handling
        const dataPromises = [
          supabase.from('menu_categories').select('*').order('display_print_order'),
          supabase.from('menu_items').select('*').eq('is_active', true).order('display_print_order'),
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
          console.error('❌ Error fetching categories:', categoriesResult.status === 'fulfilled' ? categoriesResult.value.error : categoriesResult.reason);
        }
        
        // Process menu items  
        if (itemsResult.status === 'fulfilled' && !itemsResult.value.error) {
          if (itemsResult.value.data) {
            get().setMenuItems(itemsResult.value.data);
          }
        } else {
          console.error('❌ Error fetching menu items:', itemsResult.status === 'fulfilled' ? itemsResult.value.error : itemsResult.reason);
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
      
      // Fetch supplementary data separately
      fetchSupplementaryData: async () => {
        try {
          // ✅ CRITICAL FIX: Use brain API instead of direct Supabase calls to ensure image_url conversion
          // Use the main API that handles image conversion properly  
          const response = await brain.get_menu_with_ordering();
          const result = await response.json();
          
          if (result.success && result.data) {
            const menuData = result.data;
            
            // Process the data that already has proper image_url conversion
            if (menuData.categories) {
              const mappedCategories = menuData.categories.map((item: any) => ({
                ...item,
                parent_category_id: item.parent_category_id || item.parent_id,
                active: item.is_active
              }));
              get().setCategories(mappedCategories);
            }
            
            if (menuData.items) {
              get().setMenuItems(menuData.items);
            }
            
            // ✅ NEW: Also fetch additional data that might not be in the main API
            const dataPromises = [
              supabase.from('menu_protein_types').select('*').order('name'),
              supabase.from('menu_customizations').select('*').eq('is_active', true).order('menu_order'),
              supabase.from('item_variants').select(`
                id,
                menu_item_id,
                protein_type_id,
                name,
                variant_name,
                price,
                price_dine_in,
                price_delivery,
                is_default,
                is_active,
                image_url_override,
                created_at,
                updated_at,
                menu_protein_types:protein_type_id(id, name)
              `).order('menu_item_id')
            ];
            
            const results = await Promise.allSettled(dataPromises);
            const [proteinResult, customizationResult, variantsResult] = results;
            
            // Process protein types
            if (proteinResult.status === 'fulfilled' && !proteinResult.value.error && proteinResult.value.data) {
              get().setProteinTypes(proteinResult.value.data);
            } else {
              console.error('❌ [RealtimeMenuStore] Failed to load protein types:', JSON.stringify(proteinResult));
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
            
          } else {
            console.error('❌ [RealtimeMenuStore] API failed for supplementary data:', JSON.stringify(result));
          }
          
        } catch (error) {
          console.error('❌ Error fetching supplementary data:', error);
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
          
          // Subscribe to menu_categories changes
          const categoriesChannel = supabase
            .channel('menu_categories_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_categories' }, (payload) => {
              handleCategoriesChange(payload);
            })
            .subscribe();
          
          subscriptionState.subscriptions.set('categories', categoriesChannel);
          
          // Subscribe to menu items changes
          const itemsChannel = supabase
            .channel('menu_items_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, (payload) => {
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
          console.error('❌ Error setting up subscriptions:', error);
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
        const abortController = new AbortController();
        
        try {
          // Create a timeout for the corpus sync
          const timeoutId = setTimeout(() => {
            abortController.abort();
          }, 10000); // 10 second timeout
      
          const response = await brain.sync_menu_corpus({ force: true });
      
          clearTimeout(timeoutId);
      
          if (abortController.signal.aborted) {
            return;
          }
      
          const result = await response.json();
      
          if (result.success) {
            // Refresh the data after corpus sync
            await get().refreshData();
          } else {
            console.error('❌ Menu corpus sync failed:', result.message);
          }
      
        } catch (error) {
          if (abortController.signal.aborted) {
            return;
          }
      
          console.error('❌ Error during corpus sync:', error);
          set({ error: 'Failed to sync menu corpus' });
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
          await state.refreshData();
          
          set({ 
            isLoading: false, 
            isConnected: false, // Mark as not connected since no subscriptions yet
            lastUpdate: Date.now()
          });
          
        } catch (error) {
          console.error('❌ Error initializing menu data:', error);
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to initialize menu data',
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
      
      // AI Context actions
      refreshAIContext: async () => {
        const abortController = new AbortController();
        
        try {
          // Create a timeout for the context refresh
          const timeoutId = setTimeout(() => {
            abortController.abort();
          }, 10000); // 10 second timeout
      
          const response = await brain.refresh_ai_context();
      
          clearTimeout(timeoutId);
      
          if (abortController.signal.aborted) {
            return;
          }
      
          const result = await response.json();
      
          if (result.success) {
            // Update context status in store
            set({ aiContextLastUpdate: Date.now(), aiContextStatus: 'ready' });
          } else {
            console.error('❌ AI context refresh failed:', result.message);
            set({ aiContextStatus: 'error' });
          }
      
        } catch (error) {
          if (abortController.signal.aborted) {
            return;
          }
      
          console.error('❌ Error refreshing AI context:', error);
          set({ aiContextStatus: 'error' });
        }
      },
      
      getAIMenuContext: async (options?: any) => {
        try {
          const response = await brain.get_ai_menu_context(options);
          const result = await response.json();
      
          if (result.success) {
            return result.data;
          } else {
            console.warn('⚠️ AI context fetch failed:', result.message);
            return null;
          }
        } catch (error) {
          console.error('❌ Error fetching AI context:', error);
          return null;
        }
      },
      
      validateAIMenuItem: async (query: string, categoryFilter?: string) => {
        try {
          const response = await brain.validate_ai_menu_item(query, categoryFilter);
          const result = await response.json();
      
          if (result.success) {
            return result.data;
          } else {
            console.warn('⚠️ AI validation failed:', result.message);
            return null;
          }
        } catch (error) {
          console.error('❌ Error validating AI menu item:', error);
          return null;
        }
      },
      
      invalidateAIContext: () => {
        invalidateMenuContext();
        set({ aiContextStatus: 'idle' });
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
      
      // FlexibleBillingModal actions
      openFlexibleBillingModal: (orderItems: OrderItem[], linkedTables: TableData[], primaryTableNumber: number) => {
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
      
      setFlexibleBillingMode: (mode: 'equal' | 'custom' | 'by-item') => {
        set({
          flexibleBillingModal: {
            ...get().flexibleBillingModal,
            splitMode: mode
          }
        });
      },
      
      updateFlexibleBillingItems: (items: OrderItem[]) => {
        set({
          flexibleBillingModal: {
            ...get().flexibleBillingModal,
            orderItems: items
          }
        });
      },
      
      // Internal state updates
      setCategories: (categories: Category[]) => {
        const isDev = import.meta.env?.DEV;
        
        // Transform incoming categories to include the 7 fixed section parents
        const activeCategories = categories.filter(cat => cat.active);
        
        // Create synthetic parent categories for the 7 sections
        const sectionParents: Category[] = FIXED_SECTIONS.map((section) => ({
          id: `section-${section.id}`,
          name: section.name,
          description: section.displayName,
          display_order: section.order,
          print_order: section.order,
          print_to_kitchen: true,
          image_url: null,
          parent_category_id: null, // These are top-level
          active: true,
          code_prefix: section.codePrefix
        }));
        
        // Map real database categories as children under the appropriate section
        const childCategories: Category[] = activeCategories.map(cat => {
          let finalParentId: string;
          
          if (cat.parent_category_id && cat.parent_category_id.startsWith('section-')) {
            // Already has a valid section parent - preserve it!
            finalParentId = cat.parent_category_id;
          } else {
            // No valid section parent - guess based on name/code_prefix
            const sectionId = mapCategoryToSection(cat);
            finalParentId = `section-${sectionId}`;
          }
          
          return {
            ...cat,
            parent_category_id: finalParentId
          };
        });
        
        // Combine section parents with child categories
        const transformedCategories = [...sectionParents, ...childCategories];
        
        // Build hierarchical structure
        const parentCategories = transformedCategories.filter(cat => !cat.parent_category_id);
        const subcategories: Record<string, Category[]> = {};
        
        parentCategories.forEach(parent => {
          subcategories[parent.id] = transformedCategories
            .filter(cat => cat.parent_category_id === parent.id)
            .sort((a, b) => a.display_order - b.display_order);
        });
        
        set({ 
          categories: transformedCategories,
          parentCategories,
          childCategories: transformedCategories.filter(cat => cat.parent_category_id),
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
      
      setItemVariants: (itemVariants: ItemVariant[]) => {
        set({ itemVariants });
        // 🚀 CRITICAL: Recompute lookups when variants change to populate variantsByMenuItem
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
          const response = await brain.list_set_meals({ active_only: true });
          const setMeals = response.json ? await response.json() : response;
          
          if (Array.isArray(setMeals)) {
            get().setSetMeals(setMeals);
          } else {
            console.warn('⚠️ [RealtimeMenuStore] Set Meals response is not an array:', setMeals);
            get().setSetMeals([]);
          }
        } catch (error) {
          console.error('❌ [RealtimeMenuStore] Error fetching Set Meals:', error);
          get().setSetMeals([]);
        }
      },

      convertSetMealsToMenuItems: () => {
        const { setMeals, categories } = get();
        
        // Find or create SET MEALS category
        let setMealsCategory = categories.find(cat => cat.name === 'SET MEALS');
        const setMealsCategoryId = setMealsCategory?.id || 'set-meals-category';
        
        // Convert Set Meals to MenuItem format
        const setMealMenuItems: MenuItem[] = setMeals
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
          } as MenuItem & { price?: number; set_meal_data?: any; item_type?: string }));
        
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
    const newItem = payload.new as MenuItem;
    store.setMenuItems([...store.menuItems, newItem]);
    toast.success(`Menu item "${newItem.name}" added`);
  } else if (payload.eventType === 'UPDATE') {
    const updatedItem = payload.new as MenuItem;
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

// NEW: Fast POS bundle loader for initial startup
export const loadPOSBundle = async () => {
  // Prevent concurrent bundle loads
  if (isBundleLoading) {
    return false;
  }
  
  const store = useRealtimeMenuStore.getState();
  
  isBundleLoading = true;
  
  try {
    store.setLoading(true);
    
    // Import brain dynamically to avoid circular imports
    const brain = (await import('brain')).default;
    const response = await brain.get_pos_bundle();
    const bundleData = await response.json();
    
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
      store.setLoading(false);
      store.setError(null);
      
      // Mark as bundle-loaded for faster subsequent access
      store.lastUpdate = Date.now();
      bundleLoadTime = Date.now();
      
      return true;
    } else {
      throw new Error(bundleData.message || 'Failed to load POS bundle');
    }
  } catch (error) {
    console.error('❌ [POS Bundle] Failed to load bundle:', error);
    store.setError(error as Error);
    store.setLoading(false);
    return false;
  } finally {
    // Always reset the loading flag, even if there's an error
    isBundleLoading = false;
  }
};

// NEW: Load full item details on-demand
export const loadItemDetails = async (itemId: string) => {
  try {
    const brain = (await import('brain')).default;
    const response = await brain.item_details(itemId);
    const detailsData = await response.json();
    
    if (detailsData.success) {
      const store = useRealtimeMenuStore.getState();
      const currentItems = store.menuItems;
      
      // Update the specific item with full details
      const updatedItems = currentItems.map(item => {
        if (item.id === itemId) {
          return {
            ...detailsData.data.item,
            variants: detailsData.data.variants || []
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
  } catch (error) {
    console.error(`❌ [POS Bundle] Failed to load item details for ${itemId}:`, error);
    return null;
  }
};

// NEW: Load full category items when category is opened
export const loadCategoryItems = async (categoryId: string) => {
  try {
    const brain = (await import('brain')).default;
    const response = await brain.category_items(categoryId);
    const categoryData = await response.json();
    
    if (categoryData.success) {
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
  } catch (error) {
    console.error(`❌ [POS Bundle] Failed to load category items for ${categoryId}:`, error);
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
