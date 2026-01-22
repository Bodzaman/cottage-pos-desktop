// ui/src/utils/stores/unifiedKitchenStore.ts
import { create } from "zustand";
import { supabase } from "utils/supabase";
import { useTableOrdersStore, TableOrder } from "utils/stores/tableOrdersStore";
import {
  transformPOSOrder,
  transformOnlineOrder,
  mapKitchenStatusToSupabase,
} from "utils/adapters/orderAdapters";
import {
  UnifiedKitchenOrder,
  KitchenOrderStatus,
} from "utils/types/kitchenTypes";

interface UnifiedKitchenState {
  // Data
  orders: UnifiedKitchenOrder[];
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
  subscriptionChannel: any | null;

  // Actions
  loadOrders: () => Promise<void>;
  updateOrderStatus: (
    orderId: string,
    status: KitchenOrderStatus
  ) => Promise<void>;
  markAsDelayed: (orderId: string) => Promise<void>;
  refreshOrders: () => void;

  // Real-time
  initializeRealtimeSubscription: () => void;
  cleanupSubscription: () => void;
}

/**
 * Fetch POS orders from the table orders store
 */
async function fetchPOSOrders(): Promise<UnifiedKitchenOrder[]> {
  const tableOrdersStore = useTableOrdersStore.getState();
  const tables = tableOrdersStore.tables || [];
  const orders: UnifiedKitchenOrder[] = [];

  tables.forEach((table) => {
    if (table.orders && table.orders.length > 0) {
      table.orders.forEach((order) => {
        const transformed = transformPOSOrder(order, table.number);
        if (transformed) {
          orders.push(transformed);
        }
      });
    }
  });

  return orders;
}

async function fetchOnlineOrders(): Promise<UnifiedKitchenOrder[]> {
  const { data, error } = await supabase
    .from("online_orders")
    .select("*")
    .in("status", ["confirmed", "preparing", "ready", "delayed"])
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching online orders:", error);
    throw error;
  }

  return data.map(transformOnlineOrder);
}


function enrichOrder(order: UnifiedKitchenOrder): UnifiedKitchenOrder {
    const now = new Date();
    const waitingTime = Math.floor(
      (now.getTime() - order.createdAt.getTime()) / 60000
    );
  
    // Priority Calculation
    const isPriority = (() => {
      if (order.orderType === 'WAITING') return true;
      if (waitingTime > 15) return true;
      if (order.orderType === 'COLLECTION' && order.scheduledFor) {
        const minutesUntilPickup = (order.scheduledFor.getTime() - now.getTime()) / 60000;
        if (minutesUntilPickup < 10) return true;
      }
      return false;
    })();
  
    // Status Color
    const statusColor = (() => {
      if (order.status === 'DELAYED') return '#EF4444'; // Red
      if (isPriority) return '#F59E0B'; // Orange
      if (order.status === 'READY') return '#10B981'; // Green
      return '#6B7280'; // Gray
    })();
  
    // Time Display
    const timeDisplay = `${waitingTime} min`;
  
    return {
      ...order,
      waitingTime,
      isPriority,
      statusColor,
      timeDisplay,
    };
  }
  

export const useUnifiedKitchenStore = create<UnifiedKitchenState>((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,
  lastSync: null,
  subscriptionChannel: null,

  loadOrders: async () => {
    set({ isLoading: true, error: null });

    try {
      // Fetch orders from both sources
      const [posOrders, onlineOrders] = await Promise.all([
        fetchPOSOrders(),
        fetchOnlineOrders(),
      ]);

      // Combine and enrich orders
      const allOrders = [...posOrders, ...onlineOrders]
        .map(enrichOrder)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      set({
        orders: allOrders,
        isLoading: false,
        lastSync: new Date(),
      });
    } catch (error: any) {
      console.error("KDS V2: Error loading orders:", error);
      set({ error: error.message, isLoading: false });
    }
  },

  refreshOrders: () => {
      get().loadOrders();
  },

  updateOrderStatus: async (orderId, status) => {
    const order = get().orders.find((o) => o.id === orderId);
    if (!order) return;

    // Optimistic update
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? enrichOrder({ ...o, status }) : o
      ),
    }));

    try {
      if (order.orderSource === "ONLINE") {
        const supabaseStatus = mapKitchenStatusToSupabase(status);
        const { error } = await supabase
          .from("online_orders")
          .update({ status: supabaseStatus })
          .eq("id", orderId);
        if (error) throw error;
      } else {
        // For POS, update the local zustand store
        useTableOrdersStore.getState().updateOrderStatus(order.id, status);
      }
    } catch (error: any) {
      console.error(`KDS V2: Failed to update order ${orderId}:`, error);
      set({ error: error.message });
      // Revert on error by reloading all orders
      get().loadOrders();
    }
  },

  markAsDelayed: async (orderId) => {
      get().updateOrderStatus(orderId, 'DELAYED');
  },

  initializeRealtimeSubscription: () => {
    if (get().subscriptionChannel) {
        return;
    }

    const channel = supabase
      .channel("unified-kitchen-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "online_orders" },
        (payload) => {
          get().refreshOrders();
        }
      )
      .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
          }
          if (status === 'CHANNEL_ERROR') {
              console.error('KDS V2 realtime error', err);
              set({ error: `Realtime connection failed: ${err?.message}`});
          }
      });

    set({ subscriptionChannel: channel });
  },

  cleanupSubscription: () => {
    const channel = get().subscriptionChannel;
    if (channel) {
      supabase.removeChannel(channel);
      set({ subscriptionChannel: null });
    }
  },
}));
