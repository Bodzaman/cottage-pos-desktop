/**
 * Electron-compatible environment configuration
 * Replaces Databutton's 'app' module for standalone builds
 * 
 * This module provides environment detection and configuration constants
 * that work in both Vite dev server and Electron production builds.
 */

// Mode enum matching Databutton's Mode enum
export enum Mode {
  DEV = "development",
  PROD = "production"
}

// Environment detection using Vite's built-in constants
// import.meta.env.MODE is automatically set by Vite:
// - "development" when running vite dev
// - "production" when running vite build
export const mode = (import.meta.env.MODE === "production" ? Mode.PROD : Mode.DEV) as Mode;

// API URL for backend communication
// In Electron production builds, this points to the live Databutton API
export const API_URL = "https://api.databutton.com/_projects/88a315b0-faa2-491d-9215-cf1e283cdee2/dbtn/prodx/app/routes";

// WebSocket API URL (if needed in future)
export const WS_API_URL = "wss://api.databutton.com/_projects/88a315b0-faa2-491d-9215-cf1e283cdee2/dbtn/prodx/app/routes";

// App base path for routing
// Electron apps run locally, so base path is root
export const APP_BASE_PATH = "/";

// Export as default for convenience
export default {
  Mode,
  mode,
  API_URL,
  WS_API_URL,
  APP_BASE_PATH
};
