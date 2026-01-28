import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PremiumTheme } from '../utils/premiumTheme';
import type { ChatMessage } from '../utils/chat-store';

interface QuickReplyOption {
  id: string;
  label: string;
  message: string;
}

interface ContextualQuickReplyChipsProps {
  messages: ChatMessage[];
  onReplySelect: (message: string) => void;
  disabled?: boolean;
  className?: string;
}

// Default chips shown when no context is available
const DEFAULT_CHIPS: QuickReplyOption[] = [
  { id: 'order', label: 'Place an order', message: 'I would like to place an order.' },
  { id: 'recommend', label: 'What do you recommend?', message: "What dishes do you recommend?" },
  { id: 'delivery', label: 'Check delivery area', message: 'Do you deliver to my area?' },
  { id: 'hours', label: 'Are you open?', message: 'What are your opening hours today?' },
];

// Context-based chip sets keyed by detected topic
const CONTEXT_CHIPS: Record<string, QuickReplyOption[]> = {
  chicken: [
    { id: 'chicken-tikka', label: 'Chicken Tikka Masala', message: 'Tell me about the Chicken Tikka Masala.' },
    { id: 'chicken-korma', label: 'Chicken Korma', message: "What's the Chicken Korma like?" },
    { id: 'more-chicken', label: 'More chicken dishes', message: 'What other chicken dishes do you have?' },
    { id: 'spice-level', label: 'Spice options?', message: 'What spice levels can I choose from?' },
  ],
  lamb: [
    { id: 'lamb-rogan', label: 'Lamb Rogan Josh', message: 'Tell me about the Lamb Rogan Josh.' },
    { id: 'lamb-bhuna', label: 'Lamb Bhuna', message: "What's the Lamb Bhuna like?" },
    { id: 'more-lamb', label: 'More lamb dishes', message: 'What other lamb dishes do you have?' },
    { id: 'spice-level', label: 'Spice options?', message: 'What spice levels can I choose from?' },
  ],
  vegetarian: [
    { id: 'veg-options', label: 'All veggie options', message: 'Show me all your vegetarian dishes.' },
    { id: 'paneer', label: 'Paneer dishes', message: 'What paneer dishes do you have?' },
    { id: 'vegan', label: 'Vegan options?', message: 'Which dishes are vegan?' },
    { id: 'sides', label: 'Veggie sides', message: 'What vegetarian side dishes do you have?' },
  ],
  vegan: [
    { id: 'vegan-mains', label: 'Vegan mains', message: 'What vegan main courses do you have?' },
    { id: 'vegan-sides', label: 'Vegan sides', message: 'What vegan side dishes are available?' },
    { id: 'allergens', label: 'Allergen info', message: 'Can you provide allergen information?' },
    { id: 'veg-options', label: 'Vegetarian too', message: 'Show me vegetarian options as well.' },
  ],
  spicy: [
    { id: 'mild', label: 'Mild dishes', message: 'What mild dishes do you have?' },
    { id: 'medium', label: 'Medium heat', message: 'Show me medium spice dishes.' },
    { id: 'hot', label: 'Hottest dishes', message: "What's your spiciest dish?" },
    { id: 'customize', label: 'Adjust spice?', message: 'Can I customize the spice level?' },
  ],
  ordering: [
    { id: 'view-cart', label: 'View my cart', message: "What's in my cart?" },
    { id: 'add-drinks', label: 'Add drinks', message: 'What drinks do you have?' },
    { id: 'add-sides', label: 'Add sides', message: 'What side dishes can I add?' },
    { id: 'checkout', label: 'Ready to order', message: "I'm ready to checkout." },
  ],
  delivery: [
    { id: 'delivery-time', label: 'Delivery time?', message: 'How long does delivery take?' },
    { id: 'delivery-fee', label: 'Delivery fee?', message: 'Is there a delivery fee?' },
    { id: 'min-order', label: 'Minimum order?', message: 'Is there a minimum order for delivery?' },
    { id: 'collection', label: 'Collection instead', message: 'Can I collect my order instead?' },
  ],
  cart: [
    { id: 'add-more', label: 'Add more items', message: 'I want to add more items to my order.' },
    { id: 'remove-item', label: 'Remove something', message: 'I want to remove an item from my cart.' },
    { id: 'checkout', label: 'Checkout', message: "I'm ready to checkout." },
    { id: 'clear-cart', label: 'Start over', message: 'Please clear my cart.' },
  ],
};

