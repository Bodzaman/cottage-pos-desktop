
/**
 * API Client for cottage-pos-desktop Electron App
 * Replaces brain.* calls from Databutton environment
 * Provides direct Supabase integration and custom API methods
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration - These will be provided via environment variables or settings
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export class ApiClient {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  // =============================================================================
  // MENU DATA METHODS (replacing brain menu calls)
  // =============================================================================

  async getMenuCategories() {
    try {
      const { data, error } = await this.supabase
        .from('menu_categories')
        .select('*')
        .eq('active', true)
        .order('display_order');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return { data: null, error };
    }
  }

  async getMenuItems() {
    try {
      const { data, error } = await this.supabase
        .from('menu_items')
        .select(`
          *,
          menu_categories!inner(name, active),
          item_variants(*),
          item_modifiers(*)
        `)
        .eq('active', true)
        .eq('menu_categories.active', true)
        .order('display_order');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching menu items:', error);
      return { data: null, error };
    }
  }

  // =============================================================================
  // ORDER MANAGEMENT METHODS
  // =============================================================================

  async createOrder(orderData: any) {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating order:', error);
      return { data: null, error };
    }
  }

  async getOrders(filters: any = {}) {
    try {
      let query = this.supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.order_type) {
        query = query.eq('order_type', filters.order_type);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching orders:', error);
      return { data: null, error };
    }
  }

  // =============================================================================
  // TABLE MANAGEMENT METHODS
  // =============================================================================

  async getTableOrders() {
    try {
      const { data, error } = await this.supabase
        .from('pos_tables')
        .select('*')
        .order('table_number');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching table orders:', error);
      return { data: null, error };
    }
  }

  async updateTableStatus(tableNumber: number, status: string, orderData?: any) {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };

      if (orderData) {
        updateData.current_order = orderData;
      }

      const { data, error } = await this.supabase
        .from('pos_tables')
        .update(updateData)
        .eq('table_number', tableNumber)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating table status:', error);
      return { data: null, error };
    }
  }

  // =============================================================================
  // PAYMENT PROCESSING METHODS
  // =============================================================================

  async processPayment(paymentData: any) {
    try {
      // This would integrate with Stripe or other payment processors
      // For now, return mock success response
      console.log('Processing payment:', paymentData);

      return { 
        data: { 
          success: true, 
          payment_id: `pay_${Date.now()}`,
          status: 'succeeded'
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      return { data: null, error };
    }
  }

  // =============================================================================
  // PRINTING METHODS (local Electron integration)
  // =============================================================================

  async printReceipt(receiptData: any) {
    try {
      // This will integrate with Electron's thermal printing capabilities
      // Send to main process via IPC
      if (window.electronAPI?.print) {
        const result = await window.electronAPI.print(receiptData);
        return { data: result, error: null };
      } else {
        throw new Error('Electron printing API not available');
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      return { data: null, error };
    }
  }

  // =============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // =============================================================================

  subscribeToMenuUpdates(callback: (payload: any) => void) {
    return this.supabase
      .channel('menu-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'menu_items' },
        callback
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'menu_categories' },
        callback
      )
      .subscribe();
  }

  subscribeToOrderUpdates(callback: (payload: any) => void) {
    return this.supabase
      .channel('order-updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        callback
      )
      .subscribe();
  }

  subscribeToTableUpdates(callback: (payload: any) => void) {
    return this.supabase
      .channel('table-updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'pos_tables' },
        callback
      )
      .subscribe();
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  async checkConnection() {
    try {
      const { data, error } = await this.supabase
        .from('menu_categories')
        .select('count')
        .limit(1);

      return { connected: !error, error };
    } catch (error) {
      return { connected: false, error };
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
