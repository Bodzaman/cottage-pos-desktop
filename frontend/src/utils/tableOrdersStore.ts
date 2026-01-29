











// ... existing code ...

import { create } from 'zustand';
import {
  getTableOrders as fetchTableOrdersQuery,
  createTableOrder as createTableOrderQuery,
  updateTableOrderItems,
  addItemsToTableOrder,
  completeTableOrder as completeTableOrderQuery,
  resetTableToAvailable as resetTableQuery,
  getCustomerTabsForTable,
  getCustomerTabsForOrder,
  createCustomerTab as createCustomerTabQuery,
  updateCustomerTab as updateCustomerTabQuery,
  addItemsToCustomerTab as addItemsToCustomerTabQuery,
  closeCustomerTab as closeCustomerTabQuery,
  deleteCustomerTab as deleteCustomerTabQuery,
  OrderItem as SupabaseOrderItem,
  CustomerTab as SupabaseCustomerTab
} from './supabaseQueries';
import { TableOrderItem } from './tableTypes';
import { supabase } from './supabaseClient';
import { toast } from 'sonner';
import type { OrderItem } from 'types';

const isDev = import.meta.env?.DEV;

// ============================================================================
// ENHANCED TABLE ORDER TYPES
// ============================================================================

interface TableOrder {
  id?: string;
  table_number: number;
  order_items: OrderItem[];
  items?: OrderItem[]; // alias for compatibility
  status: 'active' | 'completed' | 'cancelled' | 'AVAILABLE' | 'SEATED'; // supports both order and table statuses
  guest_count?: number;
  linked_tables?: number[];
  created_at?: string;
  updated_at?: string;
}

// Frontend representation for UI display
interface PersistentTableOrder {
  id?: string;
  tableId: number;
  tableName: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// ENHANCED: Customer Tab types with better type safety
// Use the local OrderItem type for customer tabs (maps to app's canonical OrderItem)
interface CustomerTab {
  id: string;
  table_number: number;
  order_id?: string;  // Links tab to specific order (source of truth for cleanup)
  tab_name: string;
  order_items: OrderItem[];
  status: 'active' | 'paid' | 'cancelled';
  guest_id?: string | null;
  created_at: string;
  updated_at: string;
}

// Helper to map Supabase CustomerTab to local CustomerTab
function mapSupabaseCustomerTab(tab: SupabaseCustomerTab): CustomerTab {
  return {
    id: tab.id,
    table_number: tab.table_number,
    order_id: (tab as any).order_id,  // New field for order-scoped tabs
    tab_name: tab.tab_name,
    order_items: (tab.order_items || []).map(mapSupabaseOrderItemToOrderItem),
    status: tab.status,
    guest_id: tab.guest_id,
    created_at: tab.created_at,
    updated_at: tab.updated_at
  };
}

// Helper to map Supabase OrderItem (snake_case) to local OrderItem (camelCase)
function mapSupabaseOrderItemToOrderItem(item: SupabaseOrderItem): OrderItem {
  return {
    id: item.id,
    menuItemId: item.menu_item_id,
    variantId: item.variant_id || undefined,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    variantName: item.variant_name || undefined,
    notes: item.notes || undefined,
    proteinType: item.protein_type || undefined,
    imageUrl: item.image_url || undefined,
    modifiers: [],
    customizations: item.customizations || [],
    categoryId: item.category || undefined
  };
}

// Helper to map local OrderItem (camelCase) to Supabase OrderItem (snake_case)
function mapOrderItemToSupabase(item: OrderItem): SupabaseOrderItem {
  return {
    id: item.id,
    menu_item_id: item.menuItemId,
    variant_id: item.variantId || null,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    variant_name: item.variantName || null,
    notes: item.notes || null,
    protein_type: item.proteinType || null,
    image_url: item.imageUrl || null,
    customizations: item.customizations || [],
    category: item.categoryId
  };
}

// NEW: Enhanced table structure supporting both customer tabs and linked tables
interface TableWithTabs {
  tableNumber: number;
  guestCount: number;
  status: TableOrder['status']; // Match TableOrder status type
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
  tableErrors: Record<number, string | undefined>;
  customerTabErrors: Record<string, string | undefined>;
  globalError: string | null;
}

interface TableOrdersState {
  // Core state - Session storage (ephemeral, current working session)
  tableOrders: Record<number, OrderItem[]>;

  // Persistent state - Supabase storage (survives refreshes, durable)
  persistedTableOrders: Record<number, TableOrder>;

  // UI state
  isLoading: boolean;

  // Error state for legacy compatibility
  error: string | null;

  // Initialization flag (prevents double-init)
  isInitialized: boolean;
  
  // ENHANCED: Customer tabs state management with optimistic updates
  customerTabs: Record<number, CustomerTab[]>;
  activeCustomerTab: Record<number, string | null>;
  optimisticCustomerTabs: Record<number, CustomerTab[]>;
  
  // NEW: Performance and caching
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
  loadCustomerTabsForOrder: (orderId: string, tableNumber: number) => Promise<void>;
  createCustomerTab: (tableNumber: number, tabName: string, orderId: string, guestId?: string) => Promise<string | null>;
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
  
