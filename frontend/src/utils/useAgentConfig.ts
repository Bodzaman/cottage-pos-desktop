import { useState, useEffect } from 'react';
import brain from 'brain';
import { useAgentConfigStore } from './agentConfigStore';

/**
 * Dynamic Agent Configuration Hook
 *
 * Phase 6: Updated to use agentConfigStore for reactive agent config updates.
 *
 * Data Sources:
 * - Restaurant name: restaurant_settings.business_profile.name
 * - Agent profile: agentConfigStore (Zustand + Supabase Realtime)
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
 * Phase 6: Uses agentConfigStore for agent data with realtime updates.
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

  // Phase 6: Get agent config from the unified store (with realtime updates)
  const agentConfig = useAgentConfigStore((state) => state.config);
  const fetchConfig = useAgentConfigStore((state) => state.fetchConfig);
  const subscribeToChanges = useAgentConfigStore((state) => state.subscribeToChanges);
  const storeIsLoading = useAgentConfigStore((state) => state.isLoading);
  const storeError = useAgentConfigStore((state) => state.error);

  // Fetch agent config from store on mount
  useEffect(() => {
    fetchConfig();

    // Subscribe to realtime updates
    const unsubscribe = subscribeToChanges();

    return () => {
      unsubscribe();
    };
  }, [fetchConfig, subscribeToChanges]);

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
  const isLoading = restaurantLoading || storeIsLoading;

  // Extract agent data from store with defaults
  const agentName = agentConfig?.agent_name || DEFAULT_CONFIG.agentName;
  const agentRole = agentConfig?.agent_role || DEFAULT_CONFIG.agentRole;
  const agentAvatar = agentConfig?.agent_avatar_url || DEFAULT_CONFIG.agentAvatar;

  return {
    restaurantName,
    agentName,
    agentRole,
    agentAvatar,
    isLoading,
    error: error || storeError,
  };
}

/**
 * Re-export for convenience
 */
export default useAgentConfig;
