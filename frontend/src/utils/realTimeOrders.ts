import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import React from 'react';
import { toast } from 'sonner';
import { supabase } from './supabaseClient';
import brain from 'brain';

// Types for real-time orders
export interface OrderItem {
  item_id: string;
  menu_item_id?: string;
  name: string;
  price: number;
  quantity: number;
  variant_name?: string;
  modifiers?: any[];
  notes?: string;
  total_price: number;
}

export interface OrderCustomer {
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  delivery_address?: string;
  delivery_instructions?: string;
}

export interface OrderPayment {
  payment_method: string;
  payment_amount?: number;
  payment_status: string;
  payment_transaction_id?: string;
  tip?: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type OrderType = 'dine_in' | 'takeaway' | 'delivery' | 'collection';
export type OrderSource = 'online' | 'voice' | 'pos' | 'phone';

export interface UnifiedOrder {
  order_id: string;
  order_number?: string;
  order_type: OrderType;
  order_source: OrderSource;
  status: OrderStatus;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  delivery_address?: string;
  delivery_instructions?: string;
  subtotal: number;
  tax?: number;
  service_charge?: number;
  delivery_fee?: number;
  discount?: number;
  tip?: number;
  total: number;
  payment_method?: string;
  payment_amount?: number;
  payment_status?: string;
  payment_transaction_id?: string;
  table_number?: number;
  special_instructions?: string;
  estimated_ready_time?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderEvent {
  event_id: string;
  order_id: string;
  event_type: string;
  event_data: Record<string, any>;
  created_at: string;
  created_by?: string;
}

export interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastConnected?: Date;
  reconnectAttempts: number;
  error?: string;
}

interface RealTimeOrderStore {
  // State
  orders: Record<string, UnifiedOrder>;
  orderEvents: Record<string, OrderEvent[]>;
  activeSubscriptions: Set<string>;
  connectionState: ConnectionState;
  isLoading: boolean;
  error: string | null;

  // User-specific tracking
  userOrders: string[]; // Array of order IDs for current user

