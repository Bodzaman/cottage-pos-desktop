import { supabase } from './supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';

/**
 * Real-time subscription manager for cart updates
 * Listens to Supabase session_cart table changes and auto-updates cartStore
 */

let cartChannel: RealtimeChannel | null = null;

/**
 * Initialize real-time subscription for cart updates
 * @param sessionId - Current session ID to filter cart items
 * @param set - Zustand set function to update cart state
 * @param get - Zustand get function to read current cart state
 */
export function initCartRealtimeSubscription(
  sessionId: string,
  set: any,
  get: any
) {
  // Clean up existing subscription first
  if (cartChannel) {
    console.log('🔄 Cleaning up existing cart subscription before creating new one');
    supabase.removeChannel(cartChannel);
    cartChannel = null;
  }

  console.log('📡 Initializing real-time cart subscription for session:', sessionId);

  // Create new subscription channel
  cartChannel = supabase
    .channel(`cart-${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'session_cart',
        filter: `session_id=eq.${sessionId}`
      },
      async (payload) => {
        console.log('📡 Cart real-time event received:', payload.eventType, payload);
        
        // Refresh cart from Supabase to get latest state
        // This ensures we have the complete, authoritative cart data
        try {
          await get().fetchCartFromSupabase();
          
          // Show toast notification based on event type
          if (payload.eventType === 'INSERT') {
            const itemName = (payload.new as any)?.name || 'Item';
            toast.success(`${itemName} added to cart`, { duration: 2000 });
          } else if (payload.eventType === 'DELETE') {
            const itemName = (payload.old as any)?.name || 'Item';
            toast.info(`${itemName} removed from cart`, { duration: 2000 });
          } else if (payload.eventType === 'UPDATE') {
            const itemName = (payload.new as any)?.name || 'Item';
            toast.info(`Cart updated`, { duration: 2000 });
          }
        } catch (error) {
          console.error('❌ Failed to refresh cart after real-time event:', error);
        }
      }
    )
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Cart real-time subscription active');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Cart real-time subscription error:', err);
        console.error('❌ Error details:', { status, error: err, sessionId });
        toast.error('Cart sync unavailable', { duration: 3000 });
      } else if (status === 'TIMED_OUT') {
        console.warn('⚠️ Cart real-time subscription timed out');
        console.warn('⚠️ Timeout details:', { sessionId });
      } else if (status === 'CLOSED') {
        console.log('🔌 Cart real-time subscription closed');
      }
    });
}

/**
 * Clean up cart real-time subscription
 * Call this when component unmounts or user logs out
 */
export function cleanupCartSubscription() {
  if (cartChannel) {
    console.log('🧹 Cleaning up cart real-time subscription');
    supabase.removeChannel(cartChannel);
    cartChannel = null;
  }
}

/**
 * Check if cart subscription is active
 */
export function isCartSubscriptionActive(): boolean {
  return cartChannel !== null;
}
