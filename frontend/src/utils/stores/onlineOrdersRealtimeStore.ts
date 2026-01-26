/**
 * Online Orders Realtime Store
 * Zustand store with Supabase realtime subscriptions for online order management
 * Replaces 30-second polling with instant WebSocket updates
 */

import { create } from 'zustand';
import { supabase } from 'utils/supabaseClient';
import brain from 'brain';
import { OrderStatus } from '@/brain/data-contracts';
import { playOnlineOrderMP3 } from '../soundNotifications';
import { createPrintJobForOrder } from '../onlineOrderPrinting';

// ============================================================================
// TYPES
// ============================================================================

export type OnlineOrderStatus = 'NEW' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type OnlineOrderType = 'DELIVERY' | 'COLLECTION';
export type OrderSource = 'WEBSITE' | 'CHATBOT' | 'APP';
export type UrgencyLevel = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OVERDUE';
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  variant?: string;
  modifiers?: { name: string; price?: number }[];
  specialInstructions?: string;
}

export interface OnlineOrder {
  id: string;
  orderNumber: string;
  orderType: OnlineOrderType;
  status: OnlineOrderStatus;
  source: OrderSource;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  deliveryAddress?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentStatus: string;
  specialInstructions?: string;
  allergenNotes?: string;
  createdAt: Date;
  acceptanceDeadline?: Date;
  estimatedTime?: string;
  // Computed fields
  minutesWaiting: number;
  minutesUntilTimeout?: number;
  urgencyLevel: UrgencyLevel;
}

interface OnlineOrdersRealtimeState {
  // Data
  orders: Record<string, OnlineOrder>;
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
  connectionStatus: ConnectionStatus;
  subscriptionChannel: any | null;

  // Sound settings
  soundEnabled: boolean;
  soundVolume: number;
  lastNotifiedCount: number;

  // Unseen order tracking for badge
  seenOrderIds: Set<string>;

  // Computed selectors
  newOrders: () => OnlineOrder[];
  preparingOrders: () => OnlineOrder[];
  readyOrders: () => OnlineOrder[];
  allOrders: () => OnlineOrder[];
  ordersByStatus: (status: OnlineOrderStatus) => OnlineOrder[];
  urgentOrders: () => OnlineOrder[];
  unseenCount: () => number;

  // Actions
  fetchOrders: () => Promise<void>;
  acceptOrder: (orderId: string) => Promise<boolean>;
  rejectOrder: (orderId: string, reason?: string) => Promise<boolean>;
  markReady: (orderId: string) => Promise<boolean>;
  markComplete: (orderId: string) => Promise<boolean>;
  updateOrderStatus: (orderId: string, status: OnlineOrderStatus) => Promise<boolean>;

  // Realtime
  initializeRealtime: () => void;
  cleanup: () => void;
  handleOrderInsert: (order: any) => void;
  handleOrderUpdate: (order: any) => void;
  handleOrderDelete: (orderId: string) => void;

  // Settings
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;

