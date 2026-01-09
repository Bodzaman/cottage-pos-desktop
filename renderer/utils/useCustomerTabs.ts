import { useState, useEffect } from 'react';
import { CustomerTab } from 'types';
import { supabase, getSupabase } from './supabaseClient';
import { apiClient } from 'app';

interface UseCustomerTabsReturn {
  customerTabs: CustomerTab[];
  activeTabId: string | null;
  setActiveTabId: (tabId: string | null) => void;
  loading: boolean;
  error: Error | null;
  
  // Commands
  createTab: (tabName: string, guestId?: string) => Promise<string | null>;
  renameTab: (tabId: string, newName: string) => Promise<boolean>;
  closeTab: (tabId: string) => Promise<boolean>;
  splitTab: (sourceTabId: string, newTabName: string, itemIndices: number[], guestId?: string) => Promise<any>;
  mergeTabs: (sourceTabId: string, targetTabId: string) => Promise<any>;
  moveItemsBetweenTabs: (sourceTabId: string, targetTabId: string, itemIndices: number[]) => Promise<any>;
}

// ✅ RELATIONAL: Map dine_in_order_items to CustomerTab.order_items format
interface DineInOrderItem {
  id: string;
  order_id: string;
  customer_tab_id: string | null;
  table_number: number;
  menu_item_id: string;
  variant_id: string | null;
  category_id: string | null;
  item_name: string;
  variant_name: string | null;
  protein_type: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  customizations: any;
  notes: string | null;
  status: string;
  sent_to_kitchen_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Real-time hook for managing customer tabs at a table.
 * Subscribes to customer_tabs table and provides command functions for tab operations.
 * 
 * ✅ RELATIONAL ARCHITECTURE (MYA-1690 Step 4):
 * - Queries dine_in_order_items table for items
 * - Dual subscriptions: customer_tabs + dine_in_order_items
 * - Merges relational items into CustomerTab objects
 * 
 * @param tableNumber - Table number to subscribe to (null = no subscription)
 * @returns Customer tabs data and command functions
 */
export function useCustomerTabs(tableNumber: number | null): UseCustomerTabsReturn {
  const [customerTabs, setCustomerTabs] = useState<CustomerTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [supabaseReady, setSupabaseReady] = useState(false);

  // ✅ RELATIONAL: Store items separately and merge into tabs
  const [orderItems, setOrderItems] = useState<DineInOrderItem[]>([]);

  // First effect: Wait for Supabase to be properly configured
  useEffect(() => {
    let mounted = true;
    
    const initSupabase = async () => {
      try {
        console.log('[useCustomerTabs] ⏳ Waiting for Supabase config...');
        await getSupabase(); // Wait for correct config
        if (mounted) {
          console.log('[useCustomerTabs] ✅ Supabase configured, ready to subscribe');
          setSupabaseReady(true);
        }
      } catch (err) {
        console.error('[useCustomerTabs] ❌ Failed to initialize Supabase:', err);
        if (mounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    };
    
    initSupabase();
    
    return () => {
      mounted = false;
    };
  }, []);

  // ✅ RELATIONAL: Real-time subscription to dine_in_order_items table
  useEffect(() => {
    if (!supabaseReady || !tableNumber) {
      setOrderItems([]);
      return;
    }

    // Initial fetch of items for this table
    const fetchItems = async () => {
      try {
        console.log('[useCustomerTabs] 🔍 FETCH: Querying dine_in_order_items for table:', tableNumber);
        const { data, error } = await supabase
          .from('dine_in_order_items')
          .select('*')
          .eq('table_number', tableNumber)
          .not('customer_tab_id', 'is', null)
          .order('created_at', { ascending: true });

        if (error) throw error;
        console.log('[useCustomerTabs] ✅ FETCH ITEMS SUCCESS:', {
          itemCount: data?.length || 0,
          items: data
        });
        setOrderItems(data || []);
      } catch (err) {
        console.error('[useCustomerTabs] ❌ Fetch items error:', err);
      }
    };

    fetchItems();

    // Subscribe to real-time updates for items
    console.log(`[useCustomerTabs] 🔌 Creating items subscription for table ${tableNumber}`);
    
    const itemsSubscription = supabase
      .channel(`dine_in_order_items:${tableNumber}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dine_in_order_items',
          filter: `table_number=eq.${tableNumber}`
        },
        (payload) => {
          console.log('[useCustomerTabs] 🔔 ITEMS Real-time callback triggered!', payload);
          
          if (payload.eventType === 'INSERT') {
            console.log('[useCustomerTabs] ➡️ INSERT ITEM event:', payload.new);
            setOrderItems((prev) => [...prev, payload.new as DineInOrderItem]);
          } else if (payload.eventType === 'UPDATE') {
            console.log('[useCustomerTabs] ➡️ UPDATE ITEM event:', payload.new);
            setOrderItems((prev) => 
              prev.map((item) => (item.id === payload.new.id ? (payload.new as DineInOrderItem) : item))
            );
          } else if (payload.eventType === 'DELETE') {
            console.log('[useCustomerTabs] ➡️ DELETE ITEM event:', payload.old);
            setOrderItems((prev) => prev.filter((item) => item.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log(`[useCustomerTabs] 📡 Items subscription status: ${status}`);
      });

    return () => {
      console.log(`[useCustomerTabs] 🔌 Unsubscribing from items for table ${tableNumber}`);
      supabase.removeChannel(itemsSubscription);
    };
  }, [supabaseReady, tableNumber]);

  // ✅ RELATIONAL: Merge items into customer tabs whenever either changes
  useEffect(() => {
    if (!customerTabs.length) return; // Skip if no tabs loaded yet
    
    setCustomerTabs((prevTabs) => {
      return prevTabs.map((tab) => {
        // Get items for this tab from relational table
        const tabItems = orderItems
          .filter((item) => item.customer_tab_id === tab.id)
          .map((item) => ({
            id: item.id,
            menu_item_id: item.menu_item_id,
            variant_id: item.variant_id,
            item_name: item.item_name,
            variant_name: item.variant_name,
            quantity: item.quantity,
            price: item.unit_price,
            customizations: item.customizations,
            notes: item.notes,
          }));

        // Only update if items actually changed (prevent infinite loop)
        const existingItemsJson = JSON.stringify(tab.order_items || []);
        const newItemsJson = JSON.stringify(tabItems);
        
        if (existingItemsJson === newItemsJson) {
          return tab; // No change, return same object
        }

        return {
          ...tab,
          order_items: tabItems,
        };
      });
    });
  }, [orderItems]); // Only depend on orderItems, not customerTabs

  // Real-time subscription to customer_tabs table - only after Supabase is ready
  useEffect(() => {
    if (!supabaseReady) {
      console.log('[useCustomerTabs] ⏸️ Waiting for Supabase to be ready...');
      return;
    }
    
    if (!tableNumber) {
      setCustomerTabs([]);
      setActiveTabId(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Initial fetch
    const fetchTabs = async () => {
      try {
        console.log('[useCustomerTabs] 🔍 FETCH: Querying customer_tabs for table:', tableNumber);
        const { data, error } = await supabase
          .from('customer_tabs')
          .select('*')
          .eq('table_number', tableNumber)
          .eq('status', 'active')
          .order('created_at', { ascending: true });

        if (error) throw error;
        console.log('[useCustomerTabs] ✅ FETCH SUCCESS:', {
          tabCount: data?.length || 0,
          tabs: data
        });
        setCustomerTabs(data || []);
        if (data && data.length > 0 && !activeTabId) {
          setActiveTabId(data[0].id);
        }
        setLoading(false);
      } catch (err) {
        console.error('[useCustomerTabs] ❌ Fetch error:', err);
        setError(err as Error);
        setLoading(false);
      }
    };

    fetchTabs();

    // Subscribe to real-time updates
    console.log(`[useCustomerTabs] 🔌 Creating subscription for table ${tableNumber}`);
    
    const subscription = supabase
      .channel(`customer_tabs:${tableNumber}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_tabs',
          filter: `table_number=eq.${tableNumber}`
        },
        (payload) => {
          console.log('[useCustomerTabs] 🔔 Real-time callback triggered!', payload);
          
          if (payload.eventType === 'INSERT') {
            console.log('[useCustomerTabs] ➡️ INSERT event - adding new tab:', payload.new);
            setCustomerTabs((prev) => {
              const updated = [...prev, payload.new as CustomerTab];
              console.log('[useCustomerTabs] ✅ Customer tabs state updated (INSERT):', updated.length, 'tabs');
              return updated;
            });
          } else if (payload.eventType === 'UPDATE') {
            console.log('[useCustomerTabs] ➡️ UPDATE event - updating tab:', payload.new);
            setCustomerTabs((prev) => {
              const updated = prev.map((tab) => (tab.id === payload.new.id ? (payload.new as CustomerTab) : tab));
              console.log('[useCustomerTabs] ✅ Customer tabs state updated (UPDATE):', updated);
              return updated;
            });
          } else if (payload.eventType === 'DELETE') {
            console.log('[useCustomerTabs] ➡️ DELETE event - removing tab:', payload.old);
            setCustomerTabs((prev) => {
              const updated = prev.filter((tab) => tab.id !== payload.old.id);
              console.log('[useCustomerTabs] ✅ Customer tabs state updated (DELETE):', updated.length, 'tabs');
              return updated;
            });
            if (activeTabId === payload.old.id) {
              console.log('[useCustomerTabs] ➡️ Clearing active tab (deleted)');
              setActiveTabId(null);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`[useCustomerTabs] 📡 Subscription status changed: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log(`[useCustomerTabs] ✅ Successfully subscribed to table ${tableNumber}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[useCustomerTabs] ❌ Channel error for table ${tableNumber}`);
          setError(new Error('Real-time subscription failed'));
        } else if (status === 'TIMED_OUT') {
          console.error(`[useCustomerTabs] ⏱️ Subscription timed out for table ${tableNumber}`);
          setError(new Error('Real-time subscription timed out'));
        }
      });

    console.log(`[useCustomerTabs] 🎯 Subscription object created:`, subscription);

    return () => {
      console.log(`[useCustomerTabs] 🔌 Unsubscribing from table ${tableNumber}`);
      subscription.unsubscribe();
    };
  }, [tableNumber]);

  // Command: Create new customer tab
  const createTab = async (tabName: string, guestId?: string): Promise<string | null> => {
    console.log('🔍 [useCustomerTabs] createTab called:', { 
      tableNumber, 
      tableNumberType: typeof tableNumber,
      tableNumberValue: tableNumber,
      convertedValue: Number(tableNumber!),
      convertedType: typeof Number(tableNumber!)
    });
    
    try {
      const payload = {
        table_number: Number(tableNumber!), // ✅ Explicit conversion to ensure integer
        tab_name: tabName,
        guest_id: guestId || null
      };
      
      console.log('🔍 [useCustomerTabs] Sending payload:', payload, 'Types:', {
        table_number_type: typeof payload.table_number,
        tab_name_type: typeof payload.tab_name
      });
      
      const response = await apiClient.create_customer_tab(payload);
      console.log('🔍 [useCustomerTabs] Raw response:', response);
      
      const data = await response.json();
      console.log('🔍 [useCustomerTabs] Parsed response data:', data);
      console.log('🔍 [useCustomerTabs] Response structure check:', {
        hasSuccess: 'success' in data,
        successValue: data.success,
        hasCustomerTab: 'customer_tab' in data,
        customerTabValue: data.customer_tab,
        allKeys: Object.keys(data)
      });
      
      if (data.success && data.customer_tab) {
        setActiveTabId(data.customer_tab.id);
        return data.customer_tab.id;
      }
      console.warn('⚠️ [useCustomerTabs] Response validation failed - returning null');
      return null;
    } catch (err) {
      console.error('Failed to create customer tab:', err);
      return null;
    }
  };

  // Command: Add items to tab
  const addItemsToTab = async (tabId: string, items: any[]): Promise<boolean> => {
    try {
      // Sanitize items to match backend OrderItem schema
      const sanitizedItems = items.map(item => ({
        id: item.id,
        menu_item_id: item.menu_item_id || item.id, // Use menu_item_id if available, fallback to id
        variant_id: item.variant_id || null,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        variant_name: item.variant_name || item.variant?.name || null,
        notes: item.notes || null,
        protein_type: item.protein_type || item.variant?.protein_type || null,
        image_url: item.image_url || item.url || null,
        customizations: item.customizations || [],
        sent_to_kitchen: item.sent_to_kitchen || false,
        created_at: item.created_at || new Date().toISOString()
      }));

      const response = await apiClient.add_items_to_customer_tab(
        { tabId: tabId },
        sanitizedItems // ✅ Fixed: Pass array directly, not wrapped in { items: ... }
      );
      const data = await response.json();
      return data.success || false;
    } catch (err) {
      console.error('Failed to add items to tab:', err);
      return false;
    }
  };

  // Command: Rename tab
  const renameTab = async (tabId: string, newName: string): Promise<boolean> => {
    try {
      const response = await apiClient.update_customer_tab(
        { tabId: tabId }, // ✅ Fixed: camelCase
        { tab_name: newName }
      );
      const data = await response.json();
      return data.success || false;
    } catch (err) {
      console.error('Failed to rename tab:', err);
      return false;
    }
  };

  // Command: Close tab
  const closeTab = async (tabId: string): Promise<boolean> => {
    try {
      const response = await apiClient.close_customer_tab({ tabId: tabId }); // ✅ Fixed: camelCase
      const data = await response.json();
      return data.success || false;
    } catch (err) {
      console.error('Failed to close tab:', err);
      return false;
    }
  };

  // Command: Split tab
  const splitTab = async (
    sourceTabId: string,
    newTabName: string,
    itemIndices: number[],
    guestId?: string
  ): Promise<any> => {
    try {
      const response = await apiClient.split_customer_tab({
        source_tab_id: sourceTabId,
        new_tab_name: newTabName,
        item_indices: itemIndices,
        guest_id: guestId || null
      });
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Failed to split tab:', err);
      return { success: false };
    }
  };

  // Command: Merge tabs
  const mergeTabs = async (sourceTabId: string, targetTabId: string): Promise<any> => {
    try {
      const response = await apiClient.merge_customer_tabs({
        source_tab_id: sourceTabId,
        target_tab_id: targetTabId
      });
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Failed to merge tabs:', err);
      return { success: false };
    }
  };

  // Command: Move items between tabs
  const moveItemsBetweenTabs = async (
    sourceTabId: string,
    targetTabId: string,
    itemIndices: number[]
  ): Promise<any> => {
    try {
      const response = await apiClient.move_items_between_customer_tabs({
        source_tab_id: sourceTabId,
        target_tab_id: targetTabId,
        item_indices: itemIndices
      });
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Failed to move items:', err);
      return { success: false };
    }
  };

  return {
    customerTabs,
    activeTabId,
    setActiveTabId,
    loading,
    error,
    // Commands
    createTab,
    addItemsToTab,
    renameTab,
    closeTab,
    splitTab,
    mergeTabs,
    moveItemsBetweenTabs
  };
}
