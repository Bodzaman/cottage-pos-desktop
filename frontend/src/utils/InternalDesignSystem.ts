/**
 * Internal Design System (Staff/Admin)
 * ===========================================
 * Primary Color: Purple (#7C3AED)
 * Usage: POS, Admin, KDS, Staff Portal
 *
 * This is the consolidated design system for all internal/staff-facing pages.
 * It uses CSS variables defined in index.css and provides TypeScript exports
 * for backward compatibility with existing components.
 */

// ===========================================
// CSS Variable References (for TypeScript)
// ===========================================
export const InternalTheme = {
  colors: {
    primary: {
      DEFAULT: 'rgb(var(--internal-primary))',
      light: 'rgb(var(--internal-primary-light))',
      dark: 'rgb(var(--internal-primary-dark))',
      // Hex values for non-CSS contexts (charts, canvas, etc.)
      hex: '#7C3AED',
      hexLight: '#A78BFA',
      hexDark: '#5B21B6',
    },
    background: {
      primary: 'rgb(var(--bg-primary))',
      secondary: 'rgb(var(--bg-secondary))',
      tertiary: 'rgb(var(--bg-tertiary))',
      elevated: 'rgb(var(--bg-elevated))',
      // Hex fallbacks
      hexPrimary: '#0F0F0F',
      hexSecondary: '#1A1A1A',
      hexTertiary: '#1E1E1E',
    },
    text: {
      primary: 'rgb(var(--text-primary))',
      secondary: 'rgb(var(--text-secondary))',
      muted: 'rgb(var(--text-muted))',
      disabled: 'rgb(var(--text-disabled))',
    },
    status: {
      success: 'rgb(var(--status-success))',
      warning: 'rgb(var(--status-warning))',
      error: 'rgb(var(--status-error))',
      info: 'rgb(var(--status-info))',
      // Hex fallbacks
      hexSuccess: '#10B981',
      hexWarning: '#F59E0B',
      hexError: '#EF4444',
      hexInfo: '#3B82F6',
    },
  },

  // Tailwind class helpers for common patterns
  classes: {
    // Buttons
    buttonPrimary: 'bg-internal-primary hover:bg-internal-primary-dark text-white shadow-internal-glow',
    buttonSecondary: 'bg-surface-tertiary hover:bg-surface-elevated text-white border border-white/10',
    buttonGhost: 'bg-transparent hover:bg-internal-primary/10 text-internal-primary',

    // Cards
    card: 'bg-surface-secondary/60 backdrop-blur-md border border-white/5 rounded-xl shadow-lg',
    cardAccent: 'bg-surface-secondary/60 backdrop-blur-md border border-internal-primary/30 rounded-xl shadow-internal-glow',

    // Inputs
    input: 'bg-surface-tertiary border border-white/10 rounded-lg focus:border-internal-primary focus:ring-1 focus:ring-internal-primary',

    // Text
    textGradient: 'bg-gradient-to-r from-white to-internal-primary-light bg-clip-text text-transparent',

    // Admin surfaces (consistent glass treatments)
    surfacePanel: 'bg-[rgba(26,26,26,0.6)] backdrop-blur-xl border border-white/[0.05] rounded-xl shadow-lg',
    surfaceCard: 'bg-[rgba(26,26,26,0.8)] backdrop-blur-md border border-white/[0.07] rounded-lg',
    surfaceInset: 'bg-[rgba(15,15,15,0.4)] border border-white/[0.05] rounded-lg',
    surfaceToolbar: 'bg-[rgba(15,15,15,0.85)] backdrop-blur-2xl border-b border-white/[0.05]',

    // Focus ring (purple, offset for dark backgrounds)
    focusRingInternal: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F0F]',

    // Motion tokens (respect reduced-motion via Tailwind's motion-safe)
    hoverLift: 'motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:-translate-y-[1px]',
    pressedScale: 'motion-safe:active:scale-[0.97] motion-safe:transition-transform motion-safe:duration-100',
  },
};

// ===========================================
// BACKWARD COMPATIBILITY EXPORTS
// These maintain the same API as the original QSAIDesign.ts
// ===========================================

// Vignetting effect for focusing attention on content areas
export const vignette = {
  background: `radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.6) 100%)`,
  pointerEvents: 'none',
  position: 'absolute',
  inset: 0,
  zIndex: 1,
  opacity: 0.7
};

// Premium luxury styles with purple accent
export const luxury = {
  white: {
    base: '#FFFFFF',
    silver: '#F5F5F7',
    pearl: '#F0F0F5',
    glow: {
      soft: '0 0 15px rgba(255, 255, 255, 0.15)',
      medium: '0 0 20px rgba(255, 255, 255, 0.25)',
      strong: '0 0 25px rgba(255, 255, 255, 0.35)'
    }
  },
  black: {
    deep: '#0A0A0A',
    charcoal: '#121212',
    slate: '#1A1A1A',
    smoke: '#232323'
  },
  accents: {
    silver: '#D1D1D6',
    platinum: '#E5E5E9',
    champagne: '#F8F3E6',
    graphite: '#333338',
    purple: '#5B21B6'
  }
};

