import React, { useState, useEffect, useCallback } from 'react';
import { Lock, KeyRound, Delete, X } from 'lucide-react';
import { motion } from 'framer-motion';
import brain from 'brain';
import { toast } from 'sonner';
import { QSAITheme } from 'utils/QSAIDesign';
import { AnimatedNucleus } from 'components/AnimatedNucleus';

interface KDSLockScreenProps {
  onUnlock: () => void;
  restaurantName?: string;
}

// Shared easing curve matching Admin dashboard
const EASE = [0.2, 0.8, 0.2, 1] as const;

// Glass card style matching POSLogin
const glassCardStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(48px)',
  WebkitBackdropFilter: 'blur(48px)',
  borderRadius: '20px',
  border: '1px solid rgba(255, 255, 255, 0.10)',
  boxShadow: '0 24px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 0 0 1px rgba(124, 58, 237, 0.08)',
  padding: '2.5rem',
};

// Staggered button entrance animation variants
const buttonVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.25,
      ease: EASE,
    },
  }),
};

/**
 * KDS PIN Lock Screen
 * Professional 4-digit PIN entry matching POS login styling
 * Handles both first-time setup and verification
 */
export function KDSLockScreen({ onUnlock, restaurantName = 'Cottage Tandoori' }: KDSLockScreenProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'checking' | 'setup' | 'verify'>('checking');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [checkTimeout, setCheckTimeout] = useState(false);
  const [buttonsVisible, setButtonsVisible] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

  // Show buttons with staggered animation after mode is set
  useEffect(() => {
    if (mode !== 'checking') {
      const timer = setTimeout(() => setButtonsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  // Check if PIN is already set on mount
  useEffect(() => {
    checkSetupStatus();

    const timeout = setTimeout(() => {
      if (mode === 'checking') {
        setCheckTimeout(true);
        setMode('setup');
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await brain.check_kds_schema();
      const result = await response.json();

      if (!result.schema_ready) {
        await brain.setup_kds_schema();
      }

      if (result.has_pin_set) {
        setMode('verify');
      } else {
        setMode('setup');
      }
    } catch (error) {
      console.error('Failed to check KDS setup:', error);
      setCheckTimeout(true);
      setError('Backend connection failed. Defaulting to setup mode.');
      setMode('setup');
    }
  };

  // Auto-clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }, []);

  const handleDigit = useCallback((digit: string) => {
    if (isVerifying) return;
    setError(null);

    const currentPin = isSettingPin ? confirmPin : pin;
    if (currentPin.length >= 4) return;

    const newPin = currentPin + digit;

    if (isSettingPin) {
      setConfirmPin(newPin);
    } else {
      setPin(newPin);
    }

    // Auto-submit when 4 digits entered
    if (newPin.length === 4) {
      if (mode === 'setup' && !isSettingPin) {
        // First PIN entry - move to confirmation
        setTimeout(() => setIsSettingPin(true), 300);
      } else if (mode === 'setup' && isSettingPin) {
        // Confirmation - check match
        setTimeout(async () => {
          if (newPin === pin) {
            setIsVerifying(true);
            try {
              const response = await brain.set_kds_pin({ pin: newPin });
              const result = await response.json();

              if (result.success) {
                setSuccess(true);
                toast.success('PIN set successfully!');
                setTimeout(() => onUnlock(), 300);
              } else {
                triggerShake();
                setError(result.message || 'Failed to set PIN');
                setPin('');
                setConfirmPin('');
                setIsSettingPin(false);
              }
            } catch (err) {
              triggerShake();
              setError('Failed to set PIN');
              setPin('');
              setConfirmPin('');
              setIsSettingPin(false);
            } finally {
              setIsVerifying(false);
            }
          } else {
            triggerShake();
            setError('PINs do not match. Try again.');
            setPin('');
            setConfirmPin('');
            setIsSettingPin(false);
          }
        }, 200);
      } else {
        // Verify mode
        setTimeout(async () => {
          setIsVerifying(true);
          try {
            const response = await brain.verify_kds_pin({ pin: newPin });
            const result = await response.json();

            if (result.success || result.valid) {
              setSuccess(true);
              toast.success('Access granted');
              setTimeout(() => onUnlock(), 300);
            } else {
              triggerShake();
              setError(result.message || 'Incorrect PIN');
              setPin('');
            }
          } catch (err) {
            triggerShake();
            setError('Verification failed');
            setPin('');
          } finally {
            setIsVerifying(false);
          }
        }, 200);
      }
    }
  }, [pin, confirmPin, isSettingPin, mode, isVerifying, onUnlock, triggerShake]);

  const handleBackspace = useCallback(() => {
    if (isVerifying) return;
    setError(null);
    if (isSettingPin) {
      setConfirmPin(prev => prev.slice(0, -1));
    } else {
      setPin(prev => prev.slice(0, -1));
    }
  }, [isSettingPin, isVerifying]);

  const handleClear = useCallback(() => {
    if (isVerifying) return;
    setError(null);
    if (isSettingPin) {
      setConfirmPin('');
    } else {
      setPin('');
    }
  }, [isSettingPin, isVerifying]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleBackspace, handleClear]);

  // Show loading state while checking
  if (mode === 'checking') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: '#000000', zIndex: 9999 }}
      >
        <div className="text-center space-y-4 px-6 max-w-md">
          <AnimatedNucleus size={56} />
          <div className="animate-pulse text-gray-300 text-lg mt-4">
            {checkTimeout ? 'Connection timeout...' : 'Initializing Kitchen Display...'}
          </div>
          {checkTimeout && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <p className="text-sm text-amber-400 font-medium">
                Cannot connect to backend server.
              </p>
              <p className="text-xs text-gray-500">
                Make sure the backend is running on port 8000
              </p>
              <button
                onClick={() => {
                  setCheckTimeout(false);
                  setMode('checking');
                  checkSetupStatus();
                }}
                className="mt-4 px-6 py-2 rounded-lg font-medium transition-all duration-200"
                style={{
                  background: `linear-gradient(180deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.dark} 100%)`,
                  border: '1px solid rgba(167, 139, 250, 0.25)',
                  color: '#FFFFFF',
                  boxShadow: `0 4px 16px ${QSAITheme.purple.glow}`,
                }}
              >
                Retry Connection
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }

  const currentPin = isSettingPin ? confirmPin : pin;
  const promptText = mode === 'setup'
    ? (isSettingPin ? 'Confirm your PIN' : 'Set a 4-digit PIN')
    : 'Enter your PIN';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: '#000000', zIndex: 9999 }}
    >
      {/* Overhead spotlight */}
      <div className="absolute pointer-events-none" style={{
        width: '100%', height: '80%',
        left: '0', top: '0',
        background: 'radial-gradient(ellipse 65% 50% at 50% 0%, rgba(124, 58, 237, 0.30) 0%, rgba(167, 139, 250, 0.12) 30%, transparent 65%)',
      }} />

      {/* Localized aura */}
      <div className="absolute pointer-events-none" style={{
        width: '100%', height: '100%',
        left: '0', top: '0',
        background: 'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(124, 58, 237, 0.14) 0%, rgba(91, 33, 182, 0.06) 40%, transparent 70%)',
      }} />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 65% 60% at 50% 50%, transparent 25%, rgba(0, 0, 0, 0.85) 100%)',
      }} />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md px-4">
        <motion.div
          className={`w-full ${shake ? 'animate-shake' : ''}`}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE }}
          style={glassCardStyle}
        >
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <AnimatedNucleus size={56} />
            <h1
              className="text-2xl font-semibold mt-4"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 20%, #A78BFA 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Kitchen Display
            </h1>
            <p className="text-sm mt-2" style={{ color: QSAITheme.text.muted }}>
              {restaurantName}
            </p>
          </div>

          {/* Status indicator */}
          <div className="flex justify-center mb-4">
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: mode === 'setup' ? 'rgba(124, 58, 237, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                border: mode === 'setup' ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                color: mode === 'setup' ? QSAITheme.purple.light : QSAITheme.text.secondary,
              }}
            >
              {mode === 'setup' ? <KeyRound className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {mode === 'setup' ? 'First Time Setup' : 'Locked'}
            </span>
          </div>

          {/* Prompt */}
          <p className="text-sm text-center mb-6" style={{ color: QSAITheme.text.muted }}>
            {promptText}
          </p>

          {/* PIN dots */}
          <div className="flex justify-center gap-4 mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${success ? 'animate-success-pulse' : ''}`}
                style={{
                  background: success || i < currentPin.length
                    ? `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`
                    : 'rgba(255, 255, 255, 0.1)',
                  border: `1px solid ${success || i < currentPin.length ? QSAITheme.purple.primary : 'rgba(255, 255, 255, 0.2)'}`,
                  boxShadow: success
                    ? `0 0 20px ${QSAITheme.purple.glow}, 0 0 40px ${QSAITheme.purple.glow}`
                    : i < currentPin.length
                      ? `0 0 8px ${QSAITheme.purple.glow}`
                      : 'none',
                  transform: success ? 'scale(1.3)' : i < currentPin.length ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
          </div>

          {/* Error message */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-400 text-center mb-4"
            >
              {error}
            </motion.p>
          )}

          {/* Keypad grid */}
          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit, index) => (
              <motion.button
                key={digit}
                custom={index}
                variants={buttonVariants}
                initial="hidden"
                animate={buttonsVisible ? "visible" : "hidden"}
                onClick={() => handleDigit(digit)}
                disabled={isVerifying}
                className="w-16 h-16 mx-auto rounded-xl text-2xl font-semibold transition-colors duration-150 active:scale-95"
                style={{
                  background: QSAITheme.background.secondary,
                  color: QSAITheme.text.primary,
                  border: '1px solid rgba(124, 58, 237, 0.15)',
                }}
                whileHover={{
                  background: 'rgba(124, 58, 237, 0.15)',
                  borderColor: QSAITheme.purple.primary,
                  boxShadow: `0 0 12px ${QSAITheme.purple.glow}`,
                }}
              >
                {digit}
              </motion.button>
            ))}

            {/* Clear button */}
            <motion.button
              custom={9}
              variants={buttonVariants}
              initial="hidden"
              animate={buttonsVisible ? "visible" : "hidden"}
              onClick={handleClear}
              disabled={isVerifying}
              className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center transition-colors duration-150 active:scale-95"
              style={{
                background: QSAITheme.background.secondary,
                color: QSAITheme.text.muted,
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
              title="Clear"
            >
              <X className="w-5 h-5" />
            </motion.button>

            {/* Zero button */}
            <motion.button
              custom={10}
              variants={buttonVariants}
              initial="hidden"
              animate={buttonsVisible ? "visible" : "hidden"}
              onClick={() => handleDigit('0')}
              disabled={isVerifying}
              className="w-16 h-16 mx-auto rounded-xl text-2xl font-semibold transition-colors duration-150 active:scale-95"
              style={{
                background: QSAITheme.background.secondary,
                color: QSAITheme.text.primary,
                border: '1px solid rgba(124, 58, 237, 0.15)',
              }}
              whileHover={{
                background: 'rgba(124, 58, 237, 0.15)',
                borderColor: QSAITheme.purple.primary,
                boxShadow: `0 0 12px ${QSAITheme.purple.glow}`,
              }}
            >
              0
            </motion.button>

            {/* Backspace button */}
            <motion.button
              custom={11}
              variants={buttonVariants}
              initial="hidden"
              animate={buttonsVisible ? "visible" : "hidden"}
              onClick={handleBackspace}
              disabled={isVerifying}
              className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center transition-colors duration-150 active:scale-95"
              style={{
                background: QSAITheme.background.secondary,
                color: QSAITheme.text.muted,
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
              title="Backspace"
            >
              <Delete className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Footer hint */}
          <p className="text-xs text-center mt-6" style={{ color: QSAITheme.text.muted }}>
            {mode === 'setup' ? 'This PIN will be used for all kitchen staff' : 'Contact manager to reset PIN'}
          </p>
        </motion.div>

        {/* Footer branding */}
        <motion.footer
          className="flex flex-col items-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5, ease: EASE }}
        >
          <span className="text-[10px]" style={{ color: 'rgba(255, 255, 255, 0.30)' }}>
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
        </motion.footer>
      </div>

      {/* Animation keyframes */}
      <style>{`
        .animate-shake {
          animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
        .animate-success-pulse {
          animation: successPulse 0.6s ease-out;
        }
        @keyframes successPulse {
          0% { transform: scale(1.2); }
          50% { transform: scale(1.5); }
          100% { transform: scale(1.3); }
        }
      `}</style>
    </motion.div>
  );
}
