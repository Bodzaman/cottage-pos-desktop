/**
 * QSAIDesign.ts - REDIRECT FILE
 * ===========================================
 * This file now re-exports from InternalDesignSystem.ts
 *
 * The design system has been consolidated. All exports from this file
 * come from the new InternalDesignSystem.ts which is the single source
 * of truth for internal/staff page styling.
 *
 * For new code, prefer importing directly from:
 *   import { InternalTheme, colors } from './InternalDesignSystem';
 *
 * This file is maintained for backward compatibility.
 */

// Re-export everything from the consolidated internal design system
export {
  // New API
  InternalTheme,

  // Legacy API (backward compatible)
  vignette,
  luxury,
  colors,
  globalColors,
  QSAITheme,
  panelStyle,
  styles,
  effects,
  indianPatterns,
} from './InternalDesignSystem';

// Default export
export { default } from './InternalDesignSystem';
