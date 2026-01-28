import React, { useState } from 'react';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PremiumTheme } from '../utils/premiumTheme';

interface EmojiPickerPopoverProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

const EMOJI_CATEGORIES = [
  {
    label: 'Food',
    emojis: ['🍛', '🍚', '🥘', '🌶️', '🧄', '🍗', '🥩', '🍖', '🥗', '🍞', '🫓', '🧈', '🍲', '🥙', '🫕'],
  },
  {
    label: 'Reactions',
    emojis: ['👍', '❤️', '😋', '🤤', '😍', '🔥', '⭐', '🎉', '👏', '💯', '✅', '🙏'],
  },
  {
    label: 'Common',
    emojis: ['😊', '😄', '🙂', '😃', '👋', '🤔', '😅', '😂', '🥰', '🤩', '😎', '👀'],
  },
];

/**
 * EmojiPickerPopover (Issue 20)
 *
 * Lightweight emoji picker with food and reaction emojis.
 * No external dependencies.
 */
export function EmojiPickerPopover({ onEmojiSelect, disabled }: EmojiPickerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="h-8 w-8 rounded-full hover:bg-orange-500/10"
        style={{ color: PremiumTheme.colors.text.muted }}
        title="Add emoji"
        aria-label="Open emoji picker"
      >
        <Smile className="h-5 w-5" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />

          {/* Picker */}
          <div
            className="absolute bottom-10 right-0 z-40 rounded-xl shadow-xl p-3 w-64 max-h-48 overflow-y-auto"
            style={{
              background: PremiumTheme.colors.background.secondary,
              border: `1px solid ${PremiumTheme.colors.border.medium}`,
            }}
          >
            {EMOJI_CATEGORIES.map((category) => (
              <div key={category.label} className="mb-2 last:mb-0">
                <p className="text-xs mb-1 px-1" style={{ color: PremiumTheme.colors.text.muted }}>
                  {category.label}
                </p>
                <div className="flex flex-wrap gap-1">
                  {category.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiClick(emoji)}
                      className="w-8 h-8 flex items-center justify-center rounded hover:bg-orange-500/20 transition-colors text-lg"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
