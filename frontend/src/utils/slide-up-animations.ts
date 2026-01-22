/**
 * Reusable slide-up animation utilities for authentication forms
 * Implements elegant entrance animations with staggered timing and accessibility support
 */

export interface AnimationConfig {
  duration?: number;
  delay?: number;
  staggerDelay?: number;
  easing?: string;
}

const DEFAULT_CONFIG: Required<AnimationConfig> = {
  duration: 500,
  delay: 0,
  staggerDelay: 80,
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)' // Smooth ease-out
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Generate CSS keyframes for slide-up animation
 */
export const createSlideUpKeyframes = (): string => {
  const keyframeName = 'slideUpFadeIn';
  
  // Check if keyframes already exist
  const existingStyleSheet = document.querySelector(`style[data-animation="${keyframeName}"]`);
  if (existingStyleSheet) return keyframeName;
  
  const style = document.createElement('style');
  style.setAttribute('data-animation', keyframeName);
  style.textContent = `
    @keyframes ${keyframeName} {
      0% {
        opacity: 0;
        transform: translate3d(0, 32px, 0);
      }
      100% {
        opacity: 1;
        transform: translate3d(0, 0, 0);
      }
    }
    
    @keyframes slideDownFadeIn {
      0% {
        opacity: 0;
        transform: translate3d(0, -16px, 0);
      }
      100% {
        opacity: 1;
        transform: translate3d(0, 0, 0);
      }
    }
    
    @keyframes bounceIn {
      0% {
        opacity: 0;
        transform: translate3d(0, 16px, 0) scale(0.95);
      }
      60% {
        opacity: 1;
        transform: translate3d(0, -2px, 0) scale(1.02);
      }
      100% {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
      }
    }
    
    @media (prefers-reduced-motion: reduce) {
      @keyframes ${keyframeName} {
        0% {
          opacity: 0;
        }
        100% {
          opacity: 1;
        }
      }
      
      @keyframes slideDownFadeIn {
        0% {
          opacity: 0;
        }
        100% {
          opacity: 1;
        }
      }
      
      @keyframes bounceIn {
        0% {
          opacity: 0;
        }
        100% {
          opacity: 1;
        }
      }
    }
  `;
  
  document.head.appendChild(style);
  return keyframeName;
};

/**
 * Apply slide-up animation to an element
 */
export const applySlideUpAnimation = (
  element: HTMLElement | null,
  config: AnimationConfig = {},
  animationType: 'slideUp' | 'slideDown' | 'bounce' = 'slideUp'
): void => {
  if (!element) return;
  
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Skip animations if user prefers reduced motion
  if (prefersReducedMotion()) {
    element.style.opacity = '1';
    element.style.transform = 'none';
    return;
  }
  
  // Ensure keyframes are created
  createSlideUpKeyframes();
  
  // Get animation name based on type
  const animationName = {
    slideUp: 'slideUpFadeIn',
    slideDown: 'slideDownFadeIn',
    bounce: 'bounceIn'
  }[animationType];
  
  // Apply animation
  element.style.opacity = '0';
  element.style.animation = `${animationName} ${finalConfig.duration}ms ${finalConfig.easing} ${finalConfig.delay}ms forwards`;
};

/**
 * Apply staggered animations to multiple elements
 */
export const applyStaggeredAnimations = (
  elements: (HTMLElement | null)[],
  config: AnimationConfig = {},
  animationType: 'slideUp' | 'slideDown' | 'bounce' = 'slideUp'
): void => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  elements.forEach((element, index) => {
    if (element) {
      applySlideUpAnimation(element, {
        ...finalConfig,
        delay: finalConfig.delay + (index * finalConfig.staggerDelay)
      }, animationType);
    }
  });
};

/**
 * Hook-like function to apply animations on mount
 */
export const useSlideUpAnimation = () => {
  const animateElement = (ref: React.RefObject<HTMLElement>, config?: AnimationConfig, type?: 'slideUp' | 'slideDown' | 'bounce') => {
    if (ref.current) {
      applySlideUpAnimation(ref.current, config, type);
    }
  };
  
  const animateElements = (refs: React.RefObject<HTMLElement>[], config?: AnimationConfig, type?: 'slideUp' | 'slideDown' | 'bounce') => {
    applyStaggeredAnimations(
      refs.map(ref => ref.current),
      config,
      type
    );
  };
  
  return { animateElement, animateElements };
};

/**
 * CSS classes for different animation states
 */
export const animationClasses = {
  container: 'opacity-0', // Initial state for containers
  element: 'opacity-0',   // Initial state for elements
  // These will be overridden by the animations
} as const;
