import { contextBridge, ipcRenderer } from 'electron';
// Type definitions for better type safety
interface MenuItemOrder {
  id: string;
  name: string;
  price: number;
  quantity: number;
  modifiers?: string[];
}

interface PrintJobData {
  type: 'receipt' | 'kitchen' | 'test';
  content: string;
  options?: Record<string, unknown>;
}


// Type definitions for the exposed API
export interface ElectronAPI {
  // System operations
  openSettings: () => void;
  showAbout: () => void;

  // Printer operations
  testPrint: () => Promise<boolean>;
  printReceipt: (data: ReceiptData) => Promise<boolean>;

  // Update operations
  onUpdateAvailable: (callback: () => void) => void;
  onUpdateDownloaded: (callback: () => void) => void;
  restartAndUpdate: () => void;

  // Offline operations
  saveOfflineOrder: (order: OrderData) => Promise<void>;
  getOfflineOrders: () => Promise<OrderData[]>;
  syncOfflineOrders: () => Promise<void>;

  // Connection status
  onConnectionChange: (callback: (isOnline: boolean) => void) => void;
}

export interface ReceiptData {
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  timestamp: Date;
}

export interface OrderData {
  id: string;
  items: Array<MenuItemOrder>;
  total: number;
  timestamp: Date;
  synced: boolean;
}

// Secure API exposure
const electronAPI: ElectronAPI = {
  // System operations
  openSettings: () => ipcRenderer.send('open-settings'),
  showAbout: () => ipcRenderer.send('show-about'),

  // Printer operations
  testPrint: () => ipcRenderer.invoke('test-print'),
  printReceipt: (data: ReceiptData) => ipcRenderer.invoke('print-receipt', data),

  // Update operations
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', callback);
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', callback);
  },
  restartAndUpdate: () => ipcRenderer.send('restart-and-update'),

  // Offline operations
  saveOfflineOrder: (order: OrderData) => ipcRenderer.invoke('save-offline-order', order),
  getOfflineOrders: () => ipcRenderer.invoke('get-offline-orders'),
  syncOfflineOrders: () => ipcRenderer.invoke('sync-offline-orders'),

  // Connection status
  onConnectionChange: (callback) => {
    ipcRenderer.on('connection-change', (_, isOnline) => callback(isOnline));
  }
};

// Safely expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Security: Remove any Node.js globals that might have leaked
delete (window as Record<string, unknown>).require;
delete (window as Record<string, unknown>).exports;
delete (window as any).module;

// Log successful preload
console.log('🔒 Preload script loaded securely with context isolation');