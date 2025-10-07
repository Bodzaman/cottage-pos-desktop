/**
 * Real-time Menu Store - Unified source of truth for menu data
 * 
 * This store provides real-time synchronization between AdminMenu and POS
 * by subscribing to Supabase real-time changes and maintaining a unified
 * data structure for all menu-related components.
 */

import { create } from 'zustand';
import { supabase, ensureSupabaseConfigured } from './supabaseClient';
import { Category, MenuItem, ItemVariant, ProteinType, CustomizationBase, SetMeal } from './menuTypes';
import { OrderItem } from './menuTypes';
import { TableData } from './tableTypes';
import { toast } from 'sonner';
import brain from 'brain';
import { aiContextManager, invalidateMenuContext } from './aiContextManager';
import { FIXED_SECTIONS, mapCategoryToSection } from './sectionMapping';

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
  
  // Loading states
  isLoading: boolean;
  isConnected: boolean;
  lastUpdate: number;
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
  
  // NEW: Customization helper methods
  getWebsiteCustomizations: () => CustomizationBase[];
  getCustomizationsByGroup: () => Record<string, CustomizationBase[]>;
}

// Subscription management state
interface SubscriptionState {
  subscriptions: Map<string, any>;
  isSubscribing: boolean;
  abortController: AbortController | null;
}

const subscriptionState: SubscriptionState = {
  subscriptions: new Map(),
  isSubscribing: false,
  abortController: null
};

