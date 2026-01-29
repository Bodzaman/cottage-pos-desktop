import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, CheckCircle, Building2, Shield, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePOSAuth, UserRole } from 'utils/usePOSAuth';
import { colors } from 'utils/InternalDesignSystem';
import { AnimatedNucleus } from 'components/AnimatedNucleus';
import { PINPad } from 'components/PINPad';
import { toast } from 'sonner';

const APP_VERSION = 'v1.0.2';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

type LoginView = 'pin-login' | 'password' | 'pin-setup';

// Shared easing curve matching Admin dashboard
const EASE = [0.2, 0.8, 0.2, 1] as const;

// Glass card style shared across all views
const glassCardStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(48px)',
  WebkitBackdropFilter: 'blur(48px)',
  borderRadius: '20px',
  border: '1px solid rgba(255, 255, 255, 0.10)',
  boxShadow: '0 24px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 0 0 1px rgba(124, 58, 237, 0.08)',
  padding: '2.5rem',
};

// Input field style
const inputStyle: React.CSSProperties = {
  background: 'rgba(28, 28, 30, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  color: colors.text.primary,
  fontSize: '0.9375rem',
  height: '48px',
  borderRadius: '12px',
};

const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.border = '1px solid rgba(167, 139, 250, 0.5)';
  e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.25), 0 0 12px rgba(124, 58, 237, 0.10)';
  e.target.style.outline = 'none';
};

const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.border = '1px solid rgba(255, 255, 255, 0.08)';
  e.target.style.boxShadow = 'none';
  e.target.style.outline = 'none';
};

// Card grounding layers — contact shadow, floor plane, reflection, and rim light
// Anchored to the card's bottom edge to create a "sitting on surface" effect
// All grounding layers sit behind the card (z-0), card is z-10
function CardGrounding() {
  return (
    <>
      {/* Floor plane — wide perspective-transformed stage surface (behind card) */}
      <div className="absolute pointer-events-none" style={{
        width: '1100px',
        left: '50%',
        top: '100%',
        height: '450px',
        transformOrigin: 'top center',
        transform: 'translateX(-50%) rotateX(72deg)',
        background: 'radial-gradient(ellipse 70% 80% at 50% 0%, rgba(124, 58, 237, 0.12) 0%, rgba(124, 58, 237, 0.06) 35%, rgba(124, 58, 237, 0.02) 60%, transparent 85%)',
        zIndex: 0,
      }} />
      {/* Contact shadow — wide elliptical shadow anchoring card to floor (behind card) */}
      <div className="absolute pointer-events-none" style={{
        width: '600px',
        left: '50%',
        transform: 'translateX(-50%)',
        top: '100%',
        height: '35px',
        background: 'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(0, 0, 0, 0.55) 0%, transparent 70%)',
        filter: 'blur(14px)',
        zIndex: 0,
      }} />
      {/* Reflection — faded mirror glow below card */}
      <div className="absolute pointer-events-none" style={{
        left: '5%', right: '5%',
        top: 'calc(100% + 4px)',
        height: '120px',
        background: 'linear-gradient(180deg, rgba(28, 28, 30, 0.20) 0%, rgba(124, 58, 237, 0.08) 30%, transparent 100%)',
        filter: 'blur(8px)',
        opacity: 0.3,
        borderRadius: '20px',
        maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 60%)',
        WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 60%)',
        zIndex: 0,
      }} />
      {/* Specular streak — thin bright line on glossy floor */}
      <div className="absolute pointer-events-none" style={{
        width: '700px',
        left: '50%',
        transform: 'translateX(-50%)',
        top: 'calc(100% + 18px)',
        height: '3px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.08) 25%, rgba(255, 255, 255, 0.14) 50%, rgba(255, 255, 255, 0.08) 75%, transparent 100%)',
        filter: 'blur(2px)',
        zIndex: 0,
      }} />
      {/* Contact rim light — glass-on-glass edge at card bottom */}
      <div className="absolute pointer-events-none" style={{
        width: '70%',
        left: '15%',
        bottom: '0px',
        height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.10) 20%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.10) 80%, transparent 100%)',
        filter: 'blur(0.5px)',
        zIndex: 11,
      }} />
    </>
  );
}

