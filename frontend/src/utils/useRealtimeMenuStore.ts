/**
 * Realtime Menu Store Stub
 * Provides menu state management for POS operations
 */
import { create } from 'zustand';

interface FlexibleBillingItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface RealtimeMenuStore {
  // Flexible billing state
  flexibleBillingOpen: boolean;
  setFlexibleBillingOpen: (open: boolean) => void;
  flexibleBillingItems: FlexibleBillingItem[];
  setFlexibleBillingItems: (items: FlexibleBillingItem[]) => void;
  addFlexibleBillingItem: (item: FlexibleBillingItem) => void;
  removeFlexibleBillingItem: (itemId: string) => void;
  clearFlexibleBilling: () => void;
}

export const useRealtimeMenuStore = create<RealtimeMenuStore>((set) => ({
  // Flexible billing state
  flexibleBillingOpen: false,
  setFlexibleBillingOpen: (open) => set({ flexibleBillingOpen: open }),
  flexibleBillingItems: [],
  setFlexibleBillingItems: (items) => set({ flexibleBillingItems: items }),
  addFlexibleBillingItem: (item) => set((state) => ({
    flexibleBillingItems: [...state.flexibleBillingItems, item]
  })),
  removeFlexibleBillingItem: (itemId) => set((state) => ({
    flexibleBillingItems: state.flexibleBillingItems.filter(i => i.id !== itemId)
  })),
  clearFlexibleBilling: () => set({ flexibleBillingItems: [], flexibleBillingOpen: false })
}));
