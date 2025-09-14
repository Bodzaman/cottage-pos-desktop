
const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, globalShortcut, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

class CottageTandooriPOS {
    constructor() {
        this.mainWindow = null;
        this.tray = null;
        this.defaultPrinter = null;
        this.isProduction = !process.defaultApp;
        
        this.init();
    }

    init() {
        // Prevent multiple instances
        const gotTheLock = app.requestSingleInstanceLock();
        if (!gotTheLock) {
            log.info('Another instance is already running');
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
        });

        app.on('window-all-closed', () => {
            // Keep running in background on Windows
            if (process.platform !== 'darwin') {
                // Don't quit, stay in system tray
            }
        });

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                this.createMainWindow();
            }
        });
    }

    createMainWindow() {
        const windowConfig = {
            width: 1200,
            height: 800,
            minWidth: 1000,
            minHeight: 600,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js'),
                webSecurity: true
            },
            title: 'Cottage Tandoori POS',
            show: false,
            icon: path.join(__dirname, 'assets', 'icon.png'),
            autoHideMenuBar: false,
            titleBarStyle: 'default'
        };

        this.mainWindow = new BrowserWindow(windowConfig);

        // Create application menu
        this.createApplicationMenu();

        // Load POSII URL
        const posiiUrl = this.isProduction 
            ? 'https://databutton.com/_projects/88a315b0-faa2-491d-9215-cf1e283cdee2/dbtn/prodx/ui/POSII'
            : 'https://databutton.com/_projects/88a315b0-faa2-491d-9215-cf1e283cdee2/dbtn/devx/ui/POSII';
            
        this.mainWindow.loadURL(posiiUrl);

        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
            this.mainWindow.focus();
            log.info('POS window loaded successfully');
        });

        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });

        // Handle external links
        this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            require('electron').shell.openExternal(url);
            return { action: 'deny' };
        });
    }

    createApplicationMenu() {
        const template = [
            {
                label: 'File',
                submenu: [
                    {
                        label: 'Test Print',
                        accelerator: 'CmdOrCtrl+Shift+P',
                        click: async () => {
                            await this.printTestReceipt();
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Exit',
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
                        label: 'Check for Updates',
                        click: () => {
                            autoUpdater.checkForUpdatesAndNotify();
                        }
                    },
                    {
                        label: 'About',
                        click: () => {
                            dialog.showMessageBox(this.mainWindow, {
                                type: 'info',
                                title: 'About Cottage Tandoori POS',
                                message: 'Cottage Tandoori POS v1.0.0',
                                detail: 'Professional Restaurant Point of Sale System

Built with Electron
Copyright © 2024 Cottage Tandoori Restaurant'
                            });
                        }
                    }
                ]
            }
        ];

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

    setupAutoUpdater() {
        if (!this.isProduction) {
            log.info('Auto-updater disabled in development');
            return;
        }

        autoUpdater.checkForUpdatesAndNotify();

        autoUpdater.on('checking-for-update', () => {
            log.info('Checking for updates...');
        });

        autoUpdater.on('update-available', (info) => {
            log.info('Update available:', info.version);
        });

        autoUpdater.on('update-not-available', (info) => {
            log.info('Update not available:', info.version);
        });

        autoUpdater.on('error', (err) => {
            log.error('Error in auto-updater:', err);
        });

        autoUpdater.on('download-progress', (progressObj) => {
            let log_message = "Download speed: " + progressObj.bytesPerSecond;
            log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
            log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
            log.info(log_message);
        });

        autoUpdater.on('update-downloaded', (info) => {
            log.info('Update downloaded:', info.version);
            autoUpdater.quitAndInstall();
        });
    }

    setupPrinting() {
        this.initializePrinter();
        
        ipcMain.handle('print-receipt', async (event, data) => {
            try {
                log.info('Received print-receipt request:', data.receipt?.receipt_number);
                return await this.printReceipt(data);
            } catch (error) {
                log.error('Print receipt error:', error);
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('print-test', async () => {
            return await this.printTestReceipt();
        });

        ipcMain.handle('get-printers', async () => {
            return await this.discoverPrinters();
        });
    }

    async initializePrinter() {
        try {
            const printers = await this.discoverPrinters();
            
            const epsonPrinter = printers.find(p => 
                p.name.toLowerCase().includes('epson') && 
                (p.name.toLowerCase().includes('tm-t20') || p.name.toLowerCase().includes('tm-t88'))
            );
            
            this.defaultPrinter = epsonPrinter ? epsonPrinter.name : printers[0]?.name;
            log.info('Default printer set to:', this.defaultPrinter);
        } catch (error) {
            log.error('Printer initialization error:', error);
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
            log.error('Failed to discover printers:', error);
            return [];
        }
    }

    async printTestReceipt() {
        const testReceipt = {
            receipt_number: 'TEST001',
            order_id: 'TEST_ORDER',
            order_type: 'TEST',
            order_date: new Date().toISOString(),
            business: {
                name: 'COTTAGE TANDOORI',
                address: 'Test Receipt',
                phone: 'Printer Test'
            },
            items: [
                { name: 'Test Item 1', quantity: 1, price: 10.00, total: 10.00 },
                { name: 'Test Item 2', quantity: 2, price: 5.50, total: 11.00 }
            ],
            totals: {
                subtotal: 21.00,
                total: 21.00
            },
            footer_message: 'TEST PRINT SUCCESSFUL'
        };

        return await this.printReceipt({ receipt: testReceipt });
    }

    setupSystemTray() {
        const iconPath = path.join(__dirname, 'assets', 'icon.png');
        let trayIcon;
        
        try {
            trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
        } catch {
            trayIcon = nativeImage.createEmpty();
        }
        
        this.tray = new Tray(trayIcon);
        
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Show POS',
                click: () => {
                    if (this.mainWindow) {
                        this.mainWindow.show();
                        this.mainWindow.focus();
                    } else {
                        this.createMainWindow();
                    }
                }
            },
            {
                label: 'Test Print',
                click: async () => {
                    try {
                        await this.printTestReceipt();
                        log.info('Test print successful');
                    } catch (error) {
                        log.error('Test print failed:', error);
                    }
                }
            },
            { type: 'separator' },
            {
                label: 'Check for Updates',
                click: () => {
                    autoUpdater.checkForUpdatesAndNotify();
                }
            },
            { type: 'separator' },
            {
                label: 'Exit',
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
        globalShortcut.register('CommandOrControl+Shift+P', async () => {
            try {
                log.info('Test print triggered by hotkey');
                await this.printTestReceipt();
                log.info('Hotkey test print successful');
            } catch (error) {
                log.error('Hotkey test print failed:', error);
            }
        });

        log.info('Global shortcuts registered');
    }

    async printReceipt(data) {
        if (!this.defaultPrinter) {
            throw new Error('No printer configured');
        }

        const { receipt } = data;
        
        try {
            const htmlContent = this.generateReceiptHtml(receipt);
            const tempFile = path.join(require('os').tmpdir(), `receipt-${Date.now()}.html`);
            await fs.writeFile(tempFile, htmlContent, 'utf8');
            
            const result = await this.printHtmlFile(tempFile);
            
            await fs.unlink(tempFile);
            return result;
        } catch (error) {
            throw error;
        }
    }

    async printHtmlFile(htmlPath) {
        try {
            const printWindow = new BrowserWindow({
                show: false,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true
                }
            });

            await printWindow.loadFile(htmlPath);

            const printOptions = {
                silent: true,
                printBackground: false,
                deviceName: this.defaultPrinter,
                color: false,
                margins: {
                    marginType: 'custom',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0
                },
                landscape: false,
                pageSize: {
                    width: 80000,
                    height: 297000
                }
            };

            await printWindow.webContents.print(printOptions);
            printWindow.close();

            log.info('Receipt printed successfully');
            return {
                success: true,
                printer: this.defaultPrinter,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            log.error('Print error:', error);
            throw error;
        }
    }

    generateReceiptHtml(receipt) {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { size: 80mm auto; margin: 2mm; }
        body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 4mm; width: 76mm; }
        .center { text-align: center; }
        .header { text-align: center; margin-bottom: 8px; border-bottom: 1px dashed #000; padding-bottom: 8px; }
        .business-name { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
        .item { margin-bottom: 2px; display: flex; justify-content: space-between; }
        .totals { border-top: 1px dashed #000; padding-top: 8px; margin-top: 8px; }
        .total-line { display: flex; justify-content: space-between; margin-bottom: 2px; }
        .grand-total { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding: 4px 0; }
    </style>
</head>
<body>
    <div class="header">
        <div class="business-name">${receipt.business?.name || 'Cottage Tandoori'}</div>
        <div>${receipt.business?.address || '123 Restaurant Street'}</div>
        <div>Tel: ${receipt.business?.phone || '+44 20 1234 5678'}</div>
    </div>
    
    <div>
        <div>Receipt: ${receipt.receipt_number}</div>
        <div>Order: ${receipt.order_id}</div>
        <div>Type: ${receipt.order_type}</div>
        <div>Date: ${new Date(receipt.order_date).toLocaleString()}</div>
    </div>
    
    <div style="margin: 8px 0;">
        ${receipt.items.map(item => `
            <div class="item">
                <span>${item.quantity}x ${item.name}</span>
                <span>£${(item.total || item.quantity * item.price).toFixed(2)}</span>
            </div>
        `).join('')}
    </div>
    
    <div class="totals">
        <div class="total-line">
            <span>Subtotal:</span>
            <span>£${receipt.totals.subtotal.toFixed(2)}</span>
        </div>
        <div class="total-line grand-total">
            <span>TOTAL:</span>
            <span>£${receipt.totals.total.toFixed(2)}</span>
        </div>
    </div>
    
    <div class="center" style="margin-top: 8px; border-top: 1px dashed #000; padding-top: 8px;">
        ${receipt.footer_message || 'Thank you for dining with us!'}
    </div>
</body>
</html>
        `;
    }
}

// Start the app
new CottageTandooriPOS();
