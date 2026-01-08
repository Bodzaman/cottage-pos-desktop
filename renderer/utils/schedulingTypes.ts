
/**
 * Order scheduling type definitions
 */

export interface SchedulingData {
  // Collection orders
  pickup_time?: string;
  pickup_date?: string;
  
  // Delivery orders
  delivery_time?: string;
  delivery_date?: string;
}

export interface OrderSchedulingProps {
  orderType: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING";
  onSchedulingChange: (data: SchedulingData) => void;
  className?: string;
}

/**
 * Format scheduling data for display
 */
export function formatSchedulingDisplay(data: SchedulingData, orderType: string): string | null {
  if (orderType === "COLLECTION" && data.pickup_time) {
    const date = data.pickup_date || new Date().toISOString().split('T')[0];
    const isToday = date === new Date().toISOString().split('T')[0];
    return `Pick up ${isToday ? 'today' : date} at ${data.pickup_time}`;
  }
  
  if (orderType === "DELIVERY" && data.delivery_time) {
    const date = data.delivery_date || new Date().toISOString().split('T')[0];
    const isToday = date === new Date().toISOString().split('T')[0];
    return `Deliver ${isToday ? 'today' : date} at ${data.delivery_time}`;
  }
  
  return null;
}

/**
 * Check if timing represents a future order
 */
export function isFutureOrder(data: SchedulingData, orderType: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  
  if (orderType === "COLLECTION" && data.pickup_date) {
    return data.pickup_date > today;
  }
  
  if (orderType === "DELIVERY" && data.delivery_date) {
    return data.delivery_date > today;
  }
  
  return false;
}
