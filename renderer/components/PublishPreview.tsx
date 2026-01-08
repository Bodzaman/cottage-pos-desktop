import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Rocket, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Globe, 
  MessageCircle, 
  Phone,
  Sparkles,
  ArrowRight,
  Eye
} from 'lucide-react';
import { colors } from 'utils/designSystem';

interface ConfigSection {
  name: string;
  status: 'complete' | 'incomplete' | 'optional';
  fields: Array<{
    label: string;
    value: string | undefined;
    required?: boolean;
  }>;
}

interface PublishPreviewProps {
  agentName?: string;
  nationality?: string;
  voiceModel?: string;
  systemPrompt?: string;
  firstResponse?: string;
  onPublish?: () => void;
  isPublishing?: boolean;
}

/**
 * Publish preview component
 * Shows deployment impact and configuration summary before publishing
 */
export const PublishPreview: React.FC<PublishPreviewProps> = ({
  agentName,
  nationality,
  voiceModel,
  systemPrompt,
  firstResponse,
  onPublish,
  isPublishing = false
}) => {
  const [showDiff, setShowDiff] = useState(false);

  // Calculate configuration completeness
  const configSections: ConfigSection[] = [
    {
      name: 'Identity',
      status: agentName && nationality ? 'complete' : 'incomplete',
      fields: [
        { label: 'Agent Name', value: agentName, required: true },
        { label: 'Nationality', value: nationality, required: true },
      ]
    },
    {
      name: 'Chat Bot',
      status: systemPrompt ? 'complete' : 'incomplete',
      fields: [
        { label: 'System Prompt', value: systemPrompt ? 'Configured' : undefined, required: true },
      ]
    },
    {
      name: 'Voice Assistant',
      status: voiceModel && firstResponse ? 'complete' : 'optional',
      fields: [
        { label: 'Voice Model', value: voiceModel },
        { label: 'First Response', value: firstResponse },
      ]
    }
  ];

  const completeSections = configSections.filter(s => s.status === 'complete').length;
  const totalRequired = configSections.filter(s => s.status !== 'optional').length;
  const isReadyToPublish = completeSections >= totalRequired;

  // Affected channels
  const affectedChannels = [
    { 
      name: 'Chat Widget', 
      icon: MessageCircle, 
      color: colors.brand.purple,
      enabled: !!systemPrompt,
      description: 'Will update on website and customer portal'
    },
    { 
      name: 'Voice API', 
      icon: Phone, 
      color: colors.accent.turquoise,
      enabled: !!(voiceModel && firstResponse),
      description: 'Will update phone and voice chat interface'
    },
    { 
      name: 'Public Website', 
      icon: Globe, 
      color: colors.accent.silver,
      enabled: !!agentName,
      description: 'Agent identity will be visible to customers'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Rocket className="h-6 w-6" style={{ color: colors.brand.purple }} />
          <h3 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
            Ready to Deploy?
          </h3>
        </div>
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          Review your configuration before publishing to production
        </p>
      </div>

      {/* Configuration Status */}
      <Card 
        className="p-6 space-y-4"
        style={{ 
          backgroundColor: colors.background.tertiary,
          borderColor: isReadyToPublish ? colors.accent.turquoise : colors.accent.silver
        }}
      >
        <div className="flex items-center justify-between">
          <h4 className="font-semibold" style={{ color: colors.text.primary }}>
            Configuration Status
          </h4>
          <Badge 
            className="font-semibold"
            style={{
              backgroundColor: isReadyToPublish ? colors.accent.turquoise : colors.accent.silver,
              color: '#FFFFFF'
            }}
          >
            {completeSections}/{totalRequired} Required Sections
          </Badge>
        </div>

        <div className="space-y-3">
          {configSections.map((section, idx) => (
            <div 
              key={idx}
              className="rounded-lg p-4"
              style={{ backgroundColor: colors.background.primary }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm" style={{ color: colors.text.primary }}>
                    {section.name}
                  </span>
                  {section.status === 'optional' && (
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{ borderColor: colors.border.medium, color: colors.text.tertiary }}
                    >
                      Optional
                    </Badge>
                  )}
                </div>
                {section.status === 'complete' ? (
                  <CheckCircle2 className="h-4 w-4" style={{ color: colors.accent.turquoise }} />
                ) : section.status === 'incomplete' ? (
                  <AlertCircle className="h-4 w-4" style={{ color: colors.accent.silver }} />
                ) : (
                  <div className="h-4 w-4" />
                )}
              </div>
              <div className="space-y-1 text-xs">
                {section.fields.map((field, fieldIdx) => (
                  <div key={fieldIdx} className="flex items-center justify-between">
                    <span style={{ color: colors.text.tertiary }}>
                      {field.label} {field.required && <span style={{ color: colors.accent.silver }}>*</span>}
                    </span>
                    <span style={{ color: field.value ? colors.text.secondary : colors.text.tertiary }}>
                      {field.value || 'Not set'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Deployment Impact */}
      <div className="space-y-3">
        <h4 className="font-semibold flex items-center gap-2" style={{ color: colors.text.primary }}>
          <ArrowRight className="h-4 w-4" />
          Deployment Impact
        </h4>
        
        <div className="grid gap-3">
          {affectedChannels.map((channel, idx) => (
            <div 
              key={idx}
              className={`rounded-lg p-4 transition-all ${
                channel.enabled ? 'opacity-100' : 'opacity-50'
              }`}
              style={{ 
                backgroundColor: colors.background.tertiary,
                borderLeft: `4px solid ${channel.enabled ? channel.color : colors.border.medium}`
              }}
            >
              <div className="flex items-start gap-3">
                <channel.icon 
                  className="h-5 w-5 flex-shrink-0" 
                  style={{ color: channel.enabled ? channel.color : colors.text.tertiary }} 
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm" style={{ color: colors.text.primary }}>
                      {channel.name}
                    </p>
                    {channel.enabled ? (
                      <Badge 
                        className="text-xs"
                        style={{ backgroundColor: channel.color, color: '#FFFFFF' }}
                      >
                        Will Update
                      </Badge>
                    ) : (
                      <Badge 
                        variant="outline"
                        className="text-xs"
                        style={{ borderColor: colors.border.medium, color: colors.text.tertiary }}
                      >
                        Not Configured
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: colors.text.secondary }}>
                    {channel.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rollout Timeline */}
      <Card 
        className="p-4"
        style={{ backgroundColor: colors.background.tertiary }}
      >
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 flex-shrink-0" style={{ color: colors.accent.turquoise }} />
          <div className="flex-1">
            <p className="font-medium text-sm mb-1" style={{ color: colors.text.primary }}>
              Estimated Rollout Time
            </p>
            <p className="text-xs" style={{ color: colors.text.secondary }}>
              Changes will be live within <span className="font-semibold" style={{ color: colors.accent.turquoise }}>2-3 minutes</span> after publishing.
              Existing conversations will continue with the old configuration until they end.
            </p>
          </div>
        </div>
      </Card>

      {/* Configuration Diff (Optional) */}
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDiff(!showDiff)}
          className="w-full text-xs"
          style={{ color: colors.text.secondary }}
        >
          <Eye className="h-3 w-3 mr-2" />
          {showDiff ? 'Hide' : 'Show'} Configuration Details
        </Button>
        
        {showDiff && (
          <Card 
            className="p-4 space-y-2"
            style={{ backgroundColor: colors.background.tertiary }}
          >
            <p className="text-xs font-semibold" style={{ color: colors.text.secondary }}>
              Current Configuration:
            </p>
            <div className="font-mono text-xs space-y-1" style={{ color: colors.text.tertiary }}>
              {agentName && <div>agentName: <span style={{ color: colors.accent.turquoise }}>"{agentName}"</span></div>}
              {nationality && <div>nationality: <span style={{ color: colors.accent.turquoise }}>"{nationality}"</span></div>}
              {voiceModel && <div>voiceModel: <span style={{ color: colors.accent.turquoise }}>"{voiceModel}"</span></div>}
              {systemPrompt && <div>systemPrompt: <span style={{ color: colors.accent.turquoise }}>"[{systemPrompt.length} characters]"</span></div>}
              {firstResponse && <div>firstResponse: <span style={{ color: colors.accent.turquoise }}>"[{firstResponse.length} characters]"</span></div>}
            </div>
          </Card>
        )}
      </div>

      {/* Publish Button */}
      <div className="space-y-3">
        {!isReadyToPublish && (
          <div 
            className="rounded-lg p-3 flex items-start gap-2"
            style={{ 
              backgroundColor: 'rgba(192, 192, 192, 0.1)',
              border: `1px solid ${colors.accent.silver}`
            }}
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: colors.accent.silver }} />
            <p className="text-xs" style={{ color: colors.text.secondary }}>
              Complete all required sections before publishing
            </p>
          </div>
        )}

        <Button
          onClick={onPublish}
          disabled={!isReadyToPublish || isPublishing}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold"
          size="lg"
        >
          {isPublishing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Publishing...
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4 mr-2" />
              Publish to Production
            </>
          )}
        </Button>
      </div>

      {/* Info Footer */}
      <div 
        className="rounded-lg p-3 text-center"
        style={{ 
          backgroundColor: 'rgba(124, 93, 250, 0.1)',
          border: `1px solid ${colors.border.purple}`
        }}
      >
        <p className="text-xs" style={{ color: colors.text.secondary }}>
          <Sparkles className="inline h-3 w-3 mr-1" />
          <span className="font-semibold">Pro Tip:</span> Test your configuration thoroughly before publishing.
          You can always rollback if needed.
        </p>
      </div>
    </div>
  );
};
