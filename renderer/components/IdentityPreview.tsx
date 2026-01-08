import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { User, Sparkles, MessageCircle, Phone, HelpCircle } from 'lucide-react';
import { colors } from 'utils/designSystem';

interface IdentityPreviewProps {
  agentName?: string;
  title?: string;
  nationality?: string;
  avatar?: string;
  gender?: string;
  isEmpty?: boolean;
}

const NATIONALITY_FLAGS: Record<string, string> = {
  'British': '🇬🇧',
  'American': '🇺🇸',
  'Indian': '🇮🇳',
  'Australian': '🇦🇺',
  'Canadian': '🇨🇦',
  'Irish': '🇮🇪',
  'South African': '🇿🇦',
  'Pakistani': '🇵🇰',
  'Bangladeshi': '🇧🇩',
};

const NATIONALITY_COLORS: Record<string, string> = {
  'British': '#012169',
  'American': '#B22234',
  'Indian': '#FF9933',
  'Australian': '#012169',
  'Canadian': '#FF0000',
  'Irish': '#169B62',
  'South African': '#007A4D',
  'Pakistani': '#01411C',
  'Bangladeshi': '#006A4E',
};

/**
 * Identity preview component
 * Shows how the agent will introduce itself to customers
 */
export const IdentityPreview: React.FC<IdentityPreviewProps> = ({
  agentName = 'AI Assistant',
  title = 'Customer Service Assistant',
  nationality = 'British',
  avatar,
  gender,
  isEmpty = false
}) => {
  const flag = NATIONALITY_FLAGS[nationality] || '🌐';
  const accentColor = NATIONALITY_COLORS[nationality] || colors.brand.purple;

  if (isEmpty) {
    return (
      <div className="text-center p-6 space-y-3" style={{ color: colors.text.tertiary }}>
        <User className="h-12 w-12 mx-auto opacity-30" />
        <p className="text-sm">Configure your agent's identity to see a preview</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
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
          <Sparkles className="h-3 w-3 mr-1" />
          Identity Preview
        </Badge>
      </div>

      {/* Agent Introduction Card */}
      <Card 
        className="p-6 space-y-4 border-2 transition-all hover:shadow-lg"
        style={{ 
          borderColor: accentColor,
          backgroundColor: colors.background.tertiary
        }}
      >
        <div className="text-center space-y-3">
          {/* Avatar */}
          <div className="flex justify-center">
            {avatar ? (
              <img 
                src={avatar} 
                alt={agentName}
                className="w-20 h-20 rounded-full object-cover border-4"
                style={{ borderColor: accentColor }}
              />
            ) : (
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl border-4"
                style={{ 
                  borderColor: accentColor,
                  backgroundColor: colors.background.primary
                }}
              >
                {agentName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name & Title */}
          <div>
            <h3 className="text-xl font-bold" style={{ color: colors.text.primary }}>
              {agentName}
            </h3>
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              {title}
            </p>
          </div>

          {/* Nationality Badge */}
          <div className="flex items-center justify-center gap-2">
            <Badge 
              className="text-sm px-3 py-1"
              style={{ 
                backgroundColor: accentColor,
                color: '#FFFFFF'
              }}
            >
              {flag} {nationality}
            </Badge>
            {gender && (
              <Badge 
                variant="outline"
                style={{ borderColor: colors.border.medium, color: colors.text.secondary }}
              >
                {gender}
              </Badge>
            )}
          </div>

          {/* Sample Greeting */}
          <div 
            className="rounded-lg p-4 text-left"
            style={{ 
              backgroundColor: colors.background.primary,
              borderLeft: `4px solid ${colors.accent.turquoise}`
            }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: colors.text.tertiary }}>
              Sample Greeting
            </p>
            <p className="text-sm italic leading-relaxed" style={{ color: colors.text.primary }}>
              "Hello! I'm {agentName}, your {title} at Cottage Tandoori. I'm here to help you with anything you need - from menu recommendations to taking your order. How can I assist you today?"
            </p>
          </div>
        </div>
      </Card>

      {/* Contextual Examples */}
      <div className="space-y-3">
        <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>
          How {agentName} Will Appear:
        </p>

        <div className="grid gap-3">
          {/* Chat Example */}
          <div 
            className="rounded-lg p-4 space-y-2"
            style={{ backgroundColor: colors.background.tertiary }}
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" style={{ color: colors.brand.purple }} />
              <p className="text-xs font-semibold" style={{ color: colors.text.secondary }}>
                In Chat Widget
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                style={{ 
                  backgroundColor: accentColor,
                  color: '#FFFFFF'
                }}
              >
                {agentName.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold" style={{ color: colors.text.primary }}>
                  {agentName}
                </p>
                <p className="text-xs" style={{ color: colors.text.secondary }}>
                  {title}
                </p>
                <p className="text-sm mt-2" style={{ color: colors.text.primary }}>
                  Hello! How can I help you today?
                </p>
              </div>
            </div>
          </div>

          {/* Voice Example */}
          <div 
            className="rounded-lg p-4 space-y-2"
            style={{ backgroundColor: colors.background.tertiary }}
          >
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" style={{ color: colors.accent.turquoise }} />
              <p className="text-xs font-semibold" style={{ color: colors.text.secondary }}>
                On Voice Call
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm italic" style={{ color: colors.text.primary }}>
                "Hello! You've reached Cottage Tandoori. This is {agentName}, your {nationality.toLowerCase()} {title.toLowerCase()}. How may I help you today?"
              </p>
            </div>
          </div>

          {/* Help Desk Example */}
          <div 
            className="rounded-lg p-4 space-y-2"
            style={{ backgroundColor: colors.background.tertiary }}
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" style={{ color: colors.accent.silver }} />
              <p className="text-xs font-semibold" style={{ color: colors.text.secondary }}>
                Handling Inquiries
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs" style={{ color: colors.text.tertiary }}>When asked about their identity:</p>
              <p className="text-sm" style={{ color: colors.text.primary }}>
                "I'm {agentName}, an AI assistant here at Cottage Tandoori. I'm designed to help with menu questions, orders, and any other inquiries you might have!"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Personality Traits */}
      <div 
        className="rounded-lg p-4 space-y-3"
        style={{ backgroundColor: colors.background.tertiary }}
      >
        <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>
          Personality Traits
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" style={{ borderColor: colors.border.purple, color: colors.text.secondary }}>
            {nationality} accent
          </Badge>
          <Badge variant="outline" style={{ borderColor: colors.border.turquoise, color: colors.text.secondary }}>
            Professional
          </Badge>
          <Badge variant="outline" style={{ borderColor: colors.border.silver, color: colors.text.secondary }}>
            Helpful
          </Badge>
          <Badge variant="outline" style={{ borderColor: colors.border.medium, color: colors.text.secondary }}>
            Culturally aware
          </Badge>
        </div>
      </div>

      {/* Customer View Toggle Info */}
      <div 
        className="rounded-lg p-3 text-center space-y-1"
        style={{ 
          backgroundColor: 'rgba(124, 93, 250, 0.1)',
          border: `1px solid ${colors.border.purple}`
        }}
      >
        <p className="text-xs font-semibold" style={{ color: colors.text.primary }}>
          👁️ Customer View
        </p>
        <p className="text-xs" style={{ color: colors.text.secondary }}>
          This is exactly how customers will see {agentName} across all channels
        </p>
      </div>

      {/* Configuration Summary */}
      <div className="text-xs text-center space-y-1" style={{ color: colors.text.tertiary }}>
        <p>
          Name: <span style={{ color: colors.accent.turquoise, fontWeight: 'bold' }}>{agentName}</span>
          {' • '}
          Title: <span style={{ color: colors.accent.turquoise, fontWeight: 'bold' }}>{title}</span>
        </p>
        <p>
          Nationality: <span style={{ color: colors.accent.turquoise, fontWeight: 'bold' }}>{flag} {nationality}</span>
          {gender && (
            <>
              {' • '}
              Gender: <span style={{ color: colors.accent.turquoise, fontWeight: 'bold' }}>{gender}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
};
