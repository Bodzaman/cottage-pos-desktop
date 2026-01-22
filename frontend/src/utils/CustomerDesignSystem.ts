/**
 * Customer Design System (Public-facing)
 * ===========================================
 * Primary Color: Burgundy (#8B1538)
 * Usage: Home, About, Login, Contact, Customer Portal
 *
 * This is the consolidated design system for all customer/public-facing pages.
 * It uses CSS variables defined in index.css and provides TypeScript exports
 * for backward compatibility with existing components.
 */

// ===========================================
// CSS Variable References (for TypeScript)
// ===========================================
export const CustomerTheme = {
  colors: {
    primary: {
      DEFAULT: 'rgb(var(--customer-primary))',
      light: 'rgb(var(--customer-primary-light))',
      dark: 'rgb(var(--customer-primary-dark))',
      // Hex values for non-CSS contexts (charts, canvas, etc.)
      hex: '#8B1538',
      hexLight: '#B91C1C',
      hexDark: '#661028',
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
    buttonPrimary: 'bg-customer-primary hover:bg-customer-primary-dark text-white shadow-customer-glow',
    buttonSecondary: 'bg-transparent border border-customer-primary text-customer-primary hover:bg-customer-primary/10',
    buttonGhost: 'bg-transparent hover:bg-customer-primary/10 text-customer-primary',

    // Cards
    card: 'bg-surface-secondary/60 backdrop-blur-md border border-white/5 rounded-xl shadow-lg',
    cardAccent: 'bg-surface-secondary/60 backdrop-blur-md border border-customer-primary/30 rounded-xl shadow-customer-glow',

    // Auth-specific
    authCard: 'bg-[#17191D]/60 backdrop-blur-xl border border-customer-primary/20 rounded-2xl shadow-customer-glow',
    authInput: 'bg-white/10 border border-white/20 rounded-lg focus:border-customer-primary focus:ring-1 focus:ring-customer-primary',

    // Text
    textGradient: 'bg-gradient-to-r from-white to-customer-primary-light bg-clip-text text-transparent',
  },
};

// ===========================================
// BACKWARD COMPATIBILITY - AuthTheme
// (from authTheme.ts)
// ===========================================
export const AuthTheme = {
  colors: {
    primary: '#8B1538',
    primaryHover: '#7A1230',
    primaryLight: 'rgba(139, 21, 56, 0.1)',
    primaryMedium: 'rgba(139, 21, 56, 0.3)',
    secondary: '#B91C1C',
    background: '#0B0C0E',
    cardBg: '#17191D',
    cardBgBlur: 'rgba(23, 25, 29, 0.6)',
    border: 'rgba(139, 21, 56, 0.2)',
    borderLight: 'rgba(139, 21, 56, 0.1)',
    borderMedium: 'rgba(139, 21, 56, 0.3)',
    borderStrong: 'rgba(139, 21, 56, 0.5)',
    borderDivider: '#3A3F47',
    textPrimary: '#EAECEF',
    textSecondary: '#B7BDC6',
    textMuted: '#9CA3AF',
    textDark: '#8B92A0',
    inputBg: 'rgba(255, 255, 255, 0.1)',
    inputBorder: 'rgba(255, 255, 255, 0.2)',
    inputBorderFocus: '#8B1538',
    inputPlaceholder: 'rgba(255, 255, 255, 0.6)',
    inputText: '#FFFFFF',
    success: '#10B981',
    successLight: 'rgba(16, 185, 129, 0.1)',
    successBorder: 'rgba(16, 185, 129, 0.3)',
    error: '#EF4444',
    errorLight: 'rgba(239, 68, 68, 0.1)',
    errorBorder: 'rgba(239, 68, 68, 0.3)',
    warning: '#F59E0B',
    warningLight: 'rgba(245, 158, 11, 0.1)',
    warningBorder: 'rgba(245, 158, 11, 0.3)',
    googleHover: 'rgba(255, 255, 255, 0.2)',
  },
  animations: {
    containerFade: {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 },
      },
    },
    titleSlide: {
      hidden: { opacity: 0, y: -20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    },
    cardScale: {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
    },
    elementSlide: {
      hidden: { opacity: 0, x: -10 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
    },
    buttonInteraction: {
      hover: { scale: 1.05, boxShadow: '0px 8px 25px rgba(139, 21, 56, 0.3)' },
      tap: { scale: 0.95 },
    },
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.3 } },
    },
  },
  shadows: {
    card: '0 4px 15px rgba(139, 21, 56, 0.3)',
    cardHover: '0 6px 20px rgba(139, 21, 56, 0.4)',
    cardStrong: '0 8px 30px rgba(139, 21, 56, 0.35)',
    glow: '0 0 24px rgba(139, 21, 56, 0.35)',
    glowStrong: '0 0 30px rgba(139, 21, 56, 0.5)',
    button: '0px 8px 25px rgba(139, 21, 56, 0.3)',
    input: '0 0 0 3px rgba(139, 21, 56, 0.1)',
    focusRing: '0 0 0 3px rgba(139, 21, 56, 0.1)',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #8B1538 0%, #7A1230 100%)',
    primaryReverse: 'linear-gradient(135deg, #7A1230 0%, #8B1538 100%)',
    border: 'linear-gradient(135deg, rgba(139, 21, 56, 0.2) 0%, transparent 50%, rgba(122, 18, 48, 0.2) 100%)',
    borderGlow: 'linear-gradient(135deg, rgba(139, 21, 56, 0.2) 0%, transparent 50%, rgba(185, 28, 28, 0.2) 100%)',
    card: 'linear-gradient(135deg, rgba(139, 21, 56, 0.05) 0%, transparent 100%)',
  },
  spacing: {
    cardPadding: '2rem',
    formGap: '1.5rem',
    sectionGap: '2rem',
    elementGap: '0.5rem',
  },
  radius: {
    card: '1rem',
    input: '0.5rem',
    button: '0.5rem',
  },
  typography: {
    title: { fontSize: '1.875rem', fontWeight: '600', color: '#EAECEF', letterSpacing: '-0.025em' },
    subtitle: { fontSize: '1rem', fontWeight: '400', color: '#B7BDC6' },
    label: { fontSize: '0.875rem', fontWeight: '500', color: '#EAECEF' },
    error: { fontSize: '0.875rem', color: '#EF4444' },
    success: { fontSize: '0.875rem', color: '#10B981' },
  },
};

