/**
 * Ruby Red Customer Design System
 * Mirrors QSAI admin design patterns but uses dark ruby red and white gradients
 * Creating visual consistency with clear distinction from internal admin areas
 */

// Ruby Red Color Palette - Premium luxury with sophisticated ruby red accents
export const RubyRedColors = {
  // Background Colors - Deep blacks inspired by QSAI
  background: {
    primary: '#121212',      // Soft black for main background (QSAI-inspired)
    secondary: '#1A1A1A',    // Slightly lighter soft black for secondary backgrounds
    tertiary: '#222222',     // Soft black for cards
    dark: '#0A0A0A',        // Deeper black for headers and contrasting elements
    panel: '#1E1E1E',       // Dark soft black for ALL panels (QSAI-inspired)
    card: 'rgba(30, 30, 30, 0.95)' // Semi-transparent soft black for card backgrounds
  },
  
  // Ruby Red Accent Colors - Core theme colors
  ruby: {
    primary: '#DC2626',      // Deep ruby red (replaces QSAI purple)
    primaryTransparent: 'rgba(220, 38, 38, 0.8)', // Deep ruby red with 80% opacity
    light: '#EF4444',        // Lighter ruby red for hover states
    dark: '#B91C1C',         // Darker ruby red for active states
    glow: 'rgba(220, 38, 38, 0.4)', // Ruby red glow effect
    // Gradient variations
    gradient: {
      primary: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
      light: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
      withWhite: 'linear-gradient(135deg, #DC2626 0%, #FFFFFF 100%)'
    }
  },
  
  // White Colors - Premium white variations
  white: {
    pure: '#FFFFFF',         // Pure white
    pearl: '#F8FAFC',        // Pearl white with slight tint
    silver: '#F1F5F9',       // Silver white
    platinum: '#E2E8F0',     // Platinum white for borders
    gradient: {
      primary: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
      withRuby: 'linear-gradient(135deg, #FFFFFF 0%, #DC2626 100%)'
    }
  },
  
  // Text Colors - High contrast, premium typography
  text: {
    primary: '#FFFFFF',      // Pure white on dark
    secondary: '#F0F0F5',    // Pearl white
    muted: '#D1D1D6',        // Silver
    accent: '#DC2626',       // Ruby red for accent text
    inverse: {
      primary: '#1E293B',    // Dark on light
      secondary: '#475569',  // Medium gray
      tertiary: '#64748B'    // Light gray
    }
  },
  
  // Border Colors
  border: {
    light: 'rgba(255, 255, 255, 0.07)',
    medium: 'rgba(255, 255, 255, 0.12)',
    accent: 'rgba(220, 38, 38, 0.3)', // Ruby red border with transparency
    card: 'rgba(255, 255, 255, 0.03)' // Very subtle light border for cards
  },
  
  // Status Colors - Professional with ruby red integration
  status: {
    success: '#FFFFFF',      // White for success (sophisticated approach)
    warning: '#F59E0B',      // Amber for warnings
    error: '#DC2626',        // Ruby red for errors and critical states
    info: '#E5E5E9',         // Platinum for info
    active: '#DC2626',       // Ruby red for active/selected state
    popular: '#DC2626',      // Ruby red for popular tags
    special: '#DC2626',      // Ruby red for special items
    // Light variants
    successLight: '#F0FDF4',
    warningLight: '#FEF3C7',
    errorLight: '#FEE2E2',
    infoLight: '#F8FAFC'
  },
  
  // Interactive Colors
  interactive: {
    primary: '#DC2626',      // Ruby red
    primaryHover: '#B91C1C', // Darker ruby red
    secondary: '#6B7280',    // Cool gray
    secondaryHover: '#4B5563' // Darker gray
  }
};

// Global color definitions (prevents circular references)
export const globalRubyColors = {
  ...RubyRedColors,
  // Legacy compatibility - map burgundy references to ruby
  burgundy: {
    primary: RubyRedColors.ruby.primary,
    primaryTransparent: RubyRedColors.ruby.primaryTransparent,
    light: RubyRedColors.ruby.light,
    dark: RubyRedColors.ruby.dark,
    glow: RubyRedColors.ruby.glow
  }
};

