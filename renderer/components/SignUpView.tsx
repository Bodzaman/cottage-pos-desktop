

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, UserPlus, Eye, EyeOff, Check } from 'lucide-react';

// Store Integration
import { useSimpleAuth } from '../utils/simple-auth-context';

// Theme
import { PremiumTheme } from '../utils/premiumTheme';
import { cn } from '../utils/cn';

interface SignUpViewProps {
  onSignupSuccess: () => void;
  onSwitchToLogin: () => void;
  className?: string;
}

/**
 * SignUpView - SPA signup interface
 * 
 * Uses existing useSimpleAuth store for account creation
 * Matches OnlineOrders premium styling
 * Integrates with SPA navigation flow
 */
export function SignUpView({ 
  onSignupSuccess, 
  onSwitchToLogin, 
  className 
}: SignUpViewProps) {
  // Auth integration
  const { signUp, signInWithGoogle, isLoading } = useSimpleAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // Password strength validation
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };
  
  const passwordStrength = getPasswordStrength(formData.password);
  const passwordStrengthText = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength];
  const passwordStrengthColor = ['red', 'orange', 'yellow', 'blue', 'green'][passwordStrength];
  
  // Update form data
  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!acceptTerms) {
      newErrors.terms = 'You must accept the terms and conditions';
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
      const { error } = await signUp(
        formData.email.trim(),
        formData.password,
        {
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          phone: formData.phone.trim() || undefined
        }
      );
      
      if (error) {
        if (error.message.includes('already registered')) {
          setErrors({ general: 'An account with this email already exists. Please sign in instead.' });
        } else if (error.message.includes('Password should be')) {
          setErrors({ password: error.message });
        } else {
          setErrors({ general: error.message || 'Failed to create account. Please try again.' });
        }
      } else {
        toast.success('Account created successfully! Please check your email to verify your account.');
        onSignupSuccess();
      }
    } catch (error) {
      console.error('❌ SignUpView: Unexpected error during sign up:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle Google sign up
  const handleGoogleSignUp = async () => {
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        setErrors({ general: error.message || 'Failed to sign up with Google.' });
        setIsSubmitting(false);
      } else {
        toast.success('Signing up with Google...');
      }
    } catch (error) {
      console.error('❌ SignUpView: Error with Google sign up:', error);
      setErrors({ general: 'Failed to sign up with Google. Please try again.' });
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
        className="w-full max-w-lg"
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
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white font-serif">
              Create Account
            </CardTitle>
            <p className="text-gray-400">
              Join us for the best dining experience
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
            
            {/* Sign Up Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-300">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    placeholder="Enter first name"
                    className={cn(
                      "bg-gray-800 border-gray-700 text-white placeholder-gray-400",
                      "focus:border-silver-500 focus:ring-silver-500",
                      errors.firstName && "border-red-500"
                    )}
                    disabled={isSubmitting}
                    autoComplete="given-name"
                  />
                  {errors.firstName && (
                    <p className="text-red-400 text-sm">{errors.firstName}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-300">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    placeholder="Enter last name"
                    className={cn(
                      "bg-gray-800 border-gray-700 text-white placeholder-gray-400",
                      "focus:border-silver-500 focus:ring-silver-500",
                      errors.lastName && "border-red-500"
                    )}
                    disabled={isSubmitting}
                    autoComplete="family-name"
                  />
                  {errors.lastName && (
                    <p className="text-red-400 text-sm">{errors.lastName}</p>
                  )}
                </div>
              </div>
              
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="Enter your email"
                  className={cn(
                    "bg-gray-800 border-gray-700 text-white placeholder-gray-400",
                    "focus:border-silver-500 focus:ring-silver-500",
                    errors.email && "border-red-500"
                  )}
                  disabled={isSubmitting}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-red-400 text-sm">{errors.email}</p>
                )}
              </div>
              
              {/* Phone Field */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-300">
                  Phone Number (Optional)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  placeholder="Enter your phone number"
                  className={cn(
                    "bg-gray-800 border-gray-700 text-white placeholder-gray-400",
                    "focus:border-silver-500 focus:ring-silver-500",
                    errors.phone && "border-red-500"
                  )}
                  disabled={isSubmitting}
                  autoComplete="tel"
                />
                {errors.phone && (
                  <p className="text-red-400 text-sm">{errors.phone}</p>
                )}
              </div>
              
              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">
                  Password *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    placeholder="Create a strong password"
                    className={cn(
                      "bg-gray-800 border-gray-700 text-white placeholder-gray-400 pr-10",
                      "focus:border-silver-500 focus:ring-silver-500",
                      errors.password && "border-red-500"
                    )}
                    disabled={isSubmitting}
                    autoComplete="new-password"
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
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            passwordStrength === 1 ? 'bg-red-500 w-1/5' :
                            passwordStrength === 2 ? 'bg-[#B47D7D] w-2/5' :
                            passwordStrength === 3 ? 'bg-yellow-500 w-3/5' :
                            passwordStrength === 4 ? 'bg-blue-500 w-4/5' :
                            passwordStrength === 5 ? 'bg-green-500 w-full' : 'w-0'
                          }`}
                        />
                      </div>
                      <span className={`text-xs ${
                        passwordStrength <= 2 ? 'text-red-400' :
                        passwordStrength === 3 ? 'text-yellow-400' :
                        passwordStrength === 4 ? 'text-blue-400' :
                        'text-green-400'
                      }`}>
                        {passwordStrengthText}
                      </span>
                    </div>
                  </div>
                )}
                
                {errors.password && (
                  <p className="text-red-400 text-sm">{errors.password}</p>
                )}
              </div>
              
              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                    placeholder="Confirm your password"
                    className={cn(
                      "bg-gray-800 border-gray-700 text-white placeholder-gray-400 pr-10",
                      "focus:border-silver-500 focus:ring-silver-500",
                      errors.confirmPassword && "border-red-500"
                    )}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-700"
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-sm">{errors.confirmPassword}</p>
                )}
              </div>
              
              {/* Terms and Conditions */}
              <div className="space-y-2">
                <div className="flex items-start space-x-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAcceptTerms(!acceptTerms)}
                    className={cn(
                      "h-5 w-5 p-0 mt-0.5 border rounded",
                      acceptTerms 
                        ? "bg-burgundy-500 border-burgundy-500 text-white" 
                        : "border-gray-600 hover:border-gray-500"
                    )}
                    disabled={isSubmitting}
                  >
                    {acceptTerms && <Check className="w-3 h-3" />}
                  </Button>
                  <p className="text-sm text-gray-400 leading-5">
                    I agree to the{' '}
                    <a href="#" className="text-silver-500 hover:text-silver-400 underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-silver-500 hover:text-silver-400 underline">
                      Privacy Policy
                    </a>
                  </p>
                </div>
                {errors.terms && (
                  <p className="text-red-400 text-sm">{errors.terms}</p>
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
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  'Create Account'
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
            
            {/* Google Sign Up */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignUp}
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
            
            {/* Sign In Link */}
            <div className="text-center">
              <p className="text-gray-400 text-sm">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-silver-500 hover:text-silver-400 font-medium underline"
                  disabled={isSubmitting}
                >
                  Sign in here
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
