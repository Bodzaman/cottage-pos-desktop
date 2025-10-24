



/**
 * Enhanced design system for Cottage Tandoori POS interface
 * Implements a premium black and white aesthetic with purple accents
 */

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
    base: '#FFFFFF',  // Pure white
    silver: '#F5F5F7', // Silver white
    pearl: '#F0F0F5',  // Pearl white with slight blue tint
    glow: {
      soft: '0 0 15px rgba(255, 255, 255, 0.15)',
      medium: '0 0 20px rgba(255, 255, 255, 0.25)',
      strong: '0 0 25px rgba(255, 255, 255, 0.35)'
    }
  },
  black: {
    deep: '#0A0A0A',   // Rich deep black
    charcoal: '#121212', // Charcoal black
    slate: '#1A1A1A',    // Slate black
    smoke: '#232323'      // Smoke black
  },
  accents: {
    silver: '#D1D1D6',      // Silver accent
    platinum: '#E5E5E9',     // Platinum accent
    champagne: '#F8F3E6',    // Subtle champagne
    graphite: '#333338',     // Graphite accent
    purple: '#5B21B6'      // Deep purple accent
  }
};

// Main color palette (refined for premium black and white aesthetic with purple accents)
export const colors = {
  background: {
    primary: '#121212', // Soft black for main background
    secondary: '#1A1A1A', // Slightly lighter soft black for secondary backgrounds
    tertiary: '#222222', // Soft black for cards
    dark: '#0A0A0A', // Deeper black for headers and contrasting elements
    panel: '#1E1E1E', // Dark soft black for ALL panels
    card: 'rgba(30, 30, 30, 0.95)', // Semi-transparent soft black for card backgrounds
    highlight: '#2A2A2A' // Lighter soft black for highlights and selected states
  },
  purple: {
    primary: '#5B21B6', // Deeper purple (updated from #7C5DFA for premium consistency)
    primaryTransparent: 'rgba(91, 33, 182, 0.8)', // Deeper purple with 80% opacity
    light: '#7C3AED', // Lighter purple for hover states (was #9277FF)
    dark: '#4C1D95', // Darker purple for active states (was #6B4DEA)
    glow: 'rgba(91, 33, 182, 0.4)' // Purple glow effect with new primary
  },
  accent: {
    // Legacy accent colors maintained for backward compatibility
    gold: '#5B21B6', // Now deeper purple (replacing #7C5DFA)
    magenta: '#7C3AED', // Now lighter purple (replacing #9277FF)
    turquoise: '#4C1D95', // Now darker purple (replacing #6B4DEA)
    gold_light: 'rgba(91, 33, 182, 0.8)', // Now deeper purple with transparency
    magenta_light: 'rgba(124, 58, 237, 0.8)', // Now lighter purple with transparency
    turquoise_light: 'rgba(76, 29, 149, 0.8)', // Now darker purple with transparency
  },
  text: {
    primary: '#FFFFFF', // Pure white
    secondary: '#F0F0F5', // Pearl white
    muted: '#D1D1D6', // Silver
    accent: '#5B21B6', // Purple for accent text (updated to new primary)
  },
  border: {
    light: 'rgba(255, 255, 255, 0.07)',
    medium: 'rgba(255, 255, 255, 0.12)',
    accent: 'rgba(91, 33, 182, 0.3)' // Purple border with transparency (updated)
  },
  status: {
    success: '#FFFFFF', // White for success (less colorful approach)
    warning: '#F5F5F7', // Silver for warnings (less colorful approach)
    error: '#5B21B6', // Purple for errors and critical states (updated)
    info: '#E5E5E9', // Platinum for info
    active: '#5B21B6', // Purple for active/selected state (updated)
    popular: '#5B21B6', // Purple for popular tags (updated)
    special: '#5B21B6', // Purple for special items (updated)
  }
};

// Global color definitions for use across components
// This prevents circular reference errors when accessing colors in components
export const globalColors = {
  ...colors,
  // Merged purple and burgundy colors, ensuring all burgundy references
  // point to the purple color scheme
  burgundy: {
    primary: colors.purple.primary,         // Deep purple
    primaryTransparent: colors.purple.primaryTransparent, // Deep purple with 80% opacity
    light: colors.purple.light,           // Lighter purple for hover states
    dark: colors.purple.dark,             // Darker purple for active states
    glow: colors.purple.glow              // Purple glow effect
  }
};

// Export colors as QSAITheme for proper semantic naming (renamed from QSAIColors to eliminate corruption bug)
export const QSAITheme = globalColors;

// Panel styling - consistent soft black across all panels
export const panelStyle = {
  background: colors.background.panel, // Soft black (#1E1E1E) for ALL panels
  border: '1px solid rgba(255, 255, 255, 0.03)', // Very subtle light border
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Subtle shadow for depth
  borderRadius: '0.5rem',
  transition: 'all 0.2s ease'
};

