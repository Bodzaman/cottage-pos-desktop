import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AgentProfileOutput } from 'types';

interface VoiceAgentStore {
  // Selected agent state
  selectedAgent: AgentProfileOutput | null;
  setSelectedAgent: (agent: AgentProfileOutput | null) => void;
  
  // Available agents
  availableAgents: AgentProfileOutput[];
  setAvailableAgents: (agents: AgentProfileOutput[]) => void;
  
  // Voice cart session state
  voiceCartSessionId: string | null;
  setVoiceCartSessionId: (sessionId: string | null) => void;
  
  // Voice ordering status
  isVoiceOrderingActive: boolean;
  setVoiceOrderingActive: (active: boolean) => void;
  
  // Master switch for voice ordering (NEW)
  masterSwitchEnabled: boolean;
  setMasterSwitchEnabled: (enabled: boolean) => void;
  
  // Maintenance mode flag (NEW)
  underMaintenance: boolean;
  setUnderMaintenance: (maintenance: boolean) => void;
  
  // Helper functions
  getSelectedAgentName: () => string;
  getSelectedAgentImage: () => string;
  getSelectedAgentPassportImage: () => string;
  hasSelectedAgent: () => boolean;
}

export const useVoiceAgentStore = create<VoiceAgentStore>()(persist(
  (set, get) => ({
    // Initial state
    selectedAgent: null,
    availableAgents: [],
    voiceCartSessionId: null,
    isVoiceOrderingActive: false,
    masterSwitchEnabled: false, // CORRECTED: Start disabled, enable only when agent selected
    underMaintenance: true, // Default to maintenance mode for safety
    
    // Actions
    setSelectedAgent: (agent) => set({ selectedAgent: agent }),
    setAvailableAgents: (agents) => set({ availableAgents: agents }),
    setVoiceCartSessionId: (sessionId) => set({ voiceCartSessionId: sessionId }),
    setVoiceOrderingActive: (active) => set({ isVoiceOrderingActive: active }),
    setMasterSwitchEnabled: (enabled) => set({ masterSwitchEnabled: enabled }), // NEW: Master switch action
    setUnderMaintenance: (maintenance) => set({ underMaintenance: maintenance }), // NEW: Maintenance mode action
    
    // Helper functions
    getSelectedAgentName: () => {
      const { selectedAgent } = get();
      return selectedAgent?.name || 'Jalal Uddin'; // Default fallback
    },
    
    getSelectedAgentImage: () => {
      const { selectedAgent } = get();
      // For now, we'll use the agent's first letter as avatar
      // TODO: Add proper image URLs to agent profiles
      return selectedAgent?.name?.charAt(0) || 'J';
    },
    
    getSelectedAgentPassportImage: () => {
      const { selectedAgent } = get();
      // Return passport-style image URL based on agent data
      if (selectedAgent?.image_id) {
        return `https://static.databutton.com/public/6d13cbb4-0d00-46ec-8ef0-98e0a8405532/${selectedAgent.image_id}`;
      }
      // Fallback to default agent images based on name/personality
      if (selectedAgent?.name?.toLowerCase().includes('jalal')) {
        return 'https://static.databutton.com/public/2c7eeed4-396b-46e1-a316-2b5a4723e8f0/waiter_1.png';
      }
      // Default professional agent image
      return 'https://static.databutton.com/public/2c7eeed4-396b-46e1-a316-2b5a4723e8f0/waiter_1.png';
    },
    
    hasSelectedAgent: () => {
      const { selectedAgent } = get();
      return selectedAgent !== null;
    }
  }),
  {
    name: 'voice-agent-store', // Storage key
    partialize: (state) => ({
      selectedAgent: state.selectedAgent,
      voiceCartSessionId: state.voiceCartSessionId
    }), // Only persist selected agent and session
  }
));
