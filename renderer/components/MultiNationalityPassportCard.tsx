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
import { AgentProfileOutput } from 'types';
import { VoiceCallStatus } from 'utils/chat-store';

// Agent status types for dynamic glow system
export type AgentStatus = 'inactive' | 'active' | 'connecting' | 'error';

interface MultiNationalityPassportCardProps {
  agent: AgentProfileOutput;
  isSelected?: boolean;
  isActive?: boolean;
  status?: AgentStatus;
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

// Country configuration for passport designs
interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    accent: string;
    background: string;
    backgroundDark: string;
    backgroundCard: string;
    lightText: string;
    secondaryText: string;
  };
  nationality: string;
  authority: string;
}

const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  GBR: {
    code: 'GBR',
    name: 'United Kingdom',
    flag: '🇬🇧',
    colors: {
      primary: '#4A4458',
      primaryLight: '#5A5468',
      primaryDark: '#3A3448',
      accent: '#7C5DFA', // QSAI Purple accent
      background: '#1A1A1A',
      backgroundDark: '#121212',
      backgroundCard: '#222222',
      lightText: '#FFFFFF',
      secondaryText: '#BBC3E1'
    },
    nationality: 'QSA',
    authority: 'QSAI'
  },
  USA: {
    code: 'USA',
    name: 'United States',
    flag: '🇺🇸',
    colors: {
      primary: '#1E3A8A', // Navy blue
      primaryLight: '#3B82F6',
      primaryDark: '#1E40AF',
      accent: '#EF4444', // Red accent
      background: '#0F172A',
      backgroundDark: '#020617',
      backgroundCard: '#1E293B',
      lightText: '#FFFFFF',
      secondaryText: '#CBD5E1'
    },
    nationality: 'QSA',
    authority: 'QSAI'
  },
  IND: {
    code: 'IND',
    name: 'India',
    flag: '🇮🇳',
    colors: {
      primary: '#1E40AF', // Blue
      primaryLight: '#3B82F6',
      primaryDark: '#1E3A8A',
      accent: '#F97316', // Saffron accent
      background: '#0F172A',
      backgroundDark: '#020617',
      backgroundCard: '#1E293B',
      lightText: '#FFFFFF',
      secondaryText: '#CBD5E1'
    },
    nationality: 'QSA',
    authority: 'QSAI'
  },
  BGD: {
    code: 'BGD',
    name: 'Bangladesh',
    flag: '🇧🇩',
    colors: {
      primary: '#16A34A', // Green
      primaryLight: '#22C55E',
      primaryDark: '#15803D',
      accent: '#EAB308', // Gold accent
      background: '#0F1F0F',
      backgroundDark: '#0A150A',
      backgroundCard: '#1F2F1F',
      lightText: '#FFFFFF',
      secondaryText: '#D1FAE5'
    },
    nationality: 'QSA',
    authority: 'QSAI'
  },
  CHN: {
    code: 'CHN',
    name: 'China',
    flag: '🇨🇳',
    colors: {
      primary: '#991B1B', // Burgundy/Red
      primaryLight: '#DC2626',
      primaryDark: '#7F1D1D',
      accent: '#FBBF24', // Gold accent
      background: '#1F0F0F',
      backgroundDark: '#150A0A',
      backgroundCard: '#2F1F1F',
      lightText: '#FFFFFF',
      secondaryText: '#FECACA'
    },
    nationality: 'QSA',
    authority: 'QSAI'
  },
  ESP: {
    code: 'ESP',
    name: 'Spain',
    flag: '🇪🇸',
    colors: {
      primary: '#991B1B', // Burgundy
      primaryLight: '#DC2626',
      primaryDark: '#7F1D1D',
      accent: '#FBBF24', // Gold accent
      background: '#1F0F0F',
      backgroundDark: '#150A0A',
      backgroundCard: '#2F1F1F',
      lightText: '#FFFFFF',
      secondaryText: '#FECACA'
    },
    nationality: 'QSA',
    authority: 'QSAI'
  },
  THA: {
    code: 'THA',
    name: 'Thailand',
    flag: '🇹🇭',
    colors: {
      primary: '#92400E', // Brown/Maroon
      primaryLight: '#D97706',
      primaryDark: '#78350F',
      accent: '#FBBF24', // Gold accent
      background: '#1C1408',
      backgroundDark: '#120C05',
      backgroundCard: '#2C2008',
      lightText: '#FFFFFF',
      secondaryText: '#FEF3C7'
    },
    nationality: 'QSA',
    authority: 'QSAI'
  },
  TUR: {
    code: 'TUR',
    name: 'Turkey',
    flag: '🇹🇷',
    colors: {
      primary: '#991B1B', // Burgundy
      primaryLight: '#DC2626',
      primaryDark: '#7F1D1D',
      accent: '#FBBF24', // Gold accent
      background: '#1F0F0F',
      backgroundDark: '#150A0A',
      backgroundCard: '#2F1F1F',
      lightText: '#FFFFFF',
      secondaryText: '#FECACA'
    },
    nationality: 'QSA',
    authority: 'QSAI'
  },
  ARE: {
    code: 'ARE',
    name: 'UAE',
    flag: '🇦🇪',
    colors: {
      primary: '#000000', // Black
      primaryLight: '#1F1F1F',
      primaryDark: '#000000',
      accent: '#FBBF24', // Gold accent
      background: '#0A0A0A',
      backgroundDark: '#000000',
      backgroundCard: '#1A1A1A',
      lightText: '#FFFFFF',
      secondaryText: '#D1D5DB'
    },
    nationality: 'QSA',
    authority: 'QSAI'
  },
  DEU: {
    code: 'DEU',
    name: 'Germany',
    flag: '🇩🇪',
    colors: {
      primary: '#1A202C', // Dark blue/black
      primaryLight: '#2D3748',
      primaryDark: '#171923',
      accent: '#FFCC00', // German gold
      background: '#0A0E14',
      backgroundDark: '#05080C',
      backgroundCard: '#1A1E24',
      lightText: '#FFFFFF',
      secondaryText: '#E2E8F0'
    },
    nationality: 'QSA',
    authority: 'QSAI'
  },
  FRA: {
    code: 'FRA',
    name: 'France',
    flag: '🇫🇷',
    colors: {
      primary: '#002654', // French blue
      primaryLight: '#0F3875',
      primaryDark: '#001C45',
      accent: '#E30A17', // Red accent
      background: '#0A1428',
      backgroundDark: '#050C1A',
      backgroundCard: '#122040',
      lightText: '#FFFFFF',
      secondaryText: '#D1D5DB'
    },
    nationality: 'QSA',
    authority: 'QSAI'
  },
  ITA: {
    code: 'ITA',
    name: 'Italy',
    flag: '🇮🇹',
    colors: {
      primary: '#008C45', // Italian green
      primaryLight: '#00A65C',
      primaryDark: '#007538',
      accent: '#CD212A', // Italian red
      background: '#053824',
      backgroundDark: '#032416',
      backgroundCard: '#084C30',
      lightText: '#FFFFFF',
      secondaryText: '#D1FFE0'
    },
    nationality: 'QSA',
    authority: 'QSAI'
  },
  NLD: {
    code: 'NLD',
    name: 'Netherlands',
    flag: '🇳🇱',
    colors: {
      primary: '#1E355E', // Dutch blue
      primaryLight: '#2B477C',
      primaryDark: '#15294A',
      accent: '#FF7600', // Dutch orange
      background: '#0E1A2E',
      backgroundDark: '#091324',
      backgroundCard: '#1E2A3E',
      lightText: '#FFFFFF',
      secondaryText: '#D1DCF0'
    },
    nationality: 'QSA',
    authority: 'QSAI'
  },
  AUS: {
    code: 'AUS',
    name: 'Australia',
    flag: '🇦🇺',
    colors: {
      primary: '#00008B', // Dark blue
      primaryLight: '#000EAD',
      primaryDark: '#000069',
      accent: '#FF0000', // Red
      background: '#00053D',
      backgroundDark: '#000328',
      backgroundCard: '#000C69',
      lightText: '#FFFFFF',
      secondaryText: '#BBCDF8'
    },
    nationality: 'QSA',
    authority: 'QSAI'
  }
};

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
const generateMRZLine1 = (agent: AgentProfileOutput, countryCode: string): string => {
  const surname = (agent.name?.split(' ').pop()?.toUpperCase() || 'QSAI').replace(/[^A-Z]/g, '').substring(0, 15);
  const givenNames = (agent.agent_role?.toUpperCase() || 'AI').replace(/[^A-Z]/g, '').substring(0, 15);
  
  // P<{country} + surname + << + given names + padding to 44 chars
  let line1 = `P<${countryCode}${surname}`;
  
  // Add separators
  line1 += '<<';
  line1 += givenNames;
  
  // Pad to exactly 44 characters with '<'
  return line1.padEnd(44, '<');
};

