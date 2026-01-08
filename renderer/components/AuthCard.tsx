/**
 * AuthCard - Glassmorphism Card Component
 * 
 * Styled card with consistent glassmorphism effects, burgundy border glow,
 * and framer-motion animations for all auth forms.
 * 
 * Usage:
 * ```tsx
 * <AuthCard>
 *   <form>...</form>
 * </AuthCard>
 * ```
 */

import React from 'react';
import { motion } from 'framer-motion';
import { AuthTheme } from 'utils/authTheme';

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className = '' }: AuthCardProps) {
  return (
    <motion.div
      variants={AuthTheme.animations.cardScale}
      className={`rounded-2xl backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden ${className}`}
      style={{
        border: `1px solid ${AuthTheme.colors.borderMedium}`,
        background: AuthTheme.colors.cardBgBlur,
        boxShadow: AuthTheme.shadows.cardStrong,
      }}
    >
      {/* Border glow effect */}
      <div 
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: AuthTheme.gradients.borderGlow,
        }}
      />
      
      {/* Content */}
      <div className="relative">
        {children}
      </div>
    </motion.div>
  );
}
