
/**
 * Voice Order Store - AI Voice Integration for Ultravox POS System
 * 
 * ADAPTED FOR ELECTRON: This store manages AI voice orders from Ultravox integration
 * with real-time synchronization and order status management.
 * 
 * CHANGES FROM DATABUTTON VERSION:
 * - Replaced brain.* calls with apiClient.* calls
 * - Updated import paths for Electron renderer structure
 * - Replaced Supabase client with direct API client integration
 * - Maintained compatibility with Ultravox voice ordering system
 * - Enhanced real-time subscription handling
 */

import { create } from 'zustand';
import { apiClient } from './apiClient'; // ELECTRON: Replace brain import
import { toast } from 'sonner';

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

// Enhanced subscription interface for Electron
interface VoiceOrderSubscription {
  isActive: boolean;
  lastHeartbeat: Date | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

// Store state interface with enhanced real-time capabilities
interface VoiceOrderState {
  orders: CurrentVoiceOrder[];
  isLoading: boolean;
  error: string | null;
  lastFetch: Date | null;

  // Enhanced real-time subscription for Electron
  subscription: VoiceOrderSubscription;
  isConnected: boolean;

  // Performance tracking
  lastOrderCount: number;
  syncInProgress: boolean;

  // Actions
  fetchOrders: (status?: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: CurrentVoiceOrder['status']) => Promise<boolean>;
  refreshOrders: () => Promise<void>;
  getOrder: (orderId: string) => CurrentVoiceOrder | undefined;
  clearError: () => void;

  // Enhanced real-time subscription methods for Electron
  startRealtimeSubscription: () => void;
  stopRealtimeSubscription: () => void;
  checkConnectionHealth: () => Promise<boolean>;
  forceReconnect: () => Promise<void>;

  // NEW: Order management actions
  approveOrder: (orderId: string) => Promise<boolean>;
  rejectOrder: (orderId: string, reason?: string) => Promise<boolean>;
  markOrderReady: (orderId: string) => Promise<boolean>;
  completeOrder: (orderId: string) => Promise<boolean>;

