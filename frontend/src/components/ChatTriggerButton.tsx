import React, { useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { PremiumTheme } from '../utils/premiumTheme';
import { useChatStore, useChatConfig } from '../utils/chat-store';
import { useChatVisibility } from '../utils/useChatVisibility';
import { useCookieBannerStore } from '../utils/cookieBannerStore';

/**
 * ChatTriggerButton - Floating chat button trigger
 *
 * Features:
 * - Always visible in bottom-right corner when chat is closed
 * - Opens ChatLargeModal when clicked
 * - Shows bot avatar if configured (Phase 6: loads on mount)
 * - Smooth entrance/exit animations
 * - Hides when chat is open
 * - Self-monitors route visibility (hides on internal/staff pages)
 */
export function ChatTriggerButton() {
  const isChatAllowed = useChatVisibility();
  const isOpen = useChatStore((state) => state.isOpen);
  const openChat = useChatStore((state) => state.openChat);
  const loadSystemPrompt = useChatStore((state) => state.loadSystemPrompt);
  const config = useChatConfig();
  const isCookieBannerVisible = useCookieBannerStore((s) => s.isVisible);

  // Phase 6: Load agent config on mount to get avatar for widget button
  useEffect(() => {
    loadSystemPrompt();
  }, [loadSystemPrompt]);

  // Don't render on excluded routes (internal/staff pages)
  if (!isChatAllowed) return null;

  return (
    <AnimatePresence>
      {!isOpen && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className={`fixed right-6 z-50 transition-all duration-300 ${isCookieBannerVisible ? 'bottom-24' : 'bottom-6'}`}
        >
          <Button
            onClick={openChat}
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 p-0"
            style={{
              backgroundColor: PremiumTheme.colors.burgundy[500],
              color: 'white'
            }}
            aria-label="Open chat"
          >
            {config.botAvatar ? (
              <img 
                src={config.botAvatar} 
                alt={config.botName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <MessageCircle className="h-6 w-6" />
            )}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
