
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, LogIn, Eye, EyeOff } from 'lucide-react';

// Store Integration
import { useSimpleAuth } from '../utils/simple-auth-context';

// Theme
import { PremiumTheme } from '../utils/premiumTheme';
import { cn } from '../utils/cn';

interface LoginViewProps {
  onLoginSuccess: () => void;
  onSwitchToSignup: () => void;
  className?: string;
}

/**
 * LoginView - SPA login interface
 * 
 * Uses existing useSimpleAuth store for authentication
 * Matches OnlineOrders premium styling
 * Integrates with SPA navigation flow
 */
export function LoginView({ 
  onLoginSuccess, 
  onSwitchToSignup, 
  className 
}: LoginViewProps) {
  // Auth integration
  const { signIn, signInWithGoogle, isLoading } = useSimpleAuth();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  
  // Validation
  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const { error } = await signIn(email.trim(), password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrors({ general: 'Invalid email or password. Please try again.' });
        } else if (error.message.includes('Email not confirmed')) {
          setErrors({ general: 'Please check your email and click the confirmation link.' });
        } else {
          setErrors({ general: error.message || 'Failed to sign in. Please try again.' });
        }
      } else {
        toast.success('Welcome back!');
        onLoginSuccess();
      }
    } catch (error) {
      console.error('❌ LoginView: Unexpected error during sign in:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        setErrors({ general: error.message || 'Failed to sign in with Google.' });
        setIsSubmitting(false);
      } else {
        // Success will be handled by auth state change
        toast.success('Signing in with Google...');
      }
    } catch (error) {
      console.error('❌ LoginView: Error with Google sign in:', error);
      setErrors({ general: 'Failed to sign in with Google. Please try again.' });
      setIsSubmitting(false);
    }
  };
  
  return (
    <div 
      className={cn("flex-1 flex items-center justify-center px-4 py-8", className)}
      style={{ background: PremiumTheme.colors.background.primary }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: PremiumTheme.animation.easing.smooth }}
        className="w-full max-w-md"
      >
        <Card 
          className="border-gray-800 shadow-2xl"
          style={{ 
            background: PremiumTheme.colors.background.secondary,
            boxShadow: PremiumTheme.shadows.elevation.lg
          }}
        >
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-burgundy-500 to-burgundy-700 flex items-center justify-center">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white font-serif">
              Welcome Back
            </CardTitle>
            <p className="text-gray-400">
              Sign in to your account to continue ordering
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* General Error */}
            {errors.general && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 p-3 bg-red-900/20 border border-red-700 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm">{errors.general}</span>
              </motion.div>
            )}
            
            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={cn(
                    "bg-gray-800 border-gray-700 text-white placeholder-gray-400",
                    "focus:border-silver-500 focus:ring-silver-500",
                    errors.email && "border-red-500 focus:border-red-500"
                  )}
                  disabled={isSubmitting}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-red-400 text-sm">{errors.email}</p>
                )}
              </div>
              
              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={cn(
                      "bg-gray-800 border-gray-700 text-white placeholder-gray-400 pr-10",
                      "focus:border-silver-500 focus:ring-silver-500",
                      errors.password && "border-red-500 focus:border-red-500"
                    )}
                    disabled={isSubmitting}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-700"
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-sm">{errors.password}</p>
                )}
              </div>
              
              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-burgundy-500 hover:bg-burgundy-600 text-white"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing In...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
            
            {/* Divider */}
            <div className="relative">
              <Separator className="bg-gray-700" />
              <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 px-2 text-xs text-gray-400">
                OR
              </span>
            </div>
            
            {/* Google Sign In */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting || isLoading}
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
            
            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-gray-400 text-sm">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToSignup}
                  className="text-silver-500 hover:text-silver-400 font-medium underline"
                  disabled={isSubmitting}
                >
                  Create one now
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
