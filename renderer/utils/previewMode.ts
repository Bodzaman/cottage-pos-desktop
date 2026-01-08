/**
 * Preview Mode Utilities
 * 
 * Detects and manages draft preview mode for the Website CMS.
 * When ?preview=draft is in the URL, pages load draft content instead of published.
 */

import { useState, useEffect } from 'react';

/**
 * Check if the current page is in draft preview mode
 */
export function isPreviewMode(): boolean {
  if (typeof window === 'undefined') return false;
  
  const params = new URLSearchParams(window.location.search);
  return params.get('preview') === 'draft';
}

/**
 * Get the current preview mode value
 */
export function getPreviewMode(): 'draft' | 'published' {
  return isPreviewMode() ? 'draft' : 'published';
}

/**
 * Reactive hook that detects preview mode changes from URL
 * Use this in components that need to react to preview mode changes
 */
export function usePreviewMode(): 'draft' | 'published' {
  const [mode, setMode] = useState<'draft' | 'published'>(() => getPreviewMode());

  useEffect(() => {
    // Initial check
    setMode(getPreviewMode());

    // Listen for URL changes (popstate for back/forward, and custom event for pushState/replaceState)
    const handleUrlChange = () => {
      const newMode = getPreviewMode();
      setMode(newMode);
      console.log('[Preview Mode Hook] URL changed, preview mode:', newMode);
    };

    // Listen to popstate (browser back/forward)
    window.addEventListener('popstate', handleUrlChange);

    // Listen to custom event for pushState/replaceState (used by iframe navigation)
    window.addEventListener('urlchange', handleUrlChange);

    // Poll for URL changes every 500ms as fallback (handles iframe navigation)
    let lastUrl = window.location.href;
    const pollInterval = setInterval(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        handleUrlChange();
      }
    }, 500);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('urlchange', handleUrlChange);
      clearInterval(pollInterval);
    };
  }, []);

  return mode;
}

/**
 * Add preview=draft parameter to current URL
 */
export function enablePreviewMode(): void {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  url.searchParams.set('preview', 'draft');
  window.history.pushState({}, '', url.toString());
}

/**
 * Remove preview parameter from current URL
 */
export function disablePreviewMode(): void {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  url.searchParams.delete('preview');
  window.history.pushState({}, '', url.toString());
}

/**
 * Build a URL with preview mode enabled
 */
export function buildPreviewUrl(path: string): string {
  const url = new URL(path, window.location.origin);
  url.searchParams.set('preview', 'draft');
  return url.toString();
}

/**
 * Build a URL with preview mode disabled (published)
 */
export function buildPublishedUrl(path: string): string {
  const url = new URL(path, window.location.origin);
  url.searchParams.delete('preview');
  return url.toString();
}
