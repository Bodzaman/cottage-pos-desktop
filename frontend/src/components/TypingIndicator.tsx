import React from 'react';
import { Bot } from 'lucide-react';
import { PremiumTheme } from 'utils/premiumTheme';

/**
 * Animated typing indicator shown while AI is processing
 * Provides visual feedback that the system is "thinking"
 */
export function TypingIndicator() {
  return (
    <div className="flex items-start space-x-3">
      {/* Bot Avatar */}
      <div className="flex-shrink-0 mt-1">
        <div 
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ backgroundColor: PremiumTheme.colors.burgundy[500] }}
        >
          <Bot className="w-4 h-4 text-white" />
        </div>
      </div>
      
      {/* Animated Dots */}
      <div 
        className="px-4 py-2.5 rounded-2xl shadow-sm max-w-[75%]"
        style={{ backgroundColor: PremiumTheme.colors.background.tertiary }}
      >
        <div className="flex space-x-1">
          <span 
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ 
              backgroundColor: PremiumTheme.colors.text.muted,
              animationDelay: '0ms',
              animationDuration: '1000ms'
            }}
          />
          <span 
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ 
              backgroundColor: PremiumTheme.colors.text.muted,
              animationDelay: '150ms',
              animationDuration: '1000ms'
            }}
          />
          <span 
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ 
              backgroundColor: PremiumTheme.colors.text.muted,
              animationDelay: '300ms',
              animationDuration: '1000ms'
            }}
          />
        </div>
      </div>
    </div>
  );
}
