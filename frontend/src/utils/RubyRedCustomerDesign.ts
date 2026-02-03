/**
 * RubyRedCustomerDesign.ts - REDIRECT FILE
 * ===========================================
 * This file now re-exports from CustomerDesignSystem.ts
 *
 * The design system has been consolidated. RubyRed colors have been
 * updated to use Burgundy (#8B1538) to match the unified customer theme.
 *
 * For new code, prefer importing directly from:
 *   import { CustomerTheme, RubyRedColors } from './CustomerDesignSystem';
 *
 * This file is maintained for backward compatibility.
 */

// Import for internal use
import { RubyRedColors as ImportedRubyRedColors } from './CustomerDesignSystem';

// Re-export Ruby Red related exports from the consolidated customer design system
export { RubyRedColors, globalRubyColors } from './CustomerDesignSystem';

// Recreate the rubyStyles export for backward compatibility
export const rubyStyles = {
  frostedGlassStyle: {
    background: '#1E1E1E',
    backdropFilter: 'blur(4px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    borderBottom: '1px solid rgba(139, 21, 56, 0.2)'
  },
  glassCard: {
    background: '#1E1E1E',
    backdropFilter: 'blur(4px)',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    borderBottom: '1px solid rgba(139, 21, 56, 0.2)'
  },
  gradientText: (intensity: 'subtle' | 'medium' | 'strong' = 'medium') => {
    const colorMap = {
      subtle: ['#F8FAFC', '#FFFFFF'],
      medium: ['#E2E8F0', '#FFFFFF'],
      strong: ['#F1F5F9', '#FFFFFF'],
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
  rubyGradientText: {
    backgroundImage: 'linear-gradient(to right, #FFFFFF, #FECACA, #FCA5A5)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 0 30px rgba(139, 21, 56, 0.2)',
    letterSpacing: '0.02em',
  },
  gradientButton: (intensity: 'subtle' | 'medium' | 'strong' = 'medium') => {
    const colorMap = {
      subtle: ['#222222', '#1E1E1E'],
      medium: ['#1A1A1A', '#222222'],
      strong: ['#0A0A0A', '#1A1A1A'],
    };
    const [color1, color2] = colorMap[intensity];
    return {
      background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
      border: '1px solid rgba(139, 21, 56, 0.2)',
      boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
      transition: 'all 0.3s ease'
    };
  },
  rubyAccentGradient: {
    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(139, 21, 56, 0.2) 100%)',
    border: '1px solid rgba(139, 21, 56, 0.3)',
    boxShadow: '0 4px 12px rgba(139, 21, 56, 0.15)'
  },
  gridBackground: {
    background: 'linear-gradient(135deg, #1A1A1A 0%, #222222 100%)',
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
  }
};

// Recreate the rubyEffects export for backward compatibility
export const rubyEffects = {
  glowBorder: {
    boxShadow: '0 0 0 1px rgba(139, 21, 56, 0.4), 0 0 12px rgba(139, 21, 56, 0.25)',
    border: '1px solid rgba(139, 21, 56, 0.45)'
  },
  innerGlow: (intensity: 'subtle' | 'medium' | 'strong' = 'medium') => {
    const opacityMap = { subtle: 0.1, medium: 0.15, strong: 0.2 };
    return `inset 0 0 20px rgba(139, 21, 56, ${opacityMap[intensity]})`;
  },
  outerGlow: (intensity: 'subtle' | 'medium' | 'strong' = 'medium') => {
    const opacityMap = { subtle: 0.07, medium: 0.12, strong: 0.18 };
    return `0 0 15px rgba(139, 21, 56, ${opacityMap[intensity]})`;
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
      boxShadow: '0 7px 14px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(139, 21, 56, 0.15)'
    },
    active: {
      transform: 'translateY(1px)',
      boxShadow: '0 3px 6px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(139, 21, 56, 0.1)'
    },
    selected: {
      boxShadow: '0 0 0 2px rgba(139, 21, 56, 0.5), inset 0 0 10px rgba(139, 21, 56, 0.1)'
    }
  },
  status: {
    selected: 'rgba(139, 21, 56, 0.8)',
    popular: 'rgba(139, 21, 56, 0.8)',
    special: 'rgba(139, 21, 56, 0.8)',
    accent: 'rgba(139, 21, 56, 0.8)'
  }
};

// Component styles for backward compatibility
export const RubyRedCustomerStyles = {
  card: {
    primary: {
      background: '#1E1E1E',
      border: '1px solid rgba(255, 255, 255, 0.03)',
      borderBottom: '1px solid rgba(139, 21, 56, 0.2)',
      borderRadius: '0.75rem',
      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
      padding: '2rem'
    },
    secondary: {
      background: '#222222',
      border: '1px solid rgba(255, 255, 255, 0.07)',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
      padding: '1.5rem'
    },
    light: {
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '0.75rem',
      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
      padding: '2rem'
    }
  },
  button: {
    primary: {
      background: 'linear-gradient(135deg, #8B1538 0%, #661028 100%)',
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '0.5rem',
      padding: '0.75rem 1.5rem',
      fontWeight: 500,
      fontSize: '1rem',
      boxShadow: '0 4px 10px rgba(139, 21, 56, 0.2)',
      transition: 'all 0.3s ease'
    },
    secondary: {
      background: 'transparent',
      color: '#8B1538',
      border: '1px solid #8B1538',
      borderRadius: '0.5rem',
      padding: '0.75rem 1.5rem',
      fontWeight: 500,
      fontSize: '1rem',
      transition: 'all 0.2s ease-in-out'
    }
  },
  input: {
    primary: {
      background: '#222222',
      border: '1px solid rgba(255, 255, 255, 0.07)',
      borderRadius: '0.5rem',
      padding: '0.75rem 1rem',
      fontSize: '1rem',
      color: '#FFFFFF',
      fontFamily: 'inherit'
    }
  },
  navigation: {
    sidebar: {
      background: '#1A1A1A',
      borderRight: '1px solid #222222',
      width: '320px',
      height: '100vh',
      padding: '2rem'
    },
    navItem: {
      inactive: {
        color: '#F0F0F5',
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        transition: 'all 0.2s ease-in-out'
      },
      active: {
        color: '#FFFFFF',
        background: '#8B1538',
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 8px rgba(139, 21, 56, 0.2)'
      }
    }
  }
};

// Main design system export
export const RubyRedCustomerDesignSystem = {
  colors: ImportedRubyRedColors,
  styles: rubyStyles,
  effects: rubyEffects,
  components: RubyRedCustomerStyles
};

export default RubyRedCustomerDesignSystem;