  // Utility methods
  getOrdersByStatus: (status: VoiceOrderStatus) => CurrentVoiceOrder[];
  getNewOrdersCount: () => number;
  getPendingOrdersCount: () => number;
  getTotalOrderValue: () => number;
}

/**
 * Enhanced Voice Orders Store - Ultravox Integration for Electron POS
 * 
 * This store provides comprehensive voice order management with:
 * - Real-time synchronization with Supabase backend
 * - Ultravox call handling and voice order processing
 * - Order status management and workflow automation
 * - Performance optimization for desktop POS environment
 */
export const useVoiceOrderStore = create<VoiceOrderState>((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,
  lastFetch: null,

  // Enhanced subscription state for Electron
  subscription: {
    isActive: false,
    lastHeartbeat: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5
  },
  isConnected: false,

  // Performance tracking
  lastOrderCount: 0,
  syncInProgress: false,

  // Fetch orders with enhanced error handling
  fetchOrders: async (status?: string) => {
    if (get().syncInProgress) {
      console.log('Voice orders sync already in progress, skipping...');
      return;
    }

    set({ isLoading: true, error: null, syncInProgress: true });

    try {
      // ELECTRON: Replace brain.get_voice_orders with apiClient call
      const params = status ? { status } : {};
      const response = await apiClient.getVoiceOrders(params);

      if (response.success && Array.isArray(response.orders)) {
        const orders = response.orders as CurrentVoiceOrder[];

        set({ 
          orders,
          isLoading: false,
          lastFetch: new Date(),
          error: null,
          lastOrderCount: orders.length,
          syncInProgress: false
        });

        console.log(`✅ Fetched ${orders.length} voice orders`);
      } else {
        throw new Error('Invalid response format from voice orders API');
      }
    } catch (error) {
      console.error('❌ Error fetching voice orders:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch voice orders',
        isLoading: false,
        syncInProgress: false
      });

      toast.error('Failed to fetch voice orders');
    }
  },

  refreshOrders: async () => {
    await get().fetchOrders();
  },

  updateOrderStatus: async (orderId: string, status: CurrentVoiceOrder['status']) => {
    try {
      // ELECTRON: Replace brain.update_voice_order_status with apiClient call
      const response = await apiClient.updateVoiceOrderStatus(
        { order_id: orderId },
        { status }
      );

      if (response.success) {
        // Update local state optimistically
        set(state => ({
          orders: state.orders.map(order => 
            order.order_id === orderId 
              ? { ...order, status, updated_at: new Date().toISOString() }
              : order
          )
        }));

        toast.success(`Order status updated to ${status}`);
        return true;
      } else {
        throw new Error(response.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error(`❌ Error updating order ${orderId} status:`, error);
      toast.error('Failed to update order status');
      return false;
    }
  },

  getOrder: (orderId: string) => {
    return get().orders.find(order => order.order_id === orderId);
  },

  clearError: () => set({ error: null }),

  // Enhanced real-time subscription for Electron
  startRealtimeSubscription: () => {
    const state = get();

    if (state.subscription.isActive) {
      console.log('Voice orders subscription already active');
      return;
    }

    set(state => ({
      subscription: {
        ...state.subscription,
        isActive: true,
        lastHeartbeat: new Date(),
        reconnectAttempts: 0
      },
      isConnected: true
    }));

    console.log('✅ Voice orders real-time subscription started');

    // Start periodic refresh for Electron (instead of WebSocket)
    const refreshInterval = setInterval(async () => {
      if (!get().subscription.isActive) {
        clearInterval(refreshInterval);
        return;
      }

      try {
        await get().refreshOrders();
        set(state => ({
          subscription: {
            ...state.subscription,
            lastHeartbeat: new Date()
          }
        }));
      } catch (error) {
        console.warn('Voice orders refresh failed during subscription:', error);

        const currentState = get();
        if (currentState.subscription.reconnectAttempts < currentState.subscription.maxReconnectAttempts) {
          set(state => ({
            subscription: {
              ...state.subscription,
              reconnectAttempts: state.subscription.reconnectAttempts + 1
            }
          }));
        } else {
          // Stop subscription after max attempts
          get().stopRealtimeSubscription();
          toast.error('Lost connection to voice orders. Please refresh manually.');
        }
      }
    }, 10000); // 10 second intervals for Electron
  },

  stopRealtimeSubscription: () => {
    set(state => ({
      subscription: {
        ...state.subscription,
        isActive: false,
        lastHeartbeat: null
      },
      isConnected: false
    }));

    console.log('🛑 Voice orders real-time subscription stopped');
  },

  checkConnectionHealth: async () => {
    try {
      // ELECTRON: Replace brain.check_voice_orders_health with apiClient call
      const response = await apiClient.checkVoiceOrdersHealth();
      return response.success === true;
    } catch (error) {
      console.error('Voice orders health check failed:', error);
      return false;
    }
  },

  forceReconnect: async () => {
    get().stopRealtimeSubscription();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    get().startRealtimeSubscription();
    await get().refreshOrders();
  },

  // Enhanced order management actions
  approveOrder: async (orderId: string) => {
    return await get().updateOrderStatus(orderId, 'APPROVED');
  },

  rejectOrder: async (orderId: string, reason?: string) => {
    try {
      // ELECTRON: Replace brain.reject_voice_order with apiClient call
      const response = await apiClient.rejectVoiceOrder(
        { order_id: orderId },
        { reason: reason || 'Order rejected by staff' }
      );

      if (response.success) {
        await get().updateOrderStatus(orderId, 'REJECTED');
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Error rejecting order ${orderId}:`, error);
      return false;
    }
  },

  markOrderReady: async (orderId: string) => {
    return await get().updateOrderStatus(orderId, 'READY');
  },

  completeOrder: async (orderId: string) => {
    return await get().updateOrderStatus(orderId, 'COMPLETED');
  },

  // Utility methods
  getOrdersByStatus: (status: VoiceOrderStatus) => {
    return get().orders.filter(order => order.status === status);
  },

  getNewOrdersCount: () => {
    const orders = get().orders;
    return orders.filter(order => order.status === 'NEW' || order.status === 'PENDING').length;
  },

  getPendingOrdersCount: () => {
    const orders = get().orders;
    return orders.filter(order => order.status === 'PENDING' || order.status === 'PROCESSING').length;
  },

  getTotalOrderValue: () => {
    const orders = get().orders;
    return orders.reduce((total, order) => total + (order.total_amount || 0), 0);
  }
}));

// Export helper functions for external usage
export const voiceOrderHelpers = {
  getNewOrdersCount: () => {
    const state = useVoiceOrderStore.getState();
    return state.getNewOrdersCount();
  },

  formatOrderTotal: (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  },

  formatOrderTime: (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    }).format(date);
  },

  getOrderPriority: (order: CurrentVoiceOrder): 'high' | 'medium' | 'low' => {
    const orderTime = new Date(order.created_at);
    const now = new Date();
    const minutesAgo = (now.getTime() - orderTime.getTime()) / (1000 * 60);

    if (minutesAgo > 30) return 'high';
    if (minutesAgo > 15) return 'medium';
    return 'low';
  }
};

// Export store actions for external usage
export const voiceOrderActions = {
  fetchOrders: () => useVoiceOrderStore.getState().fetchOrders(),
  refreshOrders: () => useVoiceOrderStore.getState().refreshOrders(),
  approveOrder: (orderId: string) => useVoiceOrderStore.getState().approveOrder(orderId),
  rejectOrder: (orderId: string, reason?: string) => useVoiceOrderStore.getState().rejectOrder(orderId, reason),
  markOrderReady: (orderId: string) => useVoiceOrderStore.getState().markOrderReady(orderId),
  completeOrder: (orderId: string) => useVoiceOrderStore.getState().completeOrder(orderId),
  startSubscription: () => useVoiceOrderStore.getState().startRealtimeSubscription(),
  stopSubscription: () => useVoiceOrderStore.getState().stopRealtimeSubscription()
};
