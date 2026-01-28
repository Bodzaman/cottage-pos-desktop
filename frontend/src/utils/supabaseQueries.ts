/**
 * Supabase Query Helpers - Direct database queries for offline-capable POS
 *
 * This module replaces the brain.* API calls with direct Supabase queries.
 * All functions return data directly without HTTP wrapper responses.
 *
 * Usage:
 *   import { getTables, getTableOrders } from 'utils/supabaseQueries';
 *   const tables = await getTables(); // Returns PosTableResponse[]
 */

import { supabase } from './supabaseClient';
import { mapFormToDatabase, validateDatabasePayload } from './menuItemFieldMapping';

const isDev = import.meta.env?.DEV;

// ============================================================================
// TYPES (Matching existing brain/data-contracts types)
// ============================================================================

export interface PosTable {
  id: string;
  table_number: number;
  capacity: number;
  status: string;
  section?: string | null;
  is_linked_table: boolean;
  is_linked_primary: boolean;
  linked_table_group_id?: string | null;
  linked_with_tables?: number[];
  current_order_id?: string | null;
  seated_at?: string | null;
  last_updated: string;
  created_at?: string;
  updated_at?: string;
}

export interface TableOrder {
  id: string;
  table_number: number;
  table_name?: string;
  order_items: OrderItem[];
  status: 'active' | 'completed' | 'cancelled';
  guest_count?: number;
  linked_tables?: number[];
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  menu_item_id: string;
  variant_id?: string | null;
  name: string;
  quantity: number;
  price: number;
  variant_name?: string | null;
  notes?: string | null;
  protein_type?: string | null;
  image_url?: string | null;
  customizations?: any[];
  category?: string;
}

