import { TableOrder, TableOrderItem, TableStatus, TableData } from "./tableTypes";
import { toast } from "sonner";
import { supabase } from './supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Simple print job interface for logging
interface PrintJob {
  id: string;
  type: string;
  data: any;
}

// Define the kitchen order type
export interface KitchenOrder extends TableOrder {
  tableNumber: number;
  orderType: 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
  customerName?: string;
  waitingTime: number; // Minutes since order creation
  timeDisplay: string; // Formatted time for display
  isUrgent?: boolean; // Flag for urgent orders
  status: KitchenOrderStatus; // Current status of the order
  id?: string; // Unique ID for this kitchen order (different from orderId)
  orderSource: 'POS' | 'ONLINE'; // NEW: Source of the order
}

// Kitchen order status
export type KitchenOrderStatus = 'PREPARING' | 'READY' | 'COMPLETED' | 'DELAYED';

// Subscriber function for kitchen order updates
type KitchenOrderSubscriber = (orders: KitchenOrder[]) => void;

class KitchenService {
  private kitchenOrders: KitchenOrder[] = [];
  private subscribers: KitchenOrderSubscriber[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private eventHandler: EventListener | null = null;
  private realtimeChannel: RealtimeChannel | null = null;
  private isRealtimeInitialized: boolean = false; // NEW: Track if subscription is initialized
  
  constructor() {
    // Start the timer to update waiting times
    this.startUpdateTimer();
    // DON'T set up real-time subscription here - wait for explicit initialization
    // this.setupRealtimeSubscription(); // REMOVED
  }
  
  // Start timer for updating waiting times - now uses events instead of polling
  private startUpdateTimer() {
    // Instead of using an interval, we'll set up an event listener
    // for manual refresh requests
    
    // First, clean up any existing timer
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // Create a handler for refresh events
    const handleRefresh = () => {
      // Update waiting times
      this.updateWaitingTimes();
      // Notify subscribers
      this.notifySubscribers();
    };
    
    // Add event listener for kitchen refresh events
    document.addEventListener('refresh-kitchen', handleRefresh);
    
    // Store the event handler for cleanup
    this.eventHandler = handleRefresh;
    
    // Initial update
    this.updateWaitingTimes();
    this.notifySubscribers();
  }

  // Map Supabase order status to Kitchen status
  private mapSupabaseStatusToKitchenStatus(status: string): KitchenOrderStatus {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'preparing':
      case 'pending':
        return 'PREPARING';
      case 'ready':
        return 'READY';
      case 'completed':
      case 'delivered':
        return 'COMPLETED';
      case 'delayed':
        return 'DELAYED';
      default:
        return 'PREPARING';
    }
  }

  // Map Kitchen status back to Supabase status
  private mapKitchenStatusToSupabaseStatus(status: KitchenOrderStatus): string {
    switch (status) {
      case 'PREPARING':
        return 'preparing';
      case 'READY':
        return 'ready';
      case 'COMPLETED':
        return 'completed';
      case 'DELAYED':
        return 'delayed';
      default:
        return 'preparing';
    }
  }

