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

      const { data: onlineOrders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_source', 'CUSTOMER_ONLINE_ORDER')
        .in('status', ['confirmed', 'preparing', 'ready'])
        .order('created_at', { ascending: true });

      if (error) {
        return [];
      }

      if (!onlineOrders || onlineOrders.length === 0) {
        return [];
      }


      // Transform online orders to KitchenOrder format
      const now = new Date();
      const transformedOrders: KitchenOrder[] = onlineOrders.map((order, index) => {

        const createdAt = new Date(order.created_at);
        const waitingTime = this.calculateWaitingTime(createdAt);

        // Parse items from JSON if needed
        const items = typeof order.items === 'string'
          ? JSON.parse(order.items)
          : (order.items || []);


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

        // Explicitly type orderSource as primitive string literal with type assertion
        const ORDER_SOURCE_ONLINE: 'ONLINE' = 'ONLINE';

        const transformed: KitchenOrder = {
          orderId: order.id,
          orderType: (order.order_type || 'COLLECTION') as 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING',
          orderSource: ORDER_SOURCE_ONLINE,
          customerName: order.customer_name || 'Online Customer',
          tableNumber: 0, // Online orders don't have table numbers
          items: transformedItems,
          status: this.mapSupabaseStatusToKitchenStatus(order.status),
          createdAt,
          waitingTime,
          timeDisplay: this.formatWaitingTime(waitingTime),
          isUrgent: waitingTime > 20,
          lastUpdatedAt: new Date(order.updated_at || order.created_at),
          lastSentToKitchenAt: createdAt,
          billPrinted: false,
          billPrintedAt: null,
          splitBillMode: false,
          paymentStatus: order.payment_status || 'UNPAID',
          serviceCharge: 0,
          discount: order.discount || 0,
          tip: 0,
          notes: order.notes || ''
        };

        return transformed;
      });

      return transformedOrders;
    } catch (error) {
      return [];
    }
  }

  // Set up real-time subscription for online orders (call explicitly when needed)
  public initializeRealtimeSubscription() {
    if (this.isRealtimeInitialized) {
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
            // Refresh kitchen orders when online orders change
            this.syncWithPOS();
          }
        )
        .subscribe();
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
        isUrgent: waitingTime > 20 || order.orderType === 'WAITING'
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
    // Update kitchen orders when new items are sent
    this.syncWithPOS();
  };

  // Handle POS sync - get the latest orders from POS tables
  public syncWithPOS(posTableData?: TableData[]) {

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

        // Create kitchen order from table data
        const ORDER_SOURCE_POS: 'POS' = 'POS';
        const kitchenOrder: KitchenOrder = {
          ...currentOrder,
          tableNumber: table.tableNumber,
          orderType: table.status === 'WAITING' ? 'WAITING' : 'DINE-IN',
          orderSource: ORDER_SOURCE_POS,
          customerName: table.customerName,
          waitingTime,
          timeDisplay: this.formatWaitingTime(waitingTime),
          isUrgent: waitingTime > 20 || table.status === 'WAITING',
          status,
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
              items: processedItems
            };
          }

          return mockOrder;
        });

        // Add mock orders
        activeOrders.push(...processedMockOrders);
      }

      // Fetch and merge online orders from Supabase
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

      }).catch(error => {
        console.error('Error fetching online orders, using POS only:', error);
        // Fallback to POS-only if online fetch fails
        this.kitchenOrders = activeOrders;
        this.updateWaitingTimes();
        this.notifySubscribers();
        document.dispatchEvent(new CustomEvent('kitchen-data-updated'));
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
      const ORDER_SOURCE_POS: 'POS' = 'POS';
      const kitchenOrder: KitchenOrder = {
        ...activeOrder,
        tableNumber: table.tableNumber,
        orderType: table.status === 'WAITING' ? 'WAITING' : 'DINE-IN',
        orderSource: ORDER_SOURCE_POS,
        customerName: table.customerName,
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
  public updateOrderStatusWithSync(orderId: string, newStatus: KitchenOrderStatus): boolean {
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
                itemStatus: 'READY' as const
              };
            }
            return item;
          });
        } else if (newStatus === 'DELAYED') {
          // When marking as delayed, only update status - don't change item status
          // In a real system, this would trigger notifications to staff
        } else if (newStatus === 'COMPLETED') {
          updatedItems = updatedItems.map(item => {
            if (item.itemStatus !== 'SERVED') {
              return {
                ...item,
                itemStatus: 'SERVED' as const
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
            isNewItem: false
          }));
        }

        return {
          ...order,
          status: newStatus,
          items: updatedItems,
          lastUpdatedAt: new Date(),
          completedAt: newStatus === 'COMPLETED' ? new Date() : order.completedAt
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

    // If this is an online order, sync status back to Supabase
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

  // Get mock orders from localStorage
  private getMockOrdersFromStorage(): KitchenOrder[] {
    try {
      const mockOrdersData = localStorage.getItem('mockKitchenOrders');
      return mockOrdersData ? JSON.parse(mockOrdersData) : [];
    } catch (error) {
      console.error('Error getting mock orders from storage:', error);
      return [];
    }
  }

  // Sync order status with POS system
  private syncStatusWithPOS(orderId: string, newStatus: KitchenOrderStatus) {

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
          itemStatus: 'SERVED' as const
        }));
      }

      // Replace the order in the table's orders array
      const updatedOrders = [...table.orders];
      updatedOrders[orderIndex] = updatedOrder;

      return {
        ...table,
        orders: updatedOrders
      };
    });

    if (updated) {
      // Save the updated tables back to localStorage
      localStorage.setItem('tables', JSON.stringify(updatedTablesData));
    }
  }

  // Generate mock orders for development
  private generateMockOrders(): KitchenOrder[] {
    const now = new Date();
    const ORDER_SOURCE_POS: 'POS' = 'POS';
    return [
      {
        orderId: 'ord_123456',
        tableNumber: 5,
        orderType: 'DINE-IN',
        orderSource: ORDER_SOURCE_POS,
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
        orderSource: ORDER_SOURCE_POS,
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
        orderSource: ORDER_SOURCE_POS,
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