export default function POSLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const [loginMode, setLoginMode] = useState<'admin' | 'staff'>('staff');

  const navigate = useNavigate();
  const { login, loginWithPin, setPin, isAuthenticated, isLoading, pinEnabled, lastUserId, lastUserName, lastUserRole, user } = usePOSAuth();
  const greeting = useMemo(() => getGreeting(), []);

  // Determine initial view: PIN login if previously configured, otherwise password
  const [view, setView] = useState<LoginView>(
    pinEnabled && lastUserId ? 'pin-login' : 'password'
  );

  // Page animation states
  const [pageVisible, setPageVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Track if this is the initial mount (for PIN pad animation timing)
  // Only the first render after splash needs the long delay
  const isInitialMount = useRef(true);
  const isElectron = !!(window as any).electronAPI;

  // Trigger page entrance animation after mount
  // In Electron, delay longer to account for splash-to-main window transition
  // The splash takes ~1000ms to fade after main window shows
  useEffect(() => {
    const delay = isElectron ? 800 : 50;
    const timer = setTimeout(() => setPageVisible(true), delay);
    return () => clearTimeout(timer);
  }, [isElectron]);

  // After initial entrance animation completes, mark as no longer initial mount
  // This ensures PIN pad in subsequent views (like PIN setup) doesn't wait
  useEffect(() => {
    if (pageVisible && isInitialMount.current) {
      const timer = setTimeout(() => {
        isInitialMount.current = false;
      }, 500); // Give time for entrance animation to complete
      return () => clearTimeout(timer);
    }
  }, [pageVisible]);

  // Helper for animated navigation - triggers exit then navigates
  const navigateWithExit = useCallback((path: string) => {
    setIsExiting(true);
    setTimeout(() => navigate(path, { replace: true }), 350);
  }, [navigate]);

  // Helper function to get redirect destination based on role
  const getRedirectPath = (role: UserRole | null | undefined): string => {
    return role === 'admin' ? '/admin' : '/pos-desktop';
  };

  // ============================================================================
  // NAVIGATION GUARDS - PREVENT REDIRECT LOOPS
  // ============================================================================
  const hasRedirectedRef = useRef(false);
  const lastRedirectTimeRef = useRef(0);
  const REDIRECT_COOLDOWN = 1000; // 1 second cooldown between redirects

  // Ref to synchronously block redirect during PIN setup flow.
  // React useState (view) batches updates, so the redirect useEffect can fire
  // before setView('pin-setup') is committed. A ref updates immediately.
  const pinSetupActiveRef = useRef(false);

  // ✅ ENABLED: Redirect based on role if already authenticated
  useEffect(() => {
    if (hasRedirectedRef.current) return;
    const now = Date.now();
    if (now - lastRedirectTimeRef.current < REDIRECT_COOLDOWN) return;

    // Don't redirect during PIN setup (ref is always current, no batching)
    if (pinSetupActiveRef.current) return;
    if (view === 'pin-setup') return;

    if (!isLoading && isAuthenticated && user) {
      hasRedirectedRef.current = true;
      lastRedirectTimeRef.current = now;
      const redirectPath = getRedirectPath(user.role);
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, view, user]);

  // ✅ ENABLED: Reset redirect guard
  useEffect(() => {
    if (!isAuthenticated) {
      hasRedirectedRef.current = false;
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setShakeError(false);

    // CRITICAL: Block redirect BEFORE login() because Zustand triggers synchronous re-renders.
    // When login() calls set({ isAuthenticated: true }), the redirect effect runs immediately
    // before this function can continue. We must set the ref first to prevent premature redirect.
    pinSetupActiveRef.current = true;

    try {
      await login(username, password);

      // Get current user from store after login
      const currentUser = usePOSAuth.getState().user;
      const userRole = currentUser?.role;
      const redirectPath = getRedirectPath(userRole);

      // Check PIN status from store (not component snapshot which is stale)
      const currentPinEnabled = usePOSAuth.getState().pinEnabled;

      if (!currentPinEnabled) {
        // PIN not configured - show setup UI (ref already blocks redirect)
        setLoginSuccess(true);
        if (userRole === 'admin') {
          toast.success('Login successful — PIN setup required for offline access');
        } else {
          toast.success('Login successful — set a quick PIN');
        }
        setView('pin-setup');
        return;
      }

      // PIN already configured — allow redirect
      pinSetupActiveRef.current = false;
      setLoginSuccess(true);
      toast.success('Welcome back!');
      navigateWithExit(redirectPath);
    } catch (err) {
      // Reset ref on error so user can retry
      pinSetupActiveRef.current = false;
      console.error('Login failed:', err);
      toast.error(err instanceof Error ? err.message : 'Invalid username or password');
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
      setPassword(''); // Clear password on error
    }
  };

  const isDisabled = isLoading || !username || !password || loginSuccess;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={isExiting
        ? { opacity: 0, y: -20, scale: 0.96 }
        : pageVisible
          ? { opacity: 1, y: 0, scale: 1 }
          : {}
      }
      transition={{ duration: 0.4, ease: EASE }}
      className="h-dvh w-screen flex flex-col items-center justify-end relative overflow-hidden"
      style={{
        background: '#000000',
        paddingBottom: '14vh',
      }}
    >
      {/* === OVERHEAD SPOTLIGHT — purple-white cone from above === */}
      <div className="absolute pointer-events-none" style={{
        width: '100%', height: '80%',
        left: '0', top: '0',
        background: 'radial-gradient(ellipse 65% 50% at 50% 0%, rgba(124, 58, 237, 0.30) 0%, rgba(167, 139, 250, 0.12) 30%, transparent 65%)',
      }} />
      {/* Secondary wider white wash from spotlight */}
      <div className="absolute pointer-events-none" style={{
        width: '100%', height: '60%',
        left: '0', top: '0',
        background: 'radial-gradient(ellipse 90% 40% at 50% 0%, rgba(255, 255, 255, 0.05) 0%, transparent 60%)',
      }} />

      {/* === LOCALIZED AURA — saturated purple behind card area === */}
      <div className="absolute pointer-events-none" style={{
        width: '100%', height: '100%',
        left: '0', top: '0',
        background: 'radial-gradient(ellipse 50% 40% at 50% 65%, rgba(124, 58, 237, 0.14) 0%, rgba(91, 33, 182, 0.06) 40%, transparent 70%)',
      }} />

      {/* === VIGNETTE — darker corners === */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 65% 60% at 50% 55%, transparent 25%, rgba(0, 0, 0, 0.85) 100%)',
      }} />


      {/* Main Container — overflow-visible so floor plane extends beyond */}
      <div className="w-full max-w-md px-4 sm:px-0 relative z-10 flex flex-col items-center" style={{ overflow: 'visible' }}>

        {/* PIN Login View */}
        {view === 'pin-login' && (
          <div className="relative w-full" style={{ perspective: '1200px', overflow: 'visible' }}>
            {/* Purple bloom behind card */}
            <div className="absolute pointer-events-none" style={{
              width: '120%', height: '140%', left: '-10%', top: '-20%',
              background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(124, 58, 237, 0.11) 0%, transparent 70%)',
              filter: 'blur(60px)', zIndex: 1,
            }} />
            <motion.div
              className="w-full relative"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: EASE }}
              style={{ ...glassCardStyle, zIndex: 10 }}
            >
              <div className="flex flex-col items-center mb-6">
                <AnimatedNucleus size={56} />
                <h1
                  className="text-2xl font-semibold mt-4"
                  style={{ color: colors.text.primary }}
                >
                  QuickServe AI
                </h1>
              </div>
              <PINPad
                mode="login"
                staffName={lastUserName || undefined}
                delayAnimation={isInitialMount.current && isElectron}
                onSubmit={async (pin) => {
                  const success = await loginWithPin(pin);
                  if (success) {
                    toast.success('Welcome back!');
                    const currentUser = usePOSAuth.getState().user;
                    const redirectPath = getRedirectPath(currentUser?.role || lastUserRole);
                    setTimeout(() => navigateWithExit(redirectPath), 200);
                  }
                  return success;
                }}
                onSwitchToPassword={() => setView('password')}
                isLoading={isLoading}
              />
            </motion.div>
            <CardGrounding />
          </div>
        )}

        {/* PIN Setup View */}
        {view === 'pin-setup' && (
          <div className="relative w-full" style={{ perspective: '1200px', overflow: 'visible' }}>
            {/* Purple bloom behind card */}
            <div className="absolute pointer-events-none" style={{
              width: '120%', height: '140%', left: '-10%', top: '-20%',
              background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(124, 58, 237, 0.11) 0%, transparent 70%)',
              filter: 'blur(60px)', zIndex: 1,
            }} />
            <motion.div
              className="w-full relative"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: EASE }}
              style={{ ...glassCardStyle, zIndex: 10 }}
            >
              <div className="flex flex-col items-center mb-6">
                <AnimatedNucleus size={56} />
                <h2
                  className="text-xl font-bold mt-4"
                  style={{ color: colors.text.primary }}
                >
                  Quick Access PIN
                </h2>
                <p
                  className="text-sm mt-2 text-center"
                  style={{ color: colors.text.muted }}
                >
                  Set a 4-digit PIN for faster login next time
                </p>
              </div>
              <PINPad
                mode="set"
                delayAnimation={false}
                onSubmit={async (pin) => {
                  const success = await setPin(pin);
                  if (success) {
                    toast.success('PIN set successfully!');
                    pinSetupActiveRef.current = false;
                    const currentUser = usePOSAuth.getState().user;
                    const redirectPath = getRedirectPath(currentUser?.role);
                    setTimeout(() => navigateWithExit(redirectPath), 300);
                  }
                  return success;
                }}
                isLoading={isLoading}
              />
              {/* Skip button only available for staff - Admin PIN is mandatory for offline access */}
              {user?.role !== 'admin' && (
                <button
                  onClick={() => {
                    pinSetupActiveRef.current = false;
                    const currentUser = usePOSAuth.getState().user;
                    const redirectPath = getRedirectPath(currentUser?.role);
                    navigateWithExit(redirectPath);
                  }}
                  className="w-full text-center text-xs mt-4 transition-colors duration-200"
                  style={{ color: colors.text.muted }}
                  onMouseEnter={(e) => e.currentTarget.style.color = colors.purple.light}
                  onMouseLeave={(e) => e.currentTarget.style.color = colors.text.muted}
                >
                  Skip for now
                </button>
              )}
              {/* Admin PIN mandatory notice */}
              {user?.role === 'admin' && (
                <p
                  className="w-full text-center text-xs mt-4"
                  style={{ color: colors.text.muted }}
                >
                  PIN is required for Admin offline access
                </p>
              )}
            </motion.div>
            <CardGrounding />
          </div>
        )}

        {/* Password Login View */}
        {view === 'password' && (
          <>
            {/* Floating Orb Above Card */}
            <motion.div
              className="flex flex-col items-center mb-6"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <AnimatedNucleus size={56} />
            </motion.div>

            {/* Glass Card with grounding */}
            <div className="relative w-full" style={{ perspective: '1200px', overflow: 'visible' }}>
            {/* Purple bloom behind card */}
            <div className="absolute pointer-events-none" style={{
              width: '120%', height: '140%', left: '-10%', top: '-20%',
              background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(124, 58, 237, 0.11) 0%, transparent 70%)',
              filter: 'blur(60px)', zIndex: 1,
            }} />
            <motion.div
              className="w-full relative"
              initial={{ opacity: 0, y: 12 }}
              animate={{
                opacity: 1,
                y: 0,
                x: shakeError ? [0, -8, 8, -4, 4, 0] : 0,
              }}
              transition={{ duration: 0.4, ease: EASE }}
              style={{ ...glassCardStyle, zIndex: 10 }}
            >
              {/* Header */}
              <motion.div
                className="text-center mb-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4, ease: EASE }}
              >
                <h1
                  className="text-3xl font-semibold tracking-tight mb-4"
                  style={{
                    background: 'linear-gradient(135deg, #FFFFFF 20%, #A78BFA 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.01em',
                  }}
                >
                  QuickServe AI
                </h1>

                <h2
                  className="text-lg font-medium mb-1"
                  style={{ color: colors.text.primary }}
                >
                  {greeting}
                </h2>
                <p
                  className="text-sm"
                  style={{ color: colors.text.muted }}
                >
                  Sign in to continue
                </p>
              </motion.div>

              {/* Restaurant Context Pill */}
              <motion.div
                className="flex justify-center mb-5"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3, ease: EASE }}
              >
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: colors.text.secondary,
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                  }}
                >
                  <Building2 className="w-3 h-3 opacity-70" />
                  Cottage Tandoori (Storrington)
                  <span
                    className="w-2 h-2 rounded-full ml-0.5"
                    style={{
                      backgroundColor: '#10B981',
                      boxShadow: '0 0 6px rgba(16, 185, 129, 0.5)',
                    }}
                  />
                </span>
              </motion.div>

              {/* Segmented Mode Selector */}
              <motion.div
                className="flex justify-center mb-2"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3, ease: EASE }}
              >
                <div
                  className="inline-flex rounded-lg p-0.5"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  {([
                    { key: 'staff' as const, label: 'Team' },
                    { key: 'admin' as const, label: 'Admin' },
                  ]).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setLoginMode(opt.key)}
                      className="inline-flex items-center gap-1.5 px-5 py-1.5 rounded-md text-sm font-medium transition-all duration-200"
                      style={{
                        background: loginMode === opt.key
                          ? 'rgba(124, 58, 237, 0.20)'
                          : 'transparent',
                        color: loginMode === opt.key
                          ? colors.purple.light
                          : colors.text.muted,
                        border: loginMode === opt.key
                          ? '1px solid rgba(124, 58, 237, 0.35)'
                          : '1px solid transparent',
                        boxShadow: loginMode === opt.key
                          ? '0 0 8px rgba(124, 58, 237, 0.15)'
                          : 'none',
                      }}
                    >
                      <User className="w-3.5 h-3.5" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Helper text — changes per mode */}
              <motion.p
                className="text-center text-xs mb-6"
                style={{ color: colors.text.muted }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.3, ease: EASE }}
              >
                {loginMode === 'admin'
                  ? 'Access restaurant settings & management'
                  : 'Access POS terminal & order management'}
              </motion.p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Username Field */}
                <motion.div
                  className="space-y-1.5"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3, ease: EASE }}
                >
                  <Label
                    htmlFor="username"
                    className="text-xs font-medium"
                    style={{ color: colors.text.secondary }}
                  >
                    Username
                  </Label>
                  <div className="relative">
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                      autoComplete="username"
                      autoFocus
                      required
                      className="pr-10 transition-all duration-200"
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                    />
                    <Eye
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-0 pointer-events-none"
                      aria-hidden
                    />
                  </div>
                </motion.div>

                {/* Password Field */}
                <motion.div
                  className="space-y-1.5"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.3, ease: EASE }}
                >
                  <Label
                    htmlFor="password"
                    className="text-xs font-medium"
                    style={{ color: colors.text.secondary }}
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      autoComplete="current-password"
                      required
                      className="pr-10 transition-all duration-200"
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-150"
                      style={{ color: colors.text.muted }}
                      onMouseEnter={(e) => e.currentTarget.style.color = colors.purple.light}
                      onMouseLeave={(e) => e.currentTarget.style.color = colors.text.muted}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </motion.div>

                {/* Continue Button */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3, ease: EASE }}
                >
                  <Button
                    type="submit"
                    className="w-full font-semibold text-base transition-all duration-200 motion-safe:active:scale-[0.97]"
                    disabled={isDisabled}
                    style={{
                      background: isDisabled
                        ? 'rgba(124, 58, 237, 0.15)'
                        : 'linear-gradient(180deg, #7C3AED 0%, #5B21B6 100%)',
                      border: isDisabled ? 'none' : '1px solid rgba(167, 139, 250, 0.25)',
                      color: '#FFFFFF',
                      height: '48px',
                      borderRadius: '12px',
                      boxShadow: isDisabled
                        ? 'none'
                        : '0 4px 16px rgba(124, 58, 237, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      if (isDisabled) return;
                      e.currentTarget.style.background = 'linear-gradient(180deg, #9366F9 0%, #7C3AED 100%)';
                      e.currentTarget.style.boxShadow = '0 6px 28px rgba(124, 58, 237, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      if (isDisabled) return;
                      e.currentTarget.style.background = 'linear-gradient(180deg, #7C3AED 0%, #5B21B6 100%)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(124, 58, 237, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    onFocus={(e) => {
                      if (isDisabled) return;
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(124, 58, 237, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 0 3px rgba(124, 58, 237, 0.30), 0 0 12px rgba(124, 58, 237, 0.10)';
                      e.currentTarget.style.outline = 'none';
                    }}
                    onBlur={(e) => {
                      if (isDisabled) return;
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(124, 58, 237, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
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
                        Success
                      </>
                    ) : isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </motion.div>

                {/* Secondary Actions */}
                <motion.div
                  className="flex items-center justify-center gap-3 pt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35, duration: 0.3, ease: EASE }}
                >
                  {pinEnabled && lastUserId && (
                    <>
                      <button
                        type="button"
                        onClick={() => setView('pin-login')}
                        className="text-xs transition-colors duration-150"
                        style={{ color: colors.text.muted }}
                        onMouseEnter={(e) => e.currentTarget.style.color = colors.purple.light}
                        onMouseLeave={(e) => e.currentTarget.style.color = colors.text.muted}
                      >
                        Switch user
                      </button>
                      <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>|</span>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => toast.info('Contact your administrator to reset your password')}
                    className="text-xs transition-colors duration-150"
                    style={{ color: colors.text.muted }}
                    onMouseEnter={(e) => e.currentTarget.style.color = colors.purple.light}
                    onMouseLeave={(e) => e.currentTarget.style.color = colors.text.muted}
                  >
                    Forgot password?
                  </button>
                </motion.div>

                {/* Trust Footer */}
                <motion.div
                  className="flex items-center justify-center gap-1.5 pt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: 0.4, duration: 0.3, ease: EASE }}
                >
                  <Shield className="w-3 h-3" style={{ color: colors.text.muted }} />
                  <span className="text-[10px]" style={{ color: colors.text.muted }}>
                    Encrypted connection · Audit-ready platform
                  </span>
                </motion.div>
              </form>
            </motion.div>
            <CardGrounding />
            </div>
          </>
        )}

        {/* Footer — Outside Card (all views) */}
        <motion.footer
          className="flex flex-col items-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5, ease: EASE }}
        >
          <span
            className="text-[10px]"
            style={{ color: 'rgba(255, 255, 255, 0.30)' }}
          >
            powered by
          </span>
          <span
            className="text-xs font-medium"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 20%, #A78BFA 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            QuickServe AI
          </span>
          <span
            className="text-[9px] mt-1"
            style={{ color: 'rgba(255, 255, 255, 0.15)' }}
          >
            {APP_VERSION}
          </span>
        </motion.footer>
      </div>
    </motion.div>
  );
}
