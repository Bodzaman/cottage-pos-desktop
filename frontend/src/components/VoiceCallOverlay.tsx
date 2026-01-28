import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerHaptic } from 'utils/haptics';
import { VoiceQualityIndicator, type VoiceQuality } from './VoiceQualityIndicator';

interface VoiceCallOverlayProps {
  agentName: string;
  agentAvatar?: string;
  isAISpeaking: boolean;
  connectionStatus: 'connecting' | 'connected' | 'reconnecting';
  connectionQuality?: VoiceQuality;
  /** Issue 13: Real-time audio level (0-1) for waveform visualization */
  audioLevel?: number;
  onHangUp: () => void;
}

/**
 * VoiceCallOverlay - Immersive phone call experience overlay
 *
 * Displays Uncle Raj avatar, call timer, waveform visualization,
 * and hang up button when voice call is active.
 */
export function VoiceCallOverlay({
  agentName,
  agentAvatar,
  isAISpeaking,
  connectionStatus,
  connectionQuality,
  audioLevel = 0,
  onHangUp
}: VoiceCallOverlayProps) {
  const [callDuration, setCallDuration] = useState(0);

  // Call duration timer - only runs when connected
  useEffect(() => {
    if (connectionStatus !== 'connected') return;

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [connectionStatus]);

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isConnecting = connectionStatus === 'connecting';
  const isReconnecting = connectionStatus === 'reconnecting';
  const isReady = connectionStatus === 'connected';

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm transition-all duration-300">
      {/* Quality indicator - top right */}
      {connectionQuality && isReady && (
        <div className="absolute top-4 right-4">
          <VoiceQualityIndicator quality={connectionQuality} />
        </div>
      )}

      {/* Agent Avatar */}
      <div className="relative mb-6">
        {agentAvatar ? (
          <div className="relative">
            <img
              src={agentAvatar}
              alt={agentName}
              className={`h-32 w-32 rounded-full object-cover ring-4 transition-all duration-300 ${
                isConnecting || isReconnecting
                  ? 'ring-orange-400/50 opacity-80'
                  : isAISpeaking
                    ? 'ring-orange-500 shadow-lg shadow-orange-500/50 animate-pulse'
                    : 'ring-border'
              }`}
            />
            {/* Pulse animation when AI speaking */}
            {isAISpeaking && isReady && (
              <div className="absolute inset-0 rounded-full border-4 border-orange-500 animate-ping opacity-75" />
            )}
            {/* Connecting spinner ring */}
            {(isConnecting || isReconnecting) && (
              <div className="absolute inset-0 rounded-full border-4 border-orange-400/40 border-t-orange-500 animate-spin" />
            )}
          </div>
        ) : (
          <div
            className={`h-32 w-32 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-5xl font-bold ring-4 transition-all duration-300 ${
              isConnecting || isReconnecting
                ? 'ring-orange-400/50 opacity-80'
                : isAISpeaking
                  ? 'ring-orange-500 shadow-lg shadow-orange-500/50 animate-pulse'
                  : 'ring-border'
            }`}
          >
            {agentName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Status Text */}
      <div className="text-center mb-2">
        {isConnecting ? (
          <h3 className="text-2xl font-semibold text-muted-foreground flex items-center gap-2 justify-center">
            <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />
            Connecting to {agentName}...
          </h3>
        ) : isReconnecting ? (
          <h3 className="text-2xl font-semibold text-yellow-400 flex items-center gap-2 justify-center">
            <Loader2 className="h-6 w-6 text-yellow-500 animate-spin" />
            Reconnecting...
          </h3>
        ) : isAISpeaking ? (
          <h3 className="text-2xl font-semibold text-foreground flex items-center gap-2 justify-center">
            <Phone className="h-6 w-6 text-orange-500" />
            {agentName} is speaking...
          </h3>
        ) : (
          <h3 className="text-2xl font-semibold text-foreground flex items-center gap-2 justify-center">
            <Phone className="h-6 w-6 text-green-500" />
            Connected — Start speaking
          </h3>
        )}
      </div>

      {/* Call Duration Timer */}
      <div className="text-4xl font-mono font-bold text-muted-foreground mb-6">
        {formatDuration(callDuration)}
      </div>

      {/* Waveform Visualization - Issue 13: Uses real audio level when available */}
      {isReady && (isAISpeaking || audioLevel > 0.05) && (
        <div className="flex items-end justify-center gap-1 h-16 mb-8">
          {[...Array(7)].map((_, i) => {
            // Create varied bar heights based on audio level + position
            const centerDistance = Math.abs(i - 3) / 3;
            const baseHeight = audioLevel > 0.05
              ? Math.max(0.15, audioLevel * (1 - centerDistance * 0.4))
              : 0.3; // Fallback to animation when no real data
            return (
              <div
                key={i}
                className={`w-1.5 bg-orange-500 rounded-full transition-all duration-75 ${
                  audioLevel <= 0.05 ? 'animate-waveform' : ''
                }`}
                style={{
                  height: audioLevel > 0.05
                    ? `${Math.max(8, baseHeight * 100)}%`
                    : '100%',
                  animationDelay: audioLevel <= 0.05 ? `${i * 0.08}s` : undefined,
                  animationDuration: audioLevel <= 0.05 ? '0.6s' : undefined,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Connecting dots animation */}
      {(isConnecting || isReconnecting) && (
        <div className="flex items-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-orange-500"
              style={{
                animation: 'pulse 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
                opacity: 0.4
              }}
            />
          ))}
        </div>
      )}

      {/* Hang Up Button - Touch optimized with haptic feedback */}
      <Button
        onClick={() => {
          triggerHaptic('heavy');
          onHangUp();
        }}
        onTouchStart={() => triggerHaptic('light')}
        size="lg"
        className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-6 rounded-full shadow-lg transition-all duration-200 hover:scale-105 min-h-[56px] min-w-[120px] touch-manipulation active:scale-95"
      >
        <PhoneOff className="h-6 w-6 mr-2" />
        Hang Up
      </Button>

      {/* Helper Text */}
      <p className="mt-6 text-sm text-muted-foreground">
        {isConnecting
          ? 'Setting up your voice session...'
          : 'You can also type a message below during the call'
        }
      </p>
    </div>
  );
}

// Add custom animation for waveform in global styles or Tailwind config
const style = document.createElement('style');
style.textContent = `
  @keyframes waveform {
    0%, 100% { transform: scaleY(0.3); }
    50% { transform: scaleY(1); }
  }
  .animate-waveform {
    animation: waveform 0.6s ease-in-out infinite;
  }
`;
if (typeof document !== 'undefined' && !document.querySelector('#waveform-animation')) {
  style.id = 'waveform-animation';
  document.head.appendChild(style);
}
