import { ipcMain, app } from 'electron';
import log from 'electron-log';
import { DatabaseManager } from '../offline/database-manager';
import { ThermalPrinterManager } from '../printer/thermal-printer-manager';
import { AutoStartManager } from '../windows/auto-start-manager';

// Initialize managers
const dbManager = new DatabaseManager();
const printerManager = new ThermalPrinterManager(dbManager);
const autoStartManager = new AutoStartManager();

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

interface PrintJobData {
  type: 'receipt' | 'kitchen';
  order: POSOrder;
  timestamp: string;
}

interface DatabaseRecord {
  id: string;
  [key: string]: unknown;
}

interface ConfigData {
  key: string;
  value: unknown;
}

export function setupIpcHandlers(): void {
  log.info('Setting up IPC handlers...');

  // Database operations
  ipcMain.handle('db:query', async (_, sql: string, params: unknown[] = []): Promise<DatabaseRecord[]> => {
    try {
      return await dbManager.query(sql, params);
    } catch (error) {
      log.error('Database query error:', error);
      throw error;
    }
  });

  ipcMain.handle('db:run', async (_, sql: string, params: unknown[] = []): Promise<{ changes: number; lastInsertRowid: number }> => {
    try {
      return await dbManager.run(sql, params);
    } catch (error) {
      log.error('Database run error:', error);
      throw error;
    }
  });

  // Configuration
  ipcMain.handle('config:get', async (_, key: string): Promise<unknown> => {
    try {
      return await dbManager.getConfig(key);
    } catch (error) {
      log.error('Config get error:', error);
      return null;
    }
  });

  ipcMain.handle('config:set', async (_, key: string, value: unknown): Promise<void> => {
    try {
      await dbManager.setConfig(key, value);
    } catch (error) {
      log.error('Config set error:', error);
      throw error;
    }
  });

  // Printing operations
  ipcMain.handle('printer:print-receipt', async (_, orderData: POSOrder): Promise<boolean> => {
    try {
      return await printerManager.printReceipt(orderData);
    } catch (error) {
      log.error('Print receipt error:', error);
      return false;
    }
  });

  ipcMain.handle('printer:print-kitchen-ticket', async (_, orderData: POSOrder): Promise<boolean> => {
    try {
      return await printerManager.printKitchenTicket(orderData);
    } catch (error) {
      log.error('Print kitchen ticket error:', error);
      return false;
    }
  });

  ipcMain.handle('printer:get-status', async (): Promise<{ connected: boolean; ready: boolean }> => {
    try {
      return await printerManager.getStatus();
    } catch (error) {
      log.error('Get printer status error:', error);
      return { connected: false, ready: false };
    }
  });

  // Auto-start management
  ipcMain.handle('autostart:enable', async (): Promise<boolean> => {
    try {
      return await autoStartManager.enable();
    } catch (error) {
      log.error('Enable auto-start error:', error);
      return false;
    }
  });

  ipcMain.handle('autostart:disable', async (): Promise<boolean> => {
    try {
      return await autoStartManager.disable();
    } catch (error) {
      log.error('Disable auto-start error:', error);
      return false;
    }
  });

  ipcMain.handle('autostart:is-enabled', async (): Promise<boolean> => {
    try {
      return await autoStartManager.isEnabled();
    } catch (error) {
      log.error('Check auto-start status error:', error);
      return false;
    }
  });

  // App information
  ipcMain.handle('app:get-version', (): string => {
    return app.getVersion();
  });

  ipcMain.handle('app:get-path', (_, name: 'home' | 'appData' | 'userData' | 'cache' | 'temp'): string => {
    return app.getPath(name);
  });

  // Offline queue management
  ipcMain.handle('offline:add-to-queue', async (_, data: POSOrder): Promise<string> => {
    try {
      return await dbManager.addToOfflineQueue(data);
    } catch (error) {
      log.error('Add to offline queue error:', error);
      throw error;
    }
  });

  ipcMain.handle('offline:get-queue', async (): Promise<DatabaseRecord[]> => {
    try {
      return await dbManager.getOfflineQueue();
    } catch (error) {
      log.error('Get offline queue error:', error);
      return [];
    }
  });

  ipcMain.handle('offline:process-queue', async (): Promise<number> => {
    try {
      return await dbManager.processOfflineQueue();
    } catch (error) {
      log.error('Process offline queue error:', error);
      return 0;
    }
  });

  log.info('IPC handlers setup complete');
}
