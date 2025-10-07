


/**
 * Updated Design System Configuration
 * Modern silver/platinum luxury theme for premium restaurant aesthetic
 */

// Core Color Palette - Silver/Platinum Luxury Theme
const colors = {
  // Primary accent colors
  brand: {
    purple: '#5B3CC4',      // Purple - primary actions (DARKER)
    purpleDark: '#4A2FB3',   // Darker purple for hover states (DARKER)
    purpleLight: '#6B4DE0',  // Lighter purple for highlights (DARKER)
    silver: '#C0C0C0',      // Silver - secondary accent (replaces gold)
    silverDark: '#A8A8A8',   // Darker silver for hover states
    platinum: '#E5E5E5',     // Platinum - highlight accent
    turquoise: '#0EBAB1',    // Turquoise - success states (keeping this)
    turquoisedark: '#0A9A92', // Darker turquoise for hover states
    
    // Legacy accent colors (keeping for backward compatibility but all map to silver now)
    gold: '#C0C0C0',         // Now maps to silver
    golddark: '#A8A8A8',     // Now maps to silverDark
    burgundy: '#5B3CC4',     // Now maps to darker purple
    burgundydark: '#4A2FB3',  // Now maps to darker purpleDark
    burgundylight: '#6B4DE0', // Now maps to darker purpleLight
    blue: '#4285F4',
    blueLight: '#70A1FF',
  },
  
  // Modern accent colors
  accent: {
    // Purple - primary accent color
    purple: '#7C5DFA',
    purple_light: '#9277FF',
    // Silver - secondary accent color (replaces gold)
    silver: '#C0C0C0',
    silver_light: '#E5E5E5',
    platinum: '#E5E5E5',
    platinum_light: '#F0F0F0',
    // Turquoise - success accent color
    turquoise: '#0EBAB1',
    turquoise_light: '#20D9CF',
    // Legacy gold (all map to silver now for consistency)
    gold: '#C0C0C0',           // Maps to silver
    gold_light: '#E5E5E5',     // Maps to platinum
    // Legacy burgundy (all map to purple now for consistency)
    burgundy: '#7C5DFA',       // Maps to purple
    burgundy_light: '#9277FF'  // Maps to purple_light
  },
  
  // Status colors
  status: {
    success: '#0EBAB1',    // Turquoise
    warning: '#C0C0C0',    // Silver (was gold)
    error: '#7C5DFA',      // Purple (replacing Firebrick red)
    info: '#4285F4',       // Blue
    pending: '#7C5DFA',    // Purple (was Burgundy)
    active: '#7C5DFA'      // Purple for active/selected state
  },
  
  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#BBC3E1',
    tertiary: '#8B92B3',
    muted: '#6B7794',
    accent: '#C0C0C0'      // Silver accent text
  },
  
  // Background colors
  background: {
    primary: '#0F0F0F',
    secondary: '#1A1A1A',
    tertiary: '#252525',
    highlight: '#2A2A2A',
    card: '#1A1A1A',
    cardHighlight: '#252525'
  },
  
  // Border colors - updated with silver theme
  border: {
    light: 'rgba(255, 255, 255, 0.07)',
    medium: 'rgba(255, 255, 255, 0.12)',
    strong: 'rgba(255, 255, 255, 0.15)',
    purple: 'rgba(124, 93, 250, 0.3)',
    silver: 'rgba(192, 192, 192, 0.3)',  // Silver border (replaces gold)
    platinum: 'rgba(229, 229, 229, 0.3)', // Platinum border
    turquoise: 'rgba(14, 186, 177, 0.3)',
    // Legacy mappings
    gold: 'rgba(192, 192, 192, 0.3)',    // Maps to silver
    burgundy: 'rgba(124, 93, 250, 0.3)'  // Maps to purple for backward compatibility
  },
  
  // Chart colors palette
  chartPalette: [
    '#7C5DFA', // Purple
    '#4285F4', // Blue
    '#0BCEA5', // Teal
    '#FFAB2E', // Orange
    '#C0C0C0', // Silver (was gold)
    '#E5E5E5', // Platinum
    '#D946EF', // Magenta
    '#10B981'  // Green
  ],
};

// Export colors for external use
export { colors };

// Enhanced frosted glass style
export const frostedGlassStyle = {
  backgroundColor: "rgba(26, 26, 26, 0.6)",
  backdropFilter: "blur(12px)",
  borderRadius: "0.75rem",
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
  border: "1px solid rgba(255, 255, 255, 0.07)",
  transition: "all 300ms ease"
};

// Additional frosted glass variants
export const frostedGlassVariants = {
  primary: {
    backgroundColor: "rgba(26, 26, 26, 0.6)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(124, 93, 250, 0.15)",
    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(124, 93, 250, 0.05)"
  },
  secondary: {
    backgroundColor: "rgba(26, 26, 26, 0.6)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(192, 192, 192, 0.15)", // Silver border
    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(192, 192, 192, 0.05)"
  },
  success: {
    backgroundColor: "rgba(26, 26, 26, 0.6)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(14, 186, 177, 0.15)",
    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(14, 186, 177, 0.05)"
  },
}

// Common card style for management pages
export const cardStyle = {
  backgroundColor: "rgba(26, 26, 26, 0.6)",
  backdropFilter: "blur(12px)",
  borderRadius: "0.75rem",
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
  border: "1px solid rgba(255, 255, 255, 0.07)"
};