// Helper function to safely cleanup subscriptions
function cleanupSubscriptions() {
  const isDev = import.meta.env?.DEV;
  if (isDev) console.log('🧹 Cleaning up real-time subscriptions...');
  
  subscriptionState.subscriptions.forEach((subscription, channelName) => {
    try {
      supabase.removeChannel(subscription);
      if (isDev) console.log(`✅ Cleaned up subscription: ${channelName}`);
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

export const useRealtimeMenuStore = create<MenuStoreState>((set, get) => ({
  // Initial state
  categories: [],
  menuItems: [],
  setMeals: [], // Add Set Meals to initial state
  proteinTypes: [],
  customizations: [],
  itemVariants: [],
  
  isLoading: false,
  isConnected: false,
  lastUpdate: 0,
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
    const isDev = import.meta.env?.DEV;
    // Prevent concurrent menu store initializations
    if (isMenuStoreInitializing) {
      if (isDev) console.log('⏭️ [Menu Store] Already initializing, skipping duplicate request...');
      return;
    }
    
    const state = get();
    
    if (state.isLoading) {
      if (isDev) console.log('Menu store already initializing, skipping...');
      return;
    }
    
    isMenuStoreInitializing = true;
    set({ isLoading: true, error: null });
    
    // Create abort controller for this initialization
    const abortController = new AbortController();
    
    try {
      if (isDev) console.log('Initializing real-time menu store...');
      
      // Ensure Supabase is configured with correct credentials first
      if (isDev) console.log('🔧 Ensuring Supabase configuration is correct...');
      const configSuccess = await ensureSupabaseConfigured();
      if (!configSuccess && isDev) {
        console.warn('⚠️ Failed to ensure Supabase configuration, proceeding with fallback');
      }
      
      // Check if initialization was aborted
      if (abortController.signal.aborted) {
        if (isDev) console.log('🚫 Menu store initialization aborted');
        return;
      }
      
      // Load initial data
      await state.refreshData();
      
      // Check again after async operation
      if (abortController.signal.aborted) {
        if (isDev) console.log('🚫 Menu store initialization aborted after data refresh');
        return;
      }
      
      // Set up real-time subscriptions
      state.subscribeToChanges();
      
      set({ 
        isLoading: false, 
        isConnected: true,
        lastUpdate: Date.now()
      });
      
      if (isDev) console.log('✅ Real-time menu store initialized successfully');
      
    } catch (error) {
      if (abortController.signal.aborted) {
        if (isDev) console.log('🚫 Menu store initialization was aborted');
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
    const isDev = import.meta.env?.DEV;
    const abortController = new AbortController();
    
    try {
      set({ isLoading: true, error: null });
      
      if (isDev) console.log('🔄 [RealtimeMenuStore] Refreshing menu data...');
      
      // ✅ CRITICAL FIX: Use brain API that handles image conversion properly
      const response = await brain.get_menu_with_ordering();
      const result = await response.json();
      
      if (result.success && result.data) {
        const menuData = result.data;
        const { categories, items } = menuData;
        
        // Map categories - ✅ FIX: Use parent_category_id directly from DB instead of mapping parent_id
        const mappedCategories = (categories || []).map((item: any) => ({
          ...item,
          // ✅ CRITICAL FIX: Don't overwrite parent_category_id with parent_id!
          // The database already has parent_category_id set correctly (e.g., "section-starters")
          // parent_id is a legacy field that may be null or UUID references
          parent_category_id: item.parent_category_id || item.parent_id, // Prefer parent_category_id
          active: item.is_active
        }));
        
        // Set categories and items with proper image_url from API
        get().setCategories(mappedCategories);
        get().setMenuItems(items || []);
        
        if (isDev) console.log('✅ [RealtimeMenuStore] Menu data set via API:', {
          categories: mappedCategories.length,
          items: items?.length || 0
        });
        
        // ✅ FIX: Fetch Set Meals BEFORE updating filtered items
        await get().fetchSetMeals();
      
        // Still fetch protein types, customizations, and variants separately
        await get().fetchSupplementaryData();
        
        // ✅ OPTIMIZATION: Call updateFilteredItems ONCE at the end
        get().updateFilteredItems();
      
        set({ isLoading: false, isConnected: true });
      
        const { categories: finalCategories, menuItems: finalMenuItems, setMeals } = get();
        if (isDev) console.log('✅ [RealtimeMenuStore] Menu data refreshed with ordering:', {
          categories: finalCategories.length,
          menuItems: finalMenuItems.length,
          setMeals: setMeals.length,
          parentCategories: finalCategories.filter(cat => !cat.parent_category_id && cat.active).length
        });
      } else {
        console.error('❌ Failed to fetch menu with ordering:', result.message);
        // Fallback to old method if new API fails
        await get().fallbackRefreshData();
      }
    } catch (error) {
      console.error('❌ Error refreshing menu data:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to refresh menu data',
        isLoading: false,
        isConnected: false
      });
      
      // Try fallback method
      try {
        if (isDev) console.log('🔄 Attempting fallback refresh...');
        await get().fallbackRefreshData();
        set({ isConnected: true });
      } catch (fallbackError) {
        console.error('❌ Fallback refresh also failed:', fallbackError);
        toast.error('Failed to refresh menu data');
      }
    }
  },
  
  // Fallback method using direct database queries
  fallbackRefreshData: async () => {
    const isDev = import.meta.env?.DEV;
    if (isDev) console.log('🔄 [RealtimeMenuStore] Using fallback data refresh method...');
    
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
      if (isDev) console.log('✅ [RealtimeMenuStore] Categories fetched:', categoriesResult.value.data?.length || 0);
      if (categoriesResult.value.data) {
        const mappedCategories = categoriesResult.value.data.map((item: any) => ({
          ...item,
          parent_category_id: item.parent_id,
          active: item.is_active
        }));
        get().setCategories(mappedCategories);
      }
    } else {
      console.error('❌ Error fetching categories:', categoriesResult.status === 'fulfilled' ? categoriesResult.value.error : categoriesResult.reason);
    }
    
    // Process menu items  
    if (itemsResult.status === 'fulfilled' && !itemsResult.value.error) {
      if (isDev) console.log('✅ [RealtimeMenuStore] Menu items fetched:', itemsResult.value.data?.length || 0);
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
    const isDev = import.meta.env?.DEV;
    try {
      // ✅ CRITICAL FIX: Use brain API instead of direct Supabase calls to ensure image_url conversion
      if (isDev) console.log('🔄 [RealtimeMenuStore] Fetching supplementary data via API...');
      
      // Use the main API that handles image conversion properly  
      const response = await brain.get_menu_with_ordering();
      const result = await response.json();
      
      if (result.success && result.data) {
        const menuData = result.data;
        console.log('✅ [RealtimeMenuStore] Supplementary data fetched via API:', {
          categories: menuData.categories?.length || 0,
          items: menuData.items?.length || 0
        });
        
        // Process the data that already has proper image_url conversion
        if (menuData.categories) {
          const mappedCategories = menuData.categories.map((item: any) => ({
            ...item,
            // ✅ FIX: Use parent_category_id from API (which has "section-xxx" format), only fallback to parent_id if null
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
            *,
            menu_protein_types:protein_type_id(id, name)
          `).order('menu_item_id')
        ];
        
        const results = await Promise.allSettled(dataPromises);
        const [proteinResult, customizationResult, variantsResult] = results;
        
        // Process protein types
        if (proteinResult.status === 'fulfilled' && !proteinResult.value.error && proteinResult.value.data) {
          console.log('✅ [RealtimeMenuStore] Protein types loaded:', proteinResult.value.data.length);
          get().setProteinTypes(proteinResult.value.data);
        } else {
          console.error('❌ [RealtimeMenuStore] Failed to load protein types:', proteinResult);
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
        console.error('❌ [RealtimeMenuStore] API failed for supplementary data:', result);
      }
      
    } catch (error) {
      console.error('❌ Error fetching supplementary data:', error);
    }
  },
  
  subscribeToChanges: () => {
    const isDev = import.meta.env?.DEV;
    // Prevent multiple subscription attempts
    if (subscriptionState.isSubscribing) {
      if (isDev) console.log('⏳ Subscription setup already in progress, skipping...');
      return;
    }
    
    subscriptionState.isSubscribing = true;
    
    try {
      if (isDev) console.log('🔔 Setting up real-time subscriptions...');
      
      // Cleanup existing subscriptions first
      cleanupSubscriptions();
      
      // Create new abort controller for this subscription setup
      subscriptionState.abortController = new AbortController();
      
      // Subscribe to menu_categories changes
      const categoriesChannel = supabase
        .channel('menu_categories_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'menu_categories'
        }, (payload) => {
          if (!subscriptionState.abortController?.signal.aborted) {
            if (isDev) console.log('📁 Categories changed:', payload.eventType);
            handleCategoriesChange(payload);
          }
        })
        .subscribe();
      
      subscriptionState.subscriptions.set('categories', categoriesChannel);
      
      // Subscribe to menu items changes
      const itemsChannel = supabase
        .channel('menu_items_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'menu_items'
        }, (payload) => {
          if (!subscriptionState.abortController?.signal.aborted) {
            if (isDev) console.log('🍽️ Menu items changed:', payload.eventType);
            handleMenuItemsChange(payload);
          }
        })
        .subscribe();
      
      subscriptionState.subscriptions.set('items', itemsChannel);
      
      // Subscribe to menu_customizations changes
      const customizationsChannel = supabase
        .channel('menu_customizations_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'menu_customizations'
        }, (payload) => {
          if (!subscriptionState.abortController?.signal.aborted) {
            if (isDev) console.log('⚙️ Customizations changed:', payload.eventType);
            handleCustomizationsChange(payload);
          }
        })
        .subscribe();
      
      subscriptionState.subscriptions.set('customizations', customizationsChannel);
      
      // Subscribe to menu_item_variants changes
      const variantsChannel = supabase
        .channel('menu_item_variants_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'menu_item_variants'
        }, (payload) => {
          if (!subscriptionState.abortController?.signal.aborted) {
            if (isDev) console.log('🔄 Variants changed:', payload.eventType);
            handleVariantsChange(payload);
          }
        })
        .subscribe();
      
      subscriptionState.subscriptions.set('variants', variantsChannel);
      
      set({ isConnected: true });
      subscriptionState.isSubscribing = false;
      
      if (isDev) console.log('✅ Real-time subscriptions established successfully');
      
    } catch (error) {
      console.error('❌ Error setting up subscriptions:', error);
      subscriptionState.isSubscribing = false;
      set({ isConnected: false, error: 'Failed to establish real-time connection' });
    }
  },
  
  unsubscribeFromChanges: () => {
    console.log('🔌 Unsubscribing from real-time changes...');
    cleanupSubscriptions();
    set({ isConnected: false });
  },
  
  triggerCorpusSync: async () => {
    const abortController = new AbortController();
    
    try {
      console.log('🔄 Triggering menu corpus sync...');
      
      // Create a timeout for the corpus sync
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, 10000); // 10 second timeout
      
      const response = await brain.sync_menu_corpus({ force: true });
      
      clearTimeout(timeoutId);
      
      if (abortController.signal.aborted) {
        console.log('🚫 Corpus sync aborted due to timeout');
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Menu corpus sync completed successfully');
        // Refresh the data after corpus sync
        await get().refreshData();
      } else {
        console.error('❌ Menu corpus sync failed:', result.message);
      }
      
    } catch (error) {
      if (abortController.signal.aborted) {
        console.log('🚫 Corpus sync was aborted');
        return;
      }
      
      console.error('❌ Error during corpus sync:', error);
      set({ error: 'Failed to sync menu corpus' });
    }
  },
  
  // NEW: Initialize data only without real-time subscriptions
  initializeDataOnly: async () => {
    const isDev = import.meta.env?.DEV;
    // Prevent concurrent menu store initializations
    if (isMenuStoreInitializing) {
      if (isDev) console.log('⏭️ [Menu Store] Already initializing, skipping duplicate request...');
      return;
    }
    
    const state = get();
    
    if (state.isLoading) {
      if (isDev) console.log('Menu store already initializing, skipping...');
      return;
    }
    
    // ✅ NEW: Check if bundle data is fresh (loaded within last 30 seconds)
    const timeSinceBundleLoad = Date.now() - bundleLoadTime;
    const isBundleFresh = timeSinceBundleLoad < 30000; // 30 seconds
    
    if (isBundleFresh && isDev) {
      console.log(`✨ [Bundle Init] Bundle is fresh (${(timeSinceBundleLoad / 1000).toFixed(1)}s old), skipping duplicate data fetch`);
    }
    
    isMenuStoreInitializing = true;
    set({ isLoading: true, error: null });
    
    try {
      if (isDev) console.log('🔄 [Bundle Init] Loading menu data without real-time subscriptions...');
      
      // Ensure Supabase is configured with correct credentials first
      const configSuccess = await ensureSupabaseConfigured();
      if (!configSuccess && isDev) {
        console.warn('⚠️ Failed to ensure Supabase configuration, proceeding with fallback');
      }
      
      // ✅ NEW: Only refresh data if bundle is NOT fresh
      if (!isBundleFresh) {
        if (isDev) console.log('🔄 [Bundle Init] Bundle is stale, fetching fresh data...');
        await state.refreshData();
      } else {
        if (isDev) console.log('⏭️ [Bundle Init] Using fresh bundle data, skipping refresh');
      }
      
      set({ 
        isLoading: false, 
        isConnected: false, // Mark as not connected since no subscriptions yet
        lastUpdate: Date.now()
      });
      
      if (isDev) console.log('✅ [Bundle Init] Menu data loaded successfully (subscriptions pending)');
      
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
    const isDev = import.meta.env?.DEV;
    const state = get();
    if (isDev) console.log('🚀 [Bundle Init] Starting real-time subscriptions after bundle completion...');
    
    // Start real-time subscriptions
    state.subscribeToChanges();
  },
  
  // Force full refresh method
  forceFullRefresh: async () => {
    const isDev = import.meta.env?.DEV;
    if (isDev) console.log('🔄 [RealtimeMenuStore] Force full refresh requested...');
    
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
    
    if (isDev) console.log('✅ [RealtimeMenuStore] Force full refresh completed');
  },
  
  // AI Context actions
  refreshAIContext: async () => {
    const isDev = import.meta.env?.DEV;
    const abortController = new AbortController();
    
    try {
      if (isDev) console.log('🔄 Refreshing AI context...');
      
      // Create a timeout for the context refresh
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, 10000); // 10 second timeout
      
      const response = await brain.refresh_ai_context();
      
      clearTimeout(timeoutId);
      
      if (abortController.signal.aborted) {
        if (isDev) console.log('🚫 AI context refresh aborted due to timeout');
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        if (isDev) console.log('✅ AI context refreshed successfully');
        // Update context status in store
        set({ aiContextLastUpdate: Date.now(), aiContextStatus: 'ready' });
      } else {
        console.error('❌ AI context refresh failed:', result.message);
        set({ aiContextStatus: 'error' });
      }
      
    } catch (error) {
      if (abortController.signal.aborted) {
        if (isDev) console.log('🚫 AI context refresh was aborted');
        return;
      }
      
      console.error('❌ Error refreshing AI context:', error);
      set({ aiContextStatus: 'error' });
    }
  },
  
  getAIMenuContext: async (options?: any) => {
    const isDev = import.meta.env?.DEV;
    try {
      if (isDev) console.log('🔍 Fetching AI menu context...');
      const response = await brain.get_ai_menu_context(options);
      const result = await response.json();
      
      if (result.success) {
        if (isDev) console.log('✅ AI context fetched successfully');
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
    const isDev = import.meta.env?.DEV;
    try {
      if (isDev) console.log('🔍 Validating AI menu item:', query);
      const response = await brain.validate_ai_menu_item(query, categoryFilter);
      const result = await response.json();
      
      if (result.success) {
        if (isDev) console.log('✅ AI validation successful');
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
    const isDev = import.meta.env?.DEV;
    if (isDev) console.log('🗑️ Invalidating AI context...');
    invalidateMenuContext();
    set({ aiContextStatus: 'idle' });
  },
  
  // Filtering methods
  setSelectedParentCategory: (categoryId: string | null) => {
    set({ selectedParentCategory: categoryId });
    get().updateFilteredItems();
  },
  
  setSelectedMenuCategory: (categoryId: string | null) => {
    const { categories } = get();
    const isDev = import.meta.env?.DEV;
    
    if (isDev) {
      console.log('🎯 [setSelectedMenuCategory] Called with:', categoryId);
      if (categoryId) {
        const category = categories.find(c => c.id === categoryId);
        console.log('🎯 [setSelectedMenuCategory] Category details:', category);
      }
    }
    
    set({ selectedMenuCategory: categoryId });
    get().updateFilteredItems();
  },
  
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().updateFilteredItems();
  },
  
  updateFilteredItems: () => {
    const isDev = import.meta.env?.DEV;
    const { menuItems, categories, selectedParentCategory, selectedMenuCategory, searchQuery, setMeals } = get();
    
    if (isDev) console.log('🔍 [updateFilteredItems] Called with:', {
      selectedParentCategory,
      selectedMenuCategory,
      searchQuery,
      totalMenuItems: menuItems.length,
      totalSetMeals: setMeals.length
    });

    let filtered = [...menuItems];

    // ✅ FIX: When no category is selected (null), show ALL items - don't filter!
    if (!selectedMenuCategory || selectedMenuCategory === 'all') {
      if (isDev) console.log('✅ [updateFilteredItems] No category filter - showing all items:', filtered.length);
      // Skip category filtering - show all items
    } else {
      // 1. Filter by parent category first (legacy support)
      if (selectedParentCategory && selectedParentCategory !== 'all') {
        const childCategoryIds = categories
          .filter(cat => cat.parent_category_id === selectedParentCategory && cat.active)
          .map(cat => cat.id);
        
        if (childCategoryIds.length > 0) {
          filtered = filtered.filter(item => childCategoryIds.includes(item.category_id));
        }
      }

      // 2. Filter by specific menu category (child category)
      if (isDev) {
        console.log('🎯 [Filter Debug] selectedMenuCategory:', selectedMenuCategory);
        console.log('🎯 [Filter Debug] First 3 menu items:', menuItems.slice(0, 3).map(i => ({ 
          name: i.name, 
          category_id: i.category_id 
        })));
        console.log('🎯 [Filter Debug] Categories:', categories.map(c => ({
          id: c.id,
          name: c.name,
          parent_category_id: c.parent_category_id
        })));
      }
      
      // ✅ NEW: Handle section-based filtering (synthetic parent categories)
      if (selectedMenuCategory.startsWith('section-')) {
        if (isDev) console.log('📂 [Filter Debug] Detected SECTION selection:', selectedMenuCategory);
        
        // This is a section - get all real categories that are children of this section
        const childCategoryIds = categories
          .filter(cat => cat.parent_category_id === selectedMenuCategory && cat.active)
          .map(cat => cat.id);
        
        if (isDev) console.log('📂 [Filter Debug] Child category IDs under section:', childCategoryIds);
        
        // Filter items by child category IDs
        filtered = filtered.filter(item => childCategoryIds.includes(item.category_id));
        
        if (isDev) console.log('📂 [Filter Debug] Filtered items count:', filtered.length);
      } else {
        if (isDev) console.log('📄 [Filter Debug] Detected REAL CATEGORY selection:', selectedMenuCategory);
        
        // This is a regular category - check if it's a parent with children
        const selectedCategory = categories.find(cat => cat.id === selectedMenuCategory);
        
        if (isDev) console.log('📄 [Filter Debug] Found category:', selectedCategory);
        
        if (selectedCategory && selectedCategory.parent_category_id && 
            selectedCategory.parent_category_id.startsWith('section-')) {
          // This is a real category under a section - just filter by this category
          if (isDev) console.log('✅ [Filter Debug] Real category under section - filtering by category_id:', selectedMenuCategory);
          
          // **DEBUG: Log items before filtering**
          if (isDev) console.log('✅ [Filter Debug] Items BEFORE filter:', filtered.map(i => ({ 
            name: i.name, 
            category_id: i.category_id,
            matches: i.category_id === selectedMenuCategory
          })));
          
          if (isDev) console.log('✅ [Filter Debug] Comparison check:', {
            selectedMenuCategory,
            selectedMenuCategoryType: typeof selectedMenuCategory,
            firstItemCategoryId: filtered[0]?.category_id,
            firstItemCategoryIdType: typeof filtered[0]?.category_id,
            strictMatch: filtered[0]?.category_id === selectedMenuCategory,
            looseMatch: filtered[0]?.category_id == selectedMenuCategory
          });
          
          filtered = filtered.filter(item => item.category_id === selectedMenuCategory);
          
          if (isDev) console.log('✅ [Filter Debug] Filtered items count:', filtered.length);
          if (isDev) console.log('✅ [Filter Debug] Sample filtered items:', filtered.slice(0, 3).map(i => ({ name: i.name, category_id: i.category_id })));
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

    // 3. Apply search filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) ||
        (item.menu_item_description?.toLowerCase() || '').includes(query)
      );
    }

    // 4. Combine with Set Meals converted to MenuItem format
    const setMealItems = get().convertSetMealsToMenuItems();
    const combinedItems = [...filtered, ...setMealItems];
    
    if (isDev) console.log('✅ [updateFilteredItems] Result:', {
      regularItems: filtered.length,
      setMealItems: setMealItems.length,
      combinedTotal: combinedItems.length,
      selectedCategory: selectedMenuCategory
    });

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
      // ✅ FIX: Preserve parent_category_id if it's already a valid section reference
      // Only fallback to mapCategoryToSection if parent_category_id is missing or invalid
      let finalParentId: string;
      
      if (cat.parent_category_id && cat.parent_category_id.startsWith('section-')) {
        // Already has a valid section parent - preserve it!
        finalParentId = cat.parent_category_id;
        if (isDev) console.log(`✅ [setCategories] Preserving section for "${cat.name}": ${finalParentId}`);
      } else {
        // No valid section parent - guess based on name/code_prefix
        const sectionId = mapCategoryToSection(cat);
        finalParentId = `section-${sectionId}`;
        if (isDev) console.log(`🔍 [setCategories] Mapping "${cat.name}" to guessed section: ${finalParentId}`);
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
    
    // ✅ OPTIMIZATION: Remove updateFilteredItems() call - will be called once at end of bundle load
    // get().updateFilteredItems();
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
    // ✅ OPTIMIZATION: Remove updateFilteredItems() call - updateDerivedData already calls it
    // get().updateFilteredItems();
  },
  
  setProteinTypes: (proteinTypes: ProteinType[]) => {
    set({ proteinTypes });
  },
  
  setCustomizations: (customizations: CustomizationBase[]) => {
    set({ customizations });
  },
  
  setItemVariants: (itemVariants: ItemVariant[]) => {
    set({ itemVariants });
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
    
    // ✅ OPTIMIZATION: Keep this call but make sure it's only called once per data refresh cycle
    get().updateFilteredItems();
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
    const isDev = import.meta.env?.DEV;
    try {
      if (isDev) console.log('🔄 [RealtimeMenuStore] Fetching Set Meals...');
      const response = await brain.list_set_meals({ active_only: true });
      const setMeals = response.json ? await response.json() : response;
      
      if (Array.isArray(setMeals)) {
        get().setSetMeals(setMeals);
        if (isDev) console.log('✅ [RealtimeMenuStore] Set Meals fetched:', { count: setMeals.length });
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
  }
}));

// Real-time event handlers
function handleCategoriesChange(payload: any) {
  const store = useRealtimeMenuStore.getState();
  const isDev = import.meta.env?.DEV;
  
  if (isDev) console.log('📁 [Real-time] Categories change detected:', {
    eventType: payload.eventType,
    category: payload.new || payload.old,
    parent_category_id: (payload.new || payload.old)?.parent_category_id
  });
  
  if (payload.eventType === 'INSERT') {
    const newCategory = {
      ...payload.new,
      // ✅ FIX: Use parent_category_id from DB ("section-xxx" format), only fallback to parent_id if null
      parent_category_id: payload.new.parent_category_id || payload.new.parent_id,
      active: payload.new.is_active ?? payload.new.active
    } as Category;
    
    if (isDev) console.log('➕ [Real-time] Adding new category:', newCategory);
    store.setCategories([...store.categories, newCategory]);
    toast.success(`Category "${newCategory.name}" added`);
  } else if (payload.eventType === 'UPDATE') {
    const updatedCategory = {
      ...payload.new,
      // ✅ FIX: Use parent_category_id from DB ("section-xxx" format), only fallback to parent_id if null
      parent_category_id: payload.new.parent_category_id || payload.new.parent_id,
      active: payload.new.is_active ?? payload.new.active
    } as Category;
    
    if (isDev) console.log('🔄 [Real-time] Updating category:', updatedCategory);
    
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
    console.log('⏭️ [POS Bundle] Bundle already loading, skipping duplicate request...');
    return false;
  }
  
  const store = useRealtimeMenuStore.getState();
  console.log('🚀 [POS Bundle] Loading lightweight bundle for fast startup...');
  
  isBundleLoading = true;
  
  try {
    store.setLoading(true);
    
    // Import brain dynamically to avoid circular imports
    const brain = (await import('brain')).default;
    const response = await brain.get_pos_bundle();
    const bundleData = await response.json();
    
    if (bundleData.success) {
      const isDev = import.meta.env?.DEV;
      if (isDev) console.log(`🚀 [POS Bundle] Loaded ${bundleData.data.categories.length} categories, ${bundleData.data.items.length} items (~${(bundleData.bundle_size_kb / 1024).toFixed(2)}KB)`);
      
      // Set bundle data immediately for fast rendering
      store.setCategories(bundleData.categories);
      
      // Convert bundle items to menu items format with skeleton state
      const bundleMenuItems = bundleData.items.map((item: any) => ({
        ...item,
        variants: [], // Will be loaded on-demand
        menu_item_description: null, // Will be loaded on-demand
        dietary_tags: null, // Will be loaded on-demand
        // Mark as skeleton state to prevent full data loading until needed
        _isSkeletonState: true,
        // ✅ FIXED: Preserve image_url from bundle instead of setting to null
        // image_url is already provided by the bundle endpoint
      }));
      
      store.setMenuItems(bundleMenuItems);
      store.setLoading(false);
      store.setError(null);
      
      // Mark as bundle-loaded for faster subsequent access
      store.lastUpdate = Date.now();
      bundleLoadTime = Date.now(); // Track bundle load time globally
      
      // ✅ REMOVED: Don't start background data loading or subscriptions automatically
      // Let user interaction trigger subscriptions for faster perceived performance
      if (isDev) console.log('⏭️ [POS Bundle] Bundle loaded. Real-time subscriptions will start on first interaction or after 15s.');
      
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
  console.log(`🔍 [POS Bundle] Loading full details for item ${itemId}...`);
  
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
  console.log(`🔍 [POS Bundle] Loading full items for category ${categoryId}...`);
  
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

// NEW: Start real-time subscriptions with lazy loading support
export const startRealtimeSubscriptionsIfNeeded = () => {
  const store = useRealtimeMenuStore.getState();
  const isDev = import.meta.env?.DEV;
  
  if (!realtimeSubscriptionsStarted) {
    if (isDev) console.log('🚀 [Realtime] Starting subscriptions on user interaction...');
    store.subscribeToChanges();
  }
};

// Cleanup function for app unmount
export const cleanupRealtimeMenuStore = () => {
  useRealtimeMenuStore.getState().unsubscribeFromChanges();
};
