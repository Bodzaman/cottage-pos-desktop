/**
 * Menu Realtime Sync - Supabase subscriptions that invalidate React Query cache
 *
 * This module bridges Supabase realtime updates with React Query's cache.
 * When data changes in Postgres, we invalidate the relevant query keys
 * and React Query automatically refetches.
 *
 * Benefits:
 * - No manual state updates - React Query handles refetching
 * - Automatic deduplication of refetch requests
 * - Stale-while-revalidate pattern for smooth UX
 * - Reference counting ensures subscriptions are shared across components
 */

import { useEffect, useRef } from 'react';
import { useQueryClient, QueryClient } from '@tanstack/react-query';
import { supabase } from './supabaseClient';
import { menuKeys, MenuContext } from './menuQueries';
import { toast } from 'sonner';

// Subscription state tracking with reference counting
interface SubscriptionState {
  channels: Map<string, any>;
  isSubscribing: boolean;
  subscriberCount: number;  // Track number of active subscribers
  currentContext: MenuContext | null;  // Track which context subscriptions are for
  queryClientRef: QueryClient | null;  // Store queryClient for invalidations
  showToasts: boolean;
}

const subscriptionState: SubscriptionState = {
  channels: new Map(),
  isSubscribing: false,
  subscriberCount: 0,
  currentContext: null,
  queryClientRef: null,
  showToasts: false
};

/**
 * Setup realtime subscriptions (internal function).
 * Only called when first subscriber mounts.
 */
function setupSubscriptionsInternal(context: MenuContext, publishedOnly: boolean) {
  if (subscriptionState.isSubscribing) {
    return;
  }

  subscriptionState.isSubscribing = true;
  subscriptionState.currentContext = context;

  try {
    // Clean up any existing channels first (safety measure)
    subscriptionState.channels.forEach((channel, name) => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        // Ignore errors during cleanup
      }
    });
    subscriptionState.channels.clear();

    console.log(`🔌 [RealtimeSync] Setting up subscriptions (context: ${context}, subscribers: ${subscriptionState.subscriberCount})...`);

    // Subscribe to menu_categories changes
    const categoriesChannel = supabase
      .channel('rq_menu_categories_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'menu_categories' },
        (payload) => {
          const qc = subscriptionState.queryClientRef;
          const ctx = subscriptionState.currentContext || 'pos';
          if (!qc) return;

          console.log('📡 [RealtimeSync] Categories change detected:', payload.eventType);
          qc.invalidateQueries({ queryKey: menuKeys.posBundle(ctx) });
          qc.invalidateQueries({ queryKey: menuKeys.categories(ctx) });

          if (subscriptionState.showToasts) {
            const name = (payload.new as any)?.name || (payload.old as any)?.name || 'Category';
            toast.info(`${name} ${payload.eventType.toLowerCase()}`);
          }
        }
      )
      .subscribe();

    subscriptionState.channels.set('categories', categoriesChannel);

    // Subscribe to menu_items changes
    const itemsChannel = supabase
      .channel('rq_menu_items_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        (payload) => {
          const qc = subscriptionState.queryClientRef;
          const ctx = subscriptionState.currentContext || 'pos';
          if (!qc) return;

          // For POS/Online contexts, check if item is published
          if (publishedOnly) {
            const newRecord = payload.new as any;
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              if (!newRecord?.published_at) {
                // Still invalidate to remove any unpublished items from cache
                qc.invalidateQueries({ queryKey: menuKeys.posBundle(ctx) });
                return;
              }
            }
          }

          console.log('📡 [RealtimeSync] Menu items change detected:', payload.eventType);
          qc.invalidateQueries({ queryKey: menuKeys.posBundle(ctx) });
          qc.invalidateQueries({ queryKey: menuKeys.menuItems(ctx) });

          if (subscriptionState.showToasts) {
            const name = (payload.new as any)?.name || (payload.old as any)?.name || 'Item';
            toast.info(`${name} ${payload.eventType.toLowerCase()}`);
          }
        }
      )
      .subscribe();

    subscriptionState.channels.set('items', itemsChannel);

    // Subscribe to menu_customizations changes
    const customizationsChannel = supabase
      .channel('rq_menu_customizations_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'menu_customizations' },
        (payload) => {
          const qc = subscriptionState.queryClientRef;
          const ctx = subscriptionState.currentContext || 'pos';
          if (!qc) return;

          console.log('📡 [RealtimeSync] Customizations change detected:', payload.eventType);
          qc.invalidateQueries({ queryKey: menuKeys.posBundle(ctx) });
          qc.invalidateQueries({ queryKey: menuKeys.customizations(ctx) });
        }
      )
      .subscribe();

    subscriptionState.channels.set('customizations', customizationsChannel);

    // Subscribe to menu_item_variants changes
    const variantsChannel = supabase
      .channel('rq_menu_item_variants_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'menu_item_variants' },
        (payload) => {
          const qc = subscriptionState.queryClientRef;
          const ctx = subscriptionState.currentContext || 'pos';
          if (!qc) return;

          console.log('📡 [RealtimeSync] Variants change detected:', payload.eventType);
          qc.invalidateQueries({ queryKey: menuKeys.posBundle(ctx) });
          qc.invalidateQueries({ queryKey: menuKeys.itemVariants() });
        }
      )
      .subscribe();

    subscriptionState.channels.set('variants', variantsChannel);

    // Subscribe to set_meals changes
    const setMealsChannel = supabase
      .channel('rq_set_meals_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'set_meals' },
        (payload) => {
          const qc = subscriptionState.queryClientRef;
          const ctx = subscriptionState.currentContext || 'pos';
          if (!qc) return;

          console.log('📡 [RealtimeSync] Set meals change detected:', payload.eventType);
          qc.invalidateQueries({ queryKey: menuKeys.posBundle(ctx) });
          qc.invalidateQueries({ queryKey: menuKeys.setMeals(ctx) });
        }
      )
      .subscribe();

    subscriptionState.channels.set('set_meals', setMealsChannel);

    // Subscribe to menu_protein_types changes
    const proteinTypesChannel = supabase
      .channel('rq_menu_protein_types_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'menu_protein_types' },
        (payload) => {
          const qc = subscriptionState.queryClientRef;
          const ctx = subscriptionState.currentContext || 'pos';
          if (!qc) return;

          console.log('📡 [RealtimeSync] Protein types change detected:', payload.eventType);
          qc.invalidateQueries({ queryKey: menuKeys.posBundle(ctx) });
          qc.invalidateQueries({ queryKey: menuKeys.proteinTypes() });
        }
      )
      .subscribe();

    subscriptionState.channels.set('protein_types', proteinTypesChannel);

    console.log('✅ [RealtimeSync] All subscriptions active');
    subscriptionState.isSubscribing = false;

  } catch (error) {
    console.error('❌ [RealtimeSync] Failed to setup subscriptions:', error);
    subscriptionState.isSubscribing = false;
  }
}

