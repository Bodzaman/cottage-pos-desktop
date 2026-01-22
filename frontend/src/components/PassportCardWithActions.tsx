import React, { useState } from 'react';
import { MultiNationalityPassportCard } from './MultiNationalityPassportCard';
import { AgentProfile } from 'types';
import { VoiceCallStatus } from 'utils/chat-store';
import { Button } from '@/components/ui/button';
import {
  Volume2,
  Edit,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  MicOff,
  PhoneCall
} from 'lucide-react';

interface PassportCardWithActionsProps {
  agent: AgentProfile;
  isSelected?: boolean;
  isActive?: boolean;
  onTestVoice?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleVisibility?: () => void;
  onClone?: () => void;
  onSelect?: () => void;
  voiceTestState?: {
    isVoiceTesting: boolean;
    voiceCallStatus: VoiceCallStatus;
    disabled: boolean;
  };
  className?: string;
}

export const PassportCardWithActions: React.FC<PassportCardWithActionsProps> = ({
  agent,
  isSelected = false,
  isActive = false,
  onTestVoice,
  onEdit,
  onDelete,
  onToggleVisibility,
  onClone,
  onSelect,
  voiceTestState,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getVoiceButtonContent = () => {
    if (voiceTestState?.isVoiceTesting) {
      if (voiceTestState.voiceCallStatus === VoiceCallStatus.CONNECTING) {
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          text: 'Connecting'
        };
      } else if (voiceTestState.voiceCallStatus === VoiceCallStatus.CONNECTED) {
        return {
          icon: <MicOff className="h-4 w-4" />,
          text: 'End Call'
        };
      } else {
        return {
          icon: <PhoneCall className="h-4 w-4" />,
          text: 'Stop'
        };
      }
    }
    return {
      icon: <Volume2 className="h-4 w-4" />,
      text: 'Test Voice'
    };
  };

  const voiceButton = getVoiceButtonContent();

  return (
    <div
      className={`relative group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <MultiNationalityPassportCard
        agent={agent}
        isSelected={isSelected}
        isActive={isActive}
        onSelect={onSelect}
        className="w-full cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
        mode="display"
      />
      
      {/* Action Overlay */}
      <div className={`absolute bottom-3 right-3 flex flex-col gap-2 bg-black/80 backdrop-blur-sm rounded-lg p-2 border border-yellow-500/30 shadow-lg transition-all duration-300 transform ${
        isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}>
          {/* Test Voice Button */}
          {onTestVoice && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onTestVoice();
              }}
              disabled={voiceTestState?.disabled}
              className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/20"
              title={voiceButton.text}
            >
              {voiceButton.icon}
            </Button>
          )}

          {/* Edit Button */}
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}

          {/* Clone Button */}
          {onClone && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onClone();
              }}
              className="h-8 w-8 p-0 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
              title="Clone"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}

          {/* Visibility Toggle */}
          {onToggleVisibility && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility();
              }}
              className="h-8 w-8 p-0 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20"
              title={agent.is_admin_visible ? "Hide" : "Show"}
            >
              {agent.is_admin_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          )}

          {/* Delete Button */}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
    </div>
  );
};

export default PassportCardWithActions;
