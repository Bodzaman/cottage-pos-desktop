/**
 * Premium Customer Design System
 * Cool, clean aesthetic focused on sophistication and readability
 * Distinctly different from QSAI admin system
 */

// Cool, Premium Color Palette
export const CustomerColors = {
  // Primary Colors - Cool navy and charcoal foundation
  background: {
    primary: '#0F1419',      // Deep charcoal black
    secondary: '#1A1F2E',    // Charcoal gray
    tertiary: '#252B3A',     // Lighter charcoal
    panel: '#2A3441',        // Panel background
    overlay: 'rgba(15, 20, 25, 0.95)' // Overlay backgrounds
  },
  
  // Surface Colors - Clean, sophisticated cards
  surface: {
    primary: '#FFFFFF',      // Pure white cards
    secondary: '#F8FAFC',    // Light gray surface
    tertiary: '#F1F5F9',     // Softer white
    border: '#E2E8F0',       // Light borders
    divider: '#CBD5E1'       // Divider lines
  },
  
  // Text Colors - High contrast, premium typography
  text: {
    primary: '#FFFFFF',      // White on dark
    secondary: '#94A3B8',    // Cool gray
    tertiary: '#64748B',     // Muted gray
    inverse: {
      primary: '#1E293B',    // Dark on light
      secondary: '#475569',  // Medium gray
      tertiary: '#64748B'    // Light gray
    }
  },
  
  // Accent Colors - Steel blue sophistication
  accent: {
    primary: '#3B82F6',      // Steel blue
    secondary: '#1E40AF',    // Deeper steel blue
    light: '#DBEAFE',        // Light steel blue
    dark: '#1E3A8A'          // Dark steel blue
  },
  
  // Status Colors - Professional, muted tones
  status: {
    success: '#10B981',      // Emerald green
    warning: '#F59E0B',      // Amber
    error: '#EF4444',        // Red
    info: '#3B82F6',         // Steel blue
    // Light variants
    successLight: '#D1FAE5',
    warningLight: '#FEF3C7',
    errorLight: '#FEE2E2',
    infoLight: '#DBEAFE'
  },
  
  // Interactive Colors - Clean, professional
  interactive: {
    primary: '#3B82F6',      // Steel blue
    primaryHover: '#2563EB', // Darker steel blue
    secondary: '#6B7280',    // Cool gray
    secondaryHover: '#4B5563' // Darker gray
  }
};

// Typography Scale - Premium, readable fonts
export const CustomerTypography = {
  // Font Families
  fonts: {
    heading: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
    body: '"Inter", "SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
    mono: '"JetBrains Mono", "SF Mono", Consolas, monospace'
  },
  
  // Font Sizes
  scale: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem'      // 48px
  },
  
  // Font Weights
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  
  // Line Heights - Generous for readability
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2
  }
};

// Spacing Scale - Clean, consistent spacing
export const CustomerSpacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  '3xl': '3rem',   // 48px
  '4xl': '4rem',   // 64px
  '5xl': '6rem'    // 96px
};

// Border Radius - Subtle, refined curves
export const CustomerRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  '2xl': '1rem',   // 16px
  full: '9999px'
};

// Shadows - Clean, professional depth
export const CustomerShadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
};

// Component Styles - Premium, clean components
export const CustomerStyles = {
  // Card styles - Clean white cards on dark background
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
    
    // Dark variant for sections that need to stand out
    dark: {
      background: CustomerColors.background.panel,
      border: `1px solid ${CustomerColors.background.tertiary}`,
      borderRadius: CustomerRadius.xl,
      boxShadow: CustomerShadows.lg,
      padding: CustomerSpacing['2xl']
    }
  },
  
  // Button styles - Clean, professional
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
  
  // Input styles - Clean, accessible
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
  
  // Navigation styles - Sidebar navigation
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

// Animations - Subtle, professional
export const CustomerAnimations = {
  // Durations
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms'
  },
  
  // Easing
  easing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },
  
  // Common transitions
  transition: {
    colors: `color 250ms cubic-bezier(0.4, 0, 0.2, 1), background-color 250ms cubic-bezier(0.4, 0, 0.2, 1)`,
    transform: `transform 250ms cubic-bezier(0.4, 0, 0.2, 1)`,
    all: `all 250ms cubic-bezier(0.4, 0, 0.2, 1)`
  }
};

// Utility functions
export const CustomerUtils = {
  // Generate consistent spacing
  spacing: (multiplier: number) => `${0.25 * multiplier}rem`,
  
  // Generate rgba colors
  rgba: (color: string, opacity: number) => {
    // Simple implementation - you might want to use a proper color library
    return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  },
  
  // Responsive breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  }
};

// Export default design system
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