// ===========================================
// BACKWARD COMPATIBILITY - PremiumTheme
// (from premiumTheme.ts)
// ===========================================
export const PremiumTheme = {
  colors: {
    silver: {
      50: '#FAFAFA', 100: '#F5F5F5', 200: '#EEEEEE', 300: '#E0E0E0',
      400: '#BDBDBD', 500: '#C0C0C0', 600: '#A8A8A8', 700: '#909090',
      800: '#787878', 900: '#606060'
    },
    burgundy: {
      50: '#FAF4F4', 100: '#F0E1E1', 200: '#E1C5C5', 300: '#CDA3A3',
      400: '#B47D7D', 500: '#8B1538', 600: '#7A1230', 700: '#661028',
      800: '#520D20', 900: '#420A1A'
    },
    charcoal: {
      50: '#F8F8F8', 100: '#F0F0F0', 200: '#E0E0E0', 300: '#C8C8C8',
      400: '#A0A0A0', 500: '#1A1A1A', 600: '#171717', 700: '#141414',
      800: '#111111', 900: '#0F0F0F'
    },
    platinum: {
      50: '#FEFEFE', 100: '#FCFCFC', 200: '#F8F8F8', 300: '#F0F0F0',
      400: '#E8E8E8', 500: '#E5E5E5', 600: '#D8D8D8', 700: '#CCCCCC',
      800: '#B8B8B8', 900: '#A5A5A5'
    },
    // Compatibility aliases
    royal: {
      50: '#FAF4F4', 100: '#F0E1E1', 200: '#E1C5C5', 300: '#CDA3A3',
      400: '#B47D7D', 500: '#8B1538', 600: '#7A1230', 700: '#661028',
      800: '#520D20', 900: '#420A1A'
    },
    tandoori: {
      50: '#F8F8F8', 100: '#F0F0F0', 200: '#E0E0E0', 300: '#C8C8C8',
      400: '#A0A0A0', 500: '#1A1A1A', 600: '#171717', 700: '#141414',
      800: '#111111', 900: '#0F0F0F'
    },
    gold: {
      50: '#FEFEFE', 100: '#FCFCFC', 200: '#F8F8F8', 300: '#F0F0F0',
      400: '#E8E8E8', 500: '#E5E5E5', 600: '#D8D8D8', 700: '#CCCCCC',
      800: '#B8B8B8', 900: '#A5A5A5'
    },
    saffron: {
      50: '#FAFAFA', 100: '#F5F5F5', 200: '#EEEEEE', 300: '#E0E0E0',
      400: '#BDBDBD', 500: '#C0C0C0', 600: '#A8A8A8', 700: '#909090',
      800: '#787878', 900: '#606060'
    },
    dark: {
      50: '#F5F5F5', 100: '#E9E9E9', 200: '#D3D3D3', 300: '#BDBDBD',
      400: '#A7A7A7', 500: '#919191', 600: '#7B7B7B', 700: '#656565',
      800: '#1A1A1A', 850: '#171717', 900: '#0F0F0F', 950: '#0A0A0A'
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#E5E5E5',
      muted: '#B0B0B0',
      accent: '#C0C0C0',
      inverse: '#0F0F0F'
    },
    background: {
      primary: '#0F0F0F',
      secondary: '#1A1A1A',
      tertiary: '#252525',
      highlight: '#2A2A2A'
    },
    border: {
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.2)',
      heavy: 'rgba(255, 255, 255, 0.3)'
    },
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6'
    }
  },
  shadows: {
    elevation: {
      sm: '0 2px 8px rgba(0, 0, 0, 0.15)',
      md: '0 4px 16px rgba(0, 0, 0, 0.2)',
      lg: '0 8px 32px rgba(0, 0, 0, 0.25)',
      xl: '0 16px 64px rgba(0, 0, 0, 0.3)'
    },
    glow: {
      silver: '0 0 20px rgba(192, 192, 192, 0.3)',
      burgundy: '0 0 20px rgba(139, 21, 56, 0.3)',
      platinum: '0 0 20px rgba(229, 229, 229, 0.3)',
      saffron: '0 0 20px rgba(192, 192, 192, 0.3)',
      royal: '0 0 20px rgba(139, 21, 56, 0.3)',
      tandoori: '0 0 20px rgba(26, 26, 26, 0.3)',
      gold: '0 0 20px rgba(229, 229, 229, 0.3)'
    }
  },
  typography: {
    fontFamily: {
      serif: 'Cinzel, Georgia, serif',
      sans: 'Inter, sans-serif',
      display: 'Playfair Display, serif'
    },
    fontSize: {
      xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem',
      xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.25rem'
    }
  },
  animation: {
    duration: { fast: '150ms', medium: '250ms', slow: '350ms' },
    easing: { smooth: [0.25, 0.46, 0.45, 0.94] }
  },
  spice: {
    colors: { mild: '#10B981', medium: '#E5E5E5', hot: '#C0C0C0', extraHot: '#8B1538' },
    emojis: { mild: '🌿', medium: '🌶️', hot: '🌶️🌶️', extraHot: '🌶️🌶️🌶️' }
  }
};