export interface CustomerTab {
  id: string;
  table_number: number;
  tab_name: string;
  order_items: OrderItem[];
  status: 'active' | 'paid' | 'cancelled';
  guest_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OnlineOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  order_type: 'delivery' | 'collection';
  status: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  delivery_fee?: number;
  total: number;
  delivery_address?: any;
  special_instructions?: string;
  scheduled_time?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TABLE QUERIES
// ============================================================================

/**
 * Get all restaurant tables
 * Replaces: brain.get_tables()
 */
export async function getTables(): Promise<PosTable[]> {
  try {
    const { data, error } = await supabase
      .from('pos_tables')
      .select('*')
      .order('table_number');

    if (error) {
      console.error(' [supabaseQueries] Error fetching tables:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error(' [supabaseQueries] getTables failed:', error);
    throw error;
  }
}

/**
 * Get a single table by number
 */
export async function getTableByNumber(tableNumber: number): Promise<PosTable | null> {
  try {
    const { data, error } = await supabase
      .from('pos_tables')
      .select('*')
      .eq('table_number', tableNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data;
  } catch (error) {
    console.error(' [supabaseQueries] getTableByNumber failed:', error);
    throw error;
  }
}

/**
 * Update table status
 */
export async function updateTableStatus(
  tableNumber: number,
  status: string
): Promise<PosTable> {
  try {
    const { data, error } = await supabase
      .from('pos_tables')
      .update({ status })
      .eq('table_number', tableNumber)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(' [supabaseQueries] updateTableStatus failed:', error);
    throw error;
  }
}

// ============================================================================
// TABLE ORDERS QUERIES
// ============================================================================

/**
 * Get all active table orders
 * Replaces: brain.list_table_orders()
 */
export async function getTableOrders(): Promise<TableOrder[]> {
  try {
    const { data, error } = await supabase
      .from('table_orders')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(' [supabaseQueries] Error fetching table orders:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error(' [supabaseQueries] getTableOrders failed:', error);
    throw error;
  }
}

/**
 * Get table order by table number
 */
export async function getTableOrderByNumber(tableNumber: number): Promise<TableOrder | null> {
  try {
    const { data, error } = await supabase
      .from('table_orders')
      .select('*')
      .eq('table_number', tableNumber)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data;
  } catch (error) {
    console.error(' [supabaseQueries] getTableOrderByNumber failed:', error);
    throw error;
  }
}

/**
 * Create a new table order (seat guests)
 * Replaces: brain.create_table_order()
 */
export async function createTableOrder(
  tableNumber: number,
  guestCount: number,
  linkedTables: number[] = []
): Promise<TableOrder> {
  try {
    const newOrder = {
      table_number: tableNumber,
      order_items: [],
      status: 'active',
      guest_count: guestCount,
      linked_tables: linkedTables,
    };

    const { data, error } = await supabase
      .from('table_orders')
      .insert(newOrder)
      .select()
      .single();

    if (error) throw error;

    // Update table status to OCCUPIED
    await updateTableStatus(tableNumber, 'OCCUPIED');

    // Update linked tables status too
    for (const linkedTable of linkedTables) {
      await updateTableStatus(linkedTable, 'OCCUPIED');
    }

    return data;
  } catch (error) {
    console.error(' [supabaseQueries] createTableOrder failed:', error);
    throw error;
  }
}

/**
 * Update table order items
 * Replaces: brain.update_table_order()
 */
export async function updateTableOrderItems(
  tableNumber: number,
  items: any[]
): Promise<TableOrder> {
  try {
    const { data, error } = await supabase
      .from('table_orders')
      .update({ items })
      .eq('table_number', tableNumber)
      .eq('status', 'active')
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(' [supabaseQueries] updateTableOrderItems failed:', error);
    throw error;
  }
}

/**
 * Add items to existing table order
 * Replaces: brain.add_items_to_table()
 */
export async function addItemsToTableOrder(
  tableNumber: number,
  newItems: OrderItem[]
): Promise<TableOrder> {
  try {
    // Get current order
    const currentOrder = await getTableOrderByNumber(tableNumber);
    if (!currentOrder) {
      throw new Error(`No active order found for table ${tableNumber}`);
    }

    // Merge items
    const updatedItems = [...(currentOrder.order_items || []), ...newItems];
    return await updateTableOrderItems(tableNumber, updatedItems);
  } catch (error) {
    console.error(' [supabaseQueries] addItemsToTableOrder failed:', error);
    throw error;
  }
}

/**
 * Complete table order (mark as completed)
 * ENHANCED: Handles ALL tables in a linked group
 * When clearing ANY table in a linked group, ALL tables are cleared
 * Also cleans up customer_tabs associated with the orders
 * Replaces: brain.complete_table_order()
 */
export async function completeTableOrder(tableNumber: number): Promise<boolean> {
  try {
    // Step 1: Check if this table is part of a linked group (check both pos_tables and orders)
    const { data: table } = await supabase
      .from('pos_tables')
      .select('linked_table_group_id')
      .eq('table_number', tableNumber)
      .single();

    let allTableNumbers = [tableNumber];

    // Check pos_tables for linked group
    if (table?.linked_table_group_id) {
      const { data: groupTables } = await supabase
        .from('pos_tables')
        .select('table_number')
        .eq('linked_table_group_id', table.linked_table_group_id);

      if (groupTables && groupTables.length > 0) {
        allTableNumbers = groupTables.map(t => t.table_number);
      }
    }

    // Also check orders table for linked_tables (source of truth)
    const { data: activeOrder } = await supabase
      .from('orders')
      .select('id, linked_tables, table_group_id')
      .eq('table_number', tableNumber)
      .in('status', ['CREATED', 'SENT_TO_KITCHEN', 'IN_PREP', 'READY', 'SERVED', 'PENDING_PAYMENT'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // If order has linked_tables, use those
    if (activeOrder?.linked_tables && activeOrder.linked_tables.length > 0) {
      allTableNumbers = [...new Set([...allTableNumbers, ...activeOrder.linked_tables])];
    }

    // Step 2: Find all active orders for these tables (to get order IDs for cleanup)
    const { data: activeOrders } = await supabase
      .from('orders')
      .select('id')
      .in('table_number', allTableNumbers)
      .in('status', ['CREATED', 'SENT_TO_KITCHEN', 'IN_PREP', 'READY', 'SERVED', 'PENDING_PAYMENT']);

    const orderIds = activeOrders?.map(o => o.id) || [];

    // Step 3: Delete customer_tabs for these orders
    if (orderIds.length > 0) {
      const { error: tabsError } = await supabase
        .from('customer_tabs')
        .delete()
        .in('order_id', orderIds);

      if (tabsError) {
        console.warn('[supabaseQueries] Failed to delete customer_tabs:', tabsError);
        // Don't throw - continue with order completion
      }
    }

    // Also delete any orphaned tabs by table_number (legacy cleanup)
    const { error: orphanedTabsError } = await supabase
      .from('customer_tabs')
      .delete()
      .in('table_number', allTableNumbers)
      .eq('status', 'active');

    if (orphanedTabsError) {
      console.warn('[supabaseQueries] Failed to delete orphaned customer_tabs:', orphanedTabsError);
    }

    // Step 4: Complete ALL table orders in the group (legacy table_orders)
    const { error: orderError } = await supabase
      .from('table_orders')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .in('table_number', allTableNumbers)
      .eq('status', 'active');

    if (orderError) throw orderError;

    // Step 5: Mark orders as COMPLETED in the orders table (source of truth)
    if (orderIds.length > 0) {
      const { error: ordersUpdateError } = await supabase
        .from('orders')
        .update({
          status: 'COMPLETED',
          updated_at: new Date().toISOString()
        })
        .in('id', orderIds);

      if (ordersUpdateError) {
        console.warn('[supabaseQueries] Failed to update orders status:', ordersUpdateError);
      }
    }

    // Step 6: Clear linked flags AND reset status for ALL tables
    const { error: tableError } = await supabase
      .from('pos_tables')
      .update({
        status: 'AVAILABLE',
        is_linked_table: false,
        is_linked_primary: false,
        linked_table_group_id: null,
        linked_with_tables: []
      })
      .in('table_number', allTableNumbers);

    if (tableError) throw tableError;

    console.log(`[supabaseQueries] completeTableOrder: Completed and reset ${allTableNumbers.length} tables:`, allTableNumbers);
    return true;
  } catch (error) {
    console.error('[supabaseQueries] completeTableOrder failed:', error);
    throw error;
  }
}

/**
 * Unlink a table from its linked group
 * If table is linked, unlinking clears ALL tables in the group
 */
export async function unlinkTable(tableNumber: number): Promise<boolean> {
  try {
    // Get the table's current linked group
    const { data: table, error: fetchError } = await supabase
      .from('pos_tables')
      .select('is_linked_primary, linked_table_group_id, linked_with_tables')
      .eq('table_number', tableNumber)
      .single();

    if (fetchError || !table) throw fetchError;

    if (!table.linked_table_group_id) {
      // Not linked, nothing to do
      return true;
    }

    // Get all tables in this group
    const { data: groupTables, error: groupError } = await supabase
      .from('pos_tables')
      .select('table_number')
      .eq('linked_table_group_id', table.linked_table_group_id);

    if (groupError) throw groupError;

    // Reset linked flags for ALL tables in the group (but keep them OCCUPIED)
    const tableNumbers = groupTables?.map(t => t.table_number) || [tableNumber];

    const { error: updateError } = await supabase
      .from('pos_tables')
      .update({
        is_linked_table: false,
        is_linked_primary: false,
        linked_table_group_id: null,
        linked_with_tables: []
      })
      .in('table_number', tableNumbers);

    if (updateError) throw updateError;

    console.log(`[supabaseQueries] unlinkTable: Unlinked ${tableNumbers.length} tables from group`);
    return true;
  } catch (error) {
    console.error('[supabaseQueries] unlinkTable failed:', error);
    throw error;
  }
}

/**
 * Mark bill as printed for a table order
 * Updates the bill_printed_at timestamp for session tracking
 */
export async function markBillPrinted(tableNumber: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('table_orders')
      .update({
        bill_printed_at: new Date().toISOString()
      })
      .eq('table_number', tableNumber)
      .eq('status', 'active');

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(' [supabaseQueries] markBillPrinted failed:', error);
    throw error;
  }
}

/**
 * Reset table to available
 * Replaces: brain.reset_table_to_available()
 */
export async function resetTableToAvailable(tableNumber: number): Promise<boolean> {
  try {
    // Cancel any active orders for this table
    await supabase
      .from('table_orders')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('table_number', tableNumber)
      .eq('status', 'active');

    // Reset table status
    await updateTableStatus(tableNumber, 'AVAILABLE');

    return true;
  } catch (error) {
    console.error(' [supabaseQueries] resetTableToAvailable failed:', error);
    throw error;
  }
}

// ============================================================================
// CUSTOMER TAB QUERIES
// ============================================================================

/**
 * Get customer tabs for a specific table
 * @deprecated Use getCustomerTabsForOrder() instead - tabs should be scoped to orders
 * Replaces: brain.list_customer_tabs_for_table()
 */
export async function getCustomerTabsForTable(tableNumber: number): Promise<CustomerTab[]> {
  try {
    const { data, error } = await supabase
      .from('customer_tabs')
      .select('*')
      .eq('table_number', tableNumber)
      .eq('status', 'active')
      .order('created_at');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(' [supabaseQueries] getCustomerTabsForTable failed:', error);
    throw error;
  }
}

/**
 * Get customer tabs for a specific order
 * This is the preferred method - tabs are scoped to orders, not tables
 */
export async function getCustomerTabsForOrder(orderId: string): Promise<CustomerTab[]> {
  try {
    const { data, error } = await supabase
      .from('customer_tabs')
      .select('*')
      .eq('order_id', orderId)
      .eq('status', 'active')
      .order('created_at');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[supabaseQueries] getCustomerTabsForOrder failed:', error);
    throw error;
  }
}

/**
 * Create a new customer tab
 * Replaces: brain.create_customer_tab()
 * @param orderId - Required: The order this tab belongs to (scopes tab to order lifecycle)
 */
export async function createCustomerTab(
  tableNumber: number,
  tabName: string,
  orderId: string,
  guestId?: string
): Promise<CustomerTab> {
  try {
    const newTab = {
      table_number: tableNumber,
      tab_name: tabName,
      order_id: orderId,
      order_items: [],
      status: 'active',
      guest_id: guestId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('customer_tabs')
      .insert(newTab)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(' [supabaseQueries] createCustomerTab failed:', error);
    throw error;
  }
}

/**
 * Update customer tab
 * Replaces: brain.update_customer_tab()
 */
export async function updateCustomerTab(
  tabId: string,
  updates: { status?: string; total_amount?: number; notes?: string }
): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('customer_tabs')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', tabId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[supabaseQueries] updateCustomerTab failed:', error);
    throw error;
  }
}

/**
 * Add items to customer tab
 * Replaces: brain.add_items_to_customer_tab()
 */
export async function addItemsToCustomerTab(
  tabId: string,
  newItems: OrderItem[]
): Promise<CustomerTab> {
  try {
    // Get current tab
    const { data: currentTab, error: fetchError } = await supabase
      .from('customer_tabs')
      .select('*')
      .eq('id', tabId)
      .single();

    if (fetchError) throw fetchError;

    // Merge items
    const updatedItems = [...(currentTab.order_items || []), ...newItems];
    return await updateCustomerTab(tabId, { order_items: updatedItems });
  } catch (error) {
    console.error(' [supabaseQueries] addItemsToCustomerTab failed:', error);
    throw error;
  }
}

/**
 * Close customer tab (mark as paid)
 * Replaces: brain.close_customer_tab()
 */
export async function closeCustomerTab(tabId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('customer_tabs')
      .update({
        status: 'paid',
        closed_at: new Date().toISOString()
      })
      .eq('id', tabId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(' [supabaseQueries] closeCustomerTab failed:', error);
    throw error;
  }
}

/**
 * Delete customer tab
 * Replaces: brain.delete_customer_tab()
 */
export async function deleteCustomerTab(tabId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('customer_tabs')
      .delete()
      .eq('id', tabId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(' [supabaseQueries] deleteCustomerTab failed:', error);
    throw error;
  }
}

// ============================================================================
// ONLINE ORDERS QUERIES
// ============================================================================

/**
 * Get all online orders
 * Replaces: brain.list_online_orders()
 */
export async function getOnlineOrders(
  status?: string,
  limit: number = 50
): Promise<OnlineOrder[]> {
  try {
    let query = supabase
      .from('online_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error(' [supabaseQueries] Error fetching online orders:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error(' [supabaseQueries] getOnlineOrders failed:', error);
    throw error;
  }
}

/**
 * Get recent online orders (pending and confirmed)
 */
export async function getPendingOnlineOrders(): Promise<OnlineOrder[]> {
  try {
    const { data, error } = await supabase
      .from('online_orders')
      .select('*')
      .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(' [supabaseQueries] getPendingOnlineOrders failed:', error);
    throw error;
  }
}

/**
 * Update online order status
 */
export async function updateOnlineOrderStatus(
  orderId: string,
  status: string
): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('online_orders')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[supabaseQueries] updateOnlineOrderStatus failed:', error);
    throw error;
  }
}

// ============================================================================
// UNIFIED ORDERS QUERIES (Kitchen Display)
// ============================================================================

/**
 * Get all unified orders (for kitchen display)
 * Replaces: brain.list_unified_orders()
 */
export async function getUnifiedOrders(
  status?: string[],
  limit: number = 100
): Promise<any[]> {
  try {
    let query = supabase
      .from('unified_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status && status.length > 0) {
      query = query.in('status', status);
    }

    const { data, error } = await query;

    if (error) {
      // If unified_orders table doesn't exist, combine from other sources
      if (error.code === '42P01') {
        // Combine online_orders and table_orders
        const [onlineOrders, tableOrders] = await Promise.all([
          getOnlineOrders(undefined, limit),
          getTableOrders()
        ]);

        return [
          ...onlineOrders.map(o => ({ ...o, source: 'online' })),
          ...tableOrders.map(o => ({ ...o, source: 'dine_in' }))
        ];
      }
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error(' [supabaseQueries] getUnifiedOrders failed:', error);
    throw error;
  }
}

// ============================================================================
// MENU QUERIES
// ============================================================================

/**
 * Get menu items with variants embedded and image URLs resolved
 * Replaces: brain.get_menu_with_ordering()
 *
 * Image Resolution: menu_items.image_asset_id → media_assets.url
 * This matches the backend's unified_menu_business_logic pattern.
 */
/**
 * Options for getMenuWithOrdering query
 */
export interface GetMenuOptions {
  /** Include inactive items (for admin view) */
  includeInactive?: boolean;
  /** Only return published items (for POS/Online Orders) */
  publishedOnly?: boolean;
}

export async function getMenuWithOrdering(options: GetMenuOptions | boolean = false): Promise<{
  success: boolean;
  data: { categories: any[]; items: any[] };
}> {
  // Handle legacy boolean parameter for backwards compatibility
  const opts: GetMenuOptions = typeof options === 'boolean'
    ? { includeInactive: options }
    : options;

  const { includeInactive = false, publishedOnly = false } = opts;

  try {
    // Build items query - conditionally filter by is_active for POS vs Admin
    let itemsQuery = supabase
      .from('menu_items')
      .select('*')
      .order('display_order');

    // Only filter by is_active if NOT including inactive items (POS mode)
    if (!includeInactive) {
      itemsQuery = itemsQuery.eq('is_active', true);
    }

    // 🎯 DRAFT/PUBLISH WORKFLOW: Filter for published items only
    // For POS Desktop and Online Orders, only show items that have been published
    // Admin Portal should pass publishedOnly: false to see draft items
    if (publishedOnly) {
      itemsQuery = itemsQuery.not('published_at', 'is', null);
    }

    // Fetch categories, items, variants, protein types, AND media_assets in parallel
    const [categoriesResult, itemsResult, variantsResult, proteinTypesResult, mediaAssetsResult] = await Promise.all([
      supabase
        .from('menu_categories')
        .select('*')
        .order('display_order'),
      itemsQuery,
      supabase
        .from('item_variants')
        .select('*, menu_protein_types:protein_type_id(id, name)')
        .order('menu_item_id'),
      supabase
        .from('menu_protein_types')
        .select('*')
        .order('name'),
      // Fetch media assets for image URL resolution (matching backend pattern)
      supabase
        .from('media_assets')
        .select('id, url, friendly_name, square_webp_url, square_jpeg_url, widescreen_webp_url, widescreen_jpeg_url, thumbnail_webp_url, thumbnail_jpeg_url')
    ]);

    if (categoriesResult.error) throw categoriesResult.error;
    if (itemsResult.error) throw itemsResult.error;

    const categories = categoriesResult.data || [];
    const items = itemsResult.data || [];
    const variants = variantsResult.data || [];
    const proteinTypes = proteinTypesResult.data || [];
    const mediaAssets = mediaAssetsResult.data || [];

    // Create media asset lookup map: asset_id → { url, variants }
    const mediaLookup: Record<string, {
      url: string;
      square_webp_url?: string | null;
      square_jpeg_url?: string | null;
      widescreen_webp_url?: string | null;
      widescreen_jpeg_url?: string | null;
      thumbnail_webp_url?: string | null;
      thumbnail_jpeg_url?: string | null;
    }> = {};

    mediaAssets.forEach((asset: any) => {
      mediaLookup[asset.id] = {
        url: asset.url,
        square_webp_url: asset.square_webp_url,
        square_jpeg_url: asset.square_jpeg_url,
        widescreen_webp_url: asset.widescreen_webp_url,
        widescreen_jpeg_url: asset.widescreen_jpeg_url,
        thumbnail_webp_url: asset.thumbnail_webp_url,
        thumbnail_jpeg_url: asset.thumbnail_jpeg_url
      };
    });

    // Group variants by menu_item_id and resolve variant images
    const variantsByItem: Record<string, any[]> = {};
    variants.forEach(variant => {
      const menuItemId = variant.menu_item_id;
      if (!variantsByItem[menuItemId]) {
        variantsByItem[menuItemId] = [];
      }

      // Resolve variant's image_asset_id if it has one
      let variantImageUrl = variant.image_url;
      let variantImageVariants = null;

      if (variant.image_asset_id && mediaLookup[variant.image_asset_id]) {
        const variantMedia = mediaLookup[variant.image_asset_id];
        variantImageUrl = variantMedia.url;
        variantImageVariants = {
          square: { webp: variantMedia.square_webp_url, jpeg: variantMedia.square_jpeg_url },
          widescreen: { webp: variantMedia.widescreen_webp_url, jpeg: variantMedia.widescreen_jpeg_url },
          thumbnail: { webp: variantMedia.thumbnail_webp_url, jpeg: variantMedia.thumbnail_jpeg_url }
        };
      }

      variantsByItem[menuItemId].push({
        ...variant,
        image_url: variantImageUrl,
        display_image_url: variantImageUrl,  // ✅ Set canonical display URL for StaffVariantSelector
        image_variants: variantImageVariants
      });
    });

    // Embed variants into items AND resolve image URLs from media_assets
    const enrichedItems = items.map(item => {
      // Resolve item's image_asset_id to actual URL
      let itemImageUrl = item.image_url; // fallback to direct image_url if exists
      let itemImageVariants = null;

      if (item.image_asset_id && mediaLookup[item.image_asset_id]) {
        const mediaAsset = mediaLookup[item.image_asset_id];
        itemImageUrl = mediaAsset.url;
        itemImageVariants = {
          square: { webp: mediaAsset.square_webp_url, jpeg: mediaAsset.square_jpeg_url },
          widescreen: { webp: mediaAsset.widescreen_webp_url, jpeg: mediaAsset.widescreen_jpeg_url },
          thumbnail: { webp: mediaAsset.thumbnail_webp_url, jpeg: mediaAsset.thumbnail_jpeg_url }
        };
      }

      return {
        ...item,
        image_url: itemImageUrl,
        image_variants: itemImageVariants,
        variants: variantsByItem[item.id] || []
      };
    });

    // Map categories and resolve category images
    const mappedCategories = categories.map((cat: any) => {
      let categoryImageUrl = cat.image_url;

      if (cat.image_asset_id && mediaLookup[cat.image_asset_id]) {
        categoryImageUrl = mediaLookup[cat.image_asset_id].url;
      }

      return {
        ...cat,
        image_url: categoryImageUrl,
        active: cat.is_active ?? true,                           // ✅ Map is_active → active (required by realtimeMenuStore)
        parent_category_id: cat.parent_category_id ?? cat.parent_id  // ✅ Ensure parent_category_id is set
      };
    });

    // Debug logging in dev mode
    if (isDev) {
      const itemsWithImages = enrichedItems.filter((i: any) => i.image_url);
      const itemsWithoutImages = enrichedItems.filter((i: any) => !i.image_url);

      // Log first few items for debugging
      if (itemsWithImages.length > 0) {
      }
      if (itemsWithoutImages.length > 0 && itemsWithoutImages.length <= 5) {
      }
    }

    return {
      success: true,
      data: {
        categories: mappedCategories,
        items: enrichedItems
      }
    };
  } catch (error) {
    console.error(' [supabaseQueries] getMenuWithOrdering failed:', error);
    return {
      success: false,
      data: { categories: [], items: [] }
    };
  }
}

/**
 * Get menu items
 */
export async function getMenuItems(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(' [supabaseQueries] getMenuItems failed:', error);
    throw error;
  }
}

/**
 * Get menu categories
 */
export async function getMenuCategories(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .order('display_order');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(' [supabaseQueries] getMenuCategories failed:', error);
    throw error;
  }
}

/**
 * Get item variants
 */
export async function getItemVariants(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('item_variants')
      .select('*, menu_protein_types:protein_type_id(id, name)')
      .order('menu_item_id');

    if (error) throw error;

    // Enhance with protein_type_name
    return (data || []).map(variant => ({
      ...variant,
      protein_type_name: variant.menu_protein_types?.name || null
    }));
  } catch (error) {
    console.error(' [supabaseQueries] getItemVariants failed:', error);
    throw error;
  }
}

/**
 * Get protein types
 */
export async function getProteinTypes(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('menu_protein_types')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(' [supabaseQueries] getProteinTypes failed:', error);
    throw error;
  }
}

