import { create } from 'zustand';
import brain from 'brain';
import { AgentConfigResponse, AgentConfigRequest } from 'types';

interface AgentCustomization {
  name: string;
  isActive: boolean;
}

interface AgentConfigStore {
  activeAgentId: string;
  agentCustomizations: Record<string, AgentCustomization>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadConfig: () => Promise<void>;
  saveConfig: () => Promise<void>;
  selectAgent: (agentId: string) => void;
  updateAgentName: (agentId: string, name: string) => void;
  toggleAgentStatus: (agentId: string, isActive: boolean) => void;
  testAgentVoice: (agentId: string) => Promise<void>;
}

export const useAgentConfigStore = create<AgentConfigStore>((set, get) => ({
  activeAgentId: 'professional-female',
  agentCustomizations: {
    'professional-female': { name: 'Sarah', isActive: true },
    'friendly-male': { name: 'James', isActive: false },
    'casual-female': { name: 'Emma', isActive: false }
  },
  isLoading: false,
  error: null,

  loadConfig: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await (brain as any).get_agent_config();
      const data: AgentConfigResponse = await response.json();

      if (data.success && data.config) {
        set({
          activeAgentId: data.config.activeAgentId,
          agentCustomizations: data.config.agentCustomizations,
          isLoading: false
        });
      } else {
        throw new Error('Failed to load configuration');
      }
    } catch (error) {
      console.error('Error loading agent config:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load configuration',
        isLoading: false
      });
    }
  },

  saveConfig: async () => {
    const { activeAgentId, agentCustomizations } = get();
    set({ isLoading: true, error: null });
    
    try {
      const request: AgentConfigRequest = {
        activeAgentId,
        agentCustomizations
      };
      
      const response = await (brain as any).save_agent_config(request);
      const data: AgentConfigResponse = await response.json();
      
      if (data.success) {
        set({ isLoading: false });
      } else {
        throw new Error(data.message || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving agent config:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to save configuration',
        isLoading: false
      });
    }
  },

  selectAgent: (agentId: string) => {
    set((state) => {
      // Create a copy of customizations
      const updatedCustomizations = { ...state.agentCustomizations };

      // Set all agents to inactive first
      Object.keys(updatedCustomizations).forEach(key => {
        updatedCustomizations[key] = { ...updatedCustomizations[key], isActive: false };
      });

      // Set selected agent to active
      if (updatedCustomizations[agentId]) {
        updatedCustomizations[agentId] = { ...updatedCustomizations[agentId], isActive: true };
      }

      return {
        activeAgentId: agentId,
        agentCustomizations: updatedCustomizations
      };
    });
  },

  updateAgentName: (agentId: string, name: string) => {
    set((state) => ({
      agentCustomizations: {
        ...state.agentCustomizations,
        [agentId]: {
          ...state.agentCustomizations[agentId],
          name
        }
      }
    }));
  },

  toggleAgentStatus: (agentId: string, isActive: boolean) => {
    set((state) => {
      const updatedCustomizations = { ...state.agentCustomizations };

      if (updatedCustomizations[agentId]) {
        updatedCustomizations[agentId] = { ...updatedCustomizations[agentId], isActive };
      }

      // If activating this agent, also set it as the active agent
      if (isActive) {
        return {
          activeAgentId: agentId,
          agentCustomizations: updatedCustomizations
        };
      }

      return { agentCustomizations: updatedCustomizations };
    });
  },

  testAgentVoice: async (agentId: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await (brain as any).test_agent_voice({ agentId });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Voice test failed');
      }
    } catch (error) {
      console.error('Error testing agent voice:', error);
      set({
        error: error instanceof Error ? error.message : 'Voice test failed'
      });
    } finally {
      set({ isLoading: false });
    }
  }
}));
