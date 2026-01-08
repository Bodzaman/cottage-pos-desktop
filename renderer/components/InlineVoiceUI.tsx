import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { PremiumTheme } from '../utils/premiumTheme';
import { VoiceCallStatus } from '../utils/chat-store';

interface InlineVoiceUIProps {
  agentName: string;
  agentAvatar?: string;
  voiceCallStatus: VoiceCallStatus;
  onEndCall: () => void;
  onToggleMute?: () => void;
  isMuted?: boolean;
}

export function InlineVoiceUI({ 
  agentName, 
  agentAvatar, 
  voiceCallStatus,
  onEndCall,
  onToggleMute,
  isMuted = false
}: InlineVoiceUIProps) {
  const [callDuration, setCallDuration] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);

  // Call duration timer
  useEffect(() => {
    if (voiceCallStatus === VoiceCallStatus.CONNECTED) {
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCallDuration(0);
    }
  }, [voiceCallStatus]);

  // Breathing animation effect
  useEffect(() => {
    if (voiceCallStatus === VoiceCallStatus.CONNECTED) {
      const breathInterval = setInterval(() => {
        setIsBreathing(prev => !prev);
      }, 2000);
      return () => clearInterval(breathInterval);
    }
  }, [voiceCallStatus]);

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status text and color
  const getStatusInfo = () => {
    switch (voiceCallStatus) {
      case VoiceCallStatus.CONNECTING:
        return { text: 'Connecting...', color: PremiumTheme.colors.gold[500] };
      case VoiceCallStatus.CONNECTED:
        return { text: 'Connected', color: PremiumTheme.colors.emerald[500] };
      case VoiceCallStatus.SPEAKING:
        return { text: 'Speaking...', color: PremiumTheme.colors.emerald[400] };
      case VoiceCallStatus.DISCONNECTED:
        return { text: 'Disconnected', color: PremiumTheme.colors.dark[400] };
      default:
        return { text: 'Idle', color: PremiumTheme.colors.dark[400] };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div 
      className="flex flex-col items-center justify-center h-full py-12 px-6"
      style={{
        background: `linear-gradient(135deg, ${PremiumTheme.colors.dark[950]} 0%, ${PremiumTheme.colors.dark[900]} 100%)`
      }}
    >
      {/* Agent Avatar with Breathing Animation */}
      <motion.div
        className="relative mb-6"
        animate={{
          scale: isBreathing && voiceCallStatus === VoiceCallStatus.CONNECTED ? 1.05 : 1,
        }}
        transition={{ duration: 2, ease: 'easeInOut' }}
      >
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${statusInfo.color}40 0%, transparent 70%)`,
            filter: 'blur(20px)'
          }}
          animate={{
            scale: voiceCallStatus === VoiceCallStatus.CONNECTED ? [1, 1.2, 1] : 1,
            opacity: voiceCallStatus === VoiceCallStatus.CONNECTED ? [0.5, 0.8, 0.5] : 0.3
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Avatar */}
        <div 
          className="relative w-32 h-32 rounded-full border-4 overflow-hidden"
          style={{
            borderColor: statusInfo.color,
            boxShadow: `0 0 30px ${statusInfo.color}60`
          }}
        >
          {agentAvatar ? (
            <img 
              src={agentAvatar} 
              alt={agentName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center text-4xl font-bold"
              style={{ 
                background: `linear-gradient(135deg, ${PremiumTheme.colors.gold[600]} 0%, ${PremiumTheme.colors.gold[400]} 100%)`,
                color: PremiumTheme.colors.dark[950]
              }}
            >
              {agentName[0]}
            </div>
          )}
        </div>

        {/* Status indicator pulse */}
        {voiceCallStatus === VoiceCallStatus.CONNECTED && (
          <motion.div
            className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full"
            style={{ backgroundColor: statusInfo.color }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* Agent Name */}
      <h3 
        className="text-2xl font-bold mb-2"
        style={{ color: PremiumTheme.colors.gold[400] }}
      >
        {agentName}
      </h3>

      {/* Call Status */}
      <div className="flex items-center gap-2 mb-4">
        <div 
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: statusInfo.color }}
        />
        <span 
          className="text-sm font-medium"
          style={{ color: statusInfo.color }}
        >
          {statusInfo.text}
        </span>
      </div>

      {/* Call Duration */}
      {voiceCallStatus === VoiceCallStatus.CONNECTED && callDuration > 0 && (
        <div 
          className="text-3xl font-mono font-bold mb-8"
          style={{ color: PremiumTheme.colors.dark[300] }}
        >
          {formatDuration(callDuration)}
        </div>
      )}

      {/* Voice Controls */}
      <div className="flex items-center gap-4 mt-4">
        {/* Mute/Unmute Button */}
        {onToggleMute && voiceCallStatus === VoiceCallStatus.CONNECTED && (
          <Button
            onClick={onToggleMute}
            variant="outline"
            size="lg"
            className="rounded-full w-16 h-16"
            style={{
              backgroundColor: isMuted ? PremiumTheme.colors.burgundy[600] : PremiumTheme.colors.dark[800],
              borderColor: isMuted ? PremiumTheme.colors.burgundy[500] : PremiumTheme.colors.dark[600],
              color: isMuted ? PremiumTheme.colors.dark[100] : PremiumTheme.colors.dark[300]
            }}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>
        )}

        {/* End Call Button */}
        <Button
          onClick={onEndCall}
          size="lg"
          className="rounded-full w-16 h-16"
          style={{
            backgroundColor: PremiumTheme.colors.burgundy[600],
            borderColor: PremiumTheme.colors.burgundy[500],
            color: PremiumTheme.colors.dark[50]
          }}
        >
          <PhoneOff className="w-6 h-6" />
        </Button>
      </div>

      {/* Transcription placeholder (future enhancement) */}
      {voiceCallStatus === VoiceCallStatus.CONNECTED && (
        <div 
          className="mt-8 w-full max-w-md p-4 rounded-lg text-center"
          style={{
            backgroundColor: `${PremiumTheme.colors.dark[800]}80`,
            borderLeft: `3px solid ${PremiumTheme.colors.gold[500]}`
          }}
        >
          <p 
            className="text-sm italic"
            style={{ color: PremiumTheme.colors.dark[400] }}
          >
            Voice conversation in progress...
          </p>
        </div>
      )}
    </div>
  );
}

export default InlineVoiceUI;
