


/**
 * Premium Luxury Restaurant Theme
 * Modern silver/platinum palette with sleek contemporary aesthetic
 */
export const PremiumTheme = {
  // Modern Luxury Color Palette - Silver & Platinum Elegance
  colors: {
    // Primary luxury silver/platinum (replacing copper)
    silver: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#C0C0C0', // Primary platinum silver
      600: '#A8A8A8',
      700: '#909090',
      800: '#787878',
      900: '#606060'
    },
    
    // Deep burgundy wine (unchanged for contrast)
    burgundy: {
      50: '#FAF4F4',
      100: '#F0E1E1',
      200: '#E1C5C5',
      300: '#CDA3A3',
      400: '#B47D7D',
      500: '#8B1538', // Primary burgundy
      600: '#7A1230',
      700: '#661028',
      800: '#520D20',
      900: '#420A1A'
    },
    
    // Charcoal depths (unchanged)
    charcoal: {
      50: '#F8F8F8',
      100: '#F0F0F0',
      200: '#E0E0E0',
      300: '#C8C8C8',
      400: '#A0A0A0',
      500: '#1A1A1A', // Primary charcoal
      600: '#171717',
      700: '#141414',
      800: '#111111',
      900: '#0F0F0F'
    },
    
    // Cool platinum accents (replacing warm gold)
    platinum: {
      50: '#FEFEFE',
      100: '#FCFCFC',
      200: '#F8F8F8',
      300: '#F0F0F0',
      400: '#E8E8E8',
      500: '#E5E5E5', // Bright platinum
      600: '#D8D8D8',
      700: '#CCCCCC',
      800: '#B8B8B8',
      900: '#A5A5A5'
    },

    // COMPATIBILITY ALIASES - Map old names to new silver/platinum colors
    royal: {
      50: '#FAF4F4',
      100: '#F0E1E1',
      200: '#E1C5C5', 
      300: '#CDA3A3',
      400: '#B47D7D',
      500: '#8B1538', // Burgundy (unchanged)
      600: '#7A1230',
      700: '#661028',
      800: '#520D20',
      900: '#420A1A'
    },
    
    tandoori: {
      50: '#F8F8F8',
      100: '#F0F0F0',
      200: '#E0E0E0',
      300: '#C8C8C8', 
      400: '#A0A0A0',
      500: '#1A1A1A', // Charcoal (unchanged)
      600: '#171717',
      700: '#141414',
      800: '#111111',
      900: '#0F0F0F'
    },

    // Map old gold to new platinum
    gold: {
      50: '#FEFEFE',
      100: '#FCFCFC',
      200: '#F8F8F8',
      300: '#F0F0F0',
      400: '#E8E8E8',
      500: '#E5E5E5', // Platinum
      600: '#D8D8D8',
      700: '#CCCCCC',
      800: '#B8B8B8',
      900: '#A5A5A5'
    },

    // Map old saffron to new silver (CRITICAL FIX)
    saffron: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#C0C0C0', // Same as silver
      600: '#A8A8A8',
      700: '#909090',
      800: '#787878',
      900: '#606060'
    },

    // Dark backgrounds and surfaces (unchanged)
    dark: {
      50: '#F5F5F5',
      100: '#E9E9E9', 
      200: '#D3D3D3',
      300: '#BDBDBD',
      400: '#A7A7A7',
      500: '#919191',
      600: '#7B7B7B', 
      700: '#656565',
      800: '#1A1A1A', // Primary dark surface
      850: '#171717', // Secondary dark
      900: '#0F0F0F', // Deepest dark
      950: '#0A0A0A'  // Absolute black
    },

    // Text colors for modern luxury theme
    text: {
      primary: '#FFFFFF',     // Pure white for headers
      secondary: '#E5E5E5',   // Light gray for body text
      muted: '#B0B0B0',       // Muted for subtle text
      accent: '#C0C0C0',      // Silver for accents
      inverse: '#0F0F0F'      // Dark text on light backgrounds
    },

    // Background hierarchy (unchanged)
    background: {
      primary: '#0F0F0F',     // Main background
      secondary: '#1A1A1A',   // Card backgrounds
      tertiary: '#252525',    // Elevated surfaces
      highlight: '#2A2A2A'    // Interactive highlights
    },

    // Border colors (unchanged)
    border: {
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.2)',
      heavy: 'rgba(255, 255, 255, 0.3)'
    },

    // Status colors (unchanged)
    status: {
      success: '#10B981',
      warning: '#F59E0B', 
      error: '#EF4444',
      info: '#3B82F6'
    }
  },

  // Modern shadows and glows
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
      // Compatibility aliases
      saffron: '0 0 20px rgba(192, 192, 192, 0.3)', // Same as silver
      royal: '0 0 20px rgba(139, 21, 56, 0.3)',      // Same as burgundy
      tandoori: '0 0 20px rgba(26, 26, 26, 0.3)',    // Same as charcoal
      gold: '0 0 20px rgba(229, 229, 229, 0.3)'      // Same as platinum
    }
  },

  // Typography for modern luxury aesthetic (unchanged)
  typography: {
    fontFamily: {
      serif: 'Cinzel, Georgia, serif',      // Luxury serif for headings
      sans: 'Inter, sans-serif',            // Clean sans for body
      display: 'Playfair Display, serif'    // Elegant display font
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem', 
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    }
  },

  // Animation and transitions (unchanged)
  animation: {
    duration: {
      fast: '150ms',
      medium: '250ms',
      slow: '350ms'
    },
    easing: {
      // Use framer-motion compatible easing function instead of CSS cubic-bezier
      smooth: [0.25, 0.46, 0.45, 0.94]
    }
  },

  // Spice level indicators with modern styling
  spice: {
    colors: {
      mild: '#10B981',
      medium: '#E5E5E5', // Platinum
      hot: '#C0C0C0',    // Silver  
      extraHot: '#8B1538' // Burgundy
    },
    
    emojis: {
      mild: '🌿',
      medium: '🌶️',
      hot: '🌶️🌶️',
      extraHot: '🌶️🌶️🌶️'
    }
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

export default PremiumTheme;
