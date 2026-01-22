import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { SignUpModal } from './SignUpModal';
import { LoginModal } from './LoginModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'login' | 'signup';
  onModeChange?: (mode: 'login' | 'signup') => void;
  redirectTo?: string;
  context?: 'checkout' | 'favorites' | 'voice-ordering' | 'account';
}

const modalBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.3
    }
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

const modalContentVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.9,
    y: 20
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.2
    }
  }
};

export function AuthModal({ 
  isOpen, 
  onClose, 
  mode = 'login', 
  onModeChange,
  redirectTo = '/online-orders',
  context = 'account'
}: AuthModalProps) {
  const [currentMode, setCurrentMode] = useState<'login' | 'signup'>(mode);

  // Update internal mode when prop changes
  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  const handleModeSwitch = (newMode: 'login' | 'signup') => {
    setCurrentMode(newMode);
    onModeChange?.(newMode);
  };

  const handleSuccess = () => {
    onClose();
  };

  const getContextMessage = () => {
    switch (context) {
      case 'checkout':
        return 'Sign in to complete your order and save your preferences';
      case 'favorites':
        return 'Create an account to save your favorite dishes';
      case 'voice-ordering':
        return 'Sign in to unlock AI voice ordering - your personal assistant awaits!';
      case 'account':
      default:
        return 'Join Cottage Tandoori for a personalized experience';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <motion.div
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <DialogContent 
            className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] border-0 p-0 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            <motion.div
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative rounded-2xl border border-[#DC2626]/30 bg-[#17191D]/60 backdrop-blur-xl shadow-2xl shadow-[#DC2626]/10 overflow-hidden"
            >
              {/* Border glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#DC2626]/20 via-transparent to-[#B91C1C]/20 pointer-events-none" />

              {/* Context Message */}
              <div className="relative px-6 pt-6 pb-2">
                <p className="text-sm text-center text-[#B7BDC6]">
                  {getContextMessage()}
                </p>
              </div>

              {/* Modal Content */}
              <div className="relative p-6 pt-2">
                <AnimatePresence mode="wait">
                  {currentMode === 'signup' ? (
                    <SignUpModal
                      key="signup"
                      onSuccess={handleSuccess}
                      onSwitchToLogin={() => handleModeSwitch('login')}
                      redirectTo={redirectTo}
                      context={context}
                    />
                  ) : (
                    <LoginModal
                      key="login"
                      onSuccess={handleSuccess}
                      onSwitchToSignup={() => handleModeSwitch('signup')}
                      redirectTo={redirectTo}
                      context={context}
                    />
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