// Helper functions for spice level theming
export const getSpiceColor = (level: number) => {
  if (level <= 1) return PremiumTheme.spice.colors.mild;
  if (level <= 2) return PremiumTheme.spice.colors.medium;
  if (level <= 3) return PremiumTheme.spice.colors.hot;
  return PremiumTheme.spice.colors.extraHot;
};

export const getSpiceEmoji = (level: number) => {
  if (level <= 1) return PremiumTheme.spice.emojis.mild;
  if (level <= 2) return PremiumTheme.spice.emojis.medium;
  if (level <= 3) return PremiumTheme.spice.emojis.hot;
  return PremiumTheme.spice.emojis.extraHot;
};

// ===========================================
// BACKWARD COMPATIBILITY - RubyRedCustomerDesign
// (now using burgundy instead of ruby red)
// ===========================================
export const RubyRedColors = {
  background: {
    primary: '#121212',
    secondary: '#1A1A1A',
    tertiary: '#222222',
    dark: '#0A0A0A',
    panel: '#1E1E1E',
    card: 'rgba(30, 30, 30, 0.95)'
  },
  // Map ruby to burgundy
  ruby: {
    primary: '#8B1538',
    primaryTransparent: 'rgba(139, 21, 56, 0.8)',
    light: '#B91C1C',
    dark: '#661028',
    glow: 'rgba(139, 21, 56, 0.4)',
    gradient: {
      primary: 'linear-gradient(135deg, #8B1538 0%, #661028 100%)',
      light: 'linear-gradient(135deg, #B91C1C 0%, #8B1538 100%)',
      withWhite: 'linear-gradient(135deg, #8B1538 0%, #FFFFFF 100%)'
    }
  },
  white: {
    pure: '#FFFFFF',
    pearl: '#F8FAFC',
    silver: '#F1F5F9',
    platinum: '#E2E8F0',
    gradient: {
      primary: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
      withRuby: 'linear-gradient(135deg, #FFFFFF 0%, #8B1538 100%)'
    }
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#F0F0F5',
    muted: '#D1D1D6',
    accent: '#8B1538',
    inverse: { primary: '#1E293B', secondary: '#475569', tertiary: '#64748B' }
  },
  border: {
    light: 'rgba(255, 255, 255, 0.07)',
    medium: 'rgba(255, 255, 255, 0.12)',
    accent: 'rgba(139, 21, 56, 0.3)',
    card: 'rgba(255, 255, 255, 0.03)'
  },
  status: {
    success: '#FFFFFF',
    warning: '#F59E0B',
    error: '#8B1538',
    info: '#E5E5E9',
    active: '#8B1538',
    popular: '#8B1538',
    special: '#8B1538',
    successLight: '#F0FDF4',
    warningLight: '#FEF3C7',
    errorLight: '#FEE2E2',
    infoLight: '#F8FAFC'
  },
  interactive: {
    primary: '#8B1538',
    primaryHover: '#661028',
    secondary: '#6B7280',
    secondaryHover: '#4B5563'
  }
};

