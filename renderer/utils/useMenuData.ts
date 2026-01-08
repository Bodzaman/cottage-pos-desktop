

import { useState, useEffect } from 'react';
import { supabase } from 'utils/supabaseClient';
import { MenuItem, Category, ItemVariant } from 'utils/menuTypes';

interface MenuData {
  menuItems: MenuItem[];
  categories: Category[];
  itemVariants: ItemVariant[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  // NEW: Add refresh function for unified publishing
  refresh: () => Promise<void>;
}

/**
 * useMenuData Hook - Single Source of Truth for Menu Data
 * 
 * Following Admin.tsx successful pattern:
 * - Single data fetch in useEffect
 * - Direct Supabase calls (no store subscriptions)
 * - Local state management
 * - Stable data references
 * 
 * This eliminates the race conditions from multiple store subscriptions
 * that were causing infinite re-renders in OnlineOrders.
 */
export const useMenuData = (): MenuData => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemVariants, setItemVariants] = useState<ItemVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let isMounted = true; // Prevent state updates on unmounted component

    const loadMenuData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('🔄 [useMenuData] Loading menu data...');
        
        // Fetch categories - same pattern as Admin.tsx
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('menu_categories')
          .select('id, name, description, display_order, print_order, print_to_kitchen, image_url, parent_id, is_active, created_at, updated_at')
          .order('display_order');
        
        if (categoriesError) {
          throw categoriesError;
        }
        
        // Map database columns to TypeScript interface (same as Admin.tsx)
        const mappedCategories = (categoriesData || []).map((item: any) => ({
          ...item,
          parent_category_id: item.parent_id,
          active: item.is_active
        }));
        
        // Fetch ACTIVE menu items only
        const { data: menuItemsData, error: menuItemsError } = await supabase
          .from('menu_items')
          .select('*')
          .eq('active', true)
          .order('display_order');
        
        if (menuItemsError) {
          throw menuItemsError;
        }
        
        const activeMenuItems = menuItemsData || [];
        
        // Fetch item variants
        const { data: variantsData, error: variantsError } = await supabase
          .from('item_variants')
          .select('*')
          .order('display_order');
        
        if (variantsError) {
          throw variantsError;
        }
        
        const variants = variantsData || [];
        
        // Only update state if component is still mounted
        if (isMounted) {
          setCategories(mappedCategories);
          setMenuItems(activeMenuItems);
          setItemVariants(variants);
          setIsConnected(true);
          setIsLoading(false);
          
          console.log('✅ [useMenuData] Menu data loaded successfully:', {
            categories: mappedCategories.length,
            activeMenuItems: activeMenuItems.length,
            variants: variants.length,
            timestamp: new Date().toISOString()
          });
        }
        
      } catch (error: any) {
        console.error('❌ [useMenuData] Error loading menu data:', error);
        
        if (isMounted) {
          setError(error.message || 'Failed to load menu data');
          setIsLoading(false);
          setIsConnected(false);
        }
      }
    };

    loadMenuData();

    // NEW: Listen for menu publish events to refresh data
    const handleMenuPublish = () => {
      console.log('🔄 [useMenuData] Menu publish event received, refreshing...');
      loadMenuData();
    };
    
    // Listen for custom event from publish system
    document.addEventListener('menu-published', handleMenuPublish);
    
    // Also listen for manual refresh requests
    document.addEventListener('refresh-online-menu', handleMenuPublish);

    // Cleanup function
    return () => {
      isMounted = false;
      document.removeEventListener('menu-published', handleMenuPublish);
      document.removeEventListener('refresh-online-menu', handleMenuPublish);
    };
  }, []); // Empty dependency array - load once on mount

  // NEW: Expose refresh function for manual refresh
  const refresh = async () => {
    console.log('🔄 [useMenuData] Manual refresh requested');
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('id, name, description, display_order, print_order, print_to_kitchen, image_url, parent_id, is_active, created_at, updated_at')
        .order('display_order');
      
      if (categoriesError) throw categoriesError;
      
      const mappedCategories = (categoriesData || []).map((item: any) => ({
        ...item,
        parent_category_id: item.parent_id,
        active: item.is_active
      }));
      
      // Fetch menu items
      const { data: menuItemsData, error: menuItemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('active', true)
        .order('display_order');
      
      if (menuItemsError) throw menuItemsError;
      
      // Fetch variants
      const { data: variantsData, error: variantsError } = await supabase
        .from('item_variants')
        .select('*')
        .order('display_order');
      
      if (variantsError) throw variantsError;
      
      setCategories(mappedCategories);
      setMenuItems(menuItemsData || []);
      setItemVariants(variantsData || []);
      setIsConnected(true);
      setIsLoading(false);
      
      console.log('✅ [useMenuData] Manual refresh completed');
      
    } catch (error: any) {
      console.error('❌ [useMenuData] Manual refresh failed:', error);
      setError(error.message || 'Failed to refresh menu data');
      setIsLoading(false);
      setIsConnected(false);
    }
  };

  return {
    menuItems,
    categories,
    itemVariants,
    isLoading,
    error,
    isConnected,
    refresh
  };
};
