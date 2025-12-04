/**
 * Electron Mode Detection Utility
 * 
 * RESPONSIBILITY:
 * Detect if the app is running in Electron environment and provide
 * headers for brain API requests to enable dual-mode printing.
 * 
 * USED BY:
 * - usePrintingOperations: Add X-Electron-Mode header to print requests
 * - Any component that needs to detect Electron environment
 * 
 * FLOW:
 * 1. Check if window.electronAPI exists (set by Electron preload script)
 * 2. Return appropriate headers for brain client RequestParams
 */

import type { RequestParams } from '../brain/http-client';

/**
 * Check if app is running in Electron environment
 * @returns true if running in Electron, false otherwise
 */
export function isElectronMode(): boolean {
  // Check if window.electronAPI exists (Electron preload script)
  if (typeof window === 'undefined') {
    return false;
  }
  
  return 'electronAPI' in window;
}

/**
 * Get headers for brain API requests based on environment
 * Used to tell backend whether to use thermal printer service or web mode
 * 
 * @returns RequestParams with X-Electron-Mode header if in Electron
 */
export function getElectronHeaders(): Pick<RequestParams, 'headers'> {
  if (isElectronMode()) {
    return {
      headers: {
        'X-Electron-Mode': 'true'
      }
    };
  }
  
  return {
    headers: {}
  };
}

/**
 * Log Electron mode status (useful for debugging)
 * Call this once during app initialization
 */
export function logElectronMode(): void {
  if (isElectronMode()) {
    console.log('🖥️ Running in Electron mode - thermal printer service enabled');
  } else {
    console.log('🌐 Running in web mode - HTML print output enabled');
  }
}
