/**
 * Menu data caching utility with TTL and smart invalidation
 * 
 * This utility provides caching functionality for menu data to improve performance
 * while ensuring data stays current with automatic invalidation when updates are made.
 */

import { create } from 'zustand';
import { Category, MenuItem, ProteinType, ItemVariant, CustomizationBase } from './menuTypes';
import { supabase } from './supabaseClient';
import { useSimpleAuth } from './simple-auth-context';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { useEffect, useRef } from 'react';

// Default TTL (time to live) in milliseconds
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface MenuCache {
  // Cache storage
  categories: CacheItem<Category[]> | null;
  menuItems: CacheItem<MenuItem[]> | null;
  menuItemsByCategory: Record<string, CacheItem<MenuItem[]>>;
  proteinTypes: CacheItem<ProteinType[]> | null;
  itemVariants: CacheItem<ItemVariant[]> | null;
  customizations: CacheItem<CustomizationBase[]> | null;
  
  // Cache getters with automatic expiration checking
  getCategories: () => Category[] | null;
  getMenuItems: () => MenuItem[] | null;
  getMenuItemsByCategory: (categoryId: string) => MenuItem[] | null;
  getProteinTypes: () => ProteinType[] | null;
  getItemVariants: () => ItemVariant[] | null;
  getCustomizations: () => CustomizationBase[] | null;
  
  // Cache setters
  setCategories: (data: Category[], ttl?: number) => void;
  setMenuItems: (data: MenuItem[], ttl?: number) => void;
  setMenuItemsByCategory: (categoryId: string, data: MenuItem[], ttl?: number) => void;
  setProteinTypes: (data: ProteinType[], ttl?: number) => void;
  setItemVariants: (data: ItemVariant[], ttl?: number) => void;
  setCustomizations: (data: CustomizationBase[], ttl?: number) => void;
  
  // Cache invalidation
  invalidateCache: () => void;
  invalidateMenuItems: () => void;
  invalidateCategories: () => void;
  invalidateProteinTypes: () => void;
  invalidateItemVariants: () => void;
  invalidateMenuItemsByCategory: (categoryId?: string) => void;
  invalidateCustomizations: () => void;
  
  // Check if cache is fresh
  isCacheValid: <T>(cache: CacheItem<T> | null) => boolean;
}

