import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Mic, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PremiumTheme } from '../utils/premiumTheme';
import { useAgentConfig } from '../utils/useAgentConfig';
import { t } from '../utils/i18n';

interface InlineWelcomeCardProps {
  onQuickQuestion: (message: string) => void;
  onVoiceClick?: () => void;
  onDismiss: () => void;
}

const QUICK_QUESTIONS = [
  { label: "What's popular?", message: "What are your most popular dishes?" },
  { label: 'Vegan options?', message: 'What vegan options do you have?' },
  { label: 'Opening hours?', message: 'What are your opening hours today?' },
  { label: 'Spice levels?', message: 'Can you tell me about your spice levels?' },
];

/**
 * InlineWelcomeCard (Issue 10)
 *
 * Non-blocking welcome card rendered inline in the chat when there are no messages.
 * Replaces the modal WelcomeScreen to reduce friction.
 */
export function InlineWelcomeCard({ onQuickQuestion, onVoiceClick, onDismiss }: InlineWelcomeCardProps) {
  const { agentName, agentAvatar } = useAgentConfig();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-md w-full px-4 py-6"
    >
      {/* Agent greeting */}
      <div className="text-center space-y-3 mb-5">
        {/* Avatar */}
        <div className="mx-auto w-16 h-16 rounded-full overflow-hidden ring-2 ring-orange-500/30">
          {agentAvatar ? (
            <img src={agentAvatar} alt={agentName} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[600]}, ${PremiumTheme.colors.burgundy[800]})` }}
            >
              {agentName.charAt(0)}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold" style={{ color: PremiumTheme.colors.text.primary }}>
            {t('welcome.greeting', { agentName })}
          </h3>
          <p className="text-sm mt-1" style={{ color: PremiumTheme.colors.text.secondary }}>
            {t('welcome.subtitle')}
          </p>
        </div>
      </div>

      {/* Quick questions */}
      <div className="space-y-2 mb-4">
        <p className="text-xs px-1" style={{ color: PremiumTheme.colors.text.muted }}>
          {t('chat.tryAsking')}
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_QUESTIONS.map((q) => (
            <Button
              key={q.label}
              variant="outline"
              size="sm"
              onClick={() => onQuickQuestion(q.message)}
              className="h-8 px-3 text-xs transition-all duration-200 hover:scale-105"
              style={{
                borderColor: PremiumTheme.colors.border.medium,
                backgroundColor: PremiumTheme.colors.background.tertiary,
                color: PremiumTheme.colors.text.primary,
              }}
            >
              {q.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Voice CTA */}
      {onVoiceClick && (
        <button
          onClick={onVoiceClick}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
          style={{
            background: `${PremiumTheme.colors.dark[800]}80`,
            border: `1px solid ${PremiumTheme.colors.border.light}`,
            color: PremiumTheme.colors.text.secondary,
          }}
        >
          <Phone className="w-4 h-4 text-orange-400" />
          <span>Or call {agentName} to order by voice</span>
          <Mic className="w-3.5 h-3.5 text-orange-400" />
        </button>
      )}
    </motion.div>
  );
}
