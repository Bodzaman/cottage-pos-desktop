import React from 'react';
import { create } from 'zustand';
import { apiClient } from 'app';

// Types for all voice-related stores
interface LiveCall {
  call_id: string;
  agent_name: string;
  agent_id: string;
  status: 'active' | 'completed' | 'failed';
  start_time: string;
  end_time?: string;
  duration?: number;
}

// Updated AgentProfile interface to match database structure
interface AgentProfile {
  id: string;
  name: string;
  description: string;
  voice_type?: string;
  personality?: string;
  speed?: number;
  pitch?: number;
  ultravox_agent_id?: string;
  image_id?: string;
  is_default?: boolean;
  is_admin_visible?: boolean;
  system_prompt?: string;
  gender?: string;
  passport_nationality?: string;
  created_at?: string;
  updated_at?: string;
  // Legacy fields for backward compatibility
  avatar_url?: string;
  voice_id?: string;
}

interface AIVoiceSettings {
  enabled: boolean;
  custom_name: string;
  selected_agent_id: string;
  auto_approve_orders: boolean;
  max_order_value: number;
}

// Main AI Voice Store
interface AIVoiceStore {
  // Settings
  settings: AIVoiceSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  
  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AIVoiceSettings>) => Promise<boolean>;
  saveSettings: () => Promise<boolean>;
}

// Master Toggle Store
interface AIVoiceMasterToggleStore {
  enabled: boolean;
  isLoading: boolean;
  agentName: string;
  avatarUrl: string;
  
  toggle: (enabled: boolean) => Promise<boolean>;
  refresh: () => Promise<void>;
}

// Live Calls Store
interface AIVoiceLiveCallsStore {
  liveCalls: LiveCall[];
  totalActiveCalls: number;
  isLoading: boolean;
  
  refresh: () => Promise<void>;
  addCall: (call: LiveCall) => void;
  updateCall: (callId: string, updates: Partial<LiveCall>) => void;
  removeCall: (callId: string) => void;
}

// Agents Store
interface AIVoiceAgentsStore {
  agents: AgentProfile[];
  selectedAgent: AgentProfile | null;
  isLoading: boolean;
  
  loadAgents: () => Promise<void>;
  selectAgent: (agentId: string) => void;
  refresh: () => Promise<void>;
}

// Connection Store
interface AIVoiceConnectionStore {
  isConnected: boolean;
  lastTestResult: boolean | null;
  isLoading: boolean;
  