// QSAI-Inspired Styling - Mirror the sophisticated QSAI patterns
export const rubyStyles = {
  // Frosted glass effect mirroring QSAI's frostedGlassStyle
  frostedGlassStyle: {
    background: RubyRedColors.background.panel, // Soft black for ALL panels
    backdropFilter: 'blur(4px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.25)',
    border: `1px solid ${RubyRedColors.border.card}`, // Subtle light border
    borderBottom: `1px solid rgba(220, 38, 38, 0.2)` // Subtle ruby red bottom border
  },
  
  // Glass card effect mirroring QSAI's glassCard
  glassCard: {
    background: RubyRedColors.background.panel, // Soft black for ALL panels
    backdropFilter: 'blur(4px)',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
    border: `1px solid ${RubyRedColors.border.card}`, // Subtle light border
    borderBottom: `1px solid rgba(220, 38, 38, 0.2)` // Subtle ruby red bottom border
  },
  
  // Premium gradient text (white variations) - mirroring QSAI's gradientText
  gradientText: (intensity: 'subtle' | 'medium' | 'strong' = 'medium') => {
    const colorMap = {
      subtle: [RubyRedColors.white.pearl, RubyRedColors.white.pure], // Pearl white to pure white
      medium: [RubyRedColors.white.platinum, RubyRedColors.white.pure], // Platinum to pure white
      strong: [RubyRedColors.white.silver, RubyRedColors.white.pure], // Silver to pure white
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
  
  // Ruby red gradient text for headings - mirroring QSAI's purpleGradientText
  rubyGradientText: {
    backgroundImage: `linear-gradient(to right, #FFFFFF, #FECACA, #FCA5A5)`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 0 30px rgba(220, 38, 38, 0.2)',
    letterSpacing: '0.02em',
  },
  
  // Gradient buttons - sophisticated black to slate with ruby accent
  gradientButton: (intensity: 'subtle' | 'medium' | 'strong' = 'medium') => {
    const colorMap = {
      subtle: [RubyRedColors.background.tertiary, RubyRedColors.background.panel],
      medium: [RubyRedColors.background.secondary, RubyRedColors.background.tertiary],
      strong: [RubyRedColors.background.dark, RubyRedColors.background.secondary],
    };
    
    const [color1, color2] = colorMap[intensity];
    
    return {
      background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
      border: '1px solid rgba(220, 38, 38, 0.2)', // Subtle ruby red border
      boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
      transition: 'all 0.3s ease'
    };
  },
  
  // Ruby accent gradient for special items - mirroring QSAI's purpleAccentGradient
  rubyAccentGradient: {
    background: `linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(220, 38, 38, 0.2) 100%)`,
    border: '1px solid rgba(220, 38, 38, 0.3)', // Ruby red border
    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)'
  },
  
  // Grid background with pattern - mirroring QSAI's gridBackground
  gridBackground: {
    background: `linear-gradient(135deg, ${RubyRedColors.background.secondary} 0%, ${RubyRedColors.background.tertiary} 100%)`,
    backgroundImage: `
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='white' fill-opacity='0.02'%3E%3Cpath opacity='.3' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"),
      linear-gradient(rgba(255, 255, 255, 0.01) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.01) 1px, transparent 1px),
      linear-gradient(135deg, ${RubyRedColors.background.secondary} 0%, ${RubyRedColors.background.tertiary} 100%)
    `,
    backgroundSize: 'auto, 25px 25px, 25px 25px, 100% 100%',
    position: 'relative'
  },
  
  // Vignetting effect - mirroring QSAI's vignette
  vignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.5) 100%)',
    pointerEvents: 'none',
    zIndex: 1
  }
};