  // Fetch online orders from Supabase
  private async fetchOnlineOrders(): Promise<KitchenOrder[]> {
    try {
      console.log('🔍 [fetchOnlineOrders] Starting fetch from Supabase orders table...');
      
      const { data: onlineOrders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_source', 'CUSTOMER_ONLINE_ORDER')
        .in('status', ['confirmed', 'preparing', 'ready'])
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ [fetchOnlineOrders] Error fetching online orders:', error);
        return [];
      }

      if (!onlineOrders || onlineOrders.length === 0) {
        console.log('ℹ️ [fetchOnlineOrders] No online orders found');
        return [];
      }

      console.log(`📦 [fetchOnlineOrders] Fetched ${onlineOrders.length} raw online orders from Supabase`);
      console.log('🔍 [fetchOnlineOrders] Sample raw order:', JSON.stringify(onlineOrders[0], null, 2));

      // Transform online orders to KitchenOrder format
      const now = new Date();
      const transformedOrders: KitchenOrder[] = onlineOrders.map((order, index) => {
        console.log(`🔄 [fetchOnlineOrders] Transforming order ${index + 1}/${onlineOrders.length}: ${order.id}`);
        
        const createdAt = new Date(order.created_at);
        const waitingTime = this.calculateWaitingTime(createdAt);
        
        // Parse items from JSON if needed
        const items = typeof order.items === 'string' 
          ? JSON.parse(order.items) 
          : (order.items || []);

        console.log(`  📝 Items type: ${typeof order.items}, count: ${items.length}`);

        // Transform items to match TableOrderItem format
        const transformedItems = items.map((item: any) => ({
          id: item.id || item.item_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          sentToKitchen: true,
          addedAt: createdAt,
          printedOnTicket: false,
          itemStatus: 'PREPARING' as const,
          isNewItem: false,
          notes: item.notes || '',
          variant: item.variant
        }));

        // ✅ FIX: Explicitly type orderSource as primitive string literal with type assertion
        const ORDER_SOURCE_ONLINE: 'ONLINE' = 'ONLINE';
        
        const transformed: KitchenOrder = {
          orderId: order.id,
          orderType: (order.order_type || 'COLLECTION') as 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING',
          orderSource: ORDER_SOURCE_ONLINE, // ✅ Use const variable to ensure primitive type
          customerName: order.customer_name || 'Online Customer',
          tableNumber: 0, // Online orders don't have table numbers
          items: transformedItems,
          status: this.mapSupabaseStatusToKitchenStatus(order.status),
          createdAt,
          lastUpdatedAt: new Date(order.updated_at || order.created_at),
          lastSentToKitchenAt: createdAt,
          billPrinted: true, // Online orders are pre-paid
          billPrintedAt: createdAt,
          splitBillMode: false,
          paymentStatus: 'PAID' as const,
          serviceCharge: 0,
          discount: 0,
          tip: order.tip_amount || 0,
          notes: order.special_instructions || '',
          waitingTime,
          timeDisplay: this.formatWaitingTime(waitingTime),
          isUrgent: waitingTime > 15,
        };
        
        // ✅ DIAGNOSTIC: Log orderSource type before returning
        console.log(`  ✅ orderSource type: ${typeof transformed.orderSource}, value: "${transformed.orderSource}"`);
        
        return transformed;
      });

      console.log(`✅ [fetchOnlineOrders] Successfully transformed ${transformedOrders.length} online orders`);
      console.log('🔍 [fetchOnlineOrders] Sample transformed order orderSource:', {
        type: typeof transformedOrders[0]?.orderSource,
        value: transformedOrders[0]?.orderSource
      });
      
      return transformedOrders;
    } catch (error) {
      console.error('❌ [fetchOnlineOrders] Error in fetchOnlineOrders:', error);
      return [];
    }
  }

  // Set up real-time subscription for online orders (call explicitly when needed)
  public initializeRealtimeSubscription() {
    if (this.isRealtimeInitialized) {
      console.log('⏭️ Real-time subscription already initialized, skipping');
      return;
    }

    this.isRealtimeInitialized = true;
    this.setupRealtimeSubscription();
  }

