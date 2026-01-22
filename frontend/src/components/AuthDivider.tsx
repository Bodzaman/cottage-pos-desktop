/**
 * AuthDivider - Divider with Text
 * 
 * Horizontal divider with centered text, typically used between
 * social login and email login sections.
 * 
 * Usage:
 * ```tsx
 * <AuthDivider text="Or continue with email" />
 * ```
 */

import React from 'react';
import { motion } from 'framer-motion';
import { AuthTheme } from 'utils/authTheme';

interface AuthDividerProps {
  text?: string;
  className?: string;
}

export function AuthDivider({ text = 'Or continue with email', className = '' }: AuthDividerProps) {
  return (
    <motion.div
      variants={AuthTheme.animations.elementSlide}
      className={`relative ${className}`}
    >
      <div className="absolute inset-0 flex items-center">
        <span 
          className="w-full border-t"
          style={{ borderColor: AuthTheme.colors.borderDivider }}
        />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span 
          className="px-2"
          style={{
            background: AuthTheme.colors.cardBg,
            color: AuthTheme.colors.textMuted,
          }}
        >
          {text}
        </span>
      </div>
    </motion.div>
  );
}
