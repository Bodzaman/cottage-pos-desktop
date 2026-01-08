import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  PhoneCall, 
  PhoneOff, 
  Loader2 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { apiClient } from 'app';
import { cn } from '../utils/cn';
import { createWebRTCVoiceClient, VoiceCallStatus, isWebRTCSupported } from 'utils/webrtcVoiceClient';
import { toast } from 'sonner';

interface VoiceOrderingPanelProps {
  isVisible?: boolean;
  isLoading?: boolean;
  agentProfiles?: AgentProfile[];
  selectedAgent?: AgentProfile | null;
  agentName?: string;
  avatarUrl?: string;
  onOrderUpdate?: (items: any[]) => void;
  className?: string;
}

interface AIVoiceSettings {
  restaurant_id: string;
  enabled: boolean;
  selected_agent_id: string;
  avatar_url: string;
}

interface AgentProfile {
  id: string;
  name: string;
  description: string;
  voice_type: string;
  personality: string;
  avatar_url?: string;
  active: boolean;
}

export function VoiceOrderingPanel({ 
  isVisible = true,
  isLoading = false,
  agentProfiles = [],
  selectedAgent = null,
  agentName = 'AI Assistant',
  avatarUrl = '',
  onOrderUpdate,
  className = ''
}: VoiceOrderingPanelProps) {
  // Debug logging
  console.log('🔍 VoiceOrderingPanel render check:', {
    isVisible,
    timestamp: new Date().toISOString(),
    props: { 
      isVisible, 
      agentName,
      avatarUrl,
      selectedAgent: selectedAgent ? { id: selectedAgent.id, name: selectedAgent.name } : null,
      agentProfiles: agentProfiles.length,
      onOrderUpdate: !!onOrderUpdate, 
      className 
    }
  });

  // Voice connection states - using proper WebRTC pattern
  const [voiceCallStatus, setVoiceCallStatus] = useState<VoiceCallStatus>(VoiceCallStatus.IDLE);
  const [isVoiceTesting, setIsVoiceTesting] = useState(false);
  const [testingAgentId, setTestingAgentId] = useState<string | null>(null);
  const [voiceClient, setVoiceClient] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationItems, setConversationItems] = useState<string[]>([]);
  
  // Settings and agent states
  const [aiSettings, setAiSettings] = useState<AIVoiceSettings | null>(null);

  // WebRTC Voice Connection Functions (ported from AIVoiceAgentSettings)
  const startVoiceTest = async (agentProfileId: string, agentName: string) => {
    try {
      // Check WebRTC support
      if (!isWebRTCSupported()) {
        toast.error('WebRTC is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Safari.');
        return;
      }

      console.log(`🎙️ Starting WebRTC voice test with agent: ${agentName}`);
      toast.success(`🎙️ Connecting to ${agentName}... Please allow microphone access!`);
      
      setIsVoiceTesting(true);
      setTestingAgentId(agentProfileId);
      setVoiceCallStatus(VoiceCallStatus.CONNECTING);
      setError(null);
      setConversationItems([`Connecting to ${agentName}...`]);
      
      // Create WebRTC voice client
      const client = createWebRTCVoiceClient({
        agentId: agentProfileId,
        agentName: agentName,
        onStatusChange: (status) => {
          console.log(`🔄 Voice call status changed to: ${status}`);
          setVoiceCallStatus(status);
          
          // Update conversation items based on status
          if (status === VoiceCallStatus.CONNECTED) {
            setConversationItems(prev => [...prev, 
              `Connected to ${agentName}!`,
              'Start speaking to place your order...'
            ]);
          } else if (status === VoiceCallStatus.DISCONNECTED) {
            setConversationItems(prev => [...prev, 'Call ended. Thank you!']);
            // Auto cleanup after disconnect
            setTimeout(() => {
              setConversationItems([]);
              setIsVoiceTesting(false);
              setTestingAgentId(null);
              setVoiceCallStatus(VoiceCallStatus.IDLE);
            }, 3000);
          }
        },
        onError: (errorMessage) => {
          console.error('🚨 Voice call error:', errorMessage);
          setError(errorMessage);
          setVoiceCallStatus(VoiceCallStatus.FAILED);
          setConversationItems(prev => [...prev, `Error: ${errorMessage}`]);
        }
      });
      
      setVoiceClient(client);
      
      // Start the call
      await client.startCall();
      
    } catch (error: any) {
      console.error('❌ Error starting voice test:', error);
      setError(error.message || 'Failed to start voice call');
      setVoiceCallStatus(VoiceCallStatus.FAILED);
      setIsVoiceTesting(false);
      setTestingAgentId(null);
      toast.error(`Failed to connect: ${error.message}`);
    }
  };

  const stopVoiceTest = async () => {
    try {
      console.log('🔄 Ending WebRTC voice session...');
      
      // End the WebRTC voice call
      if (voiceClient) {
        await voiceClient.endCall();
        setVoiceClient(null);
      }
      
      setIsVoiceTesting(false);
      setTestingAgentId(null);
      setVoiceCallStatus(VoiceCallStatus.IDLE);
      setConversationItems([]);
      toast.info('✅ Voice test session ended');
      
    } catch (error) {
      console.error('Error stopping voice test:', error);
      // Still clean up state even if there's an error
      setIsVoiceTesting(false);
      setTestingAgentId(null);
      setVoiceCallStatus(VoiceCallStatus.IDLE);
      setVoiceClient(null);
      setConversationItems([]);
      toast.info('✅ Voice session ended');
    }
  };

  // Handle starting a voice call with proper WebRTC connection
  const startVoiceCall = async () => {
    const agentName = getAgentDisplayName();
    const agentId = getAgentId();
    
    await startVoiceTest(agentId, agentName);
  };
  
  // Handle ending the call
  const endVoiceCall = async () => {
    await stopVoiceTest();
  };
  
  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    // In a real implementation, you would mute/unmute the audio track
    if (voiceClient) {
      // voiceClient.toggleMute(!isMuted); // This would be implemented in the WebRTC client
    }
  };

  // Debug early return condition - moved after ALL hooks
  if (!isVisible) {
    console.log('🚫 VoiceOrderingPanel: Not visible, returning null', { isVisible });
    return null;
  }

  console.log('✅ VoiceOrderingPanel: Visible, proceeding to render', { isVisible });

  const getAgentDisplayName = () => {
    return agentName || 'AI Assistant';
  };

  const getAgentAvatar = () => {
    // Use avatar from AI settings first, then from agent card
    return avatarUrl || 
           selectedAgent?.avatar_url || 
           'https://images.unsplash.com/photo-1494790108755-2616b612b047?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80';
  };
  
  const getAgentId = () => {
    // Priority: use the actual UUID from selectedAgent over the hardcoded setting
    if (selectedAgent?.id) {
      return selectedAgent.id;
    }
    
    // Fallback to first available agent if none selected
    if (agentProfiles.length > 0) {
      return agentProfiles[0].id;
    }
    
    return 'no-agent-found';
  };
  
  // Show loading state while settings are loading
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-2xl p-6",
          className
        )}
        style={{
          background: 'rgba(26, 26, 26, 0.75)', // Same as UniversalHeader
          backdropFilter: 'blur(16px)', // Same as UniversalHeader
          border: '1px solid rgba(255, 255, 255, 0.1)', // Same as UniversalHeader
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)' // Enhanced shadow for depth
        }}
      >
        <div className="flex items-center justify-center h-32 relative z-10">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          <span className="ml-3 text-white" style={{
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
          }}>Loading AI Assistant...</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6",
        className
      )}
      style={{
        background: 'rgba(26, 26, 26, 0.75)', // Same as UniversalHeader
        backdropFilter: 'blur(16px)', // Same as UniversalHeader  
        border: '1px solid rgba(255, 255, 255, 0.1)', // Same as UniversalHeader
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)' // Enhanced shadow for depth
      }}
    >
      {/* Voice assistant header with dynamic agent */}
      <div className="flex items-center mb-6 relative z-10">
        <div className="relative">
          <motion.img
            src={getAgentAvatar()}
            alt={`${getAgentDisplayName()} - AI Assistant`}
            className="w-12 h-12 rounded-full object-cover"
            style={{
              border: '2px solid rgba(255, 255, 255, 0.3)', // Enhanced white border
              boxShadow: '0 0 16px rgba(255, 255, 255, 0.2), 0 4px 12px rgba(0, 0, 0, 0.3)', // Soft glow + drop shadow
              filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.1))'
            }}
            whileHover={{ 
              scale: 1.05,
              filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.2))',
              boxShadow: '0 0 20px rgba(255, 255, 255, 0.3), 0 4px 16px rgba(0, 0, 0, 0.4)'
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          />
          {isVisible && (
            <motion.div
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black/50 shadow-md"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            />
          )}
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-bold text-white" style={{
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)', // Enhanced shadow for glass-morphism
            fontWeight: 700 // Increased weight for better hierarchy
          }}>Hi, I'm {getAgentDisplayName()}</h3>
          <p className="text-sm text-white/90" style={{
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)' // Strong shadow for readability
          }}>
            {isVisible ? 'AI Voice Assistant - Ready to help' : 'AI Assistant - Currently offline'}
          </p>
        </div>
        <Badge 
          variant={isVisible ? "default" : "secondary"}
          className={cn(
            "px-3 py-1 text-xs font-medium backdrop-blur-sm",
            isVisible 
              ? "bg-green-500/30 text-green-300 border-green-400/40 shadow-md" 
              : "bg-gray-500/30 text-gray-300 border-gray-400/40 shadow-md"
          )}
          style={{
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
          }}
        >
          {isVisible ? 'Online' : 'Offline'}
        </Badge>
      </div>
      
      {/* Conversation Area */}
      <AnimatePresence>
        {conversationItems.length > 0 && (
          <motion.div 
            className="mb-6 p-4 rounded-lg max-h-32 overflow-y-auto bg-white/5 border border-white/10 backdrop-blur-sm shadow-lg relative z-10"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-2">
              {conversationItems.map((item, index) => (
                <motion.p 
                  key={index}
                  className="text-sm text-white/90"
                  style={{
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
                  }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {item}
                </motion.p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Error Message */}
      {error && (
        <motion.div 
          className="mb-6 p-3 rounded-lg bg-red-500/20 border border-red-400/30 text-red-300 backdrop-blur-sm shadow-lg relative z-10"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <p className="text-sm" style={{
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
          }}>{error}</p>
        </motion.div>
      )}
      
      {/* Quick Tips - shown when AI is enabled but not on a call */}
      {isVisible && voiceCallStatus === VoiceCallStatus.IDLE && (
        <motion.div 
          className="mb-6 p-4 rounded-lg bg-purple-500/15 border border-purple-400/25 backdrop-blur-sm shadow-lg relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h4 className="text-sm font-medium mb-2 text-purple-300" style={{
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
          }}>
            Try saying to {getAgentDisplayName()}:
          </h4>
          <div className="space-y-1">
            {[
              "I'd like chicken tikka masala, medium spice",
              "Add garlic naan and basmati rice",
              "What's your most popular dish?",
              "I have allergies to nuts, what do you recommend?"
            ].map((tip, index) => (
              <p 
                key={index}
                className="text-xs italic text-white/70"
                style={{
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                }}
              >
                "{tip}"
              </p>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* Disabled State Message */}
      {!isVisible && (
        <motion.div 
          className="mb-6 p-4 rounded-lg bg-gray-500/15 border border-gray-400/25 backdrop-blur-sm shadow-lg relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-sm text-white/70 text-center" style={{
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
          }}>
            {getAgentDisplayName()} is currently offline. Enable AI Voice Assistant in settings to start ordering by voice.
          </p>
        </motion.div>
      )}
      
      {/* Control Buttons */}
      <div className="flex gap-3">
        {(voiceCallStatus === VoiceCallStatus.IDLE || voiceCallStatus === VoiceCallStatus.FAILED) ? (
          <motion.div className="flex-1">
            <Button
              onClick={startVoiceCall}
              disabled={!isVisible || voiceCallStatus === VoiceCallStatus.CONNECTING}
              className={cn(
                "w-full gap-2 py-3 font-medium",
                isVisible
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              )}
            >
              {voiceCallStatus === VoiceCallStatus.CONNECTING ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PhoneCall className="h-4 w-4" />
              )}
              {voiceCallStatus === VoiceCallStatus.CONNECTING ? 'Connecting...' : `Call ${getAgentDisplayName()}`}
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Mute Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                size="icon"
                onClick={toggleMute}
                className={cn(
                  "border-gray-600",
                  isMuted 
                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" 
                    : "bg-gray-700 text-gray-300"
                )}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </motion.div>
            
            {/* End Call Button */}
            <motion.div 
              className="flex-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={endVoiceCall}
                className="w-full gap-2 py-3 bg-red-600 hover:bg-red-700 text-white"
              >
                <PhoneOff className="h-4 w-4" />
                End Call
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}
