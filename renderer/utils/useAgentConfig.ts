import { useState, useEffect } from 'react';
import { apiClient } from 'app';

/**
 * Dynamic Agent Configuration Hook
 * 
 * Fetches and manages dynamic branding for both chat and voice interfaces.
 * 
 * Data Sources:
 * - Restaurant name: restaurant_settings.business_profile.name
 * - Agent profile: unified_agent_config (name, role, avatar)
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

const DEFAULT_CONFIG: AgentConfig = {
  restaurantName: 'Cottage Tandoori',
  agentName: 'Uncle Raj',
  agentRole: 'Head waiter',
  agentAvatar: 'https://mxrkttvgwwdhgnecqhfo.supabase.co/storage/v1/object/public/avatars/avatars/avatar_ai-assistant-avatar_3033ecbc.jpg',
  isLoading: true,
  error: null,
};

/**
 * Hook to fetch dynamic agent configuration from Supabase
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
  const [config, setConfig] = useState<AgentConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    let isMounted = true;

    async function fetchConfig() {
      try {
        // Fetch both configs in parallel for better performance
        const [settingsRes, agentRes] = await Promise.all([
          apiClient.get_restaurant_settings(),
          apiClient.get_unified_agent_config(),
        ]);

        const settings = await settingsRes.json();
        const agentData = await agentRes.json();

        if (!isMounted) return;

        // Extract restaurant name with fallback
        const restaurantName = settings?.business_profile?.name || DEFAULT_CONFIG.restaurantName;

        // Extract agent config with fallbacks
        const agentName = agentData?.agent_name || DEFAULT_CONFIG.agentName;
        const agentRole = agentData?.agent_role || DEFAULT_CONFIG.agentRole;
        const agentAvatar = agentData?.agent_avatar_url || DEFAULT_CONFIG.agentAvatar;

        setConfig({
          restaurantName,
          agentName,
          agentRole,
          agentAvatar,
          isLoading: false,
          error: null,
        });

        console.log('✅ Agent config loaded:', { restaurantName, agentName, agentRole });
      } catch (error) {
        console.error('❌ Failed to fetch agent config:', error);
        
        if (!isMounted) return;

        // On error, use defaults but mark as loaded
        setConfig({
          ...DEFAULT_CONFIG,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load agent config',
        });
      }
    }

    fetchConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  return config;
}

/**
 * Re-export for convenience
 */
export default useAgentConfig;
