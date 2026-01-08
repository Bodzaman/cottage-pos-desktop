import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneOff, Mic, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../utils/cn';
import { PremiumTheme } from '../utils/premiumTheme';
import { apiClient } from 'app';
import { AgentProfile } from 'types';

interface AIVoiceSettings {
  id: string;
  restaurant_id: string;
  enabled: boolean;
  selected_agent_id: string;
  custom_name: string;
  avatar_url?: string;
  ultravox_agent_id?: string;
  created_at: string;
  updated_at: string;
}

interface AIAssistantPanelProps {
  aiSettings: AIVoiceSettings | null;
  isLoading?: boolean;
  className?: string;
  onOrderUpdate?: (items: any[]) => void;
}

/**
 * AI Assistant Panel for OnlineOrders
 * 
 * Dynamically shows/hides based on Supabase ai_voice_settings.
 * Displays dynamic agent card names and connects to Ultravox for voice ordering.
 */
export function AIAssistantPanel({ 
  aiSettings, 
  isLoading = false, 
  className = '',
  onOrderUpdate
}: AIAssistantPanelProps) {
  // Dynamic agent data state
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);

  // Load selected agent when settings change - MOVED BEFORE CONDITIONAL RETURN
  useEffect(() => {
    if (aiSettings?.selected_agent_id) {
      loadSelectedAgent(aiSettings.selected_agent_id);
    }
  }, [aiSettings?.selected_agent_id]);
  
  const loadSelectedAgent = async (agentId: string) => {
    try {
      setAgentLoading(true);
      const response = await apiClient.get_agent_profiles_endpoint();
      const agentsData = await response.json();
      
      if (agentsData.success && agentsData.agents) {
        const agent = agentsData.agents.find((a: AgentProfile) => a.id === agentId);
        if (agent) {
          setSelectedAgent(agent);
        } else {
          console.warn(`Agent with ID ${agentId} not found`);
          // Fallback to first available agent
          if (agentsData.agents.length > 0) {
            setSelectedAgent(agentsData.agents[0]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load agent data:', err);
    } finally {
      setAgentLoading(false);
    }
  };

  // Don't render if AI is disabled or settings not loaded - MOVED AFTER ALL HOOKS
  if (isLoading || !aiSettings || !aiSettings.enabled) {
    return null;
  }
  
  // Get dynamic agent information
  const getAgentDisplayName = () => {
    return selectedAgent?.name || 'AI Assistant';
  };
  
  const getAgentAvatar = () => {
    return aiSettings?.avatar_url || 
           selectedAgent?.image_id || 
           'https://images.unsplash.com/photo-1494790108755-2616b612b047?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80';
  };
  
  const getAgentId = () => {
    return aiSettings?.selected_agent_id || selectedAgent?.id || null; // No more hard-coded fallback
  };

  // Handle ending call
  const handleEndCall = () => {
    const agentName = getAgentDisplayName();
    toast.info(`Call with ${agentName} ended`);
  };

  const agentName = getAgentDisplayName();
  const agentAvatar = getAgentAvatar();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn('relative', className)}
    >
      <Card className="overflow-hidden border-2 transition-all duration-300 hover:shadow-xl" style={{
        backgroundColor: PremiumTheme.colors.burgundy[900],
        borderColor: PremiumTheme.colors.burgundy[700],
        boxShadow: `0 4px 20px ${PremiumTheme.colors.burgundy[800]}60`
      }}>
        {/* Header with animated gradient */}
        <div className="relative p-4 overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 opacity-20">
            <motion.div
              animate={{
                background: `linear-gradient(45deg, ${PremiumTheme.colors.burgundy[600]}, ${PremiumTheme.colors.burgundy[800]}, ${PremiumTheme.colors.burgundy[600]})`
              }}
              transition={{ duration: 0.5 }}
              className="w-full h-full"
            />
          </div>
          
          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-12 h-12 border-2" style={{
                    borderColor: PremiumTheme.colors.silver[400]
                  }}>
                    <AvatarImage src={agentAvatar} alt={agentName} />
                    <AvatarFallback className="text-lg font-bold" style={{
                      backgroundColor: PremiumTheme.colors.burgundy[800],
                      color: PremiumTheme.colors.gold[400]
                    }}>
                      <User className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1" style={{ color: PremiumTheme.colors.gold[300] }}>
                    {agentLoading ? 'Loading...' : agentName}
                  </h3>
                  <p className="text-sm opacity-90" style={{ color: PremiumTheme.colors.silver[400] }}>
                    AI Voice Assistant
                  </p>
                </div>
              </div>
              
              {/* Status Badge */}
              <Badge 
                variant="outline"
                className={cn(
                  "px-3 py-1 text-xs font-medium",
                  "bg-purple-500/20 text-purple-400 border-purple-500/30"
                )}
              >
                <Mic className="w-3 h-3 mr-1" />
                Voice Ready
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
