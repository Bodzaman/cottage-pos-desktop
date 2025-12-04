import { PremiumTheme } from './premiumTheme';

/**
 * Centralized design tokens for menu item cards
 * Ensures visual consistency between single-item and variant cards
 * Part of "Immersive Elegance" design philosophy
 */
export const CardDesignTokens = {
  // Typography
  typography: {
    title: {
      size: 'text-2xl',
      weight: 'font-semibold',
      letterSpacing: 'tracking-normal',
      color: PremiumTheme.colors.text.primary,
    },
    variantLabel: {
      size: 'text-sm',
      weight: 'font-medium',
      color: PremiumTheme.colors.gold[400], // Gold accent for "Available in:"
    },
    description: {
      size: 'text-sm',
      color: PremiumTheme.colors.text.muted,
      lineClamp: 'line-clamp-2',
    },
    chipProteinName: {
      size: 'text-xs',
      weight: 'font-semibold',
      transform: 'uppercase',
      letterSpacing: 'tracking-wider',
    },
    chipPrice: {
      size: 'text-sm',
      weight: 'font-semibold',
      color: PremiumTheme.colors.gold[400], // Gold accent for prices in chips
    },
    displayPrice: {
      size: 'text-2xl',
      weight: 'font-bold',
      color: PremiumTheme.colors.gold[400], // Gold accent for main price
    },
  },

  // Colors & Gradients
  colors: {
    goldAccent: PremiumTheme.colors.gold[400],
    silverAccent: PremiumTheme.colors.silver[300],
    burgundyPrimary: PremiumTheme.colors.burgundy[500],
    burgundyGradient: `linear-gradient(135deg, ${PremiumTheme.colors.dark[850]} 0%, ${PremiumTheme.colors.dark[800]} 100%)`,
    chipGradient: `linear-gradient(135deg, ${PremiumTheme.colors.dark[850]} 0%, ${PremiumTheme.colors.dark[800]} 100%)`,
  },

  // Spacing & Layout
  spacing: {
    cardPadding: 'p-5',
    titleToLabel: 'mt-2',
    labelToChips: 'mt-3',
    chipRowGap: 'gap-2',
    bottomSectionPadding: 'pt-4 mt-auto',
    priceToControls: 'gap-3',
  },

  // Effects
  effects: {
    borderGlow: {
      silver: '0 0 20px rgba(192, 192, 192, 0.2)',
      burgundy: '0 0 20px rgba(139, 21, 56, 0.3)',
      gold: '0 0 20px rgba(229, 229, 229, 0.2)',
    },
    imageGradient: 'linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.2) 50%, transparent 100%)',
    hoverShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },

  // Border Radii
  borderRadius: {
    card: 'rounded-2xl',
    chip: 'rounded-xl',
    button: 'rounded-lg',
  },
};
