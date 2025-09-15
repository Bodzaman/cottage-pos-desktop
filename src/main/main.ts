/**
 * Cottage Tandoori POS - Main Process
 * Professional Electron desktop application for restaurant POS system
 */

import { app, BrowserWindow, Menu, shell, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import path from 'path';

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';
autoUpdater.logger = log;

// Global references
let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development';

/**
 * Create the main application window
 */
function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    icon: path.join(__dirname, '../../assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // enableRemoteModule: false, // Deprecated property removed
      preload: path.join(__dirname, '../preload/preload.js'),
      webSecurity: !isDev
    },
    titleBarStyle: 'default',
    show: false,
    backgroundColor: '#0f0f0f',
    title: 'Cottage Tandoori POS'
  });

  // Load the application - point to your Databutton POS page
  if (isDev) {
    window.loadURL('https://databutton.com/_projects/88a315b0-faa2-491d-9215-cf1e283cdee2/dbtn/devx/ui/POSDesktop');
    window.webContents.openDevTools();
  } else {
    window.loadURL('https://exoticcreations.databutton.app/cottage-tandoori-restaurant/POSDesktop');
  }

  // Show window when ready
  window.once('ready-to-show', () => {
    window.show();
    log.info('🚀 Cottage Tandoori POS Desktop loaded successfully');
  });

  // Handle window closed
  window.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return window;
}

/**
 * Application event handlers
 */
app.whenReady().then(async () => {
  log.info('🚀 Cottage Tandoori POS starting up...');

  // Create main window
  mainWindow = createMainWindow();

  // Check for updates (production only)
  if (!isDev) {
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 5000);
  }

  log.info('✅ Application initialized successfully');
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Re-create window when dock icon is clicked (macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createMainWindow();
  }
});

/**
 * Auto-updater events
 */
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  log.info('Update available:', info);
  if (mainWindow) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: 'A new version is available. It will be downloaded in the background.',
      buttons: ['OK']
    });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded:', info);
  if (mainWindow) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded. The application will restart to apply the update.',
      buttons: ['Restart Now', 'Later']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  }
});
