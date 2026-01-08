import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Volume2,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Loader2,
  MicOff,
  PhoneCall
} from 'lucide-react';
import { VoiceCallStatus } from 'utils/chat-store';
import { AgentProfileOutput as AgentProfile } from 'types';

interface PassportActionIslandProps {
  agent: AgentProfile;
  isVisible: boolean;
  position: { x: number; y: number };
  onTestVoice?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleVisibility?: () => void;
  onClone?: () => void;
  isVoiceTesting?: boolean;
  voiceCallStatus?: VoiceCallStatus;
  className?: string;
}

export const PassportActionIsland = React.forwardRef<HTMLDivElement, PassportActionIslandProps>((
  {
    agent,
    isVisible,
    position,
    onTestVoice,
    onEdit,
    onDelete,
    onToggleVisibility,
    onClone,
    isVoiceTesting = false,
    voiceCallStatus = VoiceCallStatus.IDLE,
    className = ''
  },
  ref
) => {
  const islandColors = {
    background: 'rgba(26, 26, 26, 0.95)',
    border: 'rgba(192, 192, 192, 0.3)',  // Silver border
    accent: '#C0C0C0',                    // Silver accent (was gold)
    text: '#FFFFFF',
    secondaryText: '#BBC3E1'
  };

  const getVoiceButtonContent = () => {
    if (isVoiceTesting) {
      if (voiceCallStatus === VoiceCallStatus.CONNECTING) {
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          text: 'Connecting',
          className: 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20'
        };
      } else if (voiceCallStatus === VoiceCallStatus.CONNECTED) {
        return {
          icon: <MicOff className="h-4 w-4" />,
          text: 'End Call',
          className: 'border-red-500/30 text-red-400 hover:bg-red-500/20'
        };
      } else {
        return {
          icon: <PhoneCall className="h-4 w-4" />,
          text: 'Stop',
          className: 'border-red-500/30 text-red-400 hover:bg-red-500/20'
        };
      }
    }
    return {
      icon: <Volume2 className="h-4 w-4" />,
      text: 'Test Voice',
      className: 'border-green-500/30 text-green-400 hover:bg-green-500/20'
    };
  };

  const voiceButton = getVoiceButtonContent();

  if (!isVisible) return null;

  return (
    <div
      ref={ref}
      className={`fixed z-50 transition-all duration-300 ease-out ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: isVisible ? 'scale(1) opacity(1)' : 'scale(0.8) opacity(0)',
        transformOrigin: 'left center'
      }}
    >
      <div
        className="flex flex-col gap-2 p-3 rounded-lg backdrop-blur-sm border shadow-2xl"
        style={{
          backgroundColor: islandColors.background,
          borderColor: islandColors.border,
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 8px 25px rgba(192, 192, 192, 0.1)' // Silver glow
        }}
      >
        {/* Agent Name Header */}
        <div className="text-xs font-semibold mb-1 pb-2 border-b border-opacity-30" style={{ 
          color: islandColors.accent,
          borderColor: islandColors.border 
        }}>
          {agent.name}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {/* Test Voice Button */}
          {onTestVoice && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onTestVoice();
              }}
              disabled={isVoiceTesting && voiceCallStatus === VoiceCallStatus.CONNECTING}
              className={`h-8 text-xs bg-black/20 border justify-start gap-2 ${voiceButton.className}`}
            >
              {voiceButton.icon}
              {voiceButton.text}
            </Button>
          )}

          {/* Edit Button */}
          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="h-8 text-xs bg-black/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 justify-start gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Edit
            </Button>
          )}

          {/* Clone Button */}
          {onClone && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onClone();
              }}
              className="h-8 text-xs bg-black/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/20 justify-start gap-2"
            >
              <Copy className="h-4 w-4" />
              Clone
            </Button>
          )}

          {/* Visibility Toggle */}
          {onToggleVisibility && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility();
              }}
              className={`h-8 text-xs bg-black/20 border justify-start gap-2 ${
                agent.is_admin_visible 
                  ? 'border-green-500/30 text-green-400 hover:bg-green-500/20'
                  : 'border-gray-500/30 text-gray-400 hover:bg-gray-500/20'
              }`}
            >
              {agent.is_admin_visible ? (
                <><Eye className="h-4 w-4" />Visible</>
              ) : (
                <><EyeOff className="h-4 w-4" />Hidden</>
              )}
            </Button>
          )}

          {/* Delete Button */}
          {onDelete && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="h-8 text-xs bg-black/20 border-red-500/30 text-red-400 hover:bg-red-500/20 justify-start gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

PassportActionIsland.displayName = 'PassportActionIsland';
