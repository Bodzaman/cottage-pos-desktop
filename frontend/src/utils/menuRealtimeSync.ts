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
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabaseClient';
import { menuKeys, MenuContext } from './menuQueries';
import { toast } from 'sonner';

// Subscription state tracking
interface SubscriptionState {
  channels: Map<string, any>;
  isSubscribing: boolean;
}

const subscriptionState: SubscriptionState = {
  channels: new Map(),
  isSubscribing: false
};

/**
 * Hook to sync Supabase realtime changes with React Query cache.
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
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Prevent multiple subscription setups
    if (subscriptionState.isSubscribing) {
      console.log('⏳ [RealtimeSync] Already setting up subscriptions, skipping...');
      return;
    }

    subscriptionState.isSubscribing = true;

    const setupSubscriptions = async () => {
      try {
        // Clean up existing channels first
        subscriptionState.channels.forEach((channel, name) => {
          try {
            supabase.removeChannel(channel);
          } catch (e) {
            console.warn(`⚠️ [RealtimeSync] Error removing channel ${name}:`, e);
          }
        });
        subscriptionState.channels.clear();

        console.log(`🔌 [RealtimeSync] Setting up subscriptions (context: ${context})...`);

        // Subscribe to menu_categories changes
        const categoriesChannel = supabase
          .channel('rq_menu_categories_changes')
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'menu_categories' },
            (payload) => {
              console.log('📡 [RealtimeSync] Categories change detected:', payload.eventType);
              queryClient.invalidateQueries({ queryKey: menuKeys.posBundle(context) });
              queryClient.invalidateQueries({ queryKey: menuKeys.categories(context) });

              if (showToasts) {
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
              // For POS/Online contexts, check if item is published
              if (publishedOnly) {
                const newRecord = payload.new as any;

                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                  if (!newRecord?.published_at) {
                    console.log('🚫 [RealtimeSync] Skipping unpublished item in POS/Online context');
                    // Still invalidate to remove any unpublished items from cache
                    queryClient.invalidateQueries({ queryKey: menuKeys.posBundle(context) });
                    return;
                  }
                }
              }

              console.log('📡 [RealtimeSync] Menu items change detected:', payload.eventType);
              queryClient.invalidateQueries({ queryKey: menuKeys.posBundle(context) });
              queryClient.invalidateQueries({ queryKey: menuKeys.menuItems(context) });

              if (showToasts) {
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
              console.log('📡 [RealtimeSync] Customizations change detected:', payload.eventType);
              queryClient.invalidateQueries({ queryKey: menuKeys.posBundle(context) });
              queryClient.invalidateQueries({ queryKey: menuKeys.customizations(context) });
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
              console.log('📡 [RealtimeSync] Variants change detected:', payload.eventType);
              queryClient.invalidateQueries({ queryKey: menuKeys.posBundle(context) });
              queryClient.invalidateQueries({ queryKey: menuKeys.itemVariants() });
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
              console.log('📡 [RealtimeSync] Set meals change detected:', payload.eventType);
              queryClient.invalidateQueries({ queryKey: menuKeys.posBundle(context) });
              queryClient.invalidateQueries({ queryKey: menuKeys.setMeals(context) });
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
              console.log('📡 [RealtimeSync] Protein types change detected:', payload.eventType);
              queryClient.invalidateQueries({ queryKey: menuKeys.posBundle(context) });
              queryClient.invalidateQueries({ queryKey: menuKeys.proteinTypes() });
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
    };

    setupSubscriptions();

    // Cleanup function
    cleanupRef.current = () => {
      console.log('🔌 [RealtimeSync] Cleaning up subscriptions...');
      subscriptionState.channels.forEach((channel, name) => {
        try {
          supabase.removeChannel(channel);
        } catch (e) {
          console.warn(`⚠️ [RealtimeSync] Error removing channel ${name}:`, e);
        }
      });
      subscriptionState.channels.clear();
      subscriptionState.isSubscribing = false;
    };

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [context, enabled, publishedOnly, queryClient, showToasts]);
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
 */
export function cleanupMenuRealtimeSync() {
  console.log('🔌 [RealtimeSync] Manual cleanup triggered...');
  subscriptionState.channels.forEach((channel, name) => {
    try {
      supabase.removeChannel(channel);
    } catch (e) {
      console.warn(`⚠️ [RealtimeSync] Error removing channel ${name}:`, e);
    }
  });
  subscriptionState.channels.clear();
  subscriptionState.isSubscribing = false;
}