// Enhanced grid background style with texture, gradient and subtle vignette
export const gridBackgroundStyle = {
  background: `linear-gradient(135deg, #1a1a1a 0%, #121212 50%, #1a1a1a 100%)`,
  backgroundSize: '100% 100%',
  backdropFilter: 'blur(0px)',
  position: 'relative',
  // Subtle box shadow for content area definition
  '& > *': {
    position: 'relative',
    zIndex: 1
  }
};

// Subtle geometric patterns (monochromatic version)
export const indianPatterns = {
  rangoli: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M30 30h30v30H30z' fill='white' fill-opacity='0.03'/%3E%3Cpath d='M0 30h30v30H0z' fill='white' fill-opacity='0.02'/%3E%3Cpath d='M30 0h30v30H30z' fill='white' fill-opacity='0.03'/%3E%3Cpath d='M0 0h30v30H0z' fill='white' fill-opacity='0.02'/%3E%3C/g%3E%3C/svg%3E")`,
  jali: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Ccircle cx='20' cy='20' r='10' stroke='white' stroke-opacity='0.04' stroke-width='1'/%3E%3Ccircle cx='20' cy='20' r='5' stroke='white' stroke-opacity='0.03' stroke-width='1'/%3E%3C/g%3E%3C/svg%3E")`,
  paisley: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 45 C35 35, 20 10, 40 0 C60 10, 45 35, 40 45' stroke='white' stroke-opacity='0.04' fill='none'/%3E%3C/svg%3E")`,
  opacity: 0.05, // Reduced opacity for subtlety
}

// Spacing scale (based on 8px grid)
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  '2xl': '48px',
  '3xl': '64px'
};

// Typography
export const typography = {
  fontFamily: {
    ui: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    data: 'system-ui, sans-serif'
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem'  // 36px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  }
};

// Common button styles
export const buttonGradients = {
  primary: `linear-gradient(135deg, ${colors.brand.purpleDark} 0%, ${colors.brand.purple} 100%)`,
  secondary: `linear-gradient(135deg, ${colors.brand.silverDark} 0%, ${colors.brand.silver} 100%)`, // Silver gradient
  success: `linear-gradient(135deg, ${colors.brand.turquoisedark} 0%, ${colors.brand.turquoise} 100%)`,
  default: `linear-gradient(135deg, ${colors.background.tertiary} 0%, ${colors.background.highlight} 100%)`,
  active: {
    primary: `linear-gradient(135deg, #6B4DEA 0%, #7C5DFA 100%)`, // Reversed purple gradient
    secondary: `linear-gradient(135deg, ${colors.brand.golddark} 0%, ${colors.brand.gold} 100%)`,
    success: `linear-gradient(135deg, ${colors.brand.turquoisedark} 0%, ${colors.brand.turquoise} 100%)`,
  },
  glow: {
    primary: `0 0 15px rgba(124, 93, 250, 0.3)`, // Purple glow
    secondary: `0 0 15px rgba(192, 192, 192, 0.3)`, // Silver glow
    success: `0 0 15px rgba(14, 186, 177, 0.3)`,
  }
};

// Common card styles
export const cardStyles = {
  base: `bg-opacity-70 backdrop-blur-md border border-white/5 rounded-lg overflow-hidden shadow-lg`,
  header: 'p-4 border-b border-white/5',
  content: 'p-4',
  footer: 'p-4 border-t border-white/5 bg-white/5',
  frosted: `
    bg-opacity-60 
    backdrop-blur-md 
    border 
    border-white/10 
    rounded-lg 
    overflow-hidden 
    shadow-lg
    transition-all
    duration-300
  `,
  default: {
    backgroundColor: "rgba(26, 26, 26, 0.6)",
    backdropFilter: "blur(12px)",
    borderRadius: "0.75rem",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.07)"
  },
  elevated: {
    backgroundColor: "rgba(26, 26, 26, 0.7)",
    backdropFilter: "blur(16px)",
    borderRadius: "0.75rem",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.1)"
  },
  accent: {
    backgroundColor: "rgba(26, 26, 26, 0.6)",
    backdropFilter: "blur(12px)",
    borderRadius: "0.75rem",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
    border: "1px solid rgba(124, 93, 250, 0.3)" // Purple accent border
  },
  purple: {
    backgroundColor: "rgba(26, 26, 26, 0.6)",
    backdropFilter: "blur(12px)",
    borderRadius: "0.75rem",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
    border: "1px solid rgba(124, 93, 250, 0.3)" // Purple accent border
  }
};

// Status badge styles
export const badgeStyles = {
  success: `bg-[rgba(11, 206, 165, 0.1)] text-[${colors.status.success}] border border-[rgba(11, 206, 165, 0.3)]`,
  warning: `bg-[rgba(192, 192, 192, 0.1)] text-[${colors.status.warning}] border border-[rgba(192, 192, 192, 0.3)]`, // Silver
  error: `bg-[rgba(178, 34, 34, 0.1)] text-[${colors.status.error}] border border-[rgba(178, 34, 34, 0.3)]`,
  info: `bg-[rgba(66, 133, 244, 0.1)] text-[${colors.status.info}] border border-[rgba(66, 133, 244, 0.3)]`,
  pending: `bg-[rgba(124, 93, 250, 0.1)] text-[${colors.status.pending}] border border-[rgba(124, 93, 250, 0.3)]`,
  active: `bg-[rgba(124, 93, 250, 0.1)] text-[${colors.status.active}] border border-[rgba(124, 93, 250, 0.3)]`
};

// Common animation durations
export const animation = {
  fast: '150ms',
  normal: '250ms',
  slow: '350ms'
};

// Z-index scale
export const zIndex = {
  base: 1,
  dropdown: 10,
  modal: 20,
  toast: 30
};
