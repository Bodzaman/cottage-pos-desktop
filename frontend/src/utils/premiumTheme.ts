/**
 * premiumTheme.ts - REDIRECT FILE
 * ===========================================
 * This file now re-exports from CustomerDesignSystem.ts
 *
 * The design system has been consolidated. PremiumTheme is now part of
 * the CustomerDesignSystem which is the single source of truth for
 * customer/public page styling.
 *
 * For new code, prefer importing directly from:
 *   import { PremiumTheme, CustomerTheme } from './CustomerDesignSystem';
 *
 * This file is maintained for backward compatibility.
 */

// Re-export PremiumTheme and helper functions from the consolidated customer design system
export { PremiumTheme, getSpiceColor, getSpiceEmoji } from './CustomerDesignSystem';

// Default export
export { PremiumTheme as default } from './CustomerDesignSystem';
