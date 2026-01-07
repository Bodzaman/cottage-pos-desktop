




















import { create } from 'zustand';
import { apiClient } from 'app';
import { TableOrderItem } from './tableTypes';
import { supabase } from './supabaseClient';
import { toast } from 'sonner';

const isDev = import.meta.env?.DEV;

// ============================================================================
// ENHANCED TABLE ORDER TYPES
// ============================================================================

interface TableOrder {
  id?: string;
  table_number: number;
  order_items: OrderItem[];
  status: 'AVAILABLE' | 'SEATED';
  guest_count?: number;
  linked_tables: number[];
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
  status: 'AVAILABLE' | 'SEATED';
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
  // Core state - Session storage (ephemeral, current working session)
  tableOrders: Record<number, OrderItem[]>;
  
  // Persistent state - Supabase storage (survives refreshes, durable)
  persistedTableOrders: Record<number, TableOrder>;
  
  // UI state
  isLoading: boolean;

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
  
  // NEW: Advanced customer tab operations (split/merge/move)
  splitCustomerTab: (sourceTabId: string, newTabName: string, itemIndices: number[], guestId?: string) => Promise<{ success: boolean; originalTab?: CustomerTab; newTab?: CustomerTab; message: string }>;
  mergeCustomerTabs: (sourceTabId: string, targetTabId: string) => Promise<{ success: boolean; targetTab?: CustomerTab; message: string }>;
  moveItemsBetweenTabs: (sourceTabId: string, targetTabId: string, itemIndices: number[]) => Promise<{ success: boolean; sourceTab?: CustomerTab; targetTab?: CustomerTab; message: string }>;
  
  // Utilities (PRESERVED and ENHANCED)
  hasExistingOrders: (tableNumber: number) => boolean;
  getTableStatus: (tableNumber: number) => 'AVAILABLE' | 'SEATED';
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
  