// Keywords that trigger each context
const CONTEXT_KEYWORDS: Record<string, string[]> = {
  chicken: ['chicken', 'tikka', 'korma', 'tandoori chicken', 'butter chicken'],
  lamb: ['lamb', 'rogan', 'gosht', 'bhuna lamb', 'keema'],
  vegetarian: ['vegetarian', 'veggie', 'paneer', 'no meat', 'saag'],
  vegan: ['vegan', 'dairy free', 'plant based', 'no dairy'],
  spicy: ['spicy', 'spice', 'hot', 'mild', 'heat', 'chilli', 'pepper'],
  ordering: ['order', 'add to cart', 'added', 'cart', 'i want', "i'd like", 'please add'],
  delivery: ['delivery', 'deliver', 'postcode', 'collection', 'pickup'],
  cart: ['in my cart', 'my order', 'checkout', 'total', 'remove', 'clear cart'],
};

/**
 * Detect the conversation context from the last few messages.
 */
function detectContext(messages: ChatMessage[]): string | null {
  // Look at last 4 messages for context
  const recentText = messages
    .slice(-4)
    .map(m => m.content.toLowerCase())
    .join(' ');

  // Check each context by keyword match, return the first with highest relevance
  let bestContext: string | null = null;
  let bestScore = 0;

  for (const [context, keywords] of Object.entries(CONTEXT_KEYWORDS)) {
    const score = keywords.reduce((acc, kw) => {
      return acc + (recentText.includes(kw) ? 1 : 0);
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      bestContext = context;
    }
  }

  return bestScore > 0 ? bestContext : null;
}

/**
 * ContextualQuickReplyChips (Issue 11)
 *
 * Shows context-aware quick reply suggestions based on conversation history.
 * Priority: AI suggestedActions > context-detected > defaults.
 */
export function ContextualQuickReplyChips({
  messages,
  onReplySelect,
  disabled = false,
  className = '',
}: ContextualQuickReplyChipsProps) {
  const chips = useMemo(() => {
    // Priority 1: Check if the last bot message has suggestedActions
    const lastBotMessage = [...messages].reverse().find(m => m.sender === 'bot' && !m.isTyping && !m.isStreaming);
    if (lastBotMessage?.suggestedActions && lastBotMessage.suggestedActions.length > 0) {
      return lastBotMessage.suggestedActions.map(a => ({
        id: a.id,
        label: a.label,
        message: a.message,
      }));
    }

    // Priority 2: Context-detected chips
    if (messages.length > 0) {
      const context = detectContext(messages);
      if (context && CONTEXT_CHIPS[context]) {
        return CONTEXT_CHIPS[context];
      }
    }

    // Priority 3: Default chips
    return DEFAULT_CHIPS;
  }, [messages]);

  return (
    <div className={`py-2 ${className}`}>
      <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto scrollbar-thin">
        {chips.map((chip) => (
          <Button
            key={chip.id}
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onReplySelect(chip.message)}
            className="h-8 px-3 text-xs whitespace-nowrap flex-shrink-0 transition-all duration-200 hover:scale-105"
            style={{
              borderColor: PremiumTheme.colors.border.medium,
              backgroundColor: disabled
                ? PremiumTheme.colors.background.secondary
                : PremiumTheme.colors.background.tertiary,
              color: disabled
                ? PremiumTheme.colors.text.muted
                : PremiumTheme.colors.text.primary,
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = PremiumTheme.colors.burgundy[500];
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.borderColor = PremiumTheme.colors.burgundy[500];
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = PremiumTheme.colors.background.tertiary;
                e.currentTarget.style.color = PremiumTheme.colors.text.primary;
                e.currentTarget.style.borderColor = PremiumTheme.colors.border.medium;
              }
            }}
          >
            {chip.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
