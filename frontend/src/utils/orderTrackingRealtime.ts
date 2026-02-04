

import { supabase } from './supabaseClient';

/**
 * Order tracking types for real-time subscriptions
 */
export interface OrderTrackingSubscription {
  order_id: string;
  status: string;
  timestamp: string;
  staff_id?: string;
  notes?: string;
  estimated_time?: number;
  estimated_completion?: string;
  progress_percentage?: number;
}

export interface OrderStatusUpdate {
  order_id: string;
  current_status: string;
  estimated_completion?: string;
  last_status_update: string;
}

/**
 * Subscribe to order tracking updates for a specific order
 */
export function subscribeToOrderTracking(
  orderId: string,
  onStatusUpdate: (update: OrderTrackingSubscription) => void,
  onError?: (error: any) => void
) {
  const subscription = supabase
    .channel(`order-tracking-${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'order_tracking_history',
        filter: `order_id=eq.${orderId}`
      },
      (payload) => {
        if (payload.new) {
          onStatusUpdate(payload.new as OrderTrackingSubscription);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      },
      (payload) => {
        if (payload.new) {
          // Convert order status update to tracking format
          const update: OrderTrackingSubscription = {
            order_id: orderId,
            status: (payload.new as any).status || 'UNKNOWN',
            timestamp: new Date().toISOString(),
            notes: (payload.new as any).notes
          };
          onStatusUpdate(update);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscribed to order tracking for order ${orderId}`);
      } else if (status === 'CHANNEL_ERROR' && onError) {
        onError(new Error('Channel error'));
      }
    });

  return subscription;
}

/**
 * Subscribe to all order tracking updates (for admin/staff dashboard)
 */
export function subscribeToAllOrderTracking(
  onStatusUpdate: (update: OrderTrackingSubscription) => void,
  onError?: (error: any) => void
) {
  const subscription = supabase
    .channel('all-order-tracking')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'order_tracking_history'
      },
      (payload) => {
        if (payload.new) {
          onStatusUpdate(payload.new as OrderTrackingSubscription);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to all order tracking updates');
      } else if (status === 'CHANNEL_ERROR' && onError) {
        onError(new Error('Channel error'));
      }
    });

  return subscription;
}

/**
 * Subscribe to order updates for a specific customer
 * This enables real-time status updates in the CustomerPortal
 */
export function subscribeToCustomerOrders(
  customerId: string,
  onOrderUpdate: (order: any) => void,
  onError?: (error: any) => void
) {
  const subscription = supabase
    .channel(`customer-orders-${customerId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `customer_id=eq.${customerId}`
      },
      (payload) => {
        if (payload.new) {
          console.log('📦 Real-time order update for customer:', payload.new);
          onOrderUpdate(payload.new);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `customer_id=eq.${customerId}`
      },
      (payload) => {
        if (payload.new) {
          console.log('📦 New order for customer:', payload.new);
          onOrderUpdate(payload.new);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Subscribed to order updates for customer ${customerId}`);
      } else if (status === 'CHANNEL_ERROR' && onError) {
        onError(new Error('Channel error'));
      }
    });

  return subscription;
}

/**
 * Convert status_id to status string for voice orders
 */
function getStatusFromId(statusId: number): string {
  const statusMap: { [key: number]: string } = {
    1: 'CONFIRMED',
    2: 'PREPARING', 
    3: 'READY',
    4: 'OUT_FOR_DELIVERY',
    5: 'DELIVERED',
    6: 'COLLECTED',
    7: 'CANCELLED'
  };
  
  return statusMap[statusId] || 'CONFIRMED';
}

/**
 * Unsubscribe from order tracking
 */
export function unsubscribeFromOrderTracking(subscription: any) {
  if (subscription) {
    return supabase.removeChannel(subscription);
  }
}

/**
 * Check if real-time is connected
 */
export function isRealtimeConnected(): boolean {
  return supabase.realtime.isConnected();
}

/**
 * Get real-time connection status
 */
export function getRealtimeStatus() {
  return {
    isConnected: supabase.realtime.isConnected(),
    channels: supabase.realtime.channels.length
  };
}

/**
 * Simple mock implementation for demonstration
 * In production, this would use actual Supabase credentials
 */
export function createMockRealtimeSubscription(
  orderId: string,
  onStatusUpdate: (update: OrderTrackingSubscription) => void
) {
  
  // Return a mock subscription object
  return {
    unsubscribe: () => {
    },
    channel: `mock-order-tracking-${orderId}`
  };
}