  // NEW: Advanced customer tab operations (split/merge/move)
  splitCustomerTab: (sourceTabId: string, newTabName: string, itemIndices: number[], guestId?: string) => Promise<{ success: boolean; originalTab?: CustomerTab; newTab?: CustomerTab; message: string }>;
  mergeCustomerTabs: (sourceTabId: string, targetTabId: string) => Promise<{ success: boolean; targetTab?: CustomerTab; message: string }>;
  moveItemsBetweenTabs: (sourceTabId: string, targetTabId: string, itemIndices: number[]) => Promise<{ success: boolean; sourceTab?: CustomerTab; targetTab?: CustomerTab; message: string }>;
  
  // Utilities (PRESERVED and ENHANCED)
  hasExistingOrders: (tableNumber: number) => boolean;
  getTableStatus: (tableNumber: number) => TableOrder['status'];
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

export const useTableOrdersStore = create<TableOrdersState>((set, get) => ({
  // Enhanced initial state
  tableOrders: {},
  persistedTableOrders: {},

  // ENHANCED: Customer tabs with optimistic support
  customerTabs: {},
  activeCustomerTab: {},
  optimisticCustomerTabs: {}, // NEW: For immediate UI updates

  isLoading: false,
  error: null,
  isInitialized: false,
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
  
  // Initialize schema - Now a no-op since we use direct Supabase (schema already exists)
  initializeSchema: async () => {
    try {
      set({ isLoading: true });
      // Schema setup is no longer needed - tables exist in Supabase
      // Just load the existing table orders
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

  // Customer tabs schema initialization - Now a no-op since we use direct Supabase
  initializeCustomerTabsSchema: async () => {
    try {
      // Schema setup is no longer needed - tables exist in Supabase
    } catch (error) {
      set(state => ({
        errors: {
          ...state.errors,
          globalError: 'Customer tabs schema setup failed'
        }
      }));
    }
  },

  // Load table orders - Direct Supabase query (no backend needed)
  loadTableOrders: async () => {
    // React StrictMode guard - prevent double initialization
    const state = get();
    if (state.isInitialized) {
      return;
    }

    set({ isLoading: true, error: null });

    try {

      // Direct Supabase query - no backend needed
      const fetchedTableOrders = await fetchTableOrdersQuery();

      const persistedOrders: Record<number, TableOrder> = {};
      const sessionOrders: Record<number, OrderItem[]> = {};

      if (fetchedTableOrders && fetchedTableOrders.length > 0) {
        fetchedTableOrders.forEach((order: any) => {
          const rawItems = order.order_items || [];

          // Map to local OrderItem format (camelCase)
          const mappedItems: OrderItem[] = rawItems.map((item: any) => ({
            id: item.id?.toString() || crypto.randomUUID(),
            menuItemId: item.menu_item_id,
            variantId: item.variant_id || undefined,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            variantName: item.variant_name || undefined,
            notes: item.notes || undefined,
            proteinType: item.protein_type || undefined,
            imageUrl: item.image_url || undefined,
            modifiers: [],
            customizations: item.customizations || [],
            categoryId: item.category || undefined,
          }));

          persistedOrders[order.table_number] = {
            id: order.id,
            table_number: order.table_number,
            order_items: mappedItems,
            items: mappedItems, // alias for compatibility
            status: order.status as 'AVAILABLE' | 'SEATED',
            guest_count: order.guest_count,
            linked_tables: order.linked_tables || [],
            created_at: order.created_at,
            updated_at: order.updated_at,
          };

          sessionOrders[order.table_number] = mappedItems;
        });
      }

      set({
        persistedTableOrders: persistedOrders,
        tableOrders: sessionOrders,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false, isInitialized: true });
    }
  },

  // ENHANCED: Load customer tabs for specific table with optimistic support - Direct Supabase
  // @deprecated Use loadCustomerTabsForOrder instead - tabs should be scoped to orders
  loadCustomerTabsForTable: async (tableNumber: number) => {
    try {
      // Direct Supabase query - no backend needed
      const supabaseTabs = await getCustomerTabsForTable(tableNumber);
      const mappedTabs: CustomerTab[] = supabaseTabs.map(mapSupabaseCustomerTab);
      set(state => ({
        customerTabs: {
          ...state.customerTabs,
          [tableNumber]: mappedTabs
        },
        optimisticCustomerTabs: {
          ...state.optimisticCustomerTabs,
          [tableNumber]: mappedTabs
        }
      }));
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

  // NEW: Load customer tabs for specific order (preferred - scoped to order lifecycle)
  loadCustomerTabsForOrder: async (orderId: string, tableNumber: number) => {
    try {
      // Direct Supabase query - scoped to order
      const supabaseTabs = await getCustomerTabsForOrder(orderId);
      const mappedTabs: CustomerTab[] = supabaseTabs.map(mapSupabaseCustomerTab);
      set(state => ({
        customerTabs: {
          ...state.customerTabs,
          [tableNumber]: mappedTabs
        },
        optimisticCustomerTabs: {
          ...state.optimisticCustomerTabs,
          [tableNumber]: mappedTabs
        }
      }));
    } catch (error) {
      console.error(`Failed to load customer tabs for order ${orderId}:`, error);
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
  // orderId is now required to scope tabs to order lifecycle
  createCustomerTab: async (tableNumber: number, tabName: string, orderId: string, guestId?: string) => {
    const { options } = get();
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Optimistic update
    if (options.enableOptimisticUpdates) {
      const optimisticTab: CustomerTab = {
        id: tempId,
        table_number: tableNumber,
        order_id: orderId,
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
      // Direct Supabase query - pass orderId to scope tab to order lifecycle
      const supabaseTab = await createCustomerTabQuery(tableNumber, tabName, orderId, guestId);
      const realTab = mapSupabaseCustomerTab(supabaseTab);

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

      // Success - no toast needed, UI updates visually
      return realTab.id;
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
      const updatedTab: CustomerTab = {
        ...originalTab,
        tab_name: updates.tab_name ?? originalTab.tab_name,
        order_items: updates.order_items ?? originalTab.order_items,
        status: (updates.status as CustomerTab['status']) ?? originalTab.status,
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
      // Convert order_items to Supabase format if present
      const supabaseUpdates: Record<string, unknown> = { ...updates };
      if (updates.order_items) {
        supabaseUpdates.order_items = updates.order_items.map(mapOrderItemToSupabase);
      }

      // Direct Supabase query - no backend needed
      const supabaseResult = await updateCustomerTabQuery(tabId, supabaseUpdates as any);
      const mappedTab = mapSupabaseCustomerTab(supabaseResult);

      // Update real state
      set(state => ({
        customerTabs: {
          ...state.customerTabs,
          [tableNumber!]: state.customerTabs[tableNumber!]?.map(tab =>
            tab.id === tabId ? mappedTab : tab
          ) || []
        }
      }));

      return true;
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
      // Convert items to Supabase format
      const supabaseItems = items.map(mapOrderItemToSupabase);

      // Direct Supabase query - no backend needed
      const supabaseResult = await addItemsToCustomerTabQuery(tabId, supabaseItems);
      const mappedTab = mapSupabaseCustomerTab(supabaseResult);

      // Update real state
      set(state => ({
        customerTabs: {
          ...state.customerTabs,
          [tableNumber!]: state.customerTabs[tableNumber!]?.map(tab =>
            tab.id === tabId ? mappedTab : tab
          ) || []
        }
      }));

      // Success - no toast needed, UI updates visually
      return true;
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

  // ENHANCED: Close customer tab
  closeCustomerTab: async (tabId: string) => {
    const { options, customerTabs, activeCustomerTab } = get();
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
      set(state => {
        const updatedTabs = state.optimisticCustomerTabs[tableNumber!]?.filter(tab => tab.id !== tabId) || [];
        const newActiveTab = state.activeCustomerTab[tableNumber!] === tabId
          ? (updatedTabs.length > 0 ? updatedTabs[0].id : null)
          : state.activeCustomerTab[tableNumber!];

        return {
          optimisticCustomerTabs: {
            ...state.optimisticCustomerTabs,
            [tableNumber!]: updatedTabs
          },
          activeCustomerTab: {
            ...state.activeCustomerTab,
            [tableNumber!]: newActiveTab
          }
        };
      });
    }

    try {
      // Direct Supabase query - no backend needed
      await closeCustomerTabQuery(tabId);

      // Update real state
      set(state => {
        const updatedTabs = state.customerTabs[tableNumber!]?.filter(tab => tab.id !== tabId) || [];
        const newActiveTab = state.activeCustomerTab[tableNumber!] === tabId
          ? (updatedTabs.length > 0 ? updatedTabs[0].id : null)
          : state.activeCustomerTab[tableNumber!];

        return {
          customerTabs: {
            ...state.customerTabs,
            [tableNumber!]: updatedTabs
          },
          activeCustomerTab: {
            ...state.activeCustomerTab,
            [tableNumber!]: newActiveTab
          }
        };
      });

      // Success - no toast needed, UI updates visually
      return true;
    } catch (error) {
      console.error('Error closing customer tab:', error);
      
      // Rollback optimistic update
      if (options.enableOptimisticUpdates) {
        set(state => ({
          optimisticCustomerTabs: {
            ...state.optimisticCustomerTabs,
            [tableNumber!]: [...(state.optimisticCustomerTabs[tableNumber!] || []), originalTab!]
          },
          activeCustomerTab: {
            ...state.activeCustomerTab,
            [tableNumber!]: activeCustomerTab[tableNumber!]
          },
          errors: {
            ...state.errors,
            customerTabErrors: {
              ...state.errors.customerTabErrors,
              [tabId]: 'Failed to close customer tab'
            }
          }
        }));
      }
      
      toast.error('Failed to close customer tab');
      return false;
    }
  },

  // ENHANCED: Rename customer tab
  renameCustomerTab: async (tabId: string, newName: string) => {
    return get().updateCustomerTab(tabId, { tab_name: newName });
  },

  /**
   * Split customer tab - Move selected items to a new tab
   * Creates a new tab and reassigns selected items to it via dine_in_order_items.customer_tab_id
   */
  splitCustomerTab: async (sourceTabId: string, newTabName: string, itemIndices: number[], guestId?: string) => {
    const { customerTabs } = get();

    try {
      // Find source tab and table number
      let tableNumber: number | null = null;
      let sourceTab: CustomerTab | null = null;

      for (const [tNum, tabs] of Object.entries(customerTabs)) {
        const tab = tabs.find(t => t.id === sourceTabId);
        if (tab) {
          tableNumber = parseInt(tNum);
          sourceTab = tab;
          break;
        }
      }

      if (!tableNumber || !sourceTab) {
        return { success: false, message: 'Source tab not found' };
      }

      // Get items from source tab
      const { data: sourceItems, error: fetchError } = await supabase
        .from('dine_in_order_items')
        .select('*')
        .eq('customer_tab_id', sourceTabId)
        .order('created_at');

      if (fetchError || !sourceItems) {
        console.error('Failed to fetch source tab items:', fetchError);
        return { success: false, message: 'Failed to fetch source tab items' };
      }

      // Get items to move based on indices
      const itemsToMove = itemIndices.map(idx => sourceItems[idx]).filter(Boolean);
      if (itemsToMove.length === 0) {
        return { success: false, message: 'No valid items to move' };
      }

      // Create new tab
      const { data: newTabData, error: createError } = await supabase
        .from('customer_tabs')
        .insert({
          table_number: tableNumber,
          tab_name: newTabName,
          status: 'active',
          guest_id: guestId || null
        })
        .select()
        .single();

      if (createError || !newTabData) {
        console.error('Failed to create new tab:', createError);
        return { success: false, message: 'Failed to create new tab' };
      }

      // Move items to new tab
      const itemIds = itemsToMove.map(item => item.id);
      const { error: moveError } = await supabase
        .from('dine_in_order_items')
        .update({ customer_tab_id: newTabData.id })
        .in('id', itemIds);

      if (moveError) {
        console.error('Failed to move items to new tab:', moveError);
        // Rollback: delete the new tab
        await supabase.from('customer_tabs').delete().eq('id', newTabData.id);
        return { success: false, message: 'Failed to move items to new tab' };
      }

      // Refresh tabs from database
      await get().loadCustomerTabsForTable(tableNumber);

      // Success - no toast needed, UI updates visually
      return {
        success: true,
        originalTab: sourceTab,
        newTab: { ...sourceTab, id: newTabData.id, tab_name: newTabName },
        message: `Split ${itemsToMove.length} items to new tab`
      };

    } catch (error) {
      console.error('Split tab error:', error);
      return { success: false, message: 'Failed to split tab' };
    }
  },

  /**
   * Merge customer tabs - Combine all items from source tab into target tab
   * Moves items via dine_in_order_items.customer_tab_id, then deletes source tab
   */
  mergeCustomerTabs: async (sourceTabId: string, targetTabId: string) => {
    const { customerTabs } = get();

    try {
      // Find both tabs
      let tableNumber: number | null = null;
      let sourceTab: CustomerTab | null = null;
      let targetTab: CustomerTab | null = null;

      for (const [tNum, tabs] of Object.entries(customerTabs)) {
        for (const tab of tabs) {
          if (tab.id === sourceTabId) {
            sourceTab = tab;
            tableNumber = parseInt(tNum);
          }
          if (tab.id === targetTabId) {
            targetTab = tab;
          }
        }
      }

      if (!sourceTab || !targetTab || !tableNumber) {
        return { success: false, message: 'Source or target tab not found' };
      }

      // Move all items from source to target
      const { error: moveError } = await supabase
        .from('dine_in_order_items')
        .update({ customer_tab_id: targetTabId })
        .eq('customer_tab_id', sourceTabId);

      if (moveError) {
        console.error('Failed to merge tab items:', moveError);
        return { success: false, message: 'Failed to merge tab items' };
      }

      // Delete source tab
      const { error: deleteError } = await supabase
        .from('customer_tabs')
        .delete()
        .eq('id', sourceTabId);

      if (deleteError) {
        console.error('Failed to delete source tab:', deleteError);
        // Items already moved, so this is a partial success
      }

      // Refresh tabs from database
      await get().loadCustomerTabsForTable(tableNumber);

      // Success - no toast needed, UI updates visually
      return {
        success: true,
        targetTab,
        message: `Merged tabs successfully`
      };

    } catch (error) {
      console.error('Merge tabs error:', error);
      return { success: false, message: 'Failed to merge tabs' };
    }
  },

  /**
   * Move items between customer tabs
   * Updates dine_in_order_items.customer_tab_id for selected items
   */
  moveItemsBetweenTabs: async (sourceTabId: string, targetTabId: string, itemIndices: number[]) => {
    const { customerTabs } = get();

    try {
      // Find source tab
      let tableNumber: number | null = null;
      let sourceTab: CustomerTab | null = null;
      let targetTab: CustomerTab | null = null;

      for (const [tNum, tabs] of Object.entries(customerTabs)) {
        for (const tab of tabs) {
          if (tab.id === sourceTabId) {
            sourceTab = tab;
            tableNumber = parseInt(tNum);
          }
          if (tab.id === targetTabId) {
            targetTab = tab;
          }
        }
      }

      if (!sourceTab || !targetTab || !tableNumber) {
        return { success: false, message: 'Source or target tab not found' };
      }

      // Get items from source tab
      const { data: sourceItems, error: fetchError } = await supabase
        .from('dine_in_order_items')
        .select('*')
        .eq('customer_tab_id', sourceTabId)
        .order('created_at');

      if (fetchError || !sourceItems) {
        console.error('Failed to fetch source tab items:', fetchError);
        return { success: false, message: 'Failed to fetch source tab items' };
      }

      // Get items to move based on indices
      const itemsToMove = itemIndices.map(idx => sourceItems[idx]).filter(Boolean);
      if (itemsToMove.length === 0) {
        return { success: false, message: 'No valid items to move' };
      }

      // Move items to target tab
      const itemIds = itemsToMove.map(item => item.id);
      const { error: moveError } = await supabase
        .from('dine_in_order_items')
        .update({ customer_tab_id: targetTabId })
        .in('id', itemIds);

      if (moveError) {
        console.error('Failed to move items:', moveError);
        return { success: false, message: 'Failed to move items' };
      }

      // Refresh tabs from database
      await get().loadCustomerTabsForTable(tableNumber);

      // Success - no toast needed, UI updates visually
      return {
        success: true,
        sourceTab,
        targetTab,
        message: `Moved ${itemsToMove.length} items`
      };

    } catch (error) {
      console.error('Move items error:', error);
      return { success: false, message: 'Failed to move items' };
    }
  },

  // NEW: Delete customer tab
  deleteCustomerTab: async (tabId: string) => {
    const { options, customerTabs, activeCustomerTab } = get();
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
      set(state => {
        const updatedTabs = state.optimisticCustomerTabs[tableNumber!]?.filter(tab => tab.id !== tabId) || [];
        const newActiveTab = state.activeCustomerTab[tableNumber!] === tabId
          ? (updatedTabs.length > 0 ? updatedTabs[0].id : null)
          : state.activeCustomerTab[tableNumber!];

        return {
          optimisticCustomerTabs: {
            ...state.optimisticCustomerTabs,
            [tableNumber!]: updatedTabs
          },
          activeCustomerTab: {
            ...state.activeCustomerTab,
            [tableNumber!]: newActiveTab
          }
        };
      });
    }

    try {
      // Direct Supabase query - no backend needed
      await deleteCustomerTabQuery(tabId);

      // Update real state
      set(state => {
        const updatedTabs = state.customerTabs[tableNumber!]?.filter(tab => tab.id !== tabId) || [];
        const newActiveTab = state.activeCustomerTab[tableNumber!] === tabId
          ? (updatedTabs.length > 0 ? updatedTabs[0].id : null)
          : state.activeCustomerTab[tableNumber!];

        return {
          customerTabs: {
            ...state.customerTabs,
            [tableNumber!]: updatedTabs
          },
          activeCustomerTab: {
            ...state.activeCustomerTab,
            [tableNumber!]: newActiveTab
          }
        };
      });

      // Success - no toast needed, UI updates visually
      return true;
    } catch (error) {
      console.error('Error deleting customer tab:', error);
      
      // Rollback optimistic update
      if (options.enableOptimisticUpdates) {
        set(state => ({
          optimisticCustomerTabs: {
            ...state.optimisticCustomerTabs,
            [tableNumber!]: [...(state.optimisticCustomerTabs[tableNumber!] || []), originalTab!]
          },
          activeCustomerTab: {
            ...state.activeCustomerTab,
            [tableNumber!]: activeCustomerTab[tableNumber!]
          },
          errors: {
            ...state.errors,
            customerTabErrors: {
              ...state.errors.customerTabErrors,
              [tabId]: 'Failed to delete customer tab'
            }
          }
        }));
      }
      
      toast.error('Failed to delete customer tab');
      return false;
    }
  },

  // NEW: Remove item from customer tab
  removeItemFromCustomerTab: async (tabId: string, itemIndex: number) => {
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
    
    if (!tableNumber || !originalTab || itemIndex >= originalTab.order_items.length) {
      toast.error('Customer tab or item not found');
      return false;
    }

    const updatedItems = [...originalTab.order_items];
    updatedItems.splice(itemIndex, 1);
    
    return get().updateCustomerTab(tabId, { order_items: updatedItems });
  },

  // NEW: Update customer tab items
  updateCustomerTabItems: async (tabId: string, items: OrderItem[]) => {
    return get().updateCustomerTab(tabId, { order_items: items });
  },

  // NEW: Complete customer tab
  completeCustomerTab: async (tabId: string) => {
    return get().updateCustomerTab(tabId, { status: 'paid' });
  },

  // NEW: Set active customer tab for a table
  setActiveCustomerTab: (tableNumber: number, tabId: string | null) => {
    set(state => ({
      activeCustomerTab: {
        ...state.activeCustomerTab,
        [tableNumber]: tabId
      }
    }));
  },
  
  // Create new table order (seat guests) - Direct Supabase
  createTableOrder: async (tableNumber: number, guestCount: number, linkedTables: number[] = []) => {
    try {
      // Direct Supabase query - no backend needed
      const supabaseOrder = await createTableOrderQuery(tableNumber, guestCount, linkedTables);

      // Map to local TableOrder format
      const mappedTableOrder: TableOrder = {
        id: supabaseOrder.id,
        table_number: supabaseOrder.table_number,
        order_items: [],
        items: [],
        status: supabaseOrder.status as 'AVAILABLE' | 'SEATED',
        guest_count: supabaseOrder.guest_count,
        linked_tables: supabaseOrder.linked_tables || [],
        created_at: supabaseOrder.created_at,
        updated_at: supabaseOrder.updated_at
      };

      set((state) => ({
        persistedTableOrders: {
          ...state.persistedTableOrders,
          [tableNumber]: mappedTableOrder
        },
        tableOrders: {
          ...state.tableOrders,
          [tableNumber]: []
        }
      }));

      return true;
    } catch (error) {
      console.error('Failed to create table order:', error);
      toast.error('Failed to seat guests at table');
      return false;
    }
  },

  // Update table order items - Direct Supabase
  updateTableOrder: async (tableNumber: number, items: OrderItem[]) => {
    try {
      // Update local state immediately for fast UI
      set((state) => ({
        tableOrders: {
          ...state.tableOrders,
          [tableNumber]: items
        }
      }));

      // Convert to Supabase format for the query
      const supabaseItems = items.map(mapOrderItemToSupabase);

      // Direct Supabase query - no backend needed
      const updatedOrder = await updateTableOrderItems(tableNumber, supabaseItems);

      // Map back to local format
      const mappedOrderItems = (updatedOrder.order_items || []).map((item: any) =>
        mapSupabaseOrderItemToOrderItem(item)
      );

      const mappedTableOrder: TableOrder = {
        id: updatedOrder.id,
        table_number: updatedOrder.table_number,
        order_items: mappedOrderItems,
        items: mappedOrderItems,
        status: updatedOrder.status,
        guest_count: updatedOrder.guest_count,
        linked_tables: updatedOrder.linked_tables || [],
        created_at: updatedOrder.created_at,
        updated_at: updatedOrder.updated_at
      };

      set((state) => ({
        persistedTableOrders: {
          ...state.persistedTableOrders,
          [tableNumber]: mappedTableOrder
        }
      }));

      return true;
    } catch (error) {
      console.error('Failed to update table order:', error);

      // Revert local state on failure
      const currentState = get();
      const persistedOrder = currentState.persistedTableOrders[tableNumber];
      const orderItems = persistedOrder?.order_items || persistedOrder?.items;
      if (persistedOrder && orderItems) {
        set((state) => ({
          tableOrders: {
            ...state.tableOrders,
            [tableNumber]: orderItems
          }
        }));
      }

      toast.error('Failed to update table order');
      return false;
    }
  },
  
  // Add items to existing table order - Direct Supabase
  addItemsToTable: async (tableNumber: number, items: OrderItem[]) => {
    try {
      // Transform OrderItem (camelCase) to Supabase format (snake_case)
      const dbItems = items.map(mapOrderItemToSupabase);

      // Direct Supabase query - no backend needed
      const updatedOrder = await addItemsToTableOrder(tableNumber, dbItems);

      // Map the returned order_items back to camelCase
      const mappedOrderItems = (updatedOrder.order_items || []).map((item: SupabaseOrderItem) =>
        mapSupabaseOrderItemToOrderItem(item)
      );

      // Create a properly typed TableOrder
      const mappedTableOrder: TableOrder = {
        id: updatedOrder.id,
        table_number: updatedOrder.table_number,
        order_items: mappedOrderItems,
        items: mappedOrderItems,
        status: updatedOrder.status,
        guest_count: updatedOrder.guest_count,
        linked_tables: updatedOrder.linked_tables || [],
        created_at: updatedOrder.created_at,
        updated_at: updatedOrder.updated_at
      };

      set((state) => ({
        persistedTableOrders: {
          ...state.persistedTableOrders,
          [tableNumber]: mappedTableOrder
        },
        tableOrders: {
          ...state.tableOrders,
          [tableNumber]: mappedOrderItems
        }
      }));

      return true;
    } catch (error) {
      console.error('Failed to add items to table:', error);
      toast.error('Failed to add items to table');
      return false;
    }
  },

  // Remove specific item from table order by index - Direct Supabase
  removeItemFromTable: async (tableNumber: number, itemIndex: number) => {
    try {
      const currentState = get();
      const tableOrder = currentState.persistedTableOrders[tableNumber];
      const orderItems = tableOrder?.order_items || tableOrder?.items;

      if (!tableOrder || !orderItems) {
        toast.error('No order found for this table');
        return false;
      }

      // Create updated items array without the item at specified index
      const updatedItems = orderItems.filter((_: OrderItem, index: number) => index !== itemIndex);

      // Update local state immediately for fast UI
      set((state) => ({
        tableOrders: {
          ...state.tableOrders,
          [tableNumber]: updatedItems
        }
      }));

      // Convert to Supabase format for the query
      const supabaseItems = updatedItems.map(mapOrderItemToSupabase);

      // Direct Supabase update - no backend needed
      const updatedOrder = await updateTableOrderItems(tableNumber, supabaseItems);

      // Map back to local format
      const mappedOrderItems = (updatedOrder.order_items || []).map((item: any) =>
        mapSupabaseOrderItemToOrderItem(item)
      );

      const mappedTableOrder: TableOrder = {
        id: updatedOrder.id,
        table_number: updatedOrder.table_number,
        order_items: mappedOrderItems,
        items: mappedOrderItems,
        status: updatedOrder.status,
        guest_count: updatedOrder.guest_count,
        linked_tables: updatedOrder.linked_tables || [],
        created_at: updatedOrder.created_at,
        updated_at: updatedOrder.updated_at
      };

      set((state) => ({
        persistedTableOrders: {
          ...state.persistedTableOrders,
          [tableNumber]: mappedTableOrder
        }
      }));

      return true;
    } catch (error) {
      console.error('Failed to remove item from table:', error);

      // Revert local state on failure
      const currentState = get();
      const tableOrder = currentState.persistedTableOrders[tableNumber];
      const orderItems = tableOrder?.order_items || tableOrder?.items;
      if (tableOrder && orderItems) {
        set((state) => ({
          tableOrders: {
            ...state.tableOrders,
            [tableNumber]: orderItems
          }
        }));
      }

      toast.error('Failed to remove item from table');
      return false;
    }
  },

  // Complete table order (final bill paid) - Direct Supabase
  completeTableOrder: async (tableNumber: number) => {
    try {
      // Direct Supabase query - no backend needed
      await completeTableOrderQuery(tableNumber);

      set((state) => {
        const newTableOrders = { ...state.tableOrders };
        const newPersistedOrders = { ...state.persistedTableOrders };

        delete newTableOrders[tableNumber];
        delete newPersistedOrders[tableNumber];

        return {
          tableOrders: newTableOrders,
          persistedTableOrders: newPersistedOrders
        };
      });

      return true;
    } catch (error) {
      console.error('Failed to complete table order:', error);
      toast.error('Failed to complete table order');
      return false;
    }
  },

  // Reset table to available (for final bill completion) - Direct Supabase
  resetTableToAvailable: async (tableNumber: number) => {
    try {
      // Direct Supabase query - no backend needed
      await resetTableQuery(tableNumber);

      // Remove from local state
      const { persistedTableOrders } = get();
      const updatedOrders = { ...persistedTableOrders };
      delete updatedOrders[tableNumber];

      set({
        persistedTableOrders: updatedOrders,
        lastSync: Date.now()
      });

      return true;
    } catch (error) {
      console.error('Error resetting table to available:', error);
      return false;
    }
  },

  // Force refresh data from server (useful for syncing after external changes)
  forceRefresh: async () => {
    set({ isInitialized: false });
    await get().loadTableOrders();
  },
  
  // Utility functions
  hasExistingOrders: (tableNumber: number) => {
    const { persistedTableOrders, customerTabs } = get();
    // Check if table is seated (has persistent status) OR has current session orders OR has active customer tabs
    const tableStatus = persistedTableOrders[tableNumber]?.status;
    const hasCurrentOrders = get().tableOrders[tableNumber]?.length > 0;
    const hasActiveCustomerTabs = customerTabs[tableNumber]?.length > 0;
    return tableStatus === 'SEATED' || hasCurrentOrders || hasActiveCustomerTabs;
  },

  getTableStatus: (tableNumber: number) => {
    const { persistedTableOrders } = get();
    return persistedTableOrders[tableNumber]?.status || 'AVAILABLE';
  },

  getTableOrders: (tableNumber: number) => {
    const { tableOrders } = get();
    return tableOrders[tableNumber] || [];
  },

  // ENHANCED: Customer tab utilities with optimistic state preference
  getCustomerTabsForTable: (tableNumber: number) => {
    const { optimisticCustomerTabs, customerTabs, options } = get();
    
    // Use optimistic state if available and optimistic updates are enabled
    if (options.enableOptimisticUpdates && optimisticCustomerTabs[tableNumber]) {
      return optimisticCustomerTabs[tableNumber];
    }
    
    return customerTabs[tableNumber] || [];
  },

  getActiveCustomerTab: (tableNumber: number) => {
    const { activeCustomerTab } = get();
    const activeTabId = activeCustomerTab[tableNumber];
    
    if (!activeTabId) return null;
    
    const tabs = get().getCustomerTabsForTable(tableNumber);
    return tabs.find(tab => tab.id === activeTabId) || null;
  },

  getCustomerTabById: (tabId: string) => {
    const { optimisticCustomerTabs, customerTabs, options } = get();
    
    // Search in optimistic state first if enabled
    if (options.enableOptimisticUpdates) {
      for (const tabs of Object.values(optimisticCustomerTabs)) {
        const tab = tabs.find(t => t.id === tabId);
        if (tab) return tab;
      }
    }
    
    // Fallback to regular state
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

  // NEW: Advanced utilities for linked tables with customer tabs
  getLinkedTableCustomerTabs: (tableNumbers: number[]) => {
    const result: Record<number, CustomerTab[]> = {};
    
    for (const tableNumber of tableNumbers) {
      result[tableNumber] = get().getCustomerTabsForTable(tableNumber);
    }
    
    return result;
  },

  getLinkedTableGroup: (tableNumber: number) => {
    const { persistedTableOrders } = get();
    const tableOrder = persistedTableOrders[tableNumber];
    
    if (!tableOrder || !tableOrder.linked_tables || tableOrder.linked_tables.length === 0) {
      return null;
    }
    
    const allTableNumbers = [tableNumber, ...tableOrder.linked_tables];
    const tables: TableWithTabs[] = [];
    let totalGuestCount = 0;
    
    for (const tNum of allTableNumbers) {
      const order = persistedTableOrders[tNum];
      if (order) {
        tables.push({
          tableNumber: tNum,
          guestCount: order.guest_count || 0,
          status: order.status,
          customerTabs: get().getCustomerTabsForTable(tNum),
          linkedTables: order.linked_tables || []
        });
        totalGuestCount += order.guest_count || 0;
      }
    }
    
    return {
      tables,
      primaryTable: tableNumber,
      guestCount: totalGuestCount
    };
  },

  getTotalOrdersForLinkedTables: (tableNumbers: number[]) => {
    const { tableOrders } = get();
    const allOrders: OrderItem[] = [];
    
    for (const tableNumber of tableNumbers) {
      const orders = tableOrders[tableNumber] || [];
      allOrders.push(...orders);
    }
    
    // Also include customer tab orders
    for (const tableNumber of tableNumbers) {
      const customerTabs = get().getCustomerTabsForTable(tableNumber);
      for (const tab of customerTabs) {
        allOrders.push(...tab.order_items);
      }
    }
    
    return allOrders;
  },

  // NEW: Performance and error handling utilities
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

  retryFailedOperation: async (operationType: string, ...args: unknown[]): Promise<boolean> => {
    const { options } = get();

    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      try {
        let result: unknown;
        switch (operationType) {
          case 'createCustomerTab':
            result = await get().createCustomerTab(args[0] as number, args[1] as string, args[2] as string | undefined);
            // createCustomerTab returns string | null, convert to boolean
            return result !== null;
          case 'updateCustomerTab':
            return await get().updateCustomerTab(args[0] as string, args[1] as { tab_name?: string; order_items?: OrderItem[]; status?: string });
          case 'addItemsToCustomerTab':
            return await get().addItemsToCustomerTab(args[0] as string, args[1] as OrderItem[]);
          case 'closeCustomerTab':
            return await get().closeCustomerTab(args[0] as string);
          case 'deleteCustomerTab':
            return await get().deleteCustomerTab(args[0] as string);
          default:
            throw new Error(`Unknown operation type: ${operationType}`);
        }
      } catch (error) {

        if (attempt === options.maxRetries) {
          toast.error(`Failed to ${operationType} after ${options.maxRetries} attempts`);
          return false;
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    return false;
  },

  // NEW: State synchronization utilities - Direct Supabase
  syncCustomerTabsFromServer: async (tableNumber: number) => {
    try {
      set({ syncInProgress: true });

      // Direct Supabase query - no backend needed
      const supabaseTabs = await getCustomerTabsForTable(tableNumber);
      const mappedTabs: CustomerTab[] = supabaseTabs.map(mapSupabaseCustomerTab);

      set(state => ({
        customerTabs: {
          ...state.customerTabs,
          [tableNumber]: mappedTabs
        },
        optimisticCustomerTabs: {
          ...state.optimisticCustomerTabs,
          [tableNumber]: mappedTabs
        }
      }));
    } catch (error) {
      console.error(`Failed to sync customer tabs for table ${tableNumber}:`, error);
      set(state => ({
        errors: {
          ...state.errors,
          tableErrors: {
            ...state.errors.tableErrors,
            [tableNumber]: 'Failed to sync customer tabs from server'
          }
        }
      }));
    } finally {
      set({ syncInProgress: false });
    }
  },

  validateCustomerTabState: (tableNumber: number) => {
    const { customerTabs, optimisticCustomerTabs, activeCustomerTab } = get();
    
    const realTabs = customerTabs[tableNumber] || [];
    const optimisticTabs = optimisticCustomerTabs[tableNumber] || [];
    const activeTabId = activeCustomerTab[tableNumber];
    
    // Check if active tab exists
    if (activeTabId) {
      const tabExists = optimisticTabs.some(tab => tab.id === activeTabId) || 
                       realTabs.some(tab => tab.id === activeTabId);
      
      if (!tabExists) {
        // Auto-correct by setting first available tab as active
        const availableTabs = optimisticTabs.length > 0 ? optimisticTabs : realTabs;
        const newActiveTab = availableTabs.length > 0 ? availableTabs[0].id : null;
        get().setActiveCustomerTab(tableNumber, newActiveTab);
        return false;
      }
    }
    
    // Check for inconsistencies between optimistic and real state
    if (optimisticTabs.length !== realTabs.length) {
      return false;
    }
    
    return true;
  }
}));

// ============================================================================
// ENHANCED STORE INSTANCE WITH PERFORMANCE MONITORING
// ============================================================================

// Export store instance for direct access
export const tableOrdersStore = useTableOrdersStore.getState();

// Performance monitoring subscription
if (typeof window !== 'undefined') {
  useTableOrdersStore.subscribe((state) => {
    const lastSync = state.lastSync;
    if (lastSync > 0) {
      const timeSinceSync = Date.now() - lastSync;
      if (timeSinceSync > useTableOrdersStore.getState().options.syncInterval) {
        // Sync interval exceeded - could trigger sync here
      }
    }
  });

  // Auto-sync interval for critical tables
  setInterval(async () => {
    const state = useTableOrdersStore.getState();
    
    // Only sync tables that have active customer tabs and are not currently syncing
    if (!state.syncInProgress) {
      for (const [tableNumber, tabs] of Object.entries(state.customerTabs)) {
        if (tabs.length > 0 && state.hasActiveCustomerTabs(parseInt(tableNumber))) {
          await state.syncCustomerTabsFromServer(parseInt(tableNumber));
        }
      }
    }
  }, useTableOrdersStore.getState().options.syncInterval);
}