/**
 * Get customizations
 * Replaces: brain.get_customizations()
 *
 * @param publishedOnly - Filter by published status for POS/Online contexts (default: false)
 *                        When true, only returns customizations with published_at set
 */
export async function getCustomizations(publishedOnly: boolean = false): Promise<any[]> {
  try {
    let query = supabase
      .from('menu_customizations')
      .select('*')
      .eq('is_active', true)
      .order('menu_order');

    // 🎯 DRAFT/PUBLISH: For POS/Online contexts, only show published customizations
    if (publishedOnly) {
      query = query.not('published_at', 'is', null);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(' [supabaseQueries] getCustomizations failed:', error);
    throw error;
  }
}

/**
 * Get set meals
 * Replaces: brain.list_set_meals()
 *
 * @param activeOnly - Filter by active status (default: true)
 * @param publishedOnly - Filter by published status for POS/Online contexts (default: false)
 */
export async function getSetMeals(
  activeOnly: boolean = true,
  publishedOnly: boolean = false
): Promise<any[]> {
  try {
    let query = supabase
      .from('set_meals')
      .select('*')
      .order('name');

    if (activeOnly) {
      query = query.eq('active', true);
    }

    // Filter by published_at for POS/Online contexts (same pattern as menu items)
    if (publishedOnly) {
      query = query.not('published_at', 'is', null);
    }

    const { data, error } = await query;

    if (error) {
      // If set_meals table doesn't exist, return empty array
      if (error.code === '42P01') {
        return [];
      }
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error(' [supabaseQueries] getSetMeals failed:', error);
    return [];
  }
}

/**
 * Get POS bundle (lightweight menu data for fast startup)
 * Replaces: brain.get_pos_bundle()
 */
export async function getPOSBundle(): Promise<{
  success: boolean;
  categories: any[];
  items: any[];
  itemVariants: any[];
}> {
  try {
    // Fetch essential data for POS startup INCLUDING media_assets and item_variants
    const [categoriesResult, itemsResult, mediaAssetsResult, variantsResult] = await Promise.all([
      supabase
        .from('menu_categories')
        .select('id, name, parent_category_id, sort_order, is_active')
        .eq('is_active', true)
        .order('sort_order'),
      supabase
        .from('menu_items')
        .select('id, name, category_id, base_price, image_asset_id, display_order, is_active, item_code')
        .eq('is_active', true)
        .not('published_at', 'is', null)  // 🎯 DRAFT/PUBLISH: Only show published items on POS
        .order('display_order'),
      supabase
        .from('media_assets')
        .select('id, url'),
      supabase
        .from('item_variants')
        .select('*, menu_protein_types:protein_type_id(id, name)')
        .order('menu_item_id')
    ]);

    if (categoriesResult.error) throw categoriesResult.error;
    if (itemsResult.error) throw itemsResult.error;

    // Create media asset lookup map for image URL resolution
    const mediaLookup: Record<string, string> = {};
    (mediaAssetsResult.data || []).forEach((asset: any) => {
      mediaLookup[asset.id] = asset.url;
    });

    const categories = (categoriesResult.data || []).map((cat: any) => ({
      ...cat,
      display_order: cat.sort_order,
      print_order: cat.sort_order,
      parent_category_id: cat.parent_category_id,
      active: cat.is_active
    }));

    // Resolve image_asset_id to actual URL using media_assets lookup
    const items = (itemsResult.data || []).map((item: any) => ({
      ...item,
      price: item.base_price,
      image_url: item.image_asset_id ? mediaLookup[item.image_asset_id] || null : null,
      active: item.is_active
    }));

    // Resolve variant image_asset_id to actual URLs
    const itemVariants = (variantsResult?.data || []).map((variant: any) => ({
      ...variant,
      image_url: variant.image_url || (variant.image_asset_id ? mediaLookup[variant.image_asset_id] || null : null)
    }));

    return {
      success: true,
      categories,
      items,
      itemVariants
    };
  } catch (error) {
    console.error(' [supabaseQueries] getPOSBundle failed:', error);
    return {
      success: false,
      categories: [],
      items: [],
      itemVariants: []
    };
  }
}

/**
 * Get item details (full item with variants)
 * Replaces: brain.item_details()
 */
export async function getItemDetails(itemId: string): Promise<{
  success: boolean;
  data?: { item: any; variants: any[] };
}> {
  try {
    const [itemResult, variantsResult] = await Promise.all([
      supabase
        .from('menu_items')
        .select('*')
        .eq('id', itemId)
        .single(),
      supabase
        .from('item_variants')
        .select('*, menu_protein_types:protein_type_id(id, name)')
        .eq('menu_item_id', itemId)
        .order('display_order')
    ]);

    if (itemResult.error) throw itemResult.error;

    const variants = (variantsResult.data || []).map(variant => ({
      ...variant,
      protein_type_name: variant.menu_protein_types?.name || null
    }));

    return {
      success: true,
      data: {
        item: {
          ...itemResult.data,
          active: itemResult.data.is_active ?? itemResult.data.active ?? true
        },
        variants
      }
    };
  } catch (error) {
    console.error(' [supabaseQueries] getItemDetails failed:', error);
    return { success: false };
  }
}

/**
 * Get category items (all items in a category with variants)
 * Replaces: brain.category_items()
 */
export async function getCategoryItems(categoryId: string): Promise<{
  success: boolean;
  data?: { items: any[] };
}> {
  try {
    const [itemsResult, variantsResult] = await Promise.all([
      supabase
        .from('menu_items')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('display_order'),
      supabase
        .from('item_variants')
        .select('*, menu_protein_types:protein_type_id(id, name)')
        .order('menu_item_id')
    ]);

    if (itemsResult.error) throw itemsResult.error;

    const items = itemsResult.data || [];
    const variants = variantsResult.data || [];

    // Group variants by menu_item_id
    const variantsByItem: Record<string, any[]> = {};
    variants.forEach(variant => {
      if (!variantsByItem[variant.menu_item_id]) {
        variantsByItem[variant.menu_item_id] = [];
      }
      variantsByItem[variant.menu_item_id].push({
        ...variant,
        protein_name: variant.menu_protein_types?.name || null
      });
    });

    // Enrich items with variants
    const enrichedItems = items.map(item => ({
      ...item,
      active: item.is_active ?? item.active ?? true,
      variants: variantsByItem[item.id] || []
    }));

    return {
      success: true,
      data: { items: enrichedItems }
    };
  } catch (error) {
    console.error(' [supabaseQueries] getCategoryItems failed:', error);
    return { success: false };
  }
}

// ============================================================================
// RECEIPT TEMPLATE QUERIES
// ============================================================================

/**
 * Get template assignment for a specific order mode
 * Replaces: brain.get_template_assignment()
 */
export async function getTemplateAssignment(orderMode: string): Promise<{
  order_mode: string;
  customer_template_id: string | null;
  kitchen_template_id: string | null;
} | null> {
  try {
    const { data, error } = await supabase
      .from('template_assignments')
      .select('*')
      .eq('order_mode', orderMode)
      .single();

    if (error) {
      // PGRST116 = no rows found - not an error, just no assignment
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error(' [supabaseQueries] getTemplateAssignment failed:', error);
    return null;
  }
}

/**
 * Get all template assignments
 * Replaces: brain.get_template_assignments()
 */
export async function getTemplateAssignments(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('template_assignments')
      .select('*');

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error(' [supabaseQueries] getTemplateAssignments failed:', error);
    return [];
  }
}

/**
 * Get receipt template by ID
 * Replaces: brain.get_receipt_template()
 */
export async function getReceiptTemplate(templateId: string): Promise<{
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  design_data: any;
  paper_width: number;
  created_at: string;
  updated_at: string;
} | null> {
  try {
    const { data, error } = await supabase
      .from('receipt_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error(' [supabaseQueries] getReceiptTemplate failed:', error);
    return null;
  }
}

/**
 * List all receipt templates (optionally filtered by user)
 * Replaces: brain.list_receipt_templates()
 */
export async function listReceiptTemplates(userId?: string): Promise<any[]> {
  try {
    let query = supabase.from('receipt_templates').select('*').order('name');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error(' [supabaseQueries] listReceiptTemplates failed:', error);
    return [];
  }
}

/**
 * Create a new receipt template
 * Replaces: brain.create_receipt_template()
 */
export async function createReceiptTemplate(template: {
  user_id?: string;
  name: string;
  description?: string;
  header_html?: string;
  body_html?: string;
  footer_html?: string;
  styles_json?: any;
}): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('receipt_templates')
      .insert([template])
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error(' [supabaseQueries] createReceiptTemplate failed:', error);
    return null;
  }
}

/**
 * Update an existing receipt template
 * Replaces: brain.update_receipt_template()
 */
export async function updateReceiptTemplate(
  templateId: string,
  updates: {
    name?: string;
    description?: string;
    header_html?: string;
    body_html?: string;
    footer_html?: string;
    styles_json?: any;
  }
): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('receipt_templates')
      .update(updates)
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error(' [supabaseQueries] updateReceiptTemplate failed:', error);
    return null;
  }
}