  // Initialize schema
  initializeSchema: async () => {
    try {
      set({ isLoading: true });
      const response = await apiClient.setup_restaurant_schema();
      if (response.ok) {
        const data = await response.json();
        if (isDev) console.log('Schema setup result:', JSON.stringify(data, null, 2));
        await get().loadTableOrders();
      }
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
      if (isDev) console.log('🔧 Initializing customer tabs schema...');
      const response = await brain.setup_customer_tabs_schema();
      if (response.ok) {
        if (isDev) console.log('✅ Customer tabs schema initialized successfully');
      } else {
        throw new Error('Failed to initialize customer tabs schema');
      }
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
    // React StrictMode guard - prevent double initialization
    const state = get();
    if (state.isInitialized) {
      if (isDev) {
        console.log('⚠️ [tableOrdersStore] Already initialized, skipping loadTableOrders');
        console.log('📊 [tableOrdersStore] Current state:', {
          persistedCount: Object.keys(state.persistedTableOrders).length,
          tableOrders: Object.keys(state.tableOrders).length
        });
      }
      return;
    }

    if (isDev) console.log('🔄 [tableOrdersStore] Starting loadTableOrders...');
    set({ isLoading: true, error: null });

    try {
      if (isDev) console.log('📡 [tableOrdersStore] Fetching table orders from API...');
      const response = await brain.list_table_orders({});
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [tableOrdersStore] API error:', response.status, errorText);
        throw new Error("Failed to load table orders: " + response.status);
      }

      const data = (await response.json()) as { table_orders: TableOrderResponse[] };
      if (isDev) {
        console.log('✅ [tableOrdersStore] Received API response:', {
          count: data.table_orders?.length || 0,
          orders: data.table_orders?.map(o => ({ 
            id: o.id, 
            table_number: o.table_number, 
            status: o.status 
          })) || []
        });
      }

      const persistedOrders: Record<number, PersistentTableOrder> = {};

      if (data.table_orders && data.table_orders.length > 0) {
        if (isDev) console.log('🔄 [tableOrdersStore] Processing orders...');
        data.table_orders.forEach((order) => {
          const items = order.order_items || [];
          if (isDev) {
            console.log("📝 [tableOrdersStore] Processing order " + order.id + " for table " + order.table_number + ":", {
              itemsCount: items.length,
              status: order.status,
              items: items.map(i => ({ name: i.name, quantity: i.quantity }))
            });
          }

          persistedOrders[order.table_number] = {
            id: order.id,
            tableId: order.table_number,
            tableName: order.table_name || "Table " + order.table_number,
            items: items.map(item => ({
              id: item.id?.toString() || crypto.randomUUID(),
              menu_item_id: item.menu_item_id,
              variant_id: item.variant_id || '',
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity,
              variantName: item.variant_name || undefined,
              notes: item.notes || undefined,
              protein_type: item.protein_type || undefined,
              image_url: item.image_url || undefined,
              modifiers: [],
              customizations: item.customizations || [],
              category_id: item.category || '',
            })),
            subtotal: order.subtotal,
            tax: order.tax,
            total: order.total,
            status: order.status as 'active' | 'completed' | 'cancelled',
            createdAt: new Date(order.created_at),
            updatedAt: new Date(order.updated_at),
          };
        });
        
        if (isDev) {
          console.log('✅ [tableOrdersStore] All orders processed:', {
            totalTables: Object.keys(persistedOrders).length,
            tables: Object.keys(persistedOrders)
          });
        }
      } else {
        if (isDev) console.log('ℹ️ [tableOrdersStore] No active table orders found');
      }

      if (isDev) console.log('💾 [tableOrdersStore] Setting store state with processed orders');
      set({
        persistedTableOrders: persistedOrders,
        tableOrders: { ...persistedOrders },
        isLoading: false,
        isInitialized: true,
      });
      
      const finalState = get();
      if (isDev) {
        console.log('✅ [tableOrdersStore] Store state updated:', {
          isInitialized: finalState.isInitialized,
          persistedCount: Object.keys(finalState.persistedTableOrders).length,
          tableOrdersCount: Object.keys(finalState.tableOrders).length,
          tables: Object.keys(finalState.tableOrders)
        });
      }
    } catch (error) {
      console.error('❌ [tableOrdersStore] Error in loadTableOrders:', error);
      set({ error: (error as Error).message, isLoading: false, isInitialized: true });
    }
  },

