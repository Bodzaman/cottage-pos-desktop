import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { apiClient, APP_BASE_PATH } from 'app';
import { API_PREFIX_PATH } from '../constants';
import { toast } from 'sonner';
import { getSupabase } from './supabaseClient';
import type { EnrichedDineInOrderItem } from 'types';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  customizations?: any[];
  variant?: any;
  notes?: string;
}

interface Order {
  id: string;
  order_number: string;
  table_id: string;
  status: string;
  items: OrderItem[];
  subtotal: number;
  tax_amount: number;  // ✅ FIXED: Changed from 'tax' to match backend
  total_amount: number;  // ✅ FIXED: Changed from 'total' to match backend
  server_name?: string;
  guest_count?: number; // ✅ NEW: Guest count for table
  created_at: string;
  updated_at: string;
}

/**
 * Real-time hook for managing a DINE-IN order at a specific table.
 * Subscribes to orders table and provides command functions for order operations.
 * 
 * Architecture: Event-driven pattern
 * - UI sends commands via brain client
 * - Backend updates database
 * - Real-time subscription updates UI
 * 
 * @param tableId - Table UUID to subscribe to (null = no subscription)
 * @returns Order data and command functions
 */
export const useDineInOrder = (tableId: string | null) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabaseReady, setSupabaseReady] = useState(false);
  
  // ✅ NEW: Enriched items with full menu metadata for Review Modal
  const [enrichedItems, setEnrichedItems] = useState<EnrichedDineInOrderItem[]>([]);
  const [enrichedLoading, setEnrichedLoading] = useState(false);
  const [enrichedError, setEnrichedError] = useState<string | null>(null);

  // First effect: Wait for Supabase to be properly configured
  useEffect(() => {
    let mounted = true;
    
    const initSupabase = async () => {
      try {
        console.log('[useDineInOrder] ⏳ Waiting for Supabase config...');
        await getSupabase(); // Wait for correct config
        if (mounted) {
          console.log('[useDineInOrder] ✅ Supabase configured, ready to subscribe');
          setSupabaseReady(true);
        }
      } catch (err) {
        console.error('[useDineInOrder] ❌ Failed to initialize Supabase:', err);
        if (mounted) {
          setError('Failed to initialize database connection');
        }
      }
    };
    
    initSupabase();
    
    return () => {
      mounted = false;
    };
  }, []);

  // ✅ NEW: Fetch enriched items whenever order changes
  useEffect(() => {
    if (!order?.id) {
      // No order = clear enriched items
      setEnrichedItems([]);
      return;
    }

    const fetchEnrichedItems = async () => {
      console.log('[useDineInOrder] 🖼️ Fetching enriched items for order:', order.id);
      setEnrichedLoading(true);
      setEnrichedError(null);
      
      try {
        const response = await apiClient.get_enriched_order_items({ orderId: order.id });
        const data = await response.json();
        
        if (data.success) {
          console.log('[useDineInOrder] ✅ Loaded ${data.items.length} enriched items');
          setEnrichedItems(data.items);
        } else {
          console.error('[useDineInOrder] ❌ Failed to fetch enriched items:', data.message);
          setEnrichedError(data.message || 'Failed to load enriched items');
        }
      } catch (err: any) {
        console.error('[useDineInOrder] ❌ Exception fetching enriched items:', err);
        setEnrichedError(err.message || 'Failed to load menu data');
      } finally {
        setEnrichedLoading(false);
      }
    };

    fetchEnrichedItems();
  }, [
    order?.id, 
    // ✅ FIX: Serialize items to detect ANY changes (quantity, customizations, etc.)
    // Previously only tracked items.length, missing quantity updates
    JSON.stringify(order?.items)
  ]);

  // Second effect: Subscribe to order updates (only when Supabase is ready)
  useEffect(() => {
    if (!supabaseReady || !tableId) {
      console.log('[useDineInOrder] ⏸️ Waiting for Supabase or tableId:', { supabaseReady, tableId });
      return;
    }

    console.log('[useDineInOrder] 🔌 Setting up subscription for table UUID:', tableId);

    // ✅ RELATIONAL: Fetch order + items from dine_in_order_items table
    const fetchInitialOrder = async () => {
      console.log('[useDineInOrder] 🔍 Fetching initial order for table:', tableId);
      try {
        // 1. Fetch order metadata
        const { data: orders, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('table_id', tableId)
          .in('status', ['CREATED', 'SENT_TO_KITCHEN', 'IN_PREP', 'READY', 'SERVED', 'PENDING_PAYMENT'])
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (orderError) {
          console.error('[useDineInOrder] ❌ Error fetching initial order:', orderError);
          return;
        }
        
        const existingOrder = orders && orders.length > 0 ? orders[0] : null;
        
        if (!existingOrder) {
          console.log('[useDineInOrder] ℹ️ No existing order for this table');
          setOrder(null);
          return;
        }
        
        console.log('[useDineInOrder] ✅ Found existing order:', existingOrder.id);
        
        // 2. Fetch items from dine_in_order_items table
        const { data: itemRows, error: itemsError } = await supabase
          .from('dine_in_order_items')
          .select('*')
          .eq('order_id', existingOrder.id)
          .order('created_at', { ascending: true });
        
        if (itemsError) {
          console.error('[useDineInOrder] ❌ Error fetching order items:', itemsError);
          return;
        }
        
        // 3. Transform relational rows to OrderItem interface
        const items: OrderItem[] = (itemRows || []).map(row => ({
          id: row.id,
          name: row.item_name,
          quantity: row.quantity,
          price: row.unit_price,
          customizations: row.customizations || [],
          variant: row.variant_name ? {
            name: row.variant_name,
            price: row.unit_price,
            protein_type: row.protein_type
          } : undefined,
          notes: row.notes || undefined
        }));
        
        console.log('[useDineInOrder] ✅ Loaded ${items.length} items from dine_in_order_items');
        
        // 4. Set order with relational items
        setOrder({
          ...existingOrder,
          items
        } as Order);
        
      } catch (err) {
        console.error('[useDineInOrder] ❌ Exception fetching initial order:', err);
      }
    };

    // Fetch initial data
    fetchInitialOrder();

    // ✅ RELATIONAL: Subscribe to both orders AND dine_in_order_items
    console.log('[useDineInOrder] 🔌 Creating subscriptions for orders + items tables');
    
    // Channel 1: Watch orders table for status/metadata changes
    const ordersChannel = supabase
      .channel(`order-${tableId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `table_id=eq.${tableId}`
        },
        async (payload) => {
          console.log('[useDineInOrder] 🔔 Orders table change:', payload.eventType);
          
          const validStatuses = ['CREATED', 'SENT_TO_KITCHEN', 'IN_PREP', 'READY', 'SERVED', 'PENDING_PAYMENT'];
          
          if (payload.eventType === 'DELETE') {
            console.log('[useDineInOrder] ➡️ Setting order to null (DELETE)');
            setOrder(null);
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newOrder = payload.new as any;
            console.log('[useDineInOrder] ➡️ Order updated:', newOrder.id, newOrder.status);
            
            if (!validStatuses.includes(newOrder.status)) {
              console.log('[useDineInOrder] ⏭️ Ignoring order with status:', newOrder.status);
              setOrder(null);
              return;
            }
            
            // Re-fetch complete order with items from dine_in_order_items
            const { data: orderData } = await supabase
              .from('orders')
              .select('*')
              .eq('id', newOrder.id)
              .single();
            
            if (!orderData) return;
            
            const { data: itemRows } = await supabase
              .from('dine_in_order_items')
              .select('*')
              .eq('order_id', orderData.id)
              .order('created_at', { ascending: true });
            
            const items: OrderItem[] = (itemRows || []).map(row => ({
              id: row.id,
              name: row.item_name,
              quantity: row.quantity,
              price: row.unit_price,
              customizations: row.customizations || [],
              variant: row.variant_name ? {
                name: row.variant_name,
                price: row.unit_price,
                protein_type: row.protein_type
              } : undefined,
              notes: row.notes || undefined
            }));
            
            console.log('[useDineInOrder] ✅ Order refreshed with ${items.length} items');
            setOrder({ ...orderData, items } as Order);
          }
        }
      )
      .subscribe((status) => {
        console.log('[useDineInOrder] 📡 Orders subscription status:', status);
      });
    
    // Channel 2: Watch dine_in_order_items for item changes (add/remove/update)
    const itemsChannel = supabase
      .channel(`order-items-${tableId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dine_in_order_items'
          // Note: No filter here - we'll check table_id in handler
        },
        async (payload) => {
          console.log('[useDineInOrder] 🔔 Items table change:', payload.eventType);
          
          // Verify this change is for current order
          const orderId = order?.id;
          if (!orderId) return;
          
          const changedOrderId = payload.eventType === 'DELETE' 
            ? (payload.old as any)?.order_id 
            : (payload.new as any)?.order_id;
          
          if (changedOrderId !== orderId) {
            console.log('[useDineInOrder] ⏭️ Item change for different order');
            return;
          }
          
          console.log('[useDineInOrder] ➡️ Refreshing items for current order');
          
          // Re-fetch all items for this order
          const { data: orderData } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();
          
          if (!orderData) return;
          
          const { data: itemRows } = await supabase
            .from('dine_in_order_items')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: true });
          
          const items: OrderItem[] = (itemRows || []).map(row => ({
            id: row.id,
            name: row.item_name,
            quantity: row.quantity,
            price: row.unit_price,
            customizations: row.customizations || [],
            variant: row.variant_name ? {
              name: row.variant_name,
              price: row.unit_price,
              protein_type: row.protein_type
            } : undefined,
            notes: row.notes || undefined
          }));
          
          console.log('[useDineInOrder] ✅ Items refreshed: ${items.length} items');
          setOrder({ ...orderData, items } as Order);
        }
      )
      .subscribe((status) => {
        console.log('[useDineInOrder] 📡 Items subscription status:', status);
      });

    return () => {
      console.log('[useDineInOrder] 🔌 Unsubscribing from order + items updates');
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(itemsChannel);
    };
  }, [supabaseReady, tableId, order?.id]);

  // Command: Create Order
  const createOrder = async (guestCount: number, serverId?: string, serverName?: string): Promise<string | null> => {
    console.log('[useDineInOrder] 🔍 createOrder called:', {
      tableId,
      guestCount,
      serverId,
      serverName,
      hasTableId: !!tableId
    });
    
    if (!tableId) {
      console.error('[useDineInOrder] ❌ CRITICAL: tableId is null/undefined - cannot create order');
      toast.error('No table selected');
      return null;
    }

    setLoading(true);
    try {
      // ✅ FIXED: Extract table_number from tableId (which is actually the table UUID from pos_tables)
      // We need to query pos_tables to get the table_number
      const { data: tableData, error: tableError } = await supabase
        .from('pos_tables')
        .select('table_number')
        .eq('id', tableId)
        .single();
      
      if (tableError || !tableData) {
        console.error('[useDineInOrder] ❌ Failed to fetch table number:', tableError);
        toast.error('Failed to get table information');
        return null;
      }
      
      const tableNumber = tableData.table_number;
      
      console.log('[useDineInOrder] 🔍 Calling brain.create_order with:', {
        table_number: tableNumber,  // ✅ FIXED: Send table_number (int) instead of table_id (UUID)
        guest_count: guestCount,
        server_id: serverId,
        server_name: serverName,
      });
      
      const response = await apiClient.create_order({
        table_number: tableNumber,  // ✅ FIXED: Changed from table_id to table_number
        guest_count: guestCount,
        server_id: serverId,
        server_name: serverName,
      });
      const result = await response.json();
      console.log('[useDineInOrder] ✅ Order created successfully:', result);
      toast.success('Order created');
      // State updates automatically via subscription
      return result.id;  // ✅ Return order ID instead of boolean
    } catch (err: any) {
      console.error('[useDineInOrder] ❌ Create order error:', err);
      toast.error('Failed to create order');
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Command: Add Item
  const addItem = useCallback(async (item: OrderItem) => {
    console.log('[useDineInOrder] 📥 addItem CALLED:', {
      timestamp: new Date().toISOString(),
      tableId,
      hasTableId: !!tableId,
      itemName: item.name,
      orderId: order?.id,
      hasOrder: !!order,
      WARNING: !tableId ? '⚠️ ADD ITEM CALLED WITH NULL TABLE ID!' : null
    });

    if (!tableId) {
      console.error('[useDineInOrder] ❌ Cannot add item: tableId is null');
      throw new Error('Cannot add item: No table selected');
    }

    if (!order) {
      toast.error('No active order');
      return;
    }

    setLoading(true);
    try {
      console.log('[useDineInOrder] 📤 Calling brain.add_item_to_order...');
      const response = await apiClient.add_item_to_order({
        order_id: order.id,
        item,
      });
      const result = await response.json();
      console.log('[useDineInOrder] ✅ ADD_ITEM RESPONSE:', result);
      toast.success(`Added ${item.name}`);
      // State updates via subscription
    } catch (err: any) {
      console.error('[useDineInOrder] ❌ Add item error:', err);
      toast.error('Failed to add item');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tableId, order]);

  // Command: Remove Item
  const removeItem = async (itemId: string) => {
    if (!order) {
      toast.error('No active order');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.remove_item_from_order({
        order_id: order.id,
        item_id: itemId,
      });
      await response.json();
      console.log('[useDineInOrder] Item removed:', itemId);
      toast.success('Item removed');
      // State updates via subscription
    } catch (err: any) {
      console.error('[useDineInOrder] Remove item error:', err);
      toast.error('Failed to remove item');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Command: Update Item Quantity
  const updateItemQuantity = async (itemId: string, quantity: number) => {
    if (!order) {
      toast.error('No active order');
      return;
    }

    setLoading(true);
    try {  
      const response = await apiClient.update_item_quantity_dine_in({
        order_id: order.id,
        item_id: itemId,
        new_quantity: quantity,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || errorData?.message || 'Failed to update quantity');
      }
      
      const result = await response.json();
      console.log('✅ [updateItemQuantity] Quantity updated successfully:', result);
      toast.success('Quantity updated');
      // State updates via subscription
    } catch (err: any) {
      console.error('[useDineInOrder] Update quantity error:', err);
      toast.error('Failed to update quantity');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Command: Send to Kitchen
  const sendToKitchen = async () => {
    if (!order) {
      toast.error('No active order');
      return;
    }

    if (!order.items || order.items.length === 0) {
      toast.error('Cannot send empty order to kitchen');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.send_to_kitchen({ order_id: order.id });
      await response.json();
      console.log('[useDineInOrder] Order sent to kitchen');
      toast.success('Order sent to kitchen');
      // State updates via subscription
    } catch (err: any) {
      console.error('[useDineInOrder] Send to kitchen error:', err);
      toast.error(err.message || 'Failed to send order');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Command: Request Check (Print Bill)
  const requestCheck = async () => {
    if (!order) {
      toast.error('No active order');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.request_check({ order_id: order.id });
      await response.json();
      console.log('[useDineInOrder] Check requested');
      toast.success('Bill printed');
      // State updates via subscription
    } catch (err: any) {
      console.error('[useDineInOrder] Request check error:', err);
      toast.error('Failed to print bill');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Command: Update Guest Count
  const updateGuestCount = async (guestCount: number) => {
    if (!order) {
      toast.error('No active order');
      return;
    }

    if (guestCount < 1) {
      toast.error('Guest count must be at least 1');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.update_guest_count({
        order_id: order.id,
        guest_count: guestCount,
      });
      await response.json();
      console.log('[useDineInOrder] Guest count updated:', guestCount);
      toast.success(`Guest count updated to ${guestCount}`);
      // State updates via subscription
    } catch (err: any) {
      console.error('[useDineInOrder] Update guest count error:', err);
      toast.error('Failed to update guest count');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Command: Mark Paid
  const markPaid = async (paymentMethod: string, amount: number) => {
    if (!order) {
      toast.error('No active order');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.mark_paid({
        order_id: order.id,
        payment_method: paymentMethod,
        amount,
      });
      await response.json();
      console.log('[useDineInOrder] Order marked as paid');
      toast.success('Payment recorded');
      // State updates via subscription
    } catch (err: any) {
      console.error('[useDineInOrder] Mark paid error:', err);
      toast.error(err.message || 'Failed to record payment');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    order,
    loading,
    error,
    enrichedItems,
    enrichedLoading,
    enrichedError,
    createOrder,
    addItem,
    removeItem,
    updateItemQuantity,
    sendToKitchen,
    requestCheck,
    updateGuestCount,
    markPaid,
  };
};
