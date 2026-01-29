import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bot } from 'lucide-react';

interface VoiceTranscriptBubbleProps {
  type: 'user' | 'ai';
  text: string;
  isFinal?: boolean;
  agentName?: string;
  agentAvatar?: string;
}

/**
 * VoiceTranscriptBubble - Live speech bubbles during voice call
 *
 * Features:
 * - Shows real-time user speech (partial transcripts)
 * - Shows AI response as it speaks
 * - Visual distinction between user and AI
 * - Animated entrance/exit
 */
export function VoiceTranscriptBubble({
  type,
  text,
  isFinal = false,
  agentName = 'AI',
  agentAvatar,
}: VoiceTranscriptBubbleProps) {
  if (!text) return null;

  const isUser = type === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`flex items-start gap-2 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gradient-to-br from-orange-500 to-red-600 text-white'
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : agentAvatar ? (
          <img
            src={agentAvatar}
            alt={agentName}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`px-4 py-2 rounded-2xl ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-md'
            : 'bg-muted text-foreground rounded-bl-md'
        } ${!isFinal ? 'animate-pulse' : ''}`}
      >
        <p className="text-sm leading-relaxed">
          {text}
          {!isFinal && (
            <span className="inline-block w-1 h-4 ml-1 bg-current animate-blink" />
          )}
        </p>
      </div>
    </motion.div>
  );
}

export default VoiceTranscriptBubble;
