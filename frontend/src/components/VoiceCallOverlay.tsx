import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceCallOverlayProps {
  agentName: string;
  agentAvatar?: string;
  isAISpeaking: boolean;
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
  onHangUp
}: VoiceCallOverlayProps) {
  const [callDuration, setCallDuration] = useState(0);

  // Call duration timer - increments every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm transition-all duration-300">
      {/* Uncle Raj Avatar */}
      <div className="relative mb-6">
        {agentAvatar ? (
          <div className="relative">
            <img
              src={agentAvatar}
              alt={agentName}
              className={`h-32 w-32 rounded-full object-cover ring-4 transition-all duration-300 ${
                isAISpeaking
                  ? 'ring-orange-500 shadow-lg shadow-orange-500/50 animate-pulse'
                  : 'ring-border'
              }`}
            />
            {/* Pulse animation when AI speaking */}
            {isAISpeaking && (
              <div className="absolute inset-0 rounded-full border-4 border-orange-500 animate-ping opacity-75" />
            )}
          </div>
        ) : (
          <div
            className={`h-32 w-32 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-5xl font-bold ring-4 transition-all duration-300 ${
              isAISpeaking
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
        <h3 className="text-2xl font-semibold text-foreground flex items-center gap-2 justify-center">
          <Phone className="h-6 w-6 text-orange-500" />
          On Call with {agentName}
        </h3>
      </div>

      {/* Call Duration Timer */}
      <div className="text-4xl font-mono font-bold text-muted-foreground mb-6">
        {formatDuration(callDuration)}
      </div>

      {/* Waveform Visualization */}
      {isAISpeaking && (
        <div className="flex items-center gap-1 h-16 mb-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-2 bg-orange-500 rounded-full animate-waveform"
              style={{
                height: '100%',
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.6s'
              }}
            />
          ))}
        </div>
      )}

      {/* Hang Up Button */}
      <Button
        onClick={onHangUp}
        size="lg"
        className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-6 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
      >
        <PhoneOff className="h-6 w-6 mr-2" />
        Hang Up
      </Button>

      {/* Helper Text */}
      <p className="mt-6 text-sm text-muted-foreground">
        You can also type a message below during the call
      </p>
    </div>
  );
}

// Add custom animation for waveform in global styles or Tailwind config
// For now, using a simple CSS animation defined inline
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
