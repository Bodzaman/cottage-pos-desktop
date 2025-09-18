
/**
 * Table Orders Store - Enhanced table management with customer tabs support
 * 
 * ADAPTED FOR ELECTRON: This store provides comprehensive table order management
 * with optimistic updates, customer tab functionality, and real-time synchronization
 * with Supabase backend.
 * 
 * CHANGES FROM DATABUTTON VERSION:
 * - Replaced brain.* calls with apiClient.* calls
 * - Added Electron-specific imports
 * - Maintained all Zustand functionality and optimistic updates
 * - Preserved customer tab management features
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { apiClient } from './apiClient'; // ELECTRON: Replace brain import
import { API_URL } from './config'; // ELECTRON: Update config import
import { OrderItem } from './types'; // ELECTRON: Update types import
import { toast } from 'sonner';

// ============================================================================
// ENHANCED TABLE ORDER TYPES
// ============================================================================

interface TableOrder {
  id?: string;
  table_number: number;
  order_items: OrderItem[];
  status: 'Available' | 'Seated';
  guest_count?: number;
  linked_tables: number[];
  created_at?: string;
  updated_at?: string;
}

// ENHANCED: Customer Tab types with better type safety
interface CustomerTab {
  id: string;
  table_number: number;
  tab_name: string;
  order_items: OrderItem[];
  status: 'active' | 'paid' | 'cancelled';
  guest_id?: string;
  created_at: string;
  updated_at: string;
}

// NEW: Enhanced table structure supporting both customer tabs and linked tables
interface TableWithTabs {
  tableNumber: number;
  guestCount: number;
  status: 'Available' | 'Seated';
  customerTabs: CustomerTab[]; // Individual customer tabs within table
  linkedTables: number[]; // EXISTING: Preserve linked table functionality
}

// NEW: Linked table group management
interface LinkedTableGroup {
  tables: TableWithTabs[];
  primaryTable: number;
  guestCount: number;
}

// NEW: Enhanced state management options
interface StoreOptions {
  enableOptimisticUpdates: boolean;
  debounceMs: number;
  maxRetries: number;
  syncInterval: number;
}

// NEW: Error state management
interface ErrorState {
  tableErrors: Record<number, string>;
  customerTabErrors: Record<string, string>;
  globalError: string | null;
}

interface TableOrdersState {
  // Enhanced state management
  tableOrders: Record<number, OrderItem[]>; // Local state for fast UI updates
  persistedTableOrders: Record<number, TableOrder>; // Synced with Supabase

  // ENHANCED: Customer tabs state management with optimistic updates
  customerTabs: Record<number, CustomerTab[]>; // Customer tabs per table number
  activeCustomerTab: Record<number, string | null>; // Currently selected tab ID per table
  optimisticCustomerTabs: Record<number, CustomerTab[]>; // NEW: Optimistic state for immediate UI updates

  // NEW: Performance and caching
  isLoading: boolean;
  lastSync: number;
  syncInProgress: boolean;

  // NEW: Error handling
  errors: ErrorState;

  // NEW: Store options
  options: StoreOptions;

  // Actions - Existing table-level operations (PRESERVED)
  initializeSchema: () => Promise<void>;
  loadTableOrders: () => Promise<void>;
  createTableOrder: (tableNumber: number, guestCount: number, linkedTables?: number[]) => Promise<boolean>;
  updateTableOrder: (tableNumber: number, items: OrderItem[]) => Promise<boolean>;
  addItemsToTable: (tableNumber: number, items: OrderItem[]) => Promise<boolean>;
  completeTableOrder: (tableNumber: number) => Promise<boolean>;
  removeItemFromTable: (tableNumber: number, itemIndex: number) => Promise<boolean>;
  resetTableToAvailable: (tableNumber: number) => Promise<boolean>;
  forceRefresh: () => Promise<void>;

  // ENHANCED: Customer tab management actions with optimistic updates
  initializeCustomerTabsSchema: () => Promise<void>;
  loadCustomerTabsForTable: (tableNumber: number) => Promise<void>;
  createCustomerTab: (tableNumber: number, tabName: string, guestId?: string) => Promise<string | null>;
  updateCustomerTab: (tabId: string, updates: { tab_name?: string; order_items?: OrderItem[]; status?: string }) => Promise<boolean>;
  addItemsToCustomerTab: (tabId: string, items: OrderItem[]) => Promise<boolean>;
  closeCustomerTab: (tabId: string) => Promise<boolean>;
  renameCustomerTab: (tabId: string, newName: string) => Promise<boolean>;
  setActiveCustomerTab: (tableNumber: number, tabId: string | null) => void;

  // NEW: Enhanced customer tab operations
  deleteCustomerTab: (tabId: string) => Promise<boolean>;
  removeItemFromCustomerTab: (tabId: string, itemIndex: number) => Promise<boolean>;
  updateCustomerTabItems: (tabId: string, items: OrderItem[]) => Promise<boolean>;
  completeCustomerTab: (tabId: string) => Promise<boolean>;

  // Utilities (PRESERVED and ENHANCED)
  hasExistingOrders: (tableNumber: number) => boolean;
  getTableStatus: (tableNumber: number) => 'Available' | 'Seated';
  getTableOrders: (tableNumber: number) => OrderItem[];

  // ENHANCED: Customer tab utilities
  getCustomerTabsForTable: (tableNumber: number) => CustomerTab[];
  getActiveCustomerTab: (tableNumber: number) => CustomerTab | null;
  getCustomerTabById: (tabId: string) => CustomerTab | null;
  hasActiveCustomerTabs: (tableNumber: number) => boolean;

  // NEW: Advanced utilities for linked tables with customer tabs
  getLinkedTableCustomerTabs: (tableNumbers: number[]) => Record<number, CustomerTab[]>;
  getLinkedTableGroup: (tableNumber: number) => LinkedTableGroup | null;
  getTotalOrdersForLinkedTables: (tableNumbers: number[]) => OrderItem[];

  // NEW: Performance and error handling utilities
  clearErrors: () => void;
  clearTableError: (tableNumber: number) => void;
  clearCustomerTabError: (tabId: string) => void;
  retryFailedOperation: (operationType: string, ...args: any[]) => Promise<boolean>;

  // NEW: State synchronization utilities
  syncCustomerTabsFromServer: (tableNumber: number) => Promise<void>;
  validateCustomerTabState: (tableNumber: number) => boolean;
}

// ============================================================================
// ENHANCED ZUSTAND STORE WITH OPTIMISTIC UPDATES
// ============================================================================

export const useTableOrdersStore = create<TableOrdersState>()(subscribeWithSelector(
  (set, get) => ({
    // Enhanced initial state
    tableOrders: {},
    persistedTableOrders: {},

    // ENHANCED: Customer tabs with optimistic support
    customerTabs: {},
    activeCustomerTab: {},
    optimisticCustomerTabs: {}, // NEW: For immediate UI updates

    isLoading: false,
    lastSync: 0,
    syncInProgress: false,

    // NEW: Error handling state
    errors: {
      tableErrors: {},
      customerTabErrors: {},
      globalError: null
    },

    // NEW: Store configuration
    options: {
      enableOptimisticUpdates: true,
      debounceMs: 300,
      maxRetries: 3,
      syncInterval: 30000 // 30 seconds
    },

    // Initialize schema
    initializeSchema: async () => {
      try {
        set({ isLoading: true });
        // ELECTRON: Replace brain.setup_restaurant_schema with apiClient call
        const data = await apiClient.setupRestaurantSchema();
        console.log('Schema setup result:', data);
        await get().loadTableOrders();
      } catch (error) {
        console.error('Schema initialization failed:', error);
        set(state => ({
          errors: {
            ...state.errors,
            globalError: 'Failed to initialize database schema'
          }
        }));
      } finally {
        set({ isLoading: false });
      }
    },

    // ENHANCED: Customer tabs schema initialization
    initializeCustomerTabsSchema: async () => {
      try {
        console.log('🔧 Initializing customer tabs schema...');
        // ELECTRON: Replace brain.setup_customer_tabs_schema with apiClient call
        await apiClient.setupCustomerTabsSchema();
        console.log('✅ Customer tabs schema initialized successfully');
      } catch (error) {
        console.warn('⚠️ Customer tabs schema setup issue:', error);
        set(state => ({
          errors: {
            ...state.errors,
            globalError: 'Customer tabs schema setup failed'
          }
        }));
      }
    },

    // Load table orders
    loadTableOrders: async () => {
      try {
        set({ isLoading: true });
        // ELECTRON: Replace brain.list_table_orders with apiClient call
        const data = await apiClient.listTableOrders();

        if (data.success && Array.isArray(data.table_orders)) {
          const tableOrdersMap: Record<number, OrderItem[]> = {};
          const persistedOrdersMap: Record<number, TableOrder> = {};

          data.table_orders.forEach((order: TableOrder) => {
            const tableNumber = order.table_number;
            tableOrdersMap[tableNumber] = order.order_items || [];
            persistedOrdersMap[tableNumber] = order;
          });

          set({ 
            tableOrders: tableOrdersMap, 
            persistedTableOrders: persistedOrdersMap,
            lastSync: Date.now()
          });
        }
      } catch (error) {
        console.error('Failed to load table orders:', error);
        set(state => ({
          errors: {
            ...state.errors,
            globalError: 'Failed to load table orders'
          }
        }));
      } finally {
        set({ isLoading: false });
      }
    },

    // ENHANCED: Load customer tabs for specific table with optimistic support
    loadCustomerTabsForTable: async (tableNumber: number) => {
      try {
        // ELECTRON: Replace brain.list_customer_tabs_for_table with apiClient call
        const data = await apiClient.listCustomerTabsForTable({ tableNumber });

        if (data.success && Array.isArray(data.customer_tabs)) {
          set(state => ({
            customerTabs: {
              ...state.customerTabs,
              [tableNumber]: data.customer_tabs
            },
            // Sync optimistic state with server state
            optimisticCustomerTabs: {
              ...state.optimisticCustomerTabs,
              [tableNumber]: data.customer_tabs
            }
          }));
        }
      } catch (error) {
        console.error(`Failed to load customer tabs for table ${tableNumber}:`, error);
        set(state => ({
          errors: {
            ...state.errors,
            tableErrors: {
              ...state.errors.tableErrors,
              [tableNumber]: 'Failed to load customer tabs'
            }
          }
        }));
      }
    },

    // ENHANCED: Create customer tab with optimistic updates
    createCustomerTab: async (tableNumber: number, tabName: string, guestId?: string) => {
      const { options } = get();
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Optimistic update
      if (options.enableOptimisticUpdates) {
        const optimisticTab: CustomerTab = {
          id: tempId,
          table_number: tableNumber,
          tab_name: tabName,
          order_items: [],
          status: 'active',
          guest_id: guestId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        set(state => ({
          optimisticCustomerTabs: {
            ...state.optimisticCustomerTabs,
            [tableNumber]: [
              ...(state.optimisticCustomerTabs[tableNumber] || []),
              optimisticTab
            ]
          }
        }));
      }

      try {
        // ELECTRON: Replace brain.create_customer_tab with apiClient call
        const data = await apiClient.createCustomerTab({
          table_number: tableNumber,
          tab_name: tabName,
          guest_id: guestId
        });

        if (data.success && data.customer_tab) {
          const realTab = data.customer_tab;

          set(state => ({
            customerTabs: {
              ...state.customerTabs,
              [tableNumber]: [
                ...(state.customerTabs[tableNumber] || []),
                realTab
              ]
            },
            optimisticCustomerTabs: {
              ...state.optimisticCustomerTabs,
              [tableNumber]: state.optimisticCustomerTabs[tableNumber]?.map(tab => 
                tab.id === tempId ? realTab : tab
              ) || [realTab]
            }
          }));

          toast.success(`Customer tab "${tabName}" created successfully`);
          return realTab.id;
        }
        throw new Error('Failed to create customer tab');
      } catch (error) {
        console.error('Error creating customer tab:', error);

        // Rollback optimistic update
        if (options.enableOptimisticUpdates) {
          set(state => ({
            optimisticCustomerTabs: {
              ...state.optimisticCustomerTabs,
              [tableNumber]: state.optimisticCustomerTabs[tableNumber]?.filter(tab => tab.id !== tempId) || []
            },
            errors: {
              ...state.errors,
              tableErrors: {
                ...state.errors.tableErrors,
                [tableNumber]: 'Failed to create customer tab'
              }
            }
          }));
        }

        toast.error('Failed to create customer tab');
        return null;
      }
    },

    // ENHANCED: Update customer tab with optimistic updates
    updateCustomerTab: async (tabId: string, updates: { tab_name?: string; order_items?: OrderItem[]; status?: string }) => {
      const { options, customerTabs } = get();
      let tableNumber: number | null = null;
      let originalTab: CustomerTab | null = null;

      // Find the tab and table number
      for (const [tNum, tabs] of Object.entries(customerTabs)) {
        const tab = tabs.find(t => t.id === tabId);
        if (tab) {
          tableNumber = parseInt(tNum);
          originalTab = tab;
          break;
        }
      }

      if (!tableNumber || !originalTab) {
        toast.error('Customer tab not found');
        return false;
      }

      // Optimistic update
      if (options.enableOptimisticUpdates) {
        const updatedTab = {
          ...originalTab,
          ...updates,
          updated_at: new Date().toISOString()
        };

        set(state => ({
          optimisticCustomerTabs: {
            ...state.optimisticCustomerTabs,
            [tableNumber!]: state.optimisticCustomerTabs[tableNumber!]?.map(tab => 
              tab.id === tabId ? updatedTab : tab
            ) || []
          }
        }));
      }

      try {
        // ELECTRON: Replace brain.update_customer_tab with apiClient call
        const data = await apiClient.updateCustomerTab({ tab_id: tabId }, updates);

        if (data.success && data.customer_tab) {
          // Update real state
          set(state => ({
            customerTabs: {
              ...state.customerTabs,
              [tableNumber!]: state.customerTabs[tableNumber!]?.map(tab => 
                tab.id === tabId ? data.customer_tab : tab
              ) || []
            }
          }));

          return true;
        }
        throw new Error('Failed to update customer tab');
      } catch (error) {
        console.error('Error updating customer tab:', error);

        // Rollback optimistic update
        if (options.enableOptimisticUpdates) {
          set(state => ({
            optimisticCustomerTabs: {
              ...state.optimisticCustomerTabs,
              [tableNumber!]: state.optimisticCustomerTabs[tableNumber!]?.map(tab => 
                tab.id === tabId ? originalTab! : tab
              ) || []
            },
            errors: {
              ...state.errors,
              customerTabErrors: {
                ...state.errors.customerTabErrors,
                [tabId]: 'Failed to update customer tab'
              }
            }
          }));
        }

        toast.error('Failed to update customer tab');
        return false;
      }
    },

    // ENHANCED: Add items to customer tab with optimistic updates
    addItemsToCustomerTab: async (tabId: string, items: OrderItem[]) => {
      const { options, customerTabs } = get();
      let tableNumber: number | null = null;
      let originalTab: CustomerTab | null = null;

      // Find the tab and table number
      for (const [tNum, tabs] of Object.entries(customerTabs)) {
        const tab = tabs.find(t => t.id === tabId);
        if (tab) {
          tableNumber = parseInt(tNum);
          originalTab = tab;
          break;
        }
      }

      if (!tableNumber || !originalTab) {
        toast.error('Customer tab not found');
        return false;
      }

      // Optimistic update
      if (options.enableOptimisticUpdates) {
        const updatedTab = {
          ...originalTab,
          order_items: [...originalTab.order_items, ...items],
          updated_at: new Date().toISOString()
        };

        set(state => ({
          optimisticCustomerTabs: {
            ...state.optimisticCustomerTabs,
            [tableNumber!]: state.optimisticCustomerTabs[tableNumber!]?.map(tab => 
              tab.id === tabId ? updatedTab : tab
            ) || []
          }
        }));
      }

      try {
        // ELECTRON: Replace brain.add_items_to_customer_tab with apiClient call
        const data = await apiClient.addItemsToCustomerTab({ tab_id: tabId }, { items });

        if (data.success && data.customer_tab) {
          // Update real state
          set(state => ({
            customerTabs: {
              ...state.customerTabs,
              [tableNumber!]: state.customerTabs[tableNumber!]?.map(tab => 
                tab.id === tabId ? data.customer_tab : tab
              ) || []
            }
          }));

          return true;
        }
        throw new Error('Failed to add items to customer tab');
      } catch (error) {
        console.error('Error adding items to customer tab:', error);

        // Rollback optimistic update
        if (options.enableOptimisticUpdates) {
          set(state => ({
            optimisticCustomerTabs: {
              ...state.optimisticCustomerTabs,
              [tableNumber!]: state.optimisticCustomerTabs[tableNumber!]?.map(tab => 
                tab.id === tabId ? originalTab! : tab
              ) || []
            },
            errors: {
              ...state.errors,
              customerTabErrors: {
                ...state.errors.customerTabErrors,
                [tabId]: 'Failed to add items to customer tab'
              }
            }
          }));
        }

        toast.error('Failed to add items to customer tab');
        return false;
      }
    },

    // Table-level operations (EXISTING - PRESERVED)
    createTableOrder: async (tableNumber: number, guestCount: number, linkedTables: number[] = []) => {
      try {
        // ELECTRON: Replace brain.create_table_order with apiClient call
        const data = await apiClient.createTableOrder({
          table_number: tableNumber,
          guest_count: guestCount,
          linked_tables: linkedTables
        });

        if (data.success) {
          await get().loadTableOrders();
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error creating table order:', error);
        set(state => ({
          errors: {
            ...state.errors,
            tableErrors: {
              ...state.errors.tableErrors,
              [tableNumber]: 'Failed to create table order'
            }
          }
        }));
        return false;
      }
    },

    updateTableOrder: async (tableNumber: number, items: OrderItem[]) => {
      try {
        // ELECTRON: Replace brain.update_table_order with apiClient call
        const data = await apiClient.updateTableOrder({ 
          table_number: tableNumber 
        }, { 
          order_items: items 
        });

        if (data.success) {
          set(state => ({
            tableOrders: {
              ...state.tableOrders,
              [tableNumber]: items
            },
            lastSync: Date.now()
          }));
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error updating table order:', error);
        return false;
      }
    },

    addItemsToTable: async (tableNumber: number, items: OrderItem[]) => {
      try {
        const currentItems = get().tableOrders[tableNumber] || [];
        const updatedItems = [...currentItems, ...items];
        return await get().updateTableOrder(tableNumber, updatedItems);
      } catch (error) {
        console.error('Error adding items to table:', error);
        return false;
      }
    },

    completeTableOrder: async (tableNumber: number) => {
      try {
        // ELECTRON: Replace brain.complete_table_order with apiClient call
        const data = await apiClient.completeTableOrder({ table_number: tableNumber });

        if (data.success) {
          await get().loadTableOrders();
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error completing table order:', error);
        return false;
      }
    },

    removeItemFromTable: async (tableNumber: number, itemIndex: number) => {
      try {
        const currentItems = get().tableOrders[tableNumber] || [];
        const updatedItems = currentItems.filter((_, index) => index !== itemIndex);
        return await get().updateTableOrder(tableNumber, updatedItems);
      } catch (error) {
        console.error('Error removing item from table:', error);
        return false;
      }
    },

    resetTableToAvailable: async (tableNumber: number) => {
      try {
        // ELECTRON: Replace brain.reset_table_to_available with apiClient call
        const data = await apiClient.resetTableToAvailable({ table_number: tableNumber });

        if (data.success) {
          set(state => ({
            tableOrders: {
              ...state.tableOrders,
              [tableNumber]: []
            },
            customerTabs: {
              ...state.customerTabs,
              [tableNumber]: []
            },
            optimisticCustomerTabs: {
              ...state.optimisticCustomerTabs,
              [tableNumber]: []
            },
            activeCustomerTab: {
              ...state.activeCustomerTab,
              [tableNumber]: null
            }
          }));
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error resetting table:', error);
        return false;
      }
    },

    forceRefresh: async () => {
      try {
        await get().loadTableOrders();
        console.log('✅ Table orders force refreshed');
      } catch (error) {
        console.error('❌ Error force refreshing table orders:', error);
      }
    },

    // Customer tab operations
    closeCustomerTab: async (tabId: string) => {
      return await get().updateCustomerTab(tabId, { status: 'paid' });
    },

    renameCustomerTab: async (tabId: string, newName: string) => {
      return await get().updateCustomerTab(tabId, { tab_name: newName });
    },

    setActiveCustomerTab: (tableNumber: number, tabId: string | null) => {
      set(state => ({
        activeCustomerTab: {
          ...state.activeCustomerTab,
          [tableNumber]: tabId
        }
      }));
    },

    deleteCustomerTab: async (tabId: string) => {
      try {
        // ELECTRON: Replace brain.delete_customer_tab with apiClient call
        const data = await apiClient.deleteCustomerTab({ tab_id: tabId });

        if (data.success) {
          // Find and remove from state
          const { customerTabs } = get();
          for (const [tableNumber, tabs] of Object.entries(customerTabs)) {
            const filteredTabs = tabs.filter(tab => tab.id !== tabId);
            if (filteredTabs.length !== tabs.length) {
              set(state => ({
                customerTabs: {
                  ...state.customerTabs,
                  [parseInt(tableNumber)]: filteredTabs
                },
                optimisticCustomerTabs: {
                  ...state.optimisticCustomerTabs,
                  [parseInt(tableNumber)]: filteredTabs
                }
              }));
              break;
            }
          }
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error deleting customer tab:', error);
        return false;
      }
    },

    removeItemFromCustomerTab: async (tabId: string, itemIndex: number) => {
      const { customerTabs } = get();
      let targetTab: CustomerTab | null = null;

      // Find the tab
      for (const tabs of Object.values(customerTabs)) {
        const tab = tabs.find(t => t.id === tabId);
        if (tab) {
          targetTab = tab;
          break;
        }
      }

      if (!targetTab) return false;

      const updatedItems = targetTab.order_items.filter((_, index) => index !== itemIndex);
      return await get().updateCustomerTab(tabId, { order_items: updatedItems });
    },

    updateCustomerTabItems: async (tabId: string, items: OrderItem[]) => {
      return await get().updateCustomerTab(tabId, { order_items: items });
    },

    completeCustomerTab: async (tabId: string) => {
      return await get().updateCustomerTab(tabId, { status: 'paid' });
    },

    // Utility functions
    hasExistingOrders: (tableNumber: number) => {
      const orders = get().tableOrders[tableNumber] || [];
      return orders.length > 0;
    },

    getTableStatus: (tableNumber: number) => {
      const persistedOrder = get().persistedTableOrders[tableNumber];
      return persistedOrder?.status || 'Available';
    },

    getTableOrders: (tableNumber: number) => {
      return get().tableOrders[tableNumber] || [];
    },

    getCustomerTabsForTable: (tableNumber: number) => {
      return get().optimisticCustomerTabs[tableNumber] || get().customerTabs[tableNumber] || [];
    },

    getActiveCustomerTab: (tableNumber: number) => {
      const activeTabId = get().activeCustomerTab[tableNumber];
      if (!activeTabId) return null;

      const tabs = get().getCustomerTabsForTable(tableNumber);
      return tabs.find(tab => tab.id === activeTabId) || null;
    },

    getCustomerTabById: (tabId: string) => {
      const { customerTabs } = get();
      for (const tabs of Object.values(customerTabs)) {
        const tab = tabs.find(t => t.id === tabId);
        if (tab) return tab;
      }
      return null;
    },

    hasActiveCustomerTabs: (tableNumber: number) => {
      const tabs = get().getCustomerTabsForTable(tableNumber);
      return tabs.some(tab => tab.status === 'active');
    },

    getLinkedTableCustomerTabs: (tableNumbers: number[]) => {
      const result: Record<number, CustomerTab[]> = {};
      tableNumbers.forEach(tableNum => {
        result[tableNum] = get().getCustomerTabsForTable(tableNum);
      });
      return result;
    },

    getLinkedTableGroup: (tableNumber: number) => {
      const persistedOrder = get().persistedTableOrders[tableNumber];
      if (!persistedOrder || !persistedOrder.linked_tables.length) {
        return null;
      }

      const allTableNumbers = [tableNumber, ...persistedOrder.linked_tables];
      const tables: TableWithTabs[] = allTableNumbers.map(tNum => ({
        tableNumber: tNum,
        guestCount: get().persistedTableOrders[tNum]?.guest_count || 0,
        status: get().getTableStatus(tNum),
        customerTabs: get().getCustomerTabsForTable(tNum),
        linkedTables: persistedOrder.linked_tables
      }));

      return {
        tables,
        primaryTable: tableNumber,
        guestCount: tables.reduce((sum, table) => sum + table.guestCount, 0)
      };
    },

    getTotalOrdersForLinkedTables: (tableNumbers: number[]) => {
      const allOrders: OrderItem[] = [];
      tableNumbers.forEach(tableNum => {
        const tableOrders = get().getTableOrders(tableNum);
        allOrders.push(...tableOrders);
      });
      return allOrders;
    },

    // Error handling utilities
    clearErrors: () => {
      set(state => ({
        errors: {
          tableErrors: {},
          customerTabErrors: {},
          globalError: null
        }
      }));
    },

    clearTableError: (tableNumber: number) => {
      set(state => ({
        errors: {
          ...state.errors,
          tableErrors: {
            ...state.errors.tableErrors,
            [tableNumber]: undefined
          }
        }
      }));
    },

    clearCustomerTabError: (tabId: string) => {
      set(state => ({
        errors: {
          ...state.errors,
          customerTabErrors: {
            ...state.errors.customerTabErrors,
            [tabId]: undefined
          }
        }
      }));
    },

    retryFailedOperation: async (operationType: string, ...args: any[]) => {
      // Implementation for retry logic
      console.log(`Retrying operation: ${operationType}`);
      return false;
    },

    syncCustomerTabsFromServer: async (tableNumber: number) => {
      await get().loadCustomerTabsForTable(tableNumber);
    },

    validateCustomerTabState: (tableNumber: number) => {
      const serverTabs = get().customerTabs[tableNumber] || [];
      const optimisticTabs = get().optimisticCustomerTabs[tableNumber] || [];

      // Basic validation - check if lengths match
      return serverTabs.length === optimisticTabs.length;
    }
  })
));

// Export helper for direct access to store state
export const tableOrdersStore = useTableOrdersStore.getState;

// Export actions for external usage
export const tableOrdersStoreActions = {
  initializeSchema: () => useTableOrdersStore.getState().initializeSchema(),
  loadTableOrders: () => useTableOrdersStore.getState().loadTableOrders(),
  createTableOrder: (tableNumber: number, guestCount: number, linkedTables?: number[]) => 
    useTableOrdersStore.getState().createTableOrder(tableNumber, guestCount, linkedTables),
  resetTableToAvailable: (tableNumber: number) => 
    useTableOrdersStore.getState().resetTableToAvailable(tableNumber),
  forceRefresh: () => useTableOrdersStore.getState().forceRefresh()
};

// Export customer tab actions separately for clarity
export const customerTabsActions = {
  createCustomerTab: (tableNumber: number, tabName: string, guestId?: string) => 
    useTableOrdersStore.getState().createCustomerTab(tableNumber, tabName, guestId),
  updateCustomerTab: (tabId: string, updates: any) => 
    useTableOrdersStore.getState().updateCustomerTab(tabId, updates),
  addItemsToCustomerTab: (tabId: string, items: OrderItem[]) => 
    useTableOrdersStore.getState().addItemsToCustomerTab(tabId, items),
  closeCustomerTab: (tabId: string) => 
    useTableOrdersStore.getState().closeCustomerTab(tabId),
  setActiveCustomerTab: (tableNumber: number, tabId: string | null) => 
    useTableOrdersStore.getState().setActiveCustomerTab(tableNumber, tabId)
};
