/**
 * Riff Framework Compatibility Layer
 * 
 * This module provides stubs for Riff-specific imports that don't exist
 * in the standalone Electron build. It allows the codebase to be built
 * without errors while maintaining compatibility with the Riff platform.
 */

// Mode enum (DEV/PROD)
export const Mode = {
  DEV: 'development',
  PROD: 'production'
};

// Current mode (hardcoded for desktop build)
export const mode = process.env.NODE_ENV === 'production' ? Mode.PROD : Mode.DEV;

// App base path (empty for desktop, as it runs locally)
export const APP_BASE_PATH = '';

// API Client stub - Desktop uses direct HTTP fetch or other methods
export const apiClient = {
  // Add API methods as needed - these should be implemented
  // to call your actual backend or local Electron IPC
};

// Database stub - Desktop may use local storage or Supabase directly
export const db = {
  storage: {
    // Implement as needed
  }
};

// Export everything that might be imported from 'app'
export default {
  Mode,
  mode,
  APP_BASE_PATH,
  apiClient,
  db
};
