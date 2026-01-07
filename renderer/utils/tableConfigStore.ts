/**
 * Table Configuration Store - Reactive source of truth for table data
 * 
 * This store provides fast, reactive access to table configuration data
 * by loading it once during POS initialization and maintaining it in memory.
 * 
 * Pattern: Follows realtimeMenuStore architecture for consistency
 * - Load once during POS bundle initialization
 * - Subscribe from components for instant rendering
 * - No network calls on component mount
 */

import { create } from 'zustand';
import { apiClient } from 'app';
import { PosTableResponse } from 'types';
import { toast } from 'sonner';

const isDev = import.meta.env?.DEV;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface TableConfigState {
  // Data state
  tables: PosTableResponse[];
  
  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  lastUpdate: number;
  error: string | null;
  
  // Actions
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  setTables: (tables: PosTableResponse[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// ============================================================================
// GLOBAL FLAGS (Prevent duplicate initializations)
// ============================================================================

let isTableConfigInitializing = false;
let tableConfigLoadTime = 0;

// ============================================================================
// STORE DEFINITION
// ============================================================================

export const useTableConfigStore = create<TableConfigState>((set, get) => ({
  // Initial state
  tables: [],
  isLoading: false,
  isInitialized: false,
  lastUpdate: 0,
  error: null,
  
  // ============================================================================
  // INITIALIZATION (Called during POS bundle load)
  // ============================================================================
  
  initialize: async () => {
    // Prevent concurrent initializations
    if (isTableConfigInitializing) {
      if (isDev) console.log('⏭️ [Table Config Store] Already initializing, skipping duplicate request...');
      return;
    }
    
    const state = get();
    
    if (state.isLoading) {
      if (isDev) console.log('[Table Config Store] Already loading, skipping...');
      return;
    }
    
    // Check if data is fresh (loaded within last 30 seconds)
    const timeSinceLoad = Date.now() - tableConfigLoadTime;
    const isFresh = timeSinceLoad < 30000; // 30 seconds
    
    if (isFresh && state.isInitialized) {
      if (isDev) console.log(`✨ [Table Config Store] Data is fresh (${(timeSinceLoad / 1000).toFixed(1)}s old), skipping reload`);
      return;
    }
    
    isTableConfigInitializing = true;
    set({ isLoading: true, error: null });
    
    try {
      if (isDev) console.log('🔄 [Table Config Store] Initializing table configuration...');
      
      // Load table configuration from backend
      await state.refresh();
      
      set({ 
        isLoading: false,
        isInitialized: true,
        lastUpdate: Date.now()
      });
      
      tableConfigLoadTime = Date.now();
      
      if (isDev) console.log('✅ [Table Config Store] Initialized successfully with', get().tables.length, 'tables');
      
    } catch (error) {
      console.error('❌ Error initializing table config store:', error);
      set({ 
        isLoading: false,
        isInitialized: false,
        error: error instanceof Error ? error.message : 'Failed to initialize table configuration'
      });
      
      toast.error('Failed to load table configuration');
    } finally {
      isTableConfigInitializing = false;
    }
  },
  
  // ============================================================================
  // REFRESH DATA
  // ============================================================================
  
  refresh: async () => {
    try {
      set({ isLoading: true, error: null });
      
      if (isDev) console.log('🔄 [Table Config Store] Fetching table data...');
      
      const response = await apiClient.get_tables();
      const data = await response.json();
      
      if (data.success && Array.isArray(data.tables)) {
        if (isDev) console.log('✅ [Table Config Store] Loaded', data.tables.length, 'tables');
        
        set({ 
          tables: data.tables,
          isLoading: false,
          lastUpdate: Date.now(),
          error: null
        });
      } else {
        throw new Error(data.message || 'Failed to fetch table configuration');
      }
      
    } catch (error) {
      console.error('❌ Error refreshing table config:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh table data';
      
      set({ 
        error: errorMessage,
        isLoading: false
      });
      
      throw error;
    }
  },
  
  // ============================================================================
  // STATE SETTERS
  // ============================================================================
  
  setTables: (tables: PosTableResponse[]) => {
    set({ 
      tables,
      lastUpdate: Date.now(),
      error: null
    });
  },
  
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  
  setError: (error: string | null) => {
    set({ error });
  }
}));

// ============================================================================
// BUNDLE LOADER (Called during POS initialization)
// ============================================================================

/**
 * Load table config as part of POS bundle initialization
 * This should be called during usePOSInitialization
 */
export const loadTableConfig = async (): Promise<boolean> => {
  try {
    const store = useTableConfigStore.getState();
    await store.initialize();
    return true;
  } catch (error) {
    console.error('❌ Failed to load table config:', error);
    return false;
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get table by number
 */
export const getTableByNumber = (tableNumber: number): PosTableResponse | undefined => {
  const { tables } = useTableConfigStore.getState();
  return tables.find(t => t.table_number === tableNumber);
};

/**
 * Get all linked tables (including primary)
 */
export const getLinkedTables = (): PosTableResponse[] => {
  const { tables } = useTableConfigStore.getState();
  return tables.filter(t => t.is_linked_table || t.is_linked_primary);
};

/**
 * Get primary table in a linked group
 */
export const getPrimaryLinkedTable = (): PosTableResponse | undefined => {
  const { tables } = useTableConfigStore.getState();
  return tables.find(t => t.is_linked_primary);
};
