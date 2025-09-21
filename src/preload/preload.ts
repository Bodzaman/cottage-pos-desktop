/**
 * Cottage Tandoori POS - Preload Script
 * Exposes secure IPC handlers to the renderer process
 */

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App information
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Update functions
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

  // About dialog
  showAbout: () => ipcRenderer.invoke('show-about'),

  // Platform information
  platform: process.platform,

  // Version information
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});

// Type definitions for TypeScript (if using TypeScript in renderer)
declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>;
      checkForUpdates: () => Promise<void>;
      showAbout: () => Promise<void>;
      platform: string;
      versions: {
        node: string;
        chrome: string;
        electron: string;
      };
    };
  }
}
