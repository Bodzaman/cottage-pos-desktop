/**
 * Agent Config React Query Hooks
 *
 * React Query-based data fetching for unified agent configuration.
 * Replaces manual caching and module-level flags in agentConfigStore.
 *
 * Benefits:
 * - Automatic cache management with staleTime/gcTime
 * - Request deduplication built-in
 * - No module-level flags or race conditions
 * - Background refetch on window focus
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from './supabaseClient';
import type { AgentConfig } from './agentConfigStore';

// ==============================================================================
// QUERY KEYS
// ==============================================================================

export const agentKeys = {
  all: ['agent'] as const,
  config: () => [...agentKeys.all, 'config'] as const,
  identity: () => [...agentKeys.all, 'identity'] as const,
  chatConfig: () => [...agentKeys.all, 'chat-config'] as const,
  voiceConfig: () => [...agentKeys.all, 'voice-config'] as const,
};

// ==============================================================================
// FETCHERS
// ==============================================================================

async function fetchAgentConfig(): Promise<AgentConfig | null> {
  const { data, error } = await supabase
    .from('unified_agent_config')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('[agentQueries] Failed to fetch config:', error);
    throw error;
  }

  console.log('[agentQueries] Config fetched, version:', data?.config_version);
  return data as AgentConfig;
}

// ==============================================================================
// HOOKS
// ==============================================================================

/**
 * Main hook to fetch agent configuration.
 * Uses React Query for automatic caching, deduplication, and background refetch.
 *
 * @example
 * ```tsx
 * const { data: config, isLoading, error } = useAgentConfigQuery();
 * ```
 */
export function useAgentConfigQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: agentKeys.config(),
    queryFn: fetchAgentConfig,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000,   // 1 hour retention
    enabled: options?.enabled ?? true,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to get agent identity (name, role, avatar)
 * Selects only identity fields from the config.
 */
export function useAgentIdentityQuery() {
  const { data: config, ...rest } = useAgentConfigQuery();

  const identity = config ? {
    agent_name: config.agent_name,
    agent_role: config.agent_role,
    agent_avatar_url: config.agent_avatar_url,
    nationality: config.personality_settings?.nationality,
  } : null;

  return { data: identity, ...rest };
}

/**
 * Hook to get chat-specific config
 */
export function useAgentChatConfigQuery() {
  const { data: config, ...rest } = useAgentConfigQuery();

  const chatConfig = config ? {
    system_prompt: config.channel_settings?.chat?.system_prompt,
    custom_instructions: config.channel_settings?.chat?.custom_instructions,
    tone: config.channel_settings?.chat?.tone,
    greeting: config.channel_settings?.chat?.greeting,
    enabled: config.channel_settings?.chat?.enabled,
  } : null;

  return { data: chatConfig, ...rest };
}

/**
 * Hook to get voice-specific config
 */
export function useAgentVoiceConfigQuery() {
  const { data: config, ...rest } = useAgentConfigQuery();

  const voiceConfig = config ? {
    system_prompt: config.channel_settings?.voice?.system_prompt,
    first_response: config.channel_settings?.voice?.first_response,
    voice_model: config.channel_settings?.voice?.voice_model,
    agent_name: config.agent_name,
    personality_traits: config.personality_traits,
    enabled: config.channel_settings?.voice?.enabled,
  } : null;

  return { data: voiceConfig, ...rest };
}

/**
 * Hook to get publish state
 */
export function useAgentPublishStateQuery() {
  const { data: config, ...rest } = useAgentConfigQuery();

  const publishState = config ? {
    is_active: config.is_active,
    config_version: config.config_version,
    last_published_at: config.last_published_at,
  } : null;

  return { data: publishState, ...rest };
}

/**
 * Hook to get config version (for cache busting)
 */
export function useConfigVersionQuery() {
  const { data: config, ...rest } = useAgentConfigQuery();
  return { data: config?.config_version ?? 0, ...rest };
}

// ==============================================================================
// INVALIDATION HELPERS
// ==============================================================================

/**
 * Hook to get a function that invalidates agent config cache.
 * Useful after mutations or external updates.
 */
export function useInvalidateAgentConfig() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: agentKeys.config() });
  };
}

/**
 * Get agent config from cache (for imperative access).
 * Use this in non-React contexts like the chat-store.
 */
export function getAgentConfigFromCache(queryClient: ReturnType<typeof useQueryClient>): AgentConfig | null {
  return queryClient.getQueryData<AgentConfig | null>(agentKeys.config()) ?? null;
}
