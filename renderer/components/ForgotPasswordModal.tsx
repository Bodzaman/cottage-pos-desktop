import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from 'utils/supabaseClient';
import { QSAITheme } from 'utils/QSAIDesign';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordModal({ open, onOpenChange }: Props) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Send password reset email via Supabase
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/pos-login?reset=true`,
      });

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
      
      // Auto-close modal after 3 seconds on success
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setEmail('');
      }, 3000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      setEmail('');
      setError(null);
      setSuccess(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-md"
        style={{
          background: `linear-gradient(135deg, ${QSAITheme.background.secondary} 0%, ${QSAITheme.background.dark} 100%)`,
          border: `1px solid rgba(124, 93, 250, 0.2)`,
          boxShadow: `
            0 20px 60px -10px rgba(0, 0, 0, 0.6),
            0 0 0 1px rgba(255, 255, 255, 0.03),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.08),
            0 0 40px ${QSAITheme.purple.glow}
          `,
        }}
      >
        <DialogHeader>
          <DialogTitle 
            className="text-2xl font-poppins font-bold"
            style={{
              background: `linear-gradient(135deg, ${QSAITheme.text.primary} 20%, ${QSAITheme.purple.light} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Reset Password
          </DialogTitle>
          <DialogDescription style={{ color: QSAITheme.text.muted }}>
            Enter your email address and we'll send you a link to reset your password.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="py-8"
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <CheckCircle 
                  className="w-16 h-16" 
                  style={{ color: QSAITheme.purple.light }}
                />
              </motion.div>
              <div className="text-center">
                <h3 
                  className="text-lg font-semibold mb-2"
                  style={{ color: QSAITheme.text.primary }}
                >
                  Check Your Email
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: QSAITheme.text.muted }}
                >
                  We've sent a password reset link to <br />
                  <span style={{ color: QSAITheme.purple.light }}>{email}</span>
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert 
                    style={{
                      background: `linear-gradient(135deg, rgba(124, 93, 250, 0.15) 0%, rgba(124, 93, 250, 0.05) 100%)`,
                      border: `1px solid rgba(124, 93, 250, 0.3)`,
                    }}
                  >
                    <AlertTriangle 
                      className="h-4 w-4" 
                      style={{ color: QSAITheme.purple.light }} 
                    />
                    <AlertDescription style={{ color: QSAITheme.text.secondary }}>
                      {error}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Input */}
            <div className="space-y-2">
              <Label 
                htmlFor="reset-email"
                style={{ 
                  color: QSAITheme.text.secondary,
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
              >
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                  required
                  className="pl-10 transition-all duration-200"
                  style={{
                    background: QSAITheme.background.secondary,
                    border: `1px solid rgba(124, 93, 250, 0.2)`,
                    color: QSAITheme.text.primary,
                    fontSize: '1rem',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem'
                  }}
                  onFocus={(e) => {
                    e.target.style.border = `1px solid ${QSAITheme.purple.light}`;
                    e.target.style.boxShadow = `0 0 0 3px rgba(124, 93, 250, 0.1), 0 0 15px ${QSAITheme.purple.glow}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.border = `1px solid rgba(124, 93, 250, 0.2)`;
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <Mail 
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
                  style={{ color: QSAITheme.text.muted }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 transition-all duration-200"
                style={{
                  background: 'transparent',
                  border: `1px solid rgba(124, 93, 250, 0.3)`,
                  color: QSAITheme.text.secondary,
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = 'rgba(124, 93, 250, 0.1)';
                    e.currentTarget.style.borderColor = QSAITheme.purple.light;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(124, 93, 250, 0.3)';
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !email}
                className="flex-1 transition-all duration-300 font-semibold"
                style={{
                  background: isLoading || !email
                    ? `linear-gradient(135deg, rgba(124, 93, 250, 0.3) 0%, rgba(124, 93, 250, 0.2) 100%)`
                    : `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`,
                  border: 'none',
                  color: QSAITheme.text.primary,
                  boxShadow: isLoading || !email
                    ? 'none'
                    : `0 4px 15px ${QSAITheme.purple.glow}`,
                }}
                onMouseEnter={(e) => {
                  if (!isLoading && email) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 6px 20px ${QSAITheme.purple.glow}`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading && email) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 4px 15px ${QSAITheme.purple.glow}`;
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