export const globalRubyColors = {
  ...RubyRedColors,
  burgundy: {
    primary: RubyRedColors.ruby.primary,
    primaryTransparent: RubyRedColors.ruby.primaryTransparent,
    light: RubyRedColors.ruby.light,
    dark: RubyRedColors.ruby.dark,
    glow: RubyRedColors.ruby.glow
  }
};

// ===========================================
// LEGACY EXPORTS - CustomerDesignSystem
// (original steel-blue design, kept for compatibility)
// ===========================================
export const CustomerColors = {
  background: {
    primary: '#0F1419',
    secondary: '#1A1F2E',
    tertiary: '#252B3A',
    panel: '#2A3441',
    overlay: 'rgba(15, 20, 25, 0.95)'
  },
  surface: {
    primary: '#FFFFFF',
    secondary: '#F8FAFC',
    tertiary: '#F1F5F9',
    border: '#E2E8F0',
    divider: '#CBD5E1'
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#94A3B8',
    tertiary: '#64748B',
    inverse: { primary: '#1E293B', secondary: '#475569', tertiary: '#64748B' }
  },
  accent: {
    primary: '#3B82F6',
    secondary: '#1E40AF',
    light: '#DBEAFE',
    dark: '#1E3A8A'
  },
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    successLight: '#D1FAE5',
    warningLight: '#FEF3C7',
    errorLight: '#FEE2E2',
    infoLight: '#DBEAFE'
  },
  interactive: {
    primary: '#3B82F6',
    primaryHover: '#2563EB',
    secondary: '#6B7280',
    secondaryHover: '#4B5563'
  }
};

export const CustomerTypography = {
  fonts: {
    heading: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
    body: '"Inter", "SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
    mono: '"JetBrains Mono", "SF Mono", Consolas, monospace'
  },
  scale: {
    xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem',
    xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.25rem', '5xl': '3rem'
  },
  weights: { light: 300, normal: 400, medium: 500, semibold: 600, bold: 700 },
  lineHeights: { tight: 1.25, normal: 1.5, relaxed: 1.625, loose: 2 }
};

export const CustomerSpacing = {
  xs: '0.25rem', sm: '0.5rem', md: '0.75rem', lg: '1rem',
  xl: '1.5rem', '2xl': '2rem', '3xl': '3rem', '4xl': '4rem', '5xl': '6rem'
};

