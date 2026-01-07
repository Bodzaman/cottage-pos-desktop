/**
 * Order Management Service
 * 
 * This service handles the storage, retrieval, and management of completed orders
 * from all channels (DINE-IN, DELIVERY, COLLECTION, WAITING, online).
 */

import { apiClient } from "app";
import { TableOrder } from "./tableTypes";

export interface OrderItem {
  item_id: string;
  name: string;
  price: number;
  quantity: number;
  variant_name?: string;
  modifiers?: Array<{
    groupId: string;
    groupName: string;
    options: Array<{
      optionId: string;
      name: string;
      price: number;
    }>;
  }>;
  notes?: string;
}

export interface PaymentInfo {
  method: string;
  amount: number;
  tip?: number;
  transaction_id?: string;
  split_payments?: Array<{
    id: string;
    method: string;
    amount: number;
  }>;
}

export interface CompletedOrder {
  order_id: string;
  order_number: string;
  order_type: string;
  order_source: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  delivery_address?: string;
  special_instructions?: string;
  table_number?: number;
  guest_count?: number;
  created_at: Date;
  completed_at: Date;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  service_charge: number;
  discount: number;
  tip: number;
  total: number;
  total_amount: number;
  payment: PaymentInfo;
  payment_status?: string;
  payment_method?: string;
  status: string;
  notes?: string;
  staff_id?: string;
  
  // Order history tracking
  history?: Array<{
    action: string; // e.g., 'CREATED', 'APPROVED', 'EDITED', 'COMPLETED', 'CANCELLED', 'REFUNDED'
    timestamp: Date | string;
    user_id?: string;
    user_name?: string;
    notes?: string;
    changes?: Array<{
      field: string;
      oldValue: any;
      newValue: any;
    }>;
  }>;
  
  // AI Voice order specific fields
  call_duration?: string;
  transcript_id?: string; // Reference to stored transcript
  transcript?: string; // For AI voice orders, contains the conversation transcript
  call_transcript?: string;
  voice_recording_url?: string;
  confidence_score?: number;
  main_order_id?: string | null;
  assigned_station?: string;
}

export interface OrderSummary {
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  payment_methods: Record<string, number>;
  order_types: Record<string, number>;
  top_items: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

export interface ReconciliationSummary {
  date_range: {
    start: string;
    end: string;
  };
  total_revenue: number;
  payment_breakdown: Record<string, number>;
  refunds_total: number;
  adjustments_total: number;
  net_revenue: number;
  order_channel_breakdown: Record<string, {
    count: number;
    total: number;
  }>;
}

export interface OrderFilterParams {
  start_date?: Date;
  end_date?: Date;
  order_type?: string;
  payment_method?: string;
  status?: string;
  table_number?: number;
  search?: string;
  order_source?: string;
}

// Singleton service for order management
export class OrderManagementService {
  private static instance: OrderManagementService;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): OrderManagementService {
    if (!OrderManagementService.instance) {
      OrderManagementService.instance = new OrderManagementService();
    }
    return OrderManagementService.instance;
  }

  // Convert a TableOrder to our CompletedOrder format
  private convertTableOrderToCompletedOrder(tableOrder: TableOrder, tableNumber: number, guestCount: number): CompletedOrder {
    // Calculate totals
    const subtotal = tableOrder.items.reduce((sum, item) => {
      let itemTotal = item.price * item.quantity;
      // Add modifier prices
      if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach(mod => {
          mod.options.forEach(option => {
            itemTotal += option.price * item.quantity;
          });
        });
      }
      return sum + itemTotal;
    }, 0);

    const serviceChargeAmount = (subtotal * tableOrder.serviceCharge) / 100;
    const discountAmount = (subtotal * tableOrder.discount) / 100;
    const tax = 0; // VAT is already included in menu prices
    const total = subtotal + serviceChargeAmount - discountAmount; // No VAT addition

    // Map items to API format
    const orderItems: OrderItem[] = tableOrder.items.map(item => ({
      item_id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      variant_name: item.variantName,
      modifiers: item.modifiers,
      notes: item.notes
    }));

    // Create payment info
    const paymentInfo: PaymentInfo = {
      method: "CARD", // Default to card, would be set properly in a real implementation
      amount: total,
      tip: tableOrder.tip || 0
    };

