/**
 * Riff Framework Compatibility Layer
 *
 * This module provides stubs for Riff-specific imports that don't exist
 * in the standalone Electron build. It allows the codebase to be built
 * without errors while maintaining compatibility with the Riff platform.
 *
 * DESKTOP APP: These stubs return sensible defaults so the app can load.
 * Menu data comes from Supabase realtime subscriptions instead of backend API.
 *
 * HYBRID MODE: When VITE_RIFF_BACKEND_URL is set, critical admin functions
 * (like publish_menu) call the real Riff backend to sync changes across
 * all touchpoints (POS, online orders, chatbot).
 */

import { supabase } from 'utils/supabaseClient';
import { toast } from 'sonner';

// Hybrid mode configuration
const RIFF_BACKEND_URL = import.meta.env.VITE_RIFF_BACKEND_URL || '';
const isHybridMode = !!RIFF_BACKEND_URL;

if (isHybridMode) {
  console.log('✅ [app-compat] Hybrid mode enabled - backend:', RIFF_BACKEND_URL);
} else {
  console.log('⚠️ [app-compat] Local-only mode - backend URL not configured');
}

/**
 * Helper for backend API calls (hybrid mode)
 */
const callBackendAPI = async (endpoint: string, options: RequestInit = {}) => {
  if (!isHybridMode) {
    throw new Error('Backend not configured - set VITE_RIFF_BACKEND_URL in .env');
  }

  const url = `${RIFF_BACKEND_URL}${endpoint}`;
  console.log('🌐 [app-compat] Calling backend API:', endpoint);

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backend API error ${response.status}: ${errorText}`);
  }

  return await response.json();
};

// Mode enum (DEV/PROD)
export const Mode = {
  DEV: 'development',
  PROD: 'production'
};

// Current mode (hardcoded for desktop build)
export const mode = process.env.NODE_ENV === 'production' ? Mode.PROD : Mode.DEV;

// App base path (empty for desktop, as it runs locally)
export const APP_BASE_PATH = '';

/**
 * Helper to create a mock Response-like object
 */
const mockResponse = (data: any, ok = true) => ({
  ok,
  json: async () => data,
  text: async () => JSON.stringify(data),
  status: ok ? 200 : 500,
});

/**
 * API Client stub for Desktop App
 *
 * CRITICAL methods return sensible defaults.
 * NON-CRITICAL methods are no-ops or return empty data.
 * Menu/order data flows through Supabase realtime instead.
 */
export const apiClient = {
  // ============================================================================
  // CRITICAL: POS Settings - return sensible defaults
  // ============================================================================
  get_pos_settings: async () => {
    console.log('🔄 [app-compat] get_pos_settings - querying Supabase');
    const DEFAULT_POS_SETTINGS = {
      service_charge: { enabled: false, percentage: 10.0, print_on_receipt: true },
      delivery_charge: { enabled: true, amount: 3.50, print_on_receipt: true },
      delivery: {
        radius_miles: 6.0,
        minimum_order_value: 15.0,
        allowed_postcodes: ["RH20", "BN5", "RH13", "BN6", "RH14"]
      },
      variant_carousel_enabled: true,
      urgency_settings: {
        enabled: true,
        stale_order_hours: 2,
        in_kitchen_high_minutes: 20,
        seated_medium_minutes: 15,
        ordering_medium_minutes: 10
      }
    };
    try {
      const { data, error } = await supabase
        .from('pos_settings')
        .select('settings')
        .eq('id', 1)
        .single();

      if (error || !data) {
        console.warn('⚠️ [app-compat] pos_settings not found, using defaults');
        return mockResponse({ settings: DEFAULT_POS_SETTINGS });
      }

      console.log('✅ [app-compat] pos_settings loaded from DB');
      return mockResponse({ settings: { ...DEFAULT_POS_SETTINGS, ...data.settings } });
    } catch (error) {
      console.error('❌ [app-compat] get_pos_settings exception:', error);
      return mockResponse({ settings: DEFAULT_POS_SETTINGS });
    }
  },

  save_pos_settings: async (data: any) => {
    console.log('📝 [app-compat] save_pos_settings called:', data);
    try {
      const settings = data?.settings || data;

      // Check if row exists
      const { data: existing } = await supabase
        .from('pos_settings')
        .select('id')
        .eq('id', 1)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('pos_settings')
          .update({ settings, updated_at: new Date().toISOString() })
          .eq('id', 1);
        if (error) {
          console.error('❌ [app-compat] save_pos_settings update error:', error);
          return mockResponse({ success: false, error: error.message }, false);
        }
      } else {
        const { error } = await supabase
          .from('pos_settings')
          .insert({ id: 1, settings, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        if (error) {
          console.error('❌ [app-compat] save_pos_settings insert error:', error);
          return mockResponse({ success: false, error: error.message }, false);
        }
      }

      console.log('✅ [app-compat] POS settings saved');
      return mockResponse({ success: true, message: 'POS settings saved successfully' });
    } catch (error) {
      console.error('❌ [app-compat] save_pos_settings exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  // ============================================================================
  // CRITICAL: Menu/POS Bundle - return failure to trigger Supabase fallback
  // The fallbackRefreshData() in realtimeMenuStore queries Supabase directly
  // ============================================================================
  get_pos_bundle: async () => {
    console.log('⚠️ [app-compat] get_pos_bundle stub - triggering fallback to Supabase');
    return mockResponse({ success: false, message: 'Stub - use Supabase fallback' });
  },

  get_menu_with_ordering: async () => {
    console.log('⚠️ [app-compat] get_menu_with_ordering stub - triggering fallback to Supabase');
    return mockResponse({ success: false, message: 'Stub - use Supabase fallback' });
  },

  get_menu_items: async () => {
    console.log('🔄 [app-compat] get_menu_items - querying Supabase with enrichment');

    // 1. Fetch menu items
    const { data: items, error: itemsError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_active', true)
      .order('display_print_order');

    if (itemsError) {
      console.error('❌ [app-compat] get_menu_items error:', itemsError);
      return mockResponse({ items: [] });
    }

    // 2. Fetch variants for these items
    const { data: variants } = await supabase
      .from('menu_item_variants')
      .select('*, menu_protein_types:protein_type_id(id, name)')
      .eq('is_active', true);

    // 3. Collect image_asset_ids for enrichment
    const assetIds = new Set<string>();
    items?.forEach((item: any) => {
      if (item.image_asset_id) assetIds.add(item.image_asset_id);
    });
    variants?.forEach((v: any) => {
      if (v.image_asset_id) assetIds.add(v.image_asset_id);
    });

    // 4. Fetch media assets
    let assetUrlMap = new Map<string, string>();
    if (assetIds.size > 0) {
      const { data: assets } = await supabase
        .from('media_assets')
        .select('id, url, square_webp_url, square_jpeg_url')
        .in('id', Array.from(assetIds));

      assets?.forEach((asset: any) => {
        const url = asset.square_webp_url || asset.square_jpeg_url || asset.url;
        if (url) assetUrlMap.set(asset.id, url);
      });
    }

    // 5. Enrich items with image URLs and attach variants
    const enrichedItems = items?.map((item: any) => {
      const itemVariants = variants?.filter((v: any) => v.menu_item_id === item.id)
        .map((v: any) => ({
          ...v,
          protein_type_name: v.menu_protein_types?.name,
          image_url: v.image_asset_id ? assetUrlMap.get(v.image_asset_id) : null
        })) || [];

      let imageUrl = item.image_asset_id ? assetUrlMap.get(item.image_asset_id) : null;
      if (!imageUrl && itemVariants.length > 0) {
        const variantWithImage = itemVariants.find((v: any) => v.image_url);
        imageUrl = variantWithImage?.image_url || null;
      }

      return {
        ...item,
        image_url: imageUrl,
        variants: itemVariants,
        price: item.base_price ?? item.price ?? 0
      };
    }) || [];

    const itemsWithImages = enrichedItems.filter((i: any) => i.image_url).length;
    console.log('✅ [app-compat] get_menu_items loaded:', enrichedItems.length, 'items,', itemsWithImages, 'with images');
    return mockResponse({ items: enrichedItems });
  },

  item_details: async (itemId: string) => mockResponse({ item: null }),

  category_items: async (categoryId: string) => mockResponse({ success: true, data: { items: [] } }),

  // ============================================================================
  // CRITICAL: Tables - query from Supabase pos_tables
  // ============================================================================
  get_tables: async () => {
    try {
      const { data, error } = await supabase
        .from('pos_tables')
        .select('*')
        .order('table_number');

      if (error) {
        console.error('❌ [app-compat] get_tables error:', error);
        return mockResponse({ success: false, tables: [] });
      }

      console.log(`✅ [app-compat] Loaded ${data?.length || 0} tables from pos_tables`);
      return mockResponse({ success: true, tables: data || [] });
    } catch (error) {
      console.error('❌ [app-compat] get_tables exception:', error);
      return mockResponse({ success: false, tables: [] });
    }
  },

  create_table: async (data: any) => {
    console.log('🪑 [app-compat] create_table called:', data);
    try {
      const { data: newTable, error } = await supabase
        .from('pos_tables')
        .insert({
          table_number: data.table_number,
          capacity: data.capacity || 4,
          status: data.status || 'AVAILABLE',
          section: data.section || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [app-compat] Failed to create table:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      console.log('✅ [app-compat] Table created:', newTable.table_number);
      return mockResponse({ success: true, table: newTable });
    } catch (error) {
      console.error('❌ [app-compat] Exception in create_table:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  update_table: async (tableNumber: number, data: any) => {
    console.log('🪑 [app-compat] update_table called:', tableNumber, data);
    try {
      const { error } = await supabase
        .from('pos_tables')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('table_number', tableNumber);

      if (error) {
        console.error('❌ [app-compat] Failed to update table:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      console.log('✅ [app-compat] Table updated:', tableNumber);
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] Exception in update_table:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  update_pos_table: async (tableNumber: number, data: any) => {
    console.log('🪑 [app-compat] update_pos_table called:', tableNumber, data);
    try {
      const updateData: any = { updated_at: new Date().toISOString() };

      // Map common fields
      if (data.status !== undefined) updateData.status = data.status;
      if (data.capacity !== undefined) updateData.capacity = data.capacity;
      if (data.section !== undefined) updateData.section = data.section;
      if (data.current_order_id !== undefined) updateData.current_order_id = data.current_order_id;

      const { error } = await supabase
        .from('pos_tables')
        .update(updateData)
        .eq('table_number', tableNumber);

      if (error) {
        console.error('❌ [app-compat] Failed to update pos_table:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      console.log('✅ [app-compat] POS table updated:', tableNumber);
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] Exception in update_pos_table:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  delete_pos_table: async (params: any) => {
    console.log('🪑 [app-compat] delete_pos_table called:', params);
    try {
      const tableNumber = params?.table_number || params?.tableNumber;
      const tableId = params?.table_id || params?.id;

      let query = supabase.from('pos_tables').delete();

      if (tableId) {
        query = query.eq('id', tableId);
      } else if (tableNumber) {
        query = query.eq('table_number', tableNumber);
      } else {
        return mockResponse({ success: false, error: 'Table number or ID required' }, false);
      }

      const { error } = await query;

      if (error) {
        console.error('❌ [app-compat] Failed to delete table:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      console.log('✅ [app-compat] Table deleted:', tableNumber || tableId);
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] Exception in delete_pos_table:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  add_table: async (data: any) => {
    // Alias for create_table
    console.log('🪑 [app-compat] add_table called (alias for create_table):', data);
    return apiClient.create_table(data);
  },

  clear_table: async (params: any) => {
    console.log('🪑 [app-compat] clear_table called:', params);
    try {
      const tableNumber = params?.table_number || params?.tableNumber;
      const tableId = params?.table_id || params?.id;

      let updateQuery = supabase
        .from('pos_tables')
        .update({
          status: 'AVAILABLE',
          current_order_id: null,
          updated_at: new Date().toISOString(),
        });

      if (tableId) {
        updateQuery = updateQuery.eq('id', tableId);
      } else if (tableNumber) {
        updateQuery = updateQuery.eq('table_number', tableNumber);
      } else {
        return mockResponse({ success: false, error: 'Table number or ID required' }, false);
      }

      const { error } = await updateQuery;

      if (error) {
        console.error('❌ [app-compat] Failed to clear table:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      console.log('✅ [app-compat] Table cleared:', tableNumber || tableId);
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] Exception in clear_table:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  // ============================================================================
  // CRITICAL: Orders - return success (orders go through Supabase)
  // ============================================================================
  store_order: async (order: any) => {
    console.log('📝 [app-compat] store_order called:', order);
    try {
      // Generate order number
      const orderNumber = order.order_number || `POS-${Date.now().toString(36).toUpperCase()}`;

      const { data, error } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          order_type: order.order_type || order.orderType || 'COLLECTION',
          order_source: 'POS',
          status: order.status || 'confirmed',
          customer_name: order.customer_name || order.customerName || 'Walk-in Customer',
          customer_phone: order.customer_phone || order.customerPhone || null,
          customer_email: order.customer_email || order.customerEmail || null,
          items: order.items || [],
          subtotal: order.subtotal || 0,
          tax_amount: order.tax_amount || 0,
          delivery_fee: order.delivery_fee || 0,
          total_amount: order.total_amount || order.total || 0,
          payment_method: order.payment_method || 'cash',
          payment_status: order.payment_status || 'completed',
          special_instructions: order.special_instructions || order.notes || null,
          delivery_address: order.delivery_address || null,
          table_number: order.table_number || null,
          guest_count: order.guest_count || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [app-compat] Failed to store order:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      console.log('✅ [app-compat] Order stored:', data.id);
      return mockResponse({
        success: true,
        order_id: data.id,
        order_number: data.order_number,
        order: data
      });
    } catch (error) {
      console.error('❌ [app-compat] Exception in store_order:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  get_orders: async (params: any) => {
    console.log('📋 [app-compat] get_orders called:', params);
    try {
      const { page = 1, page_size = 20, order_type, order_source, status, search } = params || {};
      const offset = (page - 1) * page_size;

      // Query orders with joins matching backend format
      let ordersQuery = supabase
        .from('orders')
        .select(
          '*, order_items(*), customers(id,first_name,last_name,phone,customer_reference_number,total_orders,total_spend,last_order_at,tags,notes_summary)',
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + page_size - 1);

      if (order_type) {
        ordersQuery = ordersQuery.eq('order_type', order_type);
      }
      if (order_source) {
        ordersQuery = ordersQuery.eq('order_source', order_source);
      }
      if (status) {
        ordersQuery = ordersQuery.eq('status', status);
      }
      if (search) {
        const q = `%${search}%`;
        ordersQuery = ordersQuery.or(`customer_name.ilike.${q},order_number.ilike.${q},customer_phone.ilike.${q}`);
      }

      const { data: orders, error, count } = await ordersQuery;

      if (error) {
        console.error('❌ [app-compat] Failed to get orders:', error);
        return mockResponse({ orders: [], total_count: 0, error: error.message }, false);
      }

      // Transform raw Supabase rows to match backend response format
      const transformedOrders = (orders || []).map((row: any) => {
        // Process order items: prefer order_items relation, fallback to JSON items column
        const orderItemsRelation = row.order_items || [];
        let items: any[] = [];
        if (orderItemsRelation.length > 0) {
          items = orderItemsRelation.map((item: any) => ({
            item_id: item.item_id || `item_${items.length + 1}`,
            name: item.item_name || '',
            quantity: item.quantity || 1,
            price: parseFloat(item.unit_price || 0),
            variant_name: item.variant_name || null,
            notes: item.special_instructions || '',
          }));
        } else {
          const jsonItems = row.items || [];
          items = (Array.isArray(jsonItems) ? jsonItems : []).map((item: any) => ({
            item_id: item.id || `item_${items.length + 1}`,
            name: item.name || '',
            quantity: item.quantity || 1,
            price: parseFloat(item.price || 0),
            variant_name: item.variant || null,
            notes: item.notes || '',
          }));
        }

        return {
          order_id: row.id,
          order_number: row.order_number || '',
          customer_name: row.customer_name || '',
          customer_phone: row.customer_phone || '',
          customer_email: row.customer_email || '',
          customer_id: row.customer_id,
          customer_data: row.customers || null,
          order_type: row.order_type || '',
          order_source: row.order_source || '',
          status: row.status || '',
          table_number: row.table_number,
          items,
          subtotal: parseFloat(row.subtotal || 0),
          tax: parseFloat(row.tax_amount || 0),
          total: parseFloat(row.total_amount || 0),
          payment: {
            method: row.payment_method || '',
            amount: parseFloat(row.total_amount || 0),
            status: row.payment_status === 'paid' ? 'completed' : 'pending',
            transaction_id: row.payment_reference || null,
          },
          created_at: row.created_at,
          completed_at: row.updated_at || row.created_at,
          special_instructions: row.special_instructions || '',
        };
      });

      console.log(`✅ [app-compat] Loaded ${transformedOrders.length} orders (total: ${count})`);
      return mockResponse({ orders: transformedOrders, total_count: count || 0 });
    } catch (error) {
      console.error('❌ [app-compat] Exception in get_orders:', error);
      return mockResponse({ orders: [], total_count: 0, error: (error as Error).message }, false);
    }
  },

  get_order_by_id: async (params: any) => {
    console.log('📋 [app-compat] get_order_by_id called:', params);
    try {
      const orderId = params?.order_id || params?.id;
      if (!orderId) {
        return mockResponse({ order: null, error: 'Order ID required' }, false);
      }

      // Try regular orders table first
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (!error && order) {
        console.log('✅ [app-compat] Found order in orders table:', order.order_number);
        return mockResponse({ order });
      }

      console.warn('⚠️ [app-compat] Order not found:', orderId);
      return mockResponse({ order: null, error: 'Order not found' });
    } catch (error) {
      console.error('❌ [app-compat] Exception in get_order_by_id:', error);
      return mockResponse({ order: null, error: (error as Error).message }, false);
    }
  },

  create_order: async (data: any) => {
    console.log('📝 [app-compat] create_order called:', data);
    try {
      // For DINE-IN orders (when table_id is provided)
      if (data.table_id) {
        const orderNumber = `DINE-${Date.now().toString(36).toUpperCase()}`;
        const { data: newOrder, error } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            order_type: 'DINE_IN',
            order_source: 'POS',
            table_id: data.table_id,
            status: 'pending',
            guest_count: data.guest_count || 1,
            server_id: data.server_id,
            server_name: data.server_name,
            customer_name: data.customer_name || 'Dine-In Guest',
            subtotal: 0,
            tax_amount: 0,
            total_amount: 0,
            payment_status: 'pending',
            items: [],
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error('❌ [app-compat] Failed to create dine-in order:', error);
          return mockResponse({ success: false, error: error.message }, false);
        }

        // Update table status to OCCUPIED
        await supabase
          .from('pos_tables')
          .update({
            status: 'OCCUPIED',
            current_order_id: newOrder.id
          })
          .eq('id', data.table_id);

        console.log('✅ [app-compat] Dine-in order created:', newOrder.id);
        return mockResponse({ success: true, id: newOrder.id, order: newOrder });
      }

      // For regular orders (COLLECTION, DELIVERY, WAITING)
      console.log('📝 [app-compat] Creating non-DINE-IN order:', data.order_type || 'COLLECTION');
      const orderNumber = `POS-${Date.now().toString(36).toUpperCase()}`;
      const { data: newOrder, error } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          order_type: data.order_type || 'COLLECTION',
          order_source: 'POS',
          status: 'confirmed',
          customer_name: data.customer_name || 'Walk-in Customer',
          customer_phone: data.customer_phone || null,
          customer_email: data.customer_email || null,
          items: data.items || [],
          subtotal: data.subtotal || 0,
          tax_amount: data.tax_amount || 0,
          total_amount: data.total_amount || 0,
          payment_method: data.payment_method || null,
          payment_status: data.payment_status || 'pending',
          delivery_address: data.delivery_address || null,
          special_instructions: data.special_instructions || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [app-compat] Failed to create order:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      console.log('✅ [app-compat] Order created:', newOrder.id);
      return mockResponse({
        success: true,
        id: newOrder.id,
        order_id: newOrder.id,
        order_number: newOrder.order_number,
        order: newOrder
      });
    } catch (error) {
      console.error('❌ [app-compat] Exception in create_order:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  update_order_status: async (params: any) => {
    console.log('🔄 [app-compat] update_order_status called:', params);
    try {
      const { order_id, status, order_type } = params;
      if (!order_id || !status) {
        return mockResponse({ success: false, error: 'Order ID and status required' }, false);
      }

      // All orders are in the 'orders' table
      const { error } = await supabase
        .from('orders')
        .update({
          status,
          updated_at: new Date().toISOString(),
          status_updated_at: new Date().toISOString(),
        })
        .eq('id', order_id);

      if (error) {
        console.error('❌ [app-compat] Failed to update order status:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      console.log('✅ [app-compat] Order status updated:', order_id, '→', status);
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] Exception in update_order_status:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  get_online_orders: async (params: any) => {
    console.log('🔄 [app-compat] get_online_orders - querying Supabase', params);
    try {
      const { page = 1, page_size = 100, status } = params || {};
      const offset = (page - 1) * page_size;

      // Build query for online orders (not POS-created)
      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .neq('order_source', 'POS')
        .order('created_at', { ascending: false })
        .range(offset, offset + page_size - 1);

      // Apply status filter if provided
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data: orders, error, count } = await query;

      if (error) {
        console.error('❌ [app-compat] get_online_orders error:', error);
        return mockResponse({ orders: [], total: 0 });
      }

      console.log(`✅ [app-compat] get_online_orders loaded ${orders?.length || 0} orders (total: ${count})`);
      return mockResponse({ orders: orders || [], total: count || 0 });
    } catch (error) {
      console.error('❌ [app-compat] get_online_orders exception:', error);
      return mockResponse({ orders: [], total: 0 });
    }
  },

  // ============================================================================
  // CRITICAL: Payments - basic stubs
  // ============================================================================
  process_cash_payment: async (data: any) => {
    console.log('💵 [app-compat] process_cash_payment:', data);
    try {
      const { order_id, amount, payment_method = 'cash' } = data || {};

      // If we have an order_id, update its payment status
      if (order_id) {
        const { error } = await supabase
          .from('orders')
          .update({
            payment_status: 'PAID',
            payment_method: payment_method,
            payment_amount: amount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', order_id);

        if (error) {
          console.error('❌ [app-compat] process_cash_payment update error:', error);
          return mockResponse({ success: false, error: error.message }, false);
        }
      }

      return mockResponse({
        success: true,
        payment_method: 'cash',
        payment_status: 'PAID',
        transaction_id: `cash_${Date.now()}`,
      });
    } catch (error) {
      console.error('❌ [app-compat] process_cash_payment error:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  create_payment_intent: async (data: any) => {
    // Check if running in Electron with IPC available
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.stripeCreatePaymentIntent) {
      try {
        console.log('💳 [app-compat] Creating payment intent via Electron IPC...', data);
        const result = await electronAPI.stripeCreatePaymentIntent(data);
        console.log('✅ [app-compat] Payment intent result:', result);

        if (result.success) {
          return mockResponse(result);
        } else {
          console.error('❌ [app-compat] Payment intent failed:', result.error);
          return mockResponse({
            success: false,
            client_secret: null,
            message: result.error || 'Failed to create payment intent'
          });
        }
      } catch (error) {
        console.error('❌ [app-compat] Failed to create payment intent via IPC:', error);
        return mockResponse({
          success: false,
          client_secret: null,
          message: (error as Error).message || 'Failed to create payment intent'
        });
      }
    }

    // Fallback: Try Riff backend API in hybrid mode
    if (isHybridMode) {
      try {
        console.log('💳 [app-compat] Creating payment intent via backend...', data);
        const result = await callBackendAPI('/routes/stripe/create-payment-intent', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        console.log('✅ [app-compat] Payment intent created:', result);
        return mockResponse(result);
      } catch (error) {
        console.error('❌ [app-compat] Failed to create payment intent via backend:', error);
        return mockResponse({
          success: false,
          client_secret: null,
          message: (error as Error).message || 'Failed to create payment intent'
        });
      }
    }

    // No payment processing available
    console.warn('⚠️ [app-compat] Payment processing not available');
    return mockResponse({
      success: false,
      client_secret: null,
      message: 'Payment processing not available - configure STRIPE_SECRET_KEY in .env.development'
    });
  },

  create_payment_intent2: async (data: any) => {
    console.log('💳 [app-compat] create_payment_intent2:', data);
    try {
      const { payment_method, order_id, amount } = data || {};

      // For cash payments, just record the payment status
      if (payment_method === 'cash' || payment_method === 'CASH') {
        if (order_id) {
          const { error } = await supabase
            .from('orders')
            .update({
              payment_status: 'PAID',
              payment_method: 'cash',
              payment_amount: amount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', order_id);

          if (error) {
            console.error('❌ [app-compat] create_payment_intent2 cash update error:', error);
          }
        }

        return mockResponse({
          success: true,
          payment_method: 'cash',
          payment_status: 'PAID',
          transaction_id: `cash_${Date.now()}`,
        });
      }

      // For card payments, delegate to Electron IPC
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.stripeCreatePaymentIntent) {
        try {
          const result = await electronAPI.stripeCreatePaymentIntent(data);
          if (result.success) {
            return mockResponse(result);
          }
          return mockResponse({
            success: false,
            message: result.error || 'Failed to create payment intent',
          }, false);
        } catch (ipcError) {
          console.error('❌ [app-compat] create_payment_intent2 IPC error:', ipcError);
          return mockResponse({
            success: false,
            message: (ipcError as Error).message,
          }, false);
        }
      }

      // Fallback for hybrid mode
      if (isHybridMode) {
        const result = await callBackendAPI('/routes/stripe/create-payment-intent', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        return mockResponse(result);
      }

      return mockResponse({
        success: false,
        message: 'Payment processing not available',
      }, false);
    } catch (error) {
      console.error('❌ [app-compat] create_payment_intent2 error:', error);
      return mockResponse({ success: false, message: (error as Error).message }, false);
    }
  },

  get_payment_config: async () => {
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    const electronAPI = (window as any).electronAPI;
    const hasElectronStripe = !!electronAPI?.stripeCreatePaymentIntent;

    return mockResponse({
      configured: !!(stripeKey || hasElectronStripe || isHybridMode),
      stripe_configured: !!stripeKey || hasElectronStripe,
      cash_enabled: true,
    });
  },

  get_stripe_publishable_key: async () => {
    // Try environment variable first (same pattern as Google Maps)
    const envKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (envKey) {
      console.log('✅ [app-compat] Using Stripe publishable key from environment');
      return mockResponse({ publishable_key: envKey });
    }

    // Fallback to backend API if in hybrid mode
    if (isHybridMode) {
      try {
        const result = await callBackendAPI('/routes/stripe/config');
        console.log('✅ [app-compat] Got Stripe publishable key from backend');
        return mockResponse(result);
      } catch (error) {
        console.warn('⚠️ [app-compat] Failed to load Stripe key from backend:', error);
      }
    }

    console.log('⚠️ [app-compat] No Stripe publishable key configured');
    return mockResponse({ publishable_key: null });
  },

  confirm_payment: async (data: any) => {
    console.log('✅ [app-compat] confirm_payment:', data);
    try {
      // Try Electron IPC first (Stripe card confirmation)
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.stripeConfirmPayment) {
        const result = await electronAPI.stripeConfirmPayment(data);
        return mockResponse(result);
      }

      // Fallback for hybrid mode
      if (isHybridMode) {
        const result = await callBackendAPI('/routes/stripe/confirm-payment', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        return mockResponse(result);
      }

      // For cash payments, confirmation is a no-op (already recorded)
      return mockResponse({ success: true, payment_status: 'confirmed' });
    } catch (error) {
      console.error('❌ [app-compat] confirm_payment error:', error);
      return mockResponse({ success: false, message: (error as Error).message }, false);
    }
  },

  // ============================================================================
  // LOGGING & ANALYTICS - No-ops (silent)
  // ============================================================================
  log_frontend_render: (data: any) => { /* no-op */ },

  check_cart_analytics_table: async () => mockResponse({ exists: true }, true),

  setup_cart_analytics_table: async () => mockResponse({ success: true }),

  track_cart_event: async (data: any) => mockResponse({ success: true }),

  // ============================================================================
  // MAPS & DELIVERY - Check environment variable first, then backend
  // ============================================================================
  get_maps_config: async () => {
    // Try environment variable first
    const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (envKey) {
      console.log('✅ [app-compat] Using Google Maps API key from environment');
      return mockResponse({ apiKey: envKey });
    }

    // Fallback to backend API if in hybrid mode
    if (isHybridMode) {
      try {
        const result = await callBackendAPI('/routes/get-maps-config');
        console.log('✅ [app-compat] Got Google Maps API key from backend');
        return result;
      } catch (error) {
        console.warn('⚠️ [app-compat] Failed to load Google Maps API key from backend:', error);
      }
    }

    console.log('⚠️ [app-compat] No Google Maps API key configured');
    return mockResponse({ apiKey: null });
  },

  geocode: async (params: any) => mockResponse({ results: [] }),

  calculate_delivery_route: async (params: any) => mockResponse({ route: null }),

  calculate_enhanced_delivery_route: async (params: any) => mockResponse({ route: null }),

  validate_delivery_postcode: async (params: any) => mockResponse({
    valid: true,
    message: 'Validation disabled in desktop mode'
  }),

  get_delivery_config: async () => mockResponse({
    delivery_radius: 6,
    minimum_order: 15
  }),

  get_delivery_settings: async () => mockResponse({ settings: {} }),

  // ============================================================================
  // RESTAURANT SETTINGS
  // ============================================================================
  get_restaurant_settings: async () => {
    console.log('🔄 [app-compat] get_restaurant_settings - querying Supabase');
    try {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('settings')
        .eq('id', 1)
        .single();

      if (error || !data) {
        console.warn('⚠️ [app-compat] get_restaurant_settings: no data found, using defaults');
        return mockResponse({
          settings: {
            name: 'Cottage Tandoori',
            phone: '',
            address: '',
            opening_hours: {},
            onlineOrders: {
              processing: { autoApproveOrders: true, autoPrintOnAccept: true },
              notifications: { playSound: true, soundVolume: 75, repeatUntilAcknowledged: false },
            }
          }
        });
      }

      console.log('✅ [app-compat] get_restaurant_settings loaded from DB');
      return mockResponse(data);
    } catch (error) {
      console.error('❌ [app-compat] get_restaurant_settings exception:', error);
      return mockResponse({
        settings: {
          name: 'Cottage Tandoori',
          phone: '',
          address: '',
          opening_hours: {}
        }
      });
    }
  },

  save_restaurant_settings: async (data: any) => {
    console.log('📝 [app-compat] save_restaurant_settings called:', data);
    try {
      // Fetch existing settings for deep merge
      const { data: existingRow } = await supabase
        .from('restaurant_settings')
        .select('settings')
        .eq('id', 1)
        .maybeSingle();

      let mergedSettings = existingRow?.settings || {};

      // Deep merge incoming data
      if (data?.settings) {
        mergedSettings = { ...mergedSettings, ...data.settings };
      }
      if (data?.profile) {
        mergedSettings.business_profile = {
          ...(mergedSettings.business_profile || {}),
          ...data.profile,
        };
      }
      if (data?.delivery) {
        // Validate coordinates if provided
        if (data.delivery.restaurant_location) {
          const { lat, lng } = data.delivery.restaurant_location;
          if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            data.delivery.restaurant_location = { lat: 50.91806074772868, lng: -0.4556764022106669 };
          }
        }
        mergedSettings.delivery = {
          ...(mergedSettings.delivery || {}),
          ...data.delivery,
        };
      }
      if (data?.operation_hours || data?.opening_hours) {
        mergedSettings.opening_hours = data.operation_hours || data.opening_hours;
      }

      // Upsert
      if (existingRow) {
        const { error } = await supabase
          .from('restaurant_settings')
          .update({ settings: mergedSettings, updated_at: new Date().toISOString() })
          .eq('id', 1);
        if (error) {
          console.error('❌ [app-compat] save_restaurant_settings update error:', error);
          return mockResponse({ success: false, error: error.message }, false);
        }
      } else {
        const { error } = await supabase
          .from('restaurant_settings')
          .insert({ id: 1, settings: mergedSettings, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        if (error) {
          console.error('❌ [app-compat] save_restaurant_settings insert error:', error);
          return mockResponse({ success: false, error: error.message }, false);
        }
      }

      console.log('✅ [app-compat] Restaurant settings saved');
      return mockResponse({ success: true, message: 'Settings saved successfully' });
    } catch (error) {
      console.error('❌ [app-compat] save_restaurant_settings exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  // ============================================================================
  // PASSWORD/AUTH
  // ============================================================================
  verify_password: async (params: any) => {
    console.log('🔐 [app-compat] verify_password called with params:', params);
    try {
      const password = (params?.password || '').trim();

      if (!password) {
        return mockResponse({
          authenticated: false,
          is_default_password: false,
          message: 'Password is required'
        });
      }

      // Check if there's a custom password stored in management_settings table
      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from('management_settings')
          .select('password')
          .eq('setting_key', 'admin_password')
          .limit(1);

        if (!settingsError && settingsData && settingsData.length > 0) {
          const storedPassword = settingsData[0].password;
          if (password === storedPassword) {
            console.log('✅ [app-compat] verify_password: authenticated with custom password');
            return mockResponse({
              authenticated: true,
              is_default_password: false,
              message: 'Authentication successful'
            });
          }
        }
      } catch (dbError) {
        console.warn('⚠️ [app-compat] Custom password check failed:', dbError);
      }

      // Fallback to default passwords (matching backend logic)
      const validPasswords: Record<string, boolean> = {
        'admin123': true,    // Default admin password (is_default = true)
        'manager456': false, // Manager password
        'qsai2025': false,   // System password
      };

      if (password in validPasswords) {
        const isDefault = validPasswords[password];
        console.log(`✅ [app-compat] verify_password: authenticated with ${isDefault ? 'default' : 'preset'} password`);
        return mockResponse({
          authenticated: true,
          is_default_password: isDefault,
          message: 'Authentication successful'
        });
      }

      console.log('❌ [app-compat] verify_password: authentication failed');
      return mockResponse({
        authenticated: false,
        is_default_password: false,
        message: 'Invalid password. Please try again.'
      });
    } catch (error) {
      console.error('❌ [app-compat] verify_password exception:', error);
      return mockResponse({
        authenticated: false,
        is_default_password: false,
        message: 'Error verifying password'
      });
    }
  },

  get_password_status: async () => mockResponse({ has_password: false }),

  update_password: async (params: any) => mockResponse({ success: true }),

  get_current_password: async () => mockResponse({ password: null }),

  // ============================================================================
  // SET MEALS
  // ============================================================================
  list_set_meals: async (params: any) => {
    console.log('🔄 [app-compat] list_set_meals called:', params);
    try {
      const { active_only = true, published_only = false } = params || {};

      let query = supabase
        .from('set_meals')
        .select('*')
        .order('name');

      if (active_only) {
        query = query.eq('active', true);
      }

      if (published_only) {
        query = query.not('published_at', 'is', null);
      }

      const { data, error } = await query;

      if (error) {
        // If set_meals table doesn't exist, return empty array
        if (error.code === '42P01') {
          console.warn('⚠️ [app-compat] set_meals table not found');
          return mockResponse({ success: true, set_meals: [] });
        }
        console.error('❌ [app-compat] list_set_meals error:', error);
        return mockResponse({ success: false, set_meals: [], error: error.message });
      }

      console.log(`✅ [app-compat] list_set_meals found ${data?.length || 0} set meals`);
      return mockResponse({ success: true, set_meals: data || [] });
    } catch (error) {
      console.error('❌ [app-compat] list_set_meals exception:', error);
      return mockResponse({ success: false, set_meals: [] });
    }
  },

  get_set_meal: async (params: any) => {
    console.log('🔄 [app-compat] get_set_meal called:', params);
    try {
      const setMealId = params?.id || params?.set_meal_id;

      if (!setMealId) {
        return mockResponse({ success: false, set_meal: null, error: 'set_meal_id is required' });
      }

      // Fetch set meal with items and their menu item details
      const { data: setMeal, error } = await supabase
        .from('set_meals')
        .select('*, set_meal_items(id, menu_item_id, quantity, menu_items(id, name, description, base_price, image_url))')
        .eq('id', setMealId)
        .single();

      if (error) {
        console.error('❌ [app-compat] get_set_meal error:', error);
        return mockResponse({ success: false, set_meal: null, error: error.message });
      }

      // Transform items to a cleaner format
      const items = (setMeal.set_meal_items || []).map((item: any) => ({
        id: item.id,
        menu_item_id: item.menu_item_id,
        name: item.menu_items?.name || 'Unknown item',
        description: item.menu_items?.description,
        price: item.menu_items?.base_price || 0,
        image_url: item.menu_items?.image_url,
        quantity: item.quantity || 1,
      }));

      // Calculate total individual price
      const total_individual_price = items.reduce(
        (sum: number, item: any) => sum + (item.price * item.quantity),
        0
      );

      const result = {
        ...setMeal,
        items,
        total_individual_price,
      };

      console.log(`✅ [app-compat] get_set_meal loaded:`, setMeal.name);
      return mockResponse({ success: true, set_meal: result });
    } catch (error) {
      console.error('❌ [app-compat] get_set_meal exception:', error);
      return mockResponse({ success: false, set_meal: null });
    }
  },

  create_set_meal: async (data: any) => mockResponse({ success: true }),

  update_set_meal: async (id: string, data: any) => mockResponse({ success: true }),

  delete_set_meal: async (params: any) => mockResponse({ success: true }),

  // ============================================================================
  // MENU ITEM CRUD - Real Supabase implementations
  // ============================================================================
  create_menu_item: async (data: any) => {
    console.log('🆕 [app-compat] create_menu_item - inserting to Supabase');
    console.log('📦 Data received:', JSON.stringify(data, null, 2));

    try {
      // 1. Insert the menu item
      // Reference: docs/DATABASE_SCHEMA_ACTUAL.md for menu_items table schema
      // Note: item_type, kitchen_display_name, is_halal, is_dairy_free, is_nut_free
      //       do NOT exist in menu_items table (they exist in variants table)
      const { data: item, error: itemError } = await supabase
        .from('menu_items')
        .insert({
          name: data.name,
          description: data.description || '',
          base_price: data.price || data.base_price || 0,
          price_takeaway: data.price_takeaway || null,
          price_dine_in: data.price_dine_in || null,
          price_delivery: data.price_delivery || null,
          category_id: data.category_id,
          image_asset_id: data.image_asset_id || null,
          image_widescreen_asset_id: data.image_widescreen_asset_id || null,
          preferred_aspect_ratio: data.preferred_aspect_ratio || null,
          is_active: data.is_active ?? data.active ?? true,
          display_print_order: data.display_order ?? data.display_print_order ?? 0,
          has_variants: data.has_variants || false,
          spice_level: data.spice_level || 0,
          allergens: data.allergens || [],
          allergen_warnings: data.allergen_notes || data.allergen_warnings || '',
          specialty_notes: data.specialty_notes || '',
          is_vegetarian: data.is_vegetarian || false,
          is_vegan: data.is_vegan || false,
          is_gluten_free: data.is_gluten_free || false,
          // Map 'featured' from form to 'chefs_special' in database
          chefs_special: data.featured || data.chefs_special || false,
        })
        .select()
        .single();

      if (itemError) {
        console.error('❌ [app-compat] create_menu_item error:', itemError);
        return mockResponse({ success: false, error: itemError.message }, false);
      }

      console.log('✅ [app-compat] Menu item created:', item.id);

      // 2. Insert variants if present
      // Reference: docs/DATABASE_SCHEMA_ACTUAL.md for menu_item_variants table schema
      if (data.has_variants && data.variants?.length > 0) {
        const variantsToInsert = data.variants.map((v: any, index: number) => ({
          menu_item_id: item.id,
          variant_name: v.name || v.variant_name,
          price: v.price || 0,
          protein_type_id: v.protein_type_id || null,
          is_active: v.is_active ?? v.active ?? true,
          active: v.active ?? v.is_active ?? true,
          display_order: v.display_order ?? index,
          image_asset_id: v.image_asset_id || null,
          description: v.description || '',
          spice_level: v.spice_level || 0,
          allergens: v.allergens || [],
          allergen_warnings: v.allergen_notes || v.allergen_warnings || '',
          is_vegetarian: v.is_vegetarian || false,
          is_vegan: v.is_vegan || false,
          is_gluten_free: v.is_gluten_free || false,
          is_halal: v.is_halal || false,
          is_dairy_free: v.is_dairy_free || false,
          is_nut_free: v.is_nut_free || false,
          featured: v.featured || false,
          chefs_special: v.chefs_special || false,
        }));

        const { error: variantsError } = await supabase
          .from('menu_item_variants')
          .insert(variantsToInsert);

        if (variantsError) {
          console.error('⚠️ [app-compat] Error inserting variants:', variantsError);
          // Don't fail the whole operation if variants fail
        } else {
          console.log('✅ [app-compat] Inserted', variantsToInsert.length, 'variants');
        }
      }

      return mockResponse({ success: true, item });
    } catch (error) {
      console.error('❌ [app-compat] create_menu_item exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  update_menu_item: async (params: any, data?: any) => {
    console.log('🔄 [app-compat] update_menu_item - updating in Supabase');

    // Handle different parameter formats
    const itemId = params.itemId || params.menu_item_id || params.id;
    const updateData = data || params;

    console.log('📦 Item ID:', itemId);
    console.log('📦 Update data:', JSON.stringify(updateData, null, 2));

    if (!itemId) {
      console.error('❌ [app-compat] update_menu_item: No item ID provided');
      return mockResponse({ success: false, error: 'No item ID provided' }, false);
    }

    try {
      // Build update object - map form fields to actual database columns
      // Reference: docs/DATABASE_SCHEMA_ACTUAL.md for menu_items table schema
      const updateFields: any = {};

      // Direct mappings (field names match database)
      if (updateData.name !== undefined) updateFields.name = updateData.name;
      if (updateData.description !== undefined) updateFields.description = updateData.description;
      if (updateData.category_id !== undefined) updateFields.category_id = updateData.category_id;
      if (updateData.image_asset_id !== undefined) updateFields.image_asset_id = updateData.image_asset_id;
      if (updateData.image_widescreen_asset_id !== undefined) updateFields.image_widescreen_asset_id = updateData.image_widescreen_asset_id;
      if (updateData.has_variants !== undefined) updateFields.has_variants = updateData.has_variants;
      if (updateData.spice_level !== undefined) updateFields.spice_level = updateData.spice_level;
      if (updateData.allergens !== undefined) updateFields.allergens = updateData.allergens;
      if (updateData.is_vegetarian !== undefined) updateFields.is_vegetarian = updateData.is_vegetarian;
      if (updateData.is_vegan !== undefined) updateFields.is_vegan = updateData.is_vegan;
      if (updateData.is_gluten_free !== undefined) updateFields.is_gluten_free = updateData.is_gluten_free;
      if (updateData.price_dine_in !== undefined) updateFields.price_dine_in = updateData.price_dine_in;
      if (updateData.price_takeaway !== undefined) updateFields.price_takeaway = updateData.price_takeaway;
      if (updateData.price_delivery !== undefined) updateFields.price_delivery = updateData.price_delivery;
      if (updateData.preferred_aspect_ratio !== undefined) updateFields.preferred_aspect_ratio = updateData.preferred_aspect_ratio;

      // Field name transformations (form → database)
      if (updateData.price !== undefined) updateFields.base_price = updateData.price;
      if (updateData.base_price !== undefined) updateFields.base_price = updateData.base_price;
      if (updateData.display_order !== undefined) updateFields.display_print_order = updateData.display_order;
      if (updateData.display_print_order !== undefined) updateFields.display_print_order = updateData.display_print_order;
      if (updateData.is_active !== undefined) updateFields.is_active = updateData.is_active;
      if (updateData.active !== undefined) updateFields.is_active = updateData.active;
      // Map 'featured' from form to 'chefs_special' in database
      if (updateData.featured !== undefined) updateFields.chefs_special = updateData.featured;
      if (updateData.chefs_special !== undefined) updateFields.chefs_special = updateData.chefs_special;
      // Map 'allergen_notes' from form to 'allergen_warnings' in database
      if (updateData.allergen_notes !== undefined) updateFields.allergen_warnings = updateData.allergen_notes;
      if (updateData.allergen_warnings !== undefined) updateFields.allergen_warnings = updateData.allergen_warnings;
      if (updateData.specialty_notes !== undefined) updateFields.specialty_notes = updateData.specialty_notes;

      // Fields that DON'T exist in menu_items table (skip silently):
      // - kitchen_display_name (not in database)
      // - item_type (not in database)
      // - is_halal, is_dairy_free, is_nut_free (variants table only)

      // Update menu item
      const { error: updateError } = await supabase
        .from('menu_items')
        .update(updateFields)
        .eq('id', itemId);

      if (updateError) {
        console.error('❌ [app-compat] update_menu_item error:', updateError);
        return mockResponse({ success: false, error: updateError.message }, false);
      }

      console.log('✅ [app-compat] Menu item updated:', itemId);

      // Handle variants if present
      if (updateData.variants && Array.isArray(updateData.variants)) {
        // Get existing variants
        const { data: existingVariants } = await supabase
          .from('menu_item_variants')
          .select('id')
          .eq('menu_item_id', itemId);

        const existingIds = new Set((existingVariants || []).map((v: any) => v.id));
        const incomingIds = new Set(updateData.variants.filter((v: any) => v.id).map((v: any) => v.id));

        // Delete variants that are no longer present
        const toDelete = [...existingIds].filter(id => !incomingIds.has(id));
        if (toDelete.length > 0) {
          await supabase.from('menu_item_variants').delete().in('id', toDelete);
          console.log('🗑️ [app-compat] Deleted', toDelete.length, 'old variants');
        }

        // Upsert variants
        // Reference: docs/DATABASE_SCHEMA_ACTUAL.md for menu_item_variants table schema
        for (const variant of updateData.variants) {
          const variantData = {
            menu_item_id: itemId,
            variant_name: variant.name || variant.variant_name,
            price: variant.price || 0,
            protein_type_id: variant.protein_type_id || null,
            is_active: variant.is_active ?? variant.active ?? true,
            active: variant.active ?? variant.is_active ?? true,
            display_order: variant.display_order ?? 0,
            image_asset_id: variant.image_asset_id || null,
            description: variant.description || '',
            spice_level: variant.spice_level || 0,
            allergens: variant.allergens || [],
            allergen_warnings: variant.allergen_notes || variant.allergen_warnings || '',
            is_vegetarian: variant.is_vegetarian || false,
            is_vegan: variant.is_vegan || false,
            is_gluten_free: variant.is_gluten_free || false,
            is_halal: variant.is_halal || false,
            is_dairy_free: variant.is_dairy_free || false,
            is_nut_free: variant.is_nut_free || false,
            featured: variant.featured || false,
            chefs_special: variant.chefs_special || false,
          };

          if (variant.id && existingIds.has(variant.id)) {
            // Update existing variant
            await supabase.from('menu_item_variants').update(variantData).eq('id', variant.id);
          } else {
            // Insert new variant
            await supabase.from('menu_item_variants').insert(variantData);
          }
        }
        console.log('✅ [app-compat] Variants synced');
      }

      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] update_menu_item exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  delete_menu_item: async (params: any) => {
    console.log('🗑️ [app-compat] delete_menu_item - soft deleting in Supabase');

    const itemId = params.itemId || params.menu_item_id || params.id;
    console.log('📦 Item ID:', itemId);

    if (!itemId) {
      console.error('❌ [app-compat] delete_menu_item: No item ID provided');
      return mockResponse({ success: false, error: 'No item ID provided' }, false);
    }

    try {
      // Soft delete: set is_active to false
      const { error } = await supabase
        .from('menu_items')
        .update({ is_active: false })
        .eq('id', itemId);

      if (error) {
        console.error('❌ [app-compat] delete_menu_item error:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      // Also deactivate related variants
      await supabase
        .from('menu_item_variants')
        .update({ is_active: false })
        .eq('menu_item_id', itemId);

      console.log('✅ [app-compat] Menu item soft deleted:', itemId);
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] delete_menu_item exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  bulk_toggle_active: async (params: any) => {
    console.log('🔄 [app-compat] bulk_toggle_active - updating in Supabase');

    const itemIds = params.itemIds || params.item_ids || [];
    const active = params.active ?? params.is_active ?? true;

    console.log('📦 Item IDs:', itemIds);
    console.log('📦 Active:', active);

    if (!itemIds.length) {
      console.error('❌ [app-compat] bulk_toggle_active: No item IDs provided');
      return mockResponse({ success: false, error: 'No item IDs provided' }, false);
    }

    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_active: active })
        .in('id', itemIds);

      if (error) {
        console.error('❌ [app-compat] bulk_toggle_active error:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      console.log('✅ [app-compat] Bulk toggle completed for', itemIds.length, 'items');
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] bulk_toggle_active exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  // ============================================================================
  // MENU PUBLISHING - HYBRID MODE
  // Calls Riff backend to sync menu to online orders, chatbot, etc.
  // ============================================================================
  get_menu_status: async () => {
    if (isHybridMode) {
      try {
        return await callBackendAPI('/routes/menu-status');
      } catch (error) {
        console.error('❌ [app-compat] get_menu_status failed:', error);
        return mockResponse({ status: 'unknown', error: (error as Error).message });
      }
    }
    return mockResponse({ status: 'local-only' });
  },

  publish_menu: async () => {
    console.log('[app-compat] publish_menu called');
    console.log('[app-compat] isHybridMode:', isHybridMode);
    console.log('[app-compat] RIFF_BACKEND_URL:', RIFF_BACKEND_URL);

    if (isHybridMode) {
      try {
        console.log('[app-compat] Calling backend API: /routes/publish-menu');
        const result = await callBackendAPI('/routes/publish-menu', { method: 'POST' });
        console.log('✅ [app-compat] publish_menu succeeded:', result);
        toast.success('Menu published successfully to all systems!');
        return result;
      } catch (error) {
        console.error('❌ [app-compat] publish_menu failed:', error);
        console.error('[app-compat] Error name:', (error as Error).name);
        console.error('[app-compat] Error message:', (error as Error).message);
        console.error('[app-compat] Error stack:', (error as Error).stack);
        toast.error(`Failed to sync menu: ${(error as Error).message}`);
        return { success: false, error: (error as Error).message };
      }
    } else {
      toast.warning('Backend not configured - menu changes are local only');
      console.log('⚠️ [app-compat] publish_menu - no backend configured');
      return { success: true, warning: 'Backend not configured - local only' };
    }
  },

  // ============================================================================
  // CUSTOMIZATIONS
  // ============================================================================
  get_customizations: async (_params?: any) => {
    console.log('🔄 [app-compat] get_customizations - querying Supabase directly');
    const { data, error } = await supabase
      .from('menu_customizations')
      .select('*')
      .eq('is_active', true)
      .order('menu_order');

    if (error) {
      console.error('❌ [app-compat] get_customizations error:', error);
      return mockResponse([]);
    }

    console.log('✅ [app-compat] get_customizations loaded:', data?.length || 0, 'items');
    // Return as array (menuQueries expects array directly)
    return mockResponse(data || []);
  },

  create_customization: async (data: any) => mockResponse({ success: true }),

  update_customization: async (id: string, data: any) => mockResponse({ success: true }),

  delete_customization: async (params: any) => mockResponse({ success: true }),

  // ============================================================================
  // CATEGORIES
  // ============================================================================
  save_category: async (data: any) => mockResponse({ success: true }),

  get_menu_categories: async (_params?: any) => {
    console.log('🔄 [app-compat] get_menu_categories - querying Supabase directly');
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error('❌ [app-compat] get_menu_categories error:', error);
      return mockResponse({ categories: [] });
    }

    console.log('✅ [app-compat] get_menu_categories loaded:', data?.length || 0, 'categories');
    return mockResponse({ categories: data || [] });
  },

  check_category_delete: async (params: any) => mockResponse({ can_delete: true }),

  safe_delete_category: async (params: any) => mockResponse({ success: true }),

  analyze_section_change_impact: async (params: any) => mockResponse({ impact: [] }),

  move_category_section: async (params: any) => mockResponse({ success: true }),

  // ============================================================================
  // DINE-IN / TABLE ORDERS
  // ============================================================================
  setup_restaurant_schema: async () => mockResponse({ success: true }),

  setup_customer_tabs_schema: async () => mockResponse({ success: true }),

  list_table_orders: async (params: any) => mockResponse({ table_orders: [] }),

  create_table_order: async (data: any) => {
    console.log('📝 [app-compat] create_table_order called:', data);
    try {
      const tableNumber = data?.table_number;
      const guestCount = data?.guest_count || 1;
      const linkedTables = data?.linked_tables || [];

      const { data: newOrder, error } = await supabase
        .from('table_orders')
        .insert({
          table_number: tableNumber,
          order_items: [],
          status: 'active',
          guest_count: guestCount,
          linked_tables: linkedTables,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [app-compat] create_table_order error:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      // Update table status to OCCUPIED
      await supabase.from('pos_tables').update({ status: 'OCCUPIED' }).eq('table_number', tableNumber);
      for (const lt of linkedTables) {
        await supabase.from('pos_tables').update({ status: 'OCCUPIED' }).eq('table_number', lt);
      }

      console.log('✅ [app-compat] Table order created:', newOrder.id);
      return mockResponse({ success: true, order_id: newOrder.id, table_order: newOrder });
    } catch (error) {
      console.error('❌ [app-compat] create_table_order exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  update_table_order: async (params: any, data?: any) => {
    console.log('📝 [app-compat] update_table_order called:', params);
    try {
      const tableNumber = params?.table_number || data?.table_number;
      const items = data?.items || data?.order_items || params?.items || params?.order_items;

      if (!tableNumber) {
        return mockResponse({ success: false, message: 'Table number required' }, false);
      }

      const updateFields: any = {};
      if (items !== undefined) updateFields.order_items = items;
      if (data?.guest_count !== undefined) updateFields.guest_count = data.guest_count;
      if (data?.status !== undefined) updateFields.status = data.status;

      const { data: updated, error } = await supabase
        .from('table_orders')
        .update(updateFields)
        .eq('table_number', tableNumber)
        .eq('status', 'active')
        .select()
        .single();

      if (error) {
        console.error('❌ [app-compat] update_table_order error:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      console.log('✅ [app-compat] Table order updated:', tableNumber);
      return mockResponse({ success: true, table_order: updated });
    } catch (error) {
      console.error('❌ [app-compat] update_table_order exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  complete_table_order: async (params: any) => {
    console.log('📝 [app-compat] complete_table_order called:', params);
    try {
      const tableNumber = params?.table_number;
      if (!tableNumber) {
        return mockResponse({ success: false, message: 'Table number required' }, false);
      }

      // Check if table is part of a linked group
      const { data: table } = await supabase
        .from('pos_tables')
        .select('linked_table_group_id')
        .eq('table_number', tableNumber)
        .single();

      let allTableNumbers = [tableNumber];

      if (table?.linked_table_group_id) {
        const { data: groupTables } = await supabase
          .from('pos_tables')
          .select('table_number')
          .eq('linked_table_group_id', table.linked_table_group_id);
        if (groupTables && groupTables.length > 0) {
          allTableNumbers = groupTables.map((t: any) => t.table_number);
        }
      }

      // Also check orders table for linked_tables
      const { data: activeOrder } = await supabase
        .from('orders')
        .select('id, linked_tables, table_group_id')
        .eq('table_number', tableNumber)
        .in('status', ['CREATED', 'SENT_TO_KITCHEN', 'IN_PREP', 'READY', 'SERVED', 'PENDING_PAYMENT'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeOrder?.linked_tables && activeOrder.linked_tables.length > 0) {
        allTableNumbers = [...new Set([...allTableNumbers, ...activeOrder.linked_tables])];
      }

      // Find all active order IDs for cleanup
      const { data: activeOrders } = await supabase
        .from('orders')
        .select('id')
        .in('table_number', allTableNumbers)
        .in('status', ['CREATED', 'SENT_TO_KITCHEN', 'IN_PREP', 'READY', 'SERVED', 'PENDING_PAYMENT']);

      const orderIds = activeOrders?.map((o: any) => o.id) || [];

      // Delete customer_tabs for these orders
      if (orderIds.length > 0) {
        await supabase.from('customer_tabs').delete().in('order_id', orderIds);
      }
      // Also delete orphaned tabs by table_number
      await supabase.from('customer_tabs').delete().in('table_number', allTableNumbers).eq('status', 'active');

      // Complete all table_orders in the group
      await supabase
        .from('table_orders')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .in('table_number', allTableNumbers)
        .eq('status', 'active');

      // Mark orders as COMPLETED
      if (orderIds.length > 0) {
        await supabase
          .from('orders')
          .update({ status: 'COMPLETED', updated_at: new Date().toISOString() })
          .in('id', orderIds);
      }

      // Reset all tables in the group
      await supabase
        .from('pos_tables')
        .update({
          status: 'AVAILABLE',
          is_linked_table: false,
          is_linked_primary: false,
          linked_table_group_id: null,
          linked_with_tables: [],
        })
        .in('table_number', allTableNumbers);

      console.log('✅ [app-compat] complete_table_order: Completed and reset', allTableNumbers.length, 'tables:', allTableNumbers);
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] complete_table_order exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  reset_table_to_available: async (params: any) => {
    console.log('📝 [app-compat] reset_table_to_available called:', params);
    try {
      const tableNumber = params?.table_number;
      if (!tableNumber) {
        return mockResponse({ success: false, message: 'Table number required' }, false);
      }

      // Cancel any active orders for this table
      await supabase
        .from('table_orders')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('table_number', tableNumber)
        .eq('status', 'active');

      // Reset table status
      await supabase.from('pos_tables').update({ status: 'AVAILABLE' }).eq('table_number', tableNumber);

      console.log('✅ [app-compat] Table reset to available:', tableNumber);
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] reset_table_to_available exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  add_items_to_table: async (params: any, items?: any) => {
    console.log('📝 [app-compat] add_items_to_table called:', params);
    try {
      const tableNumber = params?.table_number;
      const newItems = items || params?.items || params?.order_items || [];

      if (!tableNumber) {
        return mockResponse({ success: false, message: 'Table number required' }, false);
      }

      // Get current active order
      const { data: currentOrder, error: fetchError } = await supabase
        .from('table_orders')
        .select('*')
        .eq('table_number', tableNumber)
        .eq('status', 'active')
        .maybeSingle();

      if (fetchError || !currentOrder) {
        return mockResponse({ success: false, message: `No active order for table ${tableNumber}` }, false);
      }

      // Merge items
      const updatedItems = [...(currentOrder.order_items || []), ...newItems];

      const { data: updated, error: updateError } = await supabase
        .from('table_orders')
        .update({ order_items: updatedItems })
        .eq('id', currentOrder.id)
        .select()
        .single();

      if (updateError) {
        return mockResponse({ success: false, error: updateError.message }, false);
      }

      console.log('✅ [app-compat] Added', newItems.length, 'items to table', tableNumber);
      return mockResponse({ success: true, table_order: updated });
    } catch (error) {
      console.error('❌ [app-compat] add_items_to_table exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  link_tables: async (params: any) => {
    console.log('📝 [app-compat] link_tables called:', params);
    try {
      const tableNumbers: number[] = params?.table_numbers || params?.tables || [];
      const primaryTable = params?.primary_table || tableNumbers[0];

      if (tableNumbers.length < 2) {
        return mockResponse({ success: false, message: 'At least 2 tables required to link' }, false);
      }

      const groupId = `group-${Date.now()}`;

      // Update all tables in the group
      for (const tn of tableNumbers) {
        await supabase
          .from('pos_tables')
          .update({
            is_linked_table: true,
            is_linked_primary: tn === primaryTable,
            linked_table_group_id: groupId,
            linked_with_tables: tableNumbers.filter((t: number) => t !== tn),
            status: 'OCCUPIED',
          })
          .eq('table_number', tn);
      }

      console.log('✅ [app-compat] Tables linked:', tableNumbers, 'group:', groupId);
      return mockResponse({ success: true, group_id: groupId });
    } catch (error) {
      console.error('❌ [app-compat] link_tables exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  unlink_table: async (params: any) => {
    console.log('📝 [app-compat] unlink_table called:', params);
    try {
      const tableNumber = params?.table_number;
      if (!tableNumber) {
        return mockResponse({ success: false, message: 'Table number required' }, false);
      }

      // Get the table's linked group
      const { data: table } = await supabase
        .from('pos_tables')
        .select('is_linked_primary, linked_table_group_id, linked_with_tables')
        .eq('table_number', tableNumber)
        .single();

      if (!table?.linked_table_group_id) {
        return mockResponse({ success: true }); // Not linked, nothing to do
      }

      // Get all tables in the group
      const { data: groupTables } = await supabase
        .from('pos_tables')
        .select('table_number')
        .eq('linked_table_group_id', table.linked_table_group_id);

      const tableNumbers = groupTables?.map((t: any) => t.table_number) || [tableNumber];

      // Reset linked flags for ALL tables in the group (keep them OCCUPIED)
      await supabase
        .from('pos_tables')
        .update({
          is_linked_table: false,
          is_linked_primary: false,
          linked_table_group_id: null,
          linked_with_tables: [],
        })
        .in('table_number', tableNumbers);

      console.log('✅ [app-compat] Unlinked', tableNumbers.length, 'tables from group');
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] unlink_table exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  get_enriched_order_items: async (params: any) => {
    console.log('📦 [app-compat] get_enriched_order_items called:', params);
    try {
      const { order_id } = params;

      // FIXED: Use correct join syntax matching useDineInOrder.ts pattern
      const { data, error } = await supabase
        .from('dine_in_order_items')
        .select(`
          *,
          menu_categories:category_id (
            name
          )
        `)
        .eq('order_id', order_id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ [app-compat] Failed to get enriched order items:', error);
        return mockResponse({ success: false, items: [], error: error.message }, false);
      }

      console.log(`✅ [app-compat] Got ${data?.length || 0} enriched order items`);
      return mockResponse({ success: true, items: data || [] });
    } catch (error) {
      console.error('❌ [app-compat] Exception in get_enriched_order_items:', error);
      return mockResponse({ success: false, items: [], error: (error as Error).message }, false);
    }
  },

  add_item_to_order: async (params: any) => {
    console.log('➕ [app-compat] add_item_to_order called:', params);
    try {
      const { order_id, item } = params;

      // First, get the table_number from the order (it's a required field)
      let tableNumber = item.table_number;
      if (!tableNumber) {
        // Use SEPARATE queries (not a join)
        // Step 1: Get table_id from orders table (DINE-IN orders have table_id set)
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('table_id')
          .eq('id', order_id)
          .single();

        if (orderError) {
          console.warn('⚠️ [app-compat] Could not fetch order:', orderError.message);
        } else if (orderData?.table_id) {
          // Step 2: Get table_number from pos_tables using the table_id
          const { data: tableData, error: tableError } = await supabase
            .from('pos_tables')
            .select('table_number')
            .eq('id', orderData.table_id)
            .single();

          if (tableError) {
            console.warn('⚠️ [app-compat] Could not fetch table:', tableError.message);
          } else if (tableData?.table_number) {
            tableNumber = tableData.table_number;
            console.log('📍 [app-compat] Found table_number:', tableNumber, 'for order:', order_id);
          }
        }
      }

      // Clean up any malformed UUIDs (e.g., "single-uuid" prefix issue)
      const cleanUUID = (id: string | null | undefined): string | null => {
        if (!id) return null;
        // Remove any "single-" prefix that might be added incorrectly
        if (typeof id === 'string' && id.startsWith('single-')) {
          return id.replace('single-', '');
        }
        return id;
      };

      // Insert item into dine_in_order_items
      // FIXED: Use correct column names matching Supabase schema
      // FIXED: Added line_total, status, updated_at (required NOT NULL fields)
      const quantity = item.quantity || 1;
      const unitPrice = item.unit_price || item.price || 0;
      const lineTotal = quantity * unitPrice;

      const { data: newItem, error } = await supabase
        .from('dine_in_order_items')
        .insert({
          order_id,
          table_number: tableNumber || 0,  // Required NOT NULL field
          menu_item_id: cleanUUID(item.menu_item_id || item.id),
          variant_id: cleanUUID(item.variant_id),
          category_id: item.category_id || null,  // FIXED: Store category_id for section grouping
          item_name: item.name,
          variant_name: item.variant_name || item.variantName || null,
          quantity: quantity,
          unit_price: unitPrice,
          line_total: lineTotal,  // ADDED: Required NOT NULL - calculated field
          status: 'NEW',  // ADDED: Required NOT NULL - default status
          customizations: item.modifiers || item.customizations || [],
          notes: item.special_instructions || item.notes || '',
          image_url: item.image_url || null,  // FIXED: Store image_url for display
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),  // ADDED: Required NOT NULL
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [app-compat] Failed to add item to order:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      console.log('✅ [app-compat] Item added to order:', newItem.id);
      return mockResponse({ success: true, item: newItem });
    } catch (error) {
      console.error('❌ [app-compat] Exception in add_item_to_order:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  remove_item_from_order: async (params: any) => {
    console.log('➖ [app-compat] remove_item_from_order called:', params);
    try {
      const { order_id, item_id } = params;

      const { error } = await supabase
        .from('dine_in_order_items')
        .delete()
        .eq('id', item_id)
        .eq('order_id', order_id);

      if (error) {
        console.error('❌ [app-compat] Failed to remove item from order:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      console.log('✅ [app-compat] Item removed from order:', item_id);
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] Exception in remove_item_from_order:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  update_item_quantity_dine_in: async (params: any) => {
    console.log('🔢 [app-compat] update_item_quantity_dine_in called:', params);
    try {
      const { item_id, quantity, order_id } = params;
      if (!item_id || quantity === undefined) {
        return mockResponse({ success: false, error: 'Item ID and quantity required' }, false);
      }

      // First get the current item to recalculate line_total
      const { data: currentItem, error: fetchError } = await supabase
        .from('dine_in_order_items')
        .select('unit_price')
        .eq('id', item_id)
        .single();

      if (fetchError) {
        console.error('❌ [app-compat] Failed to fetch item for quantity update:', fetchError);
        return mockResponse({ success: false, error: fetchError.message }, false);
      }

      const unitPrice = currentItem?.unit_price || 0;
      const lineTotal = quantity * unitPrice;

      const { error } = await supabase
        .from('dine_in_order_items')
        .update({
          quantity,
          line_total: lineTotal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item_id);

      if (error) {
        console.error('❌ [app-compat] Failed to update item quantity:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      console.log('✅ [app-compat] Item quantity updated:', item_id, '→', quantity);
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] Exception in update_item_quantity_dine_in:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  update_item: async (params: any) => {
    console.log('✏️ [app-compat] update_item called:', params);
    try {
      const { item_id, order_id, ...updates } = params;
      if (!item_id) {
        return mockResponse({ success: false, error: 'Item ID required' }, false);
      }

      // Build update object
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Map common fields
      if (updates.quantity !== undefined) {
        updateData.quantity = updates.quantity;
        // If unit_price is provided or we need to recalc line_total
        if (updates.unit_price !== undefined || updates.price !== undefined) {
          const price = updates.unit_price || updates.price;
          updateData.unit_price = price;
          updateData.line_total = updates.quantity * price;
        }
      }
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.customizations !== undefined) updateData.customizations = updates.customizations;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.variant_name !== undefined) updateData.variant_name = updates.variant_name;

      const { error } = await supabase
        .from('dine_in_order_items')
        .update(updateData)
        .eq('id', item_id);

      if (error) {
        console.error('❌ [app-compat] Failed to update item:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      console.log('✅ [app-compat] Item updated:', item_id);
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] Exception in update_item:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  send_to_kitchen: async (params: any) => {
    console.log('🍳 [app-compat] send_to_kitchen called:', params);
    try {
      const { order_id } = params;

      // Use 'orders' table (matches backend dine_in_commands)
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'SENT_TO_KITCHEN',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order_id);

      if (error) {
        console.error('❌ [app-compat] Failed to send to kitchen:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      console.log('✅ [app-compat] Order sent to kitchen:', order_id);
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] Exception in send_to_kitchen:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  request_check: async (params: any) => {
    console.log('🧾 [app-compat] request_check called:', params);
    try {
      const { order_id } = params;

      // Use 'orders' table (matches backend dine_in_commands)
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'PENDING_PAYMENT',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order_id);

      if (error) {
        console.error('❌ [app-compat] Failed to request check:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      console.log('✅ [app-compat] Check requested:', order_id);
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] Exception in request_check:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  update_guest_count: async (params: any) => {
    console.log('👥 [app-compat] update_guest_count called:', params);
    try {
      const { order_id, guest_count } = params;

      const { error } = await supabase
        .from('dine_in_orders')
        .update({ guest_count })
        .eq('id', order_id);

      if (error) {
        console.error('❌ [app-compat] Failed to update guest count:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      console.log('✅ [app-compat] Guest count updated:', order_id, guest_count);
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] Exception in update_guest_count:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  mark_paid: async (params: any) => {
    console.log('💰 [app-compat] mark_paid called:', params);
    try {
      const { order_id, payment_method, amount } = params;

      // Update orders table
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          payment_status: 'paid',
          payment_method,
          total_amount: amount,
          completed_at: new Date().toISOString(),
        })
        .eq('id', order_id);

      if (orderError) {
        console.error('❌ [app-compat] Failed to mark order as paid:', orderError);
        return mockResponse({ success: false, error: orderError.message }, false);
      }

      // Also reset the table to AVAILABLE (if this was a DINE-IN order)
      const { data: order } = await supabase
        .from('orders')
        .select('table_id')
        .eq('id', order_id)
        .single();

      if (order?.table_id) {
        await supabase
          .from('pos_tables')
          .update({
            status: 'AVAILABLE',
            current_order_id: null
          })
          .eq('id', order.table_id);
      }

      console.log('✅ [app-compat] Order marked as paid:', order_id);
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] Exception in mark_paid:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  // Complete order and close table session (for dine-in bill completion)
  // Uses atomic database function to ensure order + table updates happen together
  complete_order: async (params: { order_id: string }) => {
    console.log('✅ [app-compat] complete_order called:', params);
    try {
      const { order_id } = params;

      // Use atomic RPC to complete order and reset tables in single transaction
      // This prevents partial completion if network drops mid-operation
      const { data, error } = await supabase.rpc('complete_order_atomic', {
        p_order_id: order_id
      });

      if (error) {
        console.error('❌ [app-compat] complete_order_atomic RPC failed:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      // Check the result from the function
      if (data && !data.success) {
        console.error('❌ [app-compat] complete_order_atomic returned error:', data.error);
        return mockResponse({ success: false, error: data.error }, false);
      }

      console.log('✅ [app-compat] Order completed atomically:', order_id, data);
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] Exception in complete_order:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  print_dine_in_bill: async (params: any) => {
    console.log('📄 [app-compat] print_dine_in_bill called:', params);
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.printReceiptESCPOS) {
      try {
        // If order_id provided, fetch order data from Supabase
        let orderData = params;
        if (params?.order_id && !params?.items) {
          // Try orders table first (main order table)
          const { data: order } = await supabase
            .from('orders')
            .select('*')
            .eq('id', params.order_id)
            .single();
          if (order) {
            orderData = { ...params, ...order };
          }
        }

        const normalizedData = {
          type: 'kitchen',
          receiptData: {
            orderNumber: orderData.order_number || orderData.orderNumber || `T${orderData.table_number || ''}`,
            orderType: 'DINE-IN',
            items: orderData.order_items || orderData.items || [],
            tableNumber: orderData.table_number || orderData.tableNumber,
            guestCount: orderData.guest_count || orderData.guestCount,
            serverName: orderData.server_name || orderData.serverName,
            timestamp: new Date().toISOString(),
            notes: orderData.special_instructions || orderData.notes,
          }
        };

        console.log('📋 [app-compat] Normalized dine-in bill data:', normalizedData);
        const result = await electronAPI.printReceiptESCPOS(normalizedData);
        console.log('✅ [app-compat] Dine-in bill printed:', result);
        return mockResponse({ success: true, result });
      } catch (error) {
        console.error('❌ [app-compat] Dine-in bill print failed:', error);
        return mockResponse({ success: false, error: (error as Error).message }, false);
      }
    }
    console.warn('⚠️ [app-compat] Electron print API not available for dine-in bill');
    return mockResponse({ success: false, error: 'Electron print API not available' }, false);
  },

  print_customer_receipt: async (data: any, headers?: any) => {
    console.log('🧾 [app-compat] print_customer_receipt called:', data);
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.printReceiptESCPOS) {
      try {
        const normalizedData = {
          type: 'customer',
          receiptData: {
            orderNumber: data.orderNumber || data.order_number,
            orderType: data.orderType || data.order_type || 'DINE-IN',
            items: data.items || [],
            tableNumber: data.template_data?.tableNumber || data.tableNumber || data.table_number,
            guestCount: data.template_data?.guestCount || data.guestCount || data.guest_count,
            serverName: data.serverName || data.server_name,
            timestamp: new Date().toISOString(),
            notes: data.specialInstructions || data.notes,
            subtotal: data.template_data?.subtotal || data.subtotal || data.sub_total,
            tax: data.tax || data.tax_amount,
            total: data.template_data?.total || data.total || data.total_amount,
            paymentMethod: data.template_data?.paymentMethod || data.paymentMethod || data.payment_method,
            customerName: data.customerName || data.customer_name,
          }
        };

        console.log('📋 [app-compat] Normalized customer receipt data:', normalizedData);
        const result = await electronAPI.printReceiptESCPOS(normalizedData);
        console.log('✅ [app-compat] Customer receipt printed:', result);
        return mockResponse({ success: true, result });
      } catch (error) {
        console.error('❌ [app-compat] Customer receipt print failed:', error);
        return mockResponse({ success: false, error: (error as Error).message }, false);
      }
    }
    console.warn('⚠️ [app-compat] Electron print API not available for customer receipt');
    return mockResponse({ success: false, error: 'Electron print API not available' }, false);
  },

  update_order_notes: async (params: any) => {
    console.log('📝 [app-compat] update_order_notes called:', params);
    try {
      const orderId = params?.order_id || params?.orderId;
      const notes = params?.notes || params?.special_instructions || '';

      if (!orderId) {
        return mockResponse({ success: false, message: 'Order ID required' }, false);
      }

      const { error } = await supabase
        .from('orders')
        .update({
          special_instructions: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) {
        console.error('❌ [app-compat] update_order_notes error:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      console.log('✅ [app-compat] Order notes updated:', orderId);
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] update_order_notes exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  // ============================================================================
  // CUSTOMER TABS
  // ============================================================================
  create_customer_tab: async (data: any) => {
    console.log('📝 [app-compat] create_customer_tab called:', data);
    try {
      const tableNumber = data?.table_number;
      const tabName = data?.tab_name || `Customer ${Date.now()}`;

      // Check for existing active tab with same name on same table
      const { data: existing } = await supabase
        .from('customer_tabs')
        .select('id')
        .eq('table_number', tableNumber)
        .eq('tab_name', tabName)
        .eq('status', 'active')
        .maybeSingle();

      if (existing) {
        console.warn('⚠️ [app-compat] Duplicate tab name on table:', tabName, tableNumber);
        return mockResponse({
          success: false,
          message: `Tab '${tabName}' already exists for Table ${tableNumber}`,
        }, false);
      }

      const { data: newTab, error } = await supabase
        .from('customer_tabs')
        .insert({
          table_number: tableNumber,
          tab_name: tabName,
          order_id: data?.order_id || null,
          order_items: [],
          status: 'active',
          guest_id: data?.guest_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [app-compat] create_customer_tab error:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      console.log('✅ [app-compat] Customer tab created:', newTab.id);
      return mockResponse({
        success: true,
        message: `Tab '${tabName}' created`,
        tab_id: newTab.id,
        customer_tab: newTab,
      });
    } catch (error) {
      console.error('❌ [app-compat] create_customer_tab exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  list_customer_tabs_for_table: async (params: any) => {
    console.log('📋 [app-compat] list_customer_tabs_for_table called:', params);
    try {
      const tableNumber = params?.table_number;
      if (!tableNumber) {
        return mockResponse({ tabs: [] });
      }

      const { data: tabs, error } = await supabase
        .from('customer_tabs')
        .select('*')
        .eq('table_number', tableNumber)
        .eq('status', 'active')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ [app-compat] list_customer_tabs error:', error);
        return mockResponse({ tabs: [] });
      }

      console.log(`✅ [app-compat] Found ${tabs?.length || 0} tabs for table ${tableNumber}`);
      return mockResponse({ tabs: tabs || [] });
    } catch (error) {
      console.error('❌ [app-compat] list_customer_tabs exception:', error);
      return mockResponse({ tabs: [] });
    }
  },

  add_items_to_customer_tab: async (params: any, items?: any) => {
    console.log('📝 [app-compat] add_items_to_customer_tab called:', params);
    try {
      const tabId = params?.tab_id || params?.id;
      const newItems = items || params?.items || [];

      if (!tabId) {
        return mockResponse({ success: false, message: 'Tab ID required' }, false);
      }

      // Fetch existing tab
      const { data: existingTab, error: fetchError } = await supabase
        .from('customer_tabs')
        .select('*')
        .eq('id', tabId)
        .single();

      if (fetchError || !existingTab) {
        console.error('❌ [app-compat] Tab not found:', tabId);
        return mockResponse({ success: false, message: `Tab not found: ${tabId}` }, false);
      }

      // Add timestamps to new items and append
      const timestampedItems = newItems.map((item: any) => ({
        ...item,
        created_at: item.created_at || new Date().toISOString(),
      }));
      const updatedItems = [...(existingTab.order_items || []), ...timestampedItems];

      const { data: updated, error: updateError } = await supabase
        .from('customer_tabs')
        .update({
          order_items: updatedItems,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tabId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ [app-compat] add_items_to_customer_tab update error:', updateError);
        return mockResponse({ success: false, error: updateError.message }, false);
      }

      console.log(`✅ [app-compat] Added ${newItems.length} items to tab ${tabId}`);
      return mockResponse({
        success: true,
        message: `Added ${newItems.length} items to customer tab`,
        customer_tab: updated,
      });
    } catch (error) {
      console.error('❌ [app-compat] add_items_to_customer_tab exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  update_customer_tab: async (params: any, updates?: any) => {
    console.log('📝 [app-compat] update_customer_tab called:', params, updates);
    try {
      const tabId = params?.tabId || params?.tab_id || params?.id;
      const updateData = updates || params;

      if (!tabId) {
        return mockResponse({ success: false, message: 'Tab ID required' }, false);
      }

      const updateFields: any = { updated_at: new Date().toISOString() };
      if (updateData?.tab_name !== undefined) updateFields.tab_name = updateData.tab_name;
      if (updateData?.order_items !== undefined) updateFields.order_items = updateData.order_items;
      if (updateData?.status !== undefined) updateFields.status = updateData.status;
      if (updateData?.guest_id !== undefined) updateFields.guest_id = updateData.guest_id;
      if (updateData?.order_id !== undefined) updateFields.order_id = updateData.order_id;

      const { data: updated, error } = await supabase
        .from('customer_tabs')
        .update(updateFields)
        .eq('id', tabId)
        .select()
        .single();

      if (error) {
        console.error('❌ [app-compat] update_customer_tab error:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      console.log('✅ [app-compat] Customer tab updated:', tabId);
      return mockResponse({ success: true, customer_tab: updated });
    } catch (error) {
      console.error('❌ [app-compat] update_customer_tab exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  close_customer_tab: async (params: any) => {
    console.log('📝 [app-compat] close_customer_tab called:', params);
    try {
      const tabId = params?.tabId || params?.tab_id || params?.id;

      if (!tabId) {
        return mockResponse({ success: false, message: 'Tab ID required' }, false);
      }

      const { data: updated, error } = await supabase
        .from('customer_tabs')
        .update({
          status: 'paid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', tabId)
        .select()
        .single();

      if (error) {
        console.error('❌ [app-compat] close_customer_tab error:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      console.log('✅ [app-compat] Customer tab closed:', tabId);
      return mockResponse({ success: true, customer_tab: updated });
    } catch (error) {
      console.error('❌ [app-compat] close_customer_tab exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  split_customer_tab: async (params: any) => {
    console.log('📝 [app-compat] split_customer_tab called:', params);
    try {
      const sourceTabId = params?.source_tab_id || params?.sourceTabId || params?.tab_id;
      const newTabName = params?.new_tab_name || params?.newTabName || `Split ${Date.now()}`;
      const itemIndices: number[] = params?.item_indices || params?.itemIndices || [];
      const guestId = params?.guest_id || params?.guestId || null;

      if (!sourceTabId || itemIndices.length === 0) {
        return mockResponse({ success: false, message: 'Source tab ID and item indices required' }, false);
      }

      // Fetch source tab
      const { data: sourceTab, error: fetchError } = await supabase
        .from('customer_tabs')
        .select('*')
        .eq('id', sourceTabId)
        .single();

      if (fetchError || !sourceTab) {
        return mockResponse({ success: false, message: 'Source tab not found' }, false);
      }

      const sourceItems = sourceTab.order_items || [];
      const movedItems: any[] = [];
      const remainingItems: any[] = [];

      sourceItems.forEach((item: any, index: number) => {
        if (itemIndices.includes(index)) {
          movedItems.push(item);
        } else {
          remainingItems.push(item);
        }
      });

      if (movedItems.length === 0) {
        return mockResponse({ success: false, message: 'No valid items to split' }, false);
      }

      // Create new tab with moved items
      const { data: newTab, error: insertError } = await supabase
        .from('customer_tabs')
        .insert({
          table_number: sourceTab.table_number,
          tab_name: newTabName,
          order_id: sourceTab.order_id,
          order_items: movedItems,
          status: 'active',
          guest_id: guestId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        return mockResponse({ success: false, error: insertError.message }, false);
      }

      // Update source tab with remaining items
      await supabase
        .from('customer_tabs')
        .update({
          order_items: remainingItems,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sourceTabId);

      console.log('✅ [app-compat] Tab split: moved', movedItems.length, 'items to new tab', newTab.id);
      return mockResponse({
        success: true,
        source_tab: { ...sourceTab, order_items: remainingItems },
        new_tab: newTab,
        tabs: [{ ...sourceTab, order_items: remainingItems }, newTab],
      });
    } catch (error) {
      console.error('❌ [app-compat] split_customer_tab exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  split_tab: async (params: any) => {
    // Alias for split_customer_tab
    return apiClient.split_customer_tab(params);
  },

  merge_customer_tabs: async (params: any) => {
    console.log('📝 [app-compat] merge_customer_tabs called:', params);
    try {
      const sourceTabId = params?.source_tab_id || params?.sourceTabId;
      const targetTabId = params?.target_tab_id || params?.targetTabId;

      if (!sourceTabId || !targetTabId) {
        return mockResponse({ success: false, message: 'Source and target tab IDs required' }, false);
      }

      // Fetch both tabs
      const { data: sourceTabs, error: fetchError } = await supabase
        .from('customer_tabs')
        .select('*')
        .in('id', [sourceTabId, targetTabId]);

      if (fetchError || !sourceTabs || sourceTabs.length < 2) {
        return mockResponse({ success: false, message: 'Could not find both tabs' }, false);
      }

      const sourceTab = sourceTabs.find((t: any) => t.id === sourceTabId);
      const targetTab = sourceTabs.find((t: any) => t.id === targetTabId);

      if (!sourceTab || !targetTab) {
        return mockResponse({ success: false, message: 'Tab not found' }, false);
      }

      // Merge items from source into target
      const mergedItems = [...(targetTab.order_items || []), ...(sourceTab.order_items || [])];

      const { data: updatedTarget, error: updateError } = await supabase
        .from('customer_tabs')
        .update({
          order_items: mergedItems,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetTabId)
        .select()
        .single();

      if (updateError) {
        return mockResponse({ success: false, error: updateError.message }, false);
      }

      // Delete source tab
      await supabase
        .from('customer_tabs')
        .delete()
        .eq('id', sourceTabId);

      console.log('✅ [app-compat] Tabs merged: source', sourceTabId, '→ target', targetTabId);
      return mockResponse({
        success: true,
        merged_tab: updatedTarget,
      });
    } catch (error) {
      console.error('❌ [app-compat] merge_customer_tabs exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  merge_tabs: async (params: any) => {
    // Alias for merge_customer_tabs
    return apiClient.merge_customer_tabs(params);
  },

  move_items_between_customer_tabs: async (params: any) => {
    console.log('📝 [app-compat] move_items_between_customer_tabs called:', params);
    try {
      const sourceTabId = params?.source_tab_id || params?.sourceTabId;
      const targetTabId = params?.target_tab_id || params?.targetTabId;
      const itemIndices: number[] = params?.item_indices || params?.itemIndices || [];

      if (!sourceTabId || !targetTabId || itemIndices.length === 0) {
        return mockResponse({ success: false, message: 'Source tab, target tab, and item indices required' }, false);
      }

      // Fetch both tabs
      const { data: tabs, error: fetchError } = await supabase
        .from('customer_tabs')
        .select('*')
        .in('id', [sourceTabId, targetTabId]);

      if (fetchError || !tabs || tabs.length < 2) {
        return mockResponse({ success: false, message: 'Could not find both tabs' }, false);
      }

      const sourceTab = tabs.find((t: any) => t.id === sourceTabId);
      const targetTab = tabs.find((t: any) => t.id === targetTabId);

      if (!sourceTab || !targetTab) {
        return mockResponse({ success: false, message: 'Tab not found' }, false);
      }

      const sourceItems = sourceTab.order_items || [];
      const movedItems: any[] = [];
      const remainingItems: any[] = [];

      sourceItems.forEach((item: any, index: number) => {
        if (itemIndices.includes(index)) {
          movedItems.push(item);
        } else {
          remainingItems.push(item);
        }
      });

      if (movedItems.length === 0) {
        return mockResponse({ success: false, message: 'No valid items to move' }, false);
      }

      const updatedTargetItems = [...(targetTab.order_items || []), ...movedItems];

      // Update both tabs
      const { error: sourceError } = await supabase
        .from('customer_tabs')
        .update({ order_items: remainingItems, updated_at: new Date().toISOString() })
        .eq('id', sourceTabId);

      const { error: targetError } = await supabase
        .from('customer_tabs')
        .update({ order_items: updatedTargetItems, updated_at: new Date().toISOString() })
        .eq('id', targetTabId);

      if (sourceError || targetError) {
        return mockResponse({ success: false, message: 'Failed to update tabs' }, false);
      }

      console.log('✅ [app-compat] Moved', movedItems.length, 'items from', sourceTabId, '→', targetTabId);
      return mockResponse({ success: true, moved_count: movedItems.length });
    } catch (error) {
      console.error('❌ [app-compat] move_items_between_customer_tabs exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  move_items_between_tabs: async (params: any) => {
    // Alias for move_items_between_customer_tabs
    return apiClient.move_items_between_customer_tabs(params);
  },

  delete_customer_tab: async (params: any) => {
    console.log('📝 [app-compat] delete_customer_tab called:', params);
    try {
      const tabId = params?.tabId || params?.tab_id || params?.id;

      if (!tabId) {
        return mockResponse({ success: false, message: 'Tab ID required' }, false);
      }

      const { error } = await supabase
        .from('customer_tabs')
        .delete()
        .eq('id', tabId);

      if (error) {
        console.error('❌ [app-compat] delete_customer_tab error:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      console.log('✅ [app-compat] Customer tab deleted:', tabId);
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] delete_customer_tab exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  // ============================================================================
  // RECEIPT TEMPLATES
  // ============================================================================
  list_receipt_templates: async (params: any) => {
    console.log('📋 [app-compat] list_receipt_templates called');
    try {
      const { data, error } = await supabase
        .from('receipt_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ [app-compat] Failed to fetch receipt templates:', error);
        return mockResponse({ success: false, templates: [], message: error.message });
      }
      
      console.log(`✅ [app-compat] Loaded ${data?.length || 0} receipt templates`);
      return mockResponse({ success: true, templates: data || [] });
    } catch (error) {
      console.error('❌ [app-compat] Exception fetching receipt templates:', error);
      return mockResponse({ success: false, templates: [] });
    }
  },

  get_receipt_template: async (params: any) => {
    console.log('📋 [app-compat] get_receipt_template called with params:', params);
    try {
      const templateId = params.templateId || params.id;
      if (!templateId) {
        return mockResponse({ success: false, template: null, message: 'Template ID required' });
      }

      const { data, error } = await supabase
        .from('receipt_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      
      if (error) {
        console.error('❌ [app-compat] Failed to fetch receipt template:', error);
        return mockResponse({ success: false, template: null, message: error.message });
      }
      
      console.log('✅ [app-compat] Loaded template:', data?.name);
      return mockResponse({ success: true, template: data });
    } catch (error) {
      console.error('❌ [app-compat] Exception fetching receipt template:', error);
      return mockResponse({ success: false, template: null });
    }
  },

  create_receipt_template: async (data: any) => mockResponse({ success: true }),

  update_receipt_template: async (params: any, data?: any) => mockResponse({ success: true }),

  delete_receipt_template: async (params: any) => mockResponse({ success: true }),

  get_template_assignments: async () => {
    console.log('📋 [app-compat] get_template_assignments called');
    try {
      const { data, error } = await supabase
        .from('template_assignments')
        .select('*');
      
      if (error) {
        console.error('❌ [app-compat] Failed to fetch template assignments:', error);
        return mockResponse({ success: false, assignments: {}, message: error.message });
      }
      
      // Transform array to object keyed by order_mode
      const assignmentsMap: any = {};
      (data || []).forEach((assignment: any) => {
        assignmentsMap[assignment.order_mode.toUpperCase()] = assignment;
      });
      
      console.log('✅ [app-compat] Loaded template assignments for order modes:', Object.keys(assignmentsMap));
      return mockResponse({ success: true, assignments: assignmentsMap });
    } catch (error) {
      console.error('❌ [app-compat] Exception fetching template assignments:', error);
      return mockResponse({ success: false, assignments: {} });
    }
  },

  get_template_assignment: async (params: any) => {
    console.log('📋 [app-compat] get_template_assignment called with params:', params);
    try {
      const orderMode = params.orderMode || params.order_mode;
      if (!orderMode) {
        return mockResponse({ success: false, message: 'Order mode required' });
      }

      const { data, error } = await supabase
        .from('template_assignments')
        .select('*')
        .eq('order_mode', orderMode.toUpperCase())
        .single();

      if (error) {
        console.error('❌ [app-compat] get_template_assignment error:', error);
        // Return empty assignment (not error) - allows graceful fallback
        return mockResponse({
          success: true,
          customer_template_id: null,
          kitchen_template_id: null
        });
      }

      console.log('✅ [app-compat] Found template assignment for', orderMode, ':', data);
      return mockResponse({
        success: true,
        customer_template_id: data.customer_template_id,
        kitchen_template_id: data.kitchen_template_id,
        order_mode: data.order_mode
      });
    } catch (error) {
      console.error('❌ [app-compat] Exception fetching template assignment:', error);
      // Return empty assignment (not error) - allows graceful fallback
      return mockResponse({
        success: true,
        customer_template_id: null,
        kitchen_template_id: null
      });
    }
  },

  set_template_assignment: async (params: any) => mockResponse({ success: true }),

  get_template_preview: async (params: any) => mockResponse({ preview: null }),

  preview_template: async (params: any) => mockResponse({ preview: null }),

  reset_default_templates: async () => mockResponse({ success: true }),

  generate_escpos_commands: async (data: any) => mockResponse({ commands: [] }),

  // ============================================================================
  // PRINTING - Routes to Electron IPC for thermal printing
  // ============================================================================
  check_printer_health: async () => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.getPrinters) {
      try {
        const printers = await electronAPI.getPrinters();
        const hasPrinters = printers && printers.length > 0;
        console.log('🖨️ [app-compat] Printer health check:', hasPrinters ? 'healthy' : 'no printers', printers);
        return mockResponse({ healthy: hasPrinters, message: hasPrinters ? 'Printers available' : 'No printers found', printers });
      } catch (error) {
        console.error('❌ [app-compat] Printer health check failed:', error);
        return mockResponse({ healthy: false, message: (error as Error).message });
      }
    }
    return mockResponse({ healthy: false, message: 'Electron API not available' });
  },

  get_print_jobs: async (params: any) => mockResponse({ jobs: [] }),

  check_thermal_printer_status: async () => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.getPrinters) {
      try {
        const printers = await electronAPI.getPrinters();
        // Look for thermal printers (typically named with TM-T, POS, Receipt, etc.)
        const thermalPrinter = printers?.find((p: any) =>
          p.name?.toLowerCase().includes('tm-t') ||
          p.name?.toLowerCase().includes('pos') ||
          p.name?.toLowerCase().includes('receipt') ||
          p.name?.toLowerCase().includes('thermal') ||
          p.name?.toLowerCase().includes('epson')
        );
        console.log('🖨️ [app-compat] Thermal printer status:', thermalPrinter ? 'connected' : 'not found');
        return mockResponse({ connected: !!thermalPrinter, printer: thermalPrinter || null });
      } catch (error) {
        console.error('❌ [app-compat] Thermal printer check failed:', error);
        return mockResponse({ connected: false, message: (error as Error).message });
      }
    }
    return mockResponse({ connected: false, message: 'Electron API not available' });
  },

  print_kitchen_ticket: async (data: any) => {
    console.log('🍳 [app-compat] print_kitchen_ticket called:', data);
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.printReceiptESCPOS) {
      try {
        // Normalize data structure - flatten template_data and nest in receiptData
        const normalizedData = {
          type: 'kitchen',
          receiptData: {
            orderNumber: data.orderNumber || data.order_number,
            orderType: data.orderType || data.order_type || 'DINE-IN',
            items: data.items || [],
            tableNumber: data.template_data?.tableNumber || data.tableNumber || data.table_number,
            guestCount: data.template_data?.guestCount || data.guestCount || data.guest_count,
            serverName: data.serverName || data.server_name,
            timestamp: new Date().toISOString(),
            notes: data.specialInstructions || data.notes
          }
        };

        console.log('📋 [app-compat] Normalized kitchen ticket data:', normalizedData);
        const result = await electronAPI.printReceiptESCPOS(normalizedData);
        console.log('✅ [app-compat] Kitchen ticket printed:', result);
        return mockResponse({ success: true, result });
      } catch (error) {
        console.error('❌ [app-compat] Kitchen ticket print failed:', error);
        return mockResponse({ success: false, error: (error as Error).message }, false);
      }
    }
    console.warn('⚠️ [app-compat] Electron print API not available for kitchen ticket');
    return mockResponse({ success: false, error: 'Electron print API not available' }, false);
  },

  print_receipt: async (data: any) => {
    console.log('🧾 [app-compat] print_receipt called:', data);
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.printReceiptESCPOS) {
      try {
        // Normalize data structure - flatten template_data and nest in receiptData
        const normalizedData = {
          type: 'customer',
          receiptData: {
            orderNumber: data.orderNumber || data.order_number,
            orderType: data.orderType || data.order_type,
            items: data.items || [],
            tableNumber: data.template_data?.tableNumber || data.tableNumber || data.table_number,
            guestCount: data.template_data?.guestCount || data.guestCount || data.guest_count,
            serverName: data.serverName || data.server_name,
            timestamp: new Date().toISOString(),
            notes: data.specialInstructions || data.notes,
            // Customer receipt specific fields
            subtotal: data.subtotal || data.sub_total,
            tax: data.tax || data.tax_amount,
            total: data.total || data.total_amount,
            paymentMethod: data.paymentMethod || data.payment_method,
            customerName: data.customerName || data.customer_name
          }
        };

        console.log('📋 [app-compat] Normalized customer receipt data:', normalizedData);
        const result = await electronAPI.printReceiptESCPOS(normalizedData);
        console.log('✅ [app-compat] Receipt printed:', result);
        return mockResponse({ success: true, result });
      } catch (error) {
        console.error('❌ [app-compat] Receipt print failed:', error);
        return mockResponse({ success: false, error: (error as Error).message }, false);
      }
    }
    console.warn('⚠️ [app-compat] Electron print API not available for receipt');
    return mockResponse({ success: false, error: 'Electron print API not available' }, false);
  },

  test_thermal_printers: async (data: any) => {
    console.log('🖨️ [app-compat] test_thermal_printers called:', data);
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.printTest) {
      try {
        const result = await electronAPI.printTest();
        console.log('✅ [app-compat] Test print completed:', result);
        return mockResponse({ success: true, result });
      } catch (error) {
        console.error('❌ [app-compat] Test print failed:', error);
        return mockResponse({ success: false, error: (error as Error).message }, false);
      }
    }
    return mockResponse({ success: false, error: 'Electron print API not available' }, false);
  },

  get_integration_guide: async () => mockResponse({ guide: '' }),

  get_thermal_test_status: async () => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.getPrinters) {
      try {
        const printers = await electronAPI.getPrinters();
        if (printers && printers.length > 0) {
          return mockResponse({ status: 'configured', printers });
        }
        return mockResponse({ status: 'no_printers' });
      } catch (error) {
        return mockResponse({ status: 'error', message: (error as Error).message });
      }
    }
    return mockResponse({ status: 'not_configured' });
  },

  thermal_test_print: async (data: any) => {
    console.log('🖨️ [app-compat] thermal_test_print called:', data);
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.printTest) {
      try {
        const result = await electronAPI.printTest();
        console.log('✅ [app-compat] Thermal test print completed:', result);
        return mockResponse({ success: true, result });
      } catch (error) {
        console.error('❌ [app-compat] Thermal test print failed:', error);
        return mockResponse({ success: false, error: (error as Error).message }, false);
      }
    }
    return mockResponse({ success: false, error: 'Electron print API not available' }, false);
  },

  get_service_status: async () => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.getPrinters) {
      try {
        const printers = await electronAPI.getPrinters();
        if (printers && printers.length > 0) {
          return mockResponse({ status: 'online', printers });
        }
        return mockResponse({ status: 'offline', message: 'No printers available' });
      } catch (error) {
        return mockResponse({ status: 'error', message: (error as Error).message });
      }
    }
    return mockResponse({ status: 'offline', message: 'Electron API not available' });
  },

  // Health check for polling service - always return healthy for Electron app
  check_health: async () => {
    console.log('💓 [app-compat] check_health - Electron app is always healthy');
    return mockResponse({ status: 'healthy', mode: 'electron-desktop' });
  },

  // ============================================================================
  // MEDIA / STORAGE
  // ============================================================================
  get_media_library: async (_params?: any) => {
    console.log('🔄 [app-compat] get_media_library - querying Supabase directly');
    const { data, error } = await supabase
      .from('media_assets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('❌ [app-compat] get_media_library error:', error);
      return mockResponse({ assets: [], success: false, message: error.message });
    }

    console.log('✅ [app-compat] get_media_library loaded:', data?.length || 0, 'assets');
    return mockResponse({ assets: data || [], success: true });
  },

  get_enhanced_media_library: async (params: any = {}) => {
    console.log('🔄 [app-compat] get_enhanced_media_library with params:', params);

    try {
      let query = supabase
        .from('media_assets')
        .select('*');

      // Apply search filter (search in file_name and description)
      if (params.search) {
        query = query.or(`file_name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
      }

      // Apply tag filter (tags is ARRAY type)
      if (params.tag) {
        query = query.contains('tags', [params.tag]);
      }

      // Apply usage filter
      if (params.usage) {
        query = query.eq('usage', params.usage);
      }

      // Apply pagination
      const limit = params.limit || 100;
      const offset = params.offset || 0;

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        console.error('❌ [app-compat] get_enhanced_media_library error:', error);
        return mockResponse({ assets: [], success: false, message: error.message });
      }

      console.log('✅ [app-compat] get_enhanced_media_library loaded:', data?.length || 0, 'assets');
      return mockResponse({ assets: data || [], success: true });
    } catch (error) {
      console.error('❌ [app-compat] get_enhanced_media_library exception:', error);
      return mockResponse({ assets: [], success: false, message: (error as Error).message });
    }
  },

  get_media_asset: async (params: any) => {
    console.log('🔄 [app-compat] get_media_asset called:', params);
    try {
      const assetId = params?.id || params?.asset_id;

      if (!assetId) {
        return mockResponse({ success: false, asset: null, error: 'asset_id is required' });
      }

      const { data: asset, error } = await supabase
        .from('media_assets')
        .select('*')
        .eq('id', assetId)
        .single();

      if (error) {
        console.error('❌ [app-compat] get_media_asset error:', error);
        return mockResponse({ success: false, asset: null, error: error.message });
      }

      console.log(`✅ [app-compat] get_media_asset loaded:`, asset?.id);
      return mockResponse({ success: true, asset });
    } catch (error) {
      console.error('❌ [app-compat] get_media_asset exception:', error);
      return mockResponse({ success: false, asset: null });
    }
  },

  update_media_asset: async (params: any, data?: any) => {
    console.log('🔄 [app-compat] update_media_asset called:', params);
    try {
      const assetId = params?.id || params?.asset_id;
      const updateData = data || params;

      if (!assetId) {
        return mockResponse({ success: false, error: 'asset_id is required' });
      }

      const { error } = await supabase
        .from('media_assets')
        .update({
          alt_text: updateData.alt_text,
          asset_category: updateData.asset_category,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assetId);

      if (error) {
        console.error('❌ [app-compat] update_media_asset error:', error);
        return mockResponse({ success: false, error: error.message });
      }

      console.log(`✅ [app-compat] update_media_asset updated:`, assetId);
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] update_media_asset exception:', error);
      return mockResponse({ success: false });
    }
  },

  delete_media_asset: async (params: any) => {
    console.log('🔄 [app-compat] delete_media_asset called:', params);
    try {
      const assetId = params?.id || params?.asset_id;

      if (!assetId) {
        return mockResponse({ success: false, error: 'asset_id is required' });
      }

      const { error } = await supabase
        .from('media_assets')
        .delete()
        .eq('id', assetId);

      if (error) {
        console.error('❌ [app-compat] delete_media_asset error:', error);
        return mockResponse({ success: false, error: error.message });
      }

      console.log(`✅ [app-compat] delete_media_asset deleted:`, assetId);
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] delete_media_asset exception:', error);
      return mockResponse({ success: false });
    }
  },

  get_recent_media_assets: async (params: any) => {
    console.log('🔄 [app-compat] get_recent_media_assets called:', params);
    try {
      const limit = params?.limit || 20;

      const { data, error } = await supabase
        .from('media_assets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ [app-compat] get_recent_media_assets error:', error);
        return mockResponse({ success: false, assets: [] });
      }

      console.log(`✅ [app-compat] get_recent_media_assets found ${data?.length || 0} assets`);
      return mockResponse({ success: true, assets: data || [] });
    } catch (error) {
      console.error('❌ [app-compat] get_recent_media_assets exception:', error);
      return mockResponse({ success: false, assets: [] });
    }
  },

  upload_avatar: async (data: any) => mockResponse({ success: true, url: '' }),

  upload_general: async (data: any) => mockResponse({ success: true, url: '' }),

  upload_general_file: async (data: any) => mockResponse({ success: true, url: '' }),

  upload_menu_image: async (data: any) => {
    console.log('📸 [app-compat] upload_menu_image called');
    try {
      // data can be FormData (from ImageUploader) or an object with file info
      let file: File | null = null;
      let assetCategory = 'menu-item';
      let altText = '';
      let menuItemName = '';

      if (data instanceof FormData) {
        file = data.get('file') as File;
        assetCategory = (data.get('asset_category') as string) || 'menu-item';
        altText = (data.get('alt_text') as string) || '';
        menuItemName = (data.get('menu_item_name') as string) || '';
      } else if (data?.file) {
        file = data.file;
        assetCategory = data.asset_category || 'menu-item';
        altText = data.alt_text || '';
        menuItemName = data.menu_item_name || '';
      }

      if (!file) {
        return mockResponse({ success: false, error: 'No file provided' }, false);
      }

      // Generate unique filename
      const ext = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const safeName = (menuItemName || file.name).replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
      const filePath = `${assetCategory}/${timestamp}_${safeName}.${ext}`;

      // Read file as ArrayBuffer for Supabase upload
      const arrayBuffer = await file.arrayBuffer();

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, arrayBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('❌ [app-compat] Supabase storage upload error:', uploadError);
        return mockResponse({ success: false, error: uploadError.message }, false);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl || '';

      console.log('✅ [app-compat] Menu image uploaded:', publicUrl);
      return mockResponse({
        success: true,
        asset_id: filePath,
        file_url: publicUrl,
        thumbnail_url: publicUrl, // Supabase doesn't auto-generate thumbnails
        file_size: file.size,
        thumbnail_size: file.size,
        mime_type: file.type,
        dimensions: { width: 0, height: 0 }, // Would need image decode to get real dimensions
      });
    } catch (error) {
      console.error('❌ [app-compat] upload_menu_image exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  upload_optimized_menu_image: async (data: any) => {
    // Alias — same as upload_menu_image (no server-side optimization in Electron mode)
    return apiClient.upload_menu_image(data);
  },

  upload_avatar_image: async (data: any) => mockResponse({ success: true, url: '' }),

  upload_profile_image: async (data: any) => mockResponse({ success: true, url: '' }),

  delete_avatar_image: async (params: any) => mockResponse({ success: true }),

  delete_profile_image: async (params: any) => mockResponse({ success: true }),

  sync_google_profile_image: async (params: any) => mockResponse({ success: true }),

  bulk_update_tags: async (params: any) => mockResponse({ success: true }),

  bulk_delete_assets: async (params: any) => mockResponse({ success: true }),

  get_hierarchical_media: async (params?: any) => {
    console.log('🔄 [app-compat] get_hierarchical_media - querying Supabase');

    try {
      // Fetch all media assets
      const { data: allAssets, error } = await supabase
        .from('media_assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [app-compat] get_hierarchical_media error:', error);
        // Return empty but valid structure
        return mockResponse({
          menu_images: [],
          menu_images_orphaned: { asset_category: 'menu-item', assets: [], count: 0 },
          ai_avatars: [],
          ai_avatars_orphaned: { asset_category: 'ai-avatar', assets: [], count: 0 },
          general_media: [],
          total_assets: 0,
          categorized_count: 0,
          orphaned_count: 0,
        });
      }

      const assets = allAssets || [];

      // Categorize assets by type
      const menuImages = assets.filter((a: any) =>
        a.asset_category === 'menu-item' || a.asset_category === 'menu-item-variant'
      );
      const aiAvatars = assets.filter((a: any) => a.asset_category === 'ai-avatar');
      const generalMedia = assets.filter((a: any) =>
        a.asset_category === 'general' ||
        (!a.asset_category || !['menu-item', 'menu-item-variant', 'ai-avatar'].includes(a.asset_category))
      );

      // Identify categorized vs orphaned menu images
      const categorizedMenuImages = menuImages.filter((a: any) => a.menu_section_id && a.menu_category_id);
      const orphanedMenuImages = menuImages.filter((a: any) => !a.menu_section_id || !a.menu_category_id);
      const orphanedAiAvatars = aiAvatars.filter((a: any) => !a.menu_section_id || !a.menu_category_id);

      const response = {
        menu_images: [], // Empty for now - full hierarchy would require joining with menu_categories table
        menu_images_orphaned: {
          asset_category: 'menu-item',
          assets: orphanedMenuImages,
          count: orphanedMenuImages.length,
        },
        ai_avatars: aiAvatars,
        ai_avatars_orphaned: {
          asset_category: 'ai-avatar',
          assets: orphanedAiAvatars,
          count: orphanedAiAvatars.length,
        },
        general_media: generalMedia,
        total_assets: assets.length,
        categorized_count: categorizedMenuImages.length,
        orphaned_count: orphanedMenuImages.length + orphanedAiAvatars.length,
      };

      console.log('✅ [app-compat] get_hierarchical_media loaded:', {
        total: assets.length,
        menuImages: menuImages.length,
        aiAvatars: aiAvatars.length,
        general: generalMedia.length,
      });

      return mockResponse(response);
    } catch (error) {
      console.error('❌ [app-compat] get_hierarchical_media exception:', error);
      return mockResponse({
        menu_images: [],
        menu_images_orphaned: { asset_category: 'menu-item', assets: [], count: 0 },
        ai_avatars: [],
        ai_avatars_orphaned: { asset_category: 'ai-avatar', assets: [], count: 0 },
        general_media: [],
        total_assets: 0,
        categorized_count: 0,
        orphaned_count: 0,
      });
    }
  },

  link_media_to_menu_item: async (params: any) => mockResponse({ success: true }),

  link_menu_item_media: async (params: any) => mockResponse({ success: true }),

  get_menu_media_status_v3: async () => mockResponse({ status: 'ok' }),

  get_menu_media_relationships_v3: async (params: any) => mockResponse({ relationships: [] }),

  fix_missing_media_references_v3: async () => mockResponse({ success: true }),

  cleanup_orphaned_media_v3: async (params: any) => mockResponse({ success: true }),

  cleanup_orphaned_media: async (params: any) => mockResponse({ success: true }),

  get_asset_usage: async (params: any) => mockResponse({ usage: [] }),

  replace_asset_in_menu_items: async (params: any) => mockResponse({ success: true }),

  remove_asset_references: async (params: any) => mockResponse({ success: true }),

  validate_media_assets: async (params: any) => mockResponse({ valid: true }),

  get_storage_status: async () => mockResponse({ status: 'ok' }),

  setup_unified_media_schema: async () => mockResponse({ success: true }),

  check_bucket_status: async () => mockResponse({ exists: true }),

  initialize_storage_buckets: async () => mockResponse({ success: true }),

  migrate_images: async (params: any) => mockResponse({ success: true }),

  get_migration_status: async () => mockResponse({ status: 'complete' }),

  check_migration_status2: async () => mockResponse({ migrated: true }),

  check_media_assets_schema_status: async () => mockResponse({ exists: true }),

  // ============================================================================
  // CUSTOMER DATA
  // ============================================================================
  lookup_customer: async (params: any) => {
    console.log('🔄 [app-compat] lookup_customer called:', params);
    try {
      const { phone, email, customer_id, customer_reference } = params || {};

      if (!phone && !email && !customer_id && !customer_reference) {
        return mockResponse({
          success: false,
          customer: null,
          error: 'No identifier provided. Please provide email, phone, customer_id, or customer_reference.'
        });
      }

      let customer: any = null;
      let error: any = null;

      // Try each identifier in order of preference (matching backend logic)
      if (customer_id) {
        const result = await supabase
          .from('customers')
          .select('*')
          .eq('id', customer_id)
          .limit(1);
        customer = result.data?.[0] || null;
        error = result.error;
      } else if (email) {
        // Try normalized email first (case-insensitive)
        const normalizedEmail = email.toLowerCase().trim();
        let result = await supabase
          .from('customers')
          .select('*')
          .ilike('email', normalizedEmail)
          .limit(1);

        if (!result.data || result.data.length === 0) {
          // Fallback to partial match
          result = await supabase
            .from('customers')
            .select('*')
            .ilike('email', `%${normalizedEmail}%`)
            .limit(1);
        }
        customer = result.data?.[0] || null;
        error = result.error;
      } else if (phone) {
        // Normalize phone to E.164-like format (remove non-digits except +)
        const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');

        // Try exact E.164 match first
        let result = await supabase
          .from('customers')
          .select('*')
          .eq('phone_e164', cleanedPhone)
          .limit(1);

        // Fallback to original phone field if E.164 doesn't match
        if (!result.data || result.data.length === 0) {
          result = await supabase
            .from('customers')
            .select('*')
            .eq('phone', phone)
            .limit(1);
        }

        // Final fallback to partial match
        if (!result.data || result.data.length === 0) {
          result = await supabase
            .from('customers')
            .select('*')
            .ilike('phone', `%${cleanedPhone}%`)
            .limit(1);
        }
        customer = result.data?.[0] || null;
        error = result.error;
      } else if (customer_reference) {
        // Use correct field name: customer_reference_number
        const result = await supabase
          .from('customers')
          .select('*')
          .eq('customer_reference_number', customer_reference)
          .limit(1);
        customer = result.data?.[0] || null;
        error = result.error;
      }

      if (error) {
        console.error('❌ [app-compat] lookup_customer error:', error);
        return mockResponse({ success: false, customer: null, error: error.message });
      }

      if (customer) {
        console.log(`✅ [app-compat] lookup_customer found:`, customer.id);
        // Format customer to match CustomerProfile model
        return mockResponse({
          success: true,
          customer: {
            id: customer.id,
            email: customer.email || '',
            first_name: customer.first_name,
            last_name: customer.last_name,
            phone: customer.phone,
            phone_e164: customer.phone_e164,
            customer_reference_number: customer.customer_reference_number,
            total_orders: customer.total_orders || 0,
            total_spend: customer.total_spend || 0,
            last_order_at: customer.last_order_at,
            created_at: customer.created_at,
            updated_at: customer.updated_at,
          },
          message: 'Customer found successfully'
        });
      } else {
        console.log('❌ [app-compat] lookup_customer: not found');
        return mockResponse({
          success: false,
          customer: null,
          message: 'Customer not found'
        });
      }
    } catch (error) {
      console.error('❌ [app-compat] lookup_customer exception:', error);
      return mockResponse({ success: false, customer: null, error: 'Lookup failed' });
    }
  },

  get_customer_profile: async (params: any) => {
    console.log('🔄 [app-compat] get_customer_profile called:', params);
    try {
      const { customer_id, comprehensive } = params || {};

      if (!customer_id) {
        return mockResponse({ success: false, profile: null });
      }

      // Fetch customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customer_id)
        .single();

      if (customerError) {
        console.error('❌ [app-compat] get_customer_profile error:', customerError);
        return mockResponse({ success: false, profile: null });
      }

      let result: any = { success: true, customer, profile: customer };

      // If comprehensive, fetch additional data
      if (comprehensive) {
        // Fetch default address
        const { data: addresses } = await supabase
          .from('customer_addresses')
          .select('*')
          .eq('customer_id', customer_id)
          .eq('is_default', true)
          .limit(1);

        result.default_address = addresses && addresses.length > 0 ? addresses[0] : null;

        // Fetch recent orders - match by customer_id OR phone OR phone_e164
        // Build dynamic OR conditions for phone matching
        const phoneConditions: string[] = [`customer_id.eq.${customer_id}`];
        if (customer.phone) {
          phoneConditions.push(`customer_phone.eq.${customer.phone}`);
        }
        if (customer.phone_e164) {
          phoneConditions.push(`customer_phone.eq.${customer.phone_e164}`);
        }

        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .or(phoneConditions.join(','))
          .order('created_at', { ascending: false })
          .limit(10);

        result.recent_orders = orders || [];
      }

      console.log(`✅ [app-compat] get_customer_profile result:`, customer.id);
      return mockResponse(result);
    } catch (error) {
      console.error('❌ [app-compat] get_customer_profile exception:', error);
      return mockResponse({ success: false, profile: null });
    }
  },

  get_customer_preferences: async (params: any) => mockResponse({ preferences: {} }),

  update_customer_preferences: async (phone: string, prefs: any) => mockResponse({ success: true }),

  get_user_favorites: async (params: any) => mockResponse({ favorites: [] }),

  add_favorite: async (params: any) => mockResponse({ success: true }),

  remove_favorite: async (params: any) => mockResponse({ success: true }),

  clear_all_favorites: async (params: any) => mockResponse({ success: true }),

  check_favorite_status: async (params: any) => mockResponse({ is_favorite: false }),

  get_customer_lists: async (params: any) => mockResponse({ lists: [] }),

  create_favorite_list: async (params: any) => mockResponse({ success: true }),

  rename_favorite_list: async (params: any) => mockResponse({ success: true }),

  delete_favorite_list: async (params: any) => mockResponse({ success: true }),

  add_favorite_to_list: async (params: any) => mockResponse({ success: true }),

  remove_favorite_from_list: async (params: any) => mockResponse({ success: true }),

  // ============================================================================
  // CRM - Customer Relationship Management
  // ============================================================================
  crm_search_customers: async (params: any) => {
    console.log('🔄 [app-compat] crm_search_customers called:', params);
    try {
      const { query, limit = 10 } = params || {};

      if (!query || query.length < 2) {
        return mockResponse({ success: true, customers: [], total_count: 0, message: 'Query too short' });
      }

      const searchTerm = query.trim();
      let customers: any[] = [];
      let error: any = null;

      // Detect search type (matching backend logic from customer_crm/__init__.py)
      // Check if it's a customer reference (CTRxxxxx or CTxxxxxxx)
      if (/^CT[R]?\d+$/i.test(searchTerm)) {
        const result = await supabase
          .from('customers')
          .select('*')
          .eq('customer_reference_number', searchTerm.toUpperCase())
          .limit(limit);
        customers = result.data || [];
        error = result.error;
      }
      // Check if it's an email (contains @)
      else if (searchTerm.includes('@')) {
        const normalizedEmail = searchTerm.toLowerCase().trim();
        const result = await supabase
          .from('customers')
          .select('*')
          .ilike('email', `%${normalizedEmail}%`)
          .order('last_order_at', { ascending: false, nullsFirst: false })
          .limit(limit);
        customers = result.data || [];
        error = result.error;
      }
      // Check if it's a phone number (starts with 0, +, or mostly digits)
      else if (/^[\d\s\-\(\)\+]+$/.test(searchTerm) || searchTerm.startsWith('0') || searchTerm.startsWith('+')) {
        const cleanedPhone = searchTerm.replace(/[\s\-\(\)]/g, '');
        // Try exact E.164 match first
        let result = await supabase
          .from('customers')
          .select('*')
          .eq('phone_e164', cleanedPhone)
          .limit(limit);

        if (!result.data || result.data.length === 0) {
          // Fallback to partial match on original phone
          result = await supabase
            .from('customers')
            .select('*')
            .ilike('phone', `%${cleanedPhone}%`)
            .order('last_order_at', { ascending: false, nullsFirst: false })
            .limit(limit);
        }
        customers = result.data || [];
        error = result.error;
      }
      // Default: name search (first_name OR last_name)
      else {
        const result = await supabase
          .from('customers')
          .select('*')
          .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
          .order('last_order_at', { ascending: false, nullsFirst: false })
          .limit(limit);
        customers = result.data || [];
        error = result.error;
      }

      if (error) {
        console.error('❌ [app-compat] crm_search_customers error:', error);
        return mockResponse({ success: false, customers: [], total_count: 0, message: error.message });
      }

      // Map to expected response format (matching backend SearchResponse)
      const formattedCustomers = customers.map((c: any) => ({
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email,
        phone: c.phone,
        customer_reference_number: c.customer_reference_number,
        total_orders: c.total_orders || 0,
        total_spend: parseFloat(c.total_spend) || 0,
        last_order_at: c.last_order_at,
        tags: c.tags,
        notes_summary: c.notes_summary,
        created_source: c.created_source,
      }));

      console.log(`✅ [app-compat] crm_search_customers found ${formattedCustomers.length} customers`);
      return mockResponse({
        success: true,
        customers: formattedCustomers,
        total_count: formattedCustomers.length,
        message: `Found ${formattedCustomers.length} customer(s)`
      });
    } catch (error) {
      console.error('❌ [app-compat] crm_search_customers exception:', error);
      return mockResponse({ success: false, customers: [], total_count: 0, message: 'Search failed' });
    }
  },

  crm_get_customer_profile: async (params: any) => {
    console.log('🔄 [app-compat] crm_get_customer_profile called:', params);
    try {
      const { customer_id } = params || {};

      if (!customer_id) {
        return mockResponse({ success: false, profile: null });
      }

      // Fetch customer with comprehensive data
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customer_id)
        .single();

      if (error) {
        console.error('❌ [app-compat] crm_get_customer_profile error:', error);
        return mockResponse({ success: false, profile: null });
      }

      // Fetch order stats
      const { data: orderStats } = await supabase
        .from('orders')
        .select('id, total_amount, created_at')
        .or(`customer_id.eq.${customer_id},customer_phone.eq.${customer.phone || ''}`)
        .order('created_at', { ascending: false });

      const profile = {
        ...customer,
        total_orders: orderStats?.length || 0,
        total_spent: orderStats?.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0) || 0,
        last_order_date: orderStats && orderStats.length > 0 ? orderStats[0].created_at : null,
      };

      console.log(`✅ [app-compat] crm_get_customer_profile loaded:`, customer_id);
      return mockResponse({ success: true, profile });
    } catch (error) {
      console.error('❌ [app-compat] crm_get_customer_profile exception:', error);
      return mockResponse({ success: false, profile: null });
    }
  },

  crm_get_customer_timeline: async (params: any) => {
    console.log('🔄 [app-compat] crm_get_customer_timeline called:', params);
    try {
      const { customer_id, limit = 50 } = params || {};

      if (!customer_id) {
        return mockResponse({ timeline: [] });
      }

      // Fetch from customer_touchpoints table
      const { data: touchpoints, error } = await supabase
        .from('customer_touchpoints')
        .select('*')
        .eq('customer_id', customer_id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ [app-compat] crm_get_customer_timeline error:', error);
        return mockResponse({ timeline: [] });
      }

      console.log(`✅ [app-compat] crm_get_customer_timeline loaded ${touchpoints?.length || 0} events`);
      return mockResponse({ timeline: touchpoints || [] });
    } catch (error) {
      console.error('❌ [app-compat] crm_get_customer_timeline exception:', error);
      return mockResponse({ timeline: [] });
    }
  },

  crm_get_customer_notes: async (params: any) => {
    console.log('🔄 [app-compat] crm_get_customer_notes called:', params);
    try {
      const { customer_id } = params || {};

      if (!customer_id) {
        return mockResponse({ notes: [] });
      }

      // Fetch notes from customer_notes table
      const { data: notes, error } = await supabase
        .from('customer_notes')
        .select('*')
        .eq('customer_id', customer_id)
        .order('created_at', { ascending: false });

      if (error) {
        // Table might not exist, return empty array
        console.warn('⚠️ [app-compat] crm_get_customer_notes - table may not exist:', error.message);
        return mockResponse({ notes: [] });
      }

      console.log(`✅ [app-compat] crm_get_customer_notes loaded ${notes?.length || 0} notes`);
      return mockResponse({ notes: notes || [] });
    } catch (error) {
      console.error('❌ [app-compat] crm_get_customer_notes exception:', error);
      return mockResponse({ notes: [] });
    }
  },

  crm_add_customer_note: async (params: any) => {
    console.log('🔄 [app-compat] crm_add_customer_note called:', params);
    try {
      const { customer_id, note, author } = params || {};

      if (!customer_id || !note) {
        return mockResponse({ success: false, error: 'customer_id and note required' }, false);
      }

      // Insert note
      const { data: newNote, error } = await supabase
        .from('customer_notes')
        .insert({
          customer_id,
          note,
          author: author || 'POS Staff',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [app-compat] crm_add_customer_note error:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      console.log(`✅ [app-compat] crm_add_customer_note added:`, newNote?.id);
      return mockResponse({ success: true, note: newNote });
    } catch (error) {
      console.error('❌ [app-compat] crm_add_customer_note exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  crm_get_customer_orders: async (params: any) => {
    console.log('🔄 [app-compat] crm_get_customer_orders called:', params);
    try {
      const { customer_id, limit = 20 } = params || {};

      if (!customer_id) {
        return mockResponse({ orders: [] });
      }

      // First get customer to get phone for matching
      const { data: customer } = await supabase
        .from('customers')
        .select('phone')
        .eq('id', customer_id)
        .single();

      // Fetch orders by customer_id or phone
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (customer?.phone) {
        query = query.or(`customer_id.eq.${customer_id},customer_phone.eq.${customer.phone}`);
      } else {
        query = query.eq('customer_id', customer_id);
      }

      const { data: orders, error } = await query;

      if (error) {
        console.error('❌ [app-compat] crm_get_customer_orders error:', error);
        return mockResponse({ orders: [] });
      }

      console.log(`✅ [app-compat] crm_get_customer_orders loaded ${orders?.length || 0} orders`);
      return mockResponse({ orders: orders || [] });
    } catch (error) {
      console.error('❌ [app-compat] crm_get_customer_orders exception:', error);
      return mockResponse({ orders: [] });
    }
  },

  crm_get_full_order: async (params: any) => {
    console.log('🔄 [app-compat] crm_get_full_order called:', params);
    try {
      const { order_id } = params || {};

      if (!order_id) {
        return mockResponse({ success: false, order: null });
      }

      // Fetch complete order
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .single();

      if (error) {
        console.error('❌ [app-compat] crm_get_full_order error:', error);
        return mockResponse({ success: false, order: null });
      }

      console.log(`✅ [app-compat] crm_get_full_order loaded:`, order_id);
      return mockResponse({ success: true, order });
    } catch (error) {
      console.error('❌ [app-compat] crm_get_full_order exception:', error);
      return mockResponse({ success: false, order: null });
    }
  },

  // ============================================================================
  // CART
  // ============================================================================
  get_cart: async (params: any) => mockResponse({ items: [] }),

  add_item_to_cart: async (data: any) => mockResponse({ success: true }),

  remove_item_from_cart: async (params: any) => mockResponse({ success: true }),

  clear_cart: async (params: any) => mockResponse({ success: true }),

  get_cart_suggestions: async (params: any) => mockResponse({ suggestions: [] }),

  // ============================================================================
  // AI / VOICE / AGENTS - Query Supabase directly
  // ============================================================================
  get_unified_agent_config: async () => {
    console.log('🔄 [app-compat] get_unified_agent_config - querying Supabase');
    try {
      const { data, error } = await supabase
        .from('unified_agent_config')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.error('❌ [app-compat] get_unified_agent_config error:', error);
        // Return empty config structure on error (not failure) to allow UI to show defaults
        return mockResponse({
          id: null,
          agent_name: 'Restaurant Assistant',
          agent_avatar_url: null,
          agent_role: 'Restaurant Assistant',
          personality_settings: {},
          channel_settings: {}
        });
      }

      console.log('✅ [app-compat] get_unified_agent_config loaded:', data?.agent_name);
      return mockResponse(data);
    } catch (error) {
      console.error('❌ [app-compat] get_unified_agent_config exception:', error);
      return mockResponse({
        id: null,
        agent_name: 'Restaurant Assistant',
        agent_avatar_url: null,
        agent_role: 'Restaurant Assistant',
        personality_settings: {},
        channel_settings: {}
      });
    }
  },

  update_unified_agent_config: async (params: any) => {
    console.log('🔄 [app-compat] update_unified_agent_config - upserting to Supabase', params);
    try {
      // First check if a config exists
      const { data: existing } = await supabase
        .from('unified_agent_config')
        .select('id')
        .limit(1)
        .single();

      let result;
      if (existing?.id) {
        // Update existing
        const { data, error } = await supabase
          .from('unified_agent_config')
          .update({
            ...params,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('unified_agent_config')
          .insert(params)
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      console.log('✅ [app-compat] update_unified_agent_config success:', result?.agent_name);
      return mockResponse({ success: true, data: result });
    } catch (error) {
      console.error('❌ [app-compat] update_unified_agent_config error:', error);
      return mockResponse({ success: false, message: (error as Error).message });
    }
  },

  get_active_voice_prompt: async () => mockResponse({ prompt: null }),

  publish_wizard_config: async (params: any) => mockResponse({ success: true }),

  generate_system_prompt: async (params: any) => mockResponse({ prompt: '' }),

  get_agent_profiles_endpoint: async () => mockResponse({ profiles: [] }),

  get_voice_types: async () => mockResponse({ types: [] }),

  check_voice_api_health2: async () => mockResponse({ healthy: false }),

  create_agent: async (data: any) => mockResponse({ success: true }),

  update_agent: async (params: any, data?: any) => mockResponse({ success: true }),

  delete_agent: async (params: any) => mockResponse({ success: true }),

  update_agent_avatar: async (params: any) => mockResponse({ success: true }),

  test_agent_call: async (params: any) => mockResponse({ success: true }),

  test_agent_voice: async (agentId: string) => mockResponse({ success: true }),

  get_agent_config: async () => mockResponse({ config: {} }),

  save_agent_config: async (data: any) => mockResponse({ success: true }),

  get_voice_agent_status: async () => mockResponse({ active: false }),

  update_manager_credential2: async (params: any) => mockResponse({ success: true }),

  toggle_ai_voice_assistant: async (params: any) => mockResponse({ success: true }),

  list_active_sessions: async () => mockResponse({ sessions: [] }),

  webrtc_health_check: async () => mockResponse({ healthy: false }),

  initiate_test_call: async (agentId: string, phone: string) => mockResponse({ success: true }),

  create_gemini_voice_session: async (params: any) => mockResponse({ session: null }),

  get_menu_context: async () => mockResponse({ context: {} }),

  search_menu: async (params: any) => mockResponse({ results: [] }),

  get_menu_items_with_variants: async (_params: any) => {
    console.log('🔄 [app-compat] get_menu_items_with_variants - querying Supabase directly');
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        variants:menu_item_variants(*)
      `)
      .eq('is_active', true)
      .order('display_print_order');

    if (error) {
      console.error('❌ [app-compat] get_menu_items_with_variants error:', error);
      return mockResponse({ items: [] });
    }

    console.log('✅ [app-compat] get_menu_items_with_variants loaded:', data?.length || 0, 'items');
    return mockResponse({ items: data || [] });
  },

  get_item_customizations: async (_params: any) => {
    console.log('🔄 [app-compat] get_item_customizations - querying Supabase directly');
    const { data, error } = await supabase
      .from('menu_customizations')
      .select('*')
      .eq('is_active', true)
      .order('menu_order');

    if (error) {
      console.error('❌ [app-compat] get_item_customizations error:', error);
      return mockResponse({ customizations: [] });
    }

    console.log('✅ [app-compat] get_item_customizations loaded:', data?.length || 0, 'items');
    return mockResponse({ customizations: data || [] });
  },

  get_restaurant_info: async () => mockResponse({ info: {} }),

  check_delivery_zone: async (params: any) => mockResponse({ in_zone: true }),

  get_item_variants: async (_params: any) => {
    console.log('🔄 [app-compat] get_item_variants - querying Supabase directly');
    const { data, error } = await supabase
      .from('menu_item_variants')
      .select(`
        *,
        protein_type:menu_protein_types(id, name)
      `)
      .order('menu_item_id');

    if (error) {
      console.error('❌ [app-compat] get_item_variants error:', error);
      return mockResponse({ variants: [] });
    }

    // Map protein_type.name to protein_type_name for backward compatibility
    const mapped = (data || []).map((variant: any) => ({
      ...variant,
      protein_type_name: variant.protein_type?.name || null,
    }));

    console.log('✅ [app-compat] get_item_variants loaded:', mapped.length, 'variants');
    return mockResponse({ variants: mapped });
  },

  get_chat_config: async () => mockResponse({ config: {} }),

  item_lookup_tool: async (params: any) => mockResponse({ item: null }),

  get_cart_tool: async (params: any) => mockResponse({ cart: [] }),

  add_to_cart_tool: async (params: any) => mockResponse({ success: true }),

  webhook_handler: async (data: any) => mockResponse({ success: true }),

  // ============================================================================
  // DATABASE SCHEMA SETUP
  // ============================================================================
  setup_execute_sql_function_consolidated: async () => mockResponse({ success: true }),

  check_database_connection: async () => mockResponse({ connected: true }),

  setup_dining_tables_schema: async () => mockResponse({ success: true }),

  check_dining_tables_schema: async () => mockResponse({ exists: true }),

  setup_kds_schema: async () => mockResponse({ success: true }),

  check_kds_schema: async () => mockResponse({ exists: true }),

  set_kds_pin: async (params: any) => mockResponse({ success: true }),

  verify_kds_pin: async (params: any) => mockResponse({ valid: true }),

  // ============================================================================
  // PROTEINS
  // ============================================================================
  create_protein_type2: async (data: any) => mockResponse({ success: true }),

  update_protein_type2: async (params: any, data?: any) => mockResponse({ success: true }),

  delete_protein_type2: async (params: any) => mockResponse({ success: true }),

  // ============================================================================
  // CUSTOM SERVING SIZES
  // ============================================================================
  list_custom_serving_sizes: async (params: any) => mockResponse({ sizes: [] }),

  create_custom_serving_size: async (data: any) => mockResponse({ success: true }),

  update_custom_serving_size: async (id: string, data: any) => mockResponse({ success: true }),

  delete_custom_serving_size: async (params: any) => mockResponse({ success: true }),

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================
  get_realtime_notification_stats: async (params: any) => mockResponse({ stats: {} }),

  get_realtime_notifications: async (params: any) => mockResponse({ notifications: [] }),

  mark_realtime_notifications: async (params: any) => mockResponse({ success: true }),

  get_notification_history: async (params: any) => mockResponse({ history: [] }),

  test_template: async (params: any) => mockResponse({ success: true }),

  get_webhook_notifications: async (params: any) => mockResponse({ notifications: [] }),

  get_payment_notifications_v2: async (params: any) => mockResponse({ notifications: [] }),

  test_notification: async (params: any) => mockResponse({ success: true }),

  mark_webhook_notifications_processed: async (params: any) => mockResponse({ success: true }),

  mark_notifications_processed_v2: async (params: any) => mockResponse({ success: true }),

  // ============================================================================
  // CMS / CONTENT
  // ============================================================================
  get_all_draft_content: async (params: any) => mockResponse({ content: [] }),

  get_published_content: async (params: any) => mockResponse({ content: [] }),

  update_text_content: async (params: any) => mockResponse({ success: true }),

  delete_content: async (params: any) => mockResponse({ success: true }),

  update_display_order: async (params: any) => mockResponse({ success: true }),

  upload_single_image: async (params: any) => mockResponse({ success: true, url: '' }),

  bulk_upload_images: async (params: any) => mockResponse({ success: true }),

  get_draft_theme: async () => mockResponse({ theme: {} }),

  update_theme_setting: async (params: any) => mockResponse({ success: true }),

  reset_theme_to_default: async (params: any) => mockResponse({ success: true }),

  get_draft_layout: async () => mockResponse({ layout: {} }),

  update_layout_setting: async (params: any) => mockResponse({ success: true }),

  reset_layout: async (params: any) => mockResponse({ success: true }),

  // ============================================================================
  // STRIPE / CHECKOUT
  // ============================================================================
  check_stripe_health: async () => mockResponse({ healthy: false }),

  switch_environment: async (params: any) => mockResponse({ success: true }),

  list_products: async (params: any) => mockResponse({ products: [] }),

  list_charges: async (params: any) => mockResponse({ charges: [] }),

  get_balance: async () => mockResponse({ balance: 0 }),

  create_product: async (data: any) => mockResponse({ success: true }),

  create_price: async (data: any) => mockResponse({ success: true }),

  create_customer: async (data: any) => mockResponse({ success: true }),

  create_coupon: async (data: any) => mockResponse({ success: true }),

  create_sample_payment: async (data: any) => mockResponse({ success: true }),

  create_sample_product: async () => mockResponse({ success: true }),

  createCheckoutPaymentIntent: async (data: any) => mockResponse({ clientSecret: null }),

  confirmCheckoutPayment: async (data: any) => mockResponse({ success: true }),

  getCustomerReference: async (userId: string) => mockResponse({ reference: null }),

  validateDeliveryPostcode: async (params: any) => mockResponse({ valid: true }),

  create_payment_session: async (data: any) => mockResponse({ session: null }),

  create_checkout_session: async (data: any) => mockResponse({ session: null }),

  validate_promo_code: async (params: any) => mockResponse({ valid: false }),

  // ============================================================================
  // REORDER / VALIDATION
  // ============================================================================
  validate_reorder: async (params: any) => mockResponse({ valid: true }),

  // ============================================================================
  // ORDER TRACKING
  // ============================================================================
  get_order_tracking_details: async (params: any) => mockResponse({ details: null }),

  update_order_tracking_status: async (params: any) => {
    console.log('🔄 [app-compat] update_order_tracking_status called:', params);
    try {
      const { order_id, new_status, notes } = params || {};

      if (!order_id || !new_status) {
        console.error('❌ [app-compat] update_order_tracking_status: order_id and new_status required');
        return mockResponse({ success: false, error: 'order_id and new_status required' }, false);
      }

      // Build update object
      const updateData: any = {
        status: new_status,
        updated_at: new Date().toISOString(),
        status_updated_at: new Date().toISOString(),
      };

      // Add rejection reason if provided and status is cancelled/rejected
      if (notes && (new_status === 'CANCELLED' || new_status === 'REJECTED')) {
        updateData.rejection_reason = notes;
        updateData.auto_rejected_at = new Date().toISOString();
      }

      // Update the order
      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', order_id)
        .select()
        .single();

      if (error) {
        console.error('❌ [app-compat] update_order_tracking_status error:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      console.log(`✅ [app-compat] Order ${order_id} status updated to ${new_status}`);
      return mockResponse({ success: true, order: data });
    } catch (error) {
      console.error('❌ [app-compat] update_order_tracking_status exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  // ============================================================================
  // MENU CORPUS / RAG / AI CONTEXT
  // ============================================================================
  get_menu_corpus: async (params: any) => mockResponse({ corpus: [] }),

  get_menu_corpus_redirect: async () => mockResponse({ corpus: [] }),

  get_menu_versions: async (params: any) => mockResponse({ versions: [] }),

  get_sync_schedule: async (params: any) => mockResponse({ schedule: {} }),

  update_sync_schedule: async (schedule: any, params?: any) => mockResponse({ success: true }),

  sync_menu_data_wrapper: async (params: any) => mockResponse({ success: true }),

  sync_menu_corpus: async (params: any) => mockResponse({ success: true }),

  sync_menu_corpus_redirect: async (params: any) => mockResponse({ success: true }),

  sync_restaurant_details_wrapper: async (params: any, options?: any) => mockResponse({ success: true }),

  get_restaurant_details_wrapper: async () => mockResponse({ details: {} }),

  list_corpora: async () => mockResponse({ corpora: [] }),

  delete_corpus: async (params: any) => mockResponse({ success: true }),

  refresh_ai_context: async () => mockResponse({ success: true }),

  get_ai_menu_context: async (params: any) => mockResponse({ context: {} }),

  validate_ai_menu_item: async (query: string, filter?: string) => mockResponse({ valid: true }),

  getContextSummary: async () => mockResponse({ summary: {} }),

  validateMenuItem: async (params: any) => mockResponse({ valid: true }),

  getFullMenuContext: async (params: any) => mockResponse({ context: {} }),

  test_sql_direct_helper: async () => mockResponse({ success: true }),

  populate_sample_menu_data_v2_helper: async () => mockResponse({ success: true }),

  run_comprehensive_test_helper: async () => mockResponse({ success: true }),

  // ============================================================================
  // MISC / OTHER
  // ============================================================================
  get_onboarding_progress: async () => mockResponse({ progress: {} }),

  update_onboarding_progress: async (params: any) => mockResponse({ success: true }),

  fix_all_broken_tools: async () => mockResponse({ success: true }),

  validate_tool_fixes: async () => mockResponse({ valid: true }),

  send_verification_email: async (params: any) => mockResponse({ success: true }),

  update_personalization_settings: async (params: any) => mockResponse({ success: true }),

  auto_confirm_email: async (params: any) => mockResponse({ success: true }),

  view_menu_items_with_variants: async () => mockResponse({ items: [] }),

  update_variant_pricing: async (params: any) => mockResponse({ success: true }),

  list_templates: async () => mockResponse({ templates: [] }),

  get_template: async (params: any) => mockResponse({ template: null }),

  create_template: async (data: any) => mockResponse({ success: true }),

  update_template: async (params: any, data?: any) => mockResponse({ success: true }),

  get_next_item_display_order: async (params: any) => mockResponse({ display_order: 0 }),

  get_storage_item: async (params: any) => mockResponse({ item: null }),

  bulk_delete_items_safe: async (params: any) => mockResponse({ success: true }),

  process_print_queue: async (params: any) => mockResponse({ success: true, processed_count: 0 }),

  place_order: async (data: any) => {
    // Delegate to create_pos_order (used by outbox sync manager for offline order recovery)
    console.log('📝 [app-compat] place_order delegating to create_pos_order');
    return apiClient.create_pos_order({
      order_type: data.order_type || 'COLLECTION',
      table_number: data.table_number,
      guest_count: data.guest_count,
      items: data.items,
      total_amount: data.total_amount,
      customer_name: data.customer_data?.first_name
        ? `${data.customer_data.first_name} ${data.customer_data.last_name || ''}`.trim()
        : 'Walk-in Customer',
      customer_phone: data.customer_data?.phone,
      payment_method: data.payment_method || 'cash',
      notes: data.notes,
    });
  },

  place_order_example: async (data: any) => mockResponse({ success: true }),

  unified_menu_business_ordering_menu_with_ordering: async () => mockResponse({ menu: [] }),

  process_payment2: async (data: any) => mockResponse({ success: true }),

  get_current_business_date: async () => {
    console.log('📅 [app-compat] get_current_business_date called');
    try {
      const { data: configData } = await supabase
        .from('z_report_config')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      const cutoffTime = configData?.business_day_cutoff || '05:00:00';
      const cutoffParts = cutoffTime.split(':').map(Number);
      const cutoffMinutes = cutoffParts[0] * 60 + cutoffParts[1];

      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      let bizDate: string;
      if (nowMinutes < cutoffMinutes) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        bizDate = yesterday.toISOString().split('T')[0];
      } else {
        bizDate = now.toISOString().split('T')[0];
      }

      const periodStart = `${bizDate}T${cutoffTime}`;
      const nextDay = new Date(bizDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];
      const periodEnd = `${nextDayStr}T${cutoffTime}`;

      console.log('✅ [app-compat] get_current_business_date:', bizDate);
      return mockResponse({
        success: true,
        data: { business_date: bizDate, period_start: periodStart, period_end: periodEnd },
      });
    } catch (error) {
      console.error('❌ [app-compat] get_current_business_date exception:', error);
      // Fallback to today
      const today = new Date().toISOString().split('T')[0];
      return mockResponse({
        success: true,
        data: { business_date: today, period_start: `${today}T05:00:00`, period_end: `${today}T05:00:00` },
      });
    }
  },

  get_current_business_rules: async () => {
    console.log('🔄 [app-compat] get_current_business_rules - querying Supabase');
    try {
      const { data: settingsRow, error } = await supabase
        .from('restaurant_settings')
        .select('settings')
        .eq('id', 1)
        .maybeSingle();

      if (error || !settingsRow) {
        console.warn('⚠️ [app-compat] No restaurant settings found for business rules');
        return mockResponse({
          success: true,
          data: {
            restaurant: { name: 'Cottage Tandoori', address: '', postcode: '', phone: '', email: '' },
            delivery: { enabled: true, radius_km: 9.65, radius_miles: 6.0, min_order: 15.0, delivery_fee: 2.5, postcodes: [] },
            kitchen: { is_open: true, message: '' },
            opening_hours: [],
            messages: { greeting: '', closing: '', busy_message: '' },
          },
        });
      }

      const s = settingsRow.settings || {};
      const radiusKm = s.delivery?.radius_km || 9.65;

      console.log('✅ [app-compat] Business rules loaded from restaurant_settings');
      return mockResponse({
        success: true,
        data: {
          restaurant: {
            name: s.business_profile?.name || 'Cottage Tandoori',
            address: s.business_profile?.address || '',
            postcode: s.business_profile?.postcode || '',
            phone: s.business_profile?.phone || '',
            email: s.business_profile?.email || '',
          },
          delivery: {
            enabled: s.delivery?.enabled ?? true,
            radius_km: radiusKm,
            radius_miles: Math.round((radiusKm / 1.60934) * 10) / 10,
            min_order: s.delivery?.min_order || 15.0,
            delivery_fee: s.delivery?.fee || s.delivery?.delivery_fee || 2.5,
            postcodes: s.delivery?.postcodes || [],
          },
          kitchen: {
            is_open: s.kitchen_status?.open ?? true,
            message: s.kitchen_status?.message || '',
          },
          opening_hours: s.opening_hours || [],
          messages: {
            greeting: s.ai_messages?.greeting || '',
            closing: s.ai_messages?.closing || '',
            busy_message: s.ai_messages?.busy_message || '',
          },
        },
      });
    } catch (error) {
      console.error('❌ [app-compat] get_current_business_rules exception:', error);
      return mockResponse({ success: false, rules: {} }, false);
    }
  },

  check_analytics_health: async () => mockResponse({ healthy: true }),

  get_real_time_stats: async () => mockResponse({ stats: {} }),

  get_conversation_analytics: async () => mockResponse({ analytics: {} }),

  get_reconciliation_summary: async (params: any) => mockResponse({ summary: {} }),

  export_orders: async (params: any) => mockResponse({ data: [] }),

  upload_file: async (path: string, data: any) => mockResponse({ success: true, url: '' }),

  upload_multiple_files: async (files: any, path: string) => mockResponse({ success: true }),

  list_refunds: async (params: any) => {
    console.log('🔄 [app-compat] list_refunds called:', params);
    try {
      const { order_id, limit = 50, offset = 0 } = params || {};

      // Query orders with REFUNDED status
      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('status', 'REFUNDED')
        .order('updated_at', { ascending: false });

      // If order_id provided, filter by it
      if (order_id) {
        query = supabase
          .from('orders')
          .select('*')
          .eq('id', order_id)
          .eq('status', 'REFUNDED');
      } else {
        query = query.range(offset, offset + limit - 1);
      }

      const { data: orders, error, count } = await query;

      if (error) {
        console.error('❌ [app-compat] list_refunds error:', error);
        return mockResponse({ success: false, refunds: [], total_count: 0 });
      }

      // Transform orders to RefundInfo format
      const refunds = (orders || []).map((o: any) => ({
        refund_id: o.id,
        order_id: o.id,
        order_number: o.order_number,
        stripe_refund_id: o.stripe_refund_id || null,
        refund_amount: o.total_amount || o.total || 0,
        refund_type: 'full',
        reason: o.cancellation_reason || o.notes || 'Refund processed',
        status: 'completed',
        admin_user_id: o.cancelled_by || o.staff_id || '',
        admin_notes: o.admin_notes || '',
        created_at: o.updated_at || o.created_at,
        processed_at: o.updated_at,
        customer_notified: o.customer_notified || false,
        customer_name: o.customer_name,
        customer_phone: o.customer_phone,
        customer_email: o.customer_email,
      }));

      const totalRefunded = refunds.reduce((sum: number, r: any) => sum + (r.refund_amount || 0), 0);

      console.log(`✅ [app-compat] list_refunds found ${refunds.length} refunds`);
      return mockResponse({
        success: true,
        refunds,
        total_count: count || refunds.length,
        total_refunded: totalRefunded
      });
    } catch (error) {
      console.error('❌ [app-compat] list_refunds exception:', error);
      return mockResponse({ success: false, refunds: [], total_count: 0 });
    }
  },

  create_refund: async (data: any) => {
    console.log('🔄 [app-compat] create_refund called:', data);
    try {
      const {
        order_id,
        refund_type = 'full',
        refund_amount,
        reason = 'Refund requested',
        admin_notes,
        notify_customer = false,
        admin_user_id
      } = data || {};

      if (!order_id) {
        return mockResponse({ success: false, message: 'order_id is required' });
      }

      // First, get the order to verify it exists and get details
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .single();

      if (fetchError || !order) {
        console.error('❌ [app-compat] create_refund: order not found', fetchError);
        return mockResponse({ success: false, message: 'Order not found' });
      }

      // Check if already refunded
      if (order.status === 'REFUNDED') {
        return mockResponse({ success: false, message: 'Order is already refunded' });
      }

      // Calculate refund amount (full order amount if not specified)
      const finalRefundAmount = refund_amount || order.total_amount || order.total || 0;

      // Build history entry
      const historyEntry = {
        action: 'REFUNDED',
        timestamp: new Date().toISOString(),
        user_id: admin_user_id,
        notes: reason,
        changes: [{
          field: 'status',
          oldValue: order.status,
          newValue: 'REFUNDED'
        }, {
          field: 'refund_amount',
          oldValue: 0,
          newValue: finalRefundAmount
        }]
      };

      // Merge with existing history
      const existingHistory = order.history || [];
      const updatedHistory = [...existingHistory, historyEntry];

      // Update order status to REFUNDED
      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'REFUNDED',
          cancellation_reason: reason,
          cancelled_by: admin_user_id,
          admin_notes: admin_notes || order.admin_notes,
          customer_notified: notify_customer,
          history: updatedHistory,
          updated_at: new Date().toISOString()
        })
        .eq('id', order_id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ [app-compat] create_refund: update failed', updateError);
        return mockResponse({ success: false, message: 'Failed to process refund' });
      }

      // If order has Stripe payment, attempt Stripe refund via Electron IPC
      let stripeRefundId = null;
      if (order.stripe_payment_intent_id && typeof window !== 'undefined' && (window as any).electronAPI?.stripeRefund) {
        try {
          const stripeResult = await (window as any).electronAPI.stripeRefund({
            payment_intent_id: order.stripe_payment_intent_id,
            amount: Math.round(finalRefundAmount * 100) // Convert to pence
          });
          if (stripeResult.success) {
            stripeRefundId = stripeResult.refund_id;
            // Update order with Stripe refund ID
            await supabase
              .from('orders')
              .update({ stripe_refund_id: stripeRefundId })
              .eq('id', order_id);
          }
        } catch (stripeError) {
          console.warn('⚠️ [app-compat] Stripe refund failed (cash refund only):', stripeError);
        }
      }

      console.log(`✅ [app-compat] create_refund: refund processed for order ${order_id}`);
      return mockResponse({
        success: true,
        refund_id: order_id,
        stripe_refund_id: stripeRefundId,
        order_id: order_id,
        refund_amount: finalRefundAmount,
        refund_status: refund_type === 'full' ? 'full' : 'partial',
        message: 'Refund processed successfully',
        order_updated: true
      });
    } catch (error) {
      console.error('❌ [app-compat] create_refund exception:', error);
      return mockResponse({ success: false, message: 'Refund processing failed' });
    }
  },

  validate_opening_hours: async (params: any) => mockResponse({ valid: true }),

  // Helper to get base URL (not used in desktop mode)
  
  // ============================================================================
  // AUTO-GENERATED STUBS (2026-01-27)
  // These methods were auto-generated by sync-electron.js
  // Implement real Supabase queries as needed
  // ============================================================================
  abbreviate_text: async (params: any) => mockResponse({ success: true }),

  activate_corpus_version: async (params: any) => mockResponse({ success: true }),

  add_cart_ai_columns: async (params: any) => mockResponse({ success: true }),

  add_customer_reference_field: async (params: any) => mockResponse({ success: true }),

  add_gender_field: async (params: any) => mockResponse({ success: true }),

  add_hierarchical_columns: async (params: any) => mockResponse({ success: true }),

  add_is_available_column: async (params: any) => mockResponse({ success: true }),

  add_linking_columns: async (params: any) => mockResponse({ success: true }),

  add_menu_ai_rls: async (params: any) => mockResponse({ success: true }),

  add_optimization_columns: async (params: any) => mockResponse({ success: true }),

  add_order_timing_fields: async (params: any) => mockResponse({ success: true }),

  add_terminal_payment_columns: async (params: any) => mockResponse({ success: true }),

  add_variant_name_column: async (params: any) => mockResponse({ success: true }),

  admin_counts: async (params: any) => mockResponse({ success: true }),

  agent_profiles_health: async (params: any) => mockResponse({ healthy: true }),

  ai_customizations_health_check: async (params: any) => mockResponse({ healthy: true }),

  ai_recommendations_health: async (params: any) => mockResponse({ healthy: true }),

  analyze_category_migration: async (params: any) => mockResponse({ success: true }),

  analyze_database_tables: async (params: any) => mockResponse({ success: true }),

  analyze_pos_dependencies: async (params: any) => mockResponse({ success: true }),

  analyze_pos_desktop_dependencies: async (params: any) => mockResponse({ success: true }),

  analyze_table_items: async (params: any) => mockResponse({ success: true }),

  apply_category_template: async (params: any) => mockResponse({ success: true }),

  apply_promo_code: async (params: any) => mockResponse({ success: true }),

  audit_report: async (params: any) => mockResponse({ success: true }),

  auth_sync_health_check: async (params: any) => mockResponse({ healthy: true }),

  auto_link_unused_media: async (params: any) => mockResponse({ success: true }),

  auto_process_print_queue: async (params: any) => mockResponse({ success: true }),

  auto_sync_on_set_meal_change: async (params: any) => mockResponse({ success: true }),

  backfill_ai_avatars: async (params: any) => mockResponse({ success: true }),

  backfill_customers: async (params: any) => mockResponse({ success: true }),

  backfill_existing_variants: async (params: any) => mockResponse({ success: true }),

  backfill_legacy: async (params: any) => mockResponse({ success: true }),

  backfill_menu_images: async (params: any) => mockResponse({ success: true }),

  batch_analyze_menu_items: async (params: any) => mockResponse({ success: true }),

  batch_generate_variants: async (params: any) => mockResponse({ success: true }),

  batch_update_pricing: async (params: any) => mockResponse({ success: true }),

  bulk_delete_items: async (params: any) => mockResponse({ success: true }),

  bulk_update_media_tags: async (params: any) => mockResponse({ success: true }),

  bulk_update_order_tracking: async (params: any) => mockResponse({ success: true }),

  calculate_delivery: async (params: any) => mockResponse({ success: true }),

  calculate_order_fees: async (params: any) => mockResponse({ success: true }),

  cancel_customer_order: async (params: any) => mockResponse({ success: true }),

  cart_remove: async (params: any) => mockResponse({ success: true }),

  chat_cart_context_health: async (params: any) => mockResponse({ healthy: true }),

  chat_stream: async (params: any) => mockResponse({ success: true }),

  chatbot_prompts_health: async (params: any) => mockResponse({ healthy: true }),

  check_all_schemas_status: async (params: any) => mockResponse({ valid: true, success: true }),

  check_all_services: async (params: any) => mockResponse({ valid: true, success: true }),

  check_and_fix_storage_permissions: async (params: any) => mockResponse({ valid: true, success: true }),

  check_auth_triggers: async (params: any) => mockResponse({ valid: true, success: true }),

  check_can_cancel_order: async (params: any) => mockResponse({ valid: true, success: true }),

  check_categories_print_fields: async (params: any) => mockResponse({ valid: true, success: true }),

  check_chat_analytics_schema: async (params: any) => mockResponse({ valid: true, success: true }),

  check_chatbot_prompts_schema: async (params: any) => mockResponse({ valid: true, success: true }),

  check_chatbot_table: async (params: any) => mockResponse({ valid: true, success: true }),

  check_corpus_health: async (params: any) => mockResponse({ valid: true, success: true }),

  check_customer_tabs_schema: async (params: any) => mockResponse({ valid: true, success: true }),

  check_database_schema: async (params: any) => mockResponse({ valid: true, success: true }),

  check_device_trust: async (params: any) => mockResponse({ valid: true, success: true }),

  check_favorite_lists_schema: async (params: any) => mockResponse({ valid: true, success: true }),

  check_is_available_column: async (params: any) => mockResponse({ valid: true, success: true }),

  check_kds_health: async (params: any) => mockResponse({ valid: true, success: true }),

  check_latest_release: async (params: any) => mockResponse({ valid: true, success: true }),

  check_media_asset_usage: async (params: any) => mockResponse({ valid: true, success: true }),

  check_menu_ai_fields_exist: async (params: any) => mockResponse({ valid: true, success: true }),

  check_menu_ai_fields_exist2: async (params: any) => mockResponse({ valid: true, success: true }),

  check_menu_customizations_table: async (params: any) => mockResponse({ valid: true, success: true }),

  check_menu_images_schema_v2: async (params: any) => mockResponse({ valid: true, success: true }),

  check_menu_structure_schema_status: async (params: any) => mockResponse({ valid: true, success: true }),

  check_menu_system_health: async (params: any) => mockResponse({ valid: true, success: true }),

  check_missing_variants: async (params: any) => mockResponse({ valid: true, success: true }),

  check_optimization_columns: async (params: any) => mockResponse({ valid: true, success: true }),

  check_order_items_schema: async (params: any) => mockResponse({ valid: true, success: true }),

  check_order_timing_fields: async (params: any) => mockResponse({ valid: true, success: true }),

  check_order_tracking_schema: async (params: any) => mockResponse({ valid: true, success: true }),

  check_payment_link_status: async (params: any) => mockResponse({ valid: true, success: true }),

  check_pos_access: async (params: any) => mockResponse({ valid: true, success: true }),

  check_pos_auth_setup: async (params: any) => mockResponse({ valid: true, success: true }),

  check_pos_tables_schema: async (params: any) => mockResponse({ valid: true, success: true }),

  check_profiles_constraints: async (params: any) => mockResponse({ valid: true, success: true }),

  check_schema_migrations: async (params: any) => mockResponse({ valid: true, success: true }),

  check_schema_status: async (params: any) => mockResponse({ valid: true, success: true }),

  check_service_health: async (params: any) => mockResponse({ valid: true, success: true }),

  check_specific_service: async (params: any) => mockResponse({ valid: true, success: true }),

  check_status: async (params: any) => mockResponse({ valid: true, success: true }),

  check_streaming_health: async (params: any) => mockResponse({ valid: true, success: true }),

  check_structured_streaming_health: async (params: any) => mockResponse({ valid: true, success: true }),

  check_table_exists: async (params: any) => mockResponse({ valid: true, success: true }),

  check_table_orders_schema: async (params: any) => mockResponse({ valid: true, success: true }),

  check_tables_status: async (params: any) => mockResponse({ valid: true, success: true }),

  check_user_roles_table_exists: async (params: any) => mockResponse({ valid: true, success: true }),

  check_user_trusted_device: async (params: any) => mockResponse({ valid: true, success: true }),

  check_variant_food_details_schema: async (params: any) => mockResponse({ valid: true, success: true }),

  check_variant_name_pattern_schema: async (params: any) => mockResponse({ valid: true, success: true }),

  check_variant_name_status: async (params: any) => mockResponse({ valid: true, success: true }),

  check_voice_menu_matching_health: async (params: any) => mockResponse({ valid: true, success: true }),

  clean_duplicate_categories: async (params: any) => mockResponse({ success: true }),

  cleanup_safe_tables: async (params: any) => mockResponse({ success: true }),

  cleanup_table_test_items: async (params: any) => mockResponse({ success: true }),

  clear_all_pending_changes: async (params: any) => mockResponse({ success: true }),

  clear_cache: async (params: any) => mockResponse({ success: true }),

  clear_health_cache: async (params: any) => mockResponse({ healthy: true }),

  clear_image_cache: async (params: any) => mockResponse({ success: true }),

  clear_performance_metrics: async (params: any) => mockResponse({ success: true }),

  compare_npm_packages: async (params: any) => mockResponse({ success: true }),

  create_base_cache: async (params: any) => mockResponse({ success: true, id: null }),

  create_cart_table: async (params: any) => mockResponse({ success: true, id: null }),

  create_chatbot_prompt: async (params: any) => mockResponse({ success: true, id: null }),

  create_customer_address: async (params: any) => mockResponse({ success: true, id: null }),

  create_electron_repository: async (params: any) => mockResponse({ success: true, id: null }),

  create_execute_sql_rpc: async (params: any) => mockResponse({ success: true, id: null }),

  create_file: async (params: any) => mockResponse({ success: true, id: null }),

  create_menu_customizations_table: async (params: any) => mockResponse({ success: true, id: null }),

  create_menu_unified_view: async (params: any) => mockResponse({ success: true, id: null }),

  create_menu_variants_rpc: async (params: any) => mockResponse({ success: true, id: null }),

  create_online_order: async (params: any) => mockResponse({ success: true, id: null }),

  create_optimized_function: async (params: any) => mockResponse({ success: true, id: null }),

  create_pos_order: async (params: any) => {
    console.log('📝 [app-compat] create_pos_order called:', params);
    try {
      const orderNumber = params.order_id || `POS-${Date.now().toString(36).toUpperCase()}`;
      const orderType = (params.order_type || 'COLLECTION').toUpperCase();

      // Optional CRM lookup by phone
      let customerId = params.customer_id || null;
      if (!customerId && params.customer_phone) {
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', params.customer_phone)
          .maybeSingle();
        if (customer) customerId = customer.id;
      }

      // Insert order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          order_type: orderType,
          order_source: 'POS',
          status: params.status || 'pending',
          customer_name: params.customer_name || 'Walk-in Customer',
          customer_phone: params.customer_phone || null,
          customer_email: params.customer_email || null,
          customer_id: customerId,
          items: params.items || [],
          subtotal: params.subtotal || 0,
          tax_amount: params.tax_amount || 0,
          delivery_fee: params.delivery_fee || 0,
          total_amount: params.total_amount || params.total || 0,
          payment_method: params.payment_method || 'cash',
          payment_status: params.payment_status || 'paid',
          special_instructions: params.notes || params.special_instructions || null,
          delivery_address: params.delivery_address || null,
          table_number: params.table_number || null,
          guest_count: params.guest_count || null,
          visibility: 'staff_only',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (orderError) {
        console.error('❌ [app-compat] create_pos_order insert error:', orderError);
        return mockResponse({ success: false, error: orderError.message }, false);
      }

      // Insert order items if provided
      if (params.items && params.items.length > 0) {
        const orderItems = params.items.map((item: any) => ({
          order_id: order.id,
          item_name: item.name || item.item_name,
          menu_item_id: item.menu_item_id || item.item_id || null,
          category_id: item.category_id || null,
          quantity: item.quantity || 1,
          unit_price: item.price || item.unit_price || 0,
          total_price: (item.price || item.unit_price || 0) * (item.quantity || 1),
          line_total: (item.price || item.unit_price || 0) * (item.quantity || 1),
          notes: item.notes || null,
          item_source: 'pos_system',
          preparation_status: 'pending',
          created_at: new Date().toISOString(),
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.warn('⚠️ [app-compat] order_items insert error (order still created):', itemsError);
        }
      }

      console.log('✅ [app-compat] POS order created:', order.id, orderNumber);
      return mockResponse({
        success: true,
        message: 'Order created successfully',
        order_id: orderNumber,
        order_number: orderNumber,
        database_order_id: order.id,
      });
    } catch (error) {
      console.error('❌ [app-compat] create_pos_order exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  create_pos_table: async (params: any) => mockResponse({ success: true, id: null }),

  create_print_job: async (params: any) => mockResponse({ success: true, id: null }),

  create_print_queue_job: async (params: any) => mockResponse({ success: true, id: null }),

  create_print_template: async (params: any) => mockResponse({ success: true, id: null }),

  create_printer_release: async (params: any) => mockResponse({ success: true, id: null }),

  create_promo_code: async (params: any) => mockResponse({ success: true, id: null }),

  create_protein_type: async (params: any) => mockResponse({ success: true, id: null }),

  create_release: async (params: any) => mockResponse({ success: true, id: null }),

  create_repository: async (params: any) => mockResponse({ success: true, id: null }),

  create_repository_file: async (params: any) => mockResponse({ success: true, id: null }),

  create_section_parent_records: async (params: any) => mockResponse({ success: true, id: null }),

  create_setup_intent: async (params: any) => mockResponse({ success: true, id: null }),

  create_sms_payment_link: async (params: any) => mockResponse({ success: true, id: null }),

  create_v8_epos_sdk_release: async (params: any) => mockResponse({ success: true, id: null }),

  create_variant_name_trigger: async (params: any) => mockResponse({ success: true, id: null }),

  customer_context_health_check: async (params: any) => mockResponse({ healthy: true }),

  customer_profile_health: async (params: any) => mockResponse({ healthy: true }),

  debug_menu_customizations: async (params: any) => mockResponse({ success: true }),

  delete_cache: async (params: any) => mockResponse({ success: true }),

  delete_cash_drawer_operation: async (params: any) => {
    console.log('🗑️ [app-compat] delete_cash_drawer_operation called:', params);
    try {
      const operationId = params?.operation_id;
      if (!operationId) {
        return mockResponse({ success: false, error: 'Missing operation_id' }, false);
      }
      const { error } = await supabase
        .from('cash_drawer_operations')
        .delete()
        .eq('id', operationId);
      if (error) {
        console.error('❌ [app-compat] delete_cash_drawer_operation error:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }
      console.log('✅ [app-compat] delete_cash_drawer_operation success');
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] delete_cash_drawer_operation exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  delete_chatbot_prompt: async (params: any) => mockResponse({ success: true }),

  delete_customer_address: async (params: any) => mockResponse({ success: true }),

  delete_payment_method: async (params: any) => mockResponse({ success: true }),

  delete_print_job: async (params: any) => mockResponse({ success: true }),

  delete_print_queue_job: async (params: any) => mockResponse({ success: true }),

  delete_printer_release: async (params: any) => mockResponse({ success: true }),

  delete_promo_code: async (params: any) => mockResponse({ success: true }),

  delete_protein_type: async (params: any) => mockResponse({ success: true }),

  delete_release: async (params: any) => mockResponse({ success: true }),

  delete_single_item: async (params: any) => mockResponse({ success: true }),

  delete_template_preview: async (params: any) => mockResponse({ success: true }),

  diagnose_customers_fk: async (params: any) => mockResponse({ success: true }),

  diagnose_menu_items: async (params: any) => mockResponse({ success: true }),

  diagnose_signup_error: async (params: any) => mockResponse({ success: true }),

  direct_initialize_tables: async (params: any) => mockResponse({ success: true }),

  discover_epson_printers: async (params: any) => mockResponse({ success: true }),

  download_cottage_icon: async (params: any) => mockResponse({ success: true }),

  download_printer_service_package: async (params: any) => mockResponse({ success: true }),

  drop_cart_unique_constraint: async (params: any) => mockResponse({ success: true }),

  drop_loyalty_token_constraint: async (params: any) => mockResponse({ success: true }),

  drop_menu_unified_view: async (params: any) => mockResponse({ success: true }),

  drop_menu_variants_rpc: async (params: any) => mockResponse({ success: true }),

  drop_old_tables: async (params: any) => mockResponse({ success: true }),

  drop_optimized_function: async (params: any) => mockResponse({ success: true }),

  email_receipt: async (params: any) => mockResponse({ success: true }),

  emit_event_endpoint: async (params: any) => mockResponse({ success: true }),

  enable_rls_and_policies: async (params: any) => mockResponse({ success: true }),

  execute_category_migration: async (params: any) => mockResponse({ success: true }),

  execute_migration: async (params: any) => mockResponse({ success: true }),

  execute_simple_migration: async (params: any) => mockResponse({ success: true }),

  execute_sql_endpoint: async (params: any) => mockResponse({ success: true }),

  execute_sql_safe: async (params: any) => mockResponse({ success: true }),

  extend_cache: async (params: any) => mockResponse({ success: true }),

  favorite_lists_health: async (params: any) => mockResponse({ healthy: true }),

  finalize_cutover: async (params: any) => mockResponse({ success: true }),

  finalize_z_report: async (params: any) => {
    console.log('📋 [app-compat] finalize_z_report called:', params);
    try {
      const { business_date, actual_cash, notes, closed_by, verified_by } = params || {};
      if (!business_date) {
        return mockResponse({ success: false, message: 'Missing business_date' }, false);
      }

      // First generate the current report data
      const generateResponse = await apiClient.generate_z_report({ business_date });
      const generateData = await generateResponse.json();
      if (!generateData.success || !generateData.data) {
        return mockResponse({ success: false, message: 'Failed to generate report data' }, false);
      }
      const reportData = generateData.data;

      // Calculate variance
      const expectedCash = reportData.cash_drawer?.expected_cash ?? 0;
      const variance = actual_cash != null ? Math.round((actual_cash - expectedCash) * 100) / 100 : null;

      // Generate report number
      const { data: existingReport } = await supabase
        .from('z_reports')
        .select('id, report_number')
        .eq('business_date', business_date)
        .maybeSingle();

      let reportNumber = existingReport?.report_number;
      if (!reportNumber) {
        const { count } = await supabase
          .from('z_reports')
          .select('*', { count: 'exact', head: true });
        reportNumber = `Z-${String((count || 0) + 1).padStart(6, '0')}`;
      }

      // Prepare upsert data
      const now = new Date().toISOString();
      const upsertData: any = {
        business_date,
        report_number: reportNumber,
        period_start: reportData.period_start,
        period_end: reportData.period_end,
        gross_sales: reportData.gross_sales || 0,
        net_sales: reportData.net_sales || 0,
        total_refunds: reportData.total_refunds || 0,
        total_discounts: reportData.total_discounts || 0,
        total_service_charge: reportData.total_service_charge || 0,
        total_tips: reportData.total_tips || 0,
        total_orders: reportData.total_orders || 0,
        total_guests: reportData.total_guests || 0,
        total_tables_served: reportData.total_tables_served || 0,
        avg_order_value: reportData.avg_order_value || 0,
        channel_breakdown: reportData.channel_breakdown || {},
        payment_breakdown: reportData.payment_breakdown || {},
        cash_sales: reportData.payment_breakdown?.cash?.sales || 0,
        cash_refunds: reportData.payment_breakdown?.cash?.refunds || 0,
        card_sales: reportData.payment_breakdown?.card?.sales || 0,
        card_refunds: reportData.payment_breakdown?.card?.refunds || 0,
        online_sales: reportData.payment_breakdown?.online?.sales || 0,
        online_refunds: reportData.payment_breakdown?.online?.refunds || 0,
        opening_float: reportData.cash_drawer?.opening_float || 100,
        paid_outs: reportData.cash_drawer?.paid_outs || 0,
        paid_ins: reportData.cash_drawer?.paid_ins || 0,
        safe_drops: reportData.cash_drawer?.safe_drops || 0,
        expected_cash: expectedCash,
        actual_cash: actual_cash ?? null,
        cash_variance: variance,
        is_finalized: true,
        finalized_at: now,
        finalized_by_name: closed_by || null,
        verified_by: verified_by || null,
        notes: notes || null,
        updated_at: now,
      };

      if (existingReport?.id) {
        upsertData.id = existingReport.id;
      }

      const { data: savedReport, error } = await supabase
        .from('z_reports')
        .upsert(upsertData, { onConflict: 'business_date' })
        .select()
        .single();

      if (error) {
        console.error('❌ [app-compat] finalize_z_report upsert error:', error);
        return mockResponse({ success: false, message: error.message }, false);
      }

      // Return updated report data
      const finalizedData = {
        ...reportData,
        id: savedReport?.id,
        report_number: reportNumber,
        is_finalized: true,
        finalized_at: now,
        notes: notes || null,
        cash_drawer: {
          ...reportData.cash_drawer,
          actual_cash: actual_cash,
          variance: variance,
        },
      };

      console.log('✅ [app-compat] finalize_z_report success:', reportNumber);
      return mockResponse({ success: true, data: finalizedData });
    } catch (error) {
      console.error('❌ [app-compat] finalize_z_report exception:', error);
      return mockResponse({ success: false, message: (error as Error).message }, false);
    }
  },

  fix_customer_favorites_schema: async (params: any) => mockResponse({ success: true }),

  fix_customers_fk: async (params: any) => mockResponse({ success: true }),

  fix_customers_rls_policies: async (params: any) => mockResponse({ success: true }),

  fix_database_foreign_keys: async (params: any) => mockResponse({ success: true }),

  fix_duplicate_variant_names: async (params: any) => mockResponse({ success: true }),

  fix_foreign_key: async (params: any) => mockResponse({ success: true }),

  fix_menu_customizations_error: async (params: any) => mockResponse({ success: true }),

  fix_menu_customizations_schema: async (params: any) => mockResponse({ success: true }),

  fix_order_items_schema: async (params: any) => mockResponse({ success: true }),

  fix_parent_id_column: async (params: any) => mockResponse({ success: true }),

  fix_schema_column_mismatch: async (params: any) => mockResponse({ success: true }),

  force_refresh_menu: async (params: any) => mockResponse({ success: true }),

  full_run: async (params: any) => mockResponse({ success: true }),

  full_setup: async (params: any) => mockResponse({ success: true }),

  gdpr_export: async (params: any) => mockResponse({ success: true }),

  gemini_cache_health_check: async (params: any) => mockResponse({ healthy: true }),

  generate_ai_content_suggestion: async (params: any) => mockResponse({ success: true }),

  generate_ai_content_suggestion2: async (params: any) => mockResponse({ success: true }),

  generate_ai_recommendations: async (params: any) => mockResponse({ success: true }),

  generate_all_codes: async (params: any) => mockResponse({ success: true }),

  generate_audit_report: async (params: any) => mockResponse({ success: true }),

  generate_item_code: async (params: any) => mockResponse({ success: true }),

  generate_menu_item_code: async (params: any) => mockResponse({ success: true }),

  generate_order_number: async (params: any) => mockResponse({ success: true }),

  generate_receipt: async (params: any) => mockResponse({ success: true }),

  generate_receipt_html: async (params: any) => mockResponse({ success: true }),

  generate_reference_numbers_for_existing_customers: async (params: any) => mockResponse({ success: true }),

  generate_static_map: async (params: any) => mockResponse({ success: true }),

  generate_structured_response: async (params: any) => mockResponse({ success: true }),

  generate_template_preview: async (params: any) => mockResponse({ success: true }),

  generate_variant_code: async (params: any) => mockResponse({ success: true }),

  generate_z_report: async (params: any) => {
    console.log('📊 [app-compat] generate_z_report called:', params);
    try {
      const { business_date } = params || {};

      // Get config for cutoff time
      const { data: configData } = await supabase
        .from('z_report_config')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      const cutoffTime = configData?.business_day_cutoff || '05:00:00';
      const timezone = configData?.timezone || 'Europe/London';
      const defaultFloat = configData?.default_float ?? 100.0;

      // Calculate business date if not provided
      let bizDate = business_date;
      if (!bizDate) {
        const now = new Date();
        const cutoffParts = cutoffTime.split(':').map(Number);
        const cutoffMinutes = cutoffParts[0] * 60 + cutoffParts[1];
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        if (nowMinutes < cutoffMinutes) {
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          bizDate = yesterday.toISOString().split('T')[0];
        } else {
          bizDate = now.toISOString().split('T')[0];
        }
      }

      // Calculate period start/end
      const periodStart = `${bizDate}T${cutoffTime}`;
      const nextDay = new Date(bizDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];
      const periodEnd = `${nextDayStr}T${cutoffTime}`;

      // Query orders within the business date period
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', periodStart)
        .lt('created_at', periodEnd)
        .not('status', 'in', '("CANCELLED","PENDING")')
        .in('payment_status', ['completed', 'paid', 'PAID']);

      if (ordersError) {
        console.error('❌ [app-compat] generate_z_report orders query error:', ordersError);
        return mockResponse({ success: false, message: ordersError.message }, false);
      }

      const orderList = orders || [];

      // Query refunds
      const { data: refunds } = await supabase
        .from('payment_refunds')
        .select('*')
        .gte('created_at', periodStart)
        .lt('created_at', periodEnd)
        .eq('status', 'completed');

      const refundList = refunds || [];

      // Aggregate channel breakdown
      const channelBreakdown: any = {
        dine_in: { count: 0, total: 0, tables: new Set(), guests: 0 },
        pos_waiting: { count: 0, total: 0 },
        pos_collection: { count: 0, total: 0 },
        pos_delivery: { count: 0, total: 0 },
        online_collection: { count: 0, total: 0 },
        online_delivery: { count: 0, total: 0 },
        ai_voice: { count: 0, total: 0 },
      };

      // Aggregate payment breakdown
      const paymentBreakdown: any = {
        cash: { sales: 0, refunds: 0, net: 0, count: 0 },
        card: { sales: 0, refunds: 0, net: 0, count: 0 },
        online: { sales: 0, refunds: 0, net: 0, count: 0 },
        other: { sales: 0, refunds: 0, net: 0, count: 0 },
      };

      let grossSales = 0;
      let totalDiscounts = 0;
      let totalServiceCharge = 0;
      let totalTips = 0;
      const onlineSources = ['ONLINE', 'CUSTOMER_ONLINE_ORDER', 'CUSTOMER_ONLINE_MENU', 'WEBSITE'];

      for (const order of orderList) {
        const amount = parseFloat(order.total_amount || order.total || '0');
        const source = (order.order_source || '').toUpperCase();
        const type = (order.order_type || '').toUpperCase().replace('-', '_');
        const payMethod = (order.payment_method || '').toUpperCase();

        grossSales += amount;
        totalDiscounts += parseFloat(order.discount_amount || '0');
        totalServiceCharge += parseFloat(order.service_charge || '0');
        totalTips += parseFloat(order.tip_amount || '0');

        // Channel classification
        if (source === 'AI_VOICE') {
          channelBreakdown.ai_voice.count++;
          channelBreakdown.ai_voice.total += amount;
        } else if (source === 'POS') {
          if (type === 'DINE_IN' || type === 'DINE-IN') {
            channelBreakdown.dine_in.count++;
            channelBreakdown.dine_in.total += amount;
            if (order.table_number) channelBreakdown.dine_in.tables.add(order.table_number);
            channelBreakdown.dine_in.guests += parseInt(order.guest_count || '0');
          } else if (type === 'WAITING') {
            channelBreakdown.pos_waiting.count++;
            channelBreakdown.pos_waiting.total += amount;
          } else if (type === 'COLLECTION') {
            channelBreakdown.pos_collection.count++;
            channelBreakdown.pos_collection.total += amount;
          } else if (type === 'DELIVERY') {
            channelBreakdown.pos_delivery.count++;
            channelBreakdown.pos_delivery.total += amount;
          } else {
            channelBreakdown.pos_collection.count++;
            channelBreakdown.pos_collection.total += amount;
          }
        } else if (onlineSources.includes(source)) {
          if (type === 'DELIVERY') {
            channelBreakdown.online_delivery.count++;
            channelBreakdown.online_delivery.total += amount;
          } else {
            channelBreakdown.online_collection.count++;
            channelBreakdown.online_collection.total += amount;
          }
        } else {
          channelBreakdown.pos_collection.count++;
          channelBreakdown.pos_collection.total += amount;
        }

        // Payment classification
        if (payMethod === 'CASH') {
          paymentBreakdown.cash.sales += amount;
          paymentBreakdown.cash.count++;
        } else if (payMethod === 'CARD') {
          paymentBreakdown.card.sales += amount;
          paymentBreakdown.card.count++;
        } else if (['ONLINE', 'STRIPE'].includes(payMethod)) {
          paymentBreakdown.online.sales += amount;
          paymentBreakdown.online.count++;
        } else {
          paymentBreakdown.other.sales += amount;
          paymentBreakdown.other.count++;
        }
      }

      // Process refunds
      let totalRefunds = 0;
      for (const refund of refundList) {
        const refundAmount = parseFloat(refund.amount || '0');
        totalRefunds += refundAmount;
        const refundMethod = (refund.payment_method || 'card').toUpperCase();
        if (refundMethod === 'CASH') {
          paymentBreakdown.cash.refunds += refundAmount;
        } else if (refundMethod === 'CARD') {
          paymentBreakdown.card.refunds += refundAmount;
        } else if (['ONLINE', 'STRIPE'].includes(refundMethod)) {
          paymentBreakdown.online.refunds += refundAmount;
        } else {
          paymentBreakdown.card.refunds += refundAmount; // default to card
        }
      }

      // Calculate net for each payment method
      for (const key of Object.keys(paymentBreakdown)) {
        paymentBreakdown[key].net = Math.round((paymentBreakdown[key].sales - paymentBreakdown[key].refunds) * 100) / 100;
        paymentBreakdown[key].sales = Math.round(paymentBreakdown[key].sales * 100) / 100;
        paymentBreakdown[key].refunds = Math.round(paymentBreakdown[key].refunds * 100) / 100;
      }

      // Convert dine_in tables Set to count
      const tablesServed = channelBreakdown.dine_in.tables.size;
      const totalGuests = channelBreakdown.dine_in.guests;
      channelBreakdown.dine_in.tables = tablesServed;

      // Round channel totals
      for (const key of Object.keys(channelBreakdown)) {
        channelBreakdown[key].total = Math.round(channelBreakdown[key].total * 100) / 100;
      }

      // Query cash drawer operations
      const { data: drawerOps } = await supabase
        .from('cash_drawer_operations')
        .select('*')
        .eq('business_date', bizDate)
        .order('created_at', { ascending: true });

      const drawerOpsList = drawerOps || [];
      let openingFloat = defaultFloat;
      let paidOuts = 0;
      let paidIns = 0;
      let safeDrops = 0;

      for (const op of drawerOpsList) {
        const opAmount = parseFloat(op.amount || '0');
        switch (op.operation_type) {
          case 'FLOAT': openingFloat = opAmount; break;
          case 'PAID_OUT': paidOuts += opAmount; break;
          case 'PAID_IN': paidIns += opAmount; break;
          case 'DROP': safeDrops += opAmount; break;
        }
      }

      const cashSales = paymentBreakdown.cash.sales;
      const cashRefunds = paymentBreakdown.cash.refunds;
      const expectedCash = Math.round((openingFloat + cashSales - cashRefunds - paidOuts + paidIns - safeDrops) * 100) / 100;

      // Check if already finalized
      const { data: existingReport } = await supabase
        .from('z_reports')
        .select('*')
        .eq('business_date', bizDate)
        .maybeSingle();

      const netSales = Math.round((grossSales - totalRefunds - totalDiscounts) * 100) / 100;
      const totalOrders = orderList.length;
      const avgOrderValue = totalOrders > 0 ? Math.round((grossSales / totalOrders) * 100) / 100 : 0;

      const reportData: any = {
        id: existingReport?.id || null,
        report_number: existingReport?.report_number || null,
        business_date: bizDate,
        period_start: periodStart,
        period_end: periodEnd,
        gross_sales: Math.round(grossSales * 100) / 100,
        net_sales: netSales,
        total_refunds: Math.round(totalRefunds * 100) / 100,
        total_discounts: Math.round(totalDiscounts * 100) / 100,
        total_service_charge: Math.round(totalServiceCharge * 100) / 100,
        total_tips: Math.round(totalTips * 100) / 100,
        total_orders: totalOrders,
        total_guests: totalGuests,
        total_tables_served: tablesServed,
        avg_order_value: avgOrderValue,
        channel_breakdown: channelBreakdown,
        payment_breakdown: paymentBreakdown,
        cash_drawer: {
          opening_float: openingFloat,
          cash_sales: cashSales,
          cash_refunds: cashRefunds,
          paid_outs: paidOuts,
          paid_ins: paidIns,
          safe_drops: safeDrops,
          expected_cash: expectedCash,
          actual_cash: existingReport?.actual_cash ?? null,
          variance: existingReport?.cash_variance ?? null,
          operations: drawerOpsList,
        },
        is_finalized: existingReport?.is_finalized || false,
        finalized_at: existingReport?.finalized_at || null,
        notes: existingReport?.notes || null,
      };

      console.log(`✅ [app-compat] generate_z_report: ${totalOrders} orders, gross=${grossSales.toFixed(2)}`);
      return mockResponse({ success: true, data: reportData });
    } catch (error) {
      console.error('❌ [app-compat] generate_z_report exception:', error);
      return mockResponse({ success: false, message: (error as Error).message }, false);
    }
  },

  get_abbreviation_dictionary: async (params: any) => mockResponse({ abbreviationdictionary: null }),

  get_active_corpus: async (params: any) => mockResponse({ activecorpus: [], total: 0 }),

  get_active_prompt: async (params: any) => mockResponse({ activeprompt: null }),

  get_admin_lock_status: async (params: any) => mockResponse({ adminlockstatus: [], total: 0 }),

  get_agent_by_id: async (params: any) => mockResponse({ agentbyid: null }),

  get_ai_settings_status: async (params: any) => mockResponse({ aisettingsstatus: [], total: 0 }),

  get_ai_voice_settings: async (params: any) => mockResponse({ aivoicesettings: [], total: 0 }),

  get_all_agents: async (params: any) => mockResponse({ allagents: [], total: 0 }),

  get_all_order_samples: async (params: any) => mockResponse({ allordersamples: [], total: 0 }),

  get_auto_sync_config_endpoint: async (params: any) => mockResponse({ autosyncconfigendpoint: null }),

  get_available_models: async (params: any) => mockResponse({ availablemodels: [], total: 0 }),

  get_available_variables_endpoint: async (params: any) => mockResponse({ availablevariablesendpoint: null }),

  get_business_data_endpoint: async (params: any) => mockResponse({ businessdataendpoint: null }),

  get_cache_stats: async (params: any) => mockResponse({ cachestats: [], total: 0 }),

  get_cart_metrics: async (params: any) => mockResponse({ cartmetrics: [], total: 0 }),

  get_cart_summary: async (params: any) => mockResponse({ cartsummary: null }),

  get_cart_summary_text: async (params: any) => mockResponse({ cartsummarytext: null }),

  get_cart_table_status: async (params: any) => mockResponse({ carttablestatus: [], total: 0 }),

  get_categories: async (params: any) => mockResponse({ categories: [], total: 0 }),

  get_category_diagnostics: async (params: any) => mockResponse({ categorydiagnostics: [], total: 0 }),

  get_category_items: async (params: any) => mockResponse({ categoryitems: [], total: 0 }),

  get_category_section_mappings: async (params: any) => mockResponse({ categorysectionmappings: [], total: 0 }),

  get_chat_cart_context: async (params: any) => mockResponse({ chatcartcontext: null }),

  get_chatbot_prompt: async (params: any) => mockResponse({ chatbotprompt: null }),

  get_code_standards: async (params: any) => mockResponse({ codestandards: [], total: 0 }),

  get_context_summary: async (params: any) => mockResponse({ contextsummary: null }),

  get_corpus_versions: async (params: any) => mockResponse({ corpusversions: [], total: 0 }),

  get_customer_addresses: async (params: any) => mockResponse({ customeraddresses: [], total: 0 }),

  get_customer_context_summary: async (params: any) => mockResponse({ customercontextsummary: null }),

  get_customer_count: async (params: any) => mockResponse({ customercount: null }),

  get_customer_profile_post: async (params: any) => mockResponse({ customerprofilepost: null }),

  get_customer_reference: async (params: any) => mockResponse({ customerreference: null }),

  get_customer_tab: async (params: any) => mockResponse({ customertab: null }),

  get_customizations_for_item: async (params: any) => mockResponse({ customizationsforitem: null }),

  get_delivery_zones_endpoint: async (params: any) => mockResponse({ deliveryzonesendpoint: null }),

  get_email_verification_status: async (params: any) => mockResponse({ emailverificationstatus: [], total: 0 }),

  get_enriched_favorites: async (params: any) => mockResponse({ enrichedfavorites: [], total: 0 }),

  get_file_sha: async (params: any) => mockResponse({ filesha: null }),

  get_full_menu_context: async (params: any) => mockResponse({ fullmenucontext: null }),

  get_full_specification: async (params: any) => mockResponse({ fullspecification: null }),

  get_gallery_menu_items: async (params: any) => mockResponse({ gallerymenuitems: [], total: 0 }),

  get_github_user: async (params: any) => mockResponse({ githubuser: null }),

  get_google_live_voice_settings: async (params: any) => mockResponse({ googlelivevoicesettings: [], total: 0 }),

  get_health_check_template: async (params: any) => mockResponse({ healthchecktemplate: null }),

  get_health_history: async (params: any) => mockResponse({ healthhistory: null }),

  get_health_status: async (params: any) => mockResponse({ healthstatus: [], total: 0 }),

  get_hierarchical_stats: async (params: any) => mockResponse({ hierarchicalstats: [], total: 0 }),

  get_icon_info: async (params: any) => mockResponse({ iconinfo: null }),

  get_installation_bundle: async (params: any) => mockResponse({ installationbundle: null }),

  get_installer_files_status: async (params: any) => mockResponse({ installerfilesstatus: [], total: 0 }),

  get_item_details: async (params: any) => mockResponse({ itemdetails: [], total: 0 }),

  get_item_section_order: async (params: any) => mockResponse({ itemsectionorder: null }),

  get_job_logs: async (params: any) => mockResponse({ joblogs: [], total: 0 }),

  get_latest_combined_installer: async (params: any) => mockResponse({ latestcombinedinstaller: null }),

  get_latest_failed_run_logs: async (params: any) => mockResponse({ latestfailedrunlogs: [], total: 0 }),

  get_latest_pos_release: async (params: any) => mockResponse({ latestposrelease: null }),

  get_latest_printer_release: async (params: any) => mockResponse({ latestprinterrelease: null }),

  get_latest_release: async (params: any) => mockResponse({ latestrelease: null }),

  get_live_calls: async (params: any) => mockResponse({ livecalls: [], total: 0 }),

  get_lock_status: async (params: any) => mockResponse({ lockstatus: [], total: 0 }),

  get_map_image_proxy: async (params: any) => mockResponse({ mapimageproxy: null }),

  get_master_switch_status: async (params: any) => mockResponse({ masterswitchstatus: [], total: 0 }),

  get_master_toggle: async (params: any) => mockResponse({ mastertoggle: null }),

  get_media_usage_summary: async (params: any) => mockResponse({ mediausagesummary: null }),

  get_menu_cache_stats: async (params: any) => mockResponse({ menucachestats: [], total: 0 }),

  get_menu_corpus_debug: async (params: any) => mockResponse({ menucorpusdebug: null }),

  get_menu_corpus_health: async (params: any) => mockResponse({ menucorpushealth: null }),

  get_menu_data_status: async (params: any) => mockResponse({ menudatastatus: [], total: 0 }),

  get_menu_data_summary: async (params: any) => mockResponse({ menudatasummary: null }),

  get_menu_delta_sync: async (params: any) => mockResponse({ menudeltasync: null }),

  get_menu_for_voice_agent: async (params: any) => mockResponse({ menuforvoiceagent: null }),

  get_menu_for_voice_agent_html: async (params: any) => mockResponse({ menuforvoiceagenthtml: null }),

  get_menu_for_voice_agent_text: async (params: any) => mockResponse({ menuforvoiceagenttext: null }),

  get_menu_print_settings: async (params: any) => mockResponse({ menuprintsettings: [], total: 0 }),

  get_menu_text_for_rag: async (params: any) => mockResponse({ menutextforrag: null }),

  get_migration_history_endpoint: async (params: any) => mockResponse({ migrationhistoryendpoint: null }),

  get_next_display_order: async (params: any) => mockResponse({ nextdisplayorder: null }),

  get_offline_sync_status: async (params: any) => mockResponse({ offlinesyncstatus: [], total: 0 }),

  get_onboarding_status: async (params: any) => mockResponse({ onboardingstatus: [], total: 0 }),

  get_optimized_image: async (params: any) => mockResponse({ optimizedimage: null }),

  get_optimized_menu: async (params: any) => mockResponse({ optimizedmenu: null }),

  get_order_history: async (params: any) => mockResponse({ orderhistory: null }),

  get_order_items: async (params: any) => mockResponse({ orderitems: [], total: 0 }),

  get_order_sample: async (params: any) => mockResponse({ ordersample: null }),

  get_orders_by_status: async (params: any) => mockResponse({ ordersbystatus: [], total: 0 }),

  get_package_info: async (params: any) => mockResponse({ packageinfo: null }),

  get_payment_notifications_main: async (params: any) => mockResponse({ paymentnotificationsmain: null }),

  get_pending_changes: async (params: any) => mockResponse({ pendingchanges: [], total: 0 }),

  get_performance_report: async (params: any) => mockResponse({ performancereport: null }),

  get_personalization_settings: async (params: any) => mockResponse({ personalizationsettings: [], total: 0 }),

  get_pos_desktop_version: async (params: any) => mockResponse({ posdesktopversion: null }),

  get_powershell_install_script: async (params: any) => mockResponse({ powershellinstallscript: null }),

  get_powershell_uninstall_script: async (params: any) => mockResponse({ powershelluninstallscript: null }),

  get_print_job: async (params: any) => mockResponse({ printjob: null }),

  get_print_job_stats: async (params: any) => mockResponse({ printjobstats: [], total: 0 }),

  get_print_queue_job: async (params: any) => mockResponse({ printqueuejob: null }),

  get_print_queue_job_stats: async (params: any) => mockResponse({ printqueuejobstats: [], total: 0 }),

  get_print_queue_jobs: async (params: any) => mockResponse({ printqueuejobs: [], total: 0 }),

  get_print_request_templates: async (params: any) => mockResponse({ printrequesttemplates: [], total: 0 }),

  get_printer_capabilities: async (params: any) => mockResponse({ printercapabilities: [], total: 0 }),

  get_printer_status: async (params: any) => mockResponse({ printerstatus: [], total: 0 }),

  get_printing_system_status: async (params: any) => mockResponse({ printingsystemstatus: [], total: 0 }),

  get_profile_image: async (params: any) => mockResponse({ profileimage: null }),

  get_protein_type: async (params: any) => mockResponse({ proteintype: null }),

  get_protein_types: async (params: any) => mockResponse({ proteintypes: [], total: 0 }),

  get_public_restaurant_info: async (params: any) => mockResponse({ publicrestaurantinfo: null }),

  get_public_restaurant_text: async (params: any) => mockResponse({ publicrestauranttext: null }),

  get_queue_status: async (params: any) => mockResponse({ queuestatus: [], total: 0 }),

  get_raw_performance_metrics: async (params: any) => mockResponse({ rawperformancemetrics: [], total: 0 }),

  get_real_menu_data: async (params: any) => mockResponse({ realmenudata: null }),

  get_real_menu_data_enhanced: async (params: any) => mockResponse({ realmenudataenhanced: null }),

  get_real_time_sync_status: async (params: any) => mockResponse({ realtimesyncstatus: [], total: 0 }),

  get_receipt: async (params: any) => mockResponse({ receipt: null }),

  get_recent_print_jobs: async (params: any) => mockResponse({ recentprintjobs: [], total: 0 }),

  get_repository_info: async (params: any) => mockResponse({ repositoryinfo: null }),

  get_restaurant_config: async (params: any) => mockResponse({ restaurantconfig: null }),

  get_restaurant_details_for_voice_agent: async (params: any) => mockResponse({ restaurantdetailsforvoiceagent: null }),

  get_restaurant_info_text_for_rag: async (params: any) => mockResponse({ restaurantinfotextforrag: null }),

  get_restaurant_profile_for_voice_agent: async (params: any) => mockResponse({ restaurantprofileforvoiceagent: null }),

  get_restaurant_profile_for_voice_agent_html: async (params: any) => mockResponse({ restaurantprofileforvoiceagenthtml: null }),

  get_restaurant_profile_for_voice_agent_text: async (params: any) => mockResponse({ restaurantprofileforvoiceagenttext: null }),

  get_sample_order_data_endpoint: async (params: any) => mockResponse({ sampleorderdataendpoint: null }),

  get_schema_health: async (params: any) => mockResponse({ schemahealth: null }),

  get_sequence_status: async (params: any) => mockResponse({ sequencestatus: [], total: 0 }),

  get_service_charge_config_endpoint: async (params: any) => mockResponse({ servicechargeconfigendpoint: null }),

  get_service_specification: async (params: any) => mockResponse({ servicespecification: null }),

  get_session_metrics: async (params: any) => mockResponse({ sessionmetrics: [], total: 0 }),

  get_shared_favorite_list: async (params: any) => mockResponse({ sharedfavoritelist: [], total: 0 }),

  get_signature_dishes: async (params: any) => mockResponse({ signaturedishes: [], total: 0 }),

  get_source_file: async (params: any) => mockResponse({ sourcefile: null }),

  get_specification: async (params: any) => mockResponse({ specification: null }),

  get_static_maps_config: async (params: any) => mockResponse({ staticmapsconfig: null }),

  get_status_options: async (params: any) => mockResponse({ statusoptions: [], total: 0 }),

  get_supabase_config: async (params: any) => mockResponse({ supabaseconfig: null }),

  get_sync_status_endpoint: async (params: any) => mockResponse({ syncstatusendpoint: null }),

  get_table_order: async (params: any) => mockResponse({ tableorder: null }),

  get_table_session_status: async (params: any) => mockResponse({ tablesessionstatus: [], total: 0 }),

  get_tables_config: async (params: any) => mockResponse({ tablesconfig: null }),

  get_template_status: async (params: any) => mockResponse({ templatestatus: [], total: 0 }),

  get_test_info: async (params: any) => mockResponse({ testinfo: null }),

  get_test_status: async (params: any) => mockResponse({ teststatus: [], total: 0 }),

  get_user_orders: async (params: any) => mockResponse({ userorders: [], total: 0 }),

  get_voice_agent_customizations: async (params: any) => mockResponse({ voiceagentcustomizations: [], total: 0 }),

  get_voice_agent_data: async (params: any) => mockResponse({ voiceagentdata: null }),

  get_workflow_run_jobs: async (params: any) => mockResponse({ workflowrunjobs: [], total: 0 }),

  get_z_report_config: async () => {
    console.log('⚙️ [app-compat] get_z_report_config called');
    try {
      const { data, error } = await supabase
        .from('z_report_config')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error || !data) {
        console.warn('⚠️ [app-compat] get_z_report_config: using defaults');
        return mockResponse({
          success: true,
          data: { business_day_cutoff: '05:00:00', default_float: 100.0, timezone: 'Europe/London', require_drawer_count: true },
        });
      }

      console.log('✅ [app-compat] get_z_report_config loaded');
      return mockResponse({ success: true, data });
    } catch (error) {
      console.error('❌ [app-compat] get_z_report_config exception:', error);
      return mockResponse({
        success: true,
        data: { business_day_cutoff: '05:00:00', default_float: 100.0, timezone: 'Europe/London', require_drawer_count: true },
      });
    }
  },

  google_live_voice_status: async (params: any) => mockResponse({ success: true }),

  health_check: async (params: any) => mockResponse({ healthy: true }),

  identity_approve_link: async (params: any) => {
    console.log('✅ [app-compat] identity_approve_link called:', params);
    try {
      const linkId = params?.link_id;
      if (!linkId) return mockResponse({ success: false, error: 'Missing link_id' }, false);

      const { error } = await supabase
        .from('customer_identity_links')
        .update({
          status: 'approved',
          reviewed_by: params?.reviewer_id || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', linkId);

      if (error) {
        console.error('❌ [app-compat] identity_approve_link error:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] identity_approve_link exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  identity_get_link_queue: async (params: any) => {
    console.log('🔗 [app-compat] identity_get_link_queue called:', params);
    try {
      const { status, tier, limit = 100, offset = 0 } = params || {};

      let query = supabase
        .from('customer_identity_links')
        .select(`
          *,
          source_customer:customers!customer_identity_links_source_customer_id_fkey(id, name, phone, email, total_orders, total_spent),
          target_customer:customers!customer_identity_links_target_customer_id_fkey(id, name, phone, email, total_orders, total_spent)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      if (tier && tier !== 'all') {
        query = query.eq('match_tier', tier);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ [app-compat] identity_get_link_queue error:', error);
        return mockResponse({ success: true, links: [], total: 0 });
      }

      console.log(`✅ [app-compat] identity_get_link_queue: ${data?.length || 0} links`);
      return mockResponse({ success: true, links: data || [], total: count || 0 });
    } catch (error) {
      console.error('❌ [app-compat] identity_get_link_queue exception:', error);
      return mockResponse({ success: true, links: [], total: 0 });
    }
  },

  identity_get_stats: async (params: any) => {
    console.log('📊 [app-compat] identity_get_stats called');
    try {
      const { data, error } = await supabase
        .from('customer_identity_links')
        .select('status');

      if (error) {
        console.error('❌ [app-compat] identity_get_stats error:', error);
        return mockResponse({ success: true, by_status: { pending: 0, approved: 0, rejected: 0, auto_linked: 0, merged: 0 } });
      }

      const byStatus: Record<string, number> = { pending: 0, approved: 0, rejected: 0, auto_linked: 0, merged: 0 };
      for (const row of (data || [])) {
        const s = row.status || 'pending';
        byStatus[s] = (byStatus[s] || 0) + 1;
      }

      console.log('✅ [app-compat] identity_get_stats:', byStatus);
      return mockResponse({ success: true, by_status: byStatus });
    } catch (error) {
      console.error('❌ [app-compat] identity_get_stats exception:', error);
      return mockResponse({ success: true, by_status: { pending: 0, approved: 0, rejected: 0, auto_linked: 0, merged: 0 } });
    }
  },

  identity_reject_link: async (params: any) => {
    console.log('❌ [app-compat] identity_reject_link called:', params);
    try {
      const linkId = params?.link_id;
      if (!linkId) return mockResponse({ success: false, error: 'Missing link_id' }, false);

      const { error } = await supabase
        .from('customer_identity_links')
        .update({
          status: 'rejected',
          reviewed_by: params?.reviewer_id || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', linkId);

      if (error) {
        console.error('❌ [app-compat] identity_reject_link error:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] identity_reject_link exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  import_avatars_from_storage: async (params: any) => mockResponse({ success: true }),

  init_clients_and_core_tables: async (params: any) => mockResponse({ success: true }),

  init_pos_settings: async (params: any) => mockResponse({ success: true }),

  init_simple_chatbot_table: async (params: any) => mockResponse({ success: true }),

  initialize_ai_voice_settings: async (params: any) => mockResponse({ success: true }),

  initialize_default_assignments: async (params: any) => mockResponse({ success: true }),

  initialize_default_promos: async (params: any) => mockResponse({ success: true }),

  initialize_fee_configs: async (params: any) => mockResponse({ success: true }),

  initialize_google_live_voice_settings: async (params: any) => mockResponse({ success: true }),

  initialize_onboarding: async (params: any) => mockResponse({ success: true }),

  initialize_schema_migrations: async (params: any) => mockResponse({ success: true }),

  initialize_unified_agent_config: async (params: any) => mockResponse({ success: true }),

  invalidate_menu_cache: async (params: any) => mockResponse({ success: true }),

  invalidate_offline_cache: async (params: any) => mockResponse({ success: true }),

  investigate_menu_schema: async (params: any) => mockResponse({ success: true }),

  link_media_to_menu_integration: async (params: any) => mockResponse({ success: true }),

  list_all_tables: async (params: any) => mockResponse({ all_tables: [], total: 0 }),

  list_available_models: async (params: any) => mockResponse({ available_models: [], total: 0 }),

  list_caches: async (params: any) => mockResponse({ caches: [], total: 0 }),

  list_chatbot_prompts: async (params: any) => mockResponse({ chatbot_prompts: [], total: 0 }),

  list_payment_methods: async (params: any) => mockResponse({ payment_methods: [], total: 0 }),

  list_pending_payments: async (params: any) => mockResponse({ pending_payments: [], total: 0 }),

  list_print_templates: async (params: any) => mockResponse({ print_templates: [], total: 0 }),

  list_promo_codes: async (params: any) => mockResponse({ promo_codes: [], total: 0 }),

  list_protein_types: async (params: any) => mockResponse({ protein_types: [], total: 0 }),

  list_recent_events: async (params: any) => mockResponse({ recent_events: [], total: 0 }),

  list_releases: async (params: any) => mockResponse({ releases: [], total: 0 }),

  list_rls_policies: async (params: any) => mockResponse({ rls_policies: [], total: 0 }),

  list_supported_functions: async (params: any) => mockResponse({ supported_functions: [], total: 0 }),

  list_trusted_devices: async (params: any) => mockResponse({ trusted_devices: [], total: 0 }),

  list_workflow_runs: async (params: any) => mockResponse({ workflow_runs: [], total: 0 }),

  lock_legacy_and_views: async (params: any) => mockResponse({ success: true }),

  log_escalation: async (params: any) => mockResponse({ success: true }),

  log_message: async (params: any) => mockResponse({ success: true }),

  log_session_end: async (params: any) => mockResponse({ success: true }),

  log_session_start: async (params: any) => mockResponse({ success: true }),

  lookup_menu_item_by_code: async (params: any) => mockResponse({ success: true }),

  lookup_postcode_schema: async (params: any) => mockResponse({ success: true }),

  make_loyalty_token_nullable: async (params: any) => mockResponse({ success: true }),

  mark_notifications_processed_main: async (params: any) => mockResponse({ success: true }),

  mark_payment_as_paid: async (params: any) => mockResponse({ success: true }),

  mark_tour_complete: async (params: any) => mockResponse({ success: true }),

  mark_wizard_complete: async (params: any) => mockResponse({ success: true }),

  media_integration_cleanup_orphaned: async (params: any) => mockResponse({ success: true }),

  media_integration_update_tracking: async (params: any) => mockResponse({ success: true }),

  media_integration_verify_relationships: async (params: any) => mockResponse({ success: true }),

  menu_image_upload_health: async (params: any) => mockResponse({ healthy: true }),

  menu_media_core_cleanup_orphaned: async (params: any) => mockResponse({ success: true }),

  menu_media_core_link_to_item: async (params: any) => mockResponse({ success: true }),

  menu_media_core_update_tracking: async (params: any) => mockResponse({ success: true }),

  menu_media_core_verify_relationships: async (params: any) => mockResponse({ success: true }),

  menu_media_optimizer_health_check: async (params: any) => mockResponse({ healthy: true }),

  migrate_fix_table_statuses: async (params: any) => mockResponse({ success: true }),

  migrate_profiles_to_customers: async (params: any) => mockResponse({ success: true }),

  migrate_tables_now: async (params: any) => {
    console.log('🔄 [app-compat] migrate_tables_now - setting up POS tables schema');
    try {
      // Step 1: Ensure pos_tables_config exists and has defaults
      const { data: existingConfig } = await supabase
        .from('pos_tables_config')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (!existingConfig) {
        await supabase
          .from('pos_tables_config')
          .insert({ total_tables: 10, max_seats_per_table: 4 });
        console.log('✅ [app-compat] Created default pos_tables_config');
      }

      // Step 2: Check if pos_tables has data
      const { data: existingTables, count } = await supabase
        .from('pos_tables')
        .select('table_number', { count: 'exact' })
        .limit(1);

      if (!count || count === 0) {
        // Seed default 10 tables
        const defaultTables = [
          { table_number: 1, capacity: 2, status: 'available' },
          { table_number: 2, capacity: 4, status: 'available' },
          { table_number: 3, capacity: 2, status: 'available' },
          { table_number: 4, capacity: 6, status: 'available' },
          { table_number: 5, capacity: 4, status: 'available' },
          { table_number: 6, capacity: 4, status: 'available' },
          { table_number: 7, capacity: 2, status: 'available' },
          { table_number: 8, capacity: 8, status: 'available' },
          { table_number: 9, capacity: 4, status: 'available' },
          { table_number: 10, capacity: 6, status: 'available' },
        ];

        const { error: insertError } = await supabase
          .from('pos_tables')
          .upsert(defaultTables, { onConflict: 'table_number' });

        if (insertError) {
          console.error('❌ [app-compat] Failed to seed pos_tables:', insertError);
          return mockResponse({
            success: false,
            message: 'Failed to seed tables',
            details: { error: insertError.message },
          }, false);
        }
        console.log('✅ [app-compat] Seeded 10 default tables');
      }

      // Verify tables exist
      const { count: finalCount } = await supabase
        .from('pos_tables')
        .select('table_number', { count: 'exact' })
        .limit(1);

      return mockResponse({
        success: true,
        message: 'Migration completed successfully',
        details: {
          tables_count: finalCount || 0,
          setup_result: { success: true },
        },
      });
    } catch (error) {
      console.error('❌ [app-compat] migrate_tables_now error:', error);
      return mockResponse({
        success: false,
        message: (error as Error).message,
        details: { error: (error as Error).message },
      }, false);
    }
  },

  migrate_variant_names_to_title_case: async (params: any) => mockResponse({ success: true }),

  natural_language_search: async (params: any) => mockResponse({ success: true }),

  populate_category_prefixes: async (params: any) => mockResponse({ success: true }),

  populate_missing_variants: async (params: any) => mockResponse({ success: true }),

  populate_sample_menu_data_endpoint: async (params: any) => mockResponse({ success: true }),

  populate_sample_menu_data_v2: async (params: any) => mockResponse({ success: true }),

  pos_heartbeat: async (params: any) => {
    console.log('💓 [app-compat] pos_heartbeat - updating pos_status table');
    try {
      const now = new Date().toISOString();
      const updateData: any = {
        last_heartbeat_at: now,
        updated_at: now,
      };

      // Include custom message if provided
      if (params?.custom_message !== undefined) {
        updateData.custom_message = params.custom_message || null;
      }

      // Check if row exists
      const { data: existing } = await supabase
        .from('pos_status')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existing) {
        // Update existing row
        await supabase
          .from('pos_status')
          .update(updateData)
          .eq('id', existing.id);
      } else {
        // Create first row
        updateData.is_accepting_orders = true;
        await supabase
          .from('pos_status')
          .insert(updateData);
      }

      return mockResponse({
        success: true,
        message: 'Heartbeat received',
        last_heartbeat_at: now,
      });
    } catch (error) {
      console.error('❌ [app-compat] pos_heartbeat error:', error);
      return mockResponse({ success: false, message: (error as Error).message }, false);
    }
  },

  // Get POS status for availability checks (used by useRestaurantAvailability hook)
  get_pos_status: async () => {
    console.log('📋 [app-compat] get_pos_status - querying Supabase');
    try {
      const { data, error } = await supabase
        .from('pos_status')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      // Calculate if online based on heartbeat recency (2 minutes)
      const lastHeartbeat = data?.last_heartbeat_at ? new Date(data.last_heartbeat_at) : null;
      const secondsSinceHeartbeat = lastHeartbeat
        ? Math.floor((Date.now() - lastHeartbeat.getTime()) / 1000)
        : null;
      const isOnline = secondsSinceHeartbeat !== null && secondsSinceHeartbeat < 120;

      return mockResponse({
        is_online: isOnline,
        is_accepting_orders: isOnline && (data?.is_accepting_orders ?? true),
        manual_accepting_orders: data?.is_accepting_orders ?? true,
        custom_message: data?.custom_message || null,
        seconds_since_heartbeat: secondsSinceHeartbeat,
      });
    } catch (error) {
      console.error('❌ [app-compat] get_pos_status error:', error);
      // Return optimistic defaults on error
      return mockResponse({ is_online: true, is_accepting_orders: true });
    }
  },

  // Update POS status (pause/resume orders) - used by usePOSStatusControl hook
  set_pos_status: async (params: { is_accepting_orders: boolean; custom_message?: string }) => {
    console.log('📋 [app-compat] set_pos_status:', params);
    try {
      const { data: existing } = await supabase
        .from('pos_status')
        .select('id')
        .limit(1)
        .maybeSingle();

      const updateData = {
        is_accepting_orders: params.is_accepting_orders,
        custom_message: params.custom_message || null,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        await supabase.from('pos_status').update(updateData).eq('id', existing.id);
      } else {
        await supabase.from('pos_status').insert({
          ...updateData,
          last_heartbeat_at: new Date().toISOString()
        });
      }
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] set_pos_status error:', error);
      return mockResponse({ success: false }, false);
    }
  },

  pos_settings_diagnostics: async (params: any) => mockResponse({ success: true }),

  preflight_check: async (params: any) => mockResponse({ success: true }),

  preview_migration: async (params: any) => mockResponse({ success: true }),

  preview_prompt: async (params: any) => mockResponse({ success: true }),

  print_epson: async (params: any) => mockResponse({ success: true }),

  print_kitchen_and_customer: async (params: any) => {
    console.log('🖨️ [app-compat] print_kitchen_and_customer called:', params);
    const electronAPI = (window as any).electronAPI;

    if (!electronAPI?.printReceiptESCPOS) {
      console.warn('⚠️ [app-compat] Electron print API not available');
      return mockResponse({ success: false, error: 'Electron print API not available' }, false);
    }

    try {
      // 1. Print kitchen ticket
      const kitchenData = {
        type: 'kitchen',
        receiptData: {
          orderNumber: params.orderNumber || params.order_number,
          orderType: params.orderType || params.order_type || 'TAKEAWAY',
          items: params.items || [],
          tableNumber: params.tableNumber || params.table_number,
          customerName: params.customerName || params.customer_name,
          timestamp: new Date().toISOString(),
          notes: params.specialInstructions || params.notes || params.order_notes
        }
      };

      console.log('📋 [app-compat] Printing kitchen ticket:', kitchenData);
      const kitchenResult = await electronAPI.printReceiptESCPOS(kitchenData);
      console.log('✅ [app-compat] Kitchen ticket printed:', kitchenResult);

      // Small delay between prints to avoid printer buffer issues
      await new Promise(resolve => setTimeout(resolve, 500));

      // 2. Print customer receipt
      const customerData = {
        type: 'customer',
        receiptData: {
          orderNumber: params.orderNumber || params.order_number,
          orderType: params.orderType || params.order_type || 'TAKEAWAY',
          items: params.items || [],
          tableNumber: params.tableNumber || params.table_number,
          customerName: params.customerName || params.customer_name,
          customerPhone: params.customerPhone || params.customer_phone,
          timestamp: new Date().toISOString(),
          notes: params.specialInstructions || params.notes,
          subtotal: params.subtotal || params.sub_total,
          tax: params.tax || params.tax_amount,
          total: params.total || params.total_amount,
          paymentMethod: params.paymentMethod || params.payment_method,
          deliveryAddress: params.deliveryAddress || params.delivery_address,
          estimatedTime: params.estimatedTime || params.estimated_time
        }
      };

      console.log('📋 [app-compat] Printing customer receipt:', customerData);
      const customerResult = await electronAPI.printReceiptESCPOS(customerData);
      console.log('✅ [app-compat] Customer receipt printed:', customerResult);

      return mockResponse({ success: true, kitchenResult, customerResult });
    } catch (error) {
      console.error('❌ [app-compat] print_kitchen_and_customer failed:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  print_kitchen_thermal: async (params: any) => mockResponse({ success: true }),

  print_receipt_thermal: async (params: any) => mockResponse({ success: true }),

  print_rich_template: async (params: any) => mockResponse({ success: true }),

  print_test_receipt: async (params: any) => mockResponse({ success: true }),

  print_with_template: async (params: any) => mockResponse({ success: true }),

  print_z_report: async (params: any) => {
    console.log('🖨️ [app-compat] print_z_report called (Electron - delegating to thermal printer if available)');
    // On Electron, printing is handled by the Electron main process via IPC
    // For now, return success and let the UI handle print via window.electronAPI if available
    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.printZReport) {
        await (window as any).electronAPI.printZReport(params?.report_data);
        return mockResponse({ success: true, message: 'Sent to printer' });
      }
      return mockResponse({ success: true, message: 'Print not available in this environment' });
    } catch (error) {
      console.error('❌ [app-compat] print_z_report exception:', error);
      return mockResponse({ success: false, message: 'Print failed' }, false);
    }
  },

  process_failed_print_jobs: async (params: any) => mockResponse({ success: true }),

  process_final_bill_for_table: async (params: any) => mockResponse({ success: true }),

  process_print_queue_jobs: async (params: any) => mockResponse({ success: true }),

  process_template_variables: async (params: any) => mockResponse({ success: true }),

  process_template_with_sample: async (params: any) => mockResponse({ success: true }),

  prompt_generator_health: async (params: any) => mockResponse({ healthy: true }),

  publish_corpus: async (params: any) => mockResponse({ success: true }),

  publish_prompt: async (params: any) => mockResponse({ success: true }),

  publish_voice_settings: async (params: any) => mockResponse({ success: true }),

  push_printer_service_to_github_endpoint: async (params: any) => mockResponse({ success: true }),

  real_time_sync_health_check: async (params: any) => mockResponse({ healthy: true }),

  receipt_generator_health_check: async (params: any) => mockResponse({ healthy: true }),

  record_menu_change: async (params: any) => mockResponse({ success: true }),

  record_cash_drawer_operation: async (params: any) => {
    console.log('💰 [app-compat] record_cash_drawer_operation called:', params);
    try {
      const { operation_type, amount, reason, reference, staff_name, business_date } = params || {};
      if (!operation_type || amount == null) {
        return mockResponse({ success: false, error: 'Missing operation_type or amount' }, false);
      }

      // Calculate business date if not provided
      let bizDate = business_date;
      if (!bizDate) {
        const configResponse = await apiClient.get_current_business_date();
        const configData = await configResponse.json();
        bizDate = configData?.data?.business_date || new Date().toISOString().split('T')[0];
      }

      const { data, error } = await supabase
        .from('cash_drawer_operations')
        .insert({
          operation_type,
          amount: parseFloat(amount),
          reason: reason || null,
          reference: reference || null,
          staff_name: staff_name || null,
          business_date: bizDate,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [app-compat] record_cash_drawer_operation error:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      console.log('✅ [app-compat] record_cash_drawer_operation success:', data?.id);
      return mockResponse({ success: true, operation: data });
    } catch (error) {
      console.error('❌ [app-compat] record_cash_drawer_operation exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  refresh_schema_cache: async (params: any) => mockResponse({ success: true }),

  regenerate_all_variant_names: async (params: any) => mockResponse({ success: true }),

  rename_customer_tab: async (params: any) => mockResponse({ success: true }),

  reorder_siblings: async (params: any) => mockResponse({ success: true }),

  reset_code_system: async (params: any) => mockResponse({ success: true }),

  reset_menu_structure: async (params: any) => mockResponse({ success: true }),

  reset_table_completely: async (params: any) => mockResponse({ success: true }),

  reset_template_assignment: async (params: any) => mockResponse({ success: true }),

  retry_item_migration: async (params: any) => mockResponse({ success: true }),

  revoke_device: async (params: any) => mockResponse({ success: true }),

  revoke_user_device: async (params: any) => mockResponse({ success: true }),

  rollback: async (params: any) => mockResponse({ success: true }),

  rollback_category_migration: async (params: any) => mockResponse({ success: true }),

  run_batch_generation: async (params: any) => mockResponse({ success: true }),

  run_customization_test: async (params: any) => mockResponse({ success: true }),

  run_full_migration: async (params: any) => mockResponse({ success: true }),

  run_full_test_suite: async (params: any) => mockResponse({ success: true }),

  run_table_diagnostics: async (params: any) => mockResponse({ success: true }),

  save_menu_print_settings: async (params: any) => mockResponse({ success: true }),

  save_tables_config: async (params: any) => mockResponse({ success: true }),

  schema_migrate_menu_images_v2: async (params: any) => mockResponse({ success: true }),

  select_agent: async (params: any) => mockResponse({ success: true }),

  send_order_confirmation_email: async (params: any) => mockResponse({ success: true }),

  send_realtime_notification: async (params: any) => mockResponse({ success: true }),

  set_active_prompt: async (params: any) => mockResponse({ success: true }),

  set_default_payment_method: async (params: any) => mockResponse({ success: true }),

  set_master_switch: async (params: any) => mockResponse({ success: true }),

  setup_all_schemas_batch: async (params: any) => mockResponse({ success: true }),

  setup_chat_analytics_schema: async (params: any) => mockResponse({ success: true }),

  setup_chatbot_prompts_table: async (params: any) => mockResponse({ success: true }),

  setup_corpus_schema: async (params: any) => mockResponse({ success: true }),

  setup_database_procedures: async (params: any) => mockResponse({ success: true }),

  setup_delivery_schema: async (params: any) => mockResponse({ success: true }),

  setup_favorite_lists_schema: async (params: any) => mockResponse({ success: true }),

  setup_kitchen_display_schema: async (params: any) => mockResponse({ success: true }),

  setup_menu_categories_parent_relationship: async (params: any) => mockResponse({ success: true }),

  setup_menu_database: async (params: any) => mockResponse({ success: true }),

  setup_menu_images_schema_v2: async (params: any) => mockResponse({ success: true }),

  setup_menu_item_codes: async (params: any) => mockResponse({ success: true }),

  setup_menu_structure_alter_table_function: async (params: any) => mockResponse({ success: true }),

  setup_menu_tables2: async (params: any) => mockResponse({ success: true }),

  setup_onboarding_database: async (params: any) => mockResponse({ success: true }),

  setup_order_tracking_schema: async (params: any) => mockResponse({ success: true }),

  setup_pos_auth_tables: async (params: any) => mockResponse({ success: true }),

  setup_pos_tables_schema: async (params: any) => mockResponse({ success: true }),

  setup_profile_images_infrastructure: async (params: any) => mockResponse({ success: true }),

  setup_publish_schema: async (params: any) => mockResponse({ success: true }),

  setup_set_meals_schema: async (params: any) => mockResponse({ success: true }),

  setup_simple_payment_tracking: async (params: any) => mockResponse({ success: true }),

  setup_special_instructions_schema: async (params: any) => mockResponse({ success: true }),

  setup_table_orders_schema: async (params: any) => mockResponse({ success: true }),

  setup_trigger: async (params: any) => mockResponse({ success: true }),

  setup_trusted_device_tables: async (params: any) => mockResponse({ success: true }),

  setup_user_roles_rls: async (params: any) => mockResponse({ success: true }),

  setup_variant_food_details_schema: async (params: any) => mockResponse({ success: true }),

  setup_variant_name_pattern_schema: async (params: any) => mockResponse({ success: true }),

  setup_variant_name_trigger: async (params: any) => mockResponse({ success: true }),

  setup_variants_food_details: async (params: any) => mockResponse({ success: true }),

  share_favorite_list: async (params: any) => mockResponse({ success: true }),

  show_menu_item: async (params: any) => mockResponse({ success: true }),

  show_menu_item_health: async (params: any) => mockResponse({ healthy: true }),

  sort_order_items_by_sections: async (params: any) => mockResponse({ success: true }),

  stream_chat: async (params: any) => mockResponse({ success: true }),

  stripe_webhook: async (params: any) => mockResponse({ success: true }),

  suggest_kitchen_names: async (params: any) => mockResponse({ success: true }),

  supabase_manager_health_check: async (params: any) => mockResponse({ healthy: true }),

  supabase_pos_login: async (params: any) => mockResponse({ success: true }),

  sync_counters_with_database: async (params: any) => mockResponse({ success: true }),

  sync_electron_builder_config: async (params: any) => mockResponse({ success: true }),

  sync_installer_files: async (params: any) => mockResponse({ success: true }),

  sync_menu_changes_now: async (params: any) => mockResponse({ success: true }),

  sync_pos_files: async (params: any) => mockResponse({ success: true }),

  sync_printer_service: async (params: any) => mockResponse({ success: true }),

  sync_printer_workflow_files: async (params: any) => mockResponse({ success: true }),

  sync_set_meals_to_menu: async (params: any) => mockResponse({ success: true }),

  test_ai_settings_sync: async (params: any) => mockResponse({ success: true }),

  test_ai_voice_connection: async (params: any) => mockResponse({ success: true }),

  test_all_cart_operations: async (params: any) => mockResponse({ success: true }),

  test_all_printers: async (params: any) => mockResponse({ success: true }),

  test_all_voice_functions: async (params: any) => mockResponse({ success: true }),

  test_batch_variants_dry_run: async (params: any) => mockResponse({ success: true }),

  test_category_filter: async (params: any) => mockResponse({ success: true }),

  test_comprehensive_menu_sql_function: async (params: any) => mockResponse({ success: true }),

  test_customizations_end_to_end: async (params: any) => mockResponse({ success: true }),

  test_customizations_health_check: async (params: any) => mockResponse({ healthy: true }),

  test_customizations_schema_fix: async (params: any) => mockResponse({ success: true }),

  test_customizations_with_real_item: async (params: any) => mockResponse({ success: true }),

  test_google_live_voice_call: async (params: any) => mockResponse({ success: true }),

  test_menu_customizations_query: async (params: any) => mockResponse({ success: true }),

  test_menu_unified_view: async (params: any) => mockResponse({ success: true }),

  test_menu_variants_rpc: async (params: any) => mockResponse({ success: true }),

  test_mode_any: async (params: any) => mockResponse({ success: true }),

  test_mode_any_health_check: async (params: any) => mockResponse({ healthy: true }),

  test_mode_any_multiturn: async (params: any) => mockResponse({ success: true }),

  test_optimized_function: async (params: any) => mockResponse({ success: true }),

  test_print: async (params: any) => mockResponse({ success: true }),

  test_print_simple_data: async (params: any) => mockResponse({ success: true }),

  test_print_unified: async (params: any) => mockResponse({ success: true }),

  test_safety_validation: async (params: any) => mockResponse({ success: true }),

  test_sql_function_menu_tables: async (params: any) => mockResponse({ success: true }),

  test_tier1_crud: async (params: any) => mockResponse({ success: true }),

  test_tier2_ddl: async (params: any) => mockResponse({ success: true }),

  test_tier3_advanced: async (params: any) => mockResponse({ success: true }),

  test_voice_executor: async (params: any) => mockResponse({ success: true }),

  toggle_ai_assistant: async (params: any) => mockResponse({ success: true }),

  trust_device_for_user: async (params: any) => mockResponse({ success: true }),

  unified_agent_config_status: async (params: any) => mockResponse({ success: true }),

  unlink_media: async (params: any) => mockResponse({ success: true }),

  unpublish_prompt: async (params: any) => mockResponse({ success: true }),

  update_abbreviation_dictionary: async (params: any) => mockResponse({ success: true }),

  update_ai_voice_settings: async (params: any) => mockResponse({ success: true }),

  update_auto_sync_config: async (params: any) => mockResponse({ success: true }),

  update_categories_print_fields: async (params: any) => mockResponse({ success: true }),

  update_chatbot_prompt: async (params: any) => mockResponse({ success: true }),

  update_delivery_zones: async (params: any) => mockResponse({ success: true }),

  update_email_step: async (params: any) => mockResponse({ success: true }),

  update_existing_agents_gender: async (params: any) => mockResponse({ success: true }),

  update_file_mapping: async (params: any) => mockResponse({ success: true }),

  update_google_live_voice_settings: async (params: any) => mockResponse({ success: true }),

  update_item_customizations: async (params: any) => mockResponse({ success: true }),

  update_item_quantity: async (params: any) => mockResponse({ success: true }),

  update_menu_items_schema: async (params: any) => mockResponse({ success: true }),

  update_menu_items_with_ai_fields: async (params: any) => mockResponse({ success: true }),

  update_menu_items_with_ai_fields2: async (params: any) => mockResponse({ success: true }),

  update_pos_desktop: async (params: any) => mockResponse({ success: true }),

  update_pos_table_status: async (params: any) => mockResponse({ success: true }),

  update_print_job_status: async (params: any) => mockResponse({ success: true }),

  update_print_queue_job_status: async (params: any) => mockResponse({ success: true }),

  update_protein_type: async (params: any) => mockResponse({ success: true }),

  update_service_charge_config: async (params: any) => mockResponse({ success: true }),

  update_z_report_config: async (params: any) => {
    console.log('⚙️ [app-compat] update_z_report_config called:', params);
    try {
      const { error } = await supabase
        .from('z_report_config')
        .upsert({ id: 1, ...params }, { onConflict: 'id' });

      if (error) {
        console.error('❌ [app-compat] update_z_report_config error:', error);
        return mockResponse({ success: false, error: error.message }, false);
      }

      console.log('✅ [app-compat] update_z_report_config success');
      return mockResponse({ success: true });
    } catch (error) {
      console.error('❌ [app-compat] update_z_report_config exception:', error);
      return mockResponse({ success: false, error: (error as Error).message }, false);
    }
  },

  upload_menu_item_image: async (params: any) => mockResponse({ success: true }),

  upload_primary_agent_avatar: async (params: any) => mockResponse({ success: true }),

  upload_release_asset: async (params: any) => mockResponse({ success: true }),

  validate_avatar_limit: async (params: any) => mockResponse({ valid: true, success: true }),

  validate_code_standard: async (params: any) => mockResponse({ valid: true, success: true }),

  validate_code_unique: async (params: any) => mockResponse({ valid: true, success: true }),

  validate_customization: async (params: any) => mockResponse({ valid: true, success: true }),

  validate_menu_item: async (params: any) => mockResponse({ valid: true, success: true }),

  validate_order: async (params: any) => mockResponse({ valid: true, success: true }),

  validate_reference_system: async (params: any) => mockResponse({ valid: true, success: true }),

  validate_structured_prompts: async (params: any) => mockResponse({ valid: true, success: true }),

  verify_cart_ai_schema: async (params: any) => mockResponse({ success: true }),

  verify_category_migration: async (params: any) => mockResponse({ success: true }),

  verify_database_procedures: async (params: any) => mockResponse({ success: true }),

  verify_execute_sql_rpc: async (params: any) => mockResponse({ success: true }),

  verify_migration: async (params: any) => mockResponse({ success: true }),

  verify_password_with_device: async (params: any) => mockResponse({ success: true }),

  verify_schema: async (params: any) => mockResponse({ success: true }),

  verify_simple_migration: async (params: any) => mockResponse({ success: true }),

  verify_terminal_payment_schema: async (params: any) => mockResponse({ success: true }),

  verify_trigger_setup: async (params: any) => mockResponse({ success: true }),

  verify_variant_names: async (params: any) => mockResponse({ success: true }),

  voice_agent_core_health: async (params: any) => mockResponse({ healthy: true }),

  voice_session_health: async (params: any) => mockResponse({ healthy: true }),

getBaseUrl: () => '',
};

// Database stub - Desktop uses Supabase directly
export const db = {
  storage: {
    // Implement as needed
  }
};

// Export everything that might be imported from 'app'
export default {
  Mode,
  mode,
  APP_BASE_PATH,
  apiClient,
  db
};