export const useMenuCache = create<MenuCache>((set, get) => ({
  // Initial cache state
  categories: null,
  menuItems: null,
  menuItemsByCategory: {},
  proteinTypes: null,
  itemVariants: null,
  customizations: null,
  
  // Check if cache is valid (not expired)
  isCacheValid: <T>(cache: CacheItem<T> | null): boolean => {
    if (!cache) return false;
    const now = Date.now();
    return now - cache.timestamp < cache.ttl;
  },
  
  // Cache getters with expiration checking
  getCategories: () => {
    const cache = get().categories;
    return get().isCacheValid(cache) ? cache?.data : null;
  },
  
  getMenuItems: () => {
    const cache = get().menuItems;
    return get().isCacheValid(cache) ? cache?.data : null;
  },
  
  getMenuItemsByCategory: (categoryId: string) => {
    const cache = get().menuItemsByCategory[categoryId];
    return get().isCacheValid(cache) ? cache?.data : null;
  },
  
  getProteinTypes: () => {
    const cache = get().proteinTypes;
    return get().isCacheValid(cache) ? cache?.data : null;
  },
  
  getItemVariants: () => {
    const cache = get().itemVariants;
    return get().isCacheValid(cache) ? cache?.data : null;
  },
  
  getCustomizations: () => {
    const cache = get().customizations;
    return get().isCacheValid(cache) ? cache?.data : null;
  },
  
  // Cache setters
  setCategories: (data: Category[], ttl = DEFAULT_TTL) => {
    set({
      categories: {
        data,
        timestamp: Date.now(),
        ttl
      }
    });
  },
  
  setMenuItems: (data: MenuItem[], ttl = DEFAULT_TTL) => {
    set({
      menuItems: {
        data,
        timestamp: Date.now(),
        ttl
      }
    });
  },
  
  setMenuItemsByCategory: (categoryId: string, data: MenuItem[], ttl = DEFAULT_TTL) => {
    set((state) => ({
      menuItemsByCategory: {
        ...state.menuItemsByCategory,
        [categoryId]: {
          data,
          timestamp: Date.now(),
          ttl
        }
      }
    }));
  },
  
  setProteinTypes: (data: ProteinType[], ttl = DEFAULT_TTL) => {
    set({
      proteinTypes: {
        data,
        timestamp: Date.now(),
        ttl
      }
    });
  },
  
  setItemVariants: (data: ItemVariant[], ttl = DEFAULT_TTL) => {
    set({
      itemVariants: {
        data,
        timestamp: Date.now(),
        ttl
      }
    });
  },
  
  setCustomizations: (data: CustomizationBase[], ttl = DEFAULT_TTL) => {
    set({
      customizations: {
        data,
        timestamp: Date.now(),
        ttl
      }
    });
  },
  
  // Cache invalidation methods
  invalidateCache: () => {
    set({
      categories: null,
      menuItems: null,
      menuItemsByCategory: {},
      proteinTypes: null,
      itemVariants: null,
      customizations: null
    });
    console.log('Menu cache completely invalidated');
  },
  
  invalidateMenuItems: () => {
    set({
      menuItems: null,
      menuItemsByCategory: {}
    });
    console.log('Menu items cache invalidated');
  },
  
  invalidateCategories: () => {
    set({ categories: null });
    console.log('Categories cache invalidated');
  },
  
  invalidateProteinTypes: () => {
    set({ proteinTypes: null });
    console.log('Protein types cache invalidated');
  },
  
  invalidateItemVariants: () => {
    set({ itemVariants: null });
    console.log('Item variants cache invalidated');
  },
  
  /**
   * Invalidate menu items by category
   * When categoryId is provided, only invalidate cache for that category
   * When no categoryId is provided, invalidate all category caches
   */
  invalidateMenuItemsByCategory: (categoryId?: string) => {
    if (categoryId) {
      set((state) => {
        const updatedMenuItemsByCategory = { ...state.menuItemsByCategory };
        delete updatedMenuItemsByCategory[categoryId];
        return { menuItemsByCategory: updatedMenuItemsByCategory };
      });
      console.log(`Menu items cache for category ${categoryId} invalidated`);
    } else {
      set({ menuItemsByCategory: {} });
      console.log('All menu items by category cache invalidated');
    }
  },
  
  invalidateCustomizations: () => {
    set({ customizations: null });
    console.log('Customizations cache invalidated');
  }
}));

// Cache variables for the useMenuData hook with cache change listeners
let categoriesCache: Category[] | null = null;
let categoriesLastFetch = 0;
let categoriesFetchPromise: Promise<Category[]> | null = null;

let menuItemsCache: MenuItem[] | null = null;
let menuItemsLastFetch = 0;
let menuItemsFetchPromise: Promise<MenuItem[]> | null = null;

let proteinTypesCache: ProteinType[] | null = null;
let proteinTypesLastFetch = 0;
let proteinTypesFetchPromise: Promise<ProteinType[]> | null = null;

let customizationsCache: CustomizationBase[] | null = null;
let customizationsLastFetch = 0;
let customizationsFetchPromise: Promise<CustomizationBase[]> | null = null;

// Cache change listeners for reactive updates
type CacheChangeListener = () => void;
let cacheChangeListeners: CacheChangeListener[] = [];

// Function to add cache change listener
const addCacheChangeListener = (listener: CacheChangeListener) => {
  cacheChangeListeners.push(listener);
  return () => {
    cacheChangeListeners = cacheChangeListeners.filter(l => l !== listener);
  };
};

// Function to notify listeners when cache changes
const notifyCacheChange = () => {
  cacheChangeListeners.forEach(listener => {
    try {
      listener();
    } catch (error) {
      console.error('Error in cache change listener:', error);
    }
  });
};

// Cache TTL constant for direct fetching
const CACHE_TTL = 30 * 1000; // 30 seconds for dev - temporarily reduced to catch code generation updates faster

