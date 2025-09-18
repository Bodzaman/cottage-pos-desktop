import { create } from 'zustand';
import { cottageAPI, type Order, type OrderItem, type MenuItem } from '../utils/api-client';

interface OrderStore {
  // Current order being built
  currentOrder: {
    items: OrderItem[];
    tableNumber?: number;
    type: 'DINE_IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
    customerName?: string;
    customerPhone?: string;
    notes?: string;
  };

  // All orders for management
  orders: Order[];
  selectedOrderId: string | null;
  isLoading: boolean;
  error: string | null;

  // Order building actions
  addItemToCurrentOrder: (menuItem: MenuItem, quantity?: number, modifications?: string[]) => void;
  removeItemFromCurrentOrder: (menuItemId: string) => void;
  updateItemQuantity: (menuItemId: string, quantity: number) => void;
  setOrderType: (type: Order['type']) => void;
  setTableNumber: (tableNumber: number) => void;
  setCustomerInfo: (name: string, phone?: string) => void;
  clearCurrentOrder: () => void;

  // Order management actions
  submitCurrentOrder: () => Promise<string | null>;
  loadOrders: (status?: Order['status']) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  selectOrder: (orderId: string | null) => void;
  getOrderById: (orderId: string) => Order | null;

  // Computed getters
  getCurrentOrderTotal: () => number;
  getCurrentOrderItemCount: () => number;
  getOrdersByStatus: (status: Order['status']) => Order[];
  getPendingOrders: () => Order[];
  getOrdersForTable: (tableNumber: number) => Order[];
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  // Initial state
  currentOrder: {
    items: [],
    type: 'DINE_IN'
  },
  orders: [],
  selectedOrderId: null,
  isLoading: false,
  error: null,

  // Add item to current order
  addItemToCurrentOrder: (menuItem: MenuItem, quantity = 1, modifications = []) => {
    set(state => {
      const existingItemIndex = state.currentOrder.items.findIndex(
        item => item.menuItemId === menuItem.id && 
        JSON.stringify(item.modifications) === JSON.stringify(modifications)
      );

      if (existingItemIndex >= 0) {
        // Item exists, update quantity
        const updatedItems = [...state.currentOrder.items];
        updatedItems[existingItemIndex].quantity += quantity;

        return {
          currentOrder: {
            ...state.currentOrder,
            items: updatedItems
          },
          error: null
        };
      } else {
        // New item, add to order
        const newItem: OrderItem = {
          menuItemId: menuItem.id,
          quantity,
          price: menuItem.price,
          modifications
        };

        return {
          currentOrder: {
            ...state.currentOrder,
            items: [...state.currentOrder.items, newItem]
          },
          error: null
        };
      }
    });
  },

  // Remove item from current order
  removeItemFromCurrentOrder: (menuItemId: string) => {
    set(state => ({
      currentOrder: {
        ...state.currentOrder,
        items: state.currentOrder.items.filter(item => item.menuItemId !== menuItemId)
      },
      error: null
    }));
  },

  // Update item quantity
  updateItemQuantity: (menuItemId: string, quantity: number) => {
    set(state => {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        return {
          currentOrder: {
            ...state.currentOrder,
            items: state.currentOrder.items.filter(item => item.menuItemId !== menuItemId)
          }
        };
      }

      return {
        currentOrder: {
          ...state.currentOrder,
          items: state.currentOrder.items.map(item =>
            item.menuItemId === menuItemId 
              ? { ...item, quantity }
              : item
          )
        },
        error: null
      };
    });
  },

  // Set order type
  setOrderType: (type: Order['type']) => {
    set(state => ({
      currentOrder: {
        ...state.currentOrder,
        type
      }
    }));
  },

  // Set table number
  setTableNumber: (tableNumber: number) => {
    set(state => ({
      currentOrder: {
        ...state.currentOrder,
        tableNumber
      }
    }));
  },

  // Set customer information
  setCustomerInfo: (name: string, phone?: string) => {
    set(state => ({
      currentOrder: {
        ...state.currentOrder,
        customerName: name,
        customerPhone: phone
      }
    }));
  },

  // Clear current order
  clearCurrentOrder: () => {
    set({
      currentOrder: {
        items: [],
        type: 'DINE_IN'
      },
      error: null
    });
  },

  // Submit current order
  submitCurrentOrder: async () => {
    const { currentOrder } = get();

    if (currentOrder.items.length === 0) {
      set({ error: 'Cannot submit empty order' });
      return null;
    }

    set({ isLoading: true, error: null });

    try {
      const total = get().getCurrentOrderTotal();

      const orderToSubmit: Omit<Order, 'id' | 'createdAt'> = {
        items: currentOrder.items,
        type: currentOrder.type,
        total,
        status: 'pending',
        tableNumber: currentOrder.tableNumber,
        customerName: currentOrder.customerName,
        customerPhone: currentOrder.customerPhone
      };

      const response = await cottageAPI.createOrder(orderToSubmit);

      if (response.error) {
        set({ error: response.error, isLoading: false });
        return null;
      }

      const newOrder = response.data;
      if (newOrder) {
        set(state => ({
          orders: [newOrder, ...state.orders],
          isLoading: false,
          error: null
        }));

        // Clear current order after successful submission
        get().clearCurrentOrder();

        return newOrder.id;
      }

      set({ isLoading: false });
      return null;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to submit order',
        isLoading: false
      });
      return null;
    }
  },

  // Load orders
  loadOrders: async (status?: Order['status']) => {
    set({ isLoading: true, error: null });

    try {
      const response = await cottageAPI.getOrders(status);

      if (response.error) {
        set({ error: response.error, isLoading: false });
        return;
      }

      const orders = response.data || [];

      set({
        orders,
        isLoading: false,
        error: null
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load orders',
        isLoading: false
      });
    }
  },

  // Update order status
  updateOrderStatus: async (orderId: string, status: Order['status']) => {
    try {
      const response = await cottageAPI.updateOrderStatus(orderId, status);

      if (response.error) {
        set({ error: response.error });
        return;
      }

      set(state => ({
        orders: state.orders.map(order =>
          order.id === orderId ? { ...order, status } : order
        ),
        error: null
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update order status'
      });
    }
  },

  // Select order for viewing/editing
  selectOrder: (orderId: string | null) => {
    set({ selectedOrderId: orderId });
  },

  // Get order by ID
  getOrderById: (orderId: string) => {
    return get().orders.find(order => order.id === orderId) || null;
  },

  // Computed: Get current order total
  getCurrentOrderTotal: () => {
    const { currentOrder } = get();
    return currentOrder.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  },

  // Computed: Get current order item count
  getCurrentOrderItemCount: () => {
    const { currentOrder } = get();
    return currentOrder.items.reduce((count, item) => count + item.quantity, 0);
  },

  // Computed: Get orders by status
  getOrdersByStatus: (status: Order['status']) => {
    return get().orders.filter(order => order.status === status);
  },

  // Computed: Get pending orders
  getPendingOrders: () => {
    return get().orders.filter(order => order.status === 'pending');
  },

  // Computed: Get orders for specific table
  getOrdersForTable: (tableNumber: number) => {
    return get().orders.filter(order => order.tableNumber === tableNumber);
  }
}));

export default useOrderStore;