// Main color palette
export const colors = {
  background: {
    base: '#0F0F0F', // Alias for primary
    primary: '#0F0F0F',
    secondary: '#1A1A1A',
    tertiary: '#1E1E1E',
    dark: '#0A0A0A',
    panel: '#1A1A1A',
    card: 'rgba(30, 30, 30, 0.95)',
    highlight: '#242424'
  },
  purple: {
    primary: '#7C3AED',
    primaryTransparent: 'rgba(124, 58, 237, 0.8)',
    light: '#A78BFA',
    dark: '#5B21B6',
    glow: 'rgba(124, 58, 237, 0.3)'
  },
  accent: {
    gold: '#7C3AED',
    magenta: '#A78BFA',
    turquoise: '#5B21B6',
    gold_light: 'rgba(124, 58, 237, 0.8)',
    magenta_light: 'rgba(167, 139, 250, 0.8)',
    turquoise_light: 'rgba(91, 33, 182, 0.8)',
    secondary: '#A78BFA', // Secondary accent color
  },
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.87)',
    tertiary: 'rgba(255, 255, 255, 0.6)',
    muted: 'rgba(255, 255, 255, 0.5)',
    disabled: 'rgba(255, 255, 255, 0.38)',
    accent: '#7C3AED',
    placeholder: 'rgba(255, 255, 255, 0.4)', // Alias for disabled
  },
  border: {
    subtle: 'rgba(255, 255, 255, 0.05)',
    light: 'rgba(255, 255, 255, 0.07)',
    medium: 'rgba(255, 255, 255, 0.1)',
    strong: 'rgba(255, 255, 255, 0.15)',
    accent: 'rgba(124, 58, 237, 0.3)',
    primary: 'rgba(124, 58, 237, 0.3)', // Primary accent border
    secondary: 'rgba(255, 255, 255, 0.08)', // Backward compatibility alias
  },
  // Brand colors for backward compatibility
  brand: {
    purple: '#7C3AED',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  status: {
    success: '#10B981',
    warning: '#F5F5F7',
    error: '#EF4444',
    info: '#3B82F6',
    active: '#7C3AED',
    popular: '#7C3AED',
    special: '#7C3AED',
    staging: '#FCD34D',
    danger: '#EF4444',
  }
};

// Global color definitions (prevents circular references)
export const globalColors = {
  ...colors,
  burgundy: {
    primary: colors.purple.primary,
    primaryTransparent: colors.purple.primaryTransparent,
    light: colors.purple.light,
    dark: colors.purple.dark,
    glow: colors.purple.glow
  },
  // Primary and secondary color scales for VisualCanvas and other components
  primary: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#7C3AED',
    600: '#6D28D9',
    700: '#5B21B6',
    800: '#4C1D95',
    900: '#3B0764',
  },
  secondary: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  // Gray scale for UI elements
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  // Additional color aliases for backward compatibility
  blue: '#3B82F6',
  green: '#10B981', // Alias for success
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

// Export as QSAITheme for semantic naming
export const QSAITheme = globalColors;

// POS Glass Panel - vibrant glassmorphism matching ResponsivePOSShell
export const posGlassPanel = {
  background: 'linear-gradient(135deg, rgba(15,15,15,0.98) 0%, rgba(25,25,25,0.95) 100%)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(124,93,250,0.15)',
  boxShadow: '0 12px 30px -8px rgba(0,0,0,0.6)',
};

// Panel styling
export const panelStyle = {
  background: colors.background.panel,
  border: '1px solid rgba(255, 255, 255, 0.03)',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  borderRadius: '0.5rem',
  transition: 'all 0.2s ease'
};

