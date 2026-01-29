/**
 * Agent Config Realtime Sync
 *
 * Supabase realtime subscriptions that invalidate React Query cache
 * when unified_agent_config is updated.
 *
 * Benefits:
 * - No module-level channel tracking (React manages lifecycle)
 * - Automatic cleanup on unmount
 * - Works with React Query's cache invalidation
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabaseClient';
import { agentKeys } from './agentQueries';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface AgentRealtimeSyncOptions {
  /** Whether realtime sync is enabled (default: true) */
  enabled?: boolean;
  /** Show toast notifications on updates (default: false) */
  showToasts?: boolean;
}

/**
 * Hook to sync agent config changes via Supabase Realtime.
 * Automatically invalidates React Query cache when config updates.
 *
 * @example
 * ```tsx
 * function AgentConfigProvider() {
 *   // This will auto-invalidate cache on realtime updates
 *   useAgentRealtimeSync({ enabled: true });
 *
 *   return <Children />;
 * }
 * ```
 */
export function useAgentRealtimeSync(options: AgentRealtimeSyncOptions = {}) {
  const { enabled = true, showToasts = false } = options;
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Create unique channel name to prevent collisions
    const channelName = `agent-config-rq-sync-${Date.now()}`;

    console.log('[agentRealtimeSync] Subscribing to realtime changes');

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'unified_agent_config',
        },
        (payload) => {
          console.log('[agentRealtimeSync] Config updated via realtime, invalidating cache...');

          // Invalidate React Query cache - it will auto-refetch
          queryClient.invalidateQueries({ queryKey: agentKeys.config() });

          if (showToasts) {
            // Optional: Could import toast from sonner here
            console.log('[agentRealtimeSync] Agent config updated');
          }
        }
      )
      .subscribe((status) => {
        console.log('[agentRealtimeSync] Subscription status:', status);
      });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      console.log('[agentRealtimeSync] Cleaning up subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, queryClient, showToasts]);
}

/**
 * Cleanup function for manual channel management.
 * Call this when you need to explicitly clean up subscriptions.
 */
export function cleanupAgentRealtimeSync() {
  // This is a no-op now since React manages cleanup via useEffect
  // Kept for API compatibility during migration
  console.log('[agentRealtimeSync] cleanupAgentRealtimeSync called (no-op with React Query)');
}
