import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from './supabaseClient';
import type { DineInOrder, OrderStatus } from '../types/dine-in';

/**
 * Hook to fetch and subscribe to active dine-in orders
 *
 * This is part of the single-source-of-truth architecture where:
 * - Orders are the runtime state (source of truth)
 * - Tables are just configuration
 * - Table state is derived from orders
 *
 * Active orders are those not in terminal states (PAID, COMPLETED, CANCELLED)
 */

// Active statuses - orders that are "in progress"
const ACTIVE_STATUSES: OrderStatus[] = [
  'CREATED',
  'SENT_TO_KITCHEN',
  'IN_PREP',
  'READY',
  'SERVED',
  'PENDING_PAYMENT'
];

// Map database status to our OrderStatus type
const mapOrderStatus = (dbStatus: string): OrderStatus => {
  const statusMap: Record<string, OrderStatus> = {
    'pending': 'CREATED',
    'PENDING': 'CREATED',
    'created': 'CREATED',
    'CREATED': 'CREATED',
    'sent_to_kitchen': 'SENT_TO_KITCHEN',
    'SENT_TO_KITCHEN': 'SENT_TO_KITCHEN',
    'in_prep': 'IN_PREP',
    'IN_PREP': 'IN_PREP',
    'preparing': 'IN_PREP',
    'PREPARING': 'IN_PREP',
    'ready': 'READY',
    'READY': 'READY',
    'served': 'SERVED',
    'SERVED': 'SERVED',
    'pending_payment': 'PENDING_PAYMENT',
    'PENDING_PAYMENT': 'PENDING_PAYMENT',
    'paid': 'PAID',
    'PAID': 'PAID',
    'completed': 'COMPLETED',
    'COMPLETED': 'COMPLETED',
    'cancelled': 'CANCELLED',
    'CANCELLED': 'CANCELLED'
  };

  return statusMap[dbStatus] || 'CREATED';
};

