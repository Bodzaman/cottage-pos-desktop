import React, { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { colors } from 'utils/designSystem';

interface SuccessFeedbackProps {
  type: 'save' | 'publish';
  message?: string;
  onComplete?: () => void;
  duration?: number; // milliseconds
}

/**
 * Success feedback component with animations
 * - Save: Green checkmark with fade-in/fade-out
 * - Publish: Celebratory sparkles with confetti effect
 */
export function SuccessFeedback({ 
  type, 
  message, 
  onComplete, 
  duration = 3000 
}: SuccessFeedbackProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete?.();
      }, 500); // Wait for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (type === 'save') {
    return (
      <div 
        className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        style={{
          pointerEvents: 'none'
        }}
      >
        <div 
          className="flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl backdrop-blur-md"
          style={{
            backgroundColor: 'rgba(14, 186, 177, 0.95)',
            border: `2px solid ${colors.accent.turquoise}`,
            boxShadow: `0 0 30px rgba(14, 186, 177, 0.4)`
          }}
        >
          <div className="animate-in zoom-in duration-300">
            <CheckCircle2 
              className="h-6 w-6 text-white animate-pulse" 
              strokeWidth={2.5}
            />
          </div>
          <p className="text-white font-semibold text-sm">
            {message || '✓ Saved successfully!'}
          </p>
        </div>
      </div>
    );
  }

  // Publish success with celebration
  return (
    <div 
      className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{
        pointerEvents: 'none'
      }}
    >
      {/* Confetti effect */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-ping"
            style={{
              backgroundColor: i % 3 === 0 ? colors.brand.purple : i % 3 === 1 ? colors.accent.turquoise : colors.brand.silver,
              top: '50%',
              left: '50%',
              animation: `confetti-${i} 1.5s ease-out forwards`,
              animationDelay: `${i * 0.05}s`
            }}
          />
        ))}
      </div>

      <div 
        className="relative flex items-center gap-3 px-8 py-5 rounded-lg shadow-2xl backdrop-blur-md"
        style={{
          background: `linear-gradient(135deg, ${colors.brand.purple} 0%, ${colors.brand.purpleLight} 100%)`,
          border: `2px solid ${colors.accent.turquoise}`,
          boxShadow: `0 0 40px rgba(124, 93, 250, 0.6)`
        }}
      >
        <div className="animate-in zoom-in duration-300">
          <Sparkles 
            className="h-7 w-7 text-white animate-pulse" 
            strokeWidth={2.5}
            fill="currentColor"
          />
        </div>
        <div>
          <p className="text-white font-bold text-base">
            {message || '🚀 Your AI agent is live!'}
          </p>
          <p className="text-white/80 text-xs mt-1">
            Configuration published successfully
          </p>
        </div>
      </div>

      {/* Confetti animation keyframes */}
      <style>{`
        ${[...Array(12)].map((_, i) => {
          const angle = (i * 30) - 90; // Spread around 360 degrees
          const distance = 100 + (i % 3) * 50; // Varying distances
          const radians = (angle * Math.PI) / 180;
          const x = Math.cos(radians) * distance;
          const y = Math.sin(radians) * distance;
          
          return `
            @keyframes confetti-${i} {
              0% {
                transform: translate(0, 0) rotate(0deg);
                opacity: 1;
              }
              100% {
                transform: translate(${x}px, ${y}px) rotate(${360 * (i % 2 === 0 ? 1 : -1)}deg);
                opacity: 0;
              }
            }
          `;
        }).join('\n')}
      `}</style>
    </div>
  );
}

/**
 * Inline success indicator for buttons
 * Shows a checkmark next to button text briefly
 */
interface InlineSuccessProps {
  show: boolean;
}

export function InlineSuccess({ show }: InlineSuccessProps) {
  if (!show) return null;
  
  return (
    <span className="inline-flex items-center gap-1 animate-in fade-in zoom-in duration-200">
      <CheckCircle2 
        className="h-4 w-4" 
        style={{ color: colors.accent.turquoise }}
      />
    </span>
  );
}
