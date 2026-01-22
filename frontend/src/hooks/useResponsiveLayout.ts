/**
 * useResponsiveLayout Hook
 *
 * Custom hook for responsive layout management.
 * Provides screen size detection and breakpoint utilities.
 */

import { useState, useEffect, useCallback } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface ResponsiveLayoutState {
  /** Current screen width in pixels */
  width: number;
  /** Current screen height in pixels */
  height: number;
  /** Current breakpoint */
  breakpoint: Breakpoint;
  /** Whether screen is mobile size (< 768px) */
  isMobile: boolean;
  /** Whether screen is tablet size (768px - 1024px) */
  isTablet: boolean;
  /** Whether screen is desktop size (>= 1024px) */
  isDesktop: boolean;
  /** Whether sidebar should be collapsed by default */
  shouldCollapseSidebar: boolean;
}

// Tailwind CSS breakpoints
const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Get the current breakpoint based on window width
 */
function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

/**
 * Hook for responsive layout management
 *
 * @returns Object with screen dimensions, breakpoint, and device type flags
 *
 * @example
 * ```tsx
 * const { isMobile, shouldCollapseSidebar, breakpoint } = useResponsiveLayout();
 *
 * // Auto-collapse sidebar on mobile
 * useEffect(() => {
 *   if (shouldCollapseSidebar) {
 *     setSidebarCollapsed(true);
 *   }
 * }, [shouldCollapseSidebar]);
 * ```
 */
export function useResponsiveLayout(): ResponsiveLayoutState {
  const [state, setState] = useState<ResponsiveLayoutState>(() => {
    // Initial state (SSR-safe)
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const height = typeof window !== 'undefined' ? window.innerHeight : 768;
    const breakpoint = getBreakpoint(width);

    return {
      width,
      height,
      breakpoint,
      isMobile: width < BREAKPOINTS.md,
      isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
      isDesktop: width >= BREAKPOINTS.lg,
      shouldCollapseSidebar: width < BREAKPOINTS.lg,
    };
  });

  const handleResize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const breakpoint = getBreakpoint(width);

    setState({
      width,
      height,
      breakpoint,
      isMobile: width < BREAKPOINTS.md,
      isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
      isDesktop: width >= BREAKPOINTS.lg,
      shouldCollapseSidebar: width < BREAKPOINTS.lg,
    });
  }, []);

  useEffect(() => {
    // Initial check
    handleResize();

    // Add resize listener with debounce
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedResize);
    };
  }, [handleResize]);

  return state;
}

/**
 * Hook to check if current screen matches a minimum breakpoint
 *
 * @param breakpoint - Minimum breakpoint to check
 * @returns True if screen width is >= breakpoint
 *
 * @example
 * ```tsx
 * const isLargeScreen = useMinBreakpoint('lg');
 * // true if width >= 1024px
 * ```
 */
export function useMinBreakpoint(breakpoint: Breakpoint): boolean {
  const { width } = useResponsiveLayout();
  return width >= BREAKPOINTS[breakpoint];
}

export default useResponsiveLayout;
