import React from 'react';
import { Button } from '@/components/ui/button';
import {
  User,
  Globe,
  Phone,
  PhoneOff,
  Mic,
  MicOff
} from 'lucide-react';
import { AgentProfileOutput as AgentProfile } from 'types';
import { VoiceCallStatus } from 'utils/chat-store';

// Agent status types for dynamic glow system
export type AgentStatus = 'inactive' | 'active' | 'connecting' | 'error';

interface UKPassportAgentCardProps {
  agent: AgentProfile;
  isSelected?: boolean;
  isActive?: boolean;
  status?: AgentStatus; // New prop for dynamic glow
  onSelect?: () => void;
  onTestVoice?: () => void;
  voiceTestState?: {
    isVoiceTesting: boolean;
    voiceCallStatus: VoiceCallStatus;
    disabled: boolean;
  };
  className?: string;
  mode?: 'display' | 'testing';
  style?: React.CSSProperties;
}

// Format dates for passport display
const formatPassportDate = (dateString?: string) => {
  if (!dateString) return '25/01/01';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }).replace(/\//g, '/');
  } catch {
    return '25/01/01';
  }
};

// MRZ Generation Functions - Authentic ICAO 9303 format
const generateMRZLine1 = (agent: AgentProfile): string => {
  const surname = (agent.name?.split(' ').pop()?.toUpperCase() || 'QSAI').replace(/[^A-Z]/g, '').substring(0, 15);
  const givenNames = (agent.agent_role?.toUpperCase() || 'AI').replace(/[^A-Z]/g, '').substring(0, 15);
  
  // P<QSA + surname + << + given names + padding to 44 chars
  let line1 = `P<QSA${surname}`;
  
  // Add separators
  line1 += '<<';
  line1 += givenNames;
  
  // Pad to exactly 44 characters with '<'
  return line1.padEnd(44, '<');
};

const generateMRZLine2 = (agent: AgentProfile): string => {
  const passportNo = (agent.id?.substring(0, 8).toUpperCase() || 'CT001234').replace(/[^A-Z0-9]/g, '');
  const nationality = 'QSA';
  const birthDate = formatPassportDate(agent.creation_date || agent.created_at).replace(/\D/g, '').substring(2) || '250101';
  const sex = agent.gender || 'A';
  const expiryDate = '991231'; // Far future for AI agents
  
  // Passport No + check digit + nationality + birth date + check + sex + expiry + check + personal no + check
  let line2 = passportNo + '1'; // Check digit placeholder
  line2 += nationality;
  line2 += birthDate + '1'; // Birth date check digit
  line2 += sex;
  line2 += expiryDate + '1'; // Expiry check digit
  line2 += '<<<<<<<<<<<<<<<1'; // Personal number field + final check
  
  // Ensure exactly 44 characters
  return line2.substring(0, 44).padEnd(44, '<');
};

