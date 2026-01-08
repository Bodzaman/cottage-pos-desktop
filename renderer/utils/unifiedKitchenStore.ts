import { create } from "zustand";
import { supabase } from "./supabaseClient";
import { UnifiedKitchenOrder, KitchenOrderStatus, defaultPriorityConfig } from "./kitchenTypes";
import { transformPOSOrder, transformOnlineOrder, mapKitchenToSupabaseStatus } from "./orderAdapters";
import { TableData } from "./tableTypes";

interface UnifiedKitchenState {
  orders: UnifiedKitchenOrder[];
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;

  // Filters
  activeStatuses: KitchenOrderStatus[];
  sourceFilter: "ALL" | "POS" | "ONLINE";

  // Actions
  loadOrders: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: KitchenOrderStatus) => Promise<void>;

  // Realtime
  initializeRealtimeSubscription: () => void;
  cleanupSubscription: () => void;
}

let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

export const useUnifiedKitchenStore = create<UnifiedKitchenState>((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,
  lastSync: null,

  activeStatuses: ["PENDING", "PREPARING", "READY"],
  sourceFilter: "ALL",

  loadOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const [pos, online] = await Promise.all([
        fetchPOSOrders(),
        fetchOnlineOrders()
      ]);

      const all = [...pos, ...online].map(enrichOrder);

      set({ orders: all, isLoading: false, lastSync: new Date() });
    } catch (e: any) {
      console.error("[UnifiedKitchen] loadOrders error", e);
      set({ error: e?.message || "Failed to load orders", isLoading: false });
    }
  },

  refreshOrders: async () => {
    await get().loadOrders();
  },

  updateOrderStatus: async (orderId, status) => {
    const current = get().orders.find((o) => o.id === orderId);
    if (!current) return;

    // Optimistic update
    set({ orders: get().orders.map((o) => (o.id === orderId ? { ...o, status } : o)) });

    try {
      if (current.orderSource === "ONLINE") {
        const supabaseStatus = mapKitchenToSupabaseStatus(status);
        const { error } = await supabase
          .from("orders")
          .update({ status: supabaseStatus, updated_at: new Date().toISOString() })
          .eq("id", orderId)
          .eq("order_source", "CUSTOMER_ONLINE_ORDER");
        if (error) throw error;
      } else {
        // POS: update localStorage tables to reflect new status for the order's items
        updatePOSLocalStatus(orderId, status);
      }
    } catch (e) {
      console.error("[UnifiedKitchen] updateOrderStatus failed", e);
      // Revert on error
      set({ orders: get().orders });
    }
  },

  initializeRealtimeSubscription: () => {
    if (realtimeChannel) return;
    realtimeChannel = supabase
      .channel("unified-kitchen")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: "order_source=eq.CUSTOMER_ONLINE_ORDER" },
        () => {
          // On any change, refresh orders
          get().refreshOrders();
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") console.log("✅ KDS V2 realtime subscribed");
        if (status === "CHANNEL_ERROR") console.error("❌ KDS V2 realtime error", err);
      });
  },

  cleanupSubscription: () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  },
}));

async function fetchPOSOrders(): Promise<UnifiedKitchenOrder[]> {
  const tables = getTablesFromStorage();
  const orders: UnifiedKitchenOrder[] = [];

  tables.forEach((table) => {
    if (!table.activeOrderId) return;
    const active = table.orders.find((o) => o.orderId === table.activeOrderId);
    if (!active) return;

    // Only consider orders that have items sent to kitchen or any items
    if (!active.items || active.items.length === 0) return;

    orders.push(transformPOSOrder(active, table.tableNumber));
  });

  return orders;
}

async function fetchOnlineOrders(): Promise<UnifiedKitchenOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("order_source", "CUSTOMER_ONLINE_ORDER")
    .in("status", ["confirmed", "preparing", "ready"]) // active states
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as any[]).map(transformOnlineOrder);
}

function enrichOrder(order: UnifiedKitchenOrder): UnifiedKitchenOrder {
  const now = Date.now();
  const created = order.createdAt instanceof Date ? order.createdAt.getTime() : new Date(order.createdAt).getTime();
  const waitingTime = Math.max(0, Math.floor((now - created) / 60000));

  const isPriority = calculatePriority(order, waitingTime);
  const statusColor = getStatusColor(order, waitingTime, isPriority);
  const timeDisplay = waitingTime < 60 ? `${waitingTime}m` : `${Math.floor(waitingTime / 60)}h ${waitingTime % 60}m`;

  return { ...order, waitingTime, isPriority, statusColor, timeDisplay };
}

function calculatePriority(order: UnifiedKitchenOrder, waitingTime: number): boolean {
  if (order.orderType === "WAITING") return true;
  if (waitingTime > defaultPriorityConfig.urgentThreshold) return true;
  if (order.orderType === "COLLECTION" && order.scheduledFor) {
    const minutesUntilPickup = Math.floor((order.scheduledFor.getTime() - Date.now()) / 60000);
    if (minutesUntilPickup < defaultPriorityConfig.collectionWarning) return true;
  }
  if (order.orderType === "DELIVERY" && order.scheduledFor) {
    const minutesUntilDelivery = Math.floor((order.scheduledFor.getTime() - Date.now()) / 60000);
    if (minutesUntilDelivery < defaultPriorityConfig.deliveryWarning) return true;
  }
  return false;
}

function getStatusColor(order: UnifiedKitchenOrder, waitingTime: number, isPriority: boolean): string {
  if (order.status === "DELAYED") return "#EF4444"; // red
  if (order.status === "READY") return "#10B981"; // green
  if (isPriority) return "#F59E0B"; // orange
  if (waitingTime >= 5) return "#EAB308"; // yellow-ish
  return "#6B7280"; // gray
}

function getTablesFromStorage(): TableData[] {
  try {
    const raw = localStorage.getItem("tables");
    return raw ? (JSON.parse(raw) as TableData[]) : [];
  } catch (e) {
    console.warn("[UnifiedKitchen] failed to parse tables from storage", e);
    return [] as TableData[];
  }
}

function updatePOSLocalStatus(orderId: string, status: KitchenOrderStatus) {
  try {
    const tables = getTablesFromStorage();
    let changed = false;
    tables.forEach((t) => {
      const idx = t.orders.findIndex((o) => o.orderId === orderId);
      if (idx >= 0) {
        changed = true;
        const o = t.orders[idx];
        if (status === "READY") {
          o.items = o.items.map((it) => (it.itemStatus === "PREPARING" || it.itemStatus === "NEW" ? { ...it, itemStatus: "READY" } : it));
        }
        if (status === "COMPLETED") {
          o.items = o.items.map((it) => ({ ...it, itemStatus: "SERVED" }));
        }
      }
    });
    if (changed) localStorage.setItem("tables", JSON.stringify(tables));
  } catch (e) {
    console.warn("[UnifiedKitchen] failed updating POS local status", e);
  }
}
