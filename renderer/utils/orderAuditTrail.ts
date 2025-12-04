/**
 * Order Audit Trail
 * 
 * Utilities for tracking and managing changes to orders,
 * maintaining an audit history of modifications.
 */

import { OrderData } from "../components/OrderDetailDialog";

export interface AuditEntry {
  timestamp: string;
  userId: string;
  userName: string;
  action: "created" | "edited" | "status_changed" | "cancelled" | "refunded" | "completed";
  orderId: string;
  orderSource: "ai-voice" | "online" | "pos";
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  notes?: string;
}

export interface OrderAuditTrail {
  orderId: string;
  entries: AuditEntry[];
}

// The internal store for audit trails
const auditTrailStore = new Map<string, OrderAuditTrail>();

/**
 * Save an audit trail entry for an order
 */
export const saveAuditEntry = (entry: AuditEntry): void => {
  const { orderId } = entry;
  
  // Get or create audit trail for this order
  let trail = auditTrailStore.get(orderId);
  if (!trail) {
    trail = { orderId, entries: [] };
    auditTrailStore.set(orderId, trail);
  }
  
  // Add the new entry
  trail.entries.push(entry);
  
  // Persist to localStorage for demo purposes
  // In production, this would be an API call
  try {
    const allTrails = getAllAuditTrails();
    const trailIndex = allTrails.findIndex(t => t.orderId === orderId);
    
    if (trailIndex >= 0) {
      allTrails[trailIndex] = trail;
    } else {
      allTrails.push(trail);
    }
    
    localStorage.setItem('orderAuditTrails', JSON.stringify(allTrails));
  } catch (error) {
    console.error('Error saving audit trail to localStorage:', error);
  }
};

/**
 * Create an audit entry for order creation
 */
export const createOrderAudit = (
  orderId: string, 
  userId: string, 
  userName: string,
  orderSource: "ai-voice" | "online" | "pos"
): void => {
  saveAuditEntry({
    timestamp: new Date().toISOString(),
    userId,
    userName,
    action: "created",
    orderId,
    orderSource,
    notes: `Order ${orderId} created via ${orderSource}`
  });
};

/**
 * Create an audit entry for order edit
 */
export const createEditAudit = (
  orderId: string,
  userId: string,
  userName: string,
  orderSource: "ai-voice" | "online" | "pos",
  oldOrder: OrderData,
  newOrder: OrderData
): void => {
  // Compare orders and track changes
  const changes: AuditEntry["changes"] = [];
  
  // Check status change
  if (oldOrder.status !== newOrder.status) {
    changes.push({
      field: "status",
      oldValue: oldOrder.status,
      newValue: newOrder.status
    });
  }
  
  // Check item changes
  if (JSON.stringify(oldOrder.items) !== JSON.stringify(newOrder.items)) {
    changes.push({
      field: "items",
      oldValue: oldOrder.items,
      newValue: newOrder.items
    });
  }
  
  // Check customer info changes
  if (JSON.stringify(oldOrder.customer) !== JSON.stringify(newOrder.customer)) {
    changes.push({
      field: "customer",
      oldValue: oldOrder.customer,
      newValue: newOrder.customer
    });
  }
  
  // Check address changes
  if (JSON.stringify(oldOrder.address) !== JSON.stringify(newOrder.address)) {
    changes.push({
      field: "address",
      oldValue: oldOrder.address,
      newValue: newOrder.address
    });
  }
  
  // Check payment changes
  if (JSON.stringify(oldOrder.payment) !== JSON.stringify(newOrder.payment)) {
    changes.push({
      field: "payment",
      oldValue: oldOrder.payment,
      newValue: newOrder.payment
    });
  }
  
  // Save the audit entry if there are changes
  if (changes.length > 0) {
    saveAuditEntry({
      timestamp: new Date().toISOString(),
      userId,
      userName,
      action: "edited",
      orderId,
      orderSource,
      changes,
      notes: `Order ${orderId} modified with ${changes.length} changes`
    });
  }
};

/**
 * Create an audit entry for status change
 */
export const createStatusChangeAudit = (
  orderId: string,
  userId: string,
  userName: string,
  orderSource: "ai-voice" | "online" | "pos",
  oldStatus: string,
  newStatus: string
): void => {
  saveAuditEntry({
    timestamp: new Date().toISOString(),
    userId,
    userName,
    action: "status_changed",
    orderId,
    orderSource,
    changes: [
      {
        field: "status",
        oldValue: oldStatus,
        newValue: newStatus
      }
    ],
    notes: `Order status changed from ${oldStatus} to ${newStatus}`
  });
};

/**
 * Create an audit entry for cancellation
 */
export const createCancelAudit = (
  orderId: string,
  userId: string,
  userName: string,
  orderSource: "ai-voice" | "online" | "pos",
  reason?: string
): void => {
  saveAuditEntry({
    timestamp: new Date().toISOString(),
    userId,
    userName,
    action: "cancelled",
    orderId,
    orderSource,
    notes: reason ? `Order cancelled: ${reason}` : "Order cancelled"
  });
};

/**
 * Create an audit entry for refund
 */
export const createRefundAudit = (
  orderId: string,
  userId: string,
  userName: string,
  orderSource: "ai-voice" | "online" | "pos",
  amount: number,
  reason?: string
): void => {
  saveAuditEntry({
    timestamp: new Date().toISOString(),
    userId,
    userName,
    action: "refunded",
    orderId,
    orderSource,
    changes: [
      {
        field: "payment.refunded",
        oldValue: false,
        newValue: true
      },
      {
        field: "payment.refundAmount",
        oldValue: 0,
        newValue: amount
      }
    ],
    notes: reason ? `Refund processed: ${reason}` : `Refund processed for £${amount.toFixed(2)}`
  });
};

/**
 * Create an audit entry for order completion
 */
export const createCompletionAudit = (
  orderId: string,
  userId: string,
  userName: string,
  orderSource: "ai-voice" | "online" | "pos"
): void => {
  saveAuditEntry({
    timestamp: new Date().toISOString(),
    userId,
    userName,
    action: "completed",
    orderId,
    orderSource,
    notes: `Order marked as completed`
  });
};

/**
 * Get the audit trail for a specific order
 */
export const getOrderAuditTrail = (orderId: string): OrderAuditTrail | null => {
  // First check in-memory store
  const trail = auditTrailStore.get(orderId);
  if (trail) return trail;
  
  // Then check localStorage
  try {
    const allTrails = getAllAuditTrails();
    const orderTrail = allTrails.find(t => t.orderId === orderId);
    if (orderTrail) {
      // Store in memory for next time
      auditTrailStore.set(orderId, orderTrail);
      return orderTrail;
    }
  } catch (error) {
    console.error('Error reading audit trail from localStorage:', error);
  }
  
  return null;
};

/**
 * Get all audit trails
 */
export const getAllAuditTrails = (): OrderAuditTrail[] => {
  try {
    const storedTrails = localStorage.getItem('orderAuditTrails');
    if (storedTrails) {
      return JSON.parse(storedTrails);
    }
  } catch (error) {
    console.error('Error parsing audit trails from localStorage:', error);
  }
  
  return [];
};

/**
 * Clear all audit trails (for testing purposes)
 */
export const clearAllAuditTrails = (): void => {
  auditTrailStore.clear();
  localStorage.removeItem('orderAuditTrails');
};
