/**
 * AuthInput - Branded Input Component
 * 
 * Styled input with glassmorphism background, burgundy focus states,
 * and optional password visibility toggle.
 * 
 * Usage:
 * ```tsx
 * <AuthInput
 *   label="Email address"
 *   type="email"
 *   placeholder="Enter your email"
 *   error={errors.email?.message}
 *   {...register('email')}
 * />
 * 
 * <AuthInput
 *   label="Password"
 *   type="password"
 *   showPasswordToggle
 *   placeholder="Enter your password"
 *   error={errors.password?.message}
 *   {...register('password')}
 * />
 * ```
 */

import React, { useState, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { AuthTheme } from 'utils/authTheme';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
  icon?: React.ReactNode;
  inputMode?: 'text' | 'email' | 'tel' | 'url' | 'numeric' | 'decimal' | 'search';
  autoComplete?: string;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, showPasswordToggle = false, icon, className = '', type = 'text', inputMode, autoComplete, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    
    const inputType = showPasswordToggle && showPassword ? 'text' : type;
    const isPasswordField = type === 'password' && showPasswordToggle;

    return (
      <motion.div
        variants={AuthTheme.animations.elementSlide}
        className={`space-y-2 ${className}`}
      >
        {label && (
          <label 
            className="text-sm font-medium block"
            style={{ color: AuthTheme.colors.textPrimary }}
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            type={inputType}
            inputMode={inputMode}
            autoComplete={autoComplete}
            className={`w-full px-4 py-3 backdrop-blur-sm border rounded-lg focus:outline-none transition-all duration-200 ${
              icon ? 'pl-10' : ''
            } ${
              isPasswordField ? 'pr-12' : ''
            }`}
            style={{
              background: AuthTheme.colors.inputBg,
              borderColor: isFocused ? AuthTheme.colors.inputBorderFocus : AuthTheme.colors.inputBorder,
              boxShadow: isFocused ? AuthTheme.shadows.focusRing : 'none',
              color: AuthTheme.colors.inputText,
            }}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          
          {isPasswordField && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
          )}
        </div>
        
        {error && (
          <p 
            className="text-sm"
            style={{ color: AuthTheme.colors.error }}
          >
            {error}
          </p>
        )}
      </motion.div>
    );
  }
);

AuthInput.displayName = 'AuthInput';
