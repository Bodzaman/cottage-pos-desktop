import React, { ReactNode } from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  Mic, 
  UserCircle, 
  Upload,
  Eye,
  AlertCircle,
  WifiOff,
  LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { colors } from 'utils/designSystem';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
  animated?: boolean;
}

/**
 * Generic empty state component
 * Displays helpful guidance when no data exists
 */
export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className = '',
  animated = true
}: EmptyStateProps) {
  return (
    <div 
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
      style={{ minHeight: '300px' }}
    >
      {Icon && (
        <div 
          className={`mb-4 ${animated ? 'animate-in fade-in zoom-in duration-500' : ''}`}
          style={{ color: colors.brand.purple }}
        >
          <Icon className="h-16 w-16 opacity-60" strokeWidth={1.5} />
        </div>
      )}
      
      <h3 
        className={`text-xl font-semibold mb-2 ${animated ? 'animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100' : ''}`}
        style={{ color: colors.text.primary }}
      >
        {title}
      </h3>
      
      {description && (
        <p 
          className={`text-sm max-w-md mb-6 ${animated ? 'animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200' : ''}`}
          style={{ color: colors.text.secondary }}
        >
          {description}
        </p>
      )}
      
      {action && (
        <Button
          onClick={action.onClick}
          className={`${animated ? 'animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300' : ''}`}
          style={{ 
            backgroundColor: colors.brand.purple,
            color: 'white'
          }}
        >
          {action.icon && <action.icon className="h-4 w-4 mr-2" />}
          {action.label}
        </Button>
      )}
    </div>
  );
}

/**
 * Identity stage empty state
 * Shown when user hasn't started configuring agent identity
 */
export function IdentityStageEmpty({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <EmptyState
      icon={UserCircle}
      title="Let's create your AI staff member!"
      description="Start by giving your agent a name, personality, and visual identity. This will be the foundation of your AI assistant."
      action={onGetStarted ? {
        label: 'Get Started',
        onClick: onGetStarted,
        icon: Sparkles
      } : undefined}
    />
  );
}

/**
 * Chat stage empty state
 * Shown when chat prompt is empty
 */
export function ChatStageEmpty({ onGeneratePrompt }: { onGeneratePrompt?: () => void }) {
  return (
    <EmptyState
      icon={MessageSquare}
      title="Design your chatbot's personality"
      description="The system prompt defines how your AI chatbot communicates with customers. Use the ✨ Generate Prompt button to create a professional starting point, or write your own custom instructions."
      action={onGeneratePrompt ? {
        label: '✨ Generate Prompt',
        onClick: onGeneratePrompt
      } : undefined}
    />
  );
}

/**
 * Voice stage empty state
 * Shown when voice configuration is incomplete
 */
export function VoiceStageEmpty({ onGeneratePrompt }: { onGeneratePrompt?: () => void }) {
  return (
    <EmptyState
      icon={Mic}
      title="Configure your voice assistant"
      description="Set up how your AI voice agent sounds and responds to phone calls. Start with the system prompt to define conversation behavior, then customize the greeting and voice model."
      action={onGeneratePrompt ? {
        label: '✨ Generate Voice Prompt',
        onClick: onGeneratePrompt
      } : undefined}
    />
  );
}

/**
 * Preview panel empty state
 * Shown when no preview data available
 */
export function PreviewPanelEmpty() {
  return (
    <div className="relative p-8 rounded-lg border-2 border-dashed" style={{ borderColor: colors.border.medium }}>
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <Eye className="h-32 w-32" style={{ color: colors.brand.purple }} />
      </div>
      
      <div className="relative text-center space-y-3" style={{ minHeight: '250px' }}>
        <div className="flex items-center justify-center mb-4">
          <div 
            className="w-32 h-48 rounded-lg border-2 border-dashed flex items-center justify-center animate-pulse"
            style={{ borderColor: colors.brand.purple }}
          >
            <UserCircle className="h-16 w-16 opacity-40" style={{ color: colors.brand.purple }} />
          </div>
        </div>
        
        <p className="text-sm font-medium" style={{ color: colors.text.secondary }}>
          Preview will appear here
        </p>
        <p className="text-xs" style={{ color: colors.text.tertiary }}>
          Complete the form to see your AI passport card
        </p>
      </div>
    </div>
  );
}

/**
 * Avatar gallery empty state
 * Shown when no avatars uploaded yet
 */
export function AvatarGalleryEmpty({ onUpload }: { onUpload?: () => void }) {
  return (
    <div 
      className="flex flex-col items-center justify-center p-12 rounded-lg border-2 border-dashed"
      style={{ 
        borderColor: colors.border.medium,
        backgroundColor: colors.background.tertiary,
        minHeight: '300px'
      }}
    >
      <Upload className="h-12 w-12 mb-4 opacity-40" style={{ color: colors.brand.purple }} />
      <h4 className="text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>
        No avatars uploaded yet
      </h4>
      <p className="text-sm mb-6 text-center max-w-sm" style={{ color: colors.text.secondary }}>
        Upload your first avatar image to create a visual identity for your AI staff member.
      </p>
      {onUpload && (
        <Button
          onClick={onUpload}
          style={{ backgroundColor: colors.brand.purple }}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Avatar
        </Button>
      )}
    </div>
  );
}

/**
 * No avatar selected state
 * Shows placeholder when avatar_url is null
 */
export function NoAvatarPlaceholder({ size = 80 }: { size?: number }) {
  return (
    <div 
      className="relative rounded-full flex items-center justify-center border-2 border-dashed group cursor-pointer hover:border-opacity-60 transition-all"
      style={{ 
        width: size,
        height: size,
        backgroundColor: colors.background.tertiary,
        borderColor: colors.brand.purple
      }}
    >
      <Upload className="absolute opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: colors.brand.purple }} />
      <UserCircle 
        className="group-hover:opacity-0 transition-opacity" 
        style={{ color: colors.brand.purple, opacity: 0.4 }}
        size={size * 0.6}
      />
    </div>
  );
}

/**
 * API Error state
 * Shown when API calls fail
 */
export function APIErrorState({ 
  message = 'Something went wrong', 
  onRetry 
}: { 
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="Unable to load data"
      description={message}
      action={onRetry ? {
        label: 'Try Again',
        onClick: onRetry
      } : undefined}
    />
  );
}

/**
 * Network offline state
 * Shown when connection is lost
 */
export function NetworkOfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="text-center p-8">
      <div className="inline-flex items-center justify-center mb-4">
        <div className="relative">
          <WifiOff className="h-16 w-16" style={{ color: colors.brand.purple, opacity: 0.6 }} />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        </div>
      </div>
      
      <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text.primary }}>
        Connection Lost
      </h3>
      
      <p className="text-sm mb-6" style={{ color: colors.text.secondary }}>
        Trying to reconnect...
      </p>
      
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          style={{ borderColor: colors.brand.purple, color: colors.brand.purple }}
        >
          Retry Now
        </Button>
      )}
    </div>
  );
}
