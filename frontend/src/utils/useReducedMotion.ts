/**
 * Reduced Motion Utility
 *
 * Detects user's motion preference and provides utilities for respecting
 * the prefers-reduced-motion media query for accessibility.
 *
 * @module useReducedMotion
 */

import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user prefers reduced motion
 *
 * @returns true if user prefers reduced motion, false otherwise
 *
 * @example
 * const prefersReduced = useReducedMotion();
 * const animationDuration = prefersReduced ? 0 : 300;
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    // Legacy browsers (Safari < 14)
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Get appropriate scroll behavior based on motion preference
 *
 * @param prefersReduced - Whether user prefers reduced motion
 * @returns 'auto' for instant scroll, 'smooth' for animated scroll
 *
 * @example
 * const prefersReduced = useReducedMotion();
 * element.scrollIntoView({ behavior: getScrollBehavior(prefersReduced) });
 */
export function getScrollBehavior(prefersReduced: boolean): ScrollBehavior {
  return prefersReduced ? 'auto' : 'smooth';
}

/**
 * Get appropriate animation duration based on motion preference
 *
 * @param prefersReduced - Whether user prefers reduced motion
 * @param normalDuration - Duration in ms when motion is allowed
 * @returns 0 for reduced motion, normalDuration otherwise
 *
 * @example
 * const prefersReduced = useReducedMotion();
 * const duration = getAnimationDuration(prefersReduced, 300);
 */
export function getAnimationDuration(
  prefersReduced: boolean,
  normalDuration: number
): number {
  return prefersReduced ? 0 : normalDuration;
}

/**
 * Framer Motion transition config that respects reduced motion
 *
 * @param prefersReduced - Whether user prefers reduced motion
 * @returns Transition config object for Framer Motion
 *
 * @example
 * const prefersReduced = useReducedMotion();
 * <motion.div transition={getMotionTransition(prefersReduced)} />
 */
export function getMotionTransition(prefersReduced: boolean) {
  if (prefersReduced) {
    return { duration: 0 };
  }
  return { type: 'spring', duration: 0.3 };
}

export default useReducedMotion;