    return {
      order_id: tableOrder.orderId,
      order_type: "DINE-IN", // For TableOrder this is always DINE-IN
      order_source: "POS", // TableOrder comes from POS
      table_number: tableNumber,
      guest_count: guestCount,
      created_at: tableOrder.createdAt,
      completed_at: tableOrder.completedAt || new Date(),
      items: orderItems,
      subtotal,
      tax,
      service_charge: serviceChargeAmount,
      discount: discountAmount,
      tip: tableOrder.tip || 0,
      total,
      payment: paymentInfo,
      status: "COMPLETED",
      notes: tableOrder.notes
    };
  }

  // Store a completed table order
  public async storeTableOrder(tableOrder: TableOrder, tableNumber: number, guestCount: number): Promise<boolean> {
    try {
      console.log(`Storing completed order ${tableOrder.orderId} for table ${tableNumber}`);
      
      // Convert the table order to our API format
      const completedOrder = this.convertTableOrderToCompletedOrder(tableOrder, tableNumber, guestCount);
      
      // Store in the backend
      const response = await apiClient.store_order(completedOrder);
      const result = await response.json();
      
      if (result.success) {
        console.log(`Order ${completedOrder.order_id} stored successfully`);
        return true;
      } else {
        console.error(`Failed to store order: ${result.message}`);
        return false;
      }
    } catch (error) {
      console.error('Error storing completed order:', error);
      return false;
    }
  }

  // Store a completed online order
  public async storeOnlineOrder(order: CompletedOrder): Promise<boolean> {
    try {
      console.log(`Storing online order ${order.order_id}`);
      
      // Store in the backend
      const response = await apiClient.store_order(order);
      const result = await response.json();
      
      if (result.success) {
        console.log(`Online order ${order.order_id} stored successfully`);
        return true;
      } else {
        console.error(`Failed to store online order: ${result.message}`);
        return false;
      }
    } catch (error) {
      console.error('Error storing online order:', error);
      return false;
    }
  }

  // Get orders with filtering and pagination
  public async getOrders(
    page: number = 1,
    pageSize: number = 10,
    filters?: OrderFilterParams
  ): Promise<{
    orders: CompletedOrder[];
    totalCount: number;
    page: number;
    pageSize: number;
  }> {
    try {
      // Prepare query parameters with cache busting
      const queryParams: Record<string, any> = { 
        page, 
        page_size: pageSize,
        _cache_bust: Date.now() // Force fresh data
      };
      
      if (filters) {
        if (filters.start_date) {
          queryParams.start_date = filters.start_date.toISOString().split('T')[0]; // YYYY-MM-DD
        }
        if (filters.end_date) {
          queryParams.end_date = filters.end_date.toISOString().split('T')[0]; // YYYY-MM-DD
        }
        if (filters.order_type) {
          queryParams.order_type = filters.order_type;
        }
        if (filters.payment_method) {
          queryParams.payment_method = filters.payment_method;
        }
        if (filters.status) {
          queryParams.status = filters.status;
        }
        if (filters.table_number) {
          queryParams.table_number = filters.table_number;
        }
        if (filters.search) {
          queryParams.search = filters.search;
        }
      }
      
      // Fetch orders from the API
      const response = await apiClient.get_orders(queryParams);
      const data = await response.json();
      
      // Validate and clean the orders data to prevent undefined array errors
      const validatedOrders = (data.orders || []).map((order: any) => ({
        ...order,
        // Ensure items is always an array
        items: Array.isArray(order.items) ? order.items : [],
        // Ensure other required fields have safe defaults
        customer_name: order.customer_name || '',
        customer_phone: order.customer_phone || '',
        customer_email: order.customer_email || '',
        special_instructions: order.special_instructions || '',
        // Ensure dates are properly formatted
        created_at: order.created_at ? new Date(order.created_at) : new Date(),
        completed_at: order.completed_at ? new Date(order.completed_at) : new Date()
      }));
      
      return {
        orders: validatedOrders,
        totalCount: data.total_count || 0,
        page: data.page || 1,
        pageSize: data.page_size || 20
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      return {
        orders: [],
        totalCount: 0,
        page: 1,
        pageSize: 20
      };
    }
  }

  // Get order by ID
  public async getOrderById(orderId: string): Promise<CompletedOrder | null> {
    try {
      // Fetch order from the API
      const response = await apiClient.get_order_by_id({ orderId });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      return null;
    }
  }

  // Get reconciliation summary
  public async getReconciliationSummary(
    startDate: Date,
    endDate: Date,
    orderType?: string
  ): Promise<ReconciliationSummary | null> {
    try {
      // Prepare query parameters
      const queryParams: Record<string, any> = {
        start_date: startDate.toISOString().split('T')[0], // YYYY-MM-DD
        end_date: endDate.toISOString().split('T')[0] // YYYY-MM-DD
      };
      
      if (orderType) {
        queryParams.order_type = orderType;
      }
      
      // Fetch reconciliation data from the API
      const response = await apiClient.get_reconciliation_summary(queryParams);
      return await response.json();
    } catch (error) {
      console.error('Error fetching reconciliation summary:', error);
      return null;
    }
  }

  // Export orders
  public async exportOrders(filters?: OrderFilterParams): Promise<CompletedOrder[] | null> {
    try {
      // Prepare query parameters
      const queryParams: Record<string, any> = {};
      
      if (filters) {
        if (filters.start_date) {
          queryParams.start_date = filters.start_date.toISOString().split('T')[0];
        }
        if (filters.end_date) {
          queryParams.end_date = filters.end_date.toISOString().split('T')[0];
        }
        if (filters.order_type) {
          queryParams.order_type = filters.order_type;
        }
        if (filters.payment_method) {
          queryParams.payment_method = filters.payment_method;
        }
        if (filters.status) {
          queryParams.status = filters.status;
        }
      }
      
      // Fetch export data from the API
      const response = await apiClient.export_orders(queryParams);
      return await response.json();
    } catch (error) {
      console.error('Error exporting orders:', error);
      return null;
    }
  }
}

// Export a singleton instance
export const orderManagementService = OrderManagementService.getInstance();

// Add a method to track order edits
OrderManagementService.prototype.trackOrderEdit = function(orderId: string, userId?: string, userName?: string): void {
  try {
    console.log(`Tracking edit for order ${orderId} by ${userName || 'unknown user'}`);
    // In a real implementation, this would update the order history in the database
    // Here we'll just log it
    
    // You could use this to update a local copy of the order history
    // or make an API call to update the order in the database
  } catch (error) {
    console.error('Error tracking order edit:', error);
  }
};
