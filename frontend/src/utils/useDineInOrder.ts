import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from './supabaseClient';
import brain from 'brain';
import { toast } from 'sonner';
import { EnrichedDineInOrderItem } from '../brain/data-contracts';
import { getOfflineStatus } from './serviceWorkerManager';

// Debounce delay for subscription refetch (ms)
const REFETCH_DEBOUNCE_MS = 300;

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  customizations?: any[];
  variant?: any;
  notes?: string;
  menu_item_id?: string;
  variant_id?: string | null;
  variantId?: string | null; // camelCase alias
  variantName?: string | null; // camelCase alias
  category_id?: string;
  kitchen_display_name?: string | null;
  display_order?: number;
}

interface Order {
  id: string;
  order_number: string;
  table_id: string;
  table_number?: number;
  status: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  total_amount?: number;
  guest_count?: number;
  server_name?: string;
  created_at: string;
  updated_at: string;
}

export const useDineInOrder = (tableId: string | null) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enriched items from dine_in_order_items table
  const [enrichedItems, setEnrichedItems] = useState<EnrichedDineInOrderItem[]>([]);
  const [enrichedLoading, setEnrichedLoading] = useState(false);
  const [enrichedError, setEnrichedError] = useState<string | null>(null);

  // Debounce ref for subscription refetch
  const refetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // AbortController ref for canceling stale fetch requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch enriched items from dine_in_order_items table
  const fetchEnrichedItems = useCallback(async (orderId: string) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setEnrichedLoading(true);
    setEnrichedError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('dine_in_order_items')
        .select(`
          *,
          menu_items:menu_item_id (
            id,
            name,
            description,
            kitchen_display_name,
            display_order,
            is_vegetarian,
            is_vegan,
            is_gluten_free,
            spice_level
          ),
          menu_categories:category_id (
            id,
            name
          )
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: true })
        .abortSignal(abortControllerRef.current.signal);

      if (fetchError) throw fetchError;

      // Transform to EnrichedDineInOrderItem format with menu data enrichment
      const enriched: EnrichedDineInOrderItem[] = (data || []).map((item: any) => ({
        id: item.id,
        order_id: item.order_id,
        customer_tab_id: item.customer_tab_id,
        table_number: item.table_number,
        menu_item_id: item.menu_item_id,
        variant_id: item.variant_id,
        category_id: item.category_id,
        item_name: item.item_name,
        variant_name: item.variant_name,
        protein_type: item.protein_type,
        protein_type_name: item.protein_type_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total ?? (item.unit_price * item.quantity),
        customizations: item.customizations,
        notes: item.notes,
        status: item.status,
        sent_to_kitchen_at: item.sent_to_kitchen_at,
        created_at: item.created_at,
        updated_at: item.updated_at,
        // Image URL from dine_in_order_items snapshot (menu_items uses image_asset_id, not image_url)
        image_url: item.image_url || null,
        category_name: item.category_name || item.menu_categories?.name || null,
        item_description: item.menu_items?.description || null,
        menu_item_description: item.menu_items?.description || null,
        kitchen_display_name: item.kitchen_display_name || item.menu_items?.kitchen_display_name || null,
        display_order: item.display_order ?? item.menu_items?.display_order ?? 0,
        // Dietary flags
        is_vegetarian: item.menu_items?.is_vegetarian ?? false,
        is_vegan: item.menu_items?.is_vegan ?? false,
        is_gluten_free: item.menu_items?.is_gluten_free ?? false,
        spice_level: item.menu_items?.spice_level ?? null,
      }));

      setEnrichedItems(enriched);
      console.log('[useDineInOrder] Loaded enriched items:', enriched.length);
    } catch (err: any) {
      // Ignore abort errors
      if (err.name === 'AbortError') {
        console.log('[useDineInOrder] Fetch aborted (superseded by newer request)');
        return;
      }
      console.error('[useDineInOrder] Fetch enriched items error:', err);
      setEnrichedError(err.message);
    } finally {
      setEnrichedLoading(false);
    }
  }, []);

  // Debounced refetch function - prevents rapid successive fetches
  const debouncedFetchEnrichedItems = useCallback((orderId: string) => {
    // Clear any pending debounced fetch
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
    }
    // Schedule new fetch after debounce delay
    refetchTimeoutRef.current = setTimeout(() => {
      fetchEnrichedItems(orderId);
    }, REFETCH_DEBOUNCE_MS);
  }, [fetchEnrichedItems]);

  // Fetch current order for table
  useEffect(() => {
    if (!tableId) {
      setOrder(null);
      setEnrichedItems([]);
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      try {
        // Query orders table directly by table_id (UUID)
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('table_id', tableId)
          .in('status', ['CREATED', 'SENT_TO_KITCHEN', 'IN_PREP', 'READY', 'SERVED', 'PENDING_PAYMENT'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (orderError) throw orderError;

        if (orderData) {
          setOrder(orderData as Order);
          console.log('[useDineInOrder] Loaded active order:', orderData);
          // Fetch enriched items for this order
          await fetchEnrichedItems(orderData.id);
        } else {
          setOrder(null);
          setEnrichedItems([]);
          console.log('[useDineInOrder] No active order for table', tableId);
        }
      } catch (err: any) {
        console.error('[useDineInOrder] Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Subscribe to real-time order updates for this table
    const orderSubscription = supabase
      .channel(`table-order-${tableId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `table_id=eq.${tableId}`,
        },
        (payload) => {
          console.log('[useDineInOrder] Real-time order update:', payload);
          if (payload.eventType === 'DELETE') {
            setOrder(null);
            setEnrichedItems([]);
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newOrder = payload.new as Order;
            if (['CREATED', 'SENT_TO_KITCHEN', 'IN_PREP', 'READY', 'SERVED', 'PENDING_PAYMENT'].includes(newOrder.status)) {
              setOrder(newOrder);
              // Note: Items will be fetched by the items subscription (separate useEffect)
            } else {
              setOrder(null);
              setEnrichedItems([]);
            }
          }
        }
      )
      .subscribe();

    console.log(`[useDineInOrder] Subscribed to orders for table ${tableId}`);

    return () => {
      console.log(`[useDineInOrder] Unsubscribing from orders for table ${tableId}`);
      orderSubscription.unsubscribe();
      // Clear debounce timeout on cleanup
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
      // Cancel any in-flight requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [tableId]);

  // Separate subscription for items - depends on order.id for proper filtering
  // This subscription only activates once we have an order, enabling the filter
  useEffect(() => {
    if (!order?.id) {
      return;
    }

    // Initial fetch when order is first loaded
    fetchEnrichedItems(order.id);

    // Subscribe to real-time dine_in_order_items updates WITH filter
    // This reduces subscription events by ~95% (only our order, not all orders)
    const itemsSubscription = supabase
      .channel(`order-items-${order.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dine_in_order_items',
          filter: `order_id=eq.${order.id}`,
        },
        (payload) => {
          console.log('[useDineInOrder] Real-time items update for order:', order.id, payload.eventType);
          // Use debounced fetch to prevent race conditions from rapid changes
          debouncedFetchEnrichedItems(order.id);
        }
      )
      .subscribe();

    console.log(`[useDineInOrder] Subscribed to items for order ${order.id} (filtered)`);

    return () => {
      console.log(`[useDineInOrder] Unsubscribing from items for order ${order.id}`);
      itemsSubscription.unsubscribe();
    };
  }, [order?.id, fetchEnrichedItems, debouncedFetchEnrichedItems]);

  // Command: Create Order
  // Now accepts full order creation params including linking data
  interface CreateOrderParams {
    guestCount?: number;
    linkedTables?: number[];
    tableGroupId?: string;
    serverId?: string;
    serverName?: string;
  }

  const createOrder = async (paramsOrGuestCount?: CreateOrderParams | number, serverName?: string): Promise<string | null> => {
    if (!tableId) {
      toast.error('No table selected');
      return null;
    }

    // Check online status - dine-in orders require network for real-time coordination
    if (getOfflineStatus()) {
      toast.error('Dine-in orders require network connection. Please check WiFi.', { duration: 5000 });
      console.warn('[useDineInOrder] Blocked offline dine-in order creation');
      return null;
    }

    // Handle backwards compatibility: can be (number) or (CreateOrderParams)
    let params: CreateOrderParams = {};
    if (typeof paramsOrGuestCount === 'number') {
      params.guestCount = paramsOrGuestCount;
      // serverName passed as second arg for backwards compat
    } else if (typeof paramsOrGuestCount === 'object') {
      params = paramsOrGuestCount;
    }

    setLoading(true);
    try {
      // Create order via brain API - now includes linking data
      const response = await brain.create_order({
        table_id: tableId,
        server_id: params.serverId,
        server_name: params.serverName || serverName,
        // Pass linking data directly (backend now supports these fields)
        guest_count: params.guestCount,
        linked_tables: params.linkedTables,
        table_group_id: params.tableGroupId,
      });
      const result = await response.json();
      const orderId = result.id;

      if (!orderId) {
        throw new Error('Order creation returned no ID');
      }

      console.log('[useDineInOrder] Order created via brain with linking data:', {
        orderId,
        guestCount: params.guestCount,
        linkedTables: params.linkedTables,
        tableGroupId: params.tableGroupId
      });

      toast.success('Order created');
      return orderId;
    } catch (err: any) {
      console.error('[useDineInOrder] Create order error:', err);
      toast.error('Failed to create order');
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Command: Add Item
  const addItem = async (item: OrderItem) => {
    if (!order) {
      toast.error('No active order');
      return;
    }

    // Check online status - adding items requires network for dine-in orders
    if (getOfflineStatus()) {
      toast.error('Cannot add items while offline. Please check WiFi.', { duration: 4000 });
      return;
    }

    // VALIDATION: Prevent variant name corruption
    // If variant_id is provided, variant_name must also be provided
    const variantId = item.variant_id || item.variantId;
    const variantName = item.variantName || (item as any).variant_name;

    if (variantId && !variantName) {
      console.error('[useDineInOrder] Variant validation failed: variant_id provided without variant_name', {
        menu_item_id: item.menu_item_id,
        variant_id: variantId,
        item_name: item.name
      });
      toast.error('Item configuration error - please select variant again');
      return;
    }

    // Ensure variant_name is included in the item payload (snake_case for backend)
    const validatedItem = {
      ...item,
      variant_name: variantName || null
    };

    setLoading(true);
    try {
      const response = await brain.add_item_to_order({
        order_id: order.id,
        item: validatedItem,
      });
      await response.json();
      console.log('[useDineInOrder] Item added:', item.name);
      toast.success(`Added ${item.name}`);
      // State updates via subscription
    } catch (err: any) {
      console.error('[useDineInOrder] Add item error:', err);
      toast.error('Failed to add item');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Command: Remove Item
  const removeItem = async (itemId: string) => {
    if (!order) {
      toast.error('No active order');
      return;
    }

    setLoading(true);
    try {
      const response = await brain.remove_item_from_order({
        order_id: order.id,
        item_id: itemId,
      });
      await response.json();
      console.log('[useDineInOrder] Item removed:', itemId);
      toast.success('Item removed');
      // Explicitly refresh items list (real-time subscription is unreliable)
      if (order?.id) {
        await fetchEnrichedItems(order.id);
      }
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

    if (quantity < 1) {
      // If quantity is 0 or less, remove the item
      return removeItem(itemId);
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('dine_in_order_items')
        .update({
          quantity,
          line_total: supabase.rpc('calculate_line_total', { item_id: itemId, new_quantity: quantity })
        })
        .eq('id', itemId);

      if (updateError) {
        // Fallback: update quantity only, let trigger handle line_total
        const { error: fallbackError } = await supabase
          .from('dine_in_order_items')
          .update({ quantity })
          .eq('id', itemId);

        if (fallbackError) throw fallbackError;
      }

      console.log('[useDineInOrder] Item quantity updated:', itemId, quantity);
      toast.success('Quantity updated');
      // Re-fetch enriched items
      await fetchEnrichedItems(order.id);
    } catch (err: any) {
      console.error('[useDineInOrder] Update quantity error:', err);
      toast.error('Failed to update quantity');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Command: Update Guest Count
  const updateGuestCount = async (count: number) => {
    if (!order) {
      toast.error('No active order');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ guest_count: count })
        .eq('id', order.id);

      if (updateError) throw updateError;

      console.log('[useDineInOrder] Guest count updated:', count);
      toast.success('Guest count updated');
      // State updates via subscription
    } catch (err: any) {
      console.error('[useDineInOrder] Update guest count error:', err);
      toast.error('Failed to update guest count');
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

    // Check enrichedItems for content (source of truth for dine-in items)
    // Note: order.items is always empty for dine-in - use enrichedItems instead
    if (enrichedItems.length === 0) {
      toast.error('Cannot send empty order to kitchen');
      return;
    }

    // Check online status - sending to kitchen requires network
    if (getOfflineStatus()) {
      toast.error('Cannot send to kitchen while offline. Please check WiFi.', { duration: 5000 });
      return;
    }

    setLoading(true);
    try {
      const response = await brain.send_to_kitchen({ order_id: order.id });
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
      const response = await brain.request_check({ order_id: order.id });
      await response.json();
      console.log('[useDineInOrder] Bill requested');
      toast.success('Bill sent to printer');
      // State updates via subscription
    } catch (err: any) {
      console.error('[useDineInOrder] Request check error:', err);
      toast.error(err.message || 'Failed to print bill');
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
      const response = await brain.mark_paid({
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

  // Command: Update Linked Tables
  // Used when modifying linked tables on an existing order
  const updateLinkedTables = async (linkedTables: number[], tableGroupId: string): Promise<boolean> => {
    if (!order) {
      toast.error('No active order');
      return false;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          linked_tables: linkedTables,
          table_group_id: tableGroupId
        })
        .eq('id', order.id);

      if (updateError) throw updateError;

      console.log('[useDineInOrder] Linked tables updated:', linkedTables);
      toast.success('Linked tables updated');
      return true;
    } catch (err: any) {
      console.error('[useDineInOrder] Update linked tables error:', err);
      toast.error('Failed to update linked tables');
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Command: Update Linked Tables by Order ID (static method for external use)
  // Used when we need to update an order we don't have loaded in state
  const updateLinkedTablesById = async (
    orderId: string,
    linkedTables: number[],
    tableGroupId: string
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          linked_tables: linkedTables,
          table_group_id: tableGroupId
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      console.log('[useDineInOrder] Linked tables updated for order:', orderId, linkedTables);
      return true;
    } catch (err: any) {
      console.error('[useDineInOrder] Update linked tables error:', err);
      return false;
    }
  };

  return {
    order,
    loading,
    error,
    // Enriched items from dine_in_order_items table
    enrichedItems,
    enrichedLoading,
    enrichedError,
    // Commands
    createOrder,
    addItem,
    removeItem,
    updateItemQuantity,
    sendToKitchen,
    requestCheck,
    markPaid,
    updateGuestCount,
    updateLinkedTables,
    updateLinkedTablesById,
  };
};