// Transform database row to DineInOrder
const transformOrder = (row: any): DineInOrder => {
  return {
    id: row.id,
    tableId: row.table_id || '',
    tableNumber: row.table_number ? parseInt(row.table_number, 10) : undefined,
    tableGroupId: row.table_group_id || undefined,
    guestCount: row.guest_count || 0,
    linkedTables: Array.isArray(row.linked_tables) ? row.linked_tables : [],
    status: mapOrderStatus(row.status),
    serverName: row.server_name || undefined,
    serverId: row.server_id || undefined,
    subtotal: parseFloat(row.subtotal) || 0,
    tax: parseFloat(row.tax_amount) || 0,
    total: parseFloat(row.total_amount) || 0,
    totalAmount: parseFloat(row.total_amount) || 0,
    paymentMethod: row.payment_method || undefined,
    paidAt: row.completed_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

export interface UseActiveOrdersReturn {
  orders: DineInOrder[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getOrderForTable: (tableId: string) => DineInOrder | undefined;
  getOrderForTableNumber: (tableNumber: number) => DineInOrder | undefined;
}

/**
 * Hook to manage active dine-in orders with real-time subscriptions
 *
 * Usage:
 * ```
 * const { orders, loading, getOrderForTable } = useActiveOrders();
 * const order = getOrderForTable(table.id);
 * ```
 */
export function useActiveOrders(): UseActiveOrdersReturn {
  const [orders, setOrders] = useState<DineInOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch active dine-in orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .in('order_type', ['DINE_IN', 'DINE-IN']) // Handle both formats
        .not('table_id', 'is', null) // Must have a table
        .in('status', ['pending', 'PENDING', 'created', 'CREATED', 'sent_to_kitchen', 'SENT_TO_KITCHEN',
                       'in_prep', 'IN_PREP', 'preparing', 'PREPARING', 'ready', 'READY',
                       'served', 'SERVED', 'pending_payment', 'PENDING_PAYMENT'])
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        const transformedOrders = data.map(transformOrder);
        setOrders(transformedOrders);
        console.log(`[useActiveOrders] Loaded ${transformedOrders.length} active dine-in orders`);
      }
    } catch (err: any) {
      console.error('[useActiveOrders] Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time subscription
  // Note: We subscribe to ALL orders and filter client-side because Supabase
  // real-time filters don't support 'in' operator for order_type
  useEffect(() => {
    const subscription = supabase
      .channel('active-orders-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          const orderData = (payload.new || payload.old) as any;

          // Filter for dine-in orders only (handle both formats)
          const orderType = orderData?.order_type;
          if (orderType !== 'DINE_IN' && orderType !== 'DINE-IN') {
            return; // Not a dine-in order, ignore
          }

          console.log('[useActiveOrders] Real-time update:', payload.eventType);

          setOrders((current) => {
            if (payload.eventType === 'INSERT') {
              const newOrder = payload.new as any;
              // Only add if it has a table and is active
              if (!newOrder.table_id) return current;

              const status = mapOrderStatus(newOrder.status);
              if (!ACTIVE_STATUSES.includes(status)) return current;

              const transformed = transformOrder(newOrder);
              // Check if already exists (avoid duplicates)
              if (current.some(o => o.id === transformed.id)) return current;

              return [transformed, ...current];
            }

            if (payload.eventType === 'UPDATE') {
              const updatedOrder = payload.new as any;
              const transformed = transformOrder(updatedOrder);
              const status = mapOrderStatus(updatedOrder.status);

              // If order became inactive, remove it
              if (!ACTIVE_STATUSES.includes(status)) {
                return current.filter(o => o.id !== transformed.id);
              }

              // Update existing order
              const exists = current.some(o => o.id === transformed.id);
              if (exists) {
                return current.map(o => o.id === transformed.id ? transformed : o);
              }

              // Add if new and has table
              if (updatedOrder.table_id) {
                return [transformed, ...current];
              }

              return current;
            }

            if (payload.eventType === 'DELETE') {
              const deletedId = (payload.old as any)?.id;
              return current.filter(o => o.id !== deletedId);
            }

            return current;
          });
        }
      )
      .subscribe();

    console.log('[useActiveOrders] Subscribed to orders real-time updates');

    return () => {
      console.log('[useActiveOrders] Unsubscribing');
      subscription.unsubscribe();
    };
  }, []);

  // Helper: Get order for a specific table by table_id (UUID)
  const getOrderForTable = useCallback((tableId: string): DineInOrder | undefined => {
    return orders.find(order => order.tableId === tableId);
  }, [orders]);

  // Helper: Get order for a specific table by table_number
  const getOrderForTableNumber = useCallback((tableNumber: number): DineInOrder | undefined => {
    return orders.find(order => {
      // Check direct table number match
      if (order.tableNumber === tableNumber) return true;
      // Check if table is in linked tables
      if (order.linkedTables.includes(tableNumber)) return true;
      return false;
    });
  }, [orders]);

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    getOrderForTable,
    getOrderForTableNumber
  };
}

/**
 * Hook to get a single order by ID with real-time updates
 */
export function useOrder(orderId: string | null) {
  const [order, setOrder] = useState<DineInOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setOrder(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;
      if (data) {
        setOrder(transformOrder(data));
      }
    } catch (err: any) {
      console.error('[useOrder] Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Real-time subscription for this specific order
  useEffect(() => {
    if (!orderId) return;

    const subscription = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log('[useOrder] Real-time update:', payload.eventType);

          if (payload.eventType === 'UPDATE') {
            setOrder(transformOrder(payload.new));
          }
          if (payload.eventType === 'DELETE') {
            setOrder(null);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [orderId]);

  return { order, loading, error, refetch: fetchOrder };
}

// ================================
// STALE ORDER DETECTION HELPERS
// ================================

/**
 * Default stale order threshold in hours
 */
export const DEFAULT_STALE_HOURS = 8;

/**
 * Check if an order is stale (likely abandoned)
 *
 * @param order - The dine-in order to check
 * @param staleHours - Hours after which an order is considered stale (default: 8)
 * @returns True if the order is older than the threshold
 */
export function isStaleOrder(order: DineInOrder, staleHours: number = DEFAULT_STALE_HOURS): boolean {
  if (!order.createdAt) return false;

  const createdAt = new Date(order.createdAt);
  const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

  return hoursOld > staleHours;
}

/**
 * Filter orders to get only stale/zombie orders
 *
 * @param orders - Array of dine-in orders
 * @param staleHours - Hours after which an order is considered stale (default: 8)
 * @returns Array of stale orders
 */
export function getStaleOrders(orders: DineInOrder[], staleHours: number = DEFAULT_STALE_HOURS): DineInOrder[] {
  return orders.filter(order => isStaleOrder(order, staleHours));
}

/**
 * Get the age of an order in hours
 *
 * @param order - The dine-in order
 * @returns Age in hours (decimal), or 0 if no createdAt
 */
export function getOrderAgeHours(order: DineInOrder): number {
  if (!order.createdAt) return 0;

  const createdAt = new Date(order.createdAt);
  return (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
}
