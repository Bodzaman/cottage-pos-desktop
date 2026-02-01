/**
 * Menu UI Store - Thin Zustand store for UI state only
 *
 * This store manages ONLY UI state (selections, filters, modal state).
 * All data fetching is handled by React Query hooks in menuQueries.ts.
 *
 * Migration from realtimeMenuStore:
 * - Data state → useMenuBundle() from menuQueries.ts
 * - UI state → this store
 * - Realtime updates → useMenuRealtimeSync() from menuRealtimeSync.ts
 */

import { create } from 'zustand';
import { OrderItem } from './types';
import { TableData } from './tableTypes';

// FlexibleBillingModal types (moved from realtimeMenuStore)
export interface FlexibleBillingModalState {
  isOpen: boolean;
  orderItems: OrderItem[];
  linkedTables: TableData[];
  primaryTableNumber: number;
  splitMode: 'equal' | 'custom' | 'by-item';
}

interface MenuUIState {
  // Category selection
  selectedParentCategory: string | null;
  selectedMenuCategory: string | null;

  // Search
  searchQuery: string;

  // FlexibleBillingModal state
  flexibleBillingModal: FlexibleBillingModalState;

  // AI Context state (UI-only, actual context in React Query)
  aiContextStatus: 'idle' | 'loading' | 'ready' | 'error';
}

interface MenuUIActions {
  // Category selection
  setSelectedParentCategory: (categoryId: string | null) => void;
  setSelectedMenuCategory: (categoryId: string | null) => void;

  // Search
  setSearchQuery: (query: string) => void;

  // FlexibleBillingModal actions
  openFlexibleBillingModal: (
    orderItems: OrderItem[],
    linkedTables: TableData[],
    primaryTableNumber: number
  ) => void;
  closeFlexibleBillingModal: () => void;
  setFlexibleBillingMode: (mode: 'equal' | 'custom' | 'by-item') => void;
  updateFlexibleBillingItems: (items: OrderItem[]) => void;

  // AI Context UI state
  setAIContextStatus: (status: 'idle' | 'loading' | 'ready' | 'error') => void;

  // Reset all UI state
  resetUIState: () => void;
}

const initialState: MenuUIState = {
  selectedParentCategory: null,
  selectedMenuCategory: null,
  searchQuery: '',
  flexibleBillingModal: {
    isOpen: false,
    orderItems: [],
    linkedTables: [],
    primaryTableNumber: 0,
    splitMode: 'equal'
  },
  aiContextStatus: 'idle'
};

export const useMenuUIStore = create<MenuUIState & MenuUIActions>()((set) => ({
  ...initialState,

  // Category selection
  setSelectedParentCategory: (categoryId) => set({ selectedParentCategory: categoryId }),
  setSelectedMenuCategory: (categoryId) => set({ selectedMenuCategory: categoryId }),

  // Search
  setSearchQuery: (query) => set({ searchQuery: query }),

  // FlexibleBillingModal actions
  openFlexibleBillingModal: (orderItems, linkedTables, primaryTableNumber) => {
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

  setFlexibleBillingMode: (mode) => {
    set((state) => ({
      flexibleBillingModal: {
        ...state.flexibleBillingModal,
        splitMode: mode
      }
    }));
  },

  updateFlexibleBillingItems: (items) => {
    set((state) => ({
      flexibleBillingModal: {
        ...state.flexibleBillingModal,
        orderItems: items
      }
    }));
  },

  // AI Context UI state
  setAIContextStatus: (status) => set({ aiContextStatus: status }),

  // Reset all UI state
  resetUIState: () => set(initialState)
}));
