

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
        console.log('Order tracking update received:', payload);
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
        console.log('Order status update:', payload);
        if (payload.new) {
          // Convert order status update to tracking format
          const update: OrderTrackingSubscription = {
            order_id: orderId,
            status: payload.new.status?.toUpperCase() || 'CONFIRMED',
            timestamp: payload.new.last_status_update || new Date().toISOString(),
            notes: 'Order status updated'
          };
          onStatusUpdate(update);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscribed to order tracking for order: ${orderId}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Subscription error for order:', orderId);
        if (onError) {
          onError(new Error('Failed to subscribe to order updates'));
        }
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
        console.log('Global order tracking update:', payload);
        if (payload.new) {
          onStatusUpdate(payload.new as OrderTrackingSubscription);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to all order tracking updates');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Global subscription error');
        if (onError) {
          onError(new Error('Failed to subscribe to order updates'));
        }
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
  console.log(`Mock subscription created for order: ${orderId}`);
  
  // Return a mock subscription object
  return {
    unsubscribe: () => {
      console.log(`Mock subscription unsubscribed for order: ${orderId}`);
    },
    channel: `mock-order-tracking-${orderId}`
  };
}
