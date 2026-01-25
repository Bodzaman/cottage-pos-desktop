/**
 * Mobile Touch Target Utility
 *
 * Provides utilities for ensuring touch targets meet Apple's Human Interface
 * Guidelines (44x44pt minimum) and Android's Material Design guidelines.
 *
 * @module useMobileTouchTarget
 */

import { useMemo } from 'react';

/**
 * Detects if the current device supports touch input
 */
export function useIsTouchDevice(): boolean {
  return useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore - msMaxTouchPoints is IE specific
      navigator.msMaxTouchPoints > 0
    );
  }, []);
}

/**
 * Returns appropriate touch-safe classes based on device type
 *
 * @param baseClass - Base CSS classes to include
 * @returns CSS class string with touch-safe additions on touch devices
 *
 * @example
 * const buttonClass = useMobileTouchTarget('bg-blue-500 text-white');
 * // On touch devices: 'bg-blue-500 text-white min-h-[44px] min-w-[44px] touch-manipulation'
 * // On desktop: 'bg-blue-500 text-white'
 */
export function useMobileTouchTarget(baseClass = ''): string {
  const isTouch = useIsTouchDevice();

  return useMemo(() => {
    if (isTouch) {
      // Apple HIG recommends 44x44pt minimum touch targets
      return `${baseClass} min-h-[44px] min-w-[44px] touch-manipulation`.trim();
    }
    return baseClass;
  }, [isTouch, baseClass]);
}

/**
 * Predefined touch-safe button classes
 * Use these for consistent touch targets across the app
 */
export const touchSafeButton = 'min-h-[44px] min-w-[44px] touch-manipulation';

/**
 * Predefined touch-safe icon button classes (with padding)
 */
export const touchSafeIconButton = 'min-h-[44px] min-w-[44px] p-2 touch-manipulation';

/**
 * Predefined touch-safe pill/chip classes
 */
export const touchSafePill = 'min-h-[44px] px-4 touch-manipulation';

/**
 * CSS classes for better touch interaction
 * - touch-manipulation: Removes 300ms delay on touch devices
 * - active:scale-95: Provides visual feedback on press
 */
export const touchFeedbackClasses = 'touch-manipulation active:scale-95 transition-transform';

export default useMobileTouchTarget;
