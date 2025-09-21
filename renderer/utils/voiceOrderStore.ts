import { create } from 'zustand';
import brain from '../brain';
import { toast } from 'sonner';
import { supabase } from './supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { mode } from 'app';

// Voice Order Status definitions (maintained for compatibility)
export type VoiceOrderStatus = 
  | 'NEW'
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

// Voice Order interface (maintained for compatibility)
export interface VoiceOrder {
  voiceOrderId: string;
  orderReference: string;
  customerName?: string;
  customerPhone: string;
  customerEmail?: string;
  orderType: 'delivery' | 'collection';
  deliveryAddress?: string;
  totalAmount: number;
  status: VoiceOrderStatus;
  createdAt: string;
  items: VoiceOrderItem[];
  specialInstructions?: string;
  estimatedReadyTime?: string;
  callId?: string;
}

// Voice Order Item interface (maintained for compatibility)
export interface VoiceOrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  price: number;
  variant?: string;
  modifiers?: string[];
  notes?: string;
}

// Current Voice Order interface based on the API response structure
export interface CurrentVoiceOrder {
  order_id: string;
  call_id?: string;
  order_reference?: string;
  status: 'NEW' | 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
  updated_at?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  order_type: 'DELIVERY' | 'COLLECTION';
  delivery_address?: string;
  special_instructions?: string;
  items: CurrentVoiceOrderItem[];
  total_amount?: number;
  confidence_score?: number;
}

export interface CurrentVoiceOrderItem {
  item_name: string;
  quantity: number;
  price?: number;
  variant_name?: string;
  special_instructions?: string;
  modifiers?: string[];
}

// Store state interface
interface VoiceOrderState {
  orders: CurrentVoiceOrder[];
  isLoading: boolean;
  error: string | null;
  lastFetch: Date | null;
  
  // Real-time subscription
  subscription: RealtimeChannel | null;
  isConnected: boolean;
  
  // Computed state - will be calculated by selectors in components
  
  // Actions
  fetchOrders: (status?: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: CurrentVoiceOrder['status']) => Promise<boolean>;
  refreshOrders: () => Promise<void>;
  getOrder: (orderId: string) => CurrentVoiceOrder | undefined;
  clearError: () => void;
  
  // Real-time subscription methods
  startRealtimeSubscription: () => void;
  stopRealtimeSubscription: () => void;
}

/**
 * Enhanced Voice Orders Store - Placeholder for Corpus Tools Integration
 * This store provides compatibility while the enhanced voice ordering system is being developed
 */
export const useVoiceOrderStore = create<VoiceOrderState>((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,
  lastFetch: null,
  
  // Real-time subscription state
  subscription: null,
  isConnected: false,
  
  // Placeholder actions - Enhanced system coming soon
  fetchOrders: async (status?: string) => {
    set({ isLoading: true, error: null });
    
    // Simulate brief loading for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    set({ 
      orders: [], 
      isLoading: false, 
      lastFetch: new Date(),
      error: null 
    });
  },
  
  refreshOrders: async () => {
    await get().fetchOrders();
  },
  
  updateOrderStatus: async (orderId: string, status: CurrentVoiceOrder['status']) => {
    // Enhanced voice orders will handle this with real-time corpus tools
    console.log(`Enhanced voice orders: Order ${orderId} status update to ${status} will be handled by new system`);
    return true;
  },
  
  getOrder: (orderId: string) => {
    return undefined;
  },
  
  clearError: () => set({ error: null }),
  
  // Real-time subscription methods
  startRealtimeSubscription: () => {
    set({ isConnected: true });
  },
  
  stopRealtimeSubscription: () => {
    set({ subscription: null, isConnected: false });
  }
}));

// Export helper to get new orders count for navigation - now use selectors in components
export const getNewOrdersCount = () => {
  const state = useVoiceOrderStore.getState();
  return state.orders?.filter(order => order.status === 'NEW' || order.status === 'PENDING')?.length || 0;
};
