/**
 * Unified Agent Config Store
 *
 * @deprecated Phase 7: Use React Query hooks from agentQueries.ts instead.
 * This store is kept for backward compatibility with imperative access patterns
 * (e.g., chat-store.ts using .getState()).
 *
 * New code should use:
 * - useAgentConfigQuery() for React components
 * - useAgentIdentityQuery(), useAgentChatConfigQuery(), useAgentVoiceConfigQuery() for specific slices
 * - useAgentRealtimeSync() for realtime updates
 *
 * Phase 6: AI Chat Frontend Architecture Fix
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase } from './supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ==============================================================================
// TYPES
// ==============================================================================

export interface AgentConfig {
  // Database fields
  id: string;

  // Identity
  agent_name: string;
  agent_role: string;
  agent_avatar_url: string | null;

  // Personality settings
  personality_settings: {
    nationality?: string;
    core_traits?: string;
  };

  // Template system (Phase 0.5)
  template_id?: string | null;
  personality_traits?: string[];

  // Channel settings (chat and voice)
  channel_settings: {
    chat?: {
      enabled?: boolean;
      system_prompt?: string;
      custom_instructions?: string;
      tone?: string[];
      model_provider?: string;
      model_name?: string;
      temperature?: number;
      max_tokens?: number;
      greeting?: string;
    };
    voice?: {
      enabled?: boolean;
      system_prompt?: string;
      first_response?: string;
      voice_model?: string;
    };
  };

  // Publish state (Phase 6 additions)
  is_active: boolean;
  config_version: number;
  last_published_at: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

interface AgentConfigStore {
  // State
  config: AgentConfig | null;
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: number;

  // Actions
  fetchConfig: () => Promise<void>;
  invalidateAndRefetch: () => Promise<void>;
  subscribeToChanges: () => () => void;
  clearError: () => void;

  // Selectors (for efficient component updates)
  getIdentity: () => {
    agent_name: string;
    agent_role: string;
    agent_avatar_url: string | null;
    nationality?: string;
  } | null;

  getChatConfig: () => {
    system_prompt?: string;
    custom_instructions?: string;
    tone?: string[];
    greeting?: string;
  } | null;

  getVoiceConfig: () => {
    system_prompt?: string;
    first_response?: string;
    voice_model?: string;
    agent_name?: string;
    personality_traits?: string[];
  } | null;

  getPublishState: () => {
    is_active: boolean;
    config_version: number;
    last_published_at: string | null;
  } | null;
}

// ==============================================================================
// STORE
// ==============================================================================

// Track realtime subscription to prevent duplicates
let realtimeChannel: RealtimeChannel | null = null;

export const useAgentConfigStore = create<AgentConfigStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    config: null,
    isLoading: false,
    error: null,
    lastFetchedAt: 0,

    // Fetch config from database
    fetchConfig: async () => {
      // Avoid re-fetching if we fetched recently (within 5 seconds)
      const now = Date.now();
      const state = get();
      if (state.isLoading) return;
      if (state.config && now - state.lastFetchedAt < 5000) return;

      set({ isLoading: true, error: null });

      try {
        const { data, error } = await supabase
          .from('unified_agent_config')
          .select('*')
          .limit(1)
          .single();

        if (error) throw error;

        set({
          config: data as AgentConfig,
          isLoading: false,
          lastFetchedAt: Date.now(),
        });

        console.log('[AgentConfigStore] Config fetched, version:', data?.config_version);
      } catch (error) {
        console.error('[AgentConfigStore] Failed to fetch config:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch config',
          isLoading: false,
        });
      }
    },

    // Force invalidate and refetch (used after publish or avatar upload)
    invalidateAndRefetch: async () => {
      set({ lastFetchedAt: 0 }); // Reset cache
      await get().fetchConfig();
    },

    // Subscribe to realtime config changes
    subscribeToChanges: () => {
      // Prevent duplicate subscriptions
      if (realtimeChannel) {
        console.log('[AgentConfigStore] Already subscribed to realtime');
        return () => {};
      }

      console.log('[AgentConfigStore] Subscribing to realtime changes');

      realtimeChannel = supabase
        .channel('agent-config-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'unified_agent_config',
          },
          (payload) => {
            console.log('[AgentConfigStore] Config updated via realtime, refetching...');
            // Invalidate and refetch on any update
            get().invalidateAndRefetch();
          }
        )
        .subscribe((status) => {
          console.log('[AgentConfigStore] Realtime subscription status:', status);
        });

      // Return cleanup function
      return () => {
        console.log('[AgentConfigStore] Unsubscribing from realtime');
        if (realtimeChannel) {
          supabase.removeChannel(realtimeChannel);
          realtimeChannel = null;
        }
      };
    },

    // Clear error state
    clearError: () => set({ error: null }),

    // Selectors for efficient component updates
    getIdentity: () => {
      const config = get().config;
      if (!config) return null;

      return {
        agent_name: config.agent_name,
        agent_role: config.agent_role,
        agent_avatar_url: config.agent_avatar_url,
        nationality: config.personality_settings?.nationality,
      };
    },

    getChatConfig: () => {
      const config = get().config;
      if (!config) return null;

      const chat = config.channel_settings?.chat;
      return {
        system_prompt: chat?.system_prompt,
        custom_instructions: chat?.custom_instructions,
        tone: chat?.tone,
        greeting: chat?.greeting,
      };
    },

    getVoiceConfig: () => {
      const config = get().config;
      if (!config) return null;

      const voice = config.channel_settings?.voice;
      return {
        system_prompt: voice?.system_prompt,
        first_response: voice?.first_response,
        voice_model: voice?.voice_model,
        agent_name: config.agent_name,
        personality_traits: config.personality_traits,
      };
    },

    getPublishState: () => {
      const config = get().config;
      if (!config) return null;

      return {
        is_active: config.is_active,
        config_version: config.config_version,
        last_published_at: config.last_published_at,
      };
    },
  }))
);

// ==============================================================================
// HOOKS FOR SPECIFIC USE CASES
// ==============================================================================

/**
 * Hook to get agent identity (name, role, avatar)
 * Only re-renders when identity fields change
 */
export function useAgentIdentity() {
  return useAgentConfigStore((state) => state.getIdentity());
}

/**
 * Hook to get chat-specific config
 * Only re-renders when chat config changes
 */
export function useAgentChatConfig() {
  return useAgentConfigStore((state) => state.getChatConfig());
}

/**
 * Hook to get voice-specific config
 * Only re-renders when voice config changes
 */
export function useAgentVoiceConfig() {
  return useAgentConfigStore((state) => state.getVoiceConfig());
}

/**
 * Hook to get publish state
 * Only re-renders when publish state changes
 */
export function useAgentPublishState() {
  return useAgentConfigStore((state) => state.getPublishState());
}

/**
 * Hook to get config version (for cache busting)
 */
export function useConfigVersion() {
  return useAgentConfigStore((state) => state.config?.config_version ?? 0);
}

// ==============================================================================
// EXPORTS
// ==============================================================================

export default useAgentConfigStore;
