import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Phone, Shield, Mic, Clock, Sparkles, X } from 'lucide-react';
import { useChatStore } from 'utils/chat-store';
import { useAgentConfig } from 'utils/useAgentConfig';
import { useSimpleAuth } from 'utils/simple-auth-context';
import { PremiumTheme } from 'utils/premiumTheme';
import { useVoiceAudio } from 'utils/useVoiceAudio';

interface InlineTermsScreenProps {
  onAcceptTerms: () => void; // Callback when user accepts and clicks "CALL ASH"
  onCancel: () => void;      // Callback when user closes modal
}

export default function InlineTermsScreen({
  onAcceptTerms,
  onCancel
}: InlineTermsScreenProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [displayText, setDisplayText] = useState('');
  
  const { setShowVoiceTCScreen } = useChatStore();
  const { agentName, agentAvatar, isLoading: isLoadingConfig } = useAgentConfig();
  const { user } = useSimpleAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Typewriter animation text (now dynamic)
  const welcomeText = `Welcome! I'm ${agentName}, your AI waiter. I'll guide you through our menu, answer your questions, and take your order—add, change, or remove items anytime. Let's get started!`;

  // Typewriter effect for welcome message
  useEffect(() => {
    setIsTyping(true);
    setDisplayText('');
    setAgreedToTerms(false);
    setIsConnecting(false);
    setError(null);

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
  }, [welcomeText]);

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
      // Start dial tone when connecting
      audioRef.current.play().catch(error => {
        console.warn('Could not play dial tone:', error);
      });
      
      // Stop dial tone after 10 seconds max (safety)
      const timeout = setTimeout(() => {
        if (audioRef.current) {
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
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isConnecting]);

  const handleStartCall = async () => {
    if (!agreedToTerms) {
      setError('Please accept the terms and conditions to continue');
      return;
    }

    if (!user) {
      setError('Please log in to use voice ordering');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Stop dial tone
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      // Call parent callback to handle actual call initiation
      onAcceptTerms();
      
    } catch (err: any) {
      console.error('❌ Failed to start voice call:', err);
      setError(err.message || 'Failed to start voice call. Please try again.');
      setIsConnecting(false);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 50 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative rounded-3xl overflow-hidden max-w-2xl mx-auto my-4"
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
          onClick={handleCancel}
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
          {/* Header with Agent Image */}
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
              <img
                src={agentAvatar}
                alt={agentName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `
                    <div class="w-full h-full bg-gradient-to-br from-burgundy-700 to-burgundy-900 flex items-center justify-center">
                      <span class="text-4xl font-bold text-white">${agentName.charAt(0)}</span>
                    </div>
                  `;
                }}
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
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                className="mt-1 flex-shrink-0"
                style={{
                  borderColor: PremiumTheme.colors.burgundy[600],
                  backgroundColor: agreedToTerms ? PremiumTheme.colors.burgundy[600] : 'transparent'
                }}
              />
              <label 
                htmlFor="terms" 
                className="text-sm leading-relaxed cursor-pointer"
                style={{ color: PremiumTheme.colors.text.secondary }}
              >
                By continuing, I accept the Voice Ordering Terms and consent to recording for quality and training. Audio may vary; orders are confirmed before processing, and technical issues may require manual ordering.
              </label>
            </div>
          </div>
          
          {/* Call Button or Connection Status */}
          <div className="mt-8">
            {!isConnecting ? (
              <Button
                onClick={handleStartCall}
                disabled={!agreedToTerms || isTyping}
                className={`w-full py-6 rounded-2xl text-lg font-bold transition-all duration-300 flex items-center justify-center space-x-3 ${
                  agreedToTerms && !isTyping 
                    ? 'hover:scale-105 hover:shadow-2xl' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                style={{
                  background: agreedToTerms && !isTyping
                    ? `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[600]} 0%, ${PremiumTheme.colors.burgundy[500]} 100%)`
                    : `${PremiumTheme.colors.dark[700]}`,
                  color: PremiumTheme.colors.text.primary,
                  border: `2px solid ${agreedToTerms && !isTyping ? PremiumTheme.colors.burgundy[400] : PremiumTheme.colors.border.medium}`,
                  boxShadow: agreedToTerms && !isTyping
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
                  className="w-8 h-8 border-3 rounded-full"
                  style={{
                    border: `3px solid ${PremiumTheme.colors.burgundy[400]}`,
                    borderTopColor: 'transparent'
                  }}
                />
                
                <div className="text-center">
                  <p style={{ color: PremiumTheme.colors.platinum[200] }} className="font-bold">
                    🔊 Connecting to {agentName}...
                  </p>
                  <p style={{ color: PremiumTheme.colors.silver[400] }} className="text-sm mt-1">
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
                      className="w-1 h-6 rounded-full"
                      style={{ background: PremiumTheme.colors.burgundy[400] }}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Connection Error Display */}
            {error && (
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
                  ⚠️ {error}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={handleStartCall}
                    className="flex-1 py-2 text-sm"
                    style={{
                      background: `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[600]} 0%, ${PremiumTheme.colors.burgundy[500]} 100%)`,
                      border: `1px solid ${PremiumTheme.colors.burgundy[400]}`
                    }}
                  >
                    🔄 Try Again
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1 py-2 text-sm"
                    style={{
                      borderColor: PremiumTheme.colors.border.medium,
                      color: PremiumTheme.colors.text.secondary
                    }}
                  >
                    ✕ Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