/**
 * Delete a receipt template
 * Replaces: brain.delete_receipt_template()
 */
export async function deleteReceiptTemplate(templateId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('receipt_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error(' [supabaseQueries] deleteReceiptTemplate failed:', error);
    return false;
  }
}

/**
 * Set template assignment for an order mode
 * Replaces: brain.set_template_assignment()
 */
export async function setTemplateAssignment(params: {
  order_mode: string;
  customer_template_id?: string | null;
  kitchen_template_id?: string | null;
}): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('template_assignments')
      .upsert([params], { onConflict: 'order_mode' });

    if (error) throw error;

    return true;
  } catch (error) {
    console.error(' [supabaseQueries] setTemplateAssignment failed:', error);
    return false;
  }
}

// ============================================================================
// POS SETTINGS QUERIES
// ============================================================================

/**
 * POS Settings types
 */
export interface POSServiceChargeSettings {
  enabled: boolean;
  percentage: number;
}

export interface POSDeliveryChargeSettings {
  enabled: boolean;
  amount: number;
}

export interface POSDeliverySettings {
  radius_miles: number;
  minimum_order_value: number;
  allowed_postcodes: string[];
}

export interface POSSettings {
  service_charge: POSServiceChargeSettings;
  delivery_charge: POSDeliveryChargeSettings;
  delivery: POSDeliverySettings;
  variant_carousel_enabled?: boolean;
}

/**
 * Get POS settings
 * Replaces: brain.get_pos_settings()
 */
export async function getPOSSettings(): Promise<{ settings: POSSettings | null }> {
  try {
    const { data, error } = await supabase
      .from('pos_settings')
      .select('*')
      .single();

    if (error) {
      // PGRST116 = no rows found, 42P01 = table doesn't exist, or 406 status = RLS blocking
      const isExpectedError = error.code === 'PGRST116' || error.code === '42P01' ||
        String(error.message).includes('406') || String(error.code).includes('406');
      if (isExpectedError) {
        return { settings: null };
      }
      throw error;
    }

    return { settings: data?.settings || data };
  } catch (error) {
    console.error(' [supabaseQueries] getPOSSettings failed:', error);
    return { settings: null };
  }
}

/**
 * Save POS settings
 * Replaces: brain.save_pos_settings()
 */
