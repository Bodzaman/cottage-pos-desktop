import { OrderItem } from './menuTypes';
import { toast } from 'sonner';

export interface PendingPaymentOrder {
  id: string;
  orderType: 'COLLECTION' | 'DELIVERY' | 'WAITING';
  orderItems: OrderItem[];
  total: number;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  tableNumber?: number;
  timestamp: number;
  status: 'PENDING_PAYMENT' | 'READY_FOR_COLLECTION';
  kitchenTicketPrinted: boolean;
  customerReceiptPrinted: boolean;
}

class PendingPaymentService {
  private storageKey = 'pos_pending_payments';
  private listeners: ((orders: PendingPaymentOrder[]) => void)[] = [];

  /**
   * Get all pending payment orders
   */
  getPendingOrders(): PendingPaymentOrder[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading pending orders:', error);
      return [];
    }
  }

  /**
   * Add a new pending payment order
   */
  addPendingOrder(order: Omit<PendingPaymentOrder, 'id' | 'timestamp'>): string {
    const orderId = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newOrder: PendingPaymentOrder = {
      ...order,
      id: orderId,
      timestamp: Date.now(),
      status: 'PENDING_PAYMENT'
    };

    const orders = this.getPendingOrders();
    orders.push(newOrder);
    this.saveOrders(orders);
    this.notifyListeners(orders);

    toast.success('Order added to pending payment queue', {
      description: `Order ID: ${orderId.split('_')[1]}`
    });

    return orderId;
  }

  /**
   * Complete payment for a pending order
   */
  completePayment(orderId: string): PendingPaymentOrder | null {
    const orders = this.getPendingOrders();
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex === -1) {
      toast.error('Order not found in pending queue');
      return null;
    }

    const order = orders[orderIndex];
    orders.splice(orderIndex, 1); // Remove from pending queue
    this.saveOrders(orders);
    this.notifyListeners(orders);

    toast.success('Payment completed', {
      description: 'Order removed from pending queue'
    });

    return order;
  }

  /**
   * Remove a pending order (e.g., if cancelled)
   */
  removePendingOrder(orderId: string): boolean {
    const orders = this.getPendingOrders();
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex === -1) {
      return false;
    }

    orders.splice(orderIndex, 1);
    this.saveOrders(orders);
    this.notifyListeners(orders);

    toast.info('Order removed from pending queue');
    return true;
  }

  /**
   * Get count of pending orders
   */
  getPendingCount(): number {
    return this.getPendingOrders().length;
  }

  /**
   * Find pending order by customer phone or name
   */
  findOrderByCustomer(searchTerm: string): PendingPaymentOrder[] {
    const orders = this.getPendingOrders();
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return orders.filter(order => 
      order.customerPhone?.toLowerCase().includes(lowerSearchTerm) ||
      order.customerName?.toLowerCase().includes(lowerSearchTerm)
    );
  }

  /**
   * Update order status (e.g., mark as ready for collection)
   */
  updateOrderStatus(orderId: string, status: PendingPaymentOrder['status']): boolean {
    const orders = this.getPendingOrders();
    const order = orders.find(order => order.id === orderId);
    
    if (!order) {
      return false;
    }

    order.status = status;
    this.saveOrders(orders);
    this.notifyListeners(orders);
    return true;
  }

  /**
   * Subscribe to pending orders changes
   */
  subscribe(listener: (orders: PendingPaymentOrder[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Clear all pending orders (admin function)
   */
  clearAllPending(): void {
    this.saveOrders([]);
    this.notifyListeners([]);
    toast.info('All pending orders cleared');
  }

  private saveOrders(orders: PendingPaymentOrder[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(orders));
    } catch (error) {
      console.error('Error saving pending orders:', error);
      toast.error('Failed to save pending order');
    }
  }

  private notifyListeners(orders: PendingPaymentOrder[]): void {
    this.listeners.forEach(listener => {
      try {
        listener(orders);
      } catch (error) {
        console.error('Error notifying pending payment listener:', error);
      }
    });
  }
}

// Export singleton instance
export const pendingPaymentService = new PendingPaymentService();
