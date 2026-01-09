import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mic, Volume2, Phone, Sparkles, Radio } from 'lucide-react';
import { colors } from 'utils/designSystem';
import { VOICE_SAMPLE_SCRIPTS } from 'utils/previewSampleData';

interface VoicePreviewProps {
  agentName?: string;
  firstResponse?: string;
  voiceModel?: string;
  systemPrompt?: string;
  isEmpty?: boolean;
}

interface VoiceModelInfo {
  value: string;
  label: string;
  description: string;
  personality: string;
  accent?: string;
}

const VOICE_MODEL_DETAILS: Record<string, VoiceModelInfo> = {
  'Puck': { value: 'Puck', label: 'Puck', description: 'Friendly and conversational', personality: 'Warm & Approachable', accent: 'Neutral' },
  'Charon': { value: 'Charon', label: 'Charon', description: 'Deep and authoritative', personality: 'Professional & Confident', accent: 'Deep tone' },
  'Kore': { value: 'Kore', label: 'Kore', description: 'Neutral and professional', personality: 'Balanced & Clear', accent: 'Neutral' },
  'Fenrir': { value: 'Fenrir', label: 'Fenrir', description: 'Excitable and energetic', personality: 'Enthusiastic & Dynamic', accent: 'Upbeat' },
  'Aoede': { value: 'Aoede', label: 'Aoede', description: 'Breezy and light', personality: 'Casual & Friendly', accent: 'Light tone' },
  'Zephyr': { value: 'Zephyr', label: 'Zephyr', description: 'Bright and cheerful', personality: 'Positive & Engaging', accent: 'Bright' },
  'Leda': { value: 'Leda', label: 'Leda', description: 'Youthful and fresh', personality: 'Fresh & Modern', accent: 'Young' },
  'Orus': { value: 'Orus', label: 'Orus', description: 'Firm and steady', personality: 'Stable & Reliable', accent: 'Steady' },
};

/**
 * Interactive voice preview component
 * Simulates voice conversation with waveform visualization
 */