export async function savePOSSettings(settings: POSSettings): Promise<{ success: boolean; message?: string }> {
  try {
    const { error } = await supabase
      .from('pos_settings')
      .upsert({
        id: 'default',
        settings,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error(' [supabaseQueries] savePOSSettings failed:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Failed to save settings' };
  }
}

// ============================================================================
// RESTAURANT SETTINGS QUERIES
// ============================================================================

/**
 * Restaurant Settings types
 */
export interface BusinessProfile {
  name: string;
  address: string;
  postcode: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  tax_id: string;
  logo_url: string;
}

export interface OpeningHours {
  day: string;
  open: string;
  close: string;
  is_closed: boolean;
}

export interface RestaurantDeliverySettings {
  radius_km: number;
  postcodes: string[];
  min_order: number;
  delivery_fee: number;
}

export interface KitchenStatus {
  is_open: boolean;
  message: string;
}

export interface AIMessages {
  greeting: string;
  closing: string;
  busy_message: string;
}

export interface RestaurantSettings {
  business_profile: BusinessProfile;
  opening_hours: OpeningHours[];
  delivery: RestaurantDeliverySettings;
  kitchen_status: KitchenStatus;
  ai_messages: AIMessages;
}

/**
 * Get restaurant settings
 * Replaces: brain.get_restaurant_settings()
 */
export async function getRestaurantSettings(): Promise<{ success: boolean; settings?: RestaurantSettings; message?: string }> {
  try {
    const { data, error } = await supabase
      .from('restaurant_settings')
      .select('*')
      .single();

    if (error) {
      // PGRST116 = no rows found, 42P01 = table doesn't exist, or 406 status = RLS blocking
      const isExpectedError = error.code === 'PGRST116' || error.code === '42P01' ||
        String(error.message).includes('406') || String(error.code).includes('406');
      if (isExpectedError) {
        return { success: true, settings: undefined };
      }
      throw error;
    }

    return { success: true, settings: data };
  } catch (error) {
    console.error(' [supabaseQueries] getRestaurantSettings failed:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Failed to fetch settings' };
  }
}

/**
 * Save restaurant settings
 * Replaces: brain.save_restaurant_settings()
 */
export async function saveRestaurantSettings(updates: {
  settings?: Partial<RestaurantSettings>;
  profile?: Partial<BusinessProfile>;
  delivery?: Partial<RestaurantDeliverySettings>;
}): Promise<{ success: boolean; message?: string }> {
  try {
    // First, get current settings
    const { data: current } = await supabase
      .from('restaurant_settings')
      .select('*')
      .single();

    // Build update payload
    let updatePayload: any = {
      id: 'default',
      updated_at: new Date().toISOString()
    };

    if (updates.settings) {
      // Full settings update
      updatePayload = { ...updatePayload, ...updates.settings };
    }

    if (updates.profile) {
      // Profile-only update
      updatePayload.business_profile = {
        ...(current?.business_profile || {}),
        ...updates.profile
      };
    }

    if (updates.delivery) {
      // Delivery-only update
      updatePayload.delivery = {
        ...(current?.delivery || {}),
        ...updates.delivery
      };
    }

    const { error } = await supabase
      .from('restaurant_settings')
      .upsert(updatePayload, {
        onConflict: 'id'
      });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error(' [supabaseQueries] saveRestaurantSettings failed:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Failed to save settings' };
  }
}

// ============================================================================
// ORDER PROCESSING QUERIES
// ============================================================================

/**
 * Create POS order
 * Replaces: brain.create_pos_order()
 */
export async function createPOSOrder(payload: {
  order_id: string;
  order_type: string;
  items: any[];
  subtotal: number;
  total_amount: number;
  payment_method?: string;
  payment_status?: string;
  table_number?: string;
  guest_count?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  notes?: string;
}): Promise<{ success: boolean; order_number?: string; database_order_id?: string; error?: string }> {
  try {
    // Generate order number if not provided
    const orderNumber = `POS-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await supabase
      .from('pos_orders')
      .insert({
        ...payload,
        order_number: orderNumber,
        created_at: new Date().toISOString()
      })
      .select('id, order_number')
      .single();

    if (error) throw error;

    return {
      success: true,
      order_number: data.order_number,
      database_order_id: data.id
    };
  } catch (error) {
    console.error(' [supabaseQueries] createPOSOrder failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order'
    };
  }
}

// ============================================================================
// CUSTOMER TAB WRITE OPERATIONS
// ============================================================================

/**
 * Create customer tab directly
 * Replaces: brain.create_customer_tab()
 * @param orderId - Required: The order this tab belongs to (scopes tab to order lifecycle)
 */
export async function createCustomerTabDirect(
  tableNumber: number,
  tabName: string,
  orderId: string,
  guestId?: string
): Promise<{ success: boolean; customer_tab?: any }> {
  try {
    const newTab = {
      table_number: tableNumber,
      tab_name: tabName,
      order_id: orderId,
      order_items: [],
      status: 'active',
      guest_id: guestId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('customer_tabs')
      .insert(newTab)
      .select()
      .single();

    if (error) throw error;

    return { success: true, customer_tab: data };
  } catch (error) {
    console.error(' [supabaseQueries] createCustomerTabDirect failed:', error);
    return { success: false };
  }
}

/**
 * Add items to customer tab
 * Replaces: brain.add_items_to_customer_tab()
 */
export async function addItemsToCustomerTabDirect(
  tabId: string,
  items: any[]
): Promise<{ success: boolean }> {
  try {
    // Get current tab
    const { data: currentTab, error: fetchError } = await supabase
      .from('customer_tabs')
      .select('order_items')
      .eq('id', tabId)
      .single();

    if (fetchError) throw fetchError;

    // Merge items
    const updatedItems = [...(currentTab?.order_items || []), ...items];

    // Update tab
    const { error: updateError } = await supabase
      .from('customer_tabs')
      .update({
        order_items: updatedItems,
        updated_at: new Date().toISOString()
      })
      .eq('id', tabId);

    if (updateError) throw updateError;

    // Also insert into dine_in_order_items for real-time updates
    const itemsToInsert = items.map(item => ({
      customer_tab_id: tabId,
      menu_item_id: item.menu_item_id || item.id,
      item_name: item.name,
      quantity: item.quantity || 1,
      unit_price: item.price,
      line_total: (item.price || 0) * (item.quantity || 1),
      variant_id: item.variant_id || null,
      variant_name: item.variant_name || null,
      notes: item.notes || null,
      protein_type: item.protein_type || null,
      customizations: item.customizations || [],
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    await supabase.from('dine_in_order_items').insert(itemsToInsert);

    return { success: true };
  } catch (error) {
    console.error(' [supabaseQueries] addItemsToCustomerTabDirect failed:', error);
    return { success: false };
  }
}

/**
 * Update customer tab
 * Replaces: brain.update_customer_tab()
 */
export async function updateCustomerTabDirect(
  tabId: string,
  updates: { status?: string; total_amount?: number; notes?: string }
): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase
      .from('customer_tabs')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', tabId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error(' [supabaseQueries] updateCustomerTabDirect failed:', error);
    return { success: false };
  }
}

/**
 * Close customer tab
 * Replaces: brain.close_customer_tab()
 */
export async function closeCustomerTabDirect(tabId: string): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase
      .from('customer_tabs')
      .update({
        status: 'paid',
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', tabId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error(' [supabaseQueries] closeCustomerTabDirect failed:', error);
    return { success: false };
  }
}

/**
 * Split customer tab
 * Replaces: brain.split_customer_tab()
 */
export async function splitCustomerTabDirect(
  sourceTabId: string,
  newTabName: string,
  itemIndices: number[],
  guestId?: string | null
): Promise<{ success: boolean; new_tab_id?: string }> {
  try {
    // Get source tab
    const { data: sourceTab, error: fetchError } = await supabase
      .from('customer_tabs')
      .select('*')
      .eq('id', sourceTabId)
      .single();

    if (fetchError) throw fetchError;

    // Extract items to move
    const sourceItems = sourceTab.order_items || [];
    const itemsToMove = itemIndices.map(i => sourceItems[i]).filter(Boolean);
    const remainingItems = sourceItems.filter((_: any, i: number) => !itemIndices.includes(i));

    // Create new tab with moved items
    const { data: newTab, error: createError } = await supabase
      .from('customer_tabs')
      .insert({
        table_number: sourceTab.table_number,
        tab_name: newTabName,
        order_items: itemsToMove,
        status: 'active',
        guest_id: guestId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) throw createError;

    // Update source tab
    const { error: updateError } = await supabase
      .from('customer_tabs')
      .update({
        order_items: remainingItems,
        updated_at: new Date().toISOString()
      })
      .eq('id', sourceTabId);

    if (updateError) throw updateError;

    return { success: true, new_tab_id: newTab.id };
  } catch (error) {
    console.error(' [supabaseQueries] splitCustomerTabDirect failed:', error);
    return { success: false };
  }
}

/**
 * Merge customer tabs
 * Replaces: brain.merge_customer_tabs()
 */
export async function mergeCustomerTabsDirect(
  sourceTabId: string,
  targetTabId: string
): Promise<{ success: boolean }> {
  try {
    // Get both tabs
    const { data: tabs, error: fetchError } = await supabase
      .from('customer_tabs')
      .select('*')
      .in('id', [sourceTabId, targetTabId]);

    if (fetchError) throw fetchError;

    const sourceTab = tabs?.find(t => t.id === sourceTabId);
    const targetTab = tabs?.find(t => t.id === targetTabId);

    if (!sourceTab || !targetTab) {
      throw new Error('Source or target tab not found');
    }

    // Merge items
    const mergedItems = [
      ...(targetTab.order_items || []),
      ...(sourceTab.order_items || [])
    ];

    // Update target tab
    const { error: updateError } = await supabase
      .from('customer_tabs')
      .update({
        order_items: mergedItems,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetTabId);

    if (updateError) throw updateError;

    // Delete source tab
    const { error: deleteError } = await supabase
      .from('customer_tabs')
      .delete()
      .eq('id', sourceTabId);

    if (deleteError) throw deleteError;

    return { success: true };
  } catch (error) {
    console.error(' [supabaseQueries] mergeCustomerTabsDirect failed:', error);
    return { success: false };
  }
}

/**
 * Move items between customer tabs
 * Replaces: brain.move_items_between_customer_tabs()
 */
export async function moveItemsBetweenTabsDirect(
  sourceTabId: string,
  targetTabId: string,
  itemIndices: number[]
): Promise<{ success: boolean }> {
  try {
    // Get both tabs
    const { data: tabs, error: fetchError } = await supabase
      .from('customer_tabs')
      .select('*')
      .in('id', [sourceTabId, targetTabId]);

    if (fetchError) throw fetchError;

    const sourceTab = tabs?.find(t => t.id === sourceTabId);
    const targetTab = tabs?.find(t => t.id === targetTabId);

    if (!sourceTab || !targetTab) {
      throw new Error('Source or target tab not found');
    }

    // Extract items to move
    const sourceItems = sourceTab.order_items || [];
    const itemsToMove = itemIndices.map(i => sourceItems[i]).filter(Boolean);
    const remainingItems = sourceItems.filter((_: any, i: number) => !itemIndices.includes(i));

    // Update source tab
    await supabase
      .from('customer_tabs')
      .update({
        order_items: remainingItems,
        updated_at: new Date().toISOString()
      })
      .eq('id', sourceTabId);

    // Update target tab
    await supabase
      .from('customer_tabs')
      .update({
        order_items: [...(targetTab.order_items || []), ...itemsToMove],
        updated_at: new Date().toISOString()
      })
      .eq('id', targetTabId);

    return { success: true };
  } catch (error) {
    console.error(' [supabaseQueries] moveItemsBetweenTabsDirect failed:', error);
    return { success: false };
  }
}

// ============================================================================
// MENU CRUD OPERATIONS
// ============================================================================

/**
 * Sync menu item variants - handles create, update, delete of variants
 * @param menuItemId - The menu item ID
 * @param variants - Array of variant objects from the form
 */
async function syncMenuItemVariants(menuItemId: string, variants: any[]): Promise<void> {
  // 🔴 DEBUG: Log incoming variant data to trace price update issues
  console.log('🔴 [syncMenuItemVariants] CALLED with:', {
    menuItemId,
    variantsCount: variants?.length,
    variants: variants?.map(v => ({
      id: v.id,
      name: v.name,
      price: v.price,
      price_dine_in: v.price_dine_in,
      price_delivery: v.price_delivery
    }))
  });

  try {

    // Get existing variants from database
    const { data: existingVariants, error: fetchError } = await supabase
      .from('menu_item_variants')
      .select('id')
      .eq('menu_item_id', menuItemId);

    if (fetchError) throw fetchError;

    const existingIds = new Set(existingVariants?.map(v => v.id) || []);
    const incomingIds = new Set(variants.filter(v => v.id).map(v => v.id));

    // Determine which variants to create, update, or delete
    const toCreate = variants.filter(v => !v.id || !existingIds.has(v.id));
    const toUpdate = variants.filter(v => v.id && existingIds.has(v.id));
    const toDelete = [...existingIds].filter(id => !incomingIds.has(id));

    if (isDev) {
    }

    // Helper function to extract only valid database columns from variant
    const cleanVariantData = (v: any) => {
      // Remove computed/joined fields and UI-only fields that aren't actual columns
      const {
        // Joined/computed fields from queries
        menu_protein_types,
        protein_type_name,
        image_variants,
        // UI-only state tracking fields (not in database)
        image_state,
        description_state,
        // Computed display fields from variant_resolver (not in database)
        display_image_url,
        display_description,
        image_source,
        description_source,
        ...cleanData
      } = v;
      return cleanData;
    };

    // Create new variants
    if (toCreate.length > 0) {
      const variantsToInsert = toCreate.map(v => {
        const { id, ...variantData } = cleanVariantData(v); // Remove id and clean data
        return {
          ...variantData,
          menu_item_id: menuItemId
        };
      });

      const { error: createError } = await supabase
        .from('menu_item_variants')
        .insert(variantsToInsert);

      if (createError) {
        console.error(' Failed to create variants:', createError);
        throw createError;
      }
    }

    // Update existing variants
    for (const variant of toUpdate) {
      const cleanedVariant = cleanVariantData(variant);
      const { id, menu_item_id, created_at, ...updates } = cleanedVariant;

      // 🟡 DEBUG: Log variant update payload to verify price is included
      console.log('🟡 [syncMenuItemVariants] UPDATING variant:', {
        id,
        updates_price: updates.price,
        updates_price_dine_in: updates.price_dine_in,
        updates_price_delivery: updates.price_delivery,
        fullUpdates: updates
      });

      // FIX: Removed .single() - it causes 406 error when update returns 0 rows
      // Instead, we check if update affected any rows by examining the returned array
      const { data: updatedData, error: updateError } = await supabase
        .from('menu_item_variants')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('id, name, price, price_dine_in, price_delivery');

      // 🟣 DEBUG: Log Supabase response to verify what was actually updated
      console.log('🟣 [syncMenuItemVariants] Supabase UPDATE response:', {
        variantId: id,
        success: !updateError,
        error: updateError,
        updatedData: updatedData,
        rowsAffected: updatedData?.length || 0,
        sentPrices: {
          price: updates.price,
          price_dine_in: updates.price_dine_in,
          price_delivery: updates.price_delivery
        }
      });

      if (updateError) {
        console.error(` Failed to update variant ${id}:`, updateError);
        throw updateError;
      }

      // Check if the update actually affected any rows
      if (!updatedData || updatedData.length === 0) {
        console.error(`⚠️ [syncMenuItemVariants] UPDATE returned 0 rows for variant ${id} - possible RLS policy issue or ID mismatch`);
        // Don't throw - log the warning and continue to see verification read result
      }

      // 🔍 VERIFICATION: Re-read the variant to confirm database state
      const { data: verifyData, error: verifyError } = await supabase
        .from('menu_item_variants')
        .select('id, name, price, price_dine_in, price_delivery')
        .eq('id', id)
        .single();

      console.log('🔍 [syncMenuItemVariants] VERIFICATION READ after update:', {
        variantId: id,
        verifySuccess: !verifyError,
        verifyData: verifyData,
        matchesSent: verifyData ? {
          price_matches: verifyData.price === updates.price,
          price_dine_in_matches: verifyData.price_dine_in === updates.price_dine_in,
          price_delivery_matches: verifyData.price_delivery === updates.price_delivery
        } : null
      });
    }

    // Delete removed variants
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('menu_item_variants')
        .delete()
        .in('id', toDelete);

      if (deleteError) throw deleteError;
    }

  } catch (error) {
    console.error(' [supabaseQueries] syncMenuItemVariants failed:', error);
    throw error;
  }
}

/**
 * Create menu item
 * Replaces: brain.create_menu_item()
 */
export async function createMenuItem(item: Partial<any>): Promise<any> {
  try {
    // Extract variants (handled separately)
    const { variants, ...formData } = item;

    // ✅ Transform form data to database format
    const dbData = mapFormToDatabase(formData);

    // Add timestamps AND draft status
    const cleanedData = {
      ...dbData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: null  // 🎯 DRAFT/PUBLISH: New items start as drafts until "Publish Menu" is clicked
    };

    // ✅ Validate no invalid fields (safety check)
    validateDatabasePayload(cleanedData);


    // Create the menu item (without variants array)
    const { data, error } = await supabase
      .from('menu_items')
      .insert(cleanedData)
      .select()
      .single();

    if (error) {
      console.error(' [supabaseQueries] createMenuItem database error:', error);
      throw error;
    }


    // If has variants, sync them
    if (variants && variants.length > 0) {
      await syncMenuItemVariants(data.id, variants);
    }

    return data;
  } catch (error) {
    console.error(' [supabaseQueries] createMenuItem failed:', error);
    throw error;
  }
}

/**
 * Update menu item
 * Replaces: brain.update_menu_item()
 */
export async function updateMenuItem(menuItemId: string, updates: Partial<any>): Promise<any> {

  try {
    // Extract variants (handled separately)
    const { variants, ...formData } = updates;


    // ✅ Transform form data to database format
    const dbData = mapFormToDatabase(formData);

    // Add update timestamp AND mark as draft
    const cleanedData = {
      ...dbData,
      updated_at: new Date().toISOString(),
      published_at: null  // 🎯 DRAFT/PUBLISH: Edits become drafts until "Publish Menu" is clicked
    };

    // ✅ Validate no invalid fields (safety check)
    validateDatabasePayload(cleanedData);


    // Update the menu item (without variants array)
    const { data, error } = await supabase
      .from('menu_items')
      .update(cleanedData)
      .eq('id', menuItemId)
      .select()
      .single();

    if (error) {
      console.error(' [supabaseQueries] updateMenuItem database error:', {
        message: error.message,
        details: error
      });
      throw error;
    }


    // If variants provided, sync them
    if (variants !== undefined) {
      await syncMenuItemVariants(menuItemId, variants);
    }


    return data;
  } catch (error: any) {
    console.error(' [updateMenuItem] FAILED');
    throw error;
  }
}

/**
 * Delete menu item
 * Replaces: brain.delete_menu_item()
 */
export async function deleteMenuItem(menuItemId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', menuItemId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error(' [supabaseQueries] deleteMenuItem failed:', error);
    return false;
  }
}

/**
 * Bulk toggle active status for menu items, categories, or customizations
 * Replaces: brain.bulk_toggle_active()
 */
export async function bulkToggleActive(
  itemIds: string[],
  itemType: 'menu_items' | 'menu_categories' | 'menu_customizations',
  active: boolean
): Promise<{ success: boolean; updated_count: number }> {
  try {
    const { data, error } = await supabase
      .from(itemType)
      .update({ is_active: active, updated_at: new Date().toISOString() })
      .in('id', itemIds)
      .select();

    if (error) throw error;

    return { success: true, updated_count: data?.length || 0 };
  } catch (error) {
    console.error(' [supabaseQueries] bulkToggleActive failed:', error);
    return { success: false, updated_count: 0 };
  }
}

/**
 * Publish menu - calls backend endpoint to publish menu and sync all systems
 * Replaces: brain.publish_menu()
 *
 * This calls the backend /routes/publish-menu endpoint which:
 * - Updates database timestamps (published_at) on menu_items and menu_customizations
 * - Syncs to AI Knowledge Corpus (ai_knowledge_corpus table)
 * - Syncs to POS/Website/Voice customization caches
 * - Invalidates menu cache
 */
export async function publishMenu(): Promise<{
  success: boolean;
  menu_items?: number;
  corpus_updated?: boolean;
  message?: string;
}> {
  try {
    // Use brain module (works on both web via HTTP and Electron via direct Supabase)
    const brain = await import('brain');
    const response = await (brain.default as any).publish_menu();
    const result = await response.json();

    return {
      success: result.success,
      menu_items: result.menu_items,
      corpus_updated: result.corpus_updated,
      message: result.message
    };
  } catch (error) {
    console.error('[supabaseQueries] publishMenu failed:', error);
    return { success: false, message: (error as Error).message };
  }
}

/**
 * Get next item display order
 * Replaces: brain.get_next_item_display_order()
 */
export async function getNextItemDisplayOrder(categoryId: string): Promise<number> {
  try {
    const { data } = await supabase
      .from('menu_items')
      .select('display_print_order')
      .eq('category_id', categoryId)
      .order('display_print_order', { ascending: false })
      .limit(1)
      .single();

    return (data?.display_print_order || 0) + 10;
  } catch (error) {
    // No items in category, start at 10
    return 10;
  }
}

/**
 * Get storage item (for menu refresh events)
 * Replaces: brain.get_storage_item()
 */
export async function getStorageItem(key: string): Promise<{ data?: any }> {
  try {
    const { data, error } = await supabase
      .from('storage_items')
      .select('*')
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return { data: undefined };
      throw error;
    }

    return { data: data?.value };
  } catch (error) {
    console.error(' [supabaseQueries] getStorageItem failed:', error);
    return { data: undefined };
  }
}

// ============================================================================
// MEDIA ASSET QUERIES
// ============================================================================

/**
 * Get media asset by ID
 * Replaces: brain.get_media_asset()
 */
export async function getMediaAsset(assetId: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('media_assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (error) {
    console.error(' [supabaseQueries] getMediaAsset failed:', error);
    return null;
  }
}

/**
 * Update media asset
 * Replaces: brain.update_media_asset()
 */
export async function updateMediaAsset(assetId: string, updates: any): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('media_assets')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', assetId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error(' [supabaseQueries] updateMediaAsset failed:', error);
    return null;
  }
}

/**
 * Delete media asset
 * Replaces: brain.delete_media_asset()
 */
export async function deleteMediaAsset(assetId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('media_assets')
      .delete()
      .eq('id', assetId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error(' [supabaseQueries] deleteMediaAsset failed:', error);
    return false;
  }
}

/**
 * Get recent media assets
 * Replaces: brain.get_recent_media_assets()
 */
export async function getRecentMediaAssets(limit: number = 20): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('media_assets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error(' [supabaseQueries] getRecentMediaAssets failed:', error);
    return [];
  }
}

/**
 * Get media library
 * Replaces: brain.get_media_library() and brain.get_enhanced_media_library()
 */
export async function getMediaLibrary(params?: {
  limit?: number;
  offset?: number;
  search?: string;
  category_id?: string;
  media_type?: string;
}): Promise<any[]> {
  try {
    let query = supabase
      .from('media_assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (params?.limit) {
      query = query.limit(params.limit);
    }
    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
    }
    if (params?.search) {
      query = query.ilike('friendly_name', `%${params.search}%`);
    }
    if (params?.category_id) {
      query = query.eq('category_id', params.category_id);
    }
    if (params?.media_type) {
      query = query.eq('media_type', params.media_type);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error(' [supabaseQueries] getMediaLibrary failed:', error);
    return [];
  }
}

/**
 * Get hierarchical media (organized by asset_category)
 * Replaces: brain.get_hierarchical_media()
 *
 * Returns APIResponse structure expected by mediaHierarchyUtils.ts:
 * - menu_images: SectionGroupAPI[] - organized by sections/categories
 * - menu_images_orphaned: OrphanedAssetsAPI
 * - ai_avatars: MediaAsset[]
 * - ai_avatars_orphaned: OrphanedAssetsAPI
 * - general_media: MediaAsset[]
 * - total_assets, categorized_count, orphaned_count
 */
export async function getHierarchicalMedia(): Promise<any> {
  try {
    // Fetch media assets and menu categories in parallel
    const [assetsResult, categoriesResult] = await Promise.all([
      supabase.from('media_assets').select('*').order('created_at', { ascending: false }),
      supabase.from('menu_categories').select('*').order('display_order')
    ]);

    if (assetsResult.error) throw assetsResult.error;
    if (categoriesResult.error) throw categoriesResult.error;

    const assets = assetsResult.data || [];
    const categories = categoriesResult.data || [];

    // Separate assets by asset_category field
    const menuItemAssets = assets.filter((a: any) =>
      a.asset_category === 'menu-item' || a.asset_category === 'menu-item-variant'
    );
    const aiAvatarAssets = assets.filter((a: any) => a.asset_category === 'ai-avatar');
    const generalAssets = assets.filter((a: any) =>
      !a.asset_category ||
      ['marketing', 'gallery', 'general'].includes(a.asset_category)
    );

    // Categorize menu images: has both menu_section_id and menu_category_id = categorized
    const categorizedMenuImages = menuItemAssets.filter(
      (a: any) => a.menu_section_id && a.menu_category_id
    );
    const orphanedMenuImages = menuItemAssets.filter(
      (a: any) => !a.menu_section_id || !a.menu_category_id
    );

    // Categorize AI avatars: has linked_items = categorized
    const categorizedAiAvatars = aiAvatarAssets.filter(
      (a: any) => a.linked_items && a.linked_items.length > 0
    );
    const orphanedAiAvatars = aiAvatarAssets.filter(
      (a: any) => !a.linked_items || a.linked_items.length === 0
    );

    // Identify sections (categories with name starting with [SECTION])
    const sections = categories.filter((c: any) => c.name?.startsWith('[SECTION]'));
    const regularCategories = categories.filter((c: any) => !c.name?.startsWith('[SECTION]'));

    // Build section hierarchy for menu_images
    const sectionGroups = sections.map((section: any) => {
      // Find categories belonging to this section (by parent_category_id)
      const sectionCategories = regularCategories.filter(
        (c: any) => c.parent_category_id === section.id
      );

      // Build category groups with their assets
      const categoryGroups = sectionCategories.map((category: any) => {
        const categoryAssets = categorizedMenuImages.filter(
          (a: any) => a.menu_category_id === category.id
        );
        return {
          category_id: category.id,
          category_name: category.name,
          assets: categoryAssets,
          asset_count: categoryAssets.length
        };
      });

      // Calculate total assets for this section
      const totalAssets = categoryGroups.reduce((sum: number, cg: any) => sum + cg.asset_count, 0);

      return {
        section_id: section.id,
        section_name: section.name,
        categories: categoryGroups,
        total_assets: totalAssets
      };
    });

    // Calculate counts
    const totalAssets = assets.length;
    const categorizedCount = categorizedMenuImages.length + categorizedAiAvatars.length;
    const orphanedCount = orphanedMenuImages.length + orphanedAiAvatars.length;

    // Return APIResponse structure
    return {
      menu_images: sectionGroups,
      menu_images_orphaned: {
        asset_category: 'menu-item',
        assets: orphanedMenuImages,
        count: orphanedMenuImages.length
      },
      ai_avatars: categorizedAiAvatars,
      ai_avatars_orphaned: {
        asset_category: 'ai-avatar',
        assets: orphanedAiAvatars,
        count: orphanedAiAvatars.length
      },
      general_media: generalAssets,
      total_assets: totalAssets,
      categorized_count: categorizedCount,
      orphaned_count: orphanedCount
    };
  } catch (error) {
    console.error(' [supabaseQueries] getHierarchicalMedia failed:', error);
    // Return empty but valid structure on error
    return {
      menu_images: [],
      menu_images_orphaned: { asset_category: 'menu-item', assets: [], count: 0 },
      ai_avatars: [],
      ai_avatars_orphaned: { asset_category: 'ai-avatar', assets: [], count: 0 },
      general_media: [],
      total_assets: 0,
      categorized_count: 0,
      orphaned_count: 0
    };
  }
}

// ============================================================================
// GOOGLE MAPS CONFIG
// ============================================================================

/**
 * Get Google Maps API configuration
 * Replaces: brain.get_maps_config()
 *
 * Priority:
 * 1. Environment variable (VITE_GOOGLE_MAPS_API_KEY) - for Electron/dev
 * 2. Restaurant settings (google_maps_api_key) - for database config
 */
export async function getMapsConfig(): Promise<{
  apiKey: string | null;
  restaurant?: { lat: number; lng: number } | null;
}> {
  try {
    // Try environment variable first (for Electron and dev builds)
    const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (envKey) {
      return { apiKey: envKey };
    }

    // Try to get from restaurant_settings
    const { data, error } = await supabase
      .from('restaurant_settings')
      .select('settings')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const apiKey = data?.settings?.google_maps_api_key || null;
    const restaurant = data?.settings?.delivery?.restaurant_location || null;


    return { apiKey, restaurant };
  } catch (error) {
    console.error(' [supabaseQueries] getMapsConfig failed:', error);
    return { apiKey: null };
  }
}

// ============================================================================
// MENU STATUS
// ============================================================================

/**
 * Get menu publish status
 * Replaces: brain.get_menu_status()
 *
 * Returns counts of published vs draft items and last publish timestamp
 */
export async function getMenuStatus(): Promise<{
  success: boolean;
  data?: {
    last_published_at: string | null;
    published_items: number;
    draft_items: number;
    total_active_items: number;
  };
}> {
  try {
    // Get published items count (active and has published_at)
    const { count: publishedCount, error: pubError } = await supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .not('published_at', 'is', null);

    if (pubError) throw pubError;

    // Get draft items count (active but no published_at)
    const { count: draftCount, error: draftError } = await supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .is('published_at', null);

    if (draftError) throw draftError;

    // Get most recent published_at timestamp
    const { data: latestItem, error: latestError } = await supabase
      .from('menu_items')
      .select('published_at')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) throw latestError;

    const result = {
      success: true,
      data: {
        last_published_at: latestItem?.published_at || null,
        published_items: publishedCount || 0,
        draft_items: draftCount || 0,
        total_active_items: (publishedCount || 0) + (draftCount || 0)
      }
    };


    return result;
  } catch (error) {
    console.error(' [supabaseQueries] getMenuStatus failed:', error);
    return { success: false };
  }
}

// ============================================================================
// SET MEALS CRUD
// ============================================================================

/**
 * Create a new set meal
 * Replaces: brain.create_set_meal()
 */
export async function createSetMeal(data: {
  name: string;
  description?: string;
  price?: number;
  items?: any[];
  is_active?: boolean;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { data: result, error } = await supabase
      .from('set_meals')
      .insert({
        name: data.name,
        description: data.description,
        price: data.price,
        items: data.items || [],
        is_active: data.is_active !== undefined ? data.is_active : true
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: result };
  } catch (error) {
    console.error(' [supabaseQueries] createSetMeal failed:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Update an existing set meal
 * Replaces: brain.update_set_meal()
 */
export async function updateSetMeal(
  id: string,
  data: {
    name?: string;
    description?: string;
    price?: number;
    items?: any[];
    is_active?: boolean;
  }
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { data: result, error } = await supabase
      .from('set_meals')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: result };
  } catch (error) {
    console.error(' [supabaseQueries] updateSetMeal failed:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Delete a set meal
 * Replaces: brain.delete_set_meal()
 */
export async function deleteSetMeal(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('set_meals')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error(' [supabaseQueries] deleteSetMeal failed:', error);
    return false;
  }
}

// ============================================================================
// UNIFIED AGENT CONFIG FUNCTIONS
// ============================================================================

interface UnifiedAgentConfig {
  id: string;
  agent_name: string;
  agent_role: string;
  agent_avatar_url: string | null;
  personality_settings: {
    nationality?: string;
    core_traits?: string;
  };
  channel_settings: {
    chat?: { system_prompt?: string };
    voice?: { system_prompt?: string; first_response?: string; voice_model?: string };
  };
  updated_at: string;
}

/**
 * Get unified agent configuration
 * Replaces: brain.get_unified_agent_config()
 *
 * Uses singleton pattern - queries first row without ID filter
 * (table uses UUID primary key, not string 'default')
 */
export async function getUnifiedAgentConfig(): Promise<{
  success: boolean;
  data?: UnifiedAgentConfig | null;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('unified_agent_config')
      .select('*')
      .limit(1)
      .single();

    // PGRST116 = no rows found - not an error, just no config yet
    if (error && error.code !== 'PGRST116') throw error;

    return { success: true, data: data || null };
  } catch (error) {
    console.error(' [supabaseQueries] getUnifiedAgentConfig failed:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Initialize unified agent config with defaults
 * Replaces: brain.initialize_unified_agent_config()
 *
 * Uses insert (not upsert) and lets database generate UUID
 * First checks if config already exists to avoid duplicates
 */
export async function initializeUnifiedAgentConfig(): Promise<{ success: boolean }> {
  try {
    // First check if config already exists
    const { data: existing } = await supabase
      .from('unified_agent_config')
      .select('id')
      .limit(1)
      .single();

    // If config exists, don't reinitialize
    if (existing) {
      return { success: true };
    }

    // Insert new config - let database generate UUID
    const { error } = await supabase
      .from('unified_agent_config')
      .insert({
        agent_name: 'Assistant',
        agent_role: 'Restaurant Helper',
        agent_avatar_url: null,
        personality_settings: { nationality: 'UK', core_traits: 'friendly, helpful' },
        channel_settings: {
          chat: { system_prompt: 'You are a helpful restaurant assistant.' },
          voice: {
            system_prompt: 'You are a helpful restaurant assistant for voice calls.',
            first_response: 'Hello! How can I help you today?',
            voice_model: 'default'
          }
        }
      });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error(' [supabaseQueries] initializeUnifiedAgentConfig failed:', error);
    return { success: false };
  }
}

/**
 * Update unified agent configuration
 * Replaces: brain.update_unified_agent_config()
 *
 * Queries for actual UUID first, then updates using that UUID
 */
export async function updateUnifiedAgentConfig(
  updates: Partial<UnifiedAgentConfig>
): Promise<{ success: boolean }> {
  try {
    // First get the actual config ID (UUID)
    const { data: existing, error: fetchError } = await supabase
      .from('unified_agent_config')
      .select('id')
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    // If no config exists, initialize first
    if (!existing) {
      await initializeUnifiedAgentConfig();
      const { data: newConfig } = await supabase
        .from('unified_agent_config')
        .select('id')
        .limit(1)
        .single();

      if (!newConfig) throw new Error('Failed to initialize config');

      // Update using newly created UUID
      const { error } = await supabase
        .from('unified_agent_config')
        .update(updates)
        .eq('id', newConfig.id);

      if (error) throw error;
    } else {
      // Update using actual UUID
      const { error } = await supabase
        .from('unified_agent_config')
        .update(updates)
        .eq('id', existing.id);

      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error(' [supabaseQueries] updateUnifiedAgentConfig failed:', error);
    return { success: false };
  }
}

/**
 * Get active voice prompt (from config or defaults)
 * Replaces: brain.get_active_voice_prompt()
 *
 * Uses singleton pattern - queries first row without ID filter
 */
export async function getActiveVoicePrompt(): Promise<{
  prompt: string;
  source: 'custom' | 'default';
}> {
  try {
    const { data } = await supabase
      .from('unified_agent_config')
      .select('channel_settings')
      .limit(1)
      .single();

    const voicePrompt = (data?.channel_settings as any)?.voice?.system_prompt;

    if (voicePrompt) {
      return { prompt: voicePrompt, source: 'custom' };
    }

    // Return default hardcoded prompt
    return {
      prompt: 'You are a helpful restaurant assistant for Cottage Tandoori. Help customers with menu questions, take orders, and provide excellent service.',
      source: 'default'
    };
  } catch (error) {
    console.error(' [supabaseQueries] getActiveVoicePrompt failed:', error);
    return { prompt: '', source: 'default' };
  }
}

/**
 * Upload avatar to storage and update config
 * Replaces: brain.upload_avatar()
 */
export async function uploadAgentAvatar(file: File): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `agent-avatar-${Date.now()}.${fileExt}`;
    const storagePath = `avatars/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('media-assets')
      .upload(storagePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('media-assets')
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Update agent config with new avatar URL
    await updateUnifiedAgentConfig({ agent_avatar_url: publicUrl } as any);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error(' [supabaseQueries] uploadAgentAvatar failed:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Publish wizard config - saves current config as published
 * Replaces: brain.publish_wizard_config()
 *
 * Queries for actual UUID first, then updates using that UUID
 */
export async function publishWizardConfig(config: any): Promise<{
  success: boolean;
  message?: string;
  config_version?: number;
}> {
  try {
    // Phase 6: Fetch existing config with ALL fields to enable MERGING (not overwriting)
    const { data: existing, error: fetchError } = await supabase
      .from('unified_agent_config')
      .select('*')
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    if (!existing) {
      throw new Error('No configuration found to publish');
    }

    // Phase 6: MERGE channel_settings instead of overwriting
    // This preserves settings from other stages that weren't part of this publish
    const existingChannelSettings = existing.channel_settings || {};

    const mergedChannelSettings = {
      ...existingChannelSettings,
      chat: {
        ...(existingChannelSettings.chat || {}),
        // Only update fields that were provided in config
        ...(config.chat_system_prompt !== undefined && { system_prompt: config.chat_system_prompt }),
        ...(config.chat_custom_instructions !== undefined && { custom_instructions: config.chat_custom_instructions }),
        ...(config.chat_tone !== undefined && { tone: config.chat_tone }),
        enabled: true,  // Enable on publish
      },
      voice: {
        ...(existingChannelSettings.voice || {}),
        // Only update fields that were provided in config
        ...(config.voice_system_prompt !== undefined && { system_prompt: config.voice_system_prompt }),
        ...(config.voice_first_response !== undefined && { first_response: config.voice_first_response }),
        ...(config.voice_model !== undefined && { voice_model: config.voice_model }),
        enabled: true,  // Enable on publish
      },
    };

    // Phase 6: Update with is_active = true (this triggers version bump via database trigger)
    const { data: updatedData, error } = await supabase
      .from('unified_agent_config')
      .update({
        agent_name: config.agent_name,
        agent_role: config.agent_role,
        agent_avatar_url: config.agent_avatar_url,
        personality_settings: {
          ...existing.personality_settings,
          nationality: config.nationality,
          core_traits: config.core_traits || ''
        },
        channel_settings: mergedChannelSettings,
        // CRITICAL: Set is_active = true on publish (triggers config_version bump)
        is_active: true,
      })
      .eq('id', existing.id)
      .select('config_version')
      .single();

    if (error) throw error;

    console.log('[supabaseQueries] Published config, new version:', updatedData?.config_version);

    return {
      success: true,
      message: 'Configuration published successfully',
      config_version: updatedData?.config_version,
    };
  } catch (error) {
    console.error(' [supabaseQueries] publishWizardConfig failed:', error);
    return { success: false, message: (error as Error).message };
  }
}

// ============================================================================
// DRAFT REVIEW SYSTEM QUERIES
// ============================================================================

import type {
  DraftChangesResponse,
  DraftItemChange,
  FieldChange,
  RevertResponse,
  MenuItemSnapshot,
} from './draftTypes';

/**
 * Get published snapshot for a menu item
 * Returns the last published state of the item, or null if never published
 */
export async function getPublishedSnapshot(menuItemId: string): Promise<MenuItemSnapshot | null> {
  try {
    const { data, error } = await supabase
      .from('menu_item_snapshots')
      .select('*')
      .eq('menu_item_id', menuItemId)
      .eq('snapshot_type', 'published')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data as MenuItemSnapshot;
  } catch (error) {
    console.error('[supabaseQueries] getPublishedSnapshot failed:', error);
    return null;
  }
}

/**
 * Create a snapshot of a menu item's current state
 * Called before publishing to preserve the "live" state for future comparison
 */
export async function createMenuItemSnapshot(
  menuItemId: string,
  snapshotType: 'published' | 'draft' = 'published'
): Promise<MenuItemSnapshot | null> {
  try {
    // Fetch current menu item with variants
    const { data: menuItem, error: fetchError } = await supabase
      .from('menu_items')
      .select(`
        *,
        menu_item_variants (*)
      `)
      .eq('id', menuItemId)
      .single();

    if (fetchError) throw fetchError;
    if (!menuItem) throw new Error('Menu item not found');

    // Upsert snapshot (replaces existing snapshot of same type for this item)
    const snapshotData = {
      menu_item_id: menuItemId,
      snapshot_type: snapshotType,
      name: menuItem.name,
      description: menuItem.menu_item_description || menuItem.description,
      base_price: menuItem.base_price || menuItem.price,
      price_dine_in: menuItem.price_dine_in,
      price_delivery: menuItem.price_delivery,
      price_takeaway: menuItem.price_takeaway,
      category_id: menuItem.category_id,
      kitchen_display_name: menuItem.kitchen_display_name,
      spice_level: menuItem.spice_level,
      dietary_tags: menuItem.dietary_tags,
      image_url: menuItem.image_url,
      display_order: menuItem.display_order || menuItem.display_print_order,
      is_active: menuItem.is_active,
      variants_snapshot: menuItem.menu_item_variants || [],
      snapshot_at: new Date().toISOString(),
      published_at: menuItem.published_at,
    };

    const { data, error } = await supabase
      .from('menu_item_snapshots')
      .upsert(snapshotData, {
        onConflict: 'menu_item_id,snapshot_type',
      })
      .select()
      .single();

    if (error) throw error;

    return data as MenuItemSnapshot;
  } catch (error) {
    console.error('[supabaseQueries] createMenuItemSnapshot failed:', error);
    return null;
  }
}

/**
 * Get all draft items with their changes compared to published snapshots
 * Used by the PublishReviewModal to show before/after comparison
 */
export async function getDraftItemsWithChanges(): Promise<DraftChangesResponse> {
  try {
    // Dynamically import to avoid circular dependency
    const { COMPARABLE_FIELDS, valuesAreEqual } = await import('./draftTypes');

    // Fetch all draft items (published_at is null)
    const { data: draftItems, error: draftsError } = await supabase
      .from('menu_items')
      .select(`
        *,
        menu_item_variants (*),
        menu_categories!menu_items_category_id_fkey (name)
      `)
      .is('published_at', null)
      .order('updated_at', { ascending: false });

    if (draftsError) throw draftsError;

    if (!draftItems || draftItems.length === 0) {
      return { success: true, draft_items: [], count: 0 };
    }

    // Fetch all published snapshots for these items
    const draftIds = draftItems.map((item: any) => item.id);
    const { data: snapshots, error: snapshotsError } = await supabase
      .from('menu_item_snapshots')
      .select('*')
      .in('menu_item_id', draftIds)
      .eq('snapshot_type', 'published');

    if (snapshotsError) throw snapshotsError;

    // Create lookup map for snapshots
    const snapshotByItemId = new Map<string, MenuItemSnapshot>();
    (snapshots || []).forEach((snap: any) => {
      snapshotByItemId.set(snap.menu_item_id, snap as MenuItemSnapshot);
    });

    // Build draft changes for each item
    const draftChanges: DraftItemChange[] = draftItems.map((item: any) => {
      const snapshot = snapshotByItemId.get(item.id);
      const isNew = !snapshot;
      const changes: FieldChange[] = [];

      if (!isNew && snapshot) {
        // Compare each comparable field
        COMPARABLE_FIELDS.forEach(({ field, label, type }) => {
          // Map database field names if needed
          let itemValue = item[field];
          let snapValue = (snapshot as any)[field];

          // Handle field name variations
          if (field === 'description') {
            itemValue = item.menu_item_description || item.description;
            snapValue = snapshot.description;
          }
          if (field === 'base_price') {
            itemValue = item.base_price || item.price;
          }

          if (!valuesAreEqual(itemValue, snapValue)) {
            changes.push({
              field,
              label,
              oldValue: snapValue,
              newValue: itemValue,
              type,
            });
          }
        });
      }

      return {
        item_id: item.id,
        name: item.name,
        is_new: isNew,
        updated_at: item.updated_at,
        category_name: item.menu_categories?.name || 'Uncategorized',
        changes,
      };
    });

    return {
      success: true,
      draft_items: draftChanges,
      count: draftChanges.length,
    };
  } catch (error) {
    console.error('[supabaseQueries] getDraftItemsWithChanges failed:', error);
    return {
      success: false,
      draft_items: [],
      count: 0,
      error: (error as Error).message,
    };
  }
}

/**
 * Revert a draft item to its published snapshot state
 * Restores all fields including variants to the last published version
 */
export async function revertToPublished(menuItemId: string): Promise<RevertResponse> {
  try {
    // Fetch the published snapshot
    const snapshot = await getPublishedSnapshot(menuItemId);

    if (!snapshot) {
      return {
        success: false,
        error: 'No published version to revert to. This item has never been published.',
      };
    }

    // Restore menu item fields from snapshot
    const { error: updateError } = await supabase
      .from('menu_items')
      .update({
        name: snapshot.name,
        menu_item_description: snapshot.description,
        base_price: snapshot.base_price,
        price: snapshot.base_price, // Also update price field
        price_dine_in: snapshot.price_dine_in,
        price_delivery: snapshot.price_delivery,
        price_takeaway: snapshot.price_takeaway,
        kitchen_display_name: snapshot.kitchen_display_name,
        spice_level: snapshot.spice_level,
        dietary_tags: snapshot.dietary_tags,
        image_url: snapshot.image_url,
        display_order: snapshot.display_order,
        display_print_order: snapshot.display_order, // Also update legacy field
        is_active: snapshot.is_active,
        published_at: snapshot.published_at, // Restore published status
        updated_at: new Date().toISOString(),
      })
      .eq('id', menuItemId);

    if (updateError) throw updateError;

    // Restore variants from snapshot
    if (snapshot.variants_snapshot && Array.isArray(snapshot.variants_snapshot)) {
      // Delete current variants
      await supabase
        .from('menu_item_variants')
        .delete()
        .eq('menu_item_id', menuItemId);

      // Re-insert snapshot variants (if any)
      if (snapshot.variants_snapshot.length > 0) {
        const variantsToInsert = snapshot.variants_snapshot.map((v: any) => ({
          ...v,
          id: undefined, // Let database generate new IDs
          menu_item_id: menuItemId,
        }));

        await supabase.from('menu_item_variants').insert(variantsToInsert);
      }
    }

    return {
      success: true,
      message: 'Reverted to published version successfully',
    };
  } catch (error) {
    console.error('[supabaseQueries] revertToPublished failed:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Create snapshots for all items being published
 * Called by the publish workflow to preserve current state for future comparison
 */
export async function createSnapshotsForPublish(menuItemIds: string[]): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  try {
    let successCount = 0;

    for (const itemId of menuItemIds) {
      const result = await createMenuItemSnapshot(itemId, 'published');
      if (result) successCount++;
    }

    return {
      success: true,
      count: successCount,
    };
  } catch (error) {
    console.error('[supabaseQueries] createSnapshotsForPublish failed:', error);
    return {
      success: false,
      count: 0,
      error: (error as Error).message,
    };
  }
}

/**
 * Get set of menu item IDs that have published snapshots
 * Used to determine if "Revert to Published" button should be shown
 */
export async function getItemsWithSnapshots(itemIds: string[]): Promise<Set<string>> {
  if (!itemIds || itemIds.length === 0) {
    return new Set();
  }

  try {
    const { data, error } = await supabase
      .from('menu_item_snapshots')
      .select('menu_item_id')
      .in('menu_item_id', itemIds)
      .eq('snapshot_type', 'published');

    if (error) throw error;

    return new Set((data || []).map((row: any) => row.menu_item_id));
  } catch (error) {
    console.error('[supabaseQueries] getItemsWithSnapshots failed:', error);
    return new Set();
  }
}

/**
 * Get draft customizations (those with published_at = null)
 * Used for PublishReviewModal to show pending customization changes
 */
export async function getDraftCustomizations(): Promise<{
  success: boolean;
  items: Array<{ id: string; name: string; customization_group?: string }>;
  count: number;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('menu_customizations')
      .select('id, name, customization_group')
      .eq('is_active', true)
      .is('published_at', null);

    if (error) throw error;

    return {
      success: true,
      items: data || [],
      count: data?.length || 0,
    };
  } catch (error) {
    console.error('[supabaseQueries] getDraftCustomizations failed:', error);
    return {
      success: false,
      items: [],
      count: 0,
      error: (error as Error).message,
    };
  }
}

/**
 * Get draft set meals (those with published_at = null)
 * Used for PublishReviewModal to show pending set meal changes
 */
export async function getDraftSetMeals(): Promise<{
  success: boolean;
  items: Array<{ id: string; name: string; code?: string }>;
  count: number;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('set_meals')
      .select('id, name, code')
      .eq('active', true)
      .is('published_at', null);

    if (error) throw error;

    return {
      success: true,
      items: data || [],
      count: data?.length || 0,
    };
  } catch (error) {
    console.error('[supabaseQueries] getDraftSetMeals failed:', error);
    return {
      success: false,
      items: [],
      count: 0,
      error: (error as Error).message,
    };
  }
}

// ============================================================================
// STORAGE & MEDIA MANAGEMENT
// ============================================================================

/**
 * Get storage status including bucket info and usage
 */
export async function getStorageStatus(): Promise<{
  success: boolean;
  total_size_bytes?: number;
  file_count?: number;
  buckets?: string[];
  error?: string;
}> {
  try {
    // List buckets to verify access
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) throw bucketsError;

    return {
      success: true,
      buckets: buckets?.map(b => b.name) || [],
      total_size_bytes: 0, // Would require additional queries to calculate
      file_count: 0,
    };
  } catch (error) {
    console.error('[supabaseQueries] getStorageStatus failed:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Replace asset references in menu items when swapping images
 */
export async function replaceAssetInMenuItems(
  oldAssetId: string,
  newAssetId: string
): Promise<{
  success: boolean;
  updated_count?: number;
  error?: string;
}> {
  try {
    // Update menu_items where image_asset_id matches
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .update({ image_asset_id: newAssetId })
      .eq('image_asset_id', oldAssetId)
      .select('id');

    if (menuError) throw menuError;

    // Update item_variants where image_asset_id matches
    const { data: variants, error: variantError } = await supabase
      .from('item_variants')
      .update({ image_asset_id: newAssetId })
      .eq('image_asset_id', oldAssetId)
      .select('id');

    if (variantError) throw variantError;

    const totalUpdated = (menuItems?.length || 0) + (variants?.length || 0);

    return {
      success: true,
      updated_count: totalUpdated,
    };
  } catch (error) {
    console.error('[supabaseQueries] replaceAssetInMenuItems failed:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Remove asset references from menu items (clear the image_asset_id)
 */
export async function removeAssetReferences(
  assetId: string
): Promise<{
  success: boolean;
  updated_count?: number;
  error?: string;
}> {
  try {
    // Clear image_asset_id in menu_items
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .update({ image_asset_id: null })
      .eq('image_asset_id', assetId)
      .select('id');

    if (menuError) throw menuError;

    // Clear image_asset_id in item_variants
    const { data: variants, error: variantError } = await supabase
      .from('item_variants')
      .update({ image_asset_id: null })
      .eq('image_asset_id', assetId)
      .select('id');

    if (variantError) throw variantError;

    const totalUpdated = (menuItems?.length || 0) + (variants?.length || 0);

    return {
      success: true,
      updated_count: totalUpdated,
    };
  } catch (error) {
    console.error('[supabaseQueries] removeAssetReferences failed:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
