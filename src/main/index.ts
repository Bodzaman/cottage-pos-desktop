import { app, BrowserWindow, Menu, Tray, ipcMain, globalShortcut } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import * as isDev from 'electron-is-dev';

// Logging
import log from 'electron-log';

// Type definitions
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

  private readonly windowConfig: WindowConfig = {
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600
  };

  constructor() {
    log.info('🚀 Cottage Tandoori POS - Application Starting');
    this.initializeApp();
  }

  private initializeApp(): void {
    // Security: Prevent new window creation
    app.on('web-contents-created', (_, contents) => {
      contents.on('new-window', (event) => {
        event.preventDefault();
      });
    });

    app.whenReady().then(() => {
      this.createMainWindow();
      this.setupMenu();
      this.setupTray();
      this.setupGlobalShortcuts();
      this.setupUpdater();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
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
    });
  }

  private createMainWindow(): void {
    // Security-first window configuration
    this.mainWindow = new BrowserWindow({
      ...this.windowConfig,
      title: 'Cottage Tandoori POS',
      icon: path.join(__dirname, '../build/icon.ico'),
      show: false, // Don't show until ready
      webPreferences: {
        // Modern security settings
        nodeIntegration: false,           // ⛔ Disable Node.js in renderer
        contextIsolation: true,           // ✅ Isolate context
        enableRemoteModule: false,        // ⛔ Disable remote module
        sandbox: true,                    // ✅ Enable sandbox
        webSecurity: true,                // ✅ Keep web security
        allowRunningInsecureContent: false, // ⛔ Block insecure content
        experimentalFeatures: false,      // ⛔ Disable experimental features
        preload: path.join(__dirname, 'preload/index.js') // Safe preload script
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
    });

    this.mainWindow.on('close', (event) => {
      if (!this.isQuiting) {
        event.preventDefault();
        this.mainWindow?.hide();
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
            click: () => {
              this.mainWindow?.webContents.send('trigger-test-print');
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
        label: 'Help',
        submenu: [
          {
            label: 'About',
            click: () => {
              this.mainWindow?.webContents.send('show-about');
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
      {
        label: 'Test Print',
        click: () => {
          this.mainWindow?.webContents.send('trigger-test-print');
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
    this.tray.setToolTip('Cottage Tandoori POS');

    this.tray.on('double-click', () => {
      this.mainWindow?.show();
    });
  }

  private setupGlobalShortcuts(): void {
    globalShortcut.register('CommandOrControl+Shift+P', () => {
      log.info('🖨️ Global shortcut triggered: Test Print');
      this.mainWindow?.webContents.send('trigger-test-print');
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
    }
  }
}

// Initialize the application
new CottagePOSApp();