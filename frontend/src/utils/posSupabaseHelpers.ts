/**
 * POS Supabase Helper Functions
 * 
 * Standalone Supabase functions for POS Desktop app
 * Replaces brain HTTP client dependencies to make desktop app truly standalone
 * 
 * Created: Dec 4, 2024
 * Purpose: Remove brain dependency from POS Desktop Electron app
 */

import { supabase } from './supabaseClient';

/**
 * Order Item Detail (matches backend response)
 */
export interface OrderItemDetail {
  id: string;
  menu_item_id: string;
  variant_id: string | null;
  name: string;
  price: number | string;
  quantity: number | string;
  variant_name?: string | null;
  protein_type?: string | null;
  modifiers?: any[];
  notes?: string | null;
  image_url?: string | null;
}

/**
 * Get Order Items Response
 */
export interface GetOrderItemsResponse {
  success: boolean;
  items: OrderItemDetail[];
  error?: string;
}

/**
 * Process Print Queue Response
 */
export interface ProcessPrintQueueResponse {
  success: boolean;
  processed_count: number;
  successful_count: number;
  failed_count: number;
  error?: string;
}

/**
 * Get order items for a specific order
 * 
 * Replacement for brain.get_order_items()
 * Direct Supabase query to order_items table
 * 
 * @param orderId - The order ID to fetch items for
 * @returns Order items with full details
 */
export async function getOrderItems(orderId: string): Promise<GetOrderItemsResponse> {
  try {
    console.log(`📦 [posSupabaseHelpers] Fetching order items for order: ${orderId}`);
    
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        id,
        menu_item_id,
        variant_id,
        name,
        price,
        quantity,
        variant_name,
        protein_type,
        modifiers,
        notes,
        image_url
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('❌ [posSupabaseHelpers] Error fetching order items:', error);
      return {
        success: false,
        items: [],
        error: error.message
      };
    }
    
    if (!data || data.length === 0) {
      console.warn(`⚠️ [posSupabaseHelpers] No items found for order: ${orderId}`);
      return {
        success: false,
        items: [],
        error: 'No items found for this order'
      };
    }
    
    console.log(`✅ [posSupabaseHelpers] Found ${data.length} items for order ${orderId}`);
    
    return {
      success: true,
      items: data as OrderItemDetail[]
    };
    
  } catch (error: any) {
    console.error('❌ [posSupabaseHelpers] Unexpected error in getOrderItems:', error);
    return {
      success: false,
      items: [],
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Process print queue manually
 * 
 * Replacement for brain.process_print_queue()
 * Direct RPC call to Supabase process_print_queue function
 * 
 * @param options - Processing options
 * @param options.max_jobs - Maximum number of jobs to process (default: 20)
 * @param options.force_retry_failed - Whether to retry failed jobs (default: false)
 * @returns Processing results with counts
 */
export async function processPrintQueue(
  options: {
    max_jobs?: number;
    force_retry_failed?: boolean;
  } = {}
): Promise<ProcessPrintQueueResponse> {
  try {
    const maxJobs = options.max_jobs || 20;
    const forceRetryFailed = options.force_retry_failed || false;
    
    console.log(`🖨️ [posSupabaseHelpers] Processing print queue (max: ${maxJobs}, retry_failed: ${forceRetryFailed})`);
    
    // Call the Supabase RPC function that processes the print queue
    const { data, error } = await supabase.rpc('process_print_queue', {
      max_jobs: maxJobs,
      force_retry_failed: forceRetryFailed
    });
    
    if (error) {
      console.error('❌ [posSupabaseHelpers] Error processing print queue:', error);
      return {
        success: false,
        processed_count: 0,
        successful_count: 0,
        failed_count: 0,
        error: error.message
      };
    }
    
    // Parse the response from the RPC function
    const result = data || {};
    
    console.log(`✅ [posSupabaseHelpers] Print queue processed:`, {
      processed: result.processed_count || 0,
      successful: result.successful_count || 0,
      failed: result.failed_count || 0
    });
    
    return {
      success: true,
      processed_count: result.processed_count || 0,
      successful_count: result.successful_count || 0,
      failed_count: result.failed_count || 0
    };
    
  } catch (error: any) {
    console.error('❌ [posSupabaseHelpers] Unexpected error in processPrintQueue:', error);
    return {
      success: false,
      processed_count: 0,
      successful_count: 0,
      failed_count: 0,
      error: error.message || 'Unknown error occurred'
    };
  }
}
