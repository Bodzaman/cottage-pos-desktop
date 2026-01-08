import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Phone, Sparkles, Shield, Clock, Mic } from 'lucide-react';
import { useVoiceAgentStore } from 'utils/voiceAgentStore';
import { PremiumTheme } from 'utils/premiumTheme';
import { toast } from 'sonner';
import { WebRTCVoiceClient, VoiceCallStatus, createWebRTCVoiceClient } from 'utils/webrtcVoiceClient';
import { apiClient } from 'app';
import { OptimizedImage } from 'components/OptimizedImage';

interface VoiceOrderGlassOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCall: () => void;
  onConnectionSuccess?: (ultravoxCallId?: string) => void; // NEW: Callback for successful WebRTC connection
}

// Add agent profile interface
interface AgentProfile {
  id: string;
  name: string;
  description?: string;
  personality?: string;
  image?: string;
  ultravox_agent_id?: string;
}

const VoiceOrderGlassOverlay: React.FC<VoiceOrderGlassOverlayProps> = ({ 
  isOpen, 
  onClose, 
  onStartCall, 
  onConnectionSuccess 
}) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [displayText, setDisplayText] = useState('');
  
  // ✅ NEW: Load dial tone from database
  const { dialToneUrl } = useVoiceAudio();
  
  // NEW: WebRTC connection state
  const [voiceClient, setVoiceClient] = useState<WebRTCVoiceClient | null>(null);
  const [voiceCallStatus, setVoiceCallStatus] = useState<VoiceCallStatus>(VoiceCallStatus.IDLE);
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);
  
  const { getSelectedAgentPassportImage, getSelectedAgentName, setSelectedAgent: setStoreAgent } = useVoiceAgentStore();
  const agentImage = getSelectedAgentPassportImage();
  const agentName = getSelectedAgentName();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Auto-select Ash agent on mount (extracted from VoiceOrderingModal)
  useEffect(() => {
    const loadAndSelectAshAgent = async () => {
      try {
        const response = await apiClient.get_agent_profiles_endpoint();
        const data = await response.json();
        
        if (data.success && data.agents) {
          // Find Ash agent by ID
          const ashAgent = data.agents.find((agent: any) => agent.id === '0b1e729a-a106-4e38-a711-cc47e2ad4f75');
          if (ashAgent) {
            console.log('🎤 Auto-selecting Ash agent for voice sessions:', ashAgent.name);
            setSelectedAgent(ashAgent);
            setStoreAgent(ashAgent);
          } else {
            console.warn('⚠️ Ash agent not found, using first available agent');
            if (data.agents.length > 0) {
              setSelectedAgent(data.agents[0]);
              setStoreAgent(data.agents[0]);
            }
          }
        }
      } catch (error) {
        console.error('❌ Failed to load agents:', error);
      }
    };

    if (isOpen) {
      loadAndSelectAshAgent();
    }
  }, [isOpen, setStoreAgent]);
  
  // Typewriter animation text
  const welcomeText = "Welcome! I'm Ash, your AI waiter. I'll guide you through our menu, answer your questions, and take your order—add, change, or remove items anytime. Let's get started!";
  
  // Typewriter effect for welcome message
  useEffect(() => {
    if (isOpen) {
      setIsTyping(true);
      setDisplayText('');
      setTermsAccepted(false);
      setIsConnecting(false);
      setConnectionError(null);

      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < welcomeText.length) {
          setDisplayText(welcomeText.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsTyping(false);
          clearInterval(interval);
        }
      }, 30); // Typing speed

      return () => clearInterval(interval);
    }
  }, [isOpen, welcomeText]);
  
  // Create and manage dial tone audio
  useEffect(() => {
    // Create audio element for dial tone
    audioRef.current = new Audio('https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/Phone Dial Tone.MP3');
    audioRef.current.loop = true; // Loop the dial tone
    audioRef.current.volume = 0.3; // Set comfortable volume
    
    return () => {
      // Cleanup audio on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  // Control dial tone playback based on connection state
  useEffect(() => {
    if (isConnecting && audioRef.current) {
      // Start dial tone when connecting (regardless of voice call status)
      console.log('🔊 Starting dial tone during connection...');
      audioRef.current.play().catch(error => {
        console.warn('Could not play dial tone:', error);
      });
      
      // Stop dial tone after 10 seconds max (safety)
      const timeout = setTimeout(() => {
        if (audioRef.current) {
          console.log('🔇 Safety timeout - stopping dial tone');
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }, 10000);
      
      return () => {
        clearTimeout(timeout);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      };
    } else if (!isConnecting && audioRef.current) {
      // Stop dial tone when not connecting
      console.log('🔇 Connection finished - stopping dial tone');
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isConnecting]);

  // Additional effect to stop dial tone when connected
  useEffect(() => {
    if (voiceCallStatus === VoiceCallStatus.CONNECTED && audioRef.current) {
      console.log('🔇 Voice connected - stopping dial tone immediately');
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [voiceCallStatus]);

  // NEW: WebRTC Voice Session Logic (extracted from VoiceOrderingModal)
  const startVoiceSession = async () => {
    if (!selectedAgent?.id) {
      toast.error('Please wait while we load the voice agent');
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      console.log('🎤 Starting voice session with agent:', selectedAgent.id);
      console.log('🎤 Agent details:', selectedAgent);
      
      // Step 1: Initialize WebRTC voice client
      const webrtcConfig = {
        agentId: selectedAgent.id,
        agentName: selectedAgent.name || 'AI Assistant',
        onStatusChange: (status: VoiceCallStatus) => {
          console.log('🔄 Voice call status changed:', status);
          setVoiceCallStatus(status);
          
          if (status === VoiceCallStatus.CONNECTED) {
            // Stop dial tone when successfully connected
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }
            
            toast.success(`🎙️ Connected to ${selectedAgent.name}! Start speaking...`);
            
            // Get the Ultravox call_id from the WebRTC client and pass it to the success callback
            const ultravoxCallId = client.getCallId();
            console.log('🔗 Captured Ultravox call_id from WebRTC client:', ultravoxCallId);
            
            // Call success callback to transition to voice modal
            if (onConnectionSuccess) {
              setTimeout(() => {
                onConnectionSuccess(ultravoxCallId); // ✅ Pass the call_id for session correlation
                onClose(); // Close glass overlay
              }, 500);
            } else {
              // Fallback to original flow
              onStartCall();
              setTimeout(() => onClose(), 800);
            }
          } else if (status === VoiceCallStatus.FAILED) {
            setConnectionError('Connection failed. Please try again.');
            setIsConnecting(false);
          }
        },
        onError: (error: string) => {
          console.error('❌ WebRTC Voice Client error:', error);
          setConnectionError(error);
          toast.error(`Voice connection error: ${error}`);
          setIsConnecting(false);
        }
      };
      
      console.log('🎤 Creating WebRTC voice client with config:', webrtcConfig);
      const client = createWebRTCVoiceClient(webrtcConfig);
      setVoiceClient(client);
      
      // Step 2: Start the actual WebRTC call
      console.log('🎤 Starting WebRTC call...');
      await client.startCall();
      
      console.log('✅ WebRTC voice session initiated successfully');
      
    } catch (error) {
      console.error('❌ Failed to start voice session:', error);
      toast.error('Failed to start voice session');
      setConnectionError('Failed to start voice session');
      setIsConnecting(false);
      
      // Stop dial tone on error
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  };

  // Enhanced start call with WebRTC connection
  const handleStartCallWithWebRTC = async () => {
    if (!termsAccepted) {
      toast.error('Please accept the Terms & Conditions to continue');
      return;
    }
    
    if (!selectedAgent?.id) {
      toast.error('Voice agent not available. Please wait and try again.');
      return;
    }
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // Check microphone permissions first
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (micError) {
          console.warn('Microphone permission denied:', micError);
          setConnectionError('Microphone access required. Please allow microphone permissions and try again.');
          setIsConnecting(false);
          return;
        }
      }
      
      // 📞 Add realistic phone call delay - dial tone plays for 3 seconds
      console.log('📞 Simulating phone dialing experience...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Start actual WebRTC connection after dial tone period
      console.log('📞 Dial period complete - establishing voice connection...');
      await startVoiceSession();
      
    } catch (error) {
      console.error('Connection failed:', error);
      setConnectionError('Unable to establish connection. Please check your internet and try again.');
      setIsConnecting(false);
      
      // Stop dial tone on error
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  };

  // Handle connection timeout (15 seconds safety)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isConnecting) {
      timeoutId = setTimeout(() => {
        setConnectionError('Connection timeout. Please check your internet connection and try again.');
        setIsConnecting(false);
        
        // Stop dial tone on timeout
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }, 15000); // 15 second timeout
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isConnecting]);

  // Handle microphone permission errors
  const handleMicrophoneError = () => {
    setConnectionError('Microphone access required. Please allow microphone permissions and try again.');
    setIsConnecting(false);
    
    // Stop dial tone
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl p-0 border-0 bg-transparent overflow-hidden"
        style={{
          background: 'transparent',
          boxShadow: 'none'
        }}
      >
        <DialogTitle className="sr-only">
          Voice Ordering with {agentName}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Start a voice conversation with our AI assistant to place your order. Accept terms and conditions to begin.
        </DialogDescription>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative rounded-3xl overflow-hidden"
              style={{
                background: `linear-gradient(135deg, 
                  ${PremiumTheme.colors.dark[900]}95 0%, 
                  ${PremiumTheme.colors.charcoal[800]}90 50%, 
                  ${PremiumTheme.colors.dark[850]}95 100%)`,
                backdropFilter: 'blur(20px)',
                border: `2px solid ${PremiumTheme.colors.burgundy[600]}40`,
                boxShadow: `
                  0 25px 50px -12px rgba(0, 0, 0, 0.8),
                  0 0 0 1px ${PremiumTheme.colors.burgundy[700]}20,
                  inset 0 1px 0 ${PremiumTheme.colors.platinum[400]}10
                `
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 z-10 p-2 rounded-full transition-all duration-200"
                style={{
                  background: `${PremiumTheme.colors.dark[700]}80`,
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${PremiumTheme.colors.border.light}`,
                  color: PremiumTheme.colors.text.muted
                }}
              >
                <X className="w-5 h-5" />
              </button>
              
              {/* Main content */}
              <div className="p-8 space-y-8">
                {/* Header with Ash Image */}
                <div className="text-center space-y-6">
                  {/* Agent Image with Enhanced Animation */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ 
                      scale: 1, 
                      rotate: 0,
                      y: [0, -5, 0] // Breathing animation
                    }}
                    transition={{ 
                      scale: { duration: 0.6, ease: "easeOut" },
                      rotate: { duration: 0.8, ease: "easeOut" },
                      y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="relative mx-auto w-32 h-40 rounded-2xl overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[800]} 0%, ${PremiumTheme.colors.burgundy[600]} 100%)`,
                      border: `3px solid ${PremiumTheme.colors.platinum[400]}40`,
                      boxShadow: `
                        0 20px 40px rgba(139, 21, 56, 0.3),
                        0 0 0 1px ${PremiumTheme.colors.burgundy[600]}60,
                        inset 0 1px 0 ${PremiumTheme.colors.platinum[300]}20
                      `
                    }}
                  >
                    <OptimizedImage
                      fallbackUrl={agentImage}
                      variant="thumbnail"
                      alt={agentName}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* AI Badge */}
                    <div 
                      className="absolute bottom-2 right-2 px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1"
                      style={{
                        background: `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[600]} 0%, ${PremiumTheme.colors.burgundy[500]} 100%)`,
                        color: PremiumTheme.colors.text.primary,
                        boxShadow: `0 4px 8px rgba(139, 21, 56, 0.4)`
                      }}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>AI</span>
                    </div>
                  </motion.div>
                  
                  {/* Welcome Text with Typewriter Effect */}
                  <div className="space-y-4">
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="text-3xl font-bold"
                      style={{
                        background: `linear-gradient(135deg, ${PremiumTheme.colors.silver[400]} 0%, ${PremiumTheme.colors.platinum[500]} 100%)`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      Voice Ordering Ready
                    </motion.h2>
                    
                    {/* Speech Bubble with Typewriter */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5, duration: 0.4 }}
                      className="relative mx-auto max-w-lg p-6 rounded-2xl"
                      style={{
                        background: `linear-gradient(135deg, ${PremiumTheme.colors.dark[800]} 0%, ${PremiumTheme.colors.dark[700]} 100%)`,
                        border: `1px solid ${PremiumTheme.colors.burgundy[600]}30`,
                        boxShadow: `0 8px 25px rgba(0, 0, 0, 0.4)`
                      }}
                    >
                      {/* Speech bubble pointer */}
                      <div 
                        className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 rotate-45"
                        style={{ background: PremiumTheme.colors.dark[800] }}
                      />
                      
                      <p 
                        className="text-lg leading-relaxed relative z-10"
                        style={{ color: PremiumTheme.colors.text.primary }}
                      >
                        {displayText}
                        {isTyping && (
                          <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="ml-1"
                            style={{ color: PremiumTheme.colors.burgundy[400] }}
                          >
                            |
                          </motion.span>
                        )}
                      </p>
                    </motion.div>
                  </div>
                </div>
                
                {/* Features Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="grid grid-cols-3 gap-4"
                >
                  {[
                    { icon: Clock, text: "Under 5 minutes", color: PremiumTheme.colors.burgundy[500] },
                    { icon: Shield, text: "Secure & Private", color: PremiumTheme.colors.burgundy[500] },
                    { icon: Mic, text: "Clear Audio", color: PremiumTheme.colors.burgundy[500] }
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="text-center p-4 rounded-xl"
                      style={{
                        background: `${PremiumTheme.colors.dark[800]}60`,
                        border: `1px solid ${PremiumTheme.colors.border.light}`
                      }}
                    >
                      <feature.icon 
                        className="w-6 h-6 mx-auto mb-2" 
                        style={{ color: feature.color }}
                      />
                      <p 
                        className="text-sm font-medium"
                        style={{ color: PremiumTheme.colors.text.primary }}
                      >
                        {feature.text}
                      </p>
                    </div>
                  ))}
                </motion.div>
                
                {/* Terms and Conditions */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 rounded-2xl" style={{
                    background: `${PremiumTheme.colors.dark[800]}60`,
                    border: `1px solid ${PremiumTheme.colors.border.light}`,
                    backdropFilter: 'blur(8px)'
                  }}>
                    <Checkbox
                      id="terms"
                      checked={termsAccepted}
                      onCheckedChange={setTermsAccepted}
                      className="mt-1 flex-shrink-0"
                      style={{
                        borderColor: PremiumTheme.colors.burgundy[600],
                        backgroundColor: termsAccepted ? PremiumTheme.colors.burgundy[600] : 'transparent'
                      }}
                    />
                    <label 
                      htmlFor="terms" 
                      className="text-sm leading-relaxed cursor-pointer"
                      style={{ color: PremiumTheme.colors.text.secondary }}
                    >
                      By continuing, I accept the Voice Ordering Terms and consent to recording for quality and training. Audio may vary; orders are confirmed before processing, and technical issues may require manual ordering.{' '}
                      <span className="inline-flex items-center space-x-2 mt-2">
                        <button 
                          type="button"
                          className="underline hover:no-underline transition-all duration-200"
                          style={{ color: PremiumTheme.colors.burgundy[400] }}
                          onClick={() => toast.info('Terms & Conditions page coming soon')}
                        >
                          [Terms]
                        </button>
                        <span style={{ color: PremiumTheme.colors.text.muted }}>•</span>
                        <button 
                          type="button"
                          className="underline hover:no-underline transition-all duration-200"
                          style={{ color: PremiumTheme.colors.burgundy[400] }}
                          onClick={() => toast.info('Privacy Policy page coming soon')}
                        >
                          [Privacy Policy]
                        </button>
                      </span>
                    </label>
                  </div>
                </div>
                
                {/* Call Button or Connection Status */}
                <div className="mt-8">
                  {!isConnecting ? (
                    <Button
                      onClick={handleStartCallWithWebRTC}
                      disabled={!termsAccepted || isTyping}
                      className={`w-full py-6 rounded-2xl text-lg font-bold transition-all duration-300 flex items-center justify-center space-x-3 ${
                        termsAccepted && !isTyping 
                          ? 'hover:scale-105 hover:shadow-2xl' 
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                      style={{
                        background: termsAccepted && !isTyping
                          ? `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[600]} 0%, ${PremiumTheme.colors.burgundy[500]} 100%)`
                          : `${PremiumTheme.colors.dark[700]}`,
                        color: PremiumTheme.colors.text.primary,
                        border: `2px solid ${termsAccepted && !isTyping ? PremiumTheme.colors.burgundy[400] : PremiumTheme.colors.border.medium}`,
                        boxShadow: termsAccepted && !isTyping
                          ? `0 10px 30px rgba(139, 21, 56, 0.4), inset 0 1px 0 ${PremiumTheme.colors.platinum[400]}20`
                          : 'none'
                      }}
                    >
                      <Phone className="w-6 h-6" />
                      <span>📞 CALL {agentName.toUpperCase()}</span>
                      <Sparkles className="w-5 h-5" />
                    </Button>
                  ) : (
                    /* Connection Status Display */
                    <div className="w-full py-6 rounded-2xl text-lg font-bold flex flex-col items-center justify-center space-y-4"
                         style={{
                           background: `linear-gradient(135deg, ${PremiumTheme.colors.dark[800]} 0%, ${PremiumTheme.colors.dark[700]} 100%)`,
                           border: `2px solid ${PremiumTheme.colors.burgundy[400]}`,
                           boxShadow: `0 10px 30px rgba(139, 21, 56, 0.2), inset 0 1px 0 ${PremiumTheme.colors.platinum[400]}20`
                         }}>
                      
                      {/* Connecting Animation */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-3 border-burgundy-400 border-t-transparent rounded-full"
                      />
                      
                      <div className="text-center">
                        <p className="text-platinum-200 font-bold">
                          🔊 Connecting to {agentName}...
                        </p>
                        <p className="text-silver-400 text-sm mt-1">
                          Please wait while we establish connection
                        </p>
                      </div>
                      
                      {/* Audio Wave Animation */}
                      <div className="flex space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{
                              scaleY: [1, 2, 1],
                              opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: i * 0.1
                            }}
                            className="w-1 h-6 bg-burgundy-400 rounded-full"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Connection Error Display */}
                  {connectionError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 rounded-lg"
                      style={{
                        background: `linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)`,
                        border: `1px solid rgba(239, 68, 68, 0.3)`
                      }}
                    >
                      <p className="text-red-400 text-sm text-center font-medium">
                        ⚠️ {connectionError}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button
                          onClick={handleStartCallWithWebRTC}
                          className="flex-1 py-2 text-sm"
                          style={{
                            background: `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[600]} 0%, ${PremiumTheme.colors.burgundy[500]} 100%)`,
                            border: `1px solid ${PremiumTheme.colors.burgundy[400]}`
                          }}
                        >
                          🔄 Try Again
                        </Button>
                        <Button
                          onClick={onClose}
                          variant="outline"
                          className="flex-1 py-2 text-sm"
                          style={{
                            borderColor: PremiumTheme.colors.border.medium,
                            color: PremiumTheme.colors.text.secondary
                          }}
                        >
                          📱 Regular Menu
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceOrderGlassOverlay;