export function useMenuData() {
  const { isLoading, isAdmin } = useSimpleAuth();
  
  // Function to check for published menu refresh events (can be called manually)
  const checkForRefreshEvents = async () => {
    try {
      const response = await apiClient.get_storage_item({ key: 'menu_refresh_event' });
      const eventData = await response.json();
      
      if (eventData?.data?.event_type === 'menu_published') {
        const lastCheckKey = 'last_menu_refresh_check';
        const lastCheck = localStorage.getItem(lastCheckKey);
        const eventTimestamp = eventData.data.timestamp;
        
        // Only refresh if this is a new event we haven't seen before
        if (!lastCheck || eventTimestamp > lastCheck) {
          console.log('🔄 [OnlineOrders] Detected menu publish event, refreshing...', {
            eventId: eventData.data.trigger_id,
            timestamp: eventTimestamp
          });
          
          // Invalidate all menu-related caches
          invalidateCache();
          
          // Store this event timestamp so we don't refresh again for the same event
          localStorage.setItem(lastCheckKey, eventTimestamp);
          
          // Optional: Show user feedback
          toast.success('Menu updated! Refreshing data...');
          
          return true; // Indicate that refresh occurred
        }
      }
      return false; // No refresh needed
    } catch (error) {
      // Silently handle errors - the backend endpoint might not exist yet
      console.debug('No refresh events detected (this is normal)');
      return false;
    }
  };
  
  // Function to force refresh all menu data
  const forceRefresh = async () => {
    console.log('🔄 [OnlineOrders] Force refreshing all menu data...');
    
    // Clear all caches
    invalidateCache();
    
    // Trigger a fresh fetch of all data
    try {
      await Promise.all([
        fetchCategories(),
        fetchMenuItems(),
        fetchProteinTypes(),
        fetchCustomizations()
      ]);
      
      console.log('✅ [OnlineOrders] Force refresh completed');
      toast.success('Menu data refreshed successfully!');
      return true;
    } catch (error) {
      console.error('❌ [OnlineOrders] Force refresh failed:', error);
      toast.error('Failed to refresh menu data');
      return false;
    }
  };

  // Function to fetch categories from the database
  const fetchCategories = async (): Promise<Category[]> => {
    // Check if we have a valid cache
    const now = Date.now();
    if (categoriesCache && now - categoriesLastFetch < CACHE_TTL) {
      return categoriesCache;
    }
    
    // If we have an ongoing fetch, return that promise
    if (categoriesFetchPromise) {
      return categoriesFetchPromise;
    }
    
    // Otherwise, fetch from the database
    categoriesFetchPromise = new Promise(async (resolve, reject) => {
      try {
        const { data, error } = await supabase
          .from('menu_categories')
          .select('id, name, description, sort_order, print_order, display_print_order, is_active, created_at, category_prefix, parent_category_id')
          .order('sort_order');
        
        if (error) throw error;
        
        // Map database columns to TypeScript interface - fix field mappings
        const mappedData = (data || []).map((item: any) => ({
          ...item,
          display_order: item.sort_order,        // Map sort_order to display_order for frontend compatibility
          active: item.is_active,               // Map is_active to active for frontend compatibility
          // parent_category_id now comes from database
          image_url: null,                      // Default - no image_url in current schema
          print_to_kitchen: true,               // Default - not in schema
          code_prefix: item.category_prefix     // Map category_prefix to code_prefix
        }));
        
        // Update cache
        categoriesCache = mappedData;
        categoriesLastFetch = Date.now();
        categoriesFetchPromise = null;
        
        resolve(categoriesCache);
      } catch (error) {
        console.error('Error fetching categories:', error);
        categoriesFetchPromise = null;
        reject(error);
      }
    });
    
    return categoriesFetchPromise;
  };

  // Function to fetch menu items from the database
  const fetchMenuItems = async (): Promise<MenuItem[]> => {
    // Check if we have a valid cache
    const now = Date.now();
    if (menuItemsCache && now - menuItemsLastFetch < CACHE_TTL) {
      return menuItemsCache;
    }
    
    // If we have an ongoing fetch, return that promise
    if (menuItemsFetchPromise) {
      return menuItemsFetchPromise;
    }
    
    // Otherwise, fetch from the brain API endpoint
    menuItemsFetchPromise = new Promise(async (resolve, reject) => {
      try {
        // Use brain endpoint to get complete menu items with variants
        const response = await apiClient.get_menu_items({});
        const data = await response.json();
        
        // Update cache
        menuItemsCache = data || [];
        menuItemsLastFetch = Date.now();
        menuItemsFetchPromise = null;
        
        resolve(menuItemsCache);
      } catch (error) {
        console.error('Error fetching menu items:', error);
        menuItemsFetchPromise = null;
        reject(error);
      }
    });
    
    return menuItemsFetchPromise;
  };

  // Function to fetch protein types from the database
  const fetchProteinTypes = async (): Promise<ProteinType[]> => {
    // Check if we have a valid cache
    const now = Date.now();
    if (proteinTypesCache && now - proteinTypesLastFetch < CACHE_TTL) {
      return proteinTypesCache;
    }
    
    // If we have an ongoing fetch, return that promise
    if (proteinTypesFetchPromise) {
      return proteinTypesFetchPromise;
    }
    
    // Otherwise, fetch from the database
    proteinTypesFetchPromise = new Promise(async (resolve, reject) => {
      try {
        const { data, error } = await supabase
          .from('menu_protein_types')
          .select('*')
          .order('name'); // Changed from display_order to name since display_order column doesn't exist
        
        if (error) throw error;
        
        // Update cache
        proteinTypesCache = data || [];
        proteinTypesLastFetch = Date.now();
        proteinTypesFetchPromise = null;
        
        resolve(proteinTypesCache);
      } catch (error) {
        console.error('Error fetching protein types:', error);
        proteinTypesFetchPromise = null;
        reject(error);
      }
    });
    
    return proteinTypesFetchPromise;
  };
  
  // Function to fetch item variants
  const fetchItemVariants = async (): Promise<ItemVariant[]> => {
    try {
      const { data, error } = await supabase
        .from('menu_item_variants')
        .select(`
          *,
          variant_code,
          menu_protein_types (name)
        `);
      
      if (error) throw error;
      
      // Map the response to include protein_type_name derived from the join and handle field mapping
      return data.map((variant: any) => ({
        ...variant,
        name: variant.variant_name, // Map database field variant_name to interface field name
        protein_type_name: variant.menu_protein_types ? variant.menu_protein_types.name : null
      }));
    } catch (error) {
      console.error('Error fetching item variants:', error);
      return [];
    }
  };
  
  // Function to fetch customizations
  const fetchCustomizations = async (): Promise<CustomizationBase[]> => {
    // Check if we have a valid cache
    const now = Date.now();
    if (customizationsCache && now - customizationsLastFetch < CACHE_TTL) {
      return customizationsCache;
    }
    
    // If we have an ongoing fetch, return that promise
    if (customizationsFetchPromise) {
      return customizationsFetchPromise;
    }
    
    // Otherwise, fetch from the API
    customizationsFetchPromise = new Promise(async (resolve, reject) => {
      try {
        // Get all customizations from the API
        const response = await apiClient.get_customizations({});
        const data = await response.json();
        
        if (!data || !data.customizations) {
          console.warn('No customizations data returned from API');
          // Return empty array instead of throwing error
          customizationsCache = [];
          customizationsLastFetch = Date.now();
          customizationsFetchPromise = null;
          resolve([]);
          return;
        }
        
        // Update cache
        customizationsCache = data.customizations || [];
        customizationsLastFetch = Date.now();
        customizationsFetchPromise = null;
        
        resolve(customizationsCache);
      } catch (error) {
        console.error('Error fetching customizations:', error);
        toast.error('Failed to load customizations');
        customizationsFetchPromise = null;
        reject(error);
      }
    });
    
    return customizationsFetchPromise;
  };

  // Function to invalidate the cache
  const invalidateCache = () => {
    console.log('🗑️ Complete cache invalidated', { timestamp: new Date().toISOString() });
    categoriesCache = null;
    menuItemsCache = null;
    proteinTypesCache = null;
    customizationsCache = null;
    categoriesLastFetch = 0;
    menuItemsLastFetch = 0;
    proteinTypesLastFetch = 0;
    customizationsLastFetch = 0;
    
    // Also clear any ongoing promises
    categoriesFetchPromise = null;
    menuItemsFetchPromise = null;
    proteinTypesFetchPromise = null;
    customizationsFetchPromise = null;
    
    notifyCacheChange();
  };

  // Function to invalidate just the categories cache
  const invalidateCategories = () => {
    categoriesCache = null;
    categoriesLastFetch = 0;
    console.log('🗑️ Categories cache invalidated', { timestamp: new Date().toISOString() });
    notifyCacheChange();
  };

  // Function to invalidate just the protein types cache
  const invalidateProteinTypes = () => {
    proteinTypesCache = null;
    proteinTypesLastFetch = 0;
    console.log('🗑️ Protein types cache invalidated', { timestamp: new Date().toISOString() });
    notifyCacheChange();
  };
  
  // Function to invalidate just the customizations cache
  const invalidateCustomizations = () => {
    customizationsCache = null;
    customizationsLastFetch = 0;
    console.log('🗑️ Customizations cache invalidated', { timestamp: new Date().toISOString() });
    notifyCacheChange();
  };
  
  // Function to invalidate menu items by category cache
  const invalidateMenuItemsByCategory = (categoryId?: string) => {
    // Since we don't have a dedicated cache for menuItemsByCategory in this scope,
    // we'll just invalidate the general menu items cache
    menuItemsCache = null;
    menuItemsLastFetch = 0;
    console.log(categoryId ? 
      `🗑️ Cache invalidated for category ${categoryId}` : 
      '🗑️ All menu items cache invalidated', { timestamp: new Date().toISOString() });
    notifyCacheChange();
  };

  /**
   * Fetch complete menu data including categories, menu items, protein types, variants, and images
   * This combines multiple data fetches to create a complete menu structure with items and their variants
   */
  const fetchCompleteMenuData = async () => {
    try {
      // Fetch all data in parallel
      const [categoriesData, menuItemsData, proteinTypesData, variantsData] = await Promise.all([
        fetchCategories(),
        fetchMenuItems(),
        fetchProteinTypes(),
        fetchItemVariants()
      ]);
      
      // Organize variants by menu item ID for quick lookup
      const variantsByItemId: Record<string, ItemVariant[]> = {};
      
      variantsData.forEach(variant => {
        if (!variantsByItemId[variant.menu_item_id]) {
          variantsByItemId[variant.menu_item_id] = [];
        }
        variantsByItemId[variant.menu_item_id].push(variant);
      });
      
      // Attach variants to their menu items
      const menuItemsWithVariants = menuItemsData.map(item => ({
        ...item,
        variants: variantsByItemId[item.id] || []
      }));
      
      console.log('✅ fetchCompleteMenuData completed', {
        timestamp: new Date().toISOString(),
        dataStats: {
          categories: categoriesData.length,
          menuItems: menuItemsWithVariants.length,
          proteinTypes: proteinTypesData.length,
          variants: variantsData.length
        }
      });
      
      return {
        categories: categoriesData,
        menuItems: menuItemsWithVariants,
        proteinTypes: proteinTypesData
      };
    } catch (error) {
      console.error('Error fetching complete menu data:', error);
      toast.error('Failed to load menu data');
      
      return {
        categories: [],
        menuItems: [],
        proteinTypes: []
      };
    }
  };

  // Function to fetch menu items by category from the database
  const fetchMenuItemsByCategory = async (categoryId: string): Promise<MenuItem[]> => {
    try {
      // Check if we have a valid cache first
      const menuItemsByCategory = get().getMenuItemsByCategory(categoryId);
      if (menuItemsByCategory) return menuItemsByCategory;
      
      // If not in cache, fetch from database
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          item_variants(*)
        `)
        .eq('category_id', categoryId)
        .order('display_order');
      
      if (error) throw error;
      
      // Process the data to match our MenuItem type structure
      const processedItems = data.map(item => ({
        ...item,
        variants: item.item_variants || []
      }));
      
      // Update cache
      get().setMenuItemsByCategory(categoryId, processedItems);
      
      return processedItems;
    } catch (error) {
      console.error(`Error fetching menu items for category ${categoryId}:`, error);
      return [];
    }
  };

  // Function to invalidate just the menu items cache
  const invalidateMenuItems = () => {
    const wasValid = menuItemsCache !== null;
    menuItemsCache = null;
    menuItemsLastFetch = 0;
    console.log('🗑️ Menu items cache invalidated', { 
      wasValid, 
      timestamp: new Date().toISOString(),
      cacheAge: wasValid ? Date.now() - menuItemsLastFetch : 'N/A'
    });
    notifyCacheChange();
  };
  
  // Function to invalidate item variants cache
  const invalidateItemVariants = () => {
    // We don't have a dedicated item variants cache in this scope,
    // but we need this function to prevent errors when deleting menu items
    console.log('🗑️ Item variants cache invalidated', {
      timestamp: new Date().toISOString(),
      note: 'No dedicated variants cache in this scope'
    });
    notifyCacheChange();
  };

  return {
    fetchCategories,
    fetchProteinTypes,
    fetchCustomizations,
    fetchMenuItems,
    fetchItemVariants,
    fetchCompleteMenuData,
    fetchMenuItemsByCategory,
    invalidateCache,
    invalidateCategories,
    invalidateProteinTypes,
    invalidateMenuItems,
    invalidateMenuItemsByCategory,
    invalidateCustomizations,
    invalidateItemVariants,
    addCacheChangeListener,
    forceRefresh,
    checkForRefreshEvents
  };
}
