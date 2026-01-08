/**
 * Offline-Enhanced POS Order Processing
 * 
 * Extends the POSDesktop order workflow with offline capabilities
 * Handles graceful degradation and local storage integration
 */

import { OrderItem } from '../utils/menuTypes';
import { offlineStorage, OfflineOrder } from '../utils/offlineStorage';
import { offlineSync } from '../utils/offlineSync';
import { toast } from 'sonner';

interface OrderData {
  orderType: 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
  tableNumber?: number;
  guestCount?: number;
  items: OrderItem[];
  customerData?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    street?: string;
    postcode?: string;
  };
  paymentMethod?: string;
}

interface ProcessOrderResult {
  success: boolean;
  orderId: string;
  isOffline: boolean;
  willSyncLater: boolean;
  error?: string;
}

/**
 * Enhanced order processing that works both online and offline
 */
export class OfflineOrderProcessor {
  /**
   * Process an order with offline-first capability
   */
  static async processOrder(orderData: OrderData): Promise<ProcessOrderResult> {
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const isOnline = navigator.onLine;
    
    try {
      // Calculate total
      const totalAmount = this.calculateOrderTotal(orderData.items);
      
      // Create offline order structure
      const offlineOrder: OfflineOrder = {
        id: orderId,
        order_type: orderData.orderType,
        table_number: orderData.tableNumber,
        guest_count: orderData.guestCount,
        items: orderData.items,
        total_amount: totalAmount,
        customer_data: orderData.customerData ? {
          first_name: orderData.customerData.firstName,
          last_name: orderData.customerData.lastName,
          phone: orderData.customerData.phone,
          address: orderData.customerData.address,
          street: orderData.customerData.street,
          postcode: orderData.customerData.postcode
        } : undefined,
        payment_method: orderData.paymentMethod || 'CASH',
        status: 'PENDING_SYNC',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sync_attempts: 0
      };
      
      if (isOnline) {
        // Try to sync immediately if online
        const syncSuccess = await offlineSync.syncOrderToServer(offlineOrder);
        
        if (syncSuccess) {
          toast.success('🎉 Order processed successfully!');
          return {
            success: true,
            orderId,
            isOffline: false,
            willSyncLater: false
          };
        } else {
          // Online but sync failed - save locally
          await offlineStorage.saveOrder(offlineOrder);
          toast.warning('⏳ Order saved locally - will retry sync automatically');
          return {
            success: true,
            orderId,
            isOffline: false,
            willSyncLater: true
          };
        }
      } else {
        // Offline mode - save locally
        await offlineStorage.saveOrder(offlineOrder);
        toast.success('📱 Order saved offline - will sync when connection returns', {
          description: `Order #${orderId.slice(-8)} saved locally`
        });
        
        return {
          success: true,
          orderId,
          isOffline: true,
          willSyncLater: true
        };
      }
      
    } catch (error) {
      console.error('❌ Failed to process order:', error);
      
      toast.error('Failed to process order', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      return {
        success: false,
        orderId,
        isOffline: !navigator.onLine,
        willSyncLater: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get orders from local storage for display
   */
  static async getLocalOrders(status?: 'PENDING_SYNC' | 'SYNCED' | 'FAILED_SYNC'): Promise<OfflineOrder[]> {
    try {
      return await offlineStorage.getOrders(status);
    } catch (error) {
      console.error('❌ Failed to get local orders:', error);
      return [];
    }
  }
  
  /**
   * Retry failed orders
   */
  static async retryFailedOrders(): Promise<{ success: number; failed: number }> {
    try {
      const failedOrders = await offlineStorage.getOrders('FAILED_SYNC');
      let successCount = 0;
      let failedCount = 0;
      
      for (const order of failedOrders) {
        const success = await offlineSync.syncOrderToServer(order);
        if (success) {
          successCount++;
        } else {
          failedCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`✅ Successfully synced ${successCount} orders`);
      }
      
      if (failedCount > 0) {
        toast.warning(`⚠️ ${failedCount} orders still failed to sync`);
      }
      
      return { success: successCount, failed: failedCount };
      
    } catch (error) {
      console.error('❌ Failed to retry orders:', error);
      toast.error('Failed to retry failed orders');
      return { success: 0, failed: 0 };
    }
  }
  
  /**
   * Calculate total for order items
   */
  private static calculateOrderTotal(items: OrderItem[]): number {
    return items.reduce((total, item) => {
      let itemTotal = item.price * item.quantity;
      
      // Add modifier prices if present
      if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach(modifier => {
          itemTotal += (modifier.price || 0) * item.quantity;
        });
      }
      
      return total + itemTotal;
    }, 0);
  }
  
  /**
   * Check if there are pending orders to sync
   */
  static async hasPendingOrders(): Promise<boolean> {
    try {
      const pending = await offlineStorage.getOrders('PENDING_SYNC');
      const failed = await offlineStorage.getOrders('FAILED_SYNC');
      return pending.length > 0 || failed.length > 0;
    } catch (error) {
      console.error('❌ Failed to check pending orders:', error);
      return false;
    }
  }
  
  /**
   * Get summary statistics for offline orders
   */
  static async getOrderStatistics(): Promise<{
    total: number;
    pending: number;
    synced: number;
    failed: number;
    totalValue: number;
  }> {
    try {
      const allOrders = await offlineStorage.getOrders();
      
      const stats = {
        total: allOrders.length,
        pending: allOrders.filter(o => o.status === 'PENDING_SYNC').length,
        synced: allOrders.filter(o => o.status === 'SYNCED').length,
        failed: allOrders.filter(o => o.status === 'FAILED_SYNC').length,
        totalValue: allOrders.reduce((sum, order) => sum + order.total_amount, 0)
      };
      
      return stats;
    } catch (error) {
      console.error('❌ Failed to get order statistics:', error);
      return {
        total: 0,
        pending: 0,
        synced: 0,
        failed: 0,
        totalValue: 0
      };
    }
  }
  
  /**
   * Clear old synced orders to free up space
   */
  static async cleanupOldOrders(daysToKeep: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const syncedOrders = await offlineStorage.getOrders('SYNCED');
      const oldOrders = syncedOrders.filter(order => 
        new Date(order.created_at) < cutoffDate
      );
      
      // Delete old orders (this would need to be implemented in offlineStorage)
      // For now, just return count
      return oldOrders.length;
    } catch (error) {
      console.error('❌ Failed to cleanup old orders:', error);
      return 0;
    }
  }
}

/**
 * Hook for managing offline order state in React components
 */
export function useOfflineOrders() {
  const [orders, setOrders] = React.useState<OfflineOrder[]>([]);
  const [statistics, setStatistics] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const refreshOrders = async () => {
    try {
      setIsLoading(true);
      const [allOrders, stats] = await Promise.all([
        OfflineOrderProcessor.getLocalOrders(),
        OfflineOrderProcessor.getOrderStatistics()
      ]);
      setOrders(allOrders);
      setStatistics(stats);
    } catch (error) {
      console.error('❌ Failed to refresh orders:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const retryFailedOrders = async () => {
    const result = await OfflineOrderProcessor.retryFailedOrders();
    await refreshOrders(); // Refresh after retry
    return result;
  };
  
  React.useEffect(() => {
    refreshOrders();
  }, []);
  
  return {
    orders,
    statistics,
    isLoading,
    refreshOrders,
    retryFailedOrders,
    processOrder: OfflineOrderProcessor.processOrder
  };
}

// Import React for the hook
import React from 'react';