const generateMRZLine2 = (agent: AgentProfileOutput, countryCode: string): string => {
  const passportNo = (agent.id?.substring(0, 8).toUpperCase() || 'CT001234').replace(/[^A-Z0-9]/g, '');
  const nationality = countryCode;
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

export const MultiNationalityPassportCard: React.FC<MultiNationalityPassportCardProps> = ({
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
  // Get country configuration
  const countryCode = agent.passport_nationality || 'GBR';
  const countryConfig = COUNTRY_CONFIGS[countryCode] || COUNTRY_CONFIGS['GBR'];
  const passportColors = countryConfig.colors;

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
          glow: `${passportColors.accent}60`, // Country accent with opacity
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
      className={`relative cursor-pointer transition-all duration-500 hover:scale-[1.02] w-full max-w-[280px] sm:max-w-[350px] md:max-w-[400px] lg:max-w-[430px] mx-auto ${className}`}
      style={{
        aspectRatio: '430 / 275',
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
        className="h-8 sm:h-9 lg:h-10 flex items-center justify-between px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 border-b"
        style={{
          background: `linear-gradient(90deg, ${passportColors.background} 0%, ${passportColors.backgroundDark} 100%)`,
          borderBottomColor: passportColors.accent
        }}
      >
        <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
          <Globe className="h-2.5 w-2.5 sm:h-3 sm:w-3" style={{ color: passportColors.accent }} />
          <div className="flex flex-col">
            <span className="text-[8px] sm:text-[9px] lg:text-[10px] font-bold tracking-wider leading-tight" style={{ color: passportColors.lightText }}>
              COTTAGE TANDOORI RESTAURANT
            </span>
            <span className="text-[6px] sm:text-[7px] lg:text-[8px] tracking-wide leading-tight" style={{ color: passportColors.secondaryText }}>
              AI AGENT PASSPORT {countryConfig.flag}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[6px] sm:text-[7px] lg:text-[8px]" style={{ color: passportColors.secondaryText }}>Agent ID / Passport No.</div>
          <div className="text-[8px] sm:text-[9px] lg:text-[10px] font-mono font-bold" style={{ color: passportColors.accent }}>
            {agent.id?.substring(0, 9).toUpperCase() || 'CT001234'}
          </div>
        </div>
      </div>

      {/* Main Content Area - ICAO TD3 Layout */}
      <div className="flex-1 flex" style={{ height: 'calc(100% - 90px)' }}>
        {/* Photo Section - Mobile responsive, Desktop baseline preserved */}
        <div className="w-[33%] md:w-[38%] p-1 pl-2 md:pl-4 flex flex-col items-center justify-start h-full">
          <div 
            className="bg-gradient-to-br from-gray-200 to-gray-300 rounded border-2 border-green-400 flex items-center justify-center overflow-hidden shadow-md flex-1 w-full max-w-[140px] md:max-w-[180px]"
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
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                <User className="w-12 md:w-20 text-blue-400" strokeWidth={1.5} />
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

        {/* Details Section - Right side with all passport fields */}
        <div className="flex-1 px-2 py-0.5 sm:px-4 sm:py-1 md:px-6 md:py-1.5 space-y-0.5 sm:space-y-1 overflow-hidden">
          {/* Type/Type field */}
          <div>
            <div className="text-[5px] sm:text-[6px] lg:text-[7px] text-gray-400 font-light tracking-wide mb-0">Type/Type (1)</div>
            <div className="text-[7px] sm:text-[8px] lg:text-[9px] font-semibold tracking-wider">{agent.agent_type || 'P'}</div>
          </div>

          {/* Surname/Nom field */}
          <div>
            <div className="text-[5px] sm:text-[6px] lg:text-[7px] text-gray-400 font-light tracking-wide mb-0">Surname/Nom (2)</div>
            <div className="text-[7px] sm:text-[8px] lg:text-[9px] font-bold tracking-wider uppercase truncate">
              {agent.name?.split(' ').pop()?.toUpperCase() || 'AGENT'}
            </div>
          </div>

          {/* Given name(s) field */}
          <div>
            <div className="text-[5px] sm:text-[6px] lg:text-[7px] text-gray-400 font-light tracking-wide mb-0">Given name(s)/Prénom(s) (3)</div>
            <div className="text-[7px] sm:text-[8px] lg:text-[9px] font-bold tracking-wider uppercase truncate">
              {agent.agent_role?.toUpperCase() || 'AI ASSISTANT'}
            </div>
          </div>

          {/* Two-column grid for remaining fields */}
          <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 sm:gap-x-2">
            {/* Nationality */}
            <div>
              <div className="text-[5px] sm:text-[6px] lg:text-[7px] text-gray-400 font-light tracking-wide mb-0">Nationality/Nationalité (4)</div>
              <div className="text-[6px] sm:text-[7px] lg:text-[8px] font-semibold tracking-wider">{countryConfig.nationality}</div>
            </div>

            {/* Personal no */}
            <div>
              <div className="text-[5px] sm:text-[6px] lg:text-[7px] text-gray-400 font-light tracking-wide mb-0">Personal no./No personnel (5)</div>
              <div className="text-[6px] sm:text-[7px] lg:text-[8px] font-semibold tracking-wider truncate">
                {agent.id?.substring(0, 8).toUpperCase() || 'CT001234'}
              </div>
            </div>

            {/* Date of birth */}
            <div>
              <div className="text-[5px] sm:text-[6px] lg:text-[7px] text-gray-400 font-light tracking-wide mb-0">Date of birth/Date de naissance (6)</div>
              <div className="text-[6px] sm:text-[7px] lg:text-[8px] font-semibold tracking-wider">
                {formatPassportDate(agent.creation_date || agent.created_at)}
              </div>
            </div>

            {/* Sex */}
            <div>
              <div className="text-[5px] sm:text-[6px] lg:text-[7px] text-gray-400 font-light tracking-wide mb-0">Sex/Sexe (7)</div>
              <div className="text-[6px] sm:text-[7px] lg:text-[8px] font-semibold tracking-wider">{agent.gender === 'male' ? 'M' : agent.gender === 'female' ? 'F' : 'A'}</div>
            </div>

            {/* Place of birth - Full width, only show on larger screens */}
            <div className="col-span-2 hidden sm:block">
              <div className="text-[5px] sm:text-[6px] lg:text-[7px] text-gray-400 font-light tracking-wide mb-0">Place of birth/Lieu de naissance (6)</div>
              <div className="text-[6px] sm:text-[7px] lg:text-[8px] font-semibold tracking-wider truncate">{countryConfig.name.toUpperCase()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Machine Readable Zone (MRZ) - ICAO 9303 TD3 Standard */}
      <div 
        className="h-[40px] sm:h-[45px] lg:h-[50px]"
        style={{
          background: `linear-gradient(90deg, ${passportColors.backgroundCard} 0%, ${passportColors.background} 100%)`,
          borderTop: `1px solid ${passportColors.accent}`,
          fontFamily: 'Courier New, monospace',
          width: '100%',
          margin: 0,
          padding: 0,
          borderRadius: '0 0 8px 8px',
          overflow: 'hidden'
        }}
      >
        <div 
          className="flex flex-col justify-center h-full"
          style={{ 
            margin: 0,
            padding: 0,
            width: '100%',
            height: '100%'
          }}
        >
          {/* MRZ Line 1 */}
          <div 
            className="text-[6px] sm:text-[7px] lg:text-[8px] font-mono leading-tight select-text"
            style={{ 
              color: passportColors.secondaryText,
              fontFamily: 'Courier New, monospace',
              letterSpacing: '1px',
              fontWeight: '500',
              margin: 0,
              padding: 0,
              width: '100%',
              textAlign: 'justify',
              textAlignLast: 'justify',
              lineHeight: '14px',
              wordSpacing: '1.5px',
              display: 'block'
            }}
          >
            {generateMRZLine1(agent, countryCode)}
          </div>
          
          {/* MRZ Line 2 */}
          <div 
            className="text-[6px] sm:text-[7px] lg:text-[8px] font-mono leading-tight select-text"
            style={{ 
              color: passportColors.secondaryText,
              fontFamily: 'Courier New, monospace',
              letterSpacing: '1px',
              fontWeight: '500',
              margin: 0,
              padding: 0,
              width: '100%',
              textAlign: 'justify',
              textAlignLast: 'justify',
              lineHeight: '14px',
              wordSpacing: '1.5px',
              display: 'block'
            }}
          >
            {generateMRZLine2(agent, countryCode)}
          </div>
        </div>
      </div>
    </div>
  );
};
