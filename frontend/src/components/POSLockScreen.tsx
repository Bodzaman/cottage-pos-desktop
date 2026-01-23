import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QSAITheme } from 'utils/QSAIDesign';
import { AnimatedNucleus } from 'components/AnimatedNucleus';
import { PINPad } from 'components/PINPad';
import { usePOSAuth } from 'utils/usePOSAuth';
import { Lock } from 'lucide-react';

interface POSLockScreenProps {
  onUnlock: () => void;
}

export function POSLockScreen({ onUnlock }: POSLockScreenProps) {
  const navigate = useNavigate();
  const { loginWithPin, lastUserName, isLoading, logout } = usePOSAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const handleSwitchUser = () => {
    logout();
    navigate('/pos-login', { replace: true });
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'rgba(5, 5, 5, 0.95)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Background glow */}
      <div
        className="absolute top-1/4 left-1/2 w-96 h-96 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20"
        style={{
          background: `radial-gradient(circle, ${QSAITheme.purple.glow} 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />

      {/* Clock */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div
          className="text-7xl font-light tracking-wide mb-2"
          style={{ color: QSAITheme.text.primary }}
        >
          {formatTime(currentTime)}
        </div>
        <div
          className="text-lg"
          style={{ color: QSAITheme.text.muted }}
        >
          {formatDate(currentTime)}
        </div>
      </motion.div>

      {/* Lock indicator */}
      <motion.div
        className="flex items-center gap-2 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Lock className="w-4 h-4" style={{ color: QSAITheme.purple.light }} />
        <span className="text-sm" style={{ color: QSAITheme.text.muted }}>
          Screen Locked
        </span>
      </motion.div>

      {/* Nucleus + PIN Pad */}
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        style={{
          background: `linear-gradient(135deg, ${QSAITheme.background.secondary} 0%, ${QSAITheme.background.dark} 100%)`,
          borderRadius: '16px',
          border: `1px solid rgba(124, 58, 237, 0.15)`,
          boxShadow: `0 20px 60px -10px rgba(0, 0, 0, 0.8), 0 0 40px ${QSAITheme.purple.glow}`,
          padding: '2rem 2.5rem',
        }}
      >
        <AnimatedNucleus size={48} />
        <PINPad
          mode="login"
          staffName={lastUserName || undefined}
          onSubmit={async (pin) => {
            const success = await loginWithPin(pin);
            if (success) {
              onUnlock();
            }
            return success;
          }}
          isLoading={isLoading}
        />
      </motion.div>

      {/* Switch user */}
      <motion.button
        onClick={handleSwitchUser}
        className="mt-6 text-xs transition-colors duration-200"
        style={{ color: QSAITheme.text.muted }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        onMouseEnter={(e) => e.currentTarget.style.color = QSAITheme.purple.light}
        onMouseLeave={(e) => e.currentTarget.style.color = QSAITheme.text.muted}
      >
        Switch User
      </motion.button>

      {/* Branding */}
      <motion.div
        className="absolute bottom-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <span
          className="text-xs font-medium tracking-wide"
          style={{
            backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.7) 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          QuickServe AI
        </span>
      </motion.div>
    </motion.div>
  );
}