  // Actions
  initializeRealTime: () => Promise<void>;
  subscribeToOrder: (orderId: string) => Promise<void>;
  subscribeToUserOrders: (userId?: string, phone?: string) => Promise<void>;
  unsubscribeFromOrder: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  addOrderEvent: (event: OrderEvent) => void;
  setConnectionState: (state: Partial<ConnectionState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearStore: () => void;

  // Getters
  getOrder: (orderId: string) => UnifiedOrder | null;
  getOrderEvents: (orderId: string) => OrderEvent[];
  getActiveOrders: () => UnifiedOrder[];
  getUserActiveOrders: () => UnifiedOrder[];
}

// Initialize Supabase client for real-time subscriptions - use centralized client
const getSupabaseClient = () => {
  return supabase;
};

const useRealTimeOrders = create<RealTimeOrderStore>()(subscribeWithSelector((set, get) => ({
  // Initial state
  orders: {},
  orderEvents: {},
  activeSubscriptions: new Set(),
  connectionState: {
    status: 'disconnected',
    reconnectAttempts: 0,
  },
  isLoading: false,
  error: null,
  userOrders: [],

  // Initialize real-time connection
  initializeRealTime: async () => {
    try {
      set({
        connectionState: { status: 'connecting', reconnectAttempts: 0 },
        isLoading: true
      });

      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        throw new Error('Supabase client not available');
      }

      // Test connection
      const { error } = await supabaseClient.from('unified_orders').select('order_id').limit(1);

      if (error) {
        throw error;
      }

      set({
        connectionState: {
          status: 'connected',
          lastConnected: new Date(),
          reconnectAttempts: 0
        },
        isLoading: false
      });

      toast.success('Real-time order tracking connected');

    } catch (error) {
      console.error('Failed to initialize real-time tracking:', error);
      set({
        error: error instanceof Error ? error.message : 'Connection failed',
        connectionState: { status: 'error', reconnectAttempts: get().connectionState.reconnectAttempts + 1 },
        isLoading: false
      });
      toast.error('Failed to connect to real-time order tracking');
    }
  },

  // Subscribe to a specific order's updates
  subscribeToOrder: async (orderId: string) => {
    try {
      const { activeSubscriptions } = get();

      if (activeSubscriptions.has(orderId)) {
        return;
      }

      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        return;
      }

      // Subscribe to order updates
      const orderSubscription = supabaseClient
        .channel(`order-${orderId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'unified_orders',
            filter: `order_id=eq.${orderId}`,
          },
          (payload: any) => {
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
              const updatedOrder = payload.new as UnifiedOrder;

              set((state) => ({
                orders: {
                  ...state.orders,
                  [orderId]: updatedOrder,
                },
              }));

              // Show toast notification for status changes
              if (payload.eventType === 'UPDATE') {
                const statusChanged = payload.old?.status !== payload.new?.status;
                if (statusChanged) {
                  toast.success(`Order ${orderId.slice(-6)} status: ${payload.new.status}`);
                }
              }
            } else if (payload.eventType === 'DELETE') {
              set((state) => {
                const newOrders = { ...state.orders };
                delete newOrders[orderId];
                return { orders: newOrders };
              });
            }
          }
        )
        .subscribe();

      // Subscribe to order events
      const eventsSubscription = supabaseClient
        .channel(`order-events-${orderId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'order_events',
            filter: `order_id=eq.${orderId}`,
          },
          (payload: any) => {
            const newEvent = payload.new as OrderEvent;

            set((state) => ({
              orderEvents: {
                ...state.orderEvents,
                [orderId]: [
                  ...(state.orderEvents[orderId] || []),
                  newEvent,
                ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
              },
            }));
          }
        )
        .subscribe();

      // Add to active subscriptions
      set((state) => ({
        activeSubscriptions: new Set([...state.activeSubscriptions, orderId]),
      }));

    } catch (error) {
      console.error(`Failed to subscribe to order ${orderId}:`, error);
      set({ error: error instanceof Error ? error.message : 'Subscription failed' });
    }
  },

  // Subscribe to all orders for a user (by user ID or phone)
  subscribeToUserOrders: async (userId?: string, phone?: string) => {
    try {
      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        return;
      }

      // Build filter for user orders
      let filter = '';
      if (userId) {
        filter = `customer_id=eq.${userId}`;
      } else if (phone) {
        filter = `customer_phone=eq.${phone}`;
      } else {
        return;
      }

      // Subscribe to user's orders
      const userOrdersSubscription = supabaseClient
        .channel(`user-orders-${userId || phone}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'unified_orders',
            filter: filter,
          },
          (payload: any) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const order = payload.new as UnifiedOrder;

              set((state) => {
                const newUserOrders = state.userOrders.includes(order.order_id)
                  ? state.userOrders
                  : [...state.userOrders, order.order_id];

                return {
                  orders: {
                    ...state.orders,
                    [order.order_id]: order,
                  },
                  userOrders: newUserOrders,
                };
              });

              // Automatically subscribe to this order's detailed updates
              get().subscribeToOrder(order.order_id);

            } else if (payload.eventType === 'DELETE') {
              const orderId = payload.old.order_id;

              set((state) => {
                const newOrders = { ...state.orders };
                delete newOrders[orderId];

                return {
                  orders: newOrders,
                  userOrders: state.userOrders.filter(id => id !== orderId),
                };
              });

              get().unsubscribeFromOrder(orderId);
            }
          }
        )
        .subscribe();

    } catch (error) {
      console.error('Failed to subscribe to user orders:', error);
      set({ error: error instanceof Error ? error.message : 'User subscription failed' });
    }
  },

  // Unsubscribe from order updates
  unsubscribeFromOrder: (orderId: string) => {
    const supabaseClient = getSupabaseClient();

    if (supabaseClient) {
      supabaseClient.removeChannel(supabaseClient.channel(`order-${orderId}`));
      supabaseClient.removeChannel(supabaseClient.channel(`order-events-${orderId}`));
    }

    set((state) => {
      const newSubscriptions = new Set(state.activeSubscriptions);
      newSubscriptions.delete(orderId);
      return { activeSubscriptions: newSubscriptions };
    });
  },

  // Update order status (triggers real-time update)
  updateOrderStatus: async (orderId: string, status: OrderStatus) => {
    try {
      const response = await (brain as any).update_order_status({
        order_id: orderId,
        status,
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update order status');
      }

      console.log('Order status updated:', result);

    } catch (error) {
      console.error('Failed to update order status:', error);
      set({ error: error instanceof Error ? error.message : 'Status update failed' });
      toast.error('Failed to update order status');
    }
  },

  // Add order event
  addOrderEvent: (event: OrderEvent) => {
    set((state) => ({
      orderEvents: {
        ...state.orderEvents,
        [event.order_id]: [
          ...(state.orderEvents[event.order_id] || []),
          event,
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      },
    }));
  },

  // Set connection state
  setConnectionState: (state: Partial<ConnectionState>) => {
    set((currentState) => ({
      connectionState: {
        ...currentState.connectionState,
        ...state,
      },
    }));
  },

  // Set loading state
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },

  // Clear store
  clearStore: () => {
    set({
      orders: {},
      orderEvents: {},
      activeSubscriptions: new Set(),
      userOrders: [],
      error: null,
    });
  },

  // Get specific order
  getOrder: (orderId: string) => {
    return get().orders[orderId] || null;
  },

  // Get events for specific order
  getOrderEvents: (orderId: string) => {
    return get().orderEvents[orderId] || [];
  },

  // Get all active orders (not completed/cancelled)
  getActiveOrders: () => {
    const { orders } = get();
    return Object.values(orders).filter(
      order => !['completed', 'cancelled', 'refunded', 'delivered'].includes(order.status)
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  // Get active orders for current user
  getUserActiveOrders: () => {
    const { orders, userOrders } = get();
    return userOrders
      .map(orderId => orders[orderId])
      .filter(order => order && !['completed', 'cancelled', 'refunded', 'delivered'].includes(order.status))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
})));

// Auto-initialize when store is used
let autoInitialized = false;
useRealTimeOrders.subscribe(
  (state) => state.connectionState.status,
  (status) => {
    if (status === 'disconnected' && !autoInitialized) {
      autoInitialized = true;
      setTimeout(() => {
        useRealTimeOrders.getState().initializeRealTime();
      }, 100);
    }
  }
);

export default useRealTimeOrders;

// Hook for easy order tracking by ID
export const useOrderTrackingById = (orderId: string) => {
  const {
    getOrder,
    getOrderEvents,
    subscribeToOrder,
    unsubscribeFromOrder,
    updateOrderStatus,
  } = useRealTimeOrders();

  const order = getOrder(orderId);
  const events = getOrderEvents(orderId);

  // Auto-subscribe when component mounts
  React.useEffect(() => {
    if (orderId) {
      subscribeToOrder(orderId);
      return () => unsubscribeFromOrder(orderId);
    }
  }, [orderId, subscribeToOrder, unsubscribeFromOrder]);

  return {
    order,
    events,
    updateStatus: (status: OrderStatus) => updateOrderStatus(orderId, status),
    isLoading: !order,
  };
};

// Hook for user order tracking
export const useUserOrderTracking = (userId?: string, phone?: string) => {
  const {
    getUserActiveOrders,
    subscribeToUserOrders,
    connectionState,
    isLoading,
    error,
  } = useRealTimeOrders();

  const userOrders = getUserActiveOrders();

  // Auto-subscribe to user orders
  React.useEffect(() => {
    if (userId || phone) {
      subscribeToUserOrders(userId, phone);
    }
  }, [userId, phone, subscribeToUserOrders]);

  return {
    orders: userOrders,
    connectionState,
    isLoading,
    error,
    isConnected: connectionState.status === 'connected',
  };
};