// Ruby Red Effects - Mirror QSAI's sophisticated effects
export const rubyEffects = {
  // Inner glow for active elements (ruby glow)
  innerGlow: (intensity: 'subtle' | 'medium' | 'strong' = 'medium') => {
    const opacityMap = {
      subtle: 0.1,
      medium: 0.15,
      strong: 0.2
    };
    
    return `inset 0 0 20px rgba(220, 38, 38, ${opacityMap[intensity]})`;
  },
  
  // Outer glow for hover states (ruby glow)
  outerGlow: (intensity: 'subtle' | 'medium' | 'strong' = 'medium') => {
    const opacityMap = {
      subtle: 0.07,
      medium: 0.12,
      strong: 0.18
    };
    
    return `0 0 15px rgba(220, 38, 38, ${opacityMap[intensity]})`;
  },
  
  // Text shadow for premium typography
  textShadow: (intensity: 'subtle' | 'medium' | 'strong' = 'medium') => {
    const shadowMap = {
      subtle: '0 1px 2px rgba(0, 0, 0, 0.5)',
      medium: '0 1px 3px rgba(0, 0, 0, 0.7)',
      strong: '0 2px 4px rgba(0, 0, 0, 0.9)'
    };
    
    return shadowMap[intensity];
  },
  
  // Premium button states with ruby accents
  button: {
    hover: {
      transform: 'translateY(-1px)',
      boxShadow: '0 7px 14px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(220, 38, 38, 0.15)'
    },
    active: {
      transform: 'translateY(1px)',
      boxShadow: '0 3px 6px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(220, 38, 38, 0.1)'
    },
    selected: {
      boxShadow: '0 0 0 2px rgba(220, 38, 38, 0.5), inset 0 0 10px rgba(220, 38, 38, 0.1)'
    }
  },
  
  // Status indicators with ruby highlights
  status: {
    selected: 'rgba(220, 38, 38, 0.8)', // Ruby red for selected/active state
    popular: 'rgba(220, 38, 38, 0.8)', // Ruby red for popular tags
    special: 'rgba(220, 38, 38, 0.8)', // Ruby red for special items
    accent: 'rgba(220, 38, 38, 0.8)' // Ruby red for accent highlights
  }
};

// Component Styles - Clean, sophisticated components mirroring QSAI structure
export const RubyRedCustomerStyles = {
  // Card styles - Sophisticated dark cards with ruby accents
  card: {
    primary: {
      background: RubyRedColors.background.panel,
      border: `1px solid ${RubyRedColors.border.card}`,
      borderBottom: `1px solid rgba(220, 38, 38, 0.2)`,
      borderRadius: '0.75rem', // 12px
      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
      padding: '2rem' // 32px
    },
    
    secondary: {
      background: RubyRedColors.background.tertiary,
      border: `1px solid ${RubyRedColors.border.light}`,
      borderRadius: '0.5rem', // 8px
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
      padding: '1.5rem' // 24px
    },
    
    // Light variant for special emphasis
    light: {
      background: RubyRedColors.white.pure,
      border: `1px solid ${RubyRedColors.white.platinum}`,
      borderRadius: '0.75rem',
      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
      padding: '2rem'
    }
  },
  
  // Button styles - Premium ruby red styling
  button: {
    primary: {
      background: RubyRedColors.ruby.gradient.primary,
      color: RubyRedColors.white.pure,
      border: 'none',
      borderRadius: '0.5rem',
      padding: '0.75rem 1.5rem',
      fontWeight: 500,
      fontSize: '1rem',
      boxShadow: '0 4px 10px rgba(220, 38, 38, 0.2)',
      transition: 'all 0.3s ease'
    },
    
    secondary: {
      background: 'transparent',
      color: RubyRedColors.ruby.primary,
      border: `1px solid ${RubyRedColors.ruby.primary}`,
      borderRadius: '0.5rem',
      padding: '0.75rem 1.5rem',
      fontWeight: 500,
      fontSize: '1rem',
      transition: 'all 0.2s ease-in-out'
    }
  },
  
  // Input styles - Clean, accessible with ruby accents
  input: {
    primary: {
      background: RubyRedColors.background.tertiary,
      border: `1px solid ${RubyRedColors.border.light}`,
      borderRadius: '0.5rem',
      padding: '0.75rem 1rem',
      fontSize: '1rem',
      color: RubyRedColors.text.primary,
      fontFamily: 'inherit'
    }
  },
  
  // Navigation styles - Sophisticated sidebar
  navigation: {
    sidebar: {
      background: RubyRedColors.background.secondary,
      borderRight: `1px solid ${RubyRedColors.background.tertiary}`,
      width: '320px', // Slightly wider than original
      height: '100vh',
      padding: '2rem'
    },
    
    navItem: {
      inactive: {
        color: RubyRedColors.text.secondary,
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        transition: 'all 0.2s ease-in-out'
      },
      
      active: {
        color: RubyRedColors.white.pure,
        background: RubyRedColors.ruby.primary,
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 8px rgba(220, 38, 38, 0.2)'
      }
    }
  }
};

// Export main design system object
export const RubyRedCustomerDesignSystem = {
  colors: RubyRedColors,
  styles: rubyStyles,
  effects: rubyEffects,
  components: RubyRedCustomerStyles
};

// Helper to convert hex color to rgb format for shadow effects
function hexToRgb(hex: string): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export default RubyRedCustomerDesignSystem;