  // ENHANCED: Load customer tabs for specific table with optimistic support
  loadCustomerTabsForTable: async (tableNumber: number) => {
    try {
      const response = await brain.list_customer_tabs_for_table({ tableNumber });
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.customer_tabs)) {
          set(state => ({
            customerTabs: {
              ...state.customerTabs,
              [tableNumber]: data.customer_tabs
            },
            optimisticCustomerTabs: {
              ...state.optimisticCustomerTabs,
              [tableNumber]: data.customer_tabs
            }
          }));
        }
      }
    } catch (error) {
      console.error("Failed to load customer tabs for table " + tableNumber + ":", error);
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
    const tempId = "temp-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
    
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
      const response = await brain.create_customer_tab({
        table_number: tableNumber,
        tab_name: tabName,
        guest_id: guestId
      });
      
      if (response.ok) {
        const data = await response.json();
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
          
          toast.success("Customer tab "" + tabName + "" created successfully");
          return realTab.id;
        }
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
      const response = await apiClient.update_customer_tab({ tab_id: tabId }, updates);
      
      if (response.ok) {
        const data = await response.json();
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
      const response = await brain.add_items_to_customer_tab({ tab_id: tabId }, { items });
      
      if (response.ok) {
        const data = await response.json();
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
          
          toast.success("Added " + items.length + " items to customer tab");
          return true;
        }
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
      const response = await brain.close_customer_tab({ tabId: tabId });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
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
          
          toast.success('Customer tab closed successfully');
          return true;
        }
      }
      throw new Error('Failed to close customer tab');
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

  // NEW: Split customer tab
  splitCustomerTab: async (sourceTabId: string, newTabName: string, itemIndices: number[], guestId?: string) => {
    try {
      const response = await brain.split_tab({
        source_tab_id: sourceTabId,
        new_tab_name: newTabName,
        item_indices: itemIndices,
        guest_id: guestId
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.original_tab && data.new_tab) {
          // Update state with both tabs
          const tableNumber = data.original_tab.table_number;
          
          set(state => {
            const existingTabs = state.customerTabs[tableNumber] || [];
            const updatedTabs = existingTabs.map(tab => 
              tab.id === sourceTabId ? data.original_tab : tab
            );
            
            // Add the new tab
            updatedTabs.push(data.new_tab);
            
            return {
              customerTabs: {
                ...state.customerTabs,
                [tableNumber]: updatedTabs
              },
              optimisticCustomerTabs: {
                ...state.optimisticCustomerTabs,
                [tableNumber]: updatedTabs
              }
            };
          });
          
          toast.success(data.message);
          return {
            success: true,
            originalTab: data.original_tab,
            newTab: data.new_tab,
            message: data.message
          };
        }
      }
      
      const errorData = await response.json();
      toast.error(errorData.message || 'Failed to split tab');
      return {
        success: false,
        message: errorData.message || 'Failed to split tab'
      };
      
    } catch (error) {
      console.error('Error splitting tab:', error);
      toast.error('Failed to split tab');
      return {
        success: false,
        message: 'Failed to split tab'
      };
    }
  },

  // NEW: Merge customer tabs
  mergeCustomerTabs: async (sourceTabId: string, targetTabId: string) => {
    try {
      const response = await apiClient.merge_tabs({
        source_tab_id: sourceTabId,
        target_tab_id: targetTabId
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.target_tab) {
          // Update state - remove source tab, update target tab
          const tableNumber = data.target_tab.table_number;
          
          set(state => {
            const existingTabs = state.customerTabs[tableNumber] || [];
            const updatedTabs = existingTabs
              .filter(tab => tab.id !== sourceTabId) // Remove source tab
              .map(tab => tab.id === targetTabId ? data.target_tab : tab); // Update target tab
            
            // Update active tab if source was active
            const newActiveTab = state.activeCustomerTab[tableNumber] === sourceTabId 
              ? targetTabId 
              : state.activeCustomerTab[tableNumber];
            
            return {
              customerTabs: {
                ...state.customerTabs,
                [tableNumber]: updatedTabs
              },
              optimisticCustomerTabs: {
                ...state.optimisticCustomerTabs,
                [tableNumber]: updatedTabs
              },
              activeCustomerTab: {
                ...state.activeCustomerTab,
                [tableNumber]: newActiveTab
              }
            };
          });
          
          toast.success(data.message);
          return {
            success: true,
            targetTab: data.target_tab,
            message: data.message
          };
        }
      }
      
      const errorData = await response.json();
      toast.error(errorData.message || 'Failed to merge tabs');
      return {
        success: false,
        message: errorData.message || 'Failed to merge tabs'
      };
      
    } catch (error) {
      console.error('Error merging tabs:', error);
      toast.error('Failed to merge tabs');
      return {
        success: false,
        message: 'Failed to merge tabs'
      };
    }
  },

  // NEW: Move items between customer tabs
  moveItemsBetweenTabs: async (sourceTabId: string, targetTabId: string, itemIndices: number[]) => {
    try {
      const response = await brain.move_items_between_tabs({
        source_tab_id: sourceTabId,
        target_tab_id: targetTabId,
        item_indices: itemIndices
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.source_tab && data.target_tab) {
          // Update state with both updated tabs
          const tableNumber = data.source_tab.table_number;
          
          set(state => {
            const existingTabs = state.customerTabs[tableNumber] || [];
            const updatedTabs = existingTabs.map(tab => {
              if (tab.id === sourceTabId) return data.source_tab;
              if (tab.id === targetTabId) return data.target_tab;
              return tab;
            });
            
            return {
              customerTabs: {
                ...state.customerTabs,
                [tableNumber]: updatedTabs
              },
              optimisticCustomerTabs: {
                ...state.optimisticCustomerTabs,
                [tableNumber]: updatedTabs
              }
            };
          });
          
          toast.success(data.message);
          return {
            success: true,
            sourceTab: data.source_tab,
            targetTab: data.target_tab,
            message: data.message
          };
        }
      }
      
      const errorData = await response.json();
      toast.error(errorData.message || 'Failed to move items');
      return {
        success: false,
        message: errorData.message || 'Failed to move items'
      };
      
    } catch (error) {
      console.error('Error moving items between tabs:', error);
      toast.error('Failed to move items between tabs');
      return {
        success: false,
        message: 'Failed to move items between tabs'
      };
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
      const response = await brain.delete_customer_tab({ tab_id: tabId });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
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
          
          toast.success('Customer tab deleted successfully');
          return true;
        }
      }
      throw new Error('Failed to delete customer tab');
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
  
  // Create new table order (seat guests)
  createTableOrder: async (tableNumber: number, guestCount: number, linkedTables = []) => {
    try {
      const response = await apiClient.create_table_order({
        table_number: tableNumber,
        guest_count: guestCount,
        linked_tables: linkedTables
      });
      
      const data = await response.json();
      
      if (response.ok && data.success && data.table_order) {
        const tableOrder = data.table_order;
        
        set((state) => ({
          persistedTableOrders: {
            ...state.persistedTableOrders,
            [tableNumber]: tableOrder
          },
          tableOrders: {
            ...state.tableOrders,
            [tableNumber]: []
          }
        }));
        
        return true;
      } else {
        toast.error(data.message || 'Failed to create table order');
        return false;
      }
      
    } catch (error) {
      console.error('Failed to create table order:', error);
      toast.error('Failed to seat guests at table');
      return false;
    }
  },
  
  // Update table order items
  updateTableOrder: async (tableNumber: number, items: OrderItem[]) => {
    try {
      // Update local state immediately for fast UI
      set((state) => ({
        tableOrders: {
          ...state.tableOrders,
          [tableNumber]: items
        }
      }));
      
      const response = await brain.update_table_order({ tableNumber }, {
        order_items: items
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.table_order) {
          set((state) => ({
            persistedTableOrders: {
              ...state.persistedTableOrders,
              [tableNumber]: data.table_order
            }
          }));
          
          return true;
        }
      }
      
      // Revert local state on failure
      const state = get();
      const persistedOrder = state.persistedTableOrders[tableNumber];
      if (persistedOrder) {
        set((state) => ({
          tableOrders: {
            ...state.tableOrders,
            [tableNumber]: persistedOrder.items
          }
        }));
      }
      
      const errorData = await response.json();
      toast.error(errorData.message || 'Failed to update table order');
      return false;
      
    } catch (error) {
      console.error('Failed to update table order:', error);
      toast.error('Failed to update table order');
      return false;
    }
  },
  
  // Add items to existing table order
  addItemsToTable: async (tableNumber: number, items: OrderItem[]) => {
    try {
      // ✅ FIXED: Transform OrderItem to match backend API structure (AppApisTableOrdersOrderItem)
      const backendItems = items.map(item => ({
        id: item.id,
        menu_item_id: item.menu_item_id || item.id, // ✅ FIXED: Ensure menu_item_id exists
        variant_id: item.variant_id || null,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        variant_name: item.variantName || null,
        notes: item.notes || null,
        protein_type: item.protein_type || null,
        image_url: item.image_url || null
      }));
      
      // ✅ FIXED: Pass tableNumber as object parameter matching AddItemsToTableParams
      const response = await apiClient.add_items_to_table({ tableNumber }, backendItems);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.table_order) {
          const tableOrder = data.table_order;
          
          set((state) => ({
            persistedTableOrders: {
              ...state.persistedTableOrders,
              [tableNumber]: tableOrder
            },
            tableOrders: {
              ...state.tableOrders,
              [tableNumber]: tableOrder.items
            }
          }));
          
          return true;
        }
      }
      
      const errorData = await response.json();
      toast.error(errorData.message || 'Failed to add items to table');
      return false;
      
    } catch (error) {
      console.error('Failed to add items to table:', error);
      toast.error('Failed to add items to table');
      return false;
    }
  },

  // Remove specific item from table order by index
  removeItemFromTable: async (tableNumber: number, itemIndex: number) => {
    try {
      const state = get();
      const tableOrder = state.persistedTableOrders[tableNumber];
      
      if (!tableOrder || !tableOrder.items) {
        toast.error('No order found for this table');
        return false;
      }
      
      // Create updated items array without the item at specified index
      const updatedItems = tableOrder.items.filter((_, index) => index !== itemIndex);
      
      // Transform items to backend format (same as addItemsToTable)
      const backendItems = updatedItems.map(item => ({
        id: item.id,
        menu_item_id: item.menu_item_id || item.id,
        variant_id: item.variant_id || null,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        variant_name: item.variantName || null,
        notes: item.notes || null,
        protein_type: item.protein_type || null,
        image_url: item.image_url || null
      }));
      
      // Update local state immediately for fast UI
      set((state) => ({
        tableOrders: {
          ...state.tableOrders,
          [tableNumber]: updatedItems
        }
      }));
      
      // Update in Supabase
      const response = await brain.update_table_order({ tableNumber }, {
        order_items: backendItems
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.table_order) {
          set((state) => ({
            persistedTableOrders: {
              ...state.persistedTableOrders,
              [tableNumber]: data.table_order
            }
          }));
          
          return true;
        }
      }
      
      // Revert local state on failure
      set((state) => ({
        tableOrders: {
          ...state.tableOrders,
          [tableNumber]: tableOrder.items
        }
      }));
      
      const errorData = await response.json();
      toast.error(errorData.message || 'Failed to remove item from table');
      return false;
      
    } catch (error) {
      console.error('Failed to remove item from table:', error);
      toast.error('Failed to remove item from table');
      return false;
    }
  },
  
  // Complete table order (final bill paid)
  completeTableOrder: async (tableNumber: number) => {
    try {
      const response = await brain.complete_table_order({ tableNumber });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
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
        }
      } else {
        // Only read error data if response is NOT ok
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to complete table order');
        return false;
      }
      
      // If response.ok but data.success is false
      toast.error('Failed to complete table order');
      return false;
      
    } catch (error) {
      console.error('Failed to complete table order:', error);
      toast.error('Failed to complete table order');
      return false;
    }
  },
  
  // Reset table to available (for final bill completion)
  resetTableToAvailable: async (tableNumber: number) => {
    try {
      const response = await brain.reset_table_to_available({ tableNumber });
      if (response.ok) {
        // Remove from local state
        const { persistedTableOrders } = get();
        const updatedOrders = { ...persistedTableOrders };
        delete updatedOrders[tableNumber];
        
        set({
          persistedTableOrders: updatedOrders,
          lastSync: Date.now()
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error resetting table to available:', error);
      return false;
    }
  },

  // Force refresh data from server (useful for syncing after external changes)
  forceRefresh: async () => {
    if (isDev) console.log('🔄 Force refreshing table orders from database...');
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

  retryFailedOperation: async (operationType: string, ...args: any[]) => {
    const { options } = get();
    
    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      try {
        switch (operationType) {
          case 'createCustomerTab':
            return await get().createCustomerTab(args[0], args[1], args[2]);
          case 'updateCustomerTab':
            return await get().updateCustomerTab(args[0], args[1]);
          case 'addItemsToCustomerTab':
            return await get().addItemsToCustomerTab(args[0], args[1]);
          case 'closeCustomerTab':
            return await get().closeCustomerTab(args[0]);
          case 'deleteCustomerTab':
            return await get().deleteCustomerTab(args[0]);
          default:
            throw new Error("Unknown operation type: " + operationType);
        }
      } catch (error) {
        console.warn("Retry attempt " + attempt + "/" + options.maxRetries + " failed for " + operationType + ":", error);
        
        if (attempt === options.maxRetries) {
          toast.error("Failed to " + operationType + " after " + options.maxRetries + " attempts");
          return false;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    return false;
  },

  // NEW: State synchronization utilities
  syncCustomerTabsFromServer: async (tableNumber: number) => {
    try {
      set(state => ({ syncInProgress: true }));
      
      const response = await brain.list_customer_tabs_for_table({ tableNumber });
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.customer_tabs)) {
          set(state => ({
            customerTabs: {
              ...state.customerTabs,
              [tableNumber]: data.customer_tabs
            },
            optimisticCustomerTabs: {
              ...state.optimisticCustomerTabs,
              [tableNumber]: data.customer_tabs
            }
          }));
          if (isDev) console.log("✅ Synced " + data.customer_tabs.length + " customer tabs for table " + tableNumber);
        }
      }
    } catch (error) {
      console.error("Failed to sync customer tabs for table " + tableNumber + ":", error);
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
      set(state => ({ syncInProgress: false }));
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
        console.warn("Active customer tab " + activeTabId + " not found for table " + tableNumber);
        // Auto-correct by setting first available tab as active
        const availableTabs = optimisticTabs.length > 0 ? optimisticTabs : realTabs;
        const newActiveTab = availableTabs.length > 0 ? availableTabs[0].id : null;
        get().setActiveCustomerTab(tableNumber, newActiveTab);
        return false;
      }
    }
    
    // Check for inconsistencies between optimistic and real state
    if (optimisticTabs.length !== realTabs.length) {
      console.warn("State inconsistency detected for table " + tableNumber + ": optimistic=" + optimisticTabs.length + ", real=" + realTabs.length);
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
  useTableOrdersStore.subscribe(
    (state) => state.lastSync,
    (lastSync) => {
      if (lastSync > 0) {
        const timeSinceSync = Date.now() - lastSync;
        if (timeSinceSync > useTableOrdersStore.getState().options.syncInterval) {
          console.warn('⚠️ Customer tabs may be out of sync with server');
        }
      }
    }
  );

  // Auto-sync interval for critical tables
  setInterval(async () => {
    const state = useTableOrdersStore.getState();
    
    // Only sync tables that have active customer tabs and are not currently syncing
    if (!state.syncInProgress) {
      for (const [tableNumber, tabs] of Object.entries(state.customerTabs)) {
        // ⚠️ SKIP polling for DINE-IN mode tables (they use event-driven architecture)
        // Only poll for legacy modes: WAITING, COLLECTION, DELIVERY
        // DINE-IN tables are managed by useCustomerTabs + useDineInOrder hooks with real-time subscriptions
        const isEventDrivenTable = tabs.length > 0 && tabs.some(tab => tab.status === 'active');
        
        // Skip event-driven DINE-IN tables to prevent dual architecture conflict
        if (isEventDrivenTable) {
          console.log("[tableOrdersStore] ⏭️ Skipping legacy polling for DINE-IN table " + tableNumber + " (using event-driven architecture)");
          continue;
        }
        
        if (tabs.length > 0 && state.hasActiveCustomerTabs(parseInt(tableNumber))) {
          await state.syncCustomerTabsFromServer(parseInt(tableNumber));
        }
      }
    }
  }, useTableOrdersStore.getState().options.syncInterval);
}
