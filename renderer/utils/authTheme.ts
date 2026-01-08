/**
 * Auth Design System - Unified Design Tokens
 * 
 * This file contains all design tokens for authentication and customer-facing pages.
 * It provides a single source of truth for colors, animations, shadows, and gradients.
 * 
 * Usage:
 * ```typescript
 * import { AuthTheme } from 'utils/authTheme';
 * 
 * // Colors
 * style={{ color: AuthTheme.colors.primary }}
 * 
 * // Animations (with framer-motion)
 * <motion.div variants={AuthTheme.animations.containerFade}>
 * 
 * // Shadows
 * style={{ boxShadow: AuthTheme.shadows.card }}
 * ```
 */

export const AuthTheme = {
  /**
   * Color Palette - Burgundy Brand Identity
   * Primary brand color: #8B1538 (Burgundy)
   */
  colors: {
    // Primary burgundy brand color
    primary: '#8B1538',
    primaryHover: '#7A1230',
    primaryLight: 'rgba(139, 21, 56, 0.1)',
    primaryMedium: 'rgba(139, 21, 56, 0.3)',
    
    // Secondary burgundy shade (for gradients)
    secondary: '#B91C1C',
    
    // Background colors
    background: '#0B0C0E',
    cardBg: '#17191D',
    cardBgBlur: 'rgba(23, 25, 29, 0.6)',
    
    // Border colors
    border: 'rgba(139, 21, 56, 0.2)',
    borderLight: 'rgba(139, 21, 56, 0.1)',
    borderMedium: 'rgba(139, 21, 56, 0.3)',
    borderStrong: 'rgba(139, 21, 56, 0.5)',
    borderDivider: '#3A3F47',
    
    // Text colors
    textPrimary: '#EAECEF',
    textSecondary: '#B7BDC6',
    textMuted: '#9CA3AF',
    textDark: '#8B92A0',
    
    // Input colors
    inputBg: 'rgba(255, 255, 255, 0.1)',
    inputBorder: 'rgba(255, 255, 255, 0.2)',
    inputBorderFocus: '#8B1538',
    inputPlaceholder: 'rgba(255, 255, 255, 0.6)',
    inputText: '#FFFFFF',
    
    // State colors
    success: '#10B981',
    successLight: 'rgba(16, 185, 129, 0.1)',
    successBorder: 'rgba(16, 185, 129, 0.3)',
    
    error: '#EF4444',
    errorLight: 'rgba(239, 68, 68, 0.1)',
    errorBorder: 'rgba(239, 68, 68, 0.3)',
    
    warning: '#F59E0B',
    warningLight: 'rgba(245, 158, 11, 0.1)',
    warningBorder: 'rgba(245, 158, 11, 0.3)',
    
    // Social button colors
    googleHover: 'rgba(255, 255, 255, 0.2)',
  },

  /**
   * Framer Motion Animation Variants
   * Consistent animations across all auth pages
   */
  animations: {
    // Container fade-in with stagger children
    containerFade: {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.2,
        },
      },
    },

    // Title slide from top
    titleSlide: {
      hidden: { opacity: 0, y: -20 },
      visible: { 
        opacity: 1, 
        y: 0, 
        transition: { duration: 0.5 } 
      },
    },

    // Card scale and fade
    cardScale: {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { 
        opacity: 1, 
        scale: 1, 
        transition: { 
          duration: 0.5, 
          ease: "easeOut" 
        } 
      },
    },

    // Form element slide from left
    elementSlide: {
      hidden: { opacity: 0, x: -10 },
      visible: { 
        opacity: 1, 
        x: 0, 
        transition: { duration: 0.4 } 
      },
    },

    // Button hover and tap states
    buttonInteraction: {
      hover: { 
        scale: 1.05, 
        boxShadow: "0px 8px 25px rgba(139, 21, 56, 0.3)" 
      },
      tap: { scale: 0.95 },
    },

    // Fade in only
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { 
        opacity: 1, 
        transition: { duration: 0.3 } 
      },
    },
  },

  /**
   * Shadow Styles
   * Burgundy-tinted shadows for brand consistency
   */
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

  /**
   * Gradient Styles
   * Burgundy-based gradients for backgrounds and borders
   */
  gradients: {
    primary: 'linear-gradient(135deg, #8B1538 0%, #7A1230 100%)',
    primaryReverse: 'linear-gradient(135deg, #7A1230 0%, #8B1538 100%)',
    border: 'linear-gradient(135deg, rgba(139, 21, 56, 0.2) 0%, transparent 50%, rgba(122, 18, 48, 0.2) 100%)',
    borderGlow: 'linear-gradient(135deg, rgba(139, 21, 56, 0.2) 0%, transparent 50%, rgba(185, 28, 28, 0.2) 100%)',
    card: 'linear-gradient(135deg, rgba(139, 21, 56, 0.05) 0%, transparent 100%)',
  },

  /**
   * Spacing System
   * Consistent spacing for auth components
   */
  spacing: {
    cardPadding: '2rem',
    formGap: '1.5rem',
    sectionGap: '2rem',
    elementGap: '0.5rem',
  },

  /**
   * Border Radius
   */
  radius: {
    card: '1rem',
    input: '0.5rem',
    button: '0.5rem',
  },

  /**
   * Typography Styles
   */
  typography: {
    title: {
      fontSize: '1.875rem',
      fontWeight: '600',
      color: '#EAECEF',
      letterSpacing: '-0.025em',
    },
    subtitle: {
      fontSize: '1rem',
      fontWeight: '400',
      color: '#B7BDC6',
    },
    label: {
      fontSize: '0.875rem',
      fontWeight: '500',
      color: '#EAECEF',
    },
    error: {
      fontSize: '0.875rem',
      color: '#EF4444',
    },
    success: {
      fontSize: '0.875rem',
      color: '#10B981',
    },
  },
};