export const CustomerRadius = {
  none: '0', sm: '0.25rem', md: '0.375rem', lg: '0.5rem',
  xl: '0.75rem', '2xl': '1rem', full: '9999px'
};

export const CustomerShadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
};

export const CustomerStyles = {
  card: {
    primary: {
      background: CustomerColors.surface.primary,
      border: `1px solid ${CustomerColors.surface.border}`,
      borderRadius: CustomerRadius.xl,
      boxShadow: CustomerShadows.lg,
      padding: CustomerSpacing['2xl']
    },
    secondary: {
      background: CustomerColors.surface.secondary,
      border: `1px solid ${CustomerColors.surface.border}`,
      borderRadius: CustomerRadius.lg,
      boxShadow: CustomerShadows.md,
      padding: CustomerSpacing.xl
    },
    dark: {
      background: CustomerColors.background.panel,
      border: `1px solid ${CustomerColors.background.tertiary}`,
      borderRadius: CustomerRadius.xl,
      boxShadow: CustomerShadows.lg,
      padding: CustomerSpacing['2xl']
    }
  },
  button: {
    primary: {
      background: CustomerColors.accent.primary,
      color: CustomerColors.surface.primary,
      border: 'none',
      borderRadius: CustomerRadius.lg,
      padding: `${CustomerSpacing.md} ${CustomerSpacing.xl}`,
      fontWeight: CustomerTypography.weights.medium,
      fontSize: CustomerTypography.scale.base,
      boxShadow: CustomerShadows.sm,
      transition: 'all 0.2s ease-in-out'
    },
    secondary: {
      background: 'transparent',
      color: CustomerColors.accent.primary,
      border: `1px solid ${CustomerColors.accent.primary}`,
      borderRadius: CustomerRadius.lg,
      padding: `${CustomerSpacing.md} ${CustomerSpacing.xl}`,
      fontWeight: CustomerTypography.weights.medium,
      fontSize: CustomerTypography.scale.base,
      transition: 'all 0.2s ease-in-out'
    }
  },
  input: {
    primary: {
      background: CustomerColors.surface.primary,
      border: `1px solid ${CustomerColors.surface.border}`,
      borderRadius: CustomerRadius.lg,
      padding: `${CustomerSpacing.md} ${CustomerSpacing.lg}`,
      fontSize: CustomerTypography.scale.base,
      color: CustomerColors.text.inverse.primary,
      fontFamily: CustomerTypography.fonts.body
    }
  },
  navigation: {
    sidebar: {
      background: CustomerColors.background.secondary,
      borderRight: `1px solid ${CustomerColors.background.tertiary}`,
      width: '280px',
      height: '100vh',
      padding: CustomerSpacing['2xl']
    },
    navItem: {
      inactive: {
        color: CustomerColors.text.secondary,
        padding: `${CustomerSpacing.md} ${CustomerSpacing.lg}`,
        borderRadius: CustomerRadius.lg,
        transition: 'all 0.2s ease-in-out'
      },
      active: {
        color: CustomerColors.text.primary,
        background: CustomerColors.accent.primary,
        padding: `${CustomerSpacing.md} ${CustomerSpacing.lg}`,
        borderRadius: CustomerRadius.lg,
        boxShadow: CustomerShadows.sm
      }
    }
  }
};

export const CustomerAnimations = {
  duration: { fast: '150ms', normal: '250ms', slow: '350ms' },
  easing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },
  transition: {
    colors: `color 250ms cubic-bezier(0.4, 0, 0.2, 1), background-color 250ms cubic-bezier(0.4, 0, 0.2, 1)`,
    transform: `transform 250ms cubic-bezier(0.4, 0, 0.2, 1)`,
    all: `all 250ms cubic-bezier(0.4, 0, 0.2, 1)`
  }
};

export const CustomerUtils = {
  spacing: (multiplier: number) => `${0.25 * multiplier}rem`,
  rgba: (color: string, opacity: number) => `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
  breakpoints: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' }
};

// Default export - the main design system object
export const CustomerDesignSystem = {
  colors: CustomerColors,
  typography: CustomerTypography,
  spacing: CustomerSpacing,
  radius: CustomerRadius,
  shadows: CustomerShadows,
  styles: CustomerStyles,
  animations: CustomerAnimations,
  utils: CustomerUtils
};

export default CustomerDesignSystem;
