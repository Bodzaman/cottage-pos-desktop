import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QSAITheme } from 'utils/QSAIDesign';
import { Delete, X } from 'lucide-react';

// Staggered button entrance animation variants
const buttonVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.03, // 30ms stagger per button
      duration: 0.25,
      ease: [0.2, 0.8, 0.2, 1],
    },
  }),
};

interface PINPadProps {
  /** Mode: 'login' for PIN entry, 'set' for creating a new PIN */
  mode: 'login' | 'set';
  /** Staff name displayed above the pad */
  staffName?: string;
  /** Called when PIN is submitted (4 digits entered) */
  onSubmit: (pin: string) => Promise<boolean>;
  /** Called when user wants to switch to password login */
  onSwitchToPassword?: () => void;
  /** Whether the component is in a loading state */
  isLoading?: boolean;
  /** Whether to delay button animation (for splash transition sync) */
  delayAnimation?: boolean;
}

export function PINPad({ mode, staffName, onSubmit, onSwitchToPassword, isLoading = false, delayAnimation = false }: PINPadProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState('');

  // Staggered button entrance animation
  // delayAnimation=true for initial splash transition, false for view switches
  const [buttonsVisible, setButtonsVisible] = useState(false);
  useEffect(() => {
    const delay = delayAnimation ? 900 : 100;
    const timer = setTimeout(() => setButtonsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delayAnimation]);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }, []);

  const handleDigit = useCallback((digit: string) => {
    if (isLoading) return;
    setError('');

    const currentPin = isConfirming ? confirmPin : pin;
    if (currentPin.length >= 4) return;

    const newPin = currentPin + digit;

    if (isConfirming) {
      setConfirmPin(newPin);
    } else {
      setPin(newPin);
    }

    // Auto-submit when 4 digits entered
    if (newPin.length === 4) {
      if (mode === 'set' && !isConfirming) {
        // First entry in set mode — move to confirm
        setTimeout(() => {
          setIsConfirming(true);
        }, 300);
      } else if (mode === 'set' && isConfirming) {
        // Confirm entry in set mode — check match
        setTimeout(async () => {
          if (newPin === pin) {
            const success = await onSubmit(newPin);
            if (!success) {
              triggerShake();
              setError('Failed to set PIN. Try again.');
              setPin('');
              setConfirmPin('');
              setIsConfirming(false);
            }
          } else {
            triggerShake();
            setError('PINs do not match. Try again.');
            setPin('');
            setConfirmPin('');
            setIsConfirming(false);
          }
        }, 200);
      } else {
        // Login mode — submit
        setTimeout(async () => {
          const success = await onSubmit(newPin);
          if (!success) {
            triggerShake();
            setError('Invalid PIN');
            setPin('');
          }
        }, 200);
      }
    }
  }, [pin, confirmPin, isConfirming, mode, isLoading, onSubmit, triggerShake]);

  const handleBackspace = useCallback(() => {
    if (isLoading) return;
    setError('');
    if (isConfirming) {
      setConfirmPin(prev => prev.slice(0, -1));
    } else {
      setPin(prev => prev.slice(0, -1));
    }
  }, [isConfirming, isLoading]);

  const handleClear = useCallback(() => {
    if (isLoading) return;
    setError('');
    if (isConfirming) {
      setConfirmPin('');
    } else {
      setPin('');
    }
  }, [isConfirming, isLoading]);

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

  const currentPin = isConfirming ? confirmPin : pin;

  const getPromptText = () => {
    if (mode === 'set') {
      return isConfirming ? 'Confirm your PIN' : 'Set a 4-digit PIN';
    }
    return 'Enter your PIN';
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Staff name */}
      {staffName && (
        <p
          className="text-lg font-medium"
          style={{ color: QSAITheme.text.secondary }}
        >
          {staffName}
        </p>
      )}

      {/* Prompt */}
      <p
        className="text-sm"
        style={{ color: QSAITheme.text.muted }}
      >
        {getPromptText()}
      </p>

      {/* PIN dots */}
      <div
        className={`flex gap-4 ${shake ? 'animate-shake' : ''}`}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-full transition-all duration-200"
            style={{
              background: i < currentPin.length
                ? `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`
                : 'rgba(255, 255, 255, 0.1)',
              border: `1px solid ${i < currentPin.length ? QSAITheme.purple.primary : 'rgba(255, 255, 255, 0.2)'}`,
              boxShadow: i < currentPin.length ? `0 0 8px ${QSAITheme.purple.glow}` : 'none',
              transform: i < currentPin.length ? 'scale(1.2)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-400 animate-fade-in">
          {error}
        </p>
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
            disabled={isLoading}
            className="w-16 h-16 rounded-xl text-2xl font-semibold transition-colors duration-150 active:scale-95"
            style={{
              background: QSAITheme.background.secondary,
              color: QSAITheme.text.primary,
              border: `1px solid rgba(124, 58, 237, 0.15)`,
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

        {/* Bottom row: Clear, 0, Backspace */}
        <motion.button
          custom={9}
          variants={buttonVariants}
          initial="hidden"
          animate={buttonsVisible ? "visible" : "hidden"}
          onClick={handleClear}
          disabled={isLoading}
          className="w-16 h-16 rounded-xl flex items-center justify-center transition-colors duration-150 active:scale-95"
          style={{
            background: QSAITheme.background.secondary,
            color: QSAITheme.text.muted,
            border: `1px solid rgba(255, 255, 255, 0.05)`,
          }}
          title="Clear"
        >
          <X className="w-5 h-5" />
        </motion.button>

        <motion.button
          custom={10}
          variants={buttonVariants}
          initial="hidden"
          animate={buttonsVisible ? "visible" : "hidden"}
          onClick={() => handleDigit('0')}
          disabled={isLoading}
          className="w-16 h-16 rounded-xl text-2xl font-semibold transition-colors duration-150 active:scale-95"
          style={{
            background: QSAITheme.background.secondary,
            color: QSAITheme.text.primary,
            border: `1px solid rgba(124, 58, 237, 0.15)`,
          }}
          whileHover={{
            background: 'rgba(124, 58, 237, 0.15)',
            borderColor: QSAITheme.purple.primary,
            boxShadow: `0 0 12px ${QSAITheme.purple.glow}`,
          }}
        >
          0
        </motion.button>

        <motion.button
          custom={11}
          variants={buttonVariants}
          initial="hidden"
          animate={buttonsVisible ? "visible" : "hidden"}
          onClick={handleBackspace}
          disabled={isLoading}
          className="w-16 h-16 rounded-xl flex items-center justify-center transition-colors duration-150 active:scale-95"
          style={{
            background: QSAITheme.background.secondary,
            color: QSAITheme.text.muted,
            border: `1px solid rgba(255, 255, 255, 0.05)`,
          }}
          title="Backspace"
        >
          <Delete className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Switch to password link */}
      {onSwitchToPassword && mode === 'login' && (
        <button
          onClick={onSwitchToPassword}
          className="text-xs transition-colors duration-200 mt-2"
          style={{ color: QSAITheme.text.muted }}
          onMouseEnter={(e) => e.currentTarget.style.color = QSAITheme.purple.light}
          onMouseLeave={(e) => e.currentTarget.style.color = QSAITheme.text.muted}
        >
          Use username/password instead
        </button>
      )}

      {/* Shake animation keyframes */}
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
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
