import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { PremiumTheme } from '../utils/premiumTheme';
import { useChatStore, useChatConfig } from '../utils/chat-store';

/**
 * ChatTriggerButton - Floating chat button trigger
 * 
 * Features:
 * - Always visible in bottom-right corner when chat is closed
 * - Opens ChatLargeModal when clicked
 * - Shows bot avatar if configured
 * - Smooth entrance/exit animations
 * - Hides when chat is open
 */
export function ChatTriggerButton() {
  const isOpen = useChatStore((state) => state.isOpen);
  const openChat = useChatStore((state) => state.openChat);
  const config = useChatConfig();

  return (
    <AnimatePresence>
      {!isOpen && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="fixed bottom-6 right-6 z-50"
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
