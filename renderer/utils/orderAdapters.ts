// Adapter functions to transform POS and Online orders to UnifiedKitchenOrder
import { UnifiedKitchenOrder, KitchenOrderItem, KitchenOrderStatus } from "./kitchenTypes";
import { TableOrder, TableOrderItem } from "./tableTypes";

// Map POS item to kitchen item
function transformPOSItem(item: TableOrderItem): KitchenOrderItem {
  const modifiers: string[] = [];
  if (item.modifiers && item.modifiers.length) {
    item.modifiers.forEach((group) => {
      group.options.forEach((opt) => modifiers.push(`${group.groupName}: ${opt.name}`));
    });
  }
  return {
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    notes: item.notes || item.kitchenNotes,
    modifiers: modifiers.length ? modifiers : undefined,
  };
}

// Map POS status (item/order based) to kitchen status (coarse)
function mapPOSStatus(_status?: string): KitchenOrderStatus {
  // POS order in active queue is considered PREPARING until all items ready, then READY, then COMPLETED
  return "PREPARING";
}

export function transformPOSOrder(tableOrder: TableOrder, tableNumber: number): UnifiedKitchenOrder {
  const id = tableOrder.orderId;
  const createdAt = tableOrder.createdAt instanceof Date ? tableOrder.createdAt : new Date(tableOrder.createdAt);
  const orderNumber = `#${id.slice(-6).toUpperCase()}`;

  const items = tableOrder.items.map(transformPOSItem);

  return {
    id,
    orderSource: "POS",
    orderType: "DINE-IN",
    orderNumber,
    tableNumber,
    items,
    createdAt,
    estimatedPrepTime: 20,
    waitingTime: 0,
    status: mapPOSStatus(),
    isPriority: false,
    statusColor: "",
    timeDisplay: "",
  };
}

// Supabase -> UnifiedKitchenOrder
export function transformOnlineOrder(supabaseOrder: any): UnifiedKitchenOrder {
  const itemsRaw = typeof supabaseOrder.items === "string" ? safeJsonParse(supabaseOrder.items) : (supabaseOrder.items || []);

  const items: KitchenOrderItem[] = (itemsRaw as any[]).map((it) => ({
    id: it.id || it.item_id || cryptoRandomId(),
    name: it.name,
    quantity: it.quantity ?? 1,
    notes: it.notes,
    modifiers: Array.isArray(it.modifiers)
      ? it.modifiers.map((m: any) => (typeof m === "string" ? m : m?.name)).filter(Boolean)
      : undefined,
  }));

  return {
    id: supabaseOrder.id,
    orderSource: "ONLINE",
    orderType: normalizeOrderType(supabaseOrder.order_type),
    orderNumber: supabaseOrder.order_number || `#${String(supabaseOrder.id).slice(-6)}`,
    customerName: supabaseOrder.customer_name,
    phoneNumber: supabaseOrder.phone_number,
    items,
    specialInstructions: supabaseOrder.special_instructions,
    createdAt: new Date(supabaseOrder.created_at),
    scheduledFor: supabaseOrder.scheduled_for ? new Date(supabaseOrder.scheduled_for) : undefined,
    estimatedPrepTime: supabaseOrder.estimated_prep_time || 20,
    waitingTime: 0,
    status: mapSupabaseStatus(supabaseOrder.status),
    isPriority: false,
    statusColor: "",
    timeDisplay: "",
  };
}

export function mapSupabaseStatus(status: string): KitchenOrderStatus {
  const s = String(status || "").toLowerCase();
  if (s === "confirmed" || s === "pending") return "PENDING";
  if (s === "preparing") return "PREPARING";
  if (s === "ready") return "READY";
  if (s === "completed" || s === "delivered") return "COMPLETED";
  if (s === "delayed") return "DELAYED";
  return "PENDING";
}

export function mapKitchenToSupabaseStatus(status: KitchenOrderStatus): string {
  switch (status) {
    case "PENDING":
    case "PREPARING":
      return "preparing"; // Treat both as preparing on backend
    case "READY":
      return "ready";
    case "COMPLETED":
      return "completed";
    case "DELAYED":
      return "delayed";
    default:
      return "preparing";
  }
}

function normalizeOrderType(v: any): "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING" {
  const s = String(v || "").toUpperCase();
  if (s === "DINE-IN" || s === "DINEIN" || s === "DINE_IN") return "DINE-IN";
  if (s === "DELIVERY") return "DELIVERY";
  if (s === "WAITING") return "WAITING";
  return "COLLECTION";
}

function safeJsonParse(v: string) {
  try {
    return JSON.parse(v);
  } catch {
    return [];
  }
}

function cryptoRandomId() {
  try {
    return crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
  } catch {
    return Math.random().toString(16).slice(2);
  }
}
