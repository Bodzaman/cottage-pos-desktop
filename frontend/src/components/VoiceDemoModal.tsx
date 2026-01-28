import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mic, ShoppingCart, Check, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAgentConfig } from 'utils/useAgentConfig';
import { PremiumTheme } from 'utils/premiumTheme';

interface VoiceDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignUp: () => void;
}

const DEMO_STEPS = [
  {
    icon: Mic,
    userText: '"I\'d like a Chicken Tikka Masala please"',
    aiText: 'Great choice! Chicken Tikka Masala is one of our most popular dishes. Would you like rice or naan with that?',
    label: 'Speak naturally',
  },
  {
    icon: ShoppingCart,
    userText: '"Add a garlic naan and pilau rice"',
    aiText: 'I\'ve added Garlic Naan and Pilau Rice to your order. Your total is £18.45. Anything else?',
    label: 'Build your order',
  },
  {
    icon: Check,
    userText: '"That\'s everything, thanks!"',
    aiText: 'Order confirmed! Your food will be ready in 25 minutes. Enjoy your meal!',
    label: 'Confirm & done',
  },
];

export function VoiceDemoModal({ isOpen, onClose, onSignUp }: VoiceDemoModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showUserText, setShowUserText] = useState(false);
  const [showAiText, setShowAiText] = useState(false);
  const { agentName, agentAvatar } = useAgentConfig();

  // Auto-advance through demo steps
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setShowUserText(false);
      setShowAiText(false);
      return;
    }

    const showUser = setTimeout(() => setShowUserText(true), 600);
    const showAi = setTimeout(() => setShowAiText(true), 2000);
    const advance = setTimeout(() => {
      if (currentStep < DEMO_STEPS.length - 1) {
        setShowUserText(false);
        setShowAiText(false);
        setTimeout(() => setCurrentStep((s) => s + 1), 300);
      }
    }, 4500);

    return () => {
      clearTimeout(showUser);
      clearTimeout(showAi);
      clearTimeout(advance);
    };
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const step = DEMO_STEPS[currentStep];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        zIndex: 70,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative rounded-3xl overflow-hidden max-w-md w-full"
        style={{
          background: `linear-gradient(135deg, ${PremiumTheme.colors.dark[900]} 0%, ${PremiumTheme.colors.charcoal[800]} 100%)`,
          border: `2px solid ${PremiumTheme.colors.burgundy[600]}40`,
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full"
          style={{
            background: `${PremiumTheme.colors.dark[700]}80`,
            color: PremiumTheme.colors.text.muted,
          }}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Phone className="w-5 h-5 text-orange-500" />
              <h2
                className="text-xl font-bold"
                style={{ color: PremiumTheme.colors.text.primary }}
              >
                Voice Ordering Demo
              </h2>
            </div>
            <p className="text-sm" style={{ color: PremiumTheme.colors.text.secondary }}>
              See how easy it is to order with {agentName}
            </p>
          </div>

          {/* Step indicators */}
          <div className="flex justify-center gap-2">
            {DEMO_STEPS.map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === currentStep ? '32px' : '8px',
                  background:
                    i === currentStep
                      ? PremiumTheme.colors.burgundy[500]
                      : i < currentStep
                        ? PremiumTheme.colors.burgundy[700]
                        : PremiumTheme.colors.dark[700],
                }}
              />
            ))}
          </div>

          {/* Demo conversation */}
          <div
            className="rounded-2xl p-4 min-h-[200px] flex flex-col justify-center space-y-3"
            style={{
              background: `${PremiumTheme.colors.dark[800]}80`,
              border: `1px solid ${PremiumTheme.colors.border.light}`,
            }}
          >
            {/* Step label */}
            <div className="flex items-center gap-2 mb-2">
              <step.icon className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-medium text-orange-400 uppercase tracking-wider">
                Step {currentStep + 1}: {step.label}
              </span>
            </div>

            {/* User message */}
            <AnimatePresence mode="wait">
              {showUserText && (
                <motion.div
                  key={`user-${currentStep}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex justify-end"
                >
                  <div
                    className="rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%]"
                    style={{
                      background: PremiumTheme.colors.burgundy[600],
                      color: PremiumTheme.colors.text.primary,
                    }}
                  >
                    <p className="text-sm italic">{step.userText}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI response */}
            <AnimatePresence mode="wait">
              {showAiText && (
                <motion.div
                  key={`ai-${currentStep}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex justify-start gap-2"
                >
                  {agentAvatar && (
                    <img
                      src={agentAvatar}
                      alt={agentName}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  )}
                  <div
                    className="rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%]"
                    style={{
                      background: `${PremiumTheme.colors.dark[700]}`,
                      border: `1px solid ${PremiumTheme.colors.border.light}`,
                      color: PremiumTheme.colors.text.primary,
                    }}
                  >
                    <p className="text-sm">{step.aiText}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <Button
              onClick={onSignUp}
              className="w-full py-5 rounded-2xl text-base font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform"
              style={{
                background: `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[600]} 0%, ${PremiumTheme.colors.burgundy[500]} 100%)`,
                color: PremiumTheme.colors.text.primary,
                border: `2px solid ${PremiumTheme.colors.burgundy[400]}`,
              }}
            >
              <Sparkles className="w-5 h-5" />
              Sign Up Free to Try It
            </Button>

            <button
              onClick={onClose}
              className="w-full text-center text-sm py-2"
              style={{ color: PremiumTheme.colors.text.muted }}
            >
              Maybe Later
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
