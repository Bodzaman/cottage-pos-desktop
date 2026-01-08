import { apiClient } from 'app';

/**
 * Cart Analytics Utility
 * Privacy-conscious event tracking for cart behavior analysis
 * 
 * NOTE: This module is designed to FAIL GRACEFULLY.
 * If the cart_events table doesn't exist or there are API errors,
 * the app will continue to work normally with console warnings.
 */

// Health check flag - set to false if analytics is unavailable
let analyticsAvailable = true;
let lastHealthCheckTime = 0;
const HEALTH_CHECK_INTERVAL = 60000; // Check every 60 seconds

// Generate or retrieve session ID (persisted for session)
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('cart_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    sessionStorage.setItem('cart_session_id', sessionId);
  }
  return sessionId;
};

// Get customer ID if logged in (implement based on your auth system)
const getCustomerId = (): string | null => {
  // TODO: Integrate with your auth system
  // For now, return null (anonymous tracking)
  return null;
};

export interface CartEventData {
  item_id?: string;
  item_name?: string;
  price?: number;
  order_mode?: 'delivery' | 'collection';
  source?: 'menu' | 'voice' | 'recommendation';
  reason?: string;
  from_mode?: 'delivery' | 'collection';
  to_mode?: 'delivery' | 'collection';
  cart_value?: number;
  items_count?: number;
  stage?: 'cart' | 'address' | 'payment';
  [key: string]: any; // Allow additional custom properties
}

export type CartEventType =
  | 'cart_item_added'
  | 'cart_item_removed'
  | 'order_mode_switched'
  | 'checkout_initiated'
  | 'checkout_abandoned'
  | 'cart_cleared'
  | 'cart_recovered';

/**
 * Track a cart analytics event
 */
export const trackCartEvent = async (
  eventType: CartEventType,
  eventData: CartEventData = {}
): Promise<boolean> => {
  // Skip if analytics is known to be unavailable (avoid spam)
  if (!analyticsAvailable) {
    const now = Date.now();
    // Re-check health periodically
    if (now - lastHealthCheckTime > HEALTH_CHECK_INTERVAL) {
      lastHealthCheckTime = now;
      console.info('📊 Cart analytics: Table not available, retrying...');
    } else {
      return false; // Silently skip
    }
  }

  try {
    const response = await apiClient.track_cart_event({
      session_id: getSessionId(),
      customer_id: getCustomerId(),
      event_type: eventType,
      event_data: eventData,
    });

    const result = await response.json();
    
    // If we get a successful response, mark analytics as available
    if (result.success) {
      analyticsAvailable = true;
      return true;
    } else {
      // Backend returned success=false (e.g., table doesn't exist)
      console.warn('📊 Cart analytics unavailable:', result.message);
      analyticsAvailable = false;
      lastHealthCheckTime = Date.now();
      return false;
    }
  } catch (error) {
    // Graceful degradation - analytics should NEVER break the app
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if it's a 404 (table doesn't exist)
    if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      if (analyticsAvailable) {
        console.warn('⚠️ Cart analytics table not found. Analytics disabled until table is created.');
        console.info('💡 Run the setup endpoint: POST /setup-cart-analytics-table');
      }
      analyticsAvailable = false;
      lastHealthCheckTime = Date.now();
    } else {
      // Other errors (network, etc.) - log but don't disable permanently
      console.error('📊 Cart analytics error:', errorMessage);
    }
    
    return false;
  }
};

/**
 * Track item added to cart
 */
export const trackItemAdded = async (
  itemId: string,
  itemName: string,
  price: number,
  orderMode: 'delivery' | 'collection',
  source: 'menu' | 'voice' | 'recommendation' = 'menu'
): Promise<void> => {
  await trackCartEvent('cart_item_added', {
    item_id: itemId,
    item_name: itemName,
    price,
    order_mode: orderMode,
    source,
  });
};

/**
 * Track item removed from cart
 */
export const trackItemRemoved = async (
  itemId: string,
  itemName: string,
  reason: 'user_action' | 'price_change' | 'unavailable' = 'user_action'
): Promise<void> => {
  await trackCartEvent('cart_item_removed', {
    item_id: itemId,
    item_name: itemName,
    reason,
  });
};

/**
 * Track order mode switch
 */
export const trackModeSwitch = async (
  fromMode: 'delivery' | 'collection',
  toMode: 'delivery' | 'collection',
  cartValue: number,
  itemsCount: number
): Promise<void> => {
  await trackCartEvent('order_mode_switched', {
    from_mode: fromMode,
    to_mode: toMode,
    cart_value: cartValue,
    items_count: itemsCount,
  });
};

/**
 * Track checkout initiated
 */
export const trackCheckoutInitiated = async (
  cartValue: number,
  itemsCount: number,
  orderMode: 'delivery' | 'collection'
): Promise<void> => {
  await trackCartEvent('checkout_initiated', {
    cart_value: cartValue,
    items_count: itemsCount,
    order_mode: orderMode,
  });
};

/**
 * Track checkout abandoned
 */
export const trackCheckoutAbandoned = async (
  stage: 'cart' | 'address' | 'payment',
  cartValue: number
): Promise<void> => {
  await trackCartEvent('checkout_abandoned', {
    stage,
    cart_value: cartValue,
  });
};

/**
 * Track cart cleared
 */
export const trackCartCleared = async (
  reason: 'user_action' | 'timeout' = 'user_action',
  cartValue: number
): Promise<void> => {
  await trackCartEvent('cart_cleared', {
    reason,
    cart_value: cartValue,
  });
};

/**
 * Track cart recovered from previous session
 */
export const trackCartRecovered = async (
  itemsCount: number,
  cartValue: number
): Promise<void> => {
  await trackCartEvent('cart_recovered', {
    items_count: itemsCount,
    cart_value: cartValue,
  });
};
