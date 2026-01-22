import { useState, useLayoutEffect } from 'react';

export interface ViewportSize {
  width: number;
  height: number;
}

/**
 * useViewport - Production-grade viewport detection hook
 * 
 * Features:
 * - Reads actual window dimensions on mount (no hardcoded defaults)
 * - Uses useLayoutEffect to measure synchronously before paint
 * - Handles SSR/iframe contexts safely
 * - Debounced resize listener for performance
 * - Returns both width and height for flexibility
 * 
 * Why useLayoutEffect:
 * - Fires synchronously after DOM mutations but BEFORE browser paint
 * - Ensures we have the real viewport size before first render
 * - Prevents flash of wrong layout on mount
 */
export function useViewport(): ViewportSize {
  // Initialize with actual window size (0 for SSR safety)
  const [size, setSize] = useState<ViewportSize>(() => {
    if (typeof window === 'undefined') {
      return { width: 0, height: 0 };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  });

  useLayoutEffect(() => {
    // Safety check for SSR
    if (typeof window === 'undefined') return;

    // Measure immediately on mount to catch iframe/container size
    const measureViewport = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Initial measurement (critical for iframe contexts)
    measureViewport();

    // Debounced resize handler for performance
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(measureViewport, 100);
    };

    // Listen for resize events
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return size;
}

/**
 * useBreakpoint - Semantic breakpoint detector
 * Returns named breakpoint for easier layout logic
 */
export type Breakpoint = 'small' | 'tablet' | 'laptop' | 'desktop' | 'wide';

export function useBreakpoint(): Breakpoint {
  const { width } = useViewport();

  if (width >= 1920) return 'wide';
  if (width >= 1440) return 'desktop';
  if (width >= 1024) return 'laptop';
  if (width >= 768) return 'tablet';
  return 'small';
}