// Common style definitions
export const styles = {
  // Frosted glass effect for containers with soft black background and purple accent
  frostedGlassStyle: {
    background: '#1E1E1E', // Soft black for ALL panels
    backdropFilter: 'blur(4px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.25)',
    border: `1px solid rgba(255, 255, 255, 0.03)`, // Subtle light border
    borderBottom: `1px solid rgba(124, 93, 250, 0.2)` // Subtle purple bottom border
  },
  // Frosted glass effect for cards and panels (with purple accent)
  glassCard: {
    background: '#1E1E1E', // Soft black for ALL panels
    backdropFilter: 'blur(4px)',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
    border: `1px solid rgba(255, 255, 255, 0.03)` // Subtle light border
  },
  
  // Premium gradient text (silver to white)
  gradientText: (intensity: 'subtle' | 'medium' | 'strong' = 'medium') => {
    // Define color variations based on intensity
    const colorMap = {
      subtle: ['#F0F0F5', '#FFFFFF'], // Pearl white to pure white
      medium: ['#E5E5E9', '#FFFFFF'], // Platinum to pure white
      strong: ['#D1D1D6', '#FFFFFF'], // Silver to pure white
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
  
  // Purple gradient text (for headings)
  purpleGradientText: {
    backgroundImage: `linear-gradient(to right, #FFFFFF, #EDECFF, #C7C2FF)`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 0 30px rgba(124, 93, 250, 0.2)',
    letterSpacing: '0.02em',
  },
  
  // Gradient buttons (sophisticated black to slate gradient with purple accent)
  gradientButton: (intensity: 'subtle' | 'medium' | 'strong' = 'medium') => {
    // Define color variations based on intensity
    const colorMap = {
      subtle: ['#1A1A1A', '#232323'], // Slate to smoke
      medium: ['#121212', '#1A1A1A'], // Charcoal to slate
      strong: ['#0A0A0A', '#121212'], // Deep black to charcoal
    };
    
    const [color1, color2] = colorMap[intensity];
    
    return {
      background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
      border: '1px solid rgba(124, 93, 250, 0.2)', // Subtle purple border
      boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
      transition: 'all 0.3s ease'
    };
  },
  
  // Purple accent gradient for special items
  purpleAccentGradient: {
    background: `linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(124, 93, 250, 0.2) 100%)`,
    border: '1px solid rgba(124, 93, 250, 0.3)', // Purple border
    boxShadow: '0 4px 12px rgba(124, 93, 250, 0.15)'
  },
  
  // Grid background with subtle pattern and vignetting effect (softer black gradient)
  gridBackground: {
    background: 'linear-gradient(135deg, #121212 0%, #151515 100%)',
    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.01) 1px, transparent 1px)',
    backgroundSize: '25px 25px',
    position: 'relative' as const
  },
  
  // Vignetting effect to create focus on central content
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

// Generate dynamic effects with purple accents
export const effects = {
  // Inner glow for active elements (purple glow)
  innerGlow: (intensity: 'subtle' | 'medium' | 'strong' = 'medium') => {
    const opacityMap = {
      subtle: 0.1,
      medium: 0.15,
      strong: 0.2
    };
    
    // Use purple for glow effects
    return `inset 0 0 20px rgba(124, 93, 250, ${opacityMap[intensity]})`;
  },
  
  // Outer glow for hover states (purple glow)
  outerGlow: (intensity: 'subtle' | 'medium' | 'strong' = 'medium') => {
    const opacityMap = {
      subtle: 0.07,
      medium: 0.12,
      strong: 0.18
    };
    
    // Use purple for glow effects
    return `0 0 15px rgba(124, 93, 250, ${opacityMap[intensity]})`;
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
  
  // Premium button states with purple accents
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
  
  // Status indicators with purple highlights
  status: {
    selected: 'rgba(124, 93, 250, 0.8)', // Purple for selected/active state
    popular: 'rgba(124, 93, 250, 0.8)', // Purple for popular tags
    special: 'rgba(124, 93, 250, 0.8)', // Purple for special items (e.g. chef's specials)
    accent: 'rgba(124, 93, 250, 0.8)' // Purple for accent highlights
  }
};

// Indian-inspired geometric patterns (monochromatic version)
export const indianPatterns = {
  rangoli: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M30 30h30v30H30z' fill='white' fill-opacity='0.03'/%3E%3Cpath d='M0 30h30v30H0z' fill='white' fill-opacity='0.02'/%3E%3Cpath d='M30 0h30v30H30z' fill='white' fill-opacity='0.03'/%3E%3Cpath d='M0 0h30v30H0z' fill='white' fill-opacity='0.02'/%3E%3C/g%3E%3C/svg%3E")`,
  jali: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Ccircle cx='20' cy='20' r='10' stroke='white' stroke-opacity='0.04' stroke-width='1'/%3E%3Ccircle cx='20' cy='20' r='5' stroke='white' stroke-opacity='0.03' stroke-width='1'/%3E%3C/g%3E%3C/svg%3E")`,
  paisley: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 45 C35 35, 20 10, 40 0 C60 10, 45 35, 40 45' stroke='white' stroke-opacity='0.04' fill='none'/%3E%3C/svg%3E")`,
  opacity: 0.05, // Reduced opacity for subtlety
};

// Helper to convert hex color to rgb format for shadow effects
function hexToRgb(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `${r}, ${g}, ${b}`;
}
