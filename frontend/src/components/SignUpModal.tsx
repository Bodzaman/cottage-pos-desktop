import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Utensils, User, Mail, Phone, Lock, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useSimpleAuth } from 'utils/simple-auth-context';

// Import auth animations
import {
  titleVariants,
  formElementVariants,
  submitButtonVariants,
} from 'utils/authAnimations';

interface SignUpModalProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
  redirectTo?: string;
  context?: 'checkout' | 'favorites' | 'voice-ordering' | 'account';
}

// Schema for signup form with customer reference integration
const signUpSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(10, { message: "Please enter a valid phone number" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function SignUpModal({ 
  onSuccess, 
  onSwitchToLogin, 
  redirectTo = '/online-orders',
  context = 'account'
}: SignUpModalProps) {
  const { signUp, signInWithGoogle } = useSimpleAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [customerRefNumber, setCustomerRefNumber] = useState<string | null>(null);

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof signUpSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      const userData = {
        first_name: values.firstName,
        last_name: values.lastName,
        phone: values.phone,
      };

      const { error: signUpError } = await signUp(values.email, values.password, userData);

      if (signUpError) {
        console.error('Signup error:', signUpError);
        setError(
          signUpError.message || 
          "Failed to create account. Please try again."
        );
        return;
      }

      // Success state with customer reference
      setIsSuccess(true);
      
      // Show success message
      toast.success(
        "Welcome to Cottage Tandoori! Your account has been created successfully.",
        {
          description: customerRefNumber 
            ? `Your customer reference: ${customerRefNumber}`
            : "Check your email for confirmation."
        }
      );

      // Delay before success callback to show success state
      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err) {
      console.error('Unexpected signup error:', err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: googleError } = await signInWithGoogle();

      if (googleError) {
        setError(googleError.message || "Failed to sign up with Google");
        return;
      }

      toast.success("Welcome to Cottage Tandoori!");
      onSuccess();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        variants={titleVariants}
        initial="hidden"
        animate="visible"
        className="text-center py-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="mb-4"
        >
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto" />
        </motion.div>
        
        <h2 className="text-2xl font-bold text-white mb-2">
          Welcome to Cottage Tandoori!
        </h2>
        
        <p className="text-slate-300 mb-4">
          Your account has been created successfully.
        </p>
        
        {customerRefNumber && (
          <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-3 mb-4">
            <p className="text-sm text-amber-200 mb-1">Your Customer Reference:</p>
            <p className="text-lg font-mono font-bold text-amber-100">
              {customerRefNumber}
            </p>
            <p className="text-xs text-amber-300 mt-1">
              Save this reference for customer service
            </p>
          </div>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-slate-400"
        >
          Redirecting to your personalized experience...
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        variants={titleVariants}
        initial="hidden"
        animate="visible"
        className="text-center"
      >
        <div className="flex items-center justify-center mb-3">
          <Utensils className="h-8 w-8 text-amber-400 mr-2" />
          <span className="text-xl font-bold text-white">Cottage Tandoori</span>
        </div>
        <h2 className="text-2xl font-bold text-[#EAECEF] mb-2">Create Your Account</h2>
        <p className="text-[#B7BDC6] text-sm">
          Join our community and unlock personalized dining experiences
        </p>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center"
        >
          <p className="text-red-400 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Google Signup */}
      <motion.div
        variants={formElementVariants}
        initial="hidden"
        animate="visible"
      >
        <Button
          type="button"
          onClick={handleGoogleSignUp}
          className="w-full h-12 bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20 text-white transition-all duration-200 rounded-lg flex items-center justify-center gap-3"
          style={{
            ':hover': {
              borderColor: '#8B1538',
              boxShadow: '0 0 0 2px rgba(139, 21, 56, 0.1)'
            }
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#8B1538';
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(139, 21, 56, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          disabled={isLoading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </Button>
      </motion.div>

      {/* Divider */}
      <motion.div
        variants={formElementVariants}
        initial="hidden"
        animate="visible"
        className="relative"
      >
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#3A3F47]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-800 px-2 text-[#9CA3AF]">
            Or continue with email
          </span>
        </div>
      </motion.div>

      {/* Signup Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              variants={formElementVariants}
              initial="hidden"
              animate="visible"
            >
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-[#EAECEF] block">First Name</FormLabel>
                    <FormControl>
                      <input
                        type="text"
                        placeholder="John"
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent placeholder-white/60 text-white transition-all duration-200"
                        onFocus={(e) => {
                          e.target.style.borderColor = '#8B1538';
                          e.target.style.boxShadow = '0 0 0 3px rgba(139, 21, 56, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                          e.target.style.boxShadow = 'none';
                        }}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </motion.div>

            <motion.div
              variants={formElementVariants}
              initial="hidden"
              animate="visible"
            >
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-[#EAECEF] block">Last Name</FormLabel>
                    <FormControl>
                      <input
                        type="text"
                        placeholder="Doe"
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent placeholder-white/60 text-white transition-all duration-200"
                        onFocus={(e) => {
                          e.target.style.borderColor = '#8B1538';
                          e.target.style.boxShadow = '0 0 0 3px rgba(139, 21, 56, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                          e.target.style.boxShadow = 'none';
                        }}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </motion.div>
          </div>

          <motion.div
            variants={formElementVariants}
            initial="hidden"
            animate="visible"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-[#EAECEF] block">Email address</FormLabel>
                  <FormControl>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent placeholder-white/60 text-white transition-all duration-200"
                      onFocus={(e) => {
                        e.target.style.borderColor = '#8B1538';
                        e.target.style.boxShadow = '0 0 0 3px rgba(139, 21, 56, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        e.target.style.boxShadow = 'none';
                      }}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div
            variants={formElementVariants}
            initial="hidden"
            animate="visible"
          >
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-[#EAECEF] block">Phone Number</FormLabel>
                  <FormControl>
                    <input
                      type="tel"
                      placeholder="0123 456 7890"
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent placeholder-white/60 text-white transition-all duration-200"
                      onFocus={(e) => {
                        e.target.style.borderColor = '#8B1538';
                        e.target.style.boxShadow = '0 0 0 3px rgba(139, 21, 56, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        e.target.style.boxShadow = 'none';
                      }}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div
            variants={formElementVariants}
            initial="hidden"
            animate="visible"
          >
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-[#EAECEF] block">Password</FormLabel>
                  <FormControl>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent placeholder-white/60 text-white transition-all duration-200"
                      onFocus={(e) => {
                        e.target.style.borderColor = '#8B1538';
                        e.target.style.boxShadow = '0 0 0 3px rgba(139, 21, 56, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        e.target.style.boxShadow = 'none';
                      }}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div
            variants={formElementVariants}
            initial="hidden"
            animate="visible"
          >
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-[#EAECEF] block">Confirm Password</FormLabel>
                  <FormControl>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent placeholder-white/60 text-white transition-all duration-200"
                      onFocus={(e) => {
                        e.target.style.borderColor = '#8B1538';
                        e.target.style.boxShadow = '0 0 0 3px rgba(139, 21, 56, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        e.target.style.boxShadow = 'none';
                      }}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div
            variants={submitButtonVariants}
            initial="hidden"
            animate="visible"
            className="pt-2"
          >
            <Button
              type="submit"
              className="w-full text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
              style={{
                background: 'linear-gradient(135deg, #8B1538 0%, #7A1230 100%)',
                boxShadow: '0 4px 15px rgba(139, 21, 56, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 21, 56, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 21, 56, 0.3)';
              }}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </div>
              ) : (
                "Create Account"
              )}
            </Button>
          </motion.div>
        </form>
      </Form>

      {/* Login Link */}
      <div className="text-center mt-6">
        <p className="text-center text-[#B0BEC5]">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-medium transition-colors duration-200 hover:underline"
            style={{
              color: '#8B1538'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#7A1230';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#8B1538';
            }}
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
}