export const VoicePreview: React.FC<VoicePreviewProps> = ({
  agentName = 'AI Assistant',
  firstResponse,
  voiceModel = 'Puck',
  systemPrompt,
  isEmpty = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentScript, setCurrentScript] = useState(0);
  const [waveformActive, setWaveformActive] = useState(false);
  const voiceInfo = VOICE_MODEL_DETAILS[voiceModel] || VOICE_MODEL_DETAILS['Puck'];

  // Simulate waveform animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      setWaveformActive(true);
      interval = setInterval(() => {
        setWaveformActive(prev => !prev);
      }, 500);
    } else {
      setWaveformActive(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Auto-play simulation
  const playScript = async () => {
    setIsPlaying(true);
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate 3 second playback
    setIsPlaying(false);
  };

  if (isEmpty) {
    return (
      <div className="text-center p-6 space-y-3" style={{ color: colors.text.tertiary }}>
        <Mic className="h-12 w-12 mx-auto opacity-30" />
        <p className="text-sm">Configure your voice assistant to see a preview</p>
      </div>
    );
  }

  const selectedScript = VOICE_SAMPLE_SCRIPTS[currentScript];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className="animate-pulse"
            style={{ 
              borderColor: colors.accent.turquoise, 
              color: colors.accent.turquoise,
              backgroundColor: 'rgba(14, 186, 177, 0.1)'
            }}
          >
            <Radio className="h-3 w-3 mr-1" />
            Voice Preview
          </Badge>
          {systemPrompt && (
            <Badge variant="outline" style={{ borderColor: colors.accent.turquoise, color: colors.accent.turquoise }}>
              ✓ Configured
            </Badge>
          )}
        </div>
      </div>

      {/* Voice Waveform Visualization */}
      <div 
        className="rounded-lg p-6 space-y-4"
        style={{ 
          backgroundColor: colors.background.tertiary,
          border: `1px solid ${colors.border.medium}`
        }}
      >
        <div className="flex items-center justify-center gap-1 h-24">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="transition-all duration-300"
              style={{
                width: '4px',
                backgroundColor: waveformActive && isPlaying
                  ? colors.accent.turquoise
                  : colors.border.medium,
                height: waveformActive && isPlaying
                  ? `${Math.random() * 60 + 20}px`
                  : '20px',
                borderRadius: '2px',
                opacity: waveformActive && isPlaying ? 0.8 : 0.3,
              }}
            />
          ))}
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={playScript}
            disabled={isPlaying}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            size="sm"
          >
            {isPlaying ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                Playing...
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 mr-2" />
                Play Sample
              </>
            )}
          </Button>
          {isPlaying && (
            <span className="text-xs animate-pulse" style={{ color: colors.accent.turquoise }}>
              ● LIVE
            </span>
          )}
        </div>
      </div>

      {/* First Response Display */}
      {firstResponse && (
        <div 
          className="rounded-lg p-4 space-y-2"
          style={{ 
            backgroundColor: colors.background.tertiary,
            borderLeft: `4px solid ${colors.accent.turquoise}`
          }}
        >
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" style={{ color: colors.accent.turquoise }} />
            <p className="text-xs font-semibold" style={{ color: colors.text.secondary }}>
              Opening Message
            </p>
          </div>
          <p className="text-sm italic leading-relaxed" style={{ color: colors.text.primary }}>
            "{firstResponse}"
          </p>
          <p className="text-xs" style={{ color: colors.text.tertiary }}>
            This is what customers hear when they first connect
          </p>
        </div>
      )}

      {/* Voice Characteristics */}
      <div 
        className="rounded-lg p-4 space-y-3"
        style={{ backgroundColor: colors.background.tertiary }}
      >
        <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>
          Voice Characteristics
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs" style={{ color: colors.text.tertiary }}>Voice Model</p>
            <p className="text-sm font-mono" style={{ color: colors.accent.turquoise }}>
              {voiceInfo.label}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs" style={{ color: colors.text.tertiary }}>Personality</p>
            <p className="text-sm" style={{ color: colors.text.primary }}>
              {voiceInfo.personality}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs" style={{ color: colors.text.tertiary }}>Style</p>
            <p className="text-sm" style={{ color: colors.text.primary }}>
              {voiceInfo.description}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs" style={{ color: colors.text.tertiary }}>Tone</p>
            <p className="text-sm" style={{ color: colors.text.primary }}>
              {voiceInfo.accent}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Badge 
            variant="outline" 
            className="text-xs"
            style={{ borderColor: colors.border.purple, color: colors.text.secondary }}
          >
            Gemini Live API
          </Badge>
          <Badge 
            variant="outline" 
            className="text-xs"
            style={{ borderColor: colors.border.turquoise, color: colors.accent.turquoise }}
          >
            Real-time Voice
          </Badge>
        </div>
      </div>

      {/* Sample Conversation Script */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>
            Sample Conversation
          </p>
          <div className="flex gap-1">
            {VOICE_SAMPLE_SCRIPTS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentScript(idx)}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: currentScript === idx 
                    ? colors.accent.turquoise 
                    : colors.border.medium
                }}
                aria-label={`View script ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        <div 
          className="rounded-lg p-4 space-y-3"
          style={{ backgroundColor: colors.background.tertiary }}
        >
          <p className="text-xs font-medium" style={{ color: colors.text.secondary }}>
            Scenario: {selectedScript.scenario}
          </p>
          
          <div className="space-y-2">
            {selectedScript.script.map((line, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg ${
                  line.speaker === 'Agent' ? 'border-l-3' : ''
                }`}
                style={{
                  backgroundColor: line.speaker === 'Agent' 
                    ? colors.background.primary
                    : colors.background.secondary,
                  borderLeft: line.speaker === 'Agent' 
                    ? `3px solid ${colors.accent.turquoise}` 
                    : 'none'
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  {line.speaker === 'Agent' ? (
                    <Mic className="h-3 w-3" style={{ color: colors.accent.turquoise }} />
                  ) : (
                    <Phone className="h-3 w-3" style={{ color: colors.text.tertiary }} />
                  )}
                  <span className="text-xs font-semibold" style={{ 
                    color: line.speaker === 'Agent' ? colors.accent.turquoise : colors.text.tertiary 
                  }}>
                    {line.speaker === 'Agent' ? agentName : 'Customer'}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: colors.text.primary }}>
                  {line.text === '[FIRST RESPONSE]' ? (firstResponse || 'Hello! How can I help you today?') : line.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div 
        className="rounded-lg p-3 text-center"
        style={{ 
          backgroundColor: 'rgba(124, 93, 250, 0.1)',
          border: `1px solid ${colors.border.purple}`
        }}
      >
        <p className="text-xs" style={{ color: colors.text.secondary }}>
          💡 <span className="font-semibold">Pro Tip:</span> Test the live voice assistant with the Voice Tester tool
        </p>
      </div>

      {/* Agent Name Display */}
      {agentName && (
        <div className="text-xs text-center" style={{ color: colors.text.tertiary }}>
          Voice agent will introduce itself as <span style={{ color: colors.accent.turquoise, fontWeight: 'bold' }}>{agentName}</span>
        </div>
      )}
    </div>
  );
};
