import { app, BrowserWindow, Menu, Tray, nativeImage } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import { setupIpcHandlers } from './ipc/ipc-handlers';
import { AutoStartManager } from './windows/auto-start-manager';
// import icon from '../../resources/icon.png'; // Icon will be added later
const icon = null; // Placeholder - will be added later

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

class ElectronApp {
  private mainWindow!: BrowserWindow;
  private tray!: Tray;
  private autoStartManager!: AutoStartManager;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Initialize auto-start manager
    this.autoStartManager = new AutoStartManager();
    
    // Setup app event handlers
    this.setupAppHandlers();
    
    // Setup auto-updater
    this.setupAutoUpdater();
  }

  private setupAppHandlers(): void {
    // This method will be called when Electron has finished initialization
    app.whenReady().then(() => {
      electronApp.setAppUserModelId('com.cottage-tandoori.pos');
      
      // Default open or close DevTools by F12 in development
      app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window);
      });
      
      this.createWindow();
      this.createTray();
      this.setupIpcCommunication();
      
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) this.createWindow();
      });
    });
    
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      show: false,
      autoHideMenuBar: true,
      icon || undefined: nativeImage.createFromPath(icon || undefined),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    this.mainWindow.on('ready-to-show', () => {
      this.mainWindow.show();
      log.info('Main window created and shown');
    });

    this.mainWindow.webContents.setWindowOpenHandler((details) => {
      require('electron').shell.openExternal(details.url);
      return { action: 'deny' };
    });

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this.mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
    } else {
      this.mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }
  }

  private createTray(): void {
    const trayIcon = nativeImage.createFromPath(icon).resize({ width: 16, height: 16 });
    this.tray = new Tray(trayIcon);
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show App',
        click: () => {
          if (this.mainWindow) {
            this.mainWindow.show();
          }
        }
      },
      {
        label: 'Hide App',
        click: () => {
          if (this.mainWindow) {
            this.mainWindow.hide();
          }
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        click: () => {
          app.quit();
        }
      }
    ]);
    
    this.tray.setToolTip('Cottage Tandoori POS');
    this.tray.setContextMenu(contextMenu);
    
    log.info('System tray created');
  }

  private setupIpcCommunication(): void {
    setupIpcHandlers();
    log.info('IPC handlers registered');
  }

  private setupAutoUpdater(): void {
    autoUpdater.checkForUpdatesAndNotify();
    
    autoUpdater.on('update-available', () => {
      log.info('Update available');
    });
    
    autoUpdater.on('update-downloaded', () => {
      log.info('Update downloaded, will install on restart');
    });
  }
}

// Create and start the application
new ElectronApp();