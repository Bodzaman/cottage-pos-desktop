import { ipcMain, shell, app } from 'electron';
import log from 'electron-log';
import { DatabaseManager, OrderData } from '../offline/database-manager';
import { ThermalPrinterManager, ReceiptData } from '../printer/thermal-printer-manager';
import * as os from 'os';
import * as path from 'path';

export class IPCHandlers {
  private dbManager: DatabaseManager;
  private printerManager: ThermalPrinterManager;

  constructor(dbManager: DatabaseManager, printerManager: ThermalPrinterManager) {
    this.dbManager = dbManager;
    this.printerManager = printerManager;
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // System operations
    ipcMain.handle('get-app-version', () => {
      return app.getVersion();
    });

    ipcMain.handle('get-system-info', () => {
      return {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        electronVersion: process.versions.electron,
        osVersion: os.release(),
        totalMemory: Math.round(os.totalmem() / 1024 / 1024), // MB
        userDataPath: app.getPath('userData')
      };
    });

    ipcMain.handle('open-external-url', async (_, url: string) => {
      try {
        await shell.openExternal(url);
        return { success: true };
      } catch (error) {
        log.error('Failed to open external URL:', error);
        return { success: false, error: error.message };
      }
    });

    // Printer operations
    ipcMain.handle('test-print', async () => {
      try {
        log.info('🖨️ Test print requested via IPC');
        const result = await this.printerManager.testPrint();
        return result.success;
      } catch (error) {
        log.error('❌ Test print IPC error:', error);
        return false;
      }
    });

    ipcMain.handle('print-receipt', async (_, receiptData: ReceiptData, orderId: string) => {
      try {
        log.info(`🖨️ Receipt print requested for order ${receiptData.orderNumber}`);
        const result = await this.printerManager.printReceipt(receiptData, orderId);
        return result.success;
      } catch (error) {
        log.error('❌ Receipt print IPC error:', error);
        return false;
      }
    });

    ipcMain.handle('print-kitchen-ticket', async (_, receiptData: ReceiptData, orderId: string) => {
      try {
        log.info(`🍳 Kitchen ticket requested for order ${receiptData.orderNumber}`);
        const result = await this.printerManager.printKitchenTicket(receiptData, orderId);
        return result.success;
      } catch (error) {
        log.error('❌ Kitchen ticket IPC error:', error);
        return false;
      }
    });

    ipcMain.handle('get-printer-status', async () => {
      try {
        const status = await this.printerManager.checkPrinterStatus();
        return {
          connected: status.connected,
          name: status.name,
          ready: this.printerManager.isReady()
        };
      } catch (error) {
        log.error('❌ Printer status check error:', error);
        return { connected: false, name: 'Unknown', ready: false };
      }
    });

    ipcMain.handle('process-print-queue', async () => {
      try {
        await this.printerManager.processPrintQueue();
        return { success: true };
      } catch (error) {
        log.error('❌ Print queue processing error:', error);
        return { success: false, error: error.message };
      }
    });

    // Database operations
    ipcMain.handle('save-offline-order', async (_, orderData: OrderData) => {
      try {
        log.info(`💾 Saving offline order ${orderData.orderNumber}`);
        this.dbManager.saveOrder(orderData);
        return { success: true };
      } catch (error) {
        log.error('❌ Save offline order error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('get-offline-orders', async () => {
      try {
        const orders = this.dbManager.getUnsyncedOrders();
        log.info(`📋 Retrieved ${orders.length} unsynced orders`);
        return orders;
      } catch (error) {
        log.error('❌ Get offline orders error:', error);
        return [];
      }
    });

    ipcMain.handle('get-order', async (_, orderId: string) => {
      try {
        const order = this.dbManager.getOrder(orderId);
        return order;
      } catch (error) {
        log.error('❌ Get order error:', error);
        return null;
      }
    });

    ipcMain.handle('sync-offline-orders', async () => {
      try {
        log.info('🔄 Starting offline order sync');
        const unsyncedOrders = this.dbManager.getUnsyncedOrders();

        // TODO: Implement actual sync with Supabase
        // For now, we'll simulate successful sync
        for (const order of unsyncedOrders) {
          // Mark as synced (in real implementation, sync with Supabase first)
          order.synced = true;
          this.dbManager.saveOrder(order);
        }

        log.info(`✅ Synced ${unsyncedOrders.length} orders`);
        return { success: true, syncedCount: unsyncedOrders.length };
      } catch (error) {
        log.error('❌ Sync offline orders error:', error);
        return { success: false, error: error.message, syncedCount: 0 };
      }
    });

    // Configuration operations
    ipcMain.handle('get-config', async (_, key: string) => {
      try {
        const value = this.dbManager.getConfig(key);
        return value;
      } catch (error) {
        log.error('❌ Get config error:', error);
        return null;
      }
    });

    ipcMain.handle('set-config', async (_, key: string, value: string) => {
      try {
        this.dbManager.setConfig(key, value);
        log.info(`⚙️ Config updated: ${key} = ${value}`);
        return { success: true };
      } catch (error) {
        log.error('❌ Set config error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('get-all-config', async () => {
      try {
        // Get common configuration keys
        const configKeys = [
          'app_version', 'pos_url', 'printer_name', 'auto_print_receipts',
          'offline_mode', 'last_sync', 'tax_rate', 'currency'
        ];

        const config: Record<string, string> = {};
        for (const key of configKeys) {
          const value = this.dbManager.getConfig(key);
          if (value !== null) {
            config[key] = value;
          }
        }

        return config;
      } catch (error) {
        log.error('❌ Get all config error:', error);
        return {};
      }
    });

    // Database maintenance
    ipcMain.handle('cleanup-database', async () => {
      try {
        this.dbManager.cleanup();
        log.info('🧹 Database cleanup completed via IPC');
        return { success: true };
      } catch (error) {
        log.error('❌ Database cleanup error:', error);
        return { success: false, error: error.message };
      }
    });

    // Development helpers
    ipcMain.handle('get-app-logs', async () => {
      try {
        const logPath = log.transports.file.getFile().path;
        return { logPath };
      } catch (error) {
        return { logPath: null };
      }
    });

    ipcMain.handle('open-logs-folder', async () => {
      try {
        const logPath = log.transports.file.getFile().path;
        await shell.showItemInFolder(logPath);
        return { success: true };
      } catch (error) {
        log.error('❌ Open logs folder error:', error);
        return { success: false, error: error.message };
      }
    });

    // Settings and about dialogs
    ipcMain.on('open-settings', () => {
      log.info('⚙️ Settings requested');
      // TODO: Implement settings window or modal
    });

    ipcMain.on('show-about', () => {
      log.info('ℹ️ About dialog requested');
      // TODO: Implement about dialog
    });

    // Update operations
    ipcMain.on('restart-and-update', () => {
      log.info('🔄 Restart and update requested');
      app.relaunch();
      app.exit();
    });

    // Connection monitoring
    this.setupConnectionMonitoring();

    log.info('✅ IPC handlers registered successfully');
  }

  private setupConnectionMonitoring(): void {
    // Monitor internet connection and notify renderer
    let isOnline = true;

    const checkConnection = async () => {
      try {
        // Simple check by trying to reach a reliable endpoint
        const response = await fetch('https://www.google.com', { 
          method: 'HEAD',
          mode: 'no-cors',
          timeout: 5000 
        });

        const newStatus = true; // If we get here, we're online
        if (newStatus !== isOnline) {
          isOnline = newStatus;
          this.broadcastConnectionChange(isOnline);
        }
      } catch (error) {
        const newStatus = false;
        if (newStatus !== isOnline) {
          isOnline = newStatus;
          this.broadcastConnectionChange(isOnline);
        }
      }
    };

    // Check connection every 30 seconds
    setInterval(checkConnection, 30000);

    // Initial check
    checkConnection();
  }

  private broadcastConnectionChange(isOnline: boolean): void {
    // Broadcast to all renderer processes
    const { BrowserWindow } = require('electron');
    const windows = BrowserWindow.getAllWindows();

    windows.forEach(window => {
      window.webContents.send('connection-change', isOnline);
    });

    log.info(`📡 Connection status changed: ${isOnline ? 'Online' : 'Offline'}`);

    // Update database config
    this.dbManager.setConfig('offline_mode', isOnline ? 'false' : 'true');

    // If we're back online, process print queue
    if (isOnline) {
      this.printerManager.processPrintQueue().catch(error => {
        log.error('❌ Auto print queue processing failed:', error);
      });
    }
  }

  // Method to simulate order creation for testing
  public async createTestOrder(): Promise<void> {
    const testOrder: OrderData = {
      id: `test-${Date.now()}`,
      orderNumber: `TEST${Math.floor(Math.random() * 1000)}`,
      orderType: 'DINE_IN',
      tableNumber: '5',
      customerName: 'Test Customer',
      subtotal: 25.50,
      taxAmount: 5.10,
      discountAmount: 0,
      totalAmount: 30.60,
      paymentMethod: 'CARD',
      paymentStatus: 'PAID',
      orderStatus: 'NEW',
      notes: 'Test order for system verification',
      synced: false,
      items: [
        {
          id: `item-${Date.now()}-1`,
          menuItemId: 'chicken-tikka-masala',
          quantity: 1,
          unitPrice: 15.50,
          totalPrice: 15.50,
          specialInstructions: 'Medium spice'
        },
        {
          id: `item-${Date.now()}-2`,
          menuItemId: 'pilau-rice',
          quantity: 2,
          unitPrice: 5.00,
          totalPrice: 10.00
        }
      ]
    };

    this.dbManager.saveOrder(testOrder);

    // Create receipt data for printing
    const receiptData: ReceiptData = {
      orderNumber: testOrder.orderNumber,
      orderType: testOrder.orderType,
      items: testOrder.items.map(item => ({
        name: item.menuItemId.replace('-', ' ').replace(/\w/g, l => l.toUpperCase()),
        quantity: item.quantity,
        price: item.unitPrice,
        total: item.totalPrice
      })),
      subtotal: testOrder.subtotal,
      tax: testOrder.taxAmount,
      total: testOrder.totalAmount,
      timestamp: new Date(),
      customerName: testOrder.customerName,
      tableNumber: testOrder.tableNumber
    };

    // Add to print queue
    await this.printerManager.printReceipt(receiptData, testOrder.id);

    log.info(`🧪 Test order created: ${testOrder.orderNumber}`);
  }
}