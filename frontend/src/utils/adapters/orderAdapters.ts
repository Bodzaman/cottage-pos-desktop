// ui/src/utils/adapters/orderAdapters.ts
import {
  UnifiedKitchenOrder,
  KitchenOrderItem,
  KitchenOrderStatus,
} from "utils/types/kitchenTypes";
import { TableOrder, OrderItem } from "utils/stores/tableOrdersStore";

// Helper to safely parse JSON
function safeParse(jsonString: string | null | undefined): any[] {
    if (!jsonString) return [];
    try {
        const parsed = JSON.parse(jsonString);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Failed to parse JSON string:", jsonString, error);
        return [];
    }
}


function transformPOSItem(item: OrderItem): KitchenOrderItem {
    return {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        notes: item.notes,
        modifiers: [], // POS items don't have modifiers in the same way
    };
}

// Transform POS table order to unified format
export function transformPOSOrder(
  tableOrder: TableOrder,
  tableNumber: number
): UnifiedKitchenOrder {
  return {
    id: tableOrder.orderId,
    orderSource: "POS",
    orderType: tableOrder.orderType,
    orderNumber: tableOrder.orderNumber || `#${tableOrder.orderId.slice(0, 6)}`,
    tableNumber,
    items: tableOrder.items.map(transformPOSItem),
    createdAt: new Date(tableOrder.createdAt),
    estimatedPrepTime: 20, // Default for now
    waitingTime: 0, // Calculated in store
    status: "PREPARING", // POS orders are implicitly preparing
    isPriority: false, // Calculated in store
    statusColor: "", // Calculated in store
    timeDisplay: "", // Calculated in store
  };
}

function transformOnlineItem(item: any): KitchenOrderItem {
    return {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        modifiers: item.modifiers || [],
        notes: item.notes,
    }
}

// Transform Supabase online order to unified format
export function transformOnlineOrder(
  supabaseOrder: any // Raw Supabase response
): UnifiedKitchenOrder {
  // Items can be a JSON string or an array of objects
  const items = Array.isArray(supabaseOrder.items) 
    ? supabaseOrder.items
    : safeParse(supabaseOrder.items);

  return {
    id: supabaseOrder.id,
    orderSource: "ONLINE", // Primitive string literal
    orderType: supabaseOrder.order_type,
    orderNumber: supabaseOrder.order_number,
    customerName: supabaseOrder.customer_name,
    phoneNumber: supabaseOrder.phone_number,
    items: items.map(transformOnlineItem),
    specialInstructions: supabaseOrder.special_instructions,
    createdAt: new Date(supabaseOrder.created_at),
    scheduledFor: supabaseOrder.scheduled_for
      ? new Date(supabaseOrder.scheduled_for)
      : undefined,
    estimatedPrepTime: supabaseOrder.estimated_prep_time || 20,
    waitingTime: 0, // Calculated in store
    status: mapSupabaseStatus(supabaseOrder.status),
    isPriority: false, // Calculated in store
    statusColor: "", // Calculated in store
    timeDisplay: "", // Calculated in store
  };
}

// Helper: Map Supabase status to kitchen status
export function mapSupabaseStatus(status: string): KitchenOrderStatus {
  const statusMap: Record<string, KitchenOrderStatus> = {
    confirmed: "PENDING",
    preparing: "PREPARING",
    ready: "READY",
    completed: "COMPLETED",
    delayed: "DELAYED"
  };
  return statusMap[status?.toLowerCase()] || "PENDING";
}

// Helper for mapping kitchen status back to Supabase status
export function mapKitchenStatusToSupabase(status: KitchenOrderStatus): string {
    const statusMap: Record<KitchenOrderStatus, string> = {
        PENDING: "confirmed",
        PREPARING: "preparing",
        READY: "ready",
        COMPLETED: "completed",
        DELAYED: "delayed",
    };
    return statusMap[status] || 'preparing';
}
