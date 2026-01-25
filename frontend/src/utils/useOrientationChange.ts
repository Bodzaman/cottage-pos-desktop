/**
 * Orientation Change Hook
 *
 * Detects device orientation changes and provides reactive state.
 * Useful for adapting layouts when device is rotated.
 *
 * @module useOrientationChange
 */

import { useState, useEffect, useCallback } from 'react';

export type Orientation = 'portrait' | 'landscape';

export interface OrientationState {
  orientation: Orientation;
  isPortrait: boolean;
  isLandscape: boolean;
}

/**
 * Hook to detect and react to device orientation changes
 *
 * @param callback - Optional callback to execute on orientation change
 * @returns Current orientation state
 *
 * @example
 * const { orientation, isPortrait } = useOrientationChange();
 *
 * // With callback
 * useOrientationChange(() => {
 *   console.log('Orientation changed!');
 * });
 */
export function useOrientationChange(callback?: (orientation: Orientation) => void): OrientationState {
  const getOrientation = useCallback((): Orientation => {
    if (typeof window === 'undefined') return 'portrait';

    // Use screen.orientation if available (modern browsers)
    if (screen.orientation) {
      return screen.orientation.type.includes('portrait') ? 'portrait' : 'landscape';
    }

    // Fallback to media query
    return window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape';
  }, []);

  const [orientation, setOrientation] = useState<Orientation>(getOrientation);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOrientationChange = () => {
      const newOrientation = getOrientation();
      setOrientation(newOrientation);
      callback?.(newOrientation);
    };

    // Listen to multiple events for better cross-browser support
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    // Also use screen.orientation API if available
    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleOrientationChange);
    }

    // Initial check
    handleOrientationChange();

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', handleOrientationChange);
      }
    };
  }, [callback, getOrientation]);

  return {
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
  };
}

/**
 * Get current orientation without subscribing to changes
 * Useful for one-time checks
 */
export function getCurrentOrientation(): Orientation {
  if (typeof window === 'undefined') return 'portrait';

  if (screen.orientation) {
    return screen.orientation.type.includes('portrait') ? 'portrait' : 'landscape';
  }

  return window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape';
}

export default useOrientationChange;
