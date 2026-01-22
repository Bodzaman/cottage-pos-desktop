/**
 * authTheme.ts - REDIRECT FILE
 * ===========================================
 * This file now re-exports from CustomerDesignSystem.ts
 *
 * The design system has been consolidated. AuthTheme is now part of
 * the CustomerDesignSystem which is the single source of truth for
 * customer/public page styling.
 *
 * For new code, prefer importing directly from:
 *   import { AuthTheme, CustomerTheme } from './CustomerDesignSystem';
 *
 * This file is maintained for backward compatibility.
 */

// Re-export AuthTheme from the consolidated customer design system
export { AuthTheme } from './CustomerDesignSystem';
