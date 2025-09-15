import { app, BrowserWindow, Menu, Tray, globalShortcut, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import log from 'electron-log';

// Import our managers
import { DatabaseManager } from './offline/database-manager';
import { ThermalPrinterManager } from './printer/thermal-printer-manager';
import { IPCHandlers } from './ipc/ipc-handlers';

// Configure logging
log.transports.file.level = 'debug';
log.transports.console.level = 'debug';

interface WindowConfig {
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
}

class CottagePOSApp {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private isQuiting = false;

  // Core managers - initialized in constructor
  private dbManager!: DatabaseManager;
  private printerManager!: ThermalPrinterManager;
  private ipcHandlers!: IPCHandlers;

  private readonly windowConfig: WindowConfig = {
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600
  };
  constructor() {
    this.initializeManagers();
  }

  private initializeManagers(): void {
    // Initialize managers in proper order
    this.dbManager = new DatabaseManager();
    this.printerManager = new ThermalPrinterManager();
    this.ipcHandlers = new IPCHandlers(this.dbManager, this.printerManager);
  }


  constructor() {
    log.info('🚀 Cottage Tandoori POS - Application Starting');
    this.initializeManagers();
    this.initializeApp();
  }

  private initializeManagers(): void {
    try {
      // Initialize database manager
      this.dbManager = new DatabaseManager();
      log.info('✅ Database manager initialized');

      // Initialize printer manager
      this.printerManager = new ThermalPrinterManager(this.dbManager);
      log.info('✅ Printer manager initialized');

      // Initialize IPC handlers
      this.ipcHandlers = new IPCHandlers(this.dbManager, this.printerManager);
      log.info('✅ IPC handlers initialized');

      // Set app version in database
      this.dbManager.setConfig('app_version', app.getVersion());

    } catch (error) {
      log.error('❌ Failed to initialize managers:', error);
      dialog.showErrorBox('Initialization Error', 
        'Failed to initialize core components. Please restart the application.');
    }
  }

  private initializeApp(): void {
    // Security: Prevent new window creation
    app.on('web-contents-created', (_, contents) => {
      contents.on('new-window', (event: any) => {
        event.preventDefault();
      });

      // Security: Prevent navigation to external URLs
      contents.on('will-navigate', (event, navigationUrl) => {
        if (navigationUrl !== contents.getURL()) {
          event.preventDefault();
        }
      });
    });

    app.whenReady().then(() => {
      this.createMainWindow();
      this.setupMenu();
      this.setupTray();
      this.setupGlobalShortcuts();
      this.setupUpdater();
      this.startBackgroundTasks();

      log.info('✅ Application ready and fully initialized');
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        this.cleanup();
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });

    app.on('before-quit', () => {
      this.isQuiting = true;
      this.cleanup();
    });

    // Handle app certificate errors in development
    if (isDev) {
      app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
        if (url.startsWith('https://localhost')) {
          event.preventDefault();
          callback(true);
        } else {
          callback(false);
        }
      });
    }
  }

  private createMainWindow(): void {
    // Security-first window configuration
    this.mainWindow = new BrowserWindow({
      ...this.windowConfig,
      title: 'Cottage Tandoori POS',
      icon: path.join(__dirname, '../build/icon.ico'),
      show: false, // Don't show until ready
      autoHideMenuBar: false, // Keep menu bar visible
      webPreferences: {
        // Modern security settings
        nodeIntegration: false,           // ⛔ Disable Node.js in renderer
        contextIsolation: true,           // ✅ Isolate context
        // enableRemoteModule removed (deprecated in Electron 14+)
        sandbox: true,                    // ✅ Enable sandbox
        webSecurity: true,                // ✅ Keep web security
        allowRunningInsecureContent: false, // ⛔ Block insecure content
        experimentalFeatures: false,      // ⛔ Disable experimental features
        preload: path.join(__dirname, '../preload/index.js') // Safe preload script
      }
    });

    // Load the application
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:5173'); // Vite dev server
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // Window event handlers
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
      log.info('✅ Main window ready and shown');

      // Send initial system info to renderer
      this.mainWindow?.webContents.send('system-ready', {
        version: app.getVersion(),
        isDev: isDev,
        platform: process.platform
      });
    });

    this.mainWindow.on('close', (event) => {
      if (!this.isQuiting) {
        event.preventDefault();
        this.mainWindow?.hide();

        // Show notification on first minimize
        if (this.tray) {
          this.tray.displayBalloon({
            iconType: 'info',
            title: 'Cottage Tandoori POS',
            content: 'Application minimized to system tray. Right-click the tray icon to access options.'
          });
        }

        log.info('🔄 Window hidden to system tray');
      }
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private setupMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Test Print',
            accelerator: 'CmdOrCtrl+Shift+P',
            click: async () => {
              try {
                const result = await this.printerManager.testPrint();
                this.mainWindow?.webContents.send('print-result', result);
              } catch (error) {
                log.error('Menu test print failed:', error);
              }
            }
          },
          {
            label: 'Create Test Order',
            accelerator: 'CmdOrCtrl+Shift+T',
            click: async () => {
              try {
                await this.ipcHandlers.createTestOrder();
                this.mainWindow?.webContents.send('test-order-created');
              } catch (error) {
                log.error('Test order creation failed:', error);
              }
            }
          },
          { type: 'separator' },
          {
            label: 'Settings',
            accelerator: 'CmdOrCtrl+,',
            click: () => {
              this.mainWindow?.webContents.send('open-settings');
            }
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              this.isQuiting = true;
              app.quit();
            }
          }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Tools',
        submenu: [
          {
            label: 'Process Print Queue',
            click: async () => {
              try {
                await this.printerManager.processPrintQueue();
                this.mainWindow?.webContents.send('print-queue-processed');
              } catch (error) {
                log.error('Print queue processing failed:', error);
              }
            }
          },
          {
            label: 'Sync Offline Orders',
            accelerator: 'CmdOrCtrl+Shift+S',
            click: () => {
              this.mainWindow?.webContents.send('trigger-sync');
            }
          },
          { type: 'separator' },
          {
            label: 'Open Logs Folder',
            click: async () => {
              try {
                const { shell } = require('electron');
                const logPath = log.transports.file.getFile().path;
                await shell.showItemInFolder(logPath);
              } catch (error) {
                log.error('Failed to open logs folder:', error);
              }
            }
          },
          {
            label: 'Database Cleanup',
            click: async () => {
              try {
                this.dbManager.cleanup();
                this.mainWindow?.webContents.send('database-cleaned');
              } catch (error) {
                log.error('Database cleanup failed:', error);
              }
            }
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About Cottage Tandoori POS',
            click: () => {
              dialog.showMessageBox(this.mainWindow!, {
                type: 'info',
                title: 'About Cottage Tandoori POS',
                message: 'Cottage Tandoori POS',
                detail: `Version: ${app.getVersion()}\nElectron: ${process.versions.electron}\nNode: ${process.versions.node}\n\nProfessional restaurant management system with offline capabilities and thermal printing.`,
                buttons: ['OK']
              });
            }
          },
          { type: 'separator' },
          {
            label: 'System Information',
            click: () => {
              this.mainWindow?.webContents.send('show-system-info');
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupTray(): void {
    const trayIconPath = path.join(__dirname, '../build/icon.ico');
    this.tray = new Tray(trayIconPath);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Cottage Tandoori POS',
        click: () => {
          this.mainWindow?.show();
        }
      },
      { type: 'separator' },
      {
        label: 'Test Print',
        click: async () => {
          try {
            await this.printerManager.testPrint();
          } catch (error) {
            log.error('Tray test print failed:', error);
          }
        }
      },
      {
        label: 'Printer Status',
        click: async () => {
          try {
            const status = await this.printerManager.checkPrinterStatus();
            this.tray?.displayBalloon({
              iconType: status.connected ? 'info' : 'warning',
              title: 'Printer Status',
              content: `${status.name}: ${status.connected ? 'Connected' : 'Disconnected'}`
            });
          } catch (error) {
            log.error('Printer status check failed:', error);
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          this.isQuiting = true;
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('Cottage Tandoori POS - Professional Restaurant Management');

    this.tray.on('double-click', () => {
      this.mainWindow?.show();
    });
  }

  private setupGlobalShortcuts(): void {
    globalShortcut.register('CommandOrControl+Shift+P', async () => {
      log.info('🖨️ Global shortcut triggered: Test Print');
      try {
        const result = await this.printerManager.testPrint();
        this.mainWindow?.webContents.send('print-result', result);
      } catch (error) {
        log.error('Global shortcut test print failed:', error);
      }
    });

    globalShortcut.register('CommandOrControl+Shift+T', async () => {
      log.info('🧪 Global shortcut triggered: Create Test Order');
      try {
        await this.ipcHandlers.createTestOrder();
        this.mainWindow?.webContents.send('test-order-created');
      } catch (error) {
        log.error('Global shortcut test order failed:', error);
      }
    });
  }

  private setupUpdater(): void {
    if (!isDev) {
      autoUpdater.checkForUpdatesAndNotify();

      autoUpdater.on('update-available', () => {
        log.info('🔄 Update available');
        this.mainWindow?.webContents.send('update-available');
      });

      autoUpdater.on('update-downloaded', () => {
        log.info('✅ Update downloaded');
        this.mainWindow?.webContents.send('update-downloaded');
      });

      autoUpdater.on('error', (error) => {
        log.error('❌ Auto-updater error:', error);
      });
    }
  }

  private startBackgroundTasks(): void {
    // Process print queue every 30 seconds
    setInterval(async () => {
      try {
        await this.printerManager.processPrintQueue();
      } catch (error) {
        log.error('Background print queue processing failed:', error);
      }
    }, 30000);

    // Database cleanup daily
    setInterval(() => {
      try {
        this.dbManager.cleanup();
        log.info('🧹 Daily database cleanup completed');
      } catch (error) {
        log.error('Background database cleanup failed:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    log.info('⚙️ Background tasks started');
  }

  private cleanup(): void {
    try {
      // Close database connections
      if (this.dbManager) {
        this.dbManager.close();
      }

      // Unregister global shortcuts
      globalShortcut.unregisterAll();

      log.info('🧹 Application cleanup completed');
    } catch (error) {
      log.error('❌ Cleanup error:', error);
    }
  }
}

// Initialize the application
new CottagePOSApp();