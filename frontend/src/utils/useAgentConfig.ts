import { useState, useEffect } from 'react';
import brain from 'brain';
import { useAgentConfigQuery } from './agentQueries';
import { useAgentRealtimeSync } from './agentRealtimeSync';

/**
 * Dynamic Agent Configuration Hook
 *
 * Phase 7: Migrated to React Query for automatic caching and deduplication.
 *
 * Data Sources:
 * - Restaurant name: restaurant_settings.business_profile.name
 * - Agent profile: React Query + Supabase Realtime invalidation
 *
 * Used by:
 * - ChatLargeModal (chat interface branding)
 * - VoiceCallOverlay (voice interface branding)
 * - InlineTermsScreen (voice T&C screen)
 */

export interface AgentConfig {
  restaurantName: string;
  agentName: string;
  agentRole: string;
  agentAvatar: string;
  isLoading: boolean;
  error: string | null;
}

// Build avatar URL dynamically from Supabase config
const getDefaultAvatarUrl = (): string => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/avatars/avatars/avatar_ai-assistant-avatar_3033ecbc.jpg`;
  }
  // Fallback to a placeholder if no Supabase URL configured
  return '/placeholder-avatar.png';
};

const DEFAULT_CONFIG: AgentConfig = {
  restaurantName: 'Cottage Tandoori',
  agentName: 'Uncle Raj',
  agentRole: 'Head waiter',
  agentAvatar: getDefaultAvatarUrl(),
  isLoading: true,
  error: null,
};

/**
 * Hook to fetch dynamic agent configuration
 *
 * Phase 7: Uses React Query for agent data with realtime invalidation.
 * Restaurant name is still fetched separately.
 *
 * @returns AgentConfig object with restaurant and agent branding data
 *
 * @example
 * ```tsx
 * const { restaurantName, agentName, agentAvatar, isLoading } = useAgentConfig();
 *
 * if (isLoading) return <Skeleton />;
 *
 * return (
 *   <div>
 *     <img src={agentAvatar} alt={agentName} />
 *     <h1>{agentName} at {restaurantName}</h1>
 *   </div>
 * );
 * ```
 */
export function useAgentConfig(): AgentConfig {
  const [restaurantName, setRestaurantName] = useState<string>(DEFAULT_CONFIG.restaurantName);
  const [restaurantLoading, setRestaurantLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Phase 7: Get agent config from React Query (with automatic caching)
  const { data: agentConfig, isLoading: configIsLoading, error: configError } = useAgentConfigQuery();

  // Subscribe to realtime updates (invalidates React Query cache)
  useAgentRealtimeSync({ enabled: true });

  // Fetch restaurant name separately (still from API)
  useEffect(() => {
    let isMounted = true;

    async function fetchRestaurantName() {
      try {
        const settingsRes = await brain.get_restaurant_settings();
        const settings = await settingsRes.json();

        if (!isMounted) return;

        const name = settings?.business_profile?.name || DEFAULT_CONFIG.restaurantName;
        setRestaurantName(name);
        setRestaurantLoading(false);
      } catch (err) {
        console.error('Failed to fetch restaurant settings:', err);
        if (!isMounted) return;

        setError(err instanceof Error ? err.message : 'Failed to load restaurant settings');
        setRestaurantLoading(false);
      }
    }

    fetchRestaurantName();

    return () => {
      isMounted = false;
    };
  }, []);

  // Combine loading states
  const isLoading = restaurantLoading || configIsLoading;

  // Extract agent data from React Query with defaults
  const agentName = agentConfig?.agent_name || DEFAULT_CONFIG.agentName;
  const agentRole = agentConfig?.agent_role || DEFAULT_CONFIG.agentRole;
  const agentAvatar = agentConfig?.agent_avatar_url || DEFAULT_CONFIG.agentAvatar;

  return {
    restaurantName,
    agentName,
    agentRole,
    agentAvatar,
    isLoading,
    error: error || (configError instanceof Error ? configError.message : null),
  };
}

/**
 * Re-export for convenience
 */
export default useAgentConfig;
