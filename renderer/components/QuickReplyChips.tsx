import React from 'react';
import { Button } from '@/components/ui/button';
import { PremiumTheme } from '../utils/premiumTheme';

interface QuickReplyOption {
  id: string;
  label: string;
  message: string;
  icon?: string;
}

interface QuickReplyChipsProps {
  onReplySelect: (message: string) => void;
  disabled?: boolean;
  className?: string;
}

// Customer service focused quick replies
const QUICK_REPLY_OPTIONS: QuickReplyOption[] = [
  {
    id: 'place-order',
    label: 'Place an order',
    message: 'I would like to place an order. Can you guide me through the process?',
    icon: '🛒'
  },
  {
    id: 'recommendations',
    label: 'What do you recommend?',
    message: 'What dishes do you recommend? I\'d love to hear about your popular items and chef\'s specialties.',
    icon: '⭐'
  },
  {
    id: 'delivery-area',
    label: 'Check delivery area',
    message: 'Do you deliver to my area? I need to check if delivery is available for my postcode.',
    icon: '🚚'
  },
  {
    id: 'opening-hours',
    label: 'Are you open?',
    message: 'Are you currently open? What are your opening hours today?',
    icon: '🕒'
  },
  {
    id: 'payment-methods',
    label: 'Payment methods',
    message: 'What payment methods do you accept? Can I pay by card or cash?',
    icon: '💳'
  },
  {
    id: 'dietary-needs',
    label: 'Special dietary needs',
    message: 'I have special dietary requirements. Can you help me find suitable dishes? I need information about allergens and dietary options.',
    icon: '🥗'
  }
];

export function QuickReplyChips({ onReplySelect, disabled = false, className = '' }: QuickReplyChipsProps) {
  const handleChipClick = (option: QuickReplyOption) => {
    if (disabled) return;
    onReplySelect(option.message);
  };

  return (
    <div className={`py-3 ${className}`}>
      <div className="text-xs mb-2 px-1" style={{ color: PremiumTheme.colors.text.muted }}>
        Quick questions:
      </div>
      
      <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto scrollbar-thin">
        {QUICK_REPLY_OPTIONS.map((option) => (
          <Button
            key={option.id}
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => handleChipClick(option)}
            className="h-8 px-3 text-xs whitespace-nowrap flex-shrink-0 transition-all duration-200 hover:scale-105"
            style={{
              borderColor: PremiumTheme.colors.border.medium,
              backgroundColor: disabled 
                ? PremiumTheme.colors.background.secondary
                : PremiumTheme.colors.background.tertiary,
              color: disabled 
                ? PremiumTheme.colors.text.muted
                : PremiumTheme.colors.text.primary,
              '--hover-bg': PremiumTheme.colors.burgundy[500],
              '--hover-text': '#FFFFFF'
            } as React.CSSProperties}
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
            {option.icon && (
              <span className="mr-1.5 text-sm">{option.icon}</span>
            )}
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default QuickReplyChips;
