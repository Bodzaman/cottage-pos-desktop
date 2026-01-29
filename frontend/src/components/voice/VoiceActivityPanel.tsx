import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';
import { InlineMenuCard } from 'components/InlineMenuCard';
import { ThinkingIndicator } from 'components/shared/ThinkingIndicator';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  image_url?: string;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
}

interface VoiceActivityPanelProps {
  isSearching?: boolean;
  searchQuery?: string;
  menuItems?: MenuItem[];
  isThinking?: boolean;
  orderMode?: string;
}

/**
 * VoiceActivityPanel - Visual activity container for voice calls
 *
 * Features:
 * - Shows menu cards when AI searches
 * - Search state indicator
 * - Thinking indicator
 * - Staggered card animations
 */
export function VoiceActivityPanel({
  isSearching = false,
  searchQuery,
  menuItems = [],
  isThinking = false,
  orderMode = 'collection',
}: VoiceActivityPanelProps) {
  const hasContent = isSearching || isThinking || menuItems.length > 0;

  if (!hasContent) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto px-4"
    >
      {/* Search indicator */}
      {isSearching && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 justify-center mb-3 text-muted-foreground"
        >
          <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
          <span className="text-sm">
            Searching{searchQuery ? ` for "${searchQuery}"` : '...'}
          </span>
        </motion.div>
      )}

      {/* Thinking indicator */}
      {isThinking && !isSearching && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-3"
        >
          <ThinkingIndicator variant="dots" context="thinking" />
        </motion.div>
      )}

      {/* Menu cards grid */}
      {menuItems.length > 0 && (
        <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {menuItems.slice(0, 4).map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: index * 0.08,
                type: 'spring',
                stiffness: 300,
                damping: 25,
              }}
            >
              <InlineMenuCard
                menuItemId={item.id}
                orderMode={orderMode}
                compact
              />
            </motion.div>
          ))}
          {menuItems.length > 4 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-center text-muted-foreground py-1"
            >
              +{menuItems.length - 4} more items found
            </motion.p>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default VoiceActivityPanel;
