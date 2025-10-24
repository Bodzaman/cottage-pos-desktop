import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, AlertTriangle, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import brain from 'brain';
import { getDeviceFingerprint } from 'utils/deviceFingerprint';
import { usePOSAuth } from 'utils/usePOSAuth';
import { supabase } from 'utils/supabaseClient';
import { QSAITheme } from 'utils/QSAIDesign';
import { AnimatedNucleus } from 'components/AnimatedNucleus';
import { ForgotPasswordModal } from 'components/ForgotPasswordModal';

const APP_VERSION = 'v1.0.2';

export default function POSLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const [lastLoginInfo, setLastLoginInfo] = useState<{timestamp: string; isNewDevice: boolean} | null>(null);
  
  const navigate = useNavigate();
  // ✅ Zustand store - all components share this state
  const { login, isAuthenticated, isLoading: authLoading } = usePOSAuth();
  
  // ============================================================================
  // NAVIGATION GUARDS - PREVENT REDIRECT LOOPS
  // ============================================================================
  const hasRedirectedRef = useRef(false);
  const lastRedirectTimeRef = useRef(0);
  const REDIRECT_COOLDOWN = 1000; // 1 second cooldown between redirects

  // ✅ ENABLED: Redirect to POSDesktop if already authenticated
  useEffect(() => {
    if (hasRedirectedRef.current) {
      return;
    }
    
    const now = Date.now();
    if (now - lastRedirectTimeRef.current < REDIRECT_COOLDOWN) {
      return;
    }
    
    if (!authLoading && isAuthenticated) {
      hasRedirectedRef.current = true;
      lastRedirectTimeRef.current = now;
      navigate('/pos-desktop', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);
  
  // ✅ ENABLED: Reset redirect guard
  useEffect(() => {
    if (!isAuthenticated) {
      hasRedirectedRef.current = false;
    }
  }, [isAuthenticated]);

  // Check if device is locked on mount
  useEffect(() => {
    checkLockStatus();
  }, []);

  const checkLockStatus = async () => {
    try {
      const deviceFingerprint = getDeviceFingerprint();
      const response = await brain.get_admin_lock_status({ device_fingerprint: deviceFingerprint });
      const data = await response.json();

      if (data.is_locked && data.cooldown_until) {
        const cooldownTime = new Date(data.cooldown_until).getTime();
        const now = Date.now();
        const remainingMs = cooldownTime - now;

        if (remainingMs > 0) {
          setIsLocked(true);
          const minutes = Math.ceil(remainingMs / 60000);
          setLockMessage(`Too many failed attempts. Please wait ${minutes} minute${minutes > 1 ? 's' : ''}.`);

          // Auto-unlock when cooldown expires
          setTimeout(() => {
            setIsLocked(false);
            setLockMessage('');
          }, remainingMs);
        }
      }
    } catch (err) {
      console.error('Failed to check lock status:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      return;
    }

    setError(null);
    setShakeError(false);
    setIsLoading(true);

    try {
      const deviceFingerprint = getDeviceFingerprint();
      
      // Step 1: Sign in with Supabase (creates frontend session)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError || !authData.user) {
        setError('Invalid email or password');
        setShakeError(true);
        setTimeout(() => setShakeError(false), 500);
        setIsLoading(false);
        return;
      }

      // Step 2: Verify user has POS access
      const accessResponse = await brain.check_pos_access({
        user_id: authData.user.id,
      });
      const accessData = await accessResponse.json();

      if (!accessData.has_access) {
        await supabase.auth.signOut(); // Clean up session
        setError('Your account does not have POS access. Please contact an administrator.');
        setShakeError(true);
        setTimeout(() => setShakeError(false), 500);
        setIsLoading(false);
        return;
      }

      // Step 3: Get previous last login info BEFORE updating
      const previousLastLogin = authData.user.user_metadata?.last_login;
      const previousDevice = authData.user.user_metadata?.last_login_device;
      const isNewDevice = previousDevice && previousDevice !== deviceFingerprint.substring(0, 20);
      
      if (previousLastLogin) {
        setLastLoginInfo({
          timestamp: previousLastLogin,
          isNewDevice: !!isNewDevice
        });
      }

      // Step 4: Trust device if requested
      if (trustDevice) {
        await brain.trust_device_for_user({
          user_id: authData.user.id,
          device_fingerprint: deviceFingerprint,
          label: 'POS Device',
        });
      }

      // Step 5: Update local auth state
      login(authData.user.email || email, {
        userId: authData.user.id,
        role: accessData.role,
        session: authData.session,
      });

      // Step 6: Store last login timestamp in user metadata
      try {
        await supabase.auth.updateUser({
          data: {
            last_login: new Date().toISOString(),
            last_login_device: deviceFingerprint.substring(0, 20) // Store partial fingerprint for reference
          }
        });
      } catch (metaError) {
        console.error('Failed to update last login metadata:', metaError);
        // Non-critical, continue with login
      }

      // Show success animation, then redirect after 1 second
      setLoginSuccess(true);
      setTimeout(() => {
        navigate('/pos-desktop', { replace: true });
      }, 1000);
    } catch (err) {
      console.error('Login failed:', err);
      setError('Login failed. Please try again.');
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="h-screen w-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${QSAITheme.background.dark} 0%, ${QSAITheme.background.primary} 50%, ${QSAITheme.background.dark} 100%)`,
        backgroundImage: `
          linear-gradient(135deg, ${QSAITheme.background.dark} 0%, ${QSAITheme.background.primary} 50%, ${QSAITheme.background.dark} 100%),
          radial-gradient(circle at 20% 50%, rgba(124, 93, 250, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 80% 50%, rgba(124, 93, 250, 0.08) 0%, transparent 50%)
        `
      }}
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <motion.div 
          className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${QSAITheme.purple.glow} 0%, transparent 70%)` }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${QSAITheme.purple.glow} 0%, transparent 70%)` }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      {/* Ambient Background Gradient Shift Animation */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, transparent 0%, rgba(124, 93, 250, 0.03) 50%, transparent 100%)`,
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Main Container - Centers everything */}
      <div className="w-full max-w-md px-4 sm:px-0 relative z-10 flex flex-col items-center">
        
        {/* Login Card */}
        <motion.div 
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            background: `linear-gradient(135deg, ${QSAITheme.background.secondary} 0%, ${QSAITheme.background.dark} 100%)`,
            borderRadius: '16px',
            border: `1px solid rgba(124, 93, 250, 0.15)`,
            boxShadow: `
              0 20px 60px -10px rgba(0, 0, 0, 0.6),
              0 0 0 1px rgba(255, 255, 255, 0.03),
              inset 0 1px 0 0 rgba(255, 255, 255, 0.08),
              0 0 40px ${QSAITheme.purple.glow}
            `,
            padding: '2.5rem'
          }}
        >
          {/* Header */}
          <motion.div 
            className="space-y-2 text-center mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {/* Logo Mark & Branding */}
            <div className="flex flex-col items-center space-y-3 mb-8">
              {/* Animated Nucleus Logo */}
              <AnimatedNucleus size={72} />
            </div>
            
            {/* Platform Name */}
            <h1 
              className="text-4xl font-poppins font-bold mb-3" 
              style={{
                background: `linear-gradient(135deg, ${QSAITheme.text.primary} 20%, ${QSAITheme.purple.light} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.01em'
              }}
            >
              QuickServe AI
            </h1>
            
            {/* Subtitle */}
            <p 
              className="text-base font-medium mb-2"
              style={{ 
                color: QSAITheme.text.muted,
                letterSpacing: '0.02em'
              }}
            >
              AI-Powered Restaurant Platform
            </p>
            
            {/* Helper Text */}
            <p className="text-sm" style={{ color: QSAITheme.text.muted, opacity: 0.7 }}>
              Sign in with your credentials to access the POS
            </p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Lockout Warning */}
            <AnimatePresence>
              {isLocked && (
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
                      color: QSAITheme.text.primary
                    }}
                  >
                    <AlertTriangle className="h-4 w-4" style={{ color: QSAITheme.purple.light }} />
                    <AlertDescription style={{ color: QSAITheme.text.secondary }}>{lockMessage}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
              {error && !isLocked && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ 
                    opacity: 1, 
                    height: 'auto',
                    x: shakeError ? [-10, 10, -10, 10, 0] : 0
                  }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ 
                    duration: shakeError ? 0.5 : 0.3,
                    times: shakeError ? [0, 0.25, 0.5, 0.75, 1] : undefined
                  }}
                >
                  <Alert 
                    style={{
                      background: `linear-gradient(135deg, rgba(124, 93, 250, 0.15) 0%, rgba(124, 93, 250, 0.05) 100%)`,
                      border: `1px solid rgba(124, 93, 250, 0.3)`,
                      color: QSAITheme.text.primary
                    }}
                  >
                    <AlertTriangle className="h-4 w-4" style={{ color: QSAITheme.purple.light }} />
                    <AlertDescription style={{ color: QSAITheme.text.secondary }}>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Field */}
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <Label 
                htmlFor="email"
                style={{ 
                  color: QSAITheme.text.secondary,
                  letterSpacing: '0.01em',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || isLocked}
                autoComplete="email"
                autoFocus
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-offset-0"
                style={{
                  background: QSAITheme.background.secondary,
                  border: `1px solid rgba(124, 93, 250, 0.2)`,
                  color: QSAITheme.text.primary,
                  fontSize: '1rem',
                  padding: '0.75rem'
                }}
                onFocus={(e) => {
                  e.target.style.border = `1px solid ${QSAITheme.purple.light}`;
                  e.target.style.boxShadow = `0 0 0 3px rgba(124, 93, 250, 0.15), 0 0 15px ${QSAITheme.purple.glow}`;
                  e.target.style.outline = `2px solid ${QSAITheme.purple.light}`;
                  e.target.style.outlineOffset = '2px';
                }}
                onBlur={(e) => {
                  e.target.style.border = `1px solid rgba(124, 93, 250, 0.2)`;
                  e.target.style.boxShadow = 'none';
                  e.target.style.outline = 'none';
                }}
              />
            </motion.div>

            {/* Password Field */}
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <Label 
                htmlFor="password"
                style={{ 
                  color: QSAITheme.text.secondary,
                  letterSpacing: '0.01em',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || isLocked}
                  autoComplete="current-password"
                  required
                  className="pr-10 transition-all duration-200 focus:ring-2 focus:ring-offset-0"
                  style={{
                    background: QSAITheme.background.secondary,
                    border: `1px solid rgba(124, 93, 250, 0.2)`,
                    color: QSAITheme.text.primary,
                    fontSize: '1rem',
                    padding: '0.75rem'
                  }}
                  onFocus={(e) => {
                    e.target.style.border = `1px solid ${QSAITheme.purple.light}`;
                    e.target.style.boxShadow = `0 0 0 3px rgba(124, 93, 250, 0.15), 0 0 15px ${QSAITheme.purple.glow}`;
                    e.target.style.outline = `2px solid ${QSAITheme.purple.light}`;
                    e.target.style.outlineOffset = '2px';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = `1px solid rgba(124, 93, 250, 0.2)`;
                    e.target.style.boxShadow = 'none';
                    e.target.style.outline = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-200"
                  style={{ color: QSAITheme.text.muted }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = QSAITheme.purple.light;
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = QSAITheme.text.muted;
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  }}
                  disabled={isLoading || isLocked}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Forgot Password Link */}
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  disabled={isLoading || isLocked}
                  className="text-xs transition-all duration-200 hover:underline"
                  style={{ 
                    color: QSAITheme.text.muted,
                    cursor: isLoading || isLocked ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading && !isLocked) {
                      e.currentTarget.style.color = QSAITheme.purple.light;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = QSAITheme.text.muted;
                  }}
                >
                  Forgot password?
                </button>
              </div>
            </motion.div>

            {/* Trust Device Checkbox */}
            <motion.div 
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <Checkbox
                id="trust-device"
                checked={trustDevice}
                onCheckedChange={(checked) => setTrustDevice(checked === true)}
                disabled={isLoading || isLocked}
                className="transition-all duration-200"
                style={{
                  border: `1px solid rgba(124, 93, 250, 0.3)`,
                }}
              />
              <Label
                htmlFor="trust-device"
                className="text-sm font-normal cursor-pointer transition-colors duration-200"
                style={{ color: QSAITheme.text.muted }}
                onMouseEnter={(e) => e.currentTarget.style.color = QSAITheme.text.secondary}
                onMouseLeave={(e) => e.currentTarget.style.color = QSAITheme.text.muted}
              >
                Trust this device (skip login next time)
              </Label>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <Button
                type="submit"
                className="w-full transition-all duration-300 font-semibold text-base"
                disabled={isLoading || isLocked || !email || !password || loginSuccess}
                style={{
                  background: isLoading || isLocked || !email || !password || loginSuccess
                    ? `linear-gradient(135deg, rgba(124, 93, 250, 0.3) 0%, rgba(124, 93, 250, 0.2) 100%)`
                    : `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`,
                  border: 'none',
                  color: QSAITheme.text.primary,
                  padding: '0.875rem',
                  boxShadow: isLoading || isLocked || !email || !password || loginSuccess
                    ? 'none'
                    : `0 4px 15px ${QSAITheme.purple.glow}`,
                  cursor: isLoading || isLocked || !email || !password || loginSuccess ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading && !isLocked && email && password && !loginSuccess) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 6px 20px ${QSAITheme.purple.glow}, 0 0 30px ${QSAITheme.purple.glow}`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading && !isLocked && email && password && !loginSuccess) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 4px 15px ${QSAITheme.purple.glow}`;
                  }
                }}
              >
                {loginSuccess ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      <CheckCircle className="mr-2 h-5 w-5" />
                    </motion.div>
                    Success!
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
              
              {/* Last Login & New Device Info - Shows during success state */}
              <AnimatePresence>
                {loginSuccess && lastLoginInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="mt-3 space-y-1.5"
                  >
                    {/* Last Login Timestamp */}
                    <div 
                      className="text-center text-xs"
                      style={{ color: QSAITheme.text.muted }}
                    >
                      Last login: {new Date(lastLoginInfo.timestamp).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    
                    {/* New Device Warning */}
                    {lastLoginInfo.isNewDevice && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded"
                        style={{
                          background: 'rgba(251, 191, 36, 0.1)',
                          border: '1px solid rgba(251, 191, 36, 0.3)',
                          color: '#fbbf24'
                        }}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>Login from new device detected</span>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Press Enter Hint */}
              {!isLoading && !isLocked && email && password && !loginSuccess && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="text-center mt-2 text-xs"
                  style={{ color: QSAITheme.text.muted }}
                >
                  Press <kbd className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(124, 93, 250, 0.15)', border: '1px solid rgba(124, 93, 250, 0.3)' }}>Enter</kbd> to sign in
                </motion.p>
              )}
            </motion.div>
            
            {/* Trust Signals - Security Badges */}
            <motion.div
              className="flex items-center justify-center gap-4 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 0.65, duration: 0.5 }}
            >
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full" style={{ background: QSAITheme.purple.light }} />
                <span className="text-[10px] font-medium" style={{ color: QSAITheme.text.muted }}>256-bit Encryption</span>
              </div>
              <span style={{ color: 'rgba(124, 93, 250, 0.2)' }}>•</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full" style={{ background: QSAITheme.purple.light }} />
                <span className="text-[10px] font-medium" style={{ color: QSAITheme.text.muted }}>SOC 2 Compliant</span>
              </div>
              <span style={{ color: 'rgba(124, 93, 250, 0.2)' }}>•</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full" style={{ background: '#10b981' }} />
                <span className="text-[10px] font-medium" style={{ color: QSAITheme.text.muted }}>99.9% Uptime</span>
              </div>
            </motion.div>

            {/* Secure Login Badge */}
            <motion.div
              className="flex items-center justify-center gap-2 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              style={{
                background: 'rgba(91, 33, 182, 0.1)',
                border: '1px solid rgba(124, 93, 250, 0.2)',
                borderRadius: '6px',
                padding: '0.5rem 1rem'
              }}
            >
              <Lock className="h-3 w-3" style={{ color: QSAITheme.purple.light }} />
              <span 
                className="text-xs font-medium"
                style={{ 
                  color: QSAITheme.text.muted,
                  letterSpacing: '0.02em'
                }}
              >
                Production-Ready Restaurant Platform
              </span>
            </motion.div>
          </form>
        </motion.div>
        
        {/* Footer Section - Outside Card */}
        <motion.div
          className="w-full flex flex-col items-center mt-8 space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          {/* System Status Indicator */}
          <div className="flex items-center justify-center gap-2">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ 
                background: '#10b981',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
              }}
            />
            <span 
              className="text-xs"
              style={{ color: QSAITheme.text.muted }}
            >
              All systems operational
            </span>
          </div>

          {/* Footer Links */}
          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => window.open('/privacy-policy', '_blank')}
              className="transition-colors duration-200 hover:underline"
              style={{ color: QSAITheme.text.muted }}
              onMouseEnter={(e) => e.currentTarget.style.color = QSAITheme.purple.light}
              onMouseLeave={(e) => e.currentTarget.style.color = QSAITheme.text.muted}
            >
              Privacy Policy
            </button>
            <span style={{ color: 'rgba(124, 93, 250, 0.3)' }}>|</span>
            <button
              type="button"
              onClick={() => window.open('/terms-of-service', '_blank')}
              className="transition-colors duration-200 hover:underline"
              style={{ color: QSAITheme.text.muted }}
              onMouseEnter={(e) => e.currentTarget.style.color = QSAITheme.purple.light}
              onMouseLeave={(e) => e.currentTarget.style.color = QSAITheme.text.muted}
            >
              Terms of Service
            </button>
            <span style={{ color: 'rgba(124, 93, 250, 0.3)' }}>|</span>
            <button
              type="button"
              onClick={() => window.open('/help-center', '_blank')}
              className="transition-colors duration-200 hover:underline"
              style={{ color: QSAITheme.text.muted }}
              onMouseEnter={(e) => e.currentTarget.style.color = QSAITheme.purple.light}
              onMouseLeave={(e) => e.currentTarget.style.color = QSAITheme.text.muted}
            >
              Help Center
            </button>
          </div>

          {/* Powered by QuickServe AI */}
          <div className="text-center">
            <div className="h-px w-20 mx-auto mb-3" style={{ background: `linear-gradient(90deg, transparent, ${QSAITheme.purple.primary}, transparent)` }} />
            <span 
              className="text-xs font-medium tracking-wide"
              style={{
                backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.7) 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 10px rgba(124, 93, 250, 0.2)',
                letterSpacing: '0.02em'
              }}
            >
              powered by QuickServe AI
            </span>
          </div>

          {/* Version Number */}
          <span 
            className="text-xs font-mono"
            style={{ color: QSAITheme.text.muted, opacity: 0.4 }}
          >
            {APP_VERSION}
          </span>
        </motion.div>
      </div>
      
      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        open={showForgotPassword} 
        onOpenChange={setShowForgotPassword}
      />
    </div>
  );
}
