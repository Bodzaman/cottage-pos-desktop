/**
 * posOrderStore.ts
 * 
 * Focused Zustand store for POS order state management
 * Separates order-specific state from general UI/customer state to reduce re-renders
 * 
 * Key Benefits:
 * - Components subscribe only to order-related changes
 * - No re-renders when UI modals or customer data changes
 * - Cleaner separation of concerns
 */

import { create } from 'zustand';
import { OrderItem } from './menuTypes';

// ============================================================================
// ORDER STORE TYPE
// ============================================================================

export interface OrderStore {
  // Order State
  orderItems: OrderItem[];
  orderType: 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
  selectedTableNumber: number | null;
  guestCount: number;
  
  // Order Actions
  addItem: (item: OrderItem) => void;
  removeItem: (index: number) => void;
  incrementItem: (index: number) => void;
  decrementItem: (index: number) => void;
  updateItemNotes: (index: number, notes: string) => void;
  updateItem: (index: number, updates: Partial<OrderItem>) => void;
  updateItemWithCustomizations: (itemId: string, updates: {
    quantity?: number;
    customizations?: any[];
    notes?: string;
  }) => void;
  clearOrder: () => void;
  
  // Order Type & Table Management
  setOrderType: (orderType: 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING') => void;
  setSelectedTable: (tableNumber: number | null) => void;
  setSelectedTableNumber: (tableNumber: number | null) => void; // Alias for setSelectedTable
  setGuestCount: (count: number) => void;
  
  // Bulk Operations
  setOrderItems: (items: OrderItem[] | ((prev: OrderItem[]) => OrderItem[])) => void;
  replaceOrder: (items: OrderItem[]) => void;
  
  // Computed Properties (helpers)
  getOrderTotal: () => number;
  getItemCount: () => number;
}

// ============================================================================
// ORDER STORE IMPLEMENTATION
// ============================================================================

export const usePOSOrderStore = create<OrderStore>((set, get) => ({
  // ============================================================================
  // INITIAL STATE
  // ============================================================================
  orderItems: [],
  orderType: 'COLLECTION',
  selectedTableNumber: null,
  guestCount: 2,
  
  // ============================================================================
  // ORDER ITEM ACTIONS
  // ============================================================================
  
  addItem: (item: OrderItem) => {
    set(state => ({
      orderItems: [...state.orderItems, item]
    }));
  },
  
  removeItem: (index: number) => {
    set(state => ({
      orderItems: state.orderItems.filter((_, i) => i !== index)
    }));
  },
  
  incrementItem: (index: number) => {
    set(state => ({
      orderItems: state.orderItems.map((item, i) => 
        i === index 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    }));
  },
  
  decrementItem: (index: number) => {
    set(state => {
      const item = state.orderItems[index];
      if (!item) return state;
      
      // Remove item if quantity would become 0
      if (item.quantity <= 1) {
        return {
          orderItems: state.orderItems.filter((_, i) => i !== index)
        };
      }
      
      // Otherwise decrement
      return {
        orderItems: state.orderItems.map((item, i) => 
          i === index
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      };
    });
  },
  
  updateItemNotes: (index: number, notes: string) => {
    set(state => ({
      orderItems: state.orderItems.map((item, i) => 
        i === index
          ? { ...item, notes }
          : item
      )
    }));
  },
  
  updateItem: (index: number, updates: Partial<OrderItem>) => {
    set(state => ({
      orderItems: state.orderItems.map((item, i) => 
        i === index
          ? { ...item, ...updates }
          : item
      )
    }));
  },
  
  /**
   * Update item by ID with customizations, quantity, and notes
   * Matches DINE-IN pattern for editing existing items via StaffCustomizationModal
   * Used by Takeaway modes (WAITING/COLLECTION/DELIVERY)
   */
  updateItemWithCustomizations: (itemId: string, updates: {
    quantity?: number;
    customizations?: any[];
    notes?: string;
  }) => {
    set(state => ({
      orderItems: state.orderItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            ...(updates.quantity !== undefined && { quantity: updates.quantity }),
            ...(updates.customizations !== undefined && { customizations: updates.customizations }),
            ...(updates.notes !== undefined && { notes: updates.notes })
          };
        }
        return item;
      })
    }));
  },
  
  clearOrder: () => {
    set({
      orderItems: [],
      selectedTableNumber: null,
      guestCount: 2
    });
  },
  
  // ============================================================================
  // ORDER TYPE & TABLE MANAGEMENT
  // ============================================================================
  
  setOrderType: (orderType) => {
    set({ orderType });
  },
  
  setSelectedTable: (tableNumber) => {
    set({ selectedTableNumber: tableNumber });
  },
  
  setSelectedTableNumber: (tableNumber) => {
    set({ selectedTableNumber: tableNumber });
  },
  
  setGuestCount: (count) => {
    set({ guestCount: count });
  },
  
  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================
  
  setOrderItems: (items: OrderItem[] | ((prev: OrderItem[]) => OrderItem[])) => {
    set(state => ({
      orderItems: typeof items === 'function' ? items(state.orderItems) : items
    }));
  },
  
  replaceOrder: (items) => {
    set({ orderItems: items });
  },
  
  // ============================================================================
  // COMPUTED PROPERTIES
  // ============================================================================
  
  getOrderTotal: () => {
    const { orderItems } = get();
    return orderItems.reduce((total, item) => {
      const itemPrice = item.price || 0;
      const modifiersTotal = (item.modifiers || []).reduce(
        (sum, mod) => sum + (mod.price || 0),
        0
      );
      return total + (itemPrice + modifiersTotal) * item.quantity;
    }, 0);
  },
  
  getItemCount: () => {
    const { orderItems } = get();
    return orderItems.reduce((count, item) => count + item.quantity, 0);
  }
}));
