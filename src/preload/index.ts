import { contextBridge, ipcRenderer } from 'electron';
import log from 'electron-log';

// Define interfaces for type safety
interface POSOrder {
  id: string;
  items: POSOrderItem[];
  total: number;
  customer?: {
    name?: string;
    phone?: string;
  };
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  tableNumber?: number;
  timestamp: string;
}

interface POSOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  variants?: string[];
  special_instructions?: string;
}

interface DatabaseRecord {
  id: string;
  [key: string]: unknown;
}

interface PrinterStatus {
  connected: boolean;
  ready: boolean;
}

interface ElectronAPI {
  // Database operations
  database: {
    query: (sql: string, params?: unknown[]) => Promise<DatabaseRecord[]>;
    run: (sql: string, params?: unknown[]) => Promise<{ changes: number; lastInsertRowid: number }>;
  };
  
  // Configuration
  config: {
    get: (key: string) => Promise<unknown>;
    set: (key: string, value: unknown) => Promise<void>;
  };
  
  // Printing
  printer: {
    printReceipt: (orderData: POSOrder) => Promise<boolean>;
    printKitchenTicket: (orderData: POSOrder) => Promise<boolean>;
    getStatus: () => Promise<PrinterStatus>;
  };
  
  // Auto-start
  autoStart: {
    enable: () => Promise<boolean>;
    disable: () => Promise<boolean>;
    isEnabled: () => Promise<boolean>;
  };
  
  // App utilities
  app: {
    getVersion: () => Promise<string>;
    getPath: (name: 'home' | 'appData' | 'userData' | 'cache' | 'temp') => Promise<string>;
  };
  
  // Offline operations
  offline: {
    addToQueue: (data: POSOrder) => Promise<string>;
    getQueue: () => Promise<DatabaseRecord[]>;
    processQueue: () => Promise<number>;
  };
}

// Type declaration for global window object
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// API definition with proper typing
const api: ElectronAPI = {
  database: {
    query: (sql: string, params: unknown[] = []) => ipcRenderer.invoke('db:query', sql, params),
    run: (sql: string, params: unknown[] = []) => ipcRenderer.invoke('db:run', sql, params)
  },
  
  config: {
    get: (key: string) => ipcRenderer.invoke('config:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('config:set', key, value)
  },
  
  printer: {
    printReceipt: (orderData: POSOrder) => ipcRenderer.invoke('printer:print-receipt', orderData),
    printKitchenTicket: (orderData: POSOrder) => ipcRenderer.invoke('printer:print-kitchen-ticket', orderData),
    getStatus: () => ipcRenderer.invoke('printer:get-status')
  },
  
  autoStart: {
    enable: () => ipcRenderer.invoke('autostart:enable'),
    disable: () => ipcRenderer.invoke('autostart:disable'),
    isEnabled: () => ipcRenderer.invoke('autostart:is-enabled')
  },
  
  app: {
    getVersion: () => ipcRenderer.invoke('app:get-version'),
    getPath: (name: 'home' | 'appData' | 'userData' | 'cache' | 'temp') => ipcRenderer.invoke('app:get-path', name)
  },
  
  offline: {
    addToQueue: (data: POSOrder) => ipcRenderer.invoke('offline:add-to-queue', data),
    getQueue: () => ipcRenderer.invoke('offline:get-queue'),
    processQueue: () => ipcRenderer.invoke('offline:process-queue')
  }
};

// Expose the API to the renderer process
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', api);
    log.info('Electron API exposed to renderer process');
  } catch (error) {
    log.error('Failed to expose Electron API:', error);
  }
} else {
  // Fallback for non-isolated context (not recommended)
  (window as unknown as { electronAPI: ElectronAPI }).electronAPI = api;
  log.warn('Context isolation is disabled - this is not recommended for security');
}