export const UKPassportAgentCard: React.FC<UKPassportAgentCardProps> = ({
  agent,
  isSelected = false,
  isActive = false,
  status,
  onSelect,
  onTestVoice,
  voiceTestState,
  className = '',
  mode = 'display',
  style = {}
}) => {
  // Passport color scheme matching QSAI design
  const passportColors = {
    primary: '#4A4458',          // Muted slate purple
    primaryLight: '#5A5468',     // Soft highlight slate purple
    primaryDark: '#3A3448',      // Deeper slate purple
    background: '#1A1A1A',       // QSAI Background Secondary
    backgroundDark: '#121212',   // QSAI Background Primary
    backgroundCard: '#222222',   // QSAI Background Tertiary
    accent: '#7C5DFA',           // Purple accent matching theme (was gold)
    lightText: '#FFFFFF',        // Pure white text
    secondaryText: '#BBC3E1'     // Secondary text color
  }

  // Status color system for dynamic glow
  const getStatusColors = (currentStatus: AgentStatus) => {
    switch (currentStatus) {
      case 'active':
        return {
          glow: 'rgba(16, 185, 129, 0.6)', // Green
          border: '#10B981'
        };
      case 'connecting':
        return {
          glow: 'rgba(234, 179, 8, 0.6)', // Yellow/Amber
          border: '#EAB308'
        };
      case 'error':
        return {
          glow: 'rgba(239, 68, 68, 0.6)', // Red
          border: '#EF4444'
        };
      case 'inactive':
      default:
        return {
          glow: 'rgba(124, 93, 250, 0.4)', // Purple (default)
          border: passportColors.accent
        };
    }
  };

  // Determine current agent status
  const getCurrentStatus = (): AgentStatus => {
    if (status) return status; // Use explicit status if provided
    
    // Fallback to voice test state
    if (voiceTestState?.isVoiceTesting) {
      if (voiceTestState.voiceCallStatus === VoiceCallStatus.CONNECTING) {
        return 'connecting';
      } else if (voiceTestState.voiceCallStatus === VoiceCallStatus.CONNECTED) {
        return 'active';
      }
    }
    
    // Use isActive prop as final fallback
    return isActive ? 'active' : 'inactive';
  };

  const currentStatus = getCurrentStatus();
  const statusColors = getStatusColors(currentStatus);

  return (
    <div
      className={`relative cursor-pointer transition-all duration-500 hover:scale-[1.02] ${className}`}
      style={{
        width: '430px',
        height: '275px',
        background: `linear-gradient(135deg, ${passportColors.primary} 0%, ${passportColors.primaryDark} 100%)`,
        border: isSelected 
          ? `3px solid ${statusColors.border}` 
          : `2px solid ${statusColors.border}`,
        boxShadow: isSelected
          ? `0 0 0 3px ${statusColors.glow}, 0 0 20px ${statusColors.glow}, 0 12px 40px rgba(0, 0, 0, 0.4)`
          : `0 0 15px ${statusColors.glow}, 0 8px 25px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)`,
        borderRadius: '8px',
        overflow: 'hidden',
        ...style
      }}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        const actionBar = target.closest('[data-action-bar="true"]');
        if (!actionBar && onSelect) {
          onSelect();
        }
      }}
    >
      {/* Security Pattern Background */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 2px,
              ${passportColors.accent} 2px,
              ${passportColors.accent} 4px
            ),
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 2px,
              ${passportColors.accent} 2px,
              ${passportColors.accent} 4px
            )
          `
        }}
      />
      
      {/* Authentic Security Patterns - Right Side */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 overflow-hidden opacity-20">
        <div className="absolute inset-0">
          <svg width="100%" height="100%" viewBox="0 0 200 400" className="absolute inset-0">
            {Array.from({length: 20}).map((_, i) => (
              <g key={i}>
                <polygon 
                  points={`${10 + (i % 3) * 30},${20 + i * 15} ${30 + (i % 3) * 30},${35 + i * 15} ${50 + (i % 3) * 30},${20 + i * 15}`}
                  fill={passportColors.accent}
                  opacity="0.3"
                />
                <polygon 
                  points={`${60 + (i % 3) * 25},${10 + i * 18} ${75 + (i % 3) * 25},${25 + i * 18} ${90 + (i % 3) * 25},${10 + i * 18}`}
                  fill={passportColors.primaryLight}
                  opacity="0.2"
                />
              </g>
            ))}
          </svg>
        </div>
        <div className="absolute bottom-10 right-4 w-20 h-20 rounded-full border-4 opacity-30" 
             style={{ borderColor: passportColors.accent }} />
        <div className="absolute bottom-20 right-8 w-12 h-12 rounded-full border-2 opacity-20" 
             style={{ borderColor: passportColors.primaryLight }} />
      </div>

      {/* Header Section */}
      <div 
        className="h-10 flex items-center justify-between px-4 py-2 border-b"
        style={{
          background: `linear-gradient(90deg, ${passportColors.background} 0%, ${passportColors.backgroundDark} 100%)`,
          borderBottomColor: passportColors.accent
        }}
      >
        <div className="flex items-center gap-2">
          <Globe className="h-3 w-3" style={{ color: passportColors.accent }} />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-wider leading-tight" style={{ color: passportColors.lightText }}>
              COTTAGE TANDOORI RESTAURANT
            </span>
            <span className="text-[8px] tracking-wide leading-tight" style={{ color: passportColors.secondaryText }}>
              AI AGENT PASSPORT
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[8px]" style={{ color: passportColors.secondaryText }}>Agent ID / Passport No.</div>
          <div className="text-[10px] font-mono font-bold" style={{ color: passportColors.accent }}>
            {agent.id?.substring(0, 9).toUpperCase() || 'CT001234'}
          </div>
        </div>
      </div>

      {/* Main Content Area - ICAO TD3 Layout */}
      <div className="flex-1 flex" style={{ height: 'calc(100% - 90px)' }}> {/* Reserve 90px total for header + MRZ */}
        {/* Photo Section - Authentic UK Passport Photo: Much Larger for Proper Visibility */}
        <div className="w-[35%] p-1 pl-6 flex flex-col items-center justify-start h-full">
          <div 
            className="bg-gradient-to-br from-gray-200 to-gray-300 rounded border-2 border-green-400 flex items-center justify-center overflow-hidden shadow-md flex-1"
            style={{
              width: '160px',     // Much larger for proper passport photo visibility
              maxWidth: '160px'   // Prevent stretching too wide
            }}
          >
            {agent.avatar_url ? (
              <img 
                src={agent.avatar_url} 
                alt={`${agent.name} passport photo`}
                className="w-full h-full object-cover"
                style={{
                  filter: 'brightness(0.95) contrast(1.05)',
                  objectPosition: 'center center'
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                <User className="w-20 h-20 text-blue-300" />
              </div>
            )}
          </div>
          
          {/* Voice Test Button */}
          {mode === 'testing' && onTestVoice && (
            <Button
              size="sm"
              variant={voiceTestState?.isVoiceTesting ? 'destructive' : 'default'}
              className="mt-2 text-xs h-6"
              onClick={(e) => {
                e.stopPropagation();
                onTestVoice();
              }}
              disabled={voiceTestState?.isVoiceTesting}
            >
              {voiceTestState?.isVoiceTesting ? (
                <><MicOff className="h-3 w-3 mr-1" />Stop</>
              ) : (
                <><Mic className="h-3 w-3 mr-1" />Test</>
              )}
            </Button>
          )}
        </div>

        {/* Personal Details Section - Contained within card boundaries */}
        <div className="flex-1 px-6 py-1.5 space-y-0.5 mb-4 overflow-hidden" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {/* Name */}
          <div>
            <div className="text-[7px] font-normal mb-0.5" style={{ color: passportColors.secondaryText }}>Type/Type (1)</div>
            <div className="text-[8px] font-bold" style={{ color: passportColors.lightText }}>P</div>
          </div>
          
          <div className="max-w-full">
            <div className="text-[7px] font-normal mb-0.5" style={{ color: passportColors.secondaryText }}>Surname/Nom (2)</div>
            <div className="text-[9px] font-bold truncate" style={{ color: passportColors.lightText }}>
              {agent.name?.split(' ').pop()?.toUpperCase() || 'AGENT'}
            </div>
          </div>
          
          <div className="max-w-full">
            <div className="text-[7px] font-normal mb-0.5" style={{ color: passportColors.secondaryText }}>Given name(s)/Prénom(s) (3)</div>
            <div className="text-[9px] font-bold truncate" style={{ color: passportColors.lightText }}>
              {agent.agent_role?.toUpperCase() || 'AI ASSISTANT'}
            </div>
          </div>
          
          {/* Nationality, Birth Details, and Gender in a compact grid */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 max-w-full">
            <div className="min-w-0">
              <div className="text-[7px] font-normal mb-0.5" style={{ color: passportColors.secondaryText }}>Nationality/Nationalité (4)</div>
              <div className="text-[8px] font-bold truncate" style={{ color: passportColors.lightText }}>QSA</div>
            </div>
            <div className="min-w-0">
              <div className="text-[7px] font-normal mb-0.5" style={{ color: passportColors.secondaryText }}>Personal no./No personnel (5)</div>
              <div className="text-[8px] font-bold truncate" style={{ color: passportColors.lightText }}>
                {agent.id?.substring(0, 8).toUpperCase() || 'CT001234'}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[7px] font-normal mb-0.5" style={{ color: passportColors.secondaryText }}>Date of birth/Date de naissance (6)</div>
              <div className="text-[8px] font-bold truncate" style={{ color: passportColors.lightText }}>
                {formatPassportDate(agent.creation_date || agent.created_at)}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[7px] font-normal mb-0.5" style={{ color: passportColors.secondaryText }}>Sex/Sexe (7)</div>
              <div className="text-[8px] font-bold truncate" style={{ color: passportColors.lightText }}>
                {agent.gender || 'A'}
              </div>
            </div>
          </div>

          {/* Place of birth - separate row with full width to prevent cutoff */}
          <div className="w-full">
            <div className="text-[7px] font-normal mb-0.5" style={{ color: passportColors.secondaryText }}>Place of birth/Lieu de naissance (6)</div>
            <div className="text-[6px] font-bold" style={{ color: passportColors.lightText }}>UNITED KINGDOM</div>
          </div>
          
          {/* Issue and Expiry Details in compact grid - Final section */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-0 max-w-full">
            <div className="min-w-0">
              <div className="text-[6px] font-normal mb-0.5" style={{ color: passportColors.secondaryText }}>Date of issue/Date de délivrance (8)</div>
              <div className="text-[6px] font-bold truncate" style={{ color: passportColors.lightText }}>
                {formatPassportDate(agent.activation_date || agent.created_at)}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[6px] font-normal mb-0.5" style={{ color: passportColors.secondaryText }}>Authority/Autorité (9)</div>
              <div className="text-[6px] font-bold truncate" style={{ color: passportColors.lightText }}>QSAI</div>
            </div>
            <div className="min-w-0 col-span-2">
              <div className="text-[6px] font-normal mb-0.5" style={{ color: passportColors.secondaryText }}>Date of expiry/Date d'expiration (10)</div>
              <div className="text-[6px] font-bold truncate" style={{ color: passportColors.lightText }}>
                {agent.date_of_expiry || 'UNLIMITED'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Machine Readable Zone (MRZ) - ICAO 9303 TD3 Standard - TRUE Edge-to-Edge */}
      <div 
        className="h-[50px]"
        style={{
          background: `linear-gradient(90deg, ${passportColors.backgroundCard} 0%, ${passportColors.background} 100%)`,
          borderTop: `1px solid ${passportColors.accent}`,
          fontFamily: 'Courier New, monospace',
          width: '100%',
          margin: 0,               // NO margins at all
          padding: 0,              // NO padding at all
          borderRadius: '0 0 8px 8px',  // Only round bottom corners to match card
          overflow: 'hidden'
        }}
      >
        {/* Pure Edge-to-Edge MRZ Container - Zero Constraints */}
        <div 
          className="flex flex-col justify-center h-full"
          style={{ 
            margin: 0,               // NO margins
            padding: 0,              // NO padding
            width: '100%',           // Full width
            height: '100%'
          }}
        >
          {/* Line 1: 44 characters exactly - Natural Text Justification */}
          <div 
            className="text-[8px] font-mono leading-tight select-text"
            style={{ 
              color: passportColors.secondaryText,
              fontFamily: 'Courier New, monospace',
              letterSpacing: '1.5px',     // Expanded to naturally fill width
              fontWeight: '500',
              margin: 0,
              padding: 0,
              width: '100%',
              textAlign: 'justify',       
              textAlignLast: 'justify',   
              lineHeight: '16px',
              wordSpacing: '2px',         // Let text naturally distribute
              display: 'block'
            }}
          >
            {generateMRZLine1(agent)}
          </div>
          
          {/* Line 2: 44 characters exactly - Natural Text Justification */}
          <div 
            className="text-[8px] font-mono leading-tight select-text"
            style={{ 
              color: passportColors.secondaryText,
              fontFamily: 'Courier New, monospace',
              letterSpacing: '1.5px',     // Expanded to naturally fill width
              fontWeight: '500',
              margin: 0,
              padding: 0,
              width: '100%',
              textAlign: 'justify',       
              textAlignLast: 'justify',   
              lineHeight: '16px',
              wordSpacing: '2px',         // Let text naturally distribute
              display: 'block'
            }}
          >
            {generateMRZLine2(agent)}
          </div>
        </div>
        
        {/* MRZ Helper text */}
        <div className="absolute top-1 right-1">
          <div className="text-[6px]" style={{ color: passportColors.accent, opacity: 0.6 }}>
            MRZ
          </div>
        </div>
      </div>
    </div>
  );
};
