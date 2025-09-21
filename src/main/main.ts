/**
 * Cottage Tandoori POS - Main Process
 * Professional Electron desktop application for restaurant POS system
 * Enhanced with improved auto-updater UX and About panel
 */

import { app, BrowserWindow, Menu, shell, dialog, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import path from 'path';

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';
autoUpdater.logger = log;

// Global references
let mainWindow: BrowserWindow | null = null;
let updateDownloaded = false;

const isDev = process.env.NODE_ENV === 'development';

/**
 * Create application menu with About option
 */
function createApplicationMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
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
          label: 'About Cottage Tandoori POS',
          click: () => {
            showAboutDialog();
          }
        },
        {
          label: 'Check for Updates',
          click: () => {
            checkForUpdatesManually();
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  return Menu.buildFromTemplate(template);
}

/**
 * Show About dialog with version information
 */
function showAboutDialog() {
  const version = app.getVersion();
  const electronVersion = process.versions.electron;
  const nodeVersion = process.versions.node;
  const chromeVersion = process.versions.chrome;

  if (mainWindow) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'About Cottage Tandoori POS',
      message: 'Cottage Tandoori POS Desktop',
      detail: `Version: ${version}
Built with Electron ${electronVersion}
Node.js ${nodeVersion}
Chrome ${chromeVersion}

Professional restaurant point-of-sale system
© 2025 Cottage Tandoori Restaurant

For support, contact:
support@cottagetandoori.com`,
      buttons: ['OK'],
      icon: path.join(__dirname, '../../assets/icon.png')
    });
  }
}

/**
 * Manual update check with user feedback
 */
function checkForUpdatesManually() {
  if (isDev) {
    if (mainWindow) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Updates',
        message: 'Updates are not available in development mode.',
        buttons: ['OK']
      });
    }
    return;
  }

  log.info('Manual update check initiated');
  autoUpdater.checkForUpdatesAndNotify();

  // Show checking message
  if (mainWindow) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Checking for Updates',
      message: 'Checking for updates... Please wait.',
      buttons: ['OK']
    });
  }
}

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
      preload: path.join(__dirname, '../preload/preload.js'),
      webSecurity: !isDev
    },
    titleBarStyle: 'default',
    show: false,
    backgroundColor: '#0f0f0f',
    title: 'Cottage Tandoori POS'
  });

  // Set application menu
  Menu.setApplicationMenu(createApplicationMenu());

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
 * Enhanced Auto-updater events with improved UX
 */
autoUpdater.on('checking-for-update', () => {
  log.info('🔍 Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  log.info('✅ Update available:', info);
  updateDownloaded = false;

  if (mainWindow) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `A new version (${info.version}) is available!`,
      detail: 'The update will be downloaded in the background. You\'ll be notified when it\'s ready to install.',
      buttons: ['OK'],
      icon: path.join(__dirname, '../../assets/icon.png')
    });
  }
});

autoUpdater.on('update-not-available', (info) => {
  log.info('ℹ️ Update not available:', info);

  // Only show this message if it was a manual check
  // (We can track this with a flag if needed)
});

autoUpdater.on('error', (err) => {
  log.error('❌ Update error:', err);

  if (mainWindow) {
    dialog.showErrorBox('Update Error', 
      `There was a problem checking for updates: ${err.message}`);
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  const logMessage = `⬇️ Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
  log.info(logMessage);
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('✅ Update downloaded:', info);
  updateDownloaded = true;

  if (mainWindow) {
    const dialogOpts = {
      type: 'info' as const,
      title: 'Update Ready to Install',
      message: `Version ${info.version} has been downloaded`,
      detail: 'The update is ready to install. The application will restart to complete the update.\n\nClick "Restart Now" to install immediately, or "Install Later" to install when you next close the app.',
      buttons: ['Restart Now', 'Install Later'],
      defaultId: 0,
      cancelId: 1,
      icon: path.join(__dirname, '../../assets/icon.png')
    };

    dialog.showMessageBox(mainWindow, dialogOpts).then((result) => {
      if (result.response === 0) {
        log.info('🔄 User chose to restart now');
        autoUpdater.quitAndInstall();
      } else {
        log.info('⏰ User chose to install later');
        // Set flag to install on next app quit
      }
    });
  }
});

// Install update on app quit if available
app.on('before-quit', (event) => {
  if (updateDownloaded && !isDev) {
    log.info('🔄 Installing update on quit');
    autoUpdater.quitAndInstall();
  }
});

/**
 * IPC handlers for renderer process communication
 */
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('check-for-updates', () => {
  checkForUpdatesManually();
});

ipcMain.handle('show-about', () => {
  showAboutDialog();
});