// Common style definitions
export const styles = {
  frostedGlassStyle: {
    background: '#1E1E1E',
    backdropFilter: 'blur(4px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.25)',
    border: `1px solid rgba(255, 255, 255, 0.03)`,
    borderBottom: `1px solid rgba(124, 93, 250, 0.2)`
  },
  glassCard: {
    background: '#1E1E1E',
    backdropFilter: 'blur(4px)',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
    border: `1px solid rgba(255, 255, 255, 0.03)`
  },
  gradientText: (intensity: 'subtle' | 'medium' | 'strong' = 'medium') => {
    const colorMap = {
      subtle: ['#F0F0F5', '#FFFFFF'],
      medium: ['#E5E5E9', '#FFFFFF'],
      strong: ['#D1D1D6', '#FFFFFF'],
    };
    const [color1, color2] = colorMap[intensity];
    return {
      backgroundImage: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: '0 2px 4px rgba(0,0,0,0.2)',
      letterSpacing: '0.02em',
    };
  },
  purpleGradientText: {
    backgroundImage: `linear-gradient(to right, #FFFFFF, #EDECFF, #C7C2FF)`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 0 30px rgba(124, 93, 250, 0.2)',
    letterSpacing: '0.02em',
  },
  gradientButton: (intensity: 'subtle' | 'medium' | 'strong' = 'medium') => {
    const colorMap = {
      subtle: ['#1A1A1A', '#232323'],
      medium: ['#121212', '#1A1A1A'],
      strong: ['#0A0A0A', '#121212'],
    };
    const [color1, color2] = colorMap[intensity];
    return {
      background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
      border: '1px solid rgba(124, 93, 250, 0.2)',
      boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
      transition: 'all 0.3s ease'
    };
  },
  purpleAccentGradient: {
    background: `linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(124, 93, 250, 0.2) 100%)`,
    border: '1px solid rgba(124, 93, 250, 0.3)',
    boxShadow: '0 4px 12px rgba(124, 93, 250, 0.15)'
  },
  gridBackground: {
    background: 'linear-gradient(135deg, #121212 0%, #151515 100%)',
    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.01) 1px, transparent 1px)',
    backgroundSize: '25px 25px',
    position: 'relative' as const
  },
  vignette: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.5) 100%)',
    pointerEvents: 'none' as const,
    zIndex: 1
  },
  // Button styles for backward compatibility
  button: {
    primary: {
      background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
      border: '1px solid rgba(124, 58, 237, 0.3)',
      boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
      borderRadius: '0.5rem',
      transition: 'all 0.2s ease',
    },
    secondary: {
      background: 'linear-gradient(135deg, #1E1E1E 0%, #2A2A2A 100%)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
      borderRadius: '0.5rem',
      transition: 'all 0.2s ease',
    },
    ghost: {
      background: 'transparent',
      border: '1px solid transparent',
      borderRadius: '0.5rem',
      transition: 'all 0.2s ease',
    },
  },
  // Input styles for backward compatibility
  input: {
    background: '#1E1E1E',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '0.5rem',
    color: '#FFFFFF',
    padding: '0.5rem 1rem',
    transition: 'all 0.2s ease',
  },
};

// Dynamic effects with purple accents
export const effects = {
  // Neumorphism effect for cards
  neuMorphism: {
    boxShadow: '8px 8px 16px rgba(0, 0, 0, 0.4), -4px -4px 12px rgba(255, 255, 255, 0.05)',
  },
  innerGlow: (intensity: 'subtle' | 'medium' | 'strong' = 'medium') => {
    const opacityMap = { subtle: 0.1, medium: 0.15, strong: 0.2 };
    return `inset 0 0 20px rgba(124, 93, 250, ${opacityMap[intensity]})`;
  },
  outerGlow: (intensity: 'subtle' | 'medium' | 'strong' = 'medium') => {
    const opacityMap = { subtle: 0.07, medium: 0.12, strong: 0.18 };
    return `0 0 15px rgba(124, 93, 250, ${opacityMap[intensity]})`;
  },
  textShadow: (intensity: 'subtle' | 'medium' | 'strong' = 'medium') => {
    const shadowMap = {
      subtle: '0 1px 2px rgba(0, 0, 0, 0.5)',
      medium: '0 1px 3px rgba(0, 0, 0, 0.7)',
      strong: '0 2px 4px rgba(0, 0, 0, 0.9)'
    };
    return shadowMap[intensity];
  },
  button: {
    hover: {
      transform: 'translateY(-1px)',
      boxShadow: '0 7px 14px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(124, 93, 250, 0.15)'
    },
    active: {
      transform: 'translateY(1px)',
      boxShadow: '0 3px 6px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(124, 93, 250, 0.1)'
    },
    selected: {
      boxShadow: '0 0 0 2px rgba(124, 93, 250, 0.5), inset 0 0 10px rgba(124, 93, 250, 0.1)'
    }
  },
  status: {
    selected: 'rgba(124, 93, 250, 0.8)',
    popular: 'rgba(124, 93, 250, 0.8)',
    special: 'rgba(124, 93, 250, 0.8)',
    accent: 'rgba(124, 93, 250, 0.8)'
  }
};

// Indian-inspired geometric patterns (monochromatic)
export const indianPatterns = {
  rangoli: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M30 30h30v30H30z' fill='white' fill-opacity='0.03'/%3E%3Cpath d='M0 30h30v30H0z' fill='white' fill-opacity='0.02'/%3E%3Cpath d='M30 0h30v30H30z' fill='white' fill-opacity='0.03'/%3E%3Cpath d='M0 0h30v30H0z' fill='white' fill-opacity='0.02'/%3E%3C/g%3E%3C/svg%3E")`,
  jali: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Ccircle cx='20' cy='20' r='10' stroke='white' stroke-opacity='0.04' stroke-width='1'/%3E%3Ccircle cx='20' cy='20' r='5' stroke='white' stroke-opacity='0.03' stroke-width='1'/%3E%3C/g%3E%3C/svg%3E")`,
  paisley: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 45 C35 35, 20 10, 40 0 C60 10, 45 35, 40 45' stroke='white' stroke-opacity='0.04' fill='none'/%3E%3C/svg%3E")`,
  opacity: 0.05,
};

// Helper function
function hexToRgb(hex: string): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export default InternalTheme;
