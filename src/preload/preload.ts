/**
 * Cottage Tandoori POS - Preload Script
 * Secure bridge between main and renderer processes
 */

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * App information
   */
  getVersion: () => ipcRenderer.invoke('app:getVersion'),

  /**
   * Window controls
   */
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),

  /**
   * System information
   */
  getPlatform: () => process.platform,
  getAppVersion: () => process.env.npm_package_version || '1.0.0',

  /**
   * Printing support (for future thermal printer integration)
   */
  printReceipt: (data: any) => ipcRenderer.invoke('printer:receipt', data),

  /**
   * File system access (if needed for offline data)
   */
  saveData: (filename: string, data: any) => ipcRenderer.invoke('fs:save', filename, data),
  loadData: (filename: string) => ipcRenderer.invoke('fs:load', filename),

  /**
   * Update notifications
   */
  onUpdateAvailable: (callback: () => void) => {
    ipcRenderer.on('update-available', callback);
  },
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('update-downloaded', callback);
  }
});

// Log initialization
console.log('🔗 Cottage Tandoori POS preload script loaded');