/**
 * Cleanup subscriptions (internal function).
 * Only called when last subscriber unmounts.
 */
function cleanupSubscriptionsInternal() {
  console.log('🔌 [RealtimeSync] Cleaning up subscriptions (last subscriber unmounted)...');
  subscriptionState.channels.forEach((channel, name) => {
    try {
      supabase.removeChannel(channel);
    } catch (e) {
      // Ignore errors during cleanup
    }
  });
  subscriptionState.channels.clear();
  subscriptionState.isSubscribing = false;
  subscriptionState.currentContext = null;
  subscriptionState.queryClientRef = null;
}

/**
 * Hook to sync Supabase realtime changes with React Query cache.
 *
 * Uses reference counting to ensure subscriptions are shared across all
 * components that use this hook. Subscriptions are only created when the
 * first subscriber mounts and cleaned up when the last subscriber unmounts.
 *
 * When changes occur in Postgres tables (menu_items, menu_categories, etc.),
 * this hook invalidates the relevant React Query cache entries, triggering
 * automatic refetch.
 *
 * Usage:
 * ```tsx
 * function POSDesktop() {
 *   useMenuRealtimeSync({ context: 'pos', enabled: true });
 *   const { data: bundle } = useMenuBundle({ context: 'pos' });
 *   // ...
 * }
 * ```
 */
export function useMenuRealtimeSync(config: {
  context: MenuContext;
  enabled?: boolean;
  showToasts?: boolean;
}) {
  const { context, enabled = true, showToasts = false } = config;
  const queryClient = useQueryClient();
  const publishedOnly = context !== 'admin';

  // Track if this instance has been counted as a subscriber
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Only subscribe once per hook instance
    if (isSubscribedRef.current) {
      return;
    }

    isSubscribedRef.current = true;
    subscriptionState.subscriberCount++;
    subscriptionState.queryClientRef = queryClient;
    subscriptionState.showToasts = showToasts;

    console.log(`📊 [RealtimeSync] Subscriber mounted (count: ${subscriptionState.subscriberCount})`);

    // Only setup subscriptions if this is the first subscriber
    if (subscriptionState.subscriberCount === 1) {
      setupSubscriptionsInternal(context, publishedOnly);
    }

    // Cleanup function - only clean up subscriptions if this is the last subscriber
    return () => {
      if (!isSubscribedRef.current) {
        return;
      }

      isSubscribedRef.current = false;
      subscriptionState.subscriberCount--;

      console.log(`📊 [RealtimeSync] Subscriber unmounted (count: ${subscriptionState.subscriberCount})`);

      // Only cleanup subscriptions if this is the last subscriber
      if (subscriptionState.subscriberCount === 0) {
        cleanupSubscriptionsInternal();
      }
    };
  }, [enabled]); // Only re-run if enabled changes, NOT on every render

  // Update queryClient ref if it changes (shouldn't normally happen)
  useEffect(() => {
    subscriptionState.queryClientRef = queryClient;
  }, [queryClient]);
}

/**
 * Imperatively invalidate all menu queries.
 * Useful for force refresh scenarios.
 */
export function invalidateAllMenuQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  context?: MenuContext
) {
  console.log('🔄 [RealtimeSync] Invalidating all menu queries...');
  queryClient.invalidateQueries({ queryKey: menuKeys.all });
}

/**
 * Cleanup all realtime subscriptions.
 * Call this on app unmount or when switching away from menu pages.
 * Note: This is a forced cleanup that ignores reference counting.
 */
export function cleanupMenuRealtimeSync() {
  console.log('🔌 [RealtimeSync] Manual cleanup triggered (forced)...');
  subscriptionState.channels.forEach((channel, name) => {
    try {
      supabase.removeChannel(channel);
    } catch (e) {
      // Ignore errors during cleanup
    }
  });
  subscriptionState.channels.clear();
  subscriptionState.isSubscribing = false;
  subscriptionState.subscriberCount = 0;  // Reset subscriber count on forced cleanup
  subscriptionState.currentContext = null;
  subscriptionState.queryClientRef = null;
}

/**
 * Get current subscription state (for debugging).
 */
export function getRealtimeSyncState() {
  return {
    subscriberCount: subscriptionState.subscriberCount,
    channelCount: subscriptionState.channels.size,
    isSubscribing: subscriptionState.isSubscribing,
    currentContext: subscriptionState.currentContext
  };
}