  // Unseen tracking
  markOrdersSeen: (orderIds: string[]) => void;
  markAllSeen: () => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapApiStatus(apiStatus: string): OnlineOrderStatus {
  const statusMap: Record<string, OnlineOrderStatus> = {
    'PENDING': 'NEW',
    'pending': 'NEW',
    'CONFIRMED': 'CONFIRMED',
    'confirmed': 'CONFIRMED',
    'PROCESSING': 'PREPARING',
    'processing': 'PREPARING',
    'PREPARING': 'PREPARING',
    'preparing': 'PREPARING',
    'READY': 'READY',
    'ready': 'READY',
    'COMPLETED': 'COMPLETED',
    'completed': 'COMPLETED',
    'DELIVERED': 'COMPLETED',
    'delivered': 'COMPLETED',
    'COLLECTED': 'COMPLETED',
    'collected': 'COMPLETED',
    'CANCELLED': 'CANCELLED',
    'cancelled': 'CANCELLED',
  };
  return statusMap[apiStatus] || 'NEW';
}

function transformOrder(rawOrder: any): OnlineOrder {
  const createdAt = new Date(rawOrder.created_at);
  const now = new Date();
  const minutesWaiting = Math.floor((now.getTime() - createdAt.getTime()) / 60000);

  const acceptanceDeadline = rawOrder.acceptance_deadline
    ? new Date(rawOrder.acceptance_deadline)
    : undefined;

  const minutesUntilTimeout = acceptanceDeadline
    ? Math.floor((acceptanceDeadline.getTime() - now.getTime()) / 60000)
    : undefined;

  // Calculate urgency level
  let urgencyLevel: UrgencyLevel = 'NORMAL';
  if (minutesUntilTimeout !== undefined) {
    if (minutesUntilTimeout <= 0) {
      urgencyLevel = 'OVERDUE';
    } else if (minutesUntilTimeout <= 2) {
      urgencyLevel = 'CRITICAL';
    } else if (minutesUntilTimeout <= 5) {
      urgencyLevel = 'WARNING';
    }
  } else if (minutesWaiting > 8) {
    urgencyLevel = 'CRITICAL';
  } else if (minutesWaiting > 5) {
    urgencyLevel = 'WARNING';
  }

  return {
    id: rawOrder.id,
    orderNumber: rawOrder.order_number || rawOrder.id.slice(-8).toUpperCase(),
    orderType: (rawOrder.order_type?.toUpperCase() === 'DELIVERY' ? 'DELIVERY' : 'COLLECTION') as OnlineOrderType,
    status: mapApiStatus(rawOrder.status),
    source: (rawOrder.order_source?.includes('CHATBOT') ? 'CHATBOT' : 'WEBSITE') as OrderSource,
    customerName: rawOrder.customer_name || 'Customer',
    customerPhone: rawOrder.customer_phone,
    customerEmail: rawOrder.customer_email,
    deliveryAddress: typeof rawOrder.delivery_address === 'string'
      ? rawOrder.delivery_address
      : rawOrder.delivery_address?.formatted || '',
    items: rawOrder.items || [],
    subtotal: parseFloat(rawOrder.subtotal) || 0,
    deliveryFee: parseFloat(rawOrder.delivery_fee) || 0,
    total: parseFloat(rawOrder.total_amount) || 0,
    paymentStatus: rawOrder.payment_status || 'PENDING',
    specialInstructions: rawOrder.special_instructions || rawOrder.notes,
    allergenNotes: rawOrder.allergen_notes,
    createdAt,
    acceptanceDeadline,
    estimatedTime: rawOrder.estimated_time,
    minutesWaiting,
    minutesUntilTimeout,
    urgencyLevel,
  };
}

// ============================================================================
// STORE
// ============================================================================

export const useOnlineOrdersRealtimeStore = create<OnlineOrdersRealtimeState>((set, get) => ({
  // Initial state
  orders: {},
  isLoading: false,
  error: null,
  lastSync: null,
  connectionStatus: 'disconnected',
  subscriptionChannel: null,
  soundEnabled: true,
  soundVolume: 75,
  lastNotifiedCount: 0,
  seenOrderIds: new Set<string>(),

  // Computed selectors
  newOrders: () => {
    const orders = Object.values(get().orders);
    return orders.filter(o => o.status === 'NEW').sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  },

  preparingOrders: () => {
    const orders = Object.values(get().orders);
    return orders.filter(o => o.status === 'CONFIRMED' || o.status === 'PREPARING')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  },

  readyOrders: () => {
    const orders = Object.values(get().orders);
    return orders.filter(o => o.status === 'READY').sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  },

  allOrders: () => {
    return Object.values(get().orders).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  ordersByStatus: (status: OnlineOrderStatus) => {
    return Object.values(get().orders).filter(o => o.status === status);
  },

  urgentOrders: () => {
    return Object.values(get().orders).filter(o =>
      o.urgencyLevel === 'CRITICAL' || o.urgencyLevel === 'OVERDUE'
    );
  },

  // Unseen count for badge - orders that are NEW or CONFIRMED and not yet seen
  unseenCount: () => {
    const state = get();
    const newOrders = Object.values(state.orders).filter(
      o => o.status === 'NEW' || o.status === 'CONFIRMED'
    );
    return newOrders.filter(o => !state.seenOrderIds.has(o.id)).length;
  },

  // Fetch orders from API
  fetchOrders: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await brain.get_online_orders({ page: 1, page_size: 100 });
      const data = await response.json();

      if (data.orders) {
        const ordersMap: Record<string, OnlineOrder> = {};
        data.orders.forEach((rawOrder: any) => {
          const order = transformOrder(rawOrder);
          // Only include non-completed orders
          if (order.status !== 'COMPLETED' && order.status !== 'CANCELLED') {
            ordersMap[order.id] = order;
          }
        });

        const previousCount = get().lastNotifiedCount;
        const newCount = Object.values(ordersMap).filter(o => o.status === 'NEW').length;

        set({
          orders: ordersMap,
          isLoading: false,
          lastSync: new Date(),
          lastNotifiedCount: newCount,
        });

        // Play sound if new orders arrived
        if (newCount > previousCount && get().soundEnabled) {
          playOnlineOrderMP3(get().soundVolume);
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch online orders:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Accept order
  acceptOrder: async (orderId: string) => {
    try {
      const response = await brain.update_order_tracking_status({
        order_id: orderId,
        new_status: OrderStatus.CONFIRMED,
      });
      const data = await response.json();

      if (data.success) {
        set(state => ({
          orders: {
            ...state.orders,
            [orderId]: {
              ...state.orders[orderId],
              status: 'CONFIRMED',
            },
          },
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to accept order:', error);
      return false;
    }
  },

  // Reject order
  rejectOrder: async (orderId: string, reason?: string) => {
    try {
      const response = await brain.update_order_tracking_status({
        order_id: orderId,
        new_status: OrderStatus.CANCELLED,
        notes: reason,
      });
      const data = await response.json();

      if (data.success) {
        set(state => {
          const newOrders = { ...state.orders };
          delete newOrders[orderId];
          return { orders: newOrders };
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to reject order:', error);
      return false;
    }
  },

  // Mark as ready
  markReady: async (orderId: string) => {
    try {
      const response = await brain.update_order_tracking_status({
        order_id: orderId,
        new_status: OrderStatus.READY,
      });
      const data = await response.json();

      if (data.success) {
        set(state => ({
          orders: {
            ...state.orders,
            [orderId]: {
              ...state.orders[orderId],
              status: 'READY',
            },
          },
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to mark order ready:', error);
      return false;
    }
  },

  // Mark as complete
  markComplete: async (orderId: string) => {
    try {
      const order = get().orders[orderId];
      const finalStatus = order?.orderType === 'DELIVERY'
        ? OrderStatus.DELIVERED
        : OrderStatus.COLLECTED;

      const response = await brain.update_order_tracking_status({
        order_id: orderId,
        new_status: finalStatus,
      });
      const data = await response.json();

      if (data.success) {
        set(state => {
          const newOrders = { ...state.orders };
          delete newOrders[orderId];
          return { orders: newOrders };
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to complete order:', error);
      return false;
    }
  },

  // Generic status update
  updateOrderStatus: async (orderId: string, status: OnlineOrderStatus) => {
    const statusMap: Record<OnlineOrderStatus, OrderStatus> = {
      'NEW': OrderStatus.CONFIRMED,
      'CONFIRMED': OrderStatus.CONFIRMED,
      'PREPARING': OrderStatus.PREPARING,
      'READY': OrderStatus.READY,
      'COMPLETED': OrderStatus.COLLECTED,
      'CANCELLED': OrderStatus.CANCELLED,
    };

    try {
      const response = await brain.update_order_tracking_status({
        order_id: orderId,
        new_status: statusMap[status],
      });
      const data = await response.json();

      if (data.success) {
        if (status === 'COMPLETED' || status === 'CANCELLED') {
          set(state => {
            const newOrders = { ...state.orders };
            delete newOrders[orderId];
            return { orders: newOrders };
          });
        } else {
          set(state => ({
            orders: {
              ...state.orders,
              [orderId]: {
                ...state.orders[orderId],
                status,
              },
            },
          }));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update order status:', error);
      return false;
    }
  },

  // Initialize realtime subscription
  initializeRealtime: () => {
    const existingChannel = get().subscriptionChannel;
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    set({ connectionStatus: 'connecting' });

    const channel = supabase
      .channel('online-orders-management')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: 'order_source=eq.CUSTOMER_ONLINE_ORDER',
        },
        (payload) => {
          console.log('New online order received:', payload);
          get().handleOrderInsert(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: 'order_source=eq.CUSTOMER_ONLINE_ORDER',
        },
        (payload) => {
          console.log('Online order updated:', payload);
          get().handleOrderUpdate(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'orders',
          filter: 'order_source=eq.CUSTOMER_ONLINE_ORDER',
        },
        (payload) => {
          console.log('Online order deleted:', payload);
          get().handleOrderDelete((payload.old as any).id);
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          set({ connectionStatus: 'connected' });
        } else if (status === 'CHANNEL_ERROR') {
          set({ connectionStatus: 'error' });
        } else if (status === 'CLOSED') {
          set({ connectionStatus: 'disconnected' });
        }
      });

    set({ subscriptionChannel: channel });

    // Initial fetch
    get().fetchOrders();
  },

  // Cleanup subscription
  cleanup: () => {
    const channel = get().subscriptionChannel;
    if (channel) {
      supabase.removeChannel(channel);
      set({ subscriptionChannel: null, connectionStatus: 'disconnected' });
    }
  },

  // Handle new order from realtime
  handleOrderInsert: async (rawOrder: any) => {
    const order = transformOrder(rawOrder);

    // Only add non-completed orders
    if (order.status !== 'COMPLETED' && order.status !== 'CANCELLED') {
      set(state => ({
        orders: {
          ...state.orders,
          [order.id]: order,
        },
      }));

      // Play notification sound for new orders (NEW or auto-approved CONFIRMED)
      if ((order.status === 'NEW' || order.status === 'CONFIRMED') && get().soundEnabled) {
        playOnlineOrderMP3(get().soundVolume);
      }

      // Auto-print for auto-approved orders (CONFIRMED status on insert)
      // This happens when auto-approve is enabled in settings
      if (order.status === 'CONFIRMED') {
        try {
          // Check if auto-print is enabled via restaurant settings
          const settingsResponse = await brain.get_restaurant_settings();
          const settingsData = await settingsResponse.json();
          const onlineOrdersSettings = settingsData?.settings?.onlineOrders;

          // Auto-print if settings allow (default to true if not set)
          const autoPrintEnabled = onlineOrdersSettings?.processing?.autoPrintOnAccept ?? true;

          if (autoPrintEnabled) {
            console.log('Auto-printing kitchen ticket for auto-approved order:', order.orderNumber);
            await createPrintJobForOrder({
              id: order.id,
              orderNumber: order.orderNumber,
              orderType: order.orderType,
              items: order.items,
              customerName: order.customerName,
              customerPhone: order.customerPhone,
              customerEmail: order.customerEmail,
              deliveryAddress: order.deliveryAddress,
              subtotal: order.subtotal,
              deliveryFee: order.deliveryFee,
              total: order.total,
              specialInstructions: order.specialInstructions,
              allergenNotes: order.allergenNotes,
            });
          }
        } catch (error) {
          console.error('Failed to auto-print order:', error);
        }
      }
    }
  },

  // Handle order update from realtime
  handleOrderUpdate: (rawOrder: any) => {
    const order = transformOrder(rawOrder);

    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      // Remove completed/cancelled orders
      set(state => {
        const newOrders = { ...state.orders };
        delete newOrders[order.id];
        return { orders: newOrders };
      });
    } else {
      // Update existing order
      set(state => ({
        orders: {
          ...state.orders,
          [order.id]: order,
        },
      }));
    }
  },

  // Handle order delete from realtime
  handleOrderDelete: (orderId: string) => {
    set(state => {
      const newOrders = { ...state.orders };
      delete newOrders[orderId];
      return { orders: newOrders };
    });
  },

  // Sound settings
  setSoundEnabled: (enabled: boolean) => {
    set({ soundEnabled: enabled });
    localStorage.setItem('onlineOrdersSoundEnabled', String(enabled));
  },

  setSoundVolume: (volume: number) => {
    set({ soundVolume: Math.max(0, Math.min(100, volume)) });
    localStorage.setItem('onlineOrdersSoundVolume', String(volume));
  },

  // Unseen tracking for badge
  markOrdersSeen: (orderIds: string[]) => {
    set(state => ({
      seenOrderIds: new Set([...state.seenOrderIds, ...orderIds]),
    }));
  },

  markAllSeen: () => {
    set(state => ({
      seenOrderIds: new Set(Object.keys(state.orders)),
    }));
  },
}));

// Initialize settings from localStorage
if (typeof window !== 'undefined') {
  const savedSoundSetting = localStorage.getItem('onlineOrdersSoundEnabled');
  if (savedSoundSetting !== null) {
    useOnlineOrdersRealtimeStore.setState({ soundEnabled: savedSoundSetting === 'true' });
  }

  const savedVolume = localStorage.getItem('onlineOrdersSoundVolume');
  if (savedVolume !== null) {
    useOnlineOrdersRealtimeStore.setState({ soundVolume: parseInt(savedVolume, 10) || 75 });
  }
}
