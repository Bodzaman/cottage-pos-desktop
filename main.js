
const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, globalShortcut, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const { autoUpdater } = require('electron-updater');
const AutoLaunch = require('auto-launch');

class CottageTandooriPOS {
    constructor() {
        this.mainWindow = null;
        this.settingsWindow = null;
        this.tray = null;
        this.defaultPrinter = null;
        this.config = null;
        this.autoLauncher = null;
        
        this.init();
    }

    async init() {
        // Load configuration first
        await this.loadConfig();
        
        // Setup auto-launcher
        this.autoLauncher = new AutoLaunch({
            name: 'Cottage Tandoori POS',
            path: process.execPath,
        });
        
        // Prevent multiple instances
        const gotTheLock = app.requestSingleInstanceLock();
        if (!gotTheLock) {
            console.log('Another instance is already running');
            app.quit();
            return;
        }

        app.on('second-instance', () => {
            if (this.mainWindow) {
                if (this.mainWindow.isMinimized()) this.mainWindow.restore();
                this.mainWindow.focus();
            }
        });

        app.whenReady().then(() => {
            this.createMainWindow();
            this.setupPrinting();
            this.setupSystemTray();
            this.setupGlobalShortcuts();
            this.setupAutoUpdater();
            this.applyAutostartSetting();
        });

        app.on('window-all-closed', () => {
            // Keep running in background unless explicitly quit
        });

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                this.createMainWindow();
            }
        });
    }

    async loadConfig() {
        const configPath = path.join(app.getPath('userData'), 'pos-config.json');
        
        // Default configuration
        const defaultConfig = {
            posiiUrl: 'https://databutton.com/_projects/88a315b0-faa2-491d-9215-cf1e283cdee2/dbtn/devx/ui/POSII',
            autostart: true,
            updateChannel: 'stable', // stable, beta
            windowMode: 'normal', // normal, kiosk
            printSettings: {
                defaultPrinter: null,
                thermalWidth: 80,
                autoSilentPrint: true
            },
            appSettings: {
                startMinimized: false,
                showSplash: true,
                enableDevTools: false
            }
        };
        
        try {
            const configData = await fs.readFile(configPath, 'utf8');
            this.config = { ...defaultConfig, ...JSON.parse(configData) };
            console.log('Configuration loaded:', this.config);
        } catch (error) {
            console.log('Using default configuration, creating config file...');
            this.config = defaultConfig;
            await this.saveConfig();
        }
    }

    async saveConfig() {
        const configPath = path.join(app.getPath('userData'), 'pos-config.json');
        try {
            await fs.writeFile(configPath, JSON.stringify(this.config, null, 2));
            console.log('Configuration saved successfully');
        } catch (error) {
            console.error('Failed to save configuration:', error);
        }
    }

    createMainWindow() {
        const windowConfig = {
            width: 1400,
            height: 900,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            },
            title: 'Cottage Tandoori POS',
            show: false,
            icon: path.join(__dirname, 'assets', 'icon.png')
        };

        // Apply window mode from config
        if (this.config.windowMode === 'kiosk') {
            windowConfig.kiosk = true;
            windowConfig.alwaysOnTop = true;
        }
        
        // Apply dev tools setting
        windowConfig.webPreferences.devTools = this.config.appSettings.enableDevTools;

        this.mainWindow = new BrowserWindow(windowConfig);

        // Load POSII URL from config
        this.mainWindow.loadURL(this.config.posiiUrl);

        this.mainWindow.once('ready-to-show', () => {
            if (!this.config.appSettings.startMinimized) {
                this.mainWindow.show();
            }
            console.log('POS window loaded successfully');
        });

        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });
        
        // Create application menu
        this.createAppMenu();
    }
    
    createAppMenu() {
        const template = [
            {
                label: 'POS',
                submenu: [
                    {
                        label: 'Settings...',
                        accelerator: 'Ctrl+,',
                        click: () => this.openSettings()
                    },
                    { type: 'separator' },
                    {
                        label: 'Test Print',
                        accelerator: 'Ctrl+Shift+P',
                        click: () => this.printTestReceipt()
                    },
                    { type: 'separator' },
                    {
                        label: 'Check for Updates...',
                        click: () => this.checkForUpdates()
                    },
                    { type: 'separator' },
                    {
                        label: 'Restart App',
                        accelerator: 'Ctrl+Shift+R',
                        click: () => this.restartApp()
                    },
                    {
                        label: 'Quit',
                        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                        click: () => app.quit()
                    }
                ]
            },
            {
                label: 'View',
                submenu: [
                    {
                        label: 'Reload',
                        accelerator: 'Ctrl+R',
                        click: () => {
                            if (this.mainWindow) {
                                this.mainWindow.reload();
                            }
                        }
                    },
                    {
                        label: 'Developer Tools',
                        accelerator: 'F12',
                        click: () => {
                            if (this.mainWindow && this.config.appSettings.enableDevTools) {
                                this.mainWindow.webContents.toggleDevTools();
                            }
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Actual Size',
                        accelerator: 'Ctrl+0',
                        click: () => {
                            if (this.mainWindow) {
                                this.mainWindow.webContents.setZoomLevel(0);
                            }
                        }
                    },
                    {
                        label: 'Zoom In',
                        accelerator: 'Ctrl+Plus',
                        click: () => {
                            if (this.mainWindow) {
                                const currentZoom = this.mainWindow.webContents.getZoomLevel();
                                this.mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
                            }
                        }
                    },
                    {
                        label: 'Zoom Out',
                        accelerator: 'Ctrl+-',
                        click: () => {
                            if (this.mainWindow) {
                                const currentZoom = this.mainWindow.webContents.getZoomLevel();
                                this.mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
                            }
                        }
                    }
                ]
            },
            {
                label: 'Help',
                submenu: [
                    {
                        label: 'Setup Guide',
                        click: () => shell.openExternal('https://github.com/Bodzaman/cottage-pos-desktop/blob/main/SETUP.md')
                    },
                    {
                        label: 'Troubleshooting',
                        click: () => shell.openExternal('https://github.com/Bodzaman/cottage-pos-desktop/blob/main/TROUBLESHOOTING.md')
                    },
                    { type: 'separator' },
                    {
                        label: 'About',
                        click: () => this.showAbout()
                    }
                ]
            }
        ];
        
        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

    openSettings() {
        if (this.settingsWindow) {
            this.settingsWindow.focus();
            return;
        }

        this.settingsWindow = new BrowserWindow({
            width: 600,
            height: 700,
            parent: this.mainWindow,
            modal: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'settings-preload.js')
            },
            title: 'Settings - Cottage Tandoori POS',
            resizable: false
        });

        this.settingsWindow.loadFile('settings.html');

        this.settingsWindow.on('closed', () => {
            this.settingsWindow = null;
        });
        
        // Send current config to settings window
        this.settingsWindow.webContents.once('did-finish-load', () => {
            this.settingsWindow.webContents.send('load-config', this.config);
        });
    }
    
    async applyAutostartSetting() {
        try {
            const isEnabled = await this.autoLauncher.isEnabled();
            
            if (this.config.autostart && !isEnabled) {
                await this.autoLauncher.enable();
                console.log('Autostart enabled');
            } else if (!this.config.autostart && isEnabled) {
                await this.autoLauncher.disable();
                console.log('Autostart disabled');
            }
        } catch (error) {
            console.error('Failed to apply autostart setting:', error);
        }
    }

    setupAutoUpdater() {
        // Configure update channel
        autoUpdater.channel = this.config.updateChannel;
        autoUpdater.autoDownload = false;
        
        autoUpdater.on('checking-for-update', () => {
            console.log('Checking for update...');
        });
        
        autoUpdater.on('update-available', (info) => {
            console.log('Update available:', info.version);
            
            dialog.showMessageBox(this.mainWindow, {
                type: 'info',
                title: 'Update Available',
                message: `A new version (${info.version}) is available. Do you want to download it now?`,
                buttons: ['Download', 'Later'],
                defaultId: 0
            }).then(result => {
                if (result.response === 0) {
                    autoUpdater.downloadUpdate();
                }
            });
        });
        
        autoUpdater.on('update-not-available', () => {
            console.log('Update not available.');
        });
        
        autoUpdater.on('error', (err) => {
            console.error('Error in auto-updater:', err);
        });
        
        autoUpdater.on('download-progress', (progressObj) => {
            const logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
            console.log(logMessage);
        });
        
        autoUpdater.on('update-downloaded', () => {
            dialog.showMessageBox(this.mainWindow, {
                type: 'info',
                title: 'Update Ready',
                message: 'Update downloaded. The application will restart to apply the update.',
                buttons: ['Restart Now', 'Later'],
                defaultId: 0
            }).then(result => {
                if (result.response === 0) {
                    autoUpdater.quitAndInstall();
                }
            });
        });
        
        // Check for updates on startup (after 5 seconds)
        setTimeout(() => {
            autoUpdater.checkForUpdatesAndNotify();
        }, 5000);
    }
    
    checkForUpdates() {
        autoUpdater.checkForUpdatesAndNotify();
    }
    
    restartApp() {
        app.relaunch();
        app.exit();
    }
    
    showAbout() {
        dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'About Cottage Tandoori POS',
            message: 'Cottage Tandoori POS',
            detail: `Version: ${app.getVersion()}
Electron: ${process.versions.electron}
Node: ${process.versions.node}

A professional desktop POS application with thermal printing capabilities.`,
            buttons: ['OK']
        });
    }

    setupSystemTray() {
        const trayIcon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'tray-icon.png'));
        this.tray = new Tray(trayIcon);
        
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Show POS',
                click: () => {
                    if (this.mainWindow) {
                        this.mainWindow.show();
                        this.mainWindow.focus();
                    }
                }
            },
            {
                label: 'Settings',
                click: () => this.openSettings()
            },
            { type: 'separator' },
            {
                label: 'Test Print',
                click: () => this.printTestReceipt()
            },
            { type: 'separator' },
            {
                label: 'Quit',
                click: () => app.quit()
            }
        ]);
        
        this.tray.setContextMenu(contextMenu);
        this.tray.setToolTip('Cottage Tandoori POS');
        
        this.tray.on('double-click', () => {
            if (this.mainWindow) {
                this.mainWindow.show();
                this.mainWindow.focus();
            }
        });
    }

    setupGlobalShortcuts() {
        // Test print shortcut
        globalShortcut.register('Ctrl+Shift+P', () => {
            this.printTestReceipt();
        });
        
        // Settings shortcut
        globalShortcut.register('Ctrl+Shift+S', () => {
            this.openSettings();
        });
        
        // Restart shortcut
        globalShortcut.register('Ctrl+Shift+R', () => {
            this.restartApp();
        });
    }

    setupPrinting() {
        this.initializePrinter();
        
        // Handle print-receipt IPC
        ipcMain.handle('print-receipt', async (event, data) => {
            try {
                console.log('Received print-receipt request:', data.receipt?.receipt_number);
                return await this.printReceipt(data);
            } catch (error) {
                console.error('Print receipt error:', error);
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('print-test', async () => {
            return await this.printTestReceipt();
        });

        ipcMain.handle('get-printers', async () => {
            return await this.discoverPrinters();
        });
        
        // Configuration IPC handlers
        ipcMain.handle('get-config', () => {
            return this.config;
        });
        
        ipcMain.handle('save-config', async (event, newConfig) => {
            this.config = { ...this.config, ...newConfig };
            await this.saveConfig();
            
            // Apply autostart setting
            await this.applyAutostartSetting();
            
            // Reload main window if URL changed
            if (newConfig.posiiUrl && this.mainWindow) {
                this.mainWindow.loadURL(this.config.posiiUrl);
            }
            
            return { success: true };
        });
    }

    async initializePrinter() {
        try {
            const printers = await this.discoverPrinters();
            
            // Use configured printer or find Epson thermal printer
            if (this.config.printSettings.defaultPrinter) {
                this.defaultPrinter = this.config.printSettings.defaultPrinter;
            } else {
                const epsonPrinter = printers.find(p => 
                    p.name.toLowerCase().includes('epson') && 
                    (p.name.toLowerCase().includes('tm-t20') || p.name.toLowerCase().includes('tm-t88'))
                );
                
                this.defaultPrinter = epsonPrinter ? epsonPrinter.name : printers[0]?.name;
                
                // Save discovered printer to config
                if (this.defaultPrinter) {
                    this.config.printSettings.defaultPrinter = this.defaultPrinter;
                    await this.saveConfig();
                }
            }
            
            console.log('Default printer set to:', this.defaultPrinter);
        } catch (error) {
            console.error('Printer initialization error:', error);
        }
    }

    async discoverPrinters() {
        try {
            const { stdout } = await execAsync(
                'powershell -Command "Get-Printer | Select-Object Name, DriverName, PrinterStatus | ConvertTo-Json"'
            );
            
            const printers = JSON.parse(stdout);
            const printerList = Array.isArray(printers) ? printers : [printers];
            
            return printerList.map(printer => ({
                name: printer.Name,
                driver: printer.DriverName,
                status: printer.PrinterStatus,
                available: printer.PrinterStatus === 'Normal'
            }));
        } catch (error) {
            console.error('Failed to discover printers:', error);
            return [];
        }
    }

    async printTestReceipt() {
        try {
            const testReceipt = {
                header: {
                    restaurantName: "Cottage Tandoori",
                    address: "Test Location",
                    phone: "01903 000000"
                },
                items: [
                    { name: "Test Item", price: "£5.00", quantity: 1 }
                ],
                total: "£5.00",
                timestamp: new Date().toISOString()
            };
            
            const result = await this.printReceipt({ receipt: testReceipt, test_mode: true });
            
            if (result.success) {
                dialog.showMessageBox(this.mainWindow, {
                    type: 'info',
                    title: 'Test Print',
                    message: 'Test receipt printed successfully!',
                    buttons: ['OK']
                });
            } else {
                dialog.showMessageBox(this.mainWindow, {
                    type: 'error',
                    title: 'Print Error',
                    message: `Print failed: ${result.error}`,
                    buttons: ['OK']
                });
            }
            
            return result;
        } catch (error) {
            console.error('Test print error:', error);
            return { success: false, error: error.message };
        }
    }

    async printReceipt(data) {
        if (!this.defaultPrinter) {
            throw new Error('No printer configured');
        }

        const { receipt } = data;
        
        try {
            // Generate thermal receipt content
            const receiptContent = this.generateThermalReceipt(receipt);
            
            // Print using Windows thermal printing
            const { stdout } = await execAsync(
                `powershell -Command "Add-Type -AssemblyName System.Drawing; Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${receiptContent}')"`,
                { timeout: 30000 }
            );
            
            console.log('Receipt printed successfully');
            return {
                success: true,
                message: 'Receipt printed successfully',
                printer: this.defaultPrinter
            };
        } catch (error) {
            console.error('Print error:', error);
            throw error;
        }
    }

    generateThermalReceipt(receipt) {
        let content = '';
        
        // Header
        if (receipt.header) {
            content += `${receipt.header.restaurantName}
`;
            content += `${receipt.header.address}
`;
            content += `${receipt.header.phone}
`;
            content += '--------------------------------
';
        }
        
        // Items
        if (receipt.items) {
            receipt.items.forEach(item => {
                content += `${item.name}
`;
                content += `  ${item.quantity} x ${item.price}
`;
            });
            content += '--------------------------------
';
        }
        
        // Total
        if (receipt.total) {
            content += `TOTAL: ${receipt.total}
`;
        }
        
        // Footer
        content += '
';
        content += 'Thank you for your visit!
';
        content += '


';
        
        return content;
    }
}

// Initialize app
const pos = new CottageTandooriPOS();
