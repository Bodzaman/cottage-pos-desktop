// API Client for Cottage Tandoori POS Desktop
// Replaces brain.* calls from the web version
// Handles direct communication with Supabase backend

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  available: boolean;
}

interface Order {
  id: string;
  tableNumber?: number;
  type: 'DINE_IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
  items: OrderItem[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
}

interface OrderItem {
  menuItemId: string;
  quantity: number;
  price: number;
  modifications?: string[];
}

interface TableConfig {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  currentOrderId?: string;
}

export class CottageAPIClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    // These will be provided via Electron's main process
    this.baseUrl = process.env.SUPABASE_URL || 'https://your-supabase-url.supabase.co';
    this.apiKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}/rest/v1/${endpoint}`, {
        ...options,
        headers: {
          'apikey': this.apiKey,
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.message || 'API request failed',
          status: response.status
        };
      }

      return {
        data,
        status: response.status
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0
      };
    }
  }

  // Menu Management
  async getMenuItems(): Promise<ApiResponse<MenuItem[]>> {
    return this.makeRequest<MenuItem[]>('menu_items?select=*');
  }

  async getMenuItemsByCategory(category: string): Promise<ApiResponse<MenuItem[]>> {
    return this.makeRequest<MenuItem[]>(`menu_items?category=eq.${category}&select=*`);
  }

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<ApiResponse<MenuItem>> {
    return this.makeRequest<MenuItem>(`menu_items?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  // Order Management
  async createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<ApiResponse<Order>> {
    return this.makeRequest<Order>('orders', {
      method: 'POST',
      body: JSON.stringify({
        ...order,
        createdAt: new Date().toISOString()
      })
    });
  }

  async getOrders(status?: string): Promise<ApiResponse<Order[]>> {
    const query = status ? `orders?status=eq.${status}&select=*` : 'orders?select=*';
    return this.makeRequest<Order[]>(query);
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<ApiResponse<Order>> {
    return this.makeRequest<Order>(`orders?id=eq.${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async getOrdersByTable(tableNumber: number): Promise<ApiResponse<Order[]>> {
    return this.makeRequest<Order[]>(`orders?tableNumber=eq.${tableNumber}&select=*`);
  }

  // Table Management
  async getTables(): Promise<ApiResponse<TableConfig[]>> {
    return this.makeRequest<TableConfig[]>('pos_tables?select=*');
  }

  async updateTableStatus(
    tableId: string, 
    status: TableConfig['status'], 
    orderId?: string
  ): Promise<ApiResponse<TableConfig>> {
    return this.makeRequest<TableConfig>(`pos_tables?id=eq.${tableId}`, {
      method: 'PATCH',
      body: JSON.stringify({ 
        status,
        currentOrderId: orderId || null
      })
    });
  }

  // Analytics & Reporting
  async getDailySales(date: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`orders?createdAt=gte.${date}T00:00:00&createdAt=lte.${date}T23:59:59&select=*`);
  }

  async getPopularItems(limit: number = 10): Promise<ApiResponse<any[]>> {
    // This would require a more complex query or stored procedure
    return this.makeRequest<any[]>(`rpc/get_popular_items?limit=${limit}`);
  }

  // Real-time subscriptions (for future implementation)
  subscribeToOrders(callback: (order: Order) => void): () => void {
    // Placeholder for real-time subscription implementation
    // Would use Supabase real-time features
    console.log('Real-time subscription placeholder');
    return () => console.log('Unsubscribe placeholder');
  }

  subscribeToTables(callback: (table: TableConfig) => void): () => void {
    // Placeholder for real-time table updates
    console.log('Table subscription placeholder');
    return () => console.log('Unsubscribe table placeholder');
  }
}

// Create singleton instance
export const cottageAPI = new CottageAPIClient();

// Export types for use in components
export type { MenuItem, Order, OrderItem, TableConfig, ApiResponse };
