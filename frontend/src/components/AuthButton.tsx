/**
 * AuthButton - Branded Button Component
 * 
 * Primary and secondary button variants with consistent burgundy styling,
 * hover effects, and framer-motion animations.
 * 
 * Usage:
 * ```tsx
 * <AuthButton type="submit" variant="primary" loading={submitting}>
 *   Sign In
 * </AuthButton>
 * 
 * <AuthButton variant="secondary" onClick={handleCancel}>
 *   Cancel
 * </AuthButton>
 * ```
 */

import React from 'react';
import { motion } from 'framer-motion';
import { AuthTheme } from 'utils/authTheme';

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function AuthButton({
  variant = 'primary',
  loading = false,
  icon,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: AuthButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: AuthTheme.gradients.primary,
          color: '#FFFFFF',
          border: 'none',
        };
      case 'secondary':
        return {
          background: 'transparent',
          color: AuthTheme.colors.primary,
          border: `1px solid ${AuthTheme.colors.primary}`,
        };
      case 'ghost':
        return {
          background: 'transparent',
          color: AuthTheme.colors.textSecondary,
          border: 'none',
        };
      default:
        return {};
    }
  };

  return (
    <motion.button
      variants={AuthTheme.animations.buttonInteraction}
      whileHover={!disabled && !loading ? 'hover' : undefined}
      whileTap={!disabled && !loading ? 'tap' : undefined}
      className={`h-12 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
        fullWidth ? 'w-full' : ''
      } ${
        disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
      style={getVariantStyles()}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
}
