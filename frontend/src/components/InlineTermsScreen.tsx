import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Phone, Sparkles, X } from 'lucide-react';
import { useChatStore } from 'utils/chat-store';
import { useAgentConfig } from 'utils/useAgentConfig';
import { useSimpleAuth } from 'utils/simple-auth-context';
import { PremiumTheme } from 'utils/premiumTheme';

interface InlineTermsScreenProps {
  onAcceptTerms: () => void;
  onCancel: () => void;
}

export default function InlineTermsScreen({
  onAcceptTerms,
  onCancel
}: InlineTermsScreenProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setShowVoiceTCScreen = useChatStore((state) => state.setShowVoiceTCScreen);
  const { agentName, agentAvatar, isLoading: isLoadingConfig } = useAgentConfig();
  const { user } = useSimpleAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create and manage dial tone audio
  useEffect(() => {
    audioRef.current = new Audio('https://static.databutton.com/public/88a315b0-faa2-491d-9215-cf1e283cdee2/Phone Dial Tone.MP3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Control dial tone playback based on connection state
  useEffect(() => {
    if (isConnecting && audioRef.current) {
      audioRef.current.play().catch(() => {});

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
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isConnecting]);

  const handleStartCall = async () => {
    if (!user) {
      setError('Please log in to use voice ordering');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      onAcceptTerms();

    } catch (err: any) {
      console.error('Failed to start voice call:', err);
      setError(err.message || 'Failed to start voice call. Please try again.');
      setIsConnecting(false);
    }
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
          onClick={onCancel}
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

        {/* Main content - streamlined */}
        <div className="p-5 sm:p-8 space-y-6">
          {/* Header with Agent Image */}
          <div className="text-center space-y-4">
            {/* Agent Image */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{
                scale: 1,
                rotate: 0,
                y: [0, -5, 0]
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

            {/* Heading + Subtitle */}
            <div className="space-y-2">
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

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="text-base"
                style={{ color: PremiumTheme.colors.text.secondary }}
              >
                Your AI waiter is ready to take your order
              </motion.p>
            </div>
          </div>

          {/* Call Button or Connection Status */}
          <div>
            {!isConnecting ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <Button
                  onClick={handleStartCall}
                  className="w-full py-6 rounded-2xl text-lg font-bold transition-all duration-300 flex items-center justify-center space-x-3 hover:scale-105 hover:shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[600]} 0%, ${PremiumTheme.colors.burgundy[500]} 100%)`,
                    color: PremiumTheme.colors.text.primary,
                    border: `2px solid ${PremiumTheme.colors.burgundy[400]}`,
                    boxShadow: `0 10px 30px rgba(139, 21, 56, 0.4), inset 0 1px 0 ${PremiumTheme.colors.platinum[400]}20`
                  }}
                >
                  <Phone className="w-6 h-6" />
                  <span>CALL {agentName.toUpperCase()}</span>
                  <Sparkles className="w-5 h-5" />
                </Button>
              </motion.div>
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
                    Connecting to {agentName}...
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
                  {error}
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
                    Try Again
                  </Button>
                  <Button
                    onClick={onCancel}
                    variant="outline"
                    className="flex-1 py-2 text-sm"
                    style={{
                      borderColor: PremiumTheme.colors.border.medium,
                      color: PremiumTheme.colors.text.secondary
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Inline T&C disclaimer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="text-xs text-center leading-relaxed px-4"
            style={{ color: PremiumTheme.colors.text.muted }}
          >
            By calling, you accept the Voice Ordering Terms and consent to recording for quality and training. Audio may vary; orders are confirmed before processing.
          </motion.p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
