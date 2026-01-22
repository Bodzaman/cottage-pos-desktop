import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import brain from 'brain';
import type { CustomerTab } from 'types';

interface UseCustomerTabsReturn {
  customerTabs: CustomerTab[];
  activeTabId: string | null;
  setActiveTabId: (tabId: string | null) => void;
  loading: boolean;
  error: Error | null;
  // Commands
  createTab: (tabName: string, guestId?: string) => Promise<string | null>;
  addItemsToTab: (tabId: string, items: any[]) => Promise<boolean>;
  renameTab: (tabId: string, newName: string) => Promise<boolean>;
  closeTab: (tabId: string) => Promise<boolean>;
  splitTab: (sourceTabId: string, newTabName: string, itemIndices: number[], guestId?: string) => Promise<any>;
  mergeTabs: (sourceTabId: string, targetTabId: string) => Promise<any>;
  moveItemsBetweenTabs: (sourceTabId: string, targetTabId: string, itemIndices: number[]) => Promise<any>;
}

/**
 * Real-time hook for managing customer tabs at a table.
 * Subscribes to customer_tabs table and provides command functions for tab operations.
 * 
 * Architecture: Event-driven pattern
 * - UI sends commands via brain client
 * - Backend updates database
 * - Real-time subscription updates UI
 * 
 * @param tableNumber - Table number to subscribe to (null = no subscription)
 * @returns Customer tabs data and command functions
 */
export function useCustomerTabs(tableNumber: number | null): UseCustomerTabsReturn {
  const [customerTabs, setCustomerTabs] = useState<CustomerTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Real-time subscription to customer_tabs table
  useEffect(() => {
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
        const { data, error } = await supabase
          .from('customer_tabs')
          .select('*')
          .eq('table_number', tableNumber)
          .eq('status', 'active')
          .order('created_at', { ascending: true });

        if (error) throw error;
        setCustomerTabs(data || []);
        if (data && data.length > 0 && !activeTabId) {
          setActiveTabId(data[0].id);
        }
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    fetchTabs();

    // Subscribe to real-time updates
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
          if (payload.eventType === 'INSERT') {
            setCustomerTabs((prev) => [...prev, payload.new as CustomerTab]);
          } else if (payload.eventType === 'UPDATE') {
            setCustomerTabs((prev) =>
              prev.map((tab) => (tab.id === payload.new.id ? (payload.new as CustomerTab) : tab))
            );
          } else if (payload.eventType === 'DELETE') {
            setCustomerTabs((prev) => prev.filter((tab) => tab.id !== payload.old.id));
            if (activeTabId === payload.old.id) {
              setActiveTabId(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [tableNumber]);

  // Command: Create new customer tab
  const createTab = async (tabName: string, guestId?: string): Promise<string | null> => {
    try {
      const response = await brain.create_customer_tab({
        table_number: tableNumber!,
        tab_name: tabName,
        guest_id: guestId || null
      });
      const data = await response.json();
      if (data.success && data.customer_tab) {
        setActiveTabId(data.customer_tab.id);
        return data.customer_tab.id;
      }
      return null;
    } catch (err) {
      console.error('Failed to create customer tab:', err);
      return null;
    }
  };

  // Command: Add items to tab
  const addItemsToTab = async (tabId: string, items: any[]): Promise<boolean> => {
    try {
      const response = await brain.add_items_to_customer_tab(
        { tab_id: tabId },
        { items }
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
      const response = await brain.update_customer_tab(
        { tab_id: tabId },
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
      const response = await brain.close_customer_tab({ tab_id: tabId });
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
      const response = await brain.split_customer_tab({
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
      const response = await brain.merge_customer_tabs({
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
      const response = await brain.move_items_between_customer_tabs({
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
