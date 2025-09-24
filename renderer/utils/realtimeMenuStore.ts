


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
  setMeals: SetMeal[]; // Add Set Meals to store
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
  convertSetMealsToMenuItems: () => MenuItem[]; // Convert Set Meals to MenuItem format
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
  console.log('🧹 Cleaning up real-time subscriptions...');
  
  subscriptionState.subscriptions.forEach((subscription, channelName) => {
    try {
      supabase.removeChannel(subscription);
      console.log(`✅ Cleaned up subscription: ${channelName}`);
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
    // Prevent concurrent menu store initializations
    if (isMenuStoreInitializing) {
      console.log('⏭️ [Menu Store] Already initializing, skipping duplicate request...');
      return;
    }
    
    const state = get();
    
    if (state.isLoading) {
      console.log('Menu store already initializing, skipping...');
      return;
    }
    
    isMenuStoreInitializing = true;
    set({ isLoading: true, error: null });
    
    // Create abort controller for this initialization
    const abortController = new AbortController();
    
    try {
      console.log('Initializing real-time menu store...');
      
      // Ensure Supabase is configured with correct credentials first
      console.log('🔧 Ensuring Supabase configuration is correct...');
      const configSuccess = await ensureSupabaseConfigured();
      if (!configSuccess) {
        console.warn('⚠️ Failed to ensure Supabase configuration, proceeding with fallback');
      }
      
      // Check if initialization was aborted
      if (abortController.signal.aborted) {
        console.log('🚫 Menu store initialization aborted');
        return;
      }
      
      // Load initial data
      await state.refreshData();
      
      // Check again after async operation
      if (abortController.signal.aborted) {
        console.log('🚫 Menu store initialization aborted after data refresh');
        return;
      }
      
      // Set up real-time subscriptions
      state.subscribeToChanges();
      
      set({ 
        isLoading: false, 
        isConnected: true,
        lastUpdate: Date.now()
      });
      
      console.log('✅ Real-time menu store initialized successfully');
      
    } catch (error) {
      if (abortController.signal.aborted) {
        console.log('🚫 Menu store initialization was aborted');
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
    try {
      set({ isLoading: true, error: null });
      
      console.log('🔄 [RealtimeMenuStore] Refreshing menu data with hierarchical ordering...');
      
      // Use the new hierarchical ordering API instead of manual queries
      const response = await brain.get_menu_with_ordering();
      const result = await response.json();
      
      if (result.success && result.data) {
        const menuData = result.data;
        console.log('✅ [RealtimeMenuStore] Menu data fetched with ordering:', {
          categories: menuData.categories?.length || 0,
          items: menuData.items?.length || 0
        });
        
        // Process flat array structure from API
        const allCategories: Category[] = [];
        const allMenuItems: MenuItem[] = [];
        
        // Process categories - they come as a flat array
        if (menuData.categories && Array.isArray(menuData.categories)) {
          menuData.categories.forEach((category: any) => {
            allCategories.push({
              id: category.id,
              name: category.name,
              description: category.description || '',
              display_order: category.display_order || 0,
              print_order: category.print_order || 0,
              print_to_kitchen: category.print_to_kitchen || true,
              image_url: category.image_url,
              parent_category_id: category.parent_category_id || category.parent_id,
              active: category.active !== undefined ? category.active : category.is_active
            });
          });
        }
        
        // Process menu items - they come as a flat array
        if (menuData.items && Array.isArray(menuData.items)) {
          menuData.items.forEach((item: any) => {
            allMenuItems.push({
              ...item,
              active: item.active !== undefined ? item.active : item.is_active,
              display_order: item.display_order || item.menu_order || 0
            });
          });
        }
        
        // 🔍 DEBUG: Log first few items to check image_url
        console.log('🔍 [RealtimeMenuStore] First 3 processed menu items:');
        allMenuItems.slice(0, 3).forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.name}:`);
          console.log(`     - image_url: ${item.image_url || 'NULL'}`);
          console.log(`     - has image_url property: ${item.hasOwnProperty('image_url')}`);
        });
        
        // Update store with processed data
        get().setCategories(allCategories);
        get().setMenuItems(allMenuItems);
        
        console.log('✅ [RealtimeMenuStore] Data processed successfully:', {
          totalCategories: allCategories.length,
          totalItems: allMenuItems.length
        });
        
      } else {
        console.error('❌ Failed to fetch menu with ordering:', result.message);
        // Fallback to old method if new API fails
        await get().fallbackRefreshData();
      }
      
      // Still fetch protein types, customizations, and variants separately
      await get().fetchSupplementaryData();
      
      // Fetch Set Meals
      await get().fetchSetMeals();
      
      // Update derived data
      get().updateDerivedData();
      
      set({ isLoading: false, isConnected: true });
      
      const { categories, menuItems, setMeals } = get();
      console.log('✅ [RealtimeMenuStore] Menu data refreshed with ordering:', {
        categories: categories.length,
        menuItems: menuItems.length,
        setMeals: setMeals.length,
        parentCategories: categories.filter(cat => !cat.parent_category_id && cat.active).length
      });
    } catch (error) {
      console.error('❌ Error refreshing menu data:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to refresh menu data',
        isLoading: false,
        isConnected: false
      });
      
      // Try fallback method
      try {
        console.log('🔄 Attempting fallback refresh...');
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
    console.log('🔄 [RealtimeMenuStore] Using fallback data refresh method...');
    
    // Ensure Supabase client is properly configured first
    await ensureSupabaseConfigured();
    
    // Fetch all data in parallel with proper error handling
    const dataPromises = [
      supabase.from('menu_categories').select('*').order('menu_order'),
      supabase.from('menu_items').select('*').eq('active', true).order('menu_order'),
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
      console.log('✅ [RealtimeMenuStore] Categories fetched:', categoriesResult.value.data?.length || 0);
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
      console.log('✅ [RealtimeMenuStore] Menu items fetched:', itemsResult.value.data?.length || 0);
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
    } catch (error) {
      console.error('❌ Error fetching supplementary data:', error);
    }
  },
  
  subscribeToChanges: () => {
    // Prevent multiple subscription attempts
    if (subscriptionState.isSubscribing) {
      console.log('⏳ Subscription setup already in progress, skipping...');
      return;
    }
    
    subscriptionState.isSubscribing = true;
    
    try {
      console.log('🔔 Setting up real-time subscriptions...');
      
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
            console.log('📁 Categories changed:', payload.eventType);
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
            console.log('🍽️ Menu items changed:', payload.eventType);
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
            console.log('⚙️ Customizations changed:', payload.eventType);
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
            console.log('🔄 Variants changed:', payload.eventType);
            handleVariantsChange(payload);
          }
        })
        .subscribe();
      
      subscriptionState.subscriptions.set('variants', variantsChannel);
      
      set({ isConnected: true });
      subscriptionState.isSubscribing = false;
      
      console.log('✅ Real-time subscriptions established successfully');
      
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
    // Prevent concurrent menu store initializations
    if (isMenuStoreInitializing) {
      console.log('⏭️ [Menu Store] Already initializing, skipping duplicate request...');
      return;
    }
    
    const state = get();
    
    if (state.isLoading) {
      console.log('Menu store already initializing, skipping...');
      return;
    }
    
    isMenuStoreInitializing = true;
    set({ isLoading: true, error: null });
    
    try {
      console.log('🔄 [Bundle Init] Loading menu data without real-time subscriptions...');
      
      // Ensure Supabase is configured with correct credentials first
      const configSuccess = await ensureSupabaseConfigured();
      if (!configSuccess) {
        console.warn('⚠️ Failed to ensure Supabase configuration, proceeding with fallback');
      }
      
      // Load initial data only
      await state.refreshData();
      
      set({ 
        isLoading: false, 
        isConnected: false, // Mark as not connected since no subscriptions yet
        lastUpdate: Date.now()
      });
      
      console.log('✅ [Bundle Init] Menu data loaded successfully (subscriptions pending)');
      
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
    console.log('🚀 [Bundle Init] Starting real-time subscriptions after bundle completion...');
    
    // Start real-time subscriptions
    state.subscribeToChanges();
  },
  
  // Force full refresh method
  forceFullRefresh: async () => {
    console.log('🔄 [RealtimeMenuStore] Force full refresh requested...');
    
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
    
    console.log('✅ [RealtimeMenuStore] Force full refresh completed');
  },
  
  // Filtering methods
  setSelectedParentCategory: (categoryId: string | null) => {
    set({ selectedParentCategory: categoryId });
    get().updateFilteredItems();
  },
  
  setSelectedMenuCategory: (categoryId: string | null) => {
    const { categories } = get();
    
    set({ selectedMenuCategory: categoryId });
    get().updateFilteredItems();
  },
  
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().updateFilteredItems();
  },
  
  updateFilteredItems: () => {
    const { menuItems, categories, selectedParentCategory, selectedMenuCategory, searchQuery } = get();
    
    // Get regular menu items
    let filtered = menuItems.filter(item => item.active);
    
    // Get Set Meals converted to MenuItem format
    const setMealMenuItems = get().convertSetMealsToMenuItems();
    
    // Combine regular menu items with Set Meals
    const allMenuItems = [...filtered, ...setMealMenuItems];
    
    // Apply search filter to combined items
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = allMenuItems.filter(item => 
        item.name.toLowerCase().includes(query) ||
        (item.menu_item_description?.toLowerCase() || '').includes(query)
      );
    }
    // Apply category filtering
    else {
      filtered = allMenuItems;
      
      // Find SET MEALS category dynamically
      const setMealsCategory = categories.find(cat => cat.name === 'SET MEALS');
      
      // Check if the selected category is SET MEALS
      if (setMealsCategory && (selectedParentCategory === setMealsCategory.id || selectedMenuCategory === setMealsCategory.id)) {
        // Filter for SET MEALS category - show only set meal items
        filtered = filtered.filter(item => {
          const isSetMeal = (item as any).item_type === 'set_meal';
          return isSetMeal || (item.category_id === setMealsCategory.id && (item as any).is_set_meal === true);
        });
      }
      // Handle fixed parent category selection
      else if (selectedParentCategory && 
               ['starters', 'main-course', 'side-dishes', 'accompaniments', 'desserts-coffee', 'drinks-wine'].includes(selectedParentCategory)) {
        
        const fixedCategories = [
          { id: 'starters', label: 'STARTERS', mappedNames: ['Starters', 'Appetizers', 'Appetizer', 'Hot Appetizers'] },
          { id: 'main-course', label: 'MAIN COURSE', mappedNames: ['Main Course', 'Mains', 'Main Courses', 'Tandoori Main Course', 'Tandoori Specialities', 'Chicken Dishes', 'Lamb Dishes', 'Seafood', 'Vegetarian Mains'] },
          { id: 'side-dishes', label: 'SIDE DISHES', mappedNames: ['Side Dishes', 'Sides', 'Rice', 'Bread', 'Naan', 'Rice Dishes'] },
          { id: 'accompaniments', label: 'ACCOMPANIMENTS', mappedNames: ['Accompaniments', 'Sauces', 'Condiments', 'Chutneys'] },
          { id: 'desserts-coffee', label: 'DESSERTS & COFFEE', mappedNames: ['Desserts & Coffee', 'Coffee & Desserts', 'Desserts', 'Sweet', 'Coffee', 'Ice Cream'] },
          { id: 'drinks-wine', label: 'DRINKS & WINE', mappedNames: ['Drinks & Wine', 'Drinks', 'Beverages', 'Wine', 'Alcohol', 'Soft Drinks'] }
        ];
        
        const currentFixedCategory = fixedCategories.find(cat => cat.id === selectedParentCategory);
        if (currentFixedCategory) {
          // Get all categories that match this fixed parent
          const matchingCategoryIds = categories
            .filter(dbCategory => 
              currentFixedCategory.mappedNames.some(mappedName => 
                dbCategory.name.toLowerCase().includes(mappedName.toLowerCase()) ||
                mappedName.toLowerCase().includes(dbCategory.name.toLowerCase())
              ) && dbCategory.active
            )
            .map(cat => cat.id);
          
          // If a specific subcategory is selected, filter by that
          if (selectedMenuCategory) {
            filtered = filtered.filter(item => item.category_id === selectedMenuCategory);
          } else {
            // Show all items from matching categories
            filtered = filtered.filter(item => matchingCategoryIds.includes(item.category_id));
          }
        }
      }
      // Handle specific subcategory selection (fallback for direct category selection)
      else if (selectedMenuCategory) {
        // Check if selectedMenuCategory is a parent category
        const selectedCategory = categories.find(cat => cat.id === selectedMenuCategory);
        
        if (selectedCategory && selectedCategory.parent_category_id === null) {
          // This is a parent category - find all child categories
          const childCategoryIds = categories
            .filter(cat => cat.parent_category_id === selectedMenuCategory && cat.active)
            .map(cat => cat.id);
          
          // Filter by child category IDs
          filtered = filtered.filter(item => childCategoryIds.includes(item.category_id));
        } else {
          // This is a regular category - filter normally
          filtered = filtered.filter(item => item.category_id === selectedMenuCategory);
        }
      }
    }
    
    // Sort filtered items by menu_order
    const sortedFiltered = filtered.sort((a, b) => {
      const aOrder = a.display_order || 999;
      const bOrder = b.display_order || 999;
      return aOrder - bOrder;
    });
    
    set({ filteredMenuItems: sortedFiltered });
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
    set({ categories });
    get().updateDerivedData();
    get().updateFilteredItems();
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
    get().updateFilteredItems();
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
    
    // Update filtered items after derived data changes
    get().updateFilteredItems();
    
    // Update filtered items after derived data changes
    get().updateFilteredItems();
  },
  
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
  setConnected: (isConnected: boolean) => set({ isConnected }),

  // Set Meals methods
  setSetMeals: (setMeals: SetMeal[]) => {
    set({ setMeals });
    // Update filtered items to include Set Meals converted to MenuItems
    get().updateFilteredItems();
  },

  fetchSetMeals: async () => {
    try {
      console.log('🔄 [RealtimeMenuStore] Fetching Set Meals...');
      const response = await brain.list_set_meals({ active_only: true });
      const setMeals = response.json ? await response.json() : response;
      
      if (Array.isArray(setMeals)) {
        get().setSetMeals(setMeals);
        console.log('✅ [RealtimeMenuStore] Set Meals fetched:', { count: setMeals.length });
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
  }
}));

// Real-time event handlers
function handleCategoriesChange(payload: any) {
  const store = useRealtimeMenuStore.getState();
  
  if (payload.eventType === 'INSERT') {
    const newCategory = payload.new as Category;
    store.setCategories([...store.categories, newCategory]);
    toast.success(`Category "${newCategory.name}" added`);
  } else if (payload.eventType === 'UPDATE') {
    const updatedCategory = payload.new as Category;
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
      console.log(`🚀 [POS Bundle] Loaded ${bundleData.total_categories} categories, ${bundleData.total_items} items (~${bundleData.bundle_size_kb}KB)`);
      
      // Set bundle data immediately for fast rendering
      store.setCategories(bundleData.categories);
      
      // Convert bundle items to menu items format with skeleton state
      const bundleMenuItems = bundleData.items.map((item: any) => ({
        ...item,
        variants: [], // Will be loaded on-demand
        menu_item_description: null, // Will be loaded on-demand
        dietary_tags: null, // Will be loaded on-demand
        // Mark as skeleton state to prevent image loading
        _isSkeletonState: true,
        // Keep basic fields for display
        display_image_url: null // Don't show any image during skeleton state
      }));
      
      store.setMenuItems(bundleMenuItems);
      store.setLoading(false);
      store.setError(null);
      
      // Mark as bundle-loaded for faster subsequent access
      store.lastUpdate = Date.now();
      
      // Start background loading of full data immediately (parallel to bundle completion)
      console.log('🔄 [POS Bundle] Starting parallel background full data load...');
      // Don't wait - start background loading immediately for faster overall performance
      Promise.resolve().then(() => {
        store.initializeDataOnly(); // This will load full data and replace skeleton items
      });
      
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

// Cleanup function for app unmount
export const cleanupRealtimeMenuStore = () => {
  useRealtimeMenuStore.getState().unsubscribeFromChanges();
};