  // Set up real-time subscription for online orders
  private setupRealtimeSubscription() {
    try {
      // Clean up existing subscription
      if (this.realtimeChannel) {
        supabase.removeChannel(this.realtimeChannel);
        this.realtimeChannel = null;
      }

      console.log('🔄 Setting up real-time subscription for online orders...');

      // Create new subscription for online orders
      this.realtimeChannel = supabase
        .channel('kitchen-orders')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: 'order_source=eq.CUSTOMER_ONLINE_ORDER'
          },
          (payload) => {
            console.log('📡 Real-time order update received:', payload);
            // Refresh all orders when any online order changes
            this.syncWithPOS();
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time subscription active for online orders');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Real-time subscription error:', { status, error: err });
          } else if (status === 'TIMED_OUT') {
            console.error('⏱️ Real-time subscription timed out');
          } else if (status === 'CLOSED') {
            console.warn('🔒 Real-time subscription closed');
          } else {
            console.log('📊 Real-time subscription status:', status);
          }
        });
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
    }
  }
  
  // Stop the update timer and clean up event listeners
  public stopUpdateTimer() {
    // Clean up timer if it exists
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // Clean up event listener if it exists
    if (this.eventHandler) {
      document.removeEventListener('refresh-kitchen', this.eventHandler);
      this.eventHandler = null;
    }

    // Clean up real-time subscription
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
      console.log('🧹 Cleaned up real-time subscription');
    }
  }
  
  // Update waiting times for all orders
  private updateWaitingTimes(): void {
    const now = new Date();
    
    this.kitchenOrders = this.kitchenOrders.map(order => {
      const createdAt = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
      const waitingTime = this.calculateWaitingTime(createdAt);
      
      return {
        ...order,
        waitingTime,
        timeDisplay: this.formatWaitingTime(waitingTime),
        isUrgent: waitingTime > 15,
      };
    });

    this.notifySubscribers();
  }
  
  // Get waiting time color based on time and order type
  public getWaitingTimeColor(minutes: number, orderType: string): string {
    // Different thresholds based on order type
    const thresholds = {
      'DINE-IN': { amber: 10, orange: 15, red: 20 },
      'WAITING': { amber: 5, orange: 10, red: 15 },
      'COLLECTION': { amber: 8, orange: 12, red: 18 },
      'DELIVERY': { amber: 15, orange: 20, red: 25 }
    };
    
    // Use DINE-IN as default if orderType is not recognized
    const typeThresholds = thresholds[orderType as keyof typeof thresholds] || thresholds['DINE-IN'];
    
    if (minutes >= typeThresholds.red) return 'red';
    if (minutes >= typeThresholds.orange) return 'orange';
    if (minutes >= typeThresholds.amber) return 'amber';
    if (minutes >= 5) return 'yellow';
    return 'green';
  }
  
  // Format waiting time for display
  private formatWaitingTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
  }
  
  // Calculate waiting time in minutes from a given date
  private calculateWaitingTime(createdAt: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins;
  }
  
  // Handle new kitchen notifications
  private handleKitchenNotification = (orderId: string, tableNumber: number) => {
    console.log('New kitchen order notification:', { orderId, tableNumber });
    // Update kitchen orders when new items are sent
    this.syncWithPOS();
  };
  
  // Handle POS sync - get the latest orders from POS tables
  public syncWithPOS(posTableData?: TableData[]) {
    console.log("🔄 Syncing KitchenService with POS");
    
    // If posTableData is provided, use it directly (for better efficiency)
    // Otherwise, use the mock data from localStorage
    try {
      // Get tables data from localStorage if not provided
      const tablesData = posTableData || this.getTablesFromStorage();
      if (!tablesData || tablesData.length === 0) return;
      
      // Process tables with active orders
      const activeOrders: KitchenOrder[] = [];
      
      tablesData.forEach(table => {
        // Skip tables without active orders
        if (!table.activeOrderId) return;
        
        // Get the current active order
        const currentOrder = table.orders.find(o => o.orderId === table.activeOrderId);
        if (!currentOrder) return;
        
        // Skip if the order is not sent to kitchen yet
        if (!table.sentToKitchen && !currentOrder.lastSentToKitchenAt) return;
        
        // Calculate waiting time
        const waitingTime = this.calculateWaitingTime(currentOrder.createdAt);
        
        // Get existing order status if it exists in our kitchen orders
        const existingKitchenOrder = this.kitchenOrders.find(ko => ko.orderId === currentOrder.orderId);
        const status = existingKitchenOrder?.status || 'PREPARING';

        // Check for new items by comparing current order with existing kitchen order
        let processedItems = [...currentOrder.items]; // Default to current items
        
        // If this order already exists in our kitchen orders, process items to detect new ones
        if (existingKitchenOrder) {
          processedItems = currentOrder.items.map(posItem => {
            // Find if this item already existed
            const existingItem = existingKitchenOrder.items.find(item => item.id === posItem.id);
            
            // New item if not found in existing order
            if (!existingItem) {
              return { ...posItem, isNewItem: true };
            }
            
            // Item was updated more recently than last kitchen print
            if (posItem.lastUpdatedAt > (existingItem.lastKitchenPrintAt || new Date(0))) {
              return { ...posItem, isNewItem: true };
            }
            
            // Preserve existing item status
            return { 
              ...posItem, 
              isNewItem: existingItem.isNewItem || false,
              itemStatus: existingItem.itemStatus || posItem.itemStatus
            };
          });
        } else {
          // All items in a new order should be marked as new
          processedItems = processedItems.map(item => ({
            ...item,
            isNewItem: true
          }));
        }
        
        // Create or update the kitchen order with POS source
        const kitchenOrder: KitchenOrder = {
          ...currentOrder,
          tableNumber: table.tableNumber,
          orderType: 'DINE-IN' as 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING',
          orderSource: 'POS', // Mark as POS order
          waitingTime,
          timeDisplay: this.formatWaitingTime(waitingTime),
          status,
          isUrgent: waitingTime > 15, // More than 15 minutes is urgent
          items: processedItems
        };
        
        activeOrders.push(kitchenOrder);
      });
      
      // Add collection, delivery and waiting orders from local storage mock
      const mockOrders = this.getMockOrdersFromStorage();
      if (mockOrders && mockOrders.length > 0) {
        // Filter out any completed orders that have been in completed status for > 30 mins
        const nonExpiredMockOrders = mockOrders.filter(order => {
          if (order.status !== 'COMPLETED') return true;
          
          // If completed, check if it's been completed for less than 30 minutes
          if (order.completedAt) {
            const completedTime = new Date(order.completedAt).getTime();
            const now = Date.now();
            return (now - completedTime) < 30 * 60 * 1000; // 30 minutes
          }
          
          return true;
        });
        
        // Process each mock order to check for new items against existing kitchen orders
        const processedMockOrders = nonExpiredMockOrders.map(mockOrder => {
          const existingKitchenOrder = this.kitchenOrders.find(ko => ko.orderId === mockOrder.orderId);
          
          // If we have an existing order, check for new/updated items
          if (existingKitchenOrder) {
            const processedItems = mockOrder.items.map(posItem => {
              // Find if this item already existed
              const existingItem = existingKitchenOrder.items.find(item => item.id === posItem.id);
              
              // New item if not found in existing order
              if (!existingItem) {
                return { ...posItem, isNewItem: true };
              }
              
              // Preserve existing item status
              return { 
                ...posItem, 
                isNewItem: existingItem.isNewItem || false,
                itemStatus: existingItem.itemStatus || posItem.itemStatus
              };
            });
            
            return {
              ...mockOrder,
              orderSource: 'POS' as const, // Mark mock orders as POS
              items: processedItems
            };
          }
          
          return {
            ...mockOrder,
            orderSource: 'POS' as const // Mark mock orders as POS
          };
        });
        
        // Add mock orders
        activeOrders.push(...processedMockOrders);
      }

      // ✅ NEW: Fetch and merge online orders from Supabase
      this.fetchOnlineOrders().then(onlineOrders => {
        // Merge POS orders with online orders
        const allOrders = [...activeOrders, ...onlineOrders];
        
        // Update our kitchen orders with merged data
        this.kitchenOrders = allOrders;
        
        // Update waiting times
        this.updateWaitingTimes();
        
        // Notify subscribers of the update
        this.notifySubscribers();
        
        // Dispatch event to inform other components that kitchen data has changed
        document.dispatchEvent(new CustomEvent('kitchen-data-updated'));
        
        console.log(`✅ Synced ${this.kitchenOrders.length} total orders (${activeOrders.length} POS + ${onlineOrders.length} Online)`);
      }).catch(error => {
        console.error('Error fetching online orders, using POS only:', error);
        // Fallback to POS-only if online fetch fails
        this.kitchenOrders = activeOrders;
        this.updateWaitingTimes();
        this.notifySubscribers();
        document.dispatchEvent(new CustomEvent('kitchen-data-updated'));
        console.log(`✅ Synced ${this.kitchenOrders.length} POS orders (online fetch failed)`);
      });
      
    } catch (error) {
      console.error("Error syncing with POS:", error);
    }
    
    return this.kitchenOrders;
  }
  
  // Process tables data to extract kitchen orders
  private processTablesData(tables: TableData[]): KitchenOrder[] {
    const kitchenOrders: KitchenOrder[] = [];
    
    tables.forEach(table => {
      // Skip tables without active orders or items not sent to kitchen
      if (!table.activeOrderId || !table.sentToKitchen) return;
      
      const activeOrder = table.orders.find(order => order.orderId === table.activeOrderId);
      if (!activeOrder) return;
      
      // Skip if no items are sent to kitchen
      if (!activeOrder.items.some(item => item.sentToKitchen)) return;
      
      // Calculate waiting time
      const now = new Date();
      const diffMs = now.getTime() - (activeOrder.createdAt instanceof Date ? activeOrder.createdAt.getTime() : Date.parse(activeOrder.createdAt as unknown as string));
      const diffMins = Math.floor(diffMs / 60000);
      
      // Check for urgent status (e.g., waiting more than 20 minutes or WAITING order)
      const isUrgent = diffMins > 20 || table.status === "WAITING";
      
      // Determine kitchen order status
      let orderStatus: KitchenOrderStatus = 'PREPARING';
      
      // If all items are ready, mark the order as ready
      if (activeOrder.items.every(item => item.itemStatus === 'READY' || item.itemStatus === 'SERVED')) {
        orderStatus = 'READY';
      }
      
      // If all items are served, mark the order as completed
      if (activeOrder.items.every(item => item.itemStatus === 'SERVED')) {
        orderStatus = 'COMPLETED';
      }
      
      // Create a kitchen order
      const kitchenOrder: KitchenOrder = {
        ...activeOrder,
        tableNumber: table.tableNumber,
        orderType: 'DINE-IN', // Default for table orders
        waitingTime: diffMins,
        timeDisplay: this.formatWaitingTime(diffMins),
        isUrgent,
        status: orderStatus
      };
      
      kitchenOrders.push(kitchenOrder);
    });
    
    return kitchenOrders;
  }
  
  // Subscribe to kitchen order updates
  public subscribe(callback: KitchenOrderSubscriber): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }
  
  // Notify all subscribers of updates
  private notifySubscribers() {
    this.subscribers.forEach(subscriber => {
      subscriber([...this.kitchenOrders]);
    });
  }
  
  // Update item status
  public updateItemStatus(orderId: string, itemId: string, newStatus: 'NEW' | 'PREPARING' | 'READY' | 'SERVED'): boolean {
    let updated = false;
    
    this.kitchenOrders = this.kitchenOrders.map(order => {
      if (order.orderId === orderId) {
        // Update the specific item
        const updatedItems = order.items.map(item => {
          if (item.id === itemId) {
            updated = true;
            return { ...item, itemStatus: newStatus };
          }
          return item;
        });
        
        return { 
          ...order, 
          items: updatedItems,
          lastUpdatedAt: new Date()
        };
      }
      return order;
    });
    
    // If any items were updated, notify subscribers
    if (updated) {
      this.notifySubscribers();
      
      // In a real implementation, we would also update the database
      // And sync with the POS system
    }
    
    return updated;
  }
  
  // Update order status (e.g., mark as READY, COMPLETED or DELAYED)
  // Also syncs with POS system to ensure kitchen and front-of-house are in sync
  public updateOrderStatus(orderId: string, newStatus: KitchenOrderStatus): boolean {
    console.log(`Updating order ${orderId} to status: ${newStatus}`);
    let updated = false;
    
    this.kitchenOrders = this.kitchenOrders.map(order => {
      if (order.orderId === orderId) {
        // When marking as ready, update all preparing items to ready
        let updatedItems = [...order.items];
        
        if (newStatus === 'READY') {
          updatedItems = updatedItems.map(item => {
            if (item.itemStatus === 'PREPARING' || item.itemStatus === 'NEW') {
              return { 
                ...item, 
                itemStatus: 'READY',
                isNewItem: false // Clear new item flag when status changes
              };
            }
            return item;
          });
        } else if (newStatus === 'DELAYED') {
          // When marking as delayed, only update status - don't change item status
          // In a real system, this would trigger notifications to staff
          console.log('Marking order as delayed - staff notified');
        } else if (newStatus === 'COMPLETED') {
          updatedItems = updatedItems.map(item => {
            if (item.itemStatus !== 'SERVED') {
              return { 
                ...item, 
                itemStatus: 'SERVED',
                isNewItem: false // Clear new item flag when completing
              };
            }
            return item;
          });
        }
        
        updated = true;
        
        // Clear the "new item" flags when updating status
        if (newStatus !== 'DELAYED') {
          updatedItems = updatedItems.map(item => ({
            ...item,
            isNewItem: false // Clear new item flag on status changes
          }));
        }
        
        return { 
          ...order, 
          items: updatedItems,
          status: newStatus,
          lastUpdatedAt: new Date(),
          // If we're marking as complete, note the completion time
          ...(newStatus === 'COMPLETED' && { completedAt: new Date() })
        };
      }
      return order;
    });
    
    // If the order was updated, notify subscribers
    if (updated) {
      this.notifySubscribers();
      
      // Update the POS system with the new status
      this.syncStatusWithPOS(orderId, newStatus);
      
      // Send a toast notification to alert kitchen staff
      if (newStatus === 'DELAYED') {
        toast.warning(`Order ${orderId.slice(-6)} marked as delayed! Kitchen staff notified.`);
      } else if (newStatus === 'READY') {
        toast.success(`Order ${orderId.slice(-6)} ready for pickup/service!`);
      } else if (newStatus === 'COMPLETED') {
        toast.success(`Order ${orderId.slice(-6)} completed and removed from active queue.`);
      }
    }
    
    return updated;
  }
  
  // Update the status of an order
  public updateOrderStatus(orderId: string, newStatus: KitchenOrderStatus) {
    const order = this.kitchenOrders.find(o => o.orderId === orderId);
    if (!order) return;
    
    order.status = newStatus;
    order.lastUpdatedAt = new Date();
    
    // Set completion time if status is COMPLETED
    if (newStatus === 'COMPLETED') {
      order.completedAt = new Date();
    }
    
    // ✅ NEW: If this is an online order, sync status back to Supabase
    if (order.orderSource === 'ONLINE') {
      this.syncStatusToSupabase(orderId, newStatus).catch(error => {
        console.error('Failed to sync status to Supabase:', error);
        toast.error('Failed to update online order status');
      });
    }
    
    this.notifySubscribers();
    
    // Dispatch event for other components
    document.dispatchEvent(new CustomEvent('kitchen-order-updated', { 
      detail: { orderId, status: newStatus } 
    }));
  }

  // Sync kitchen status updates back to Supabase for online orders
  private async syncStatusToSupabase(orderId: string, kitchenStatus: KitchenOrderStatus): Promise<void> {
    try {
      const supabaseStatus = this.mapKitchenStatusToSupabaseStatus(kitchenStatus);
      
      const updateData: any = {
        status: supabaseStatus,
        updated_at: new Date().toISOString()
      };
      
      // If completed, also set completed_at timestamp
      if (kitchenStatus === 'COMPLETED') {
        updateData.completed_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .eq('order_source', 'CUSTOMER_ONLINE_ORDER');
      
      if (error) {
        console.error('Error updating Supabase order status:', error);
        throw error;
      }
      
      console.log(`✅ Updated online order ${orderId} status to ${supabaseStatus}`);
    } catch (error) {
      console.error('Error in syncStatusToSupabase:', error);
      throw error;
    }
  }
  
  // Get all kitchen orders
  public getKitchenOrders(): KitchenOrder[] {
    return [...this.kitchenOrders];
  }
  
  // Get order by ID
  public getOrderById(orderId: string): KitchenOrder | undefined {
    return this.kitchenOrders.find(order => order.orderId === orderId);
  }
  
  // Get tables data from localStorage
  private getTablesFromStorage(): TableData[] {
    try {
      const tablesData = localStorage.getItem('tables');
      return tablesData ? JSON.parse(tablesData) : [];
    } catch (error) {
      console.error('Error getting tables from storage:', error);
      return [];
    }
  }

  // Sync order status with POS system
  private syncStatusWithPOS(orderId: string, newStatus: KitchenOrderStatus) {
    console.log(`Syncing order ${orderId} status ${newStatus} with POS system`);
    
    // Get tables data from localStorage
    const tablesData = this.getTablesFromStorage();
    if (!tablesData) return;
    
    // Find the table with this order
    let updated = false;
    
    // Update in local storage - in a real app this would be a database update
    const updatedTablesData = tablesData.map(table => {
      // Check if this table has the order we're looking for
      const orderIndex = table.orders.findIndex(order => order.orderId === orderId);
      if (orderIndex === -1) return table;
      
      // Found the table with this order
      updated = true;
      const updatedOrder = { ...table.orders[orderIndex] };
      
      // Update the order based on the kitchen status
      if (newStatus === 'COMPLETED') {
        // Mark all items as SERVED in the POS system
        updatedOrder.items = updatedOrder.items.map(item => ({
          ...item,
          itemStatus: 'SERVED'
        }));
        
        // Update table status if appropriate
        if (table.status === 'ORDERED') {
          table.status = 'BILL_REQUESTED'; // Move to bill stage
        }
      } else if (newStatus === 'READY') {
        // Mark items as READY in the POS system
        updatedOrder.items = updatedOrder.items.map(item => {
          if (item.itemStatus === 'PREPARING' || item.itemStatus === 'NEW') {
            return { ...item, itemStatus: 'READY' };
          }
          return item;
        });
      }
      
      // Replace the order in the table's orders array
      const updatedOrders = [...table.orders];
      updatedOrders[orderIndex] = updatedOrder;
      
      return {
        ...table,
        orders: updatedOrders,
        lastUpdatedAt: new Date()
      };
    });
    
    if (updated) {
      // Save the updated tables back to localStorage
      localStorage.setItem('tables', JSON.stringify(updatedTablesData));
      console.log('POS system updated with kitchen status changes');
    }
  }
  
  // Generate mock orders for development
  private generateMockOrders(): KitchenOrder[] {
    const now = new Date();
    return [
      {
        orderId: 'ord_123456',
        tableNumber: 5,
        orderType: 'DINE-IN',
        items: [
          {
            id: 'item_1',
            name: 'Chicken Tikka Masala',
            price: 12.95,
            quantity: 2,
            sentToKitchen: true,
            addedAt: new Date(now.getTime() - 10 * 60000),
            printedOnTicket: true,
            itemStatus: 'PREPARING',
            isNewItem: false,
          },
          {
            id: 'item_2',
            name: 'Garlic Naan',
            price: 3.50,
            quantity: 3,
            sentToKitchen: true,
            addedAt: new Date(now.getTime() - 10 * 60000),
            printedOnTicket: true,
            itemStatus: 'PREPARING',
            isNewItem: false,
          }
        ],
        createdAt: new Date(now.getTime() - 10 * 60000),
        lastUpdatedAt: new Date(now.getTime() - 8 * 60000),
        lastSentToKitchenAt: new Date(now.getTime() - 10 * 60000),
        billPrinted: false,
        billPrintedAt: null,
        splitBillMode: false,
        paymentStatus: 'UNPAID',
        serviceCharge: 10,
        discount: 0,
        tip: 0,
        notes: '',
        waitingTime: 10, // 10 minutes
        timeDisplay: '10m',
        status: 'PREPARING',
      },
      {
        orderId: 'ord_789012',
        tableNumber: 0, // No table for collection
        orderType: 'COLLECTION',
        customerName: 'John Smith',
        items: [
          {
            id: 'item_3',
            name: 'Vegetable Biryani',
            price: 10.95,
            quantity: 1,
            sentToKitchen: true,
            addedAt: new Date(now.getTime() - 5 * 60000),
            printedOnTicket: true,
            itemStatus: 'NEW',
            isNewItem: false,
          },
          {
            id: 'item_4',
            name: 'Onion Bhaji',
            price: 4.50,
            quantity: 2,
            sentToKitchen: true,
            addedAt: new Date(now.getTime() - 5 * 60000),
            printedOnTicket: true,
            itemStatus: 'NEW',
            isNewItem: false,
          }
        ],
        createdAt: new Date(now.getTime() - 5 * 60000),
        lastUpdatedAt: new Date(now.getTime() - 5 * 60000),
        lastSentToKitchenAt: new Date(now.getTime() - 5 * 60000),
        billPrinted: true,
        billPrintedAt: new Date(now.getTime() - 4 * 60000),
        splitBillMode: false,
        paymentStatus: 'PAID',
        serviceCharge: 0,
        discount: 0,
        tip: 0,
        notes: 'Customer arriving at 7:30pm',
        waitingTime: 5, // 5 minutes
        timeDisplay: '5m',
        status: 'PREPARING',
      },
      {
        orderId: 'ord_345678',
        tableNumber: 0, // No table for waiting
        orderType: 'WAITING',
        customerName: 'Lisa Johnson',
        isUrgent: true,
        items: [
          {
            id: 'item_5',
            name: 'Lamb Rogan Josh',
            price: 13.95,
            quantity: 1,
            sentToKitchen: true,
            addedAt: new Date(now.getTime() - 2 * 60000),
            printedOnTicket: true,
            itemStatus: 'NEW',
            isNewItem: false,
          },
          {
            id: 'item_6',
            name: 'Pilau Rice',
            price: 3.50,
            quantity: 1,
            sentToKitchen: true,
            addedAt: new Date(now.getTime() - 2 * 60000),
            printedOnTicket: true,
            itemStatus: 'NEW',
            isNewItem: false,
          }
        ],
        createdAt: new Date(now.getTime() - 2 * 60000),
        lastUpdatedAt: new Date(now.getTime() - 2 * 60000),
        lastSentToKitchenAt: new Date(now.getTime() - 2 * 60000),
        billPrinted: false,
        billPrintedAt: null,
        splitBillMode: false,
        paymentStatus: 'UNPAID',
        serviceCharge: 0,
        discount: 0,
        tip: 0,
        notes: 'Customer waiting in restaurant',
        waitingTime: 2, // 2 minutes
        timeDisplay: '2m',
        status: 'PREPARING',
      }
    ];
  }
}

// Export a singleton instance
// Initialize and export singleton
export const kitchenService = new KitchenService();