  test: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

// Create stores
const useAIVoiceStoreInternal = create<AIVoiceStore>((set, get) => ({
  settings: null,
  isLoading: false,
  isSaving: false,
  hasUnsavedChanges: false,
  
  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get_voice_agent_status();
      const result = await response.json();
      
      if (result.settings) {
        set({ 
          settings: result.settings,
          isLoading: false 
        });
      } else {
        // Default settings if none exist
        set({ 
          settings: {
            enabled: false,
            custom_name: 'Cottage Tandoori Assistant',
            selected_agent_id: '',
            auto_approve_orders: false,
            max_order_value: 50.00
          },
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('Failed to load AI voice settings:', error);
      set({ isLoading: false });
    }
  },
  
  updateSettings: async (updates) => {
    const { settings } = get();
    if (!settings) return false;
    
    set({ isSaving: true });
    try {
      // Update settings locally first
      const updatedSettings = { ...settings, ...updates };
      set({ settings: updatedSettings, hasUnsavedChanges: true });
      
      // Save to backend
      const response = await apiClient.update_manager_credential2({ 
        ai_voice_settings: updatedSettings 
      });
      
      if (response.ok) {
        set({ hasUnsavedChanges: false, isSaving: false });
        return true;
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to update AI voice settings:', error);
      set({ isSaving: false });
      return false;
    }
  },
  
  saveSettings: async () => {
    return get().updateSettings({});
  }
}));

const useAIVoiceMasterToggleInternal = create<AIVoiceMasterToggleStore>((set, get) => ({
  enabled: false,
  isLoading: false,
  agentName: 'AI Assistant',
  avatarUrl: '',
  
  toggle: async (enabled) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.toggle_ai_voice_assistant({ enabled });
      
      if (response.ok) {
        set({ enabled, isLoading: false });
        return true;
      } else {
        throw new Error('Failed to toggle AI voice');
      }
    } catch (error) {
      console.error('Failed to toggle AI voice:', error);
      set({ isLoading: false });
      return false;
    }
  },
  
  refresh: async () => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get_voice_agent_status();
      const result = await response.json();
      
      set({ 
        enabled: result.enabled || false,
        agentName: result.agent_name || 'AI Assistant',
        avatarUrl: result.avatar_url || '',
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to refresh AI voice status:', error);
      set({ isLoading: false });
    }
  }
}));

const useAIVoiceLiveCallsInternal = create<AIVoiceLiveCallsStore>((set, get) => ({
  liveCalls: [],
  totalActiveCalls: 0,
  isLoading: false,
  
  refresh: async () => {
    set({ isLoading: true });
    try {
      const response = await apiClient.list_active_sessions();
      const result = await response.json();
      
      const liveCalls = result.sessions || [];
      set({ 
        liveCalls,
        totalActiveCalls: liveCalls.filter((call: LiveCall) => call.status === 'active').length,
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to refresh live calls:', error);
      set({ liveCalls: [], totalActiveCalls: 0, isLoading: false });
    }
  },
  
  addCall: (call) => {
    const { liveCalls } = get();
    const updatedCalls = [...liveCalls, call];
    set({ 
      liveCalls: updatedCalls,
      totalActiveCalls: updatedCalls.filter(c => c.status === 'active').length
    });
  },
  
  updateCall: (callId, updates) => {
    const { liveCalls } = get();
    const updatedCalls = liveCalls.map(call => 
      call.call_id === callId ? { ...call, ...updates } : call
    );
    set({ 
      liveCalls: updatedCalls,
      totalActiveCalls: updatedCalls.filter(c => c.status === 'active').length
    });
  },
  
  removeCall: (callId) => {
    const { liveCalls } = get();
    const updatedCalls = liveCalls.filter(call => call.call_id !== callId);
    set({ 
      liveCalls: updatedCalls,
      totalActiveCalls: updatedCalls.filter(c => c.status === 'active').length
    });
  }
}));

const useAIVoiceAgentsInternal = create<AIVoiceAgentsStore>((set, get) => ({
  agents: [],
  selectedAgent: null,
  isLoading: false,
  
  loadAgents: async () => {
    set({ isLoading: true });
    try {
      console.log('🔄 Loading agents from API...');
      const response = await apiClient.get_agent_profiles_endpoint();
      const data = await response.json();
      
      if (data.success && Array.isArray(data.agents)) {
        console.log('✅ Loaded agents from API:', data.agents.length);
        
        // 🛡️ PHASE 3: Filter to only include Ultravox-enabled agents
        const ultravoxAgents = data.agents.filter(agent => 
          agent.ultravox_agent_id && agent.ultravox_agent_id.trim() !== ''
        );
        
        console.log(`🔍 Filtered to ${ultravoxAgents.length} Ultravox agents (from ${data.agents.length} total)`);
        
        // Only use agents with valid Ultravox IDs for voice calls
        set({ 
          agents: ultravoxAgents, // Only Ultravox agents
          selectedAgent: ultravoxAgents.length > 0 ? ultravoxAgents[0] : null,
          isLoading: false 
        });
      } else {
        console.error('❌ Failed to load agents:', data.message || 'Unknown error');
        set({ 
          agents: [],
          selectedAgent: null,
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('❌ Failed to load agents:', error);
      set({ 
        agents: [],
        selectedAgent: null,
        isLoading: false 
      });
    }
  },
  
  selectAgent: (agentId) => {
    const { agents } = get();
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      console.log('🎯 Selected agent:', agent.name, '(ID:', agent.id, ')');
      set({ selectedAgent: agent });
    }
  },
  
  refresh: async () => {
    return get().loadAgents();
  }
}));

const useAIVoiceConnectionInternal = create<AIVoiceConnectionStore>((set, get) => ({
  isConnected: false,
  lastTestResult: null,
  isLoading: false,
  
  test: async () => {
    set({ isLoading: true });
    try {
      const response = await apiClient.webrtc_health_check();
      const isConnected = response.ok;
      
      set({ 
        isConnected,
        lastTestResult: isConnected,
        isLoading: false 
      });
      
      return isConnected;
    } catch (error) {
      console.error('Failed to test connection:', error);
      set({ 
        isConnected: false,
        lastTestResult: false,
        isLoading: false 
      });
      return false;
    }
  },
  
  refresh: async () => {
    return get().test();
  }
}));

// Export hooks with proper initialization
export const useAIVoiceStore = () => {
  const store = useAIVoiceStoreInternal();
  
  // Auto-load settings on first use
  React.useEffect(() => {
    if (!store.settings && !store.isLoading) {
      store.loadSettings();
    }
  }, [store.settings, store.isLoading]);
  
  return store;
};

export const useAIVoiceMasterToggle = () => {
  const store = useAIVoiceMasterToggleInternal();
  
  // Auto-refresh status on first use
  React.useEffect(() => {
    if (!store.isLoading) {
      store.refresh();
    }
  }, []);
  
  return store;
};

export const useAIVoiceLiveCalls = () => {
  const store = useAIVoiceLiveCallsInternal();
  
  // Auto-refresh calls on first use
  React.useEffect(() => {
    if (!store.isLoading) {
      store.refresh();
    }
  }, []);
  
  return store;
};

export const useAIVoiceAgents = () => {
  const store = useAIVoiceAgentsInternal();
  
  // Auto-load agents on first use
  React.useEffect(() => {
    if (store.agents.length === 0 && !store.isLoading) {
      store.loadAgents();
    }
  }, [store.agents.length, store.isLoading]);
  
  return store;
};

export const useAIVoiceConnection = () => {
  const store = useAIVoiceConnectionInternal();
  
  return store;
};

// Re-export types for external use
export type { AIVoiceSettings, AgentProfile, LiveCall };
