const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, globalShortcut, dialog, powerMonitor, screen, nativeTheme } = require('electron');
nativeTheme.themeSource = 'dark';
// Note: electron-updater is lazily loaded after app.whenReady() to avoid initialization errors
let autoUpdater = null;
const log = require('electron-log');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const os = require('os');
const sharp = require('sharp');

// Section UUID mapping for receipt section separators
// Matches the frontend sectionMapping.ts SECTION_UUID_MAP
const SECTION_UUID_MAP = {
    'starters': '5cfed564-4034-4016-ad79-d5b1f0b7ee44',
    'main-course': '71d8a89e-6b2d-4d91-bfe1-83d537a8c5c7',
    'side-dishes': '8b161257-d508-46d6-806a-25ce33898bef',
    'accompaniments': '366f31f3-8c31-4221-93d3-aa77f0bd37dc',
    'desserts-coffee': '2fc410da-c162-4134-8b37-8a290eb0e0b4',
    'drinks-wine': 'cc3e13e2-45ee-4f85-a333-c910f038efc6',
    'set-meals': '56bc46b0-5271-401d-8a02-d4970291ddb5',
};

// Section number to name mapping for receipt display
const SECTION_NAMES = {
    1: 'STARTERS',
    2: 'MAIN COURSE',
    3: 'SIDE DISHES',
    4: 'ACCOMPANIMENTS',
    5: 'DESSERTS & COFFEE',
    6: 'DRINKS & WINE',
    7: 'SET MEALS',
};

/**
 * ESC/POS Command Builder for Epson TM-T20III and compatible thermal printers
 *
 * This class generates raw ESC/POS byte sequences for professional receipt printing.
 * ESC/POS is the industry standard protocol for thermal receipt printers.
 *
 * Reference: Epson ESC/POS Command Reference (TM-T20III)
 */
class ESCPOSBuilder {
    constructor(paperWidth = 80) {
        this.buffer = [];
        this.paperWidth = paperWidth;
        // Characters per line depends on paper width and font
        // Font A: 80mm = 48 chars, 58mm = 32 chars
        // Font B: 80mm = 64 chars, 58mm = 42 chars
        this.charsPerLine = paperWidth === 80 ? 48 : 32;
    }

    /**
     * Initialize printer (ESC @)
     * Clears print buffer and resets modes to power-on defaults
     */
    init() {
        this.buffer.push(0x1B, 0x40); // ESC @
        return this;
    }

    /**
     * Set text alignment (ESC a n)
     * @param {string} alignment - 'left', 'center', or 'right'
     */
    align(alignment) {
        const alignMap = { left: 0, center: 1, right: 2 };
        this.buffer.push(0x1B, 0x61, alignMap[alignment] || 0); // ESC a n
        return this;
    }

    /**
     * Set character size (GS ! n)
     * @param {string} size - 'normal', 'double-width', 'double-height', or 'double'
     */
    textSize(size) {
        // GS ! n - where n = (width-1) << 4 | (height-1)
        // normal = 0x00, double-width = 0x10, double-height = 0x01, double = 0x11
        const sizeMap = {
            'normal': 0x00,
            'double-width': 0x10,
            'double-height': 0x01,
            'double': 0x11
        };
        this.buffer.push(0x1D, 0x21, sizeMap[size] || 0x00); // GS ! n
        return this;
    }

    /**
     * Set bold mode (ESC E n)
     * @param {boolean} on - true for bold, false for normal
     */
    bold(on) {
        this.buffer.push(0x1B, 0x45, on ? 1 : 0); // ESC E n
        return this;
    }

    /**
     * Set underline mode (ESC - n)
     * @param {number} mode - 0=off, 1=1-dot, 2=2-dot underline
     */
    underline(mode = 1) {
        this.buffer.push(0x1B, 0x2D, mode); // ESC - n
        return this;
    }

    /**
     * Print text and feed one line
     * @param {string} str - Text to print
     */
    text(str) {
        const bytes = Buffer.from(str, 'utf8');
        this.buffer.push(...bytes, 0x0A); // Text + LF
        return this;
    }

    /**
     * Print text without line feed
     * @param {string} str - Text to print
     */
    textInline(str) {
        const bytes = Buffer.from(str, 'utf8');
        this.buffer.push(...bytes);
        return this;
    }

    /**
     * Print a separator line
     * @param {string} char - Character to repeat (default '-')
     */
    separator(char = '-') {
        this.text(char.repeat(this.charsPerLine));
        return this;
    }

    /**
     * Print a section separator with centered label (e.g., "---- STARTERS ----")
     * Used for grouping menu items by category on receipts
     * @param {string} label - Section name to display (e.g., "STARTERS")
     * @param {string} char - Character to use for dashes (default '─')
     */
    sectionSeparator(label, char = '-') {
        const upperLabel = label.toUpperCase();
        // Calculate dash count for each side, leaving space for label and 2 spaces
        const totalDashWidth = this.charsPerLine - upperLabel.length - 2;
        const dashCount = Math.max(2, Math.floor(totalDashWidth / 2));
        const line = char.repeat(dashCount) + ' ' + upperLabel + ' ' + char.repeat(dashCount);
        // Trim or pad to exact width
        const formatted = line.length > this.charsPerLine
            ? line.substring(0, this.charsPerLine)
            : line;
        this.text(formatted);
        return this;
    }

    /**
     * Print two-column formatted line (e.g., item name and price)
     * @param {string} left - Left-aligned text
     * @param {string} right - Right-aligned text
     */
    twoColumn(left, right) {
        const maxLeft = this.charsPerLine - right.length - 1;
        const truncatedLeft = left.length > maxLeft ? left.substring(0, maxLeft) : left;
        const gap = this.charsPerLine - truncatedLeft.length - right.length;
        const spaces = gap > 0 ? ' '.repeat(gap) : ' ';
        this.text(truncatedLeft + spaces + right);
        return this;
    }

    /**
     * Print three-column formatted line (qty, name, price)
     * @param {string} col1 - First column (quantity)
     * @param {string} col2 - Second column (item name)
     * @param {string} col3 - Third column (price)
     */
    threeColumn(col1, col2, col3) {
        const col1Width = 4;  // e.g., "2x  "
        const col3Width = col3.length + 1;
        const col2Width = this.charsPerLine - col1Width - col3Width;

        const paddedCol1 = col1.padEnd(col1Width);
        const truncatedCol2 = col2.length > col2Width ? col2.substring(0, col2Width) : col2.padEnd(col2Width);

        this.text(paddedCol1 + truncatedCol2 + col3);
        return this;
    }

    /**
     * Feed n lines (ESC d n)
     * @param {number} lines - Number of lines to feed
     */
    feed(lines = 1) {
        this.buffer.push(0x1B, 0x64, lines); // ESC d n
        return this;
    }

    /**
     * Cut paper (GS V m)
     * @param {string} mode - 'full' or 'partial' (default)
     */
    cut(mode = 'partial') {
        // Feed paper first to ensure content clears the cutter
        this.feed(5);

        if (mode === 'full') {
            this.buffer.push(0x1D, 0x56, 0x00); // GS V 0 - Full cut
        } else {
            this.buffer.push(0x1D, 0x56, 0x42, 0x00); // GS V 66 0 - Partial cut
        }
        return this;
    }

    /**
     * Open cash drawer (ESC p m t1 t2)
     * Sends pulse to drawer kick connector
     */
    openDrawer() {
        // ESC p 0 25 250 - Pin 2, on-time 25*2ms=50ms, off-time 250*2ms=500ms
        this.buffer.push(0x1B, 0x70, 0x00, 0x19, 0xFA);
        return this;
    }

    /**
     * Print QR code (GS ( k)
     * @param {string} data - Data to encode
     * @param {number} size - Module size 1-16 (default 6)
     */
    qrCode(data, size = 6) {
        // GS ( k - QR Code commands
        // Function 165: Select QR Code model (Model 2)
        this.buffer.push(0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);

        // Function 167: Set module size
        this.buffer.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, size);

        // Function 169: Set error correction level (L = 48)
        this.buffer.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x30);

        // Function 180: Store QR Code data
        const dataBytes = Buffer.from(data, 'utf8');
        const len = dataBytes.length + 3;
        const pL = len & 0xFF;
        const pH = (len >> 8) & 0xFF;
        this.buffer.push(0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30, ...dataBytes);

        // Function 181: Print QR Code
        this.buffer.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30);

        return this;
    }

    /**
     * Print barcode (GS k)
     * @param {string} data - Barcode data
     * @param {string} type - Barcode type (default 'CODE39')
     */
    barcode(data, type = 'CODE39') {
        const typeMap = {
            'UPC-A': 0,
            'UPC-E': 1,
            'EAN13': 2,
            'EAN8': 3,
            'CODE39': 4,
            'ITF': 5,
            'CODABAR': 6,
            'CODE93': 72,
            'CODE128': 73
        };

        // Set barcode height (GS h n)
        this.buffer.push(0x1D, 0x68, 80); // 80 dots

        // Set barcode width (GS w n)
        this.buffer.push(0x1D, 0x77, 2); // Width 2

        // Set HRI position (GS H n) - Below barcode
        this.buffer.push(0x1D, 0x48, 2);

        // Print barcode (GS k m n d1...dn)
        const barcodeType = typeMap[type] || 4;
        const dataBytes = Buffer.from(data, 'utf8');

        if (barcodeType >= 65) {
            // New format for CODE93, CODE128
            this.buffer.push(0x1D, 0x6B, barcodeType, dataBytes.length, ...dataBytes);
        } else {
            // Old format
            this.buffer.push(0x1D, 0x6B, barcodeType, ...dataBytes, 0x00);
        }

        return this;
    }

    /**
     * Build and return the final buffer
     * @returns {Buffer} - Complete ESC/POS command buffer
     */
    build() {
        return Buffer.from(this.buffer);
    }

    /**
     * Get buffer length
     * @returns {number} - Current buffer length in bytes
     */
    get length() {
        return this.buffer.length;
    }
}

// =====================================================
// SMART ITEM GROUPING FOR THERMAL RECEIPTS
// Groups identical plain items while keeping customized items separate
// Mirror of ThermalPreview.tsx grouping logic for ESC/POS printing
// =====================================================

/**
 * Generate a unique key for grouping identical items
 * Items are identical if: same section + same name + same variant + same price
 * @param {Object} item - Receipt item
 * @param {number} sectionNumber - Section number for grouping boundary
 * @returns {string} Grouping key
 */
function generateItemGroupingKey(item, sectionNumber) {
    const variantPart = item.variantName || 'no-variant';
    const pricePart = (item.price || 0).toFixed(2);
    return `${sectionNumber}|${item.name}|${variantPart}|${pricePart}`;
}

/**
 * Check if an item can be grouped with others
 * Items with modifiers or special notes cannot be grouped
 * @param {Object} item - Receipt item
 * @returns {boolean} True if item can be grouped
 */
function isItemGroupable(item) {
    const hasModifiers = item.modifiers && item.modifiers.length > 0;
    const hasNotes = Boolean(item.notes);
    return !hasModifiers && !hasNotes;
}

/**
 * Group receipt items for smart display
 * Consolidates identical plain items while keeping customized items separate
 * @param {Array} items - Array of receipt items (must have sectionNumber)
 * @returns {Array} Grouped items with groupedQuantity, unitPrice, groupedTotal, isGrouped flags
 */
function groupReceiptItems(items) {
    const groupedMap = new Map();
    const ungroupedItems = [];

    for (const item of items) {
        const sectionNumber = item.sectionNumber || 999;
        const groupKey = generateItemGroupingKey(item, sectionNumber);

        // Calculate unit price
        const unitPrice = item.price || 0;

        if (isItemGroupable(item)) {
            // Try to group with existing identical items
            const existing = groupedMap.get(groupKey);

            if (existing) {
                // Add quantity to existing group
                existing.groupedQuantity += item.quantity || 1;
                existing.groupedTotal = existing.unitPrice * existing.groupedQuantity;
            } else {
                // Create new group entry
                groupedMap.set(groupKey, {
                    ...item,
                    groupedQuantity: item.quantity || 1,
                    unitPrice,
                    groupedTotal: unitPrice * (item.quantity || 1),
                    isGrouped: false, // Will be set to true if more items join
                    sectionNumber
                });
            }
        } else {
            // Customized item - cannot be grouped, always displays individually
            const itemTotal = unitPrice * (item.quantity || 1);
            ungroupedItems.push({
                ...item,
                groupedQuantity: item.quantity || 1,
                unitPrice,
                groupedTotal: itemTotal,
                isGrouped: false,
                sectionNumber
            });
        }
    }

    // Mark items that were actually grouped (quantity increased)
    for (const grouped of groupedMap.values()) {
        grouped.isGrouped = grouped.groupedQuantity > 1;
    }

    // Combine grouped and ungrouped items, sort by section
    const allItems = [...groupedMap.values(), ...ungroupedItems];
    allItems.sort((a, b) => (a.sectionNumber || 999) - (b.sectionNumber || 999));

    return allItems;
}

/**
 * Convert an image buffer to ESC/POS raster format for thermal printing
 * This enables true WYSIWYG printing where the printed output matches the screen preview
 *
 * Uses GS v 0 (Print raster bit image) command:
 * Format: 1D 76 30 m xL xH yL yH d1...dk
 * - m: mode (0=normal, 1=double-width, 2=double-height, 3=double-both)
 * - xL xH: width in bytes (number of horizontal bytes)
 * - yL yH: height in dots
 * - d: image data (1 bit per pixel, MSB first, 1=black, 0=white)
 *
 * @param {Buffer} imageBuffer - PNG/JPEG image data
 * @param {number} paperWidth - Paper width in mm (58 or 80)
 * @returns {Promise<Buffer>} - ESC/POS command buffer with raster image
 */
async function imageToRasterESCPOS(imageBuffer, paperWidth = 80) {
    // Target width based on paper size (203 DPI thermal head)
    // 80mm paper = ~576 dots, 58mm paper = ~384 dots
    const targetWidth = paperWidth === 80 ? 576 : 384;

    log.info(`[Raster] Processing image for ${paperWidth}mm paper (${targetWidth}px width)`);

    try {
        // Process image with sharp - optimized for thermal printing:
        // 1. Resize to fit paper width with high-quality kernel
        // 2. Increase contrast for better black/white separation
        // 3. Apply sharpening for crisper text edges
        // 4. Convert to grayscale
        // 5. Get raw pixel data
        const { data, info } = await sharp(imageBuffer)
            .resize(targetWidth, null, {
                fit: 'inside',
                withoutEnlargement: false,
                kernel: 'lanczos3' // High-quality downscaling for text
            })
            // Boost contrast: stretches histogram to use full 0-255 range
            .normalise()
            // Increase linear contrast (multiplier > 1 increases contrast)
            .linear(1.3, -30) // a=1.3 (contrast boost), b=-30 (slight darken)
            // Sharpen for crisper text (sigma=1 is gentle, good for text)
            .sharpen({ sigma: 1.0 })
            .grayscale()
            .raw()
            .toBuffer({ resolveWithObject: true });

        const width = info.width;
        const height = info.height;

        log.info(`[Raster] Image resized to ${width}x${height}`);

        // Calculate bytes per row (8 pixels per byte, rounded up)
        const bytesPerRow = Math.ceil(width / 8);

        // Build ESC/POS command buffer
        const buffer = [];

        // Initialize printer (ESC @)
        buffer.push(0x1B, 0x40);

        // Set line spacing to 0 for continuous image (ESC 3 n)
        buffer.push(0x1B, 0x33, 0x00);

        // GS v 0 - Print raster bit image
        // 1D 76 30 m xL xH yL yH d1...dk
        buffer.push(
            0x1D, 0x76, 0x30, 0x00, // GS v 0, mode 0 (normal density)
            bytesPerRow & 0xFF, (bytesPerRow >> 8) & 0xFF, // xL xH (width in bytes)
            height & 0xFF, (height >> 8) & 0xFF // yL yH (height in dots)
        );

        // Convert grayscale pixels to 1-bit monochrome
        // Use higher threshold (160) for thermal printing - captures more detail
        // Gray text and light elements need higher threshold to print as black
        // In ESC/POS raster: 1 = black (print), 0 = white (no print)
        const threshold = 160; // Increased from 128 for better text visibility
        for (let y = 0; y < height; y++) {
            for (let byteX = 0; byteX < bytesPerRow; byteX++) {
                let byte = 0;
                for (let bit = 0; bit < 8; bit++) {
                    const pixelX = byteX * 8 + bit;
                    if (pixelX < width) {
                        const pixelIndex = y * width + pixelX;
                        const grayValue = data[pixelIndex];
                        // Threshold: if pixel is darker than threshold, set bit to 1 (print)
                        if (grayValue < threshold) {
                            byte |= (0x80 >> bit); // MSB first
                        }
                    }
                }
                buffer.push(byte);
            }
        }

        // Reset line spacing (ESC 2)
        buffer.push(0x1B, 0x32);

        // Feed paper (ESC d n)
        buffer.push(0x1B, 0x64, 0x03);

        // Partial cut (GS V 66 0)
        buffer.push(0x1D, 0x56, 0x42, 0x00);

        log.info(`[Raster] Generated ${buffer.length} bytes of ESC/POS data`);

        return Buffer.from(buffer);
    } catch (error) {
        log.error('[Raster] Image processing error:', error);
        throw error;
    }
}

// Load environment variables from .env file in development
// Use process.defaultApp to check if running in dev mode (synchronously available)
const isDevelopment = process.defaultApp || /[\\/]electron[\\/]/.test(process.execPath);
if (isDevelopment) {
    try {
        const envPath = path.join(__dirname, '.env.development');
        const envContent = require('fs').readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                if (key && valueParts.length > 0) {
                    process.env[key.trim()] = valueParts.join('=').trim();
                }
            }
        });
        log.info('Loaded environment from .env.development');
    } catch (e) {
        log.warn('Could not load .env.development:', e.message);
    }
}

// Initialize Stripe with secret key from environment
let stripe = null;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY;
if (STRIPE_SECRET_KEY) {
    // Log key format for debugging (safely - only prefix and length)
    const keyPrefix = STRIPE_SECRET_KEY.substring(0, 12);
    const keyLength = STRIPE_SECRET_KEY.length;
    log.info(`Stripe key detected: ${keyPrefix}... (${keyLength} chars)`);

    // Typical Stripe test secret keys are 100+ chars
    if (keyLength < 80) {
        log.warn(`Stripe key appears truncated! Expected 100+ chars, got ${keyLength}. Please check if the full key was copied.`);
    }

    const Stripe = require('stripe');
    stripe = new Stripe(STRIPE_SECRET_KEY);
    log.info('Stripe initialized successfully');
} else {
    log.warn('Stripe secret key not configured - payment processing will be unavailable');
}

// Configure logging
log.transports.file.level = 'info';

class CottageTandooriPOS {
    constructor() {
        this.mainWindow = null;
        this.splashWindow = null;
        this.splashStartTime = null;
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
                this.mainWindow.show();
                this.mainWindow.focus();
            } else {
                this.createSplashScreen();
                this.createMainWindow();
            }
        });

        app.whenReady().then(() => {
            this.createSplashScreen();
            this.sendSplashProgress(20, 'Loading application...');
            this.createMainWindow();
            this.sendSplashProgress(40, 'Setting up printing...');
            this.setupPrinting();
            this.setupStripePayments();
            this.setupLocalCache();
            this.sendSplashProgress(60, 'Configuring services...');
            this.setupCrashRecovery();
            this.setupReceiptHistory();
            this.setupPrinterStatusMonitor();
            this.setupPrinterRoleConfig();
            this.setupWindowTitle();
            this.sendSplashProgress(80, 'Preparing workspace...');
            this.setupNativeNotifications();
            this.setupWorkspaceManager();
            this.setupSystemTray();
            this.setupGlobalShortcuts();
            this.setupAutoUpdater();

            // Sleep/Wake: notify renderer when system resumes from sleep
            powerMonitor.on('resume', () => {
                log.info('[main] System resumed from sleep — notifying renderer');
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    this.mainWindow.webContents.send('system-resumed');
                }
            });

            powerMonitor.on('suspend', () => {
                log.info('[main] System going to sleep');
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    this.mainWindow.webContents.send('system-suspended');
                }
            });
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

    createSplashScreen() {
        this.splashStartTime = Date.now();
        const { size } = require('electron').screen.getPrimaryDisplay();
        this.splashWindow = new BrowserWindow({
            width: size.width,
            height: size.height,
            x: 0,
            y: 0,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            resizable: false,
            skipTaskbar: true,
            simpleFullscreen: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            }
        });
        this.splashWindow.setSimpleFullScreen(true);
        this.splashWindow.loadFile(path.join(__dirname, 'splash.html'));

        // Inject version number once splash content loads
        this.splashWindow.webContents.once('did-finish-load', () => {
            const version = require('./package.json').version;
            this.sendSplashProgress(0, 'Initialising...');
            this.splashWindow?.webContents.executeJavaScript(
                `setVersion(${JSON.stringify(version)})`
            ).catch(() => {});
        });
        log.info('Splash screen displayed');
    }

    /** Send progress update to splash screen */
    sendSplashProgress(percent, label) {
        if (this.splashWindow && !this.splashWindow.isDestroyed()) {
            this.splashWindow.webContents.executeJavaScript(
                `updateProgress(${percent}, ${JSON.stringify(label)})`
            ).catch(() => {});
        }
    }

    createMainWindow() {
        const windowConfig = {
            width: 1200,
            height: 800,
            minWidth: 1000,
            minHeight: 600,
            backgroundColor: '#000000',
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js'),
                webSecurity: true
            },
            title: 'Cottage Tandoori',
            show: false,
            icon: path.join(__dirname, 'assets', 'icon.png'),
            autoHideMenuBar: false,
            titleBarStyle: 'default'
        };

        this.mainWindow = new BrowserWindow(windowConfig);

        // Create application menu
        this.createApplicationMenu();

        // Load frontend - dev server or bundled
        const isDev = process.env.NODE_ENV === 'development';

        if (isDev) {
            // Development: Load from Vite dev server for hot reload
            // Uses port 5174 to avoid conflict with frontend dev server (5173)
            log.info('Loading POS from: http://localhost:5174 (development mode)');
            this.mainWindow.loadURL('http://localhost:5174');
            this.mainWindow.webContents.openDevTools();
        } else {
            // Production: Load local bundled frontend
            // Use loadFile() instead of loadURL() for cross-platform compatibility
            // Windows requires proper file:// URL formatting that loadFile() handles automatically
            const indexPath = path.join(__dirname, 'dist', 'index.html');
            log.info(`Loading POS from: ${indexPath} (production mode)`);
            this.mainWindow.loadFile(indexPath);
        }

        // Add error handlers for debugging page load issues
        this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
            log.error(`Page load failed: ${errorDescription} (code: ${errorCode}) - URL: ${validatedURL}`);
        });

        this.mainWindow.webContents.on('crashed', (event, killed) => {
            log.error(`Renderer process crashed (killed: ${killed})`);
        });

        this.mainWindow.webContents.on('render-process-gone', (event, details) => {
            log.error(`Renderer process gone: ${details.reason}`);
        });

        this.mainWindow.once('ready-to-show', () => {
            // Ensure splash shows for at least 2.5s so the animation is visible
            const splashMinTime = 2500;
            const elapsed = Date.now() - (this.splashStartTime || 0);
            const remainingDelay = Math.max(0, splashMinTime - elapsed);

            setTimeout(() => {
                // Dismiss splash with choreographed exit sequence
                if (this.splashWindow && !this.splashWindow.isDestroyed()) {
                    this.splashWindow.webContents.executeJavaScript(
                        "startExit()"
                    ).catch(() => {});
                    // Allow exit animations to play (200ms beat + 500ms animations + 400ms fade = ~1100ms)
                    // Show main window partway through so it's ready behind the fading splash
                    setTimeout(() => {
                        this.mainWindow.maximize();
                        this.mainWindow.show();
                        this.mainWindow.focus();
                        log.info('POS window loaded successfully');
                    }, 600);
                    setTimeout(() => {
                        if (this.splashWindow && !this.splashWindow.isDestroyed()) {
                            this.splashWindow.destroy();
                            this.splashWindow = null;
                        }
                    }, 1200);
                } else {
                    this.mainWindow.maximize();
                    this.mainWindow.show();
                    this.mainWindow.focus();
                    log.info('POS window loaded successfully');
                }
            }, remainingDelay);
        });

        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });

        // Handle window.open calls - KDS opens in new Electron window, external links in system browser
        this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            if (!url || url === '' || url === 'about:blank') {
                console.log('[main] Skipping empty/blank window.open URL');
                return { action: 'deny' };
            }
            // Open KDS in a dedicated Electron window
            if (url.includes('/kds-v2')) {
                this.openKDSWindow(url);
                return { action: 'deny' };
            }
            if (url.startsWith('http://') || url.startsWith('https://')) {
                require('electron').shell.openExternal(url);
            } else {
                console.log('[main] Skipping non-http window.open URL:', url);
            }
            return { action: 'deny' };
        });
    }

    openKDSWindow(url) {
        // Reuse existing KDS window if already open
        if (this.kdsWindow && !this.kdsWindow.isDestroyed()) {
            this.kdsWindow.focus();
            return;
        }

        const boundsPath = path.join(app.getPath('userData'), 'kds-window-bounds.json');
        let savedBounds = null;

        try {
            const data = require('fs').readFileSync(boundsPath, 'utf-8');
            savedBounds = JSON.parse(data);
        } catch (e) {
            // No saved bounds yet
        }

        // Check if saved bounds are on a currently available display
        let useSavedBounds = false;
        if (savedBounds && savedBounds.x !== undefined && savedBounds.y !== undefined) {
            const matchingDisplay = screen.getDisplayMatching(savedBounds);
            if (matchingDisplay) {
                useSavedBounds = true;
            }
        }

        const windowOptions = {
            width: useSavedBounds ? savedBounds.width : 1920,
            height: useSavedBounds ? savedBounds.height : 1080,
            ...(useSavedBounds ? { x: savedBounds.x, y: savedBounds.y } : {}),
            backgroundColor: '#000000',
            title: 'Kitchen Display',
            icon: path.join(__dirname, 'assets', 'icon.png'),
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js'),
                webSecurity: true
            }
        };

        this.kdsWindow = new BrowserWindow(windowOptions);
        this.kdsWindow.loadURL(url);

        if (!useSavedBounds) {
            this.kdsWindow.maximize();
        }

        log.info('KDS window opened' + (useSavedBounds ? ' (restored position)' : ''));

        // Save bounds on move/resize (debounced)
        let saveBoundsTimeout = null;
        const saveBounds = () => {
            if (saveBoundsTimeout) clearTimeout(saveBoundsTimeout);
            saveBoundsTimeout = setTimeout(() => {
                if (this.kdsWindow && !this.kdsWindow.isDestroyed() && !this.kdsWindow.isMinimized()) {
                    const bounds = this.kdsWindow.getBounds();
                    fs.writeFile(boundsPath, JSON.stringify(bounds)).catch(() => {});
                }
            }, 500);
        };

        this.kdsWindow.on('move', saveBounds);
        this.kdsWindow.on('resize', saveBounds);

        this.kdsWindow.on('closed', () => {
            this.kdsWindow = null;
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
                            if (autoUpdater) {
                                autoUpdater.checkForUpdatesAndNotify();
                            } else {
                                log.info('Auto-updater not available in development mode');
                            }
                        }
                    },
                    {
                        label: 'About',
                        click: () => {
                            dialog.showMessageBox(this.mainWindow, {
                                type: 'info',
                                title: 'About QuickServe AI',
                                message: 'QuickServe AI POS v1.0.0',
                                detail: `Professional Restaurant Point of Sale System

Built with Electron
Powered by QuickServe AI`
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

        // Lazily load electron-updater after app is ready
        autoUpdater = require('electron-updater').autoUpdater;
        autoUpdater.logger = log;

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

        // WYSIWYG thermal printing - prints exact HTML from ThermalPreview component
        ipcMain.handle('print-receipt-wysiwyg', async (event, data) => {
            try {
                log.info('Received WYSIWYG print request, paperWidth:', data.paperWidth);
                return await this.printReceiptWYSIWYG(data);
            } catch (error) {
                log.error('WYSIWYG print error:', error);
                return { success: false, error: error.message };
            }
        });

        // ESC/POS thermal printing - raw commands for reliable thermal printing
        ipcMain.handle('print-receipt-escpos', async (event, data) => {
            try {
                log.info('Received ESC/POS print request, type:', data.type);
                return await this.printReceiptESCPOS(data);
            } catch (error) {
                log.error('ESC/POS print error:', error);
                return { success: false, error: error.message };
            }
        });

        // Raster image printing - true WYSIWYG thermal printing
        // Converts HTML screenshot to ESC/POS raster image
        ipcMain.handle('print-receipt-raster', async (event, data) => {
            try {
                log.info('Received raster print request, paperWidth:', data.paperWidth);
                return await this.printReceiptRaster(data);
            } catch (error) {
                log.error('Raster print error:', error);
                return { success: false, error: error.message };
            }
        });
    }

    setupStripePayments() {
        // Create Payment Intent handler
        ipcMain.handle('stripe-create-payment-intent', async (event, data) => {
            if (!stripe) {
                log.error('Stripe not initialized - secret key missing or invalid');
                const keyLength = STRIPE_SECRET_KEY ? STRIPE_SECRET_KEY.length : 0;
                let errorMsg = 'Stripe not configured. Add STRIPE_SECRET_KEY to .env.development';
                if (keyLength > 0 && keyLength < 80) {
                    errorMsg = `Stripe secret key appears truncated (${keyLength} chars). Full keys are 100+ chars. Please copy the complete key from Stripe Dashboard.`;
                }
                return {
                    success: false,
                    error: errorMsg
                };
            }

            try {
                log.info('Creating Stripe payment intent:', {
                    amount: data.amount,
                    currency: data.currency,
                    order_id: data.order_id,
                    pos_mode: data.pos_mode
                });

                // Build payment intent params
                const paymentIntentParams = {
                    amount: data.amount, // Amount in pence/cents
                    currency: data.currency || 'gbp',
                    metadata: {
                        order_id: data.order_id,
                        order_type: data.order_type,
                        customer_name: data.customer_name || 'POS Customer'
                    },
                    description: data.description || `POS Order - ${data.order_type}`,
                };

                // POS mode: Restrict to card-only payments (no Klarna, Revolut, Link, etc.)
                // This is critical for in-person POS payments where staff need simple card entry
                if (data.pos_mode) {
                    paymentIntentParams.payment_method_types = ['card'];
                    log.info('POS mode: Restricting to card-only payments');
                } else {
                    paymentIntentParams.automatic_payment_methods = { enabled: true };
                }

                const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

                log.info('Payment intent created:', paymentIntent.id);

                return {
                    success: true,
                    client_secret: paymentIntent.client_secret,
                    payment_intent_id: paymentIntent.id
                };
            } catch (error) {
                log.error('Failed to create payment intent:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        // Confirm Payment handler (for post-payment verification)
        ipcMain.handle('stripe-confirm-payment', async (event, data) => {
            if (!stripe) {
                return { success: false, error: 'Stripe not configured' };
            }

            try {
                const paymentIntent = await stripe.paymentIntents.retrieve(data.payment_intent_id);

                log.info('Payment intent status:', paymentIntent.status);

                return {
                    success: paymentIntent.status === 'succeeded',
                    status: paymentIntent.status,
                    payment_intent_id: paymentIntent.id
                };
            } catch (error) {
                log.error('Failed to confirm payment:', error);
                return { success: false, error: error.message };
            }
        });

        log.info('Stripe payment handlers registered');
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
            if (process.platform === 'darwin') {
                // macOS: Use lpstat to list printers
                const { stdout } = await execAsync('lpstat -p 2>/dev/null || echo ""');
                const printers = [];

                if (stdout.trim()) {
                    const lines = stdout.trim().split('\n');
                    for (const line of lines) {
                        // Parse: "printer EPSON_TM_T20III is idle..."
                        const match = line.match(/^printer\s+(\S+)\s+(.*)$/);
                        if (match) {
                            const name = match[1].replace(/_/g, ' '); // Replace underscores with spaces
                            const status = match[2];
                            printers.push({
                                name: match[1], // Keep original name for printing
                                displayName: name,
                                status: status.includes('idle') ? 'idle' : status,
                                available: !status.includes('disabled')
                            });
                        }
                    }
                }

                // Also get default printer
                try {
                    const { stdout: defaultOut } = await execAsync('lpstat -d 2>/dev/null || echo ""');
                    const defaultMatch = defaultOut.match(/system default destination:\s*(\S+)/);
                    if (defaultMatch) {
                        const defaultPrinter = printers.find(p => p.name === defaultMatch[1]);
                        if (defaultPrinter) {
                            defaultPrinter.isDefault = true;
                        }
                    }
                } catch (e) {
                    // Ignore error getting default
                }

                log.info('Discovered macOS printers:', printers.map(p => p.name));
                return printers;
            } else {
                // Windows: Use PowerShell
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
            }
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

    // =========================================================================
    // LOCAL DATA CACHE — File-system cache for instant cold starts
    // =========================================================================

    setupLocalCache() {
        this.cacheDirPath = path.join(app.getPath('userData'), 'pos-cache');

        // Ensure cache directory exists
        require('fs').mkdirSync(this.cacheDirPath, { recursive: true });

        // IPC: Write cache entry
        ipcMain.handle('cache-set', async (event, key, data) => {
            try {
                const filePath = path.join(this.cacheDirPath, `${key}.json`);
                await fs.writeFile(filePath, JSON.stringify(data), 'utf-8');
                return { success: true };
            } catch (error) {
                log.error(`[Cache] Failed to write ${key}:`, error.message);
                return { success: false, error: error.message };
            }
        });

        // IPC: Read cache entry
        ipcMain.handle('cache-get', async (event, key) => {
            try {
                const filePath = path.join(this.cacheDirPath, `${key}.json`);
                const raw = await fs.readFile(filePath, 'utf-8');
                return { success: true, data: JSON.parse(raw) };
            } catch (error) {
                // File not found is expected on first run
                if (error.code !== 'ENOENT') {
                    log.warn(`[Cache] Failed to read ${key}:`, error.message);
                }
                return { success: false, data: null };
            }
        });

        // IPC: Clear a specific cache entry
        ipcMain.handle('cache-clear', async (event, key) => {
            try {
                if (key) {
                    const filePath = path.join(this.cacheDirPath, `${key}.json`);
                    await fs.unlink(filePath).catch(() => {});
                } else {
                    // Clear all cache files
                    const files = await fs.readdir(this.cacheDirPath);
                    await Promise.all(
                        files.filter(f => f.endsWith('.json')).map(f =>
                            fs.unlink(path.join(this.cacheDirPath, f)).catch(() => {})
                        )
                    );
                }
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        log.info('[Cache] Local file cache initialized at:', this.cacheDirPath);
    }

    // =========================================================================
    // CRASH RECOVERY — Persist POS state so we can recover after crash/force-quit
    // =========================================================================

    setupCrashRecovery() {
        // State file path: <userData>/pos-crash-state.json
        this.crashStatePath = path.join(app.getPath('userData'), 'pos-crash-state.json');
        this.didCrashLastRun = false;

        // Check if we crashed last time (presence of non-empty state file = unclean exit)
        try {
            const raw = require('fs').readFileSync(this.crashStatePath, 'utf-8');
            const state = JSON.parse(raw);
            if (state && state.timestamp) {
                // State file exists and has data → previous run didn't exit cleanly
                this.didCrashLastRun = true;
                log.warn('[CrashRecovery] Detected unclean shutdown — state file found');
            }
        } catch {
            // No file or invalid JSON → clean previous exit
            this.didCrashLastRun = false;
        }

        // IPC: Save crash state (called periodically by renderer)
        ipcMain.handle('save-crash-state', async (event, state) => {
            try {
                const stateWithMeta = {
                    ...state,
                    timestamp: Date.now(),
                    version: app.getVersion()
                };
                await fs.writeFile(this.crashStatePath, JSON.stringify(stateWithMeta), 'utf-8');
                return { success: true };
            } catch (error) {
                log.error('[CrashRecovery] Failed to save state:', error.message);
                return { success: false, error: error.message };
            }
        });

        // IPC: Get crash state (called on startup by renderer)
        ipcMain.handle('get-crash-state', async () => {
            try {
                if (!this.didCrashLastRun) {
                    return { hasCrashState: false };
                }
                const raw = await fs.readFile(this.crashStatePath, 'utf-8');
                const state = JSON.parse(raw);
                return { hasCrashState: true, state };
            } catch {
                return { hasCrashState: false };
            }
        });

        // IPC: Clear crash state (called after recovery or dismissal)
        ipcMain.handle('clear-crash-state', async () => {
            try {
                await fs.unlink(this.crashStatePath).catch(() => {});
                this.didCrashLastRun = false;
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        // Clear state on clean exit
        app.on('before-quit', () => {
            log.info('[CrashRecovery] Clean quit — removing crash state');
            try {
                require('fs').unlinkSync(this.crashStatePath);
            } catch {
                // File may not exist
            }
        });

        // Catch uncaught exceptions in main process
        process.on('uncaughtException', (error) => {
            log.error('[CrashRecovery] Uncaught exception:', error);
            // Don't delete crash state — renderer already saved it
        });

        log.info(`[CrashRecovery] Initialized. Previous crash detected: ${this.didCrashLastRun}`);
    }

    // =========================================================================
    // RECEIPT HISTORY — Store last 50 receipts for reprint functionality
    // =========================================================================

    setupReceiptHistory() {
        this.receiptHistoryPath = path.join(app.getPath('userData'), 'pos-cache', 'receipt-history.json');

        // IPC: Save a receipt to history
        ipcMain.handle('save-receipt-history', async (event, receipt) => {
            try {
                let history = [];
                try {
                    const raw = await fs.readFile(this.receiptHistoryPath, 'utf-8');
                    history = JSON.parse(raw);
                } catch {
                    // No existing history file
                }

                // Add new receipt at the front
                history.unshift({
                    ...receipt,
                    savedAt: Date.now()
                });

                // Keep only last 50
                if (history.length > 50) {
                    history = history.slice(0, 50);
                }

                await fs.writeFile(this.receiptHistoryPath, JSON.stringify(history), 'utf-8');
                return { success: true };
            } catch (error) {
                log.error('[ReceiptHistory] Failed to save:', error.message);
                return { success: false, error: error.message };
            }
        });

        // IPC: Get receipt history
        ipcMain.handle('get-receipt-history', async () => {
            try {
                const raw = await fs.readFile(this.receiptHistoryPath, 'utf-8');
                return { success: true, history: JSON.parse(raw) };
            } catch (error) {
                if (error.code === 'ENOENT') {
                    return { success: true, history: [] };
                }
                log.error('[ReceiptHistory] Failed to load:', error.message);
                return { success: false, history: [] };
            }
        });

        log.info('[ReceiptHistory] Initialized at:', this.receiptHistoryPath);
    }

    // =========================================================================
    // PRINTER STATUS MONITOR — Poll printer availability every 30s
    // =========================================================================

    setupPrinterStatusMonitor() {
        this.printerStatusInterval = null;
        this.lastPrinterStatus = {};

        const pollPrinterStatus = async () => {
            try {
                const printers = await this.discoverPrinters();
                const status = {
                    timestamp: Date.now(),
                    printers: printers.map(p => ({
                        name: p.name,
                        displayName: p.displayName || p.name,
                        available: p.available !== false,
                        status: p.status || 'unknown',
                        isDefault: p.isDefault || false
                    })),
                    defaultPrinter: this.defaultPrinter || null,
                    hasThermalPrinter: printers.some(p => {
                        const n = (p.name || '').toLowerCase();
                        return n.includes('epson') || n.includes('thermal') || n.includes('tm-t');
                    })
                };

                // Check if status changed (printer connected/disconnected)
                const prevNames = Object.keys(this.lastPrinterStatus).sort().join(',');
                const currNames = status.printers.map(p => p.name).sort().join(',');
                const statusChanged = prevNames !== currNames;

                this.lastPrinterStatus = {};
                status.printers.forEach(p => { this.lastPrinterStatus[p.name] = p; });

                // Send to renderer
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    this.mainWindow.webContents.send('printer-status-update', status);
                }

                // Log if changed
                if (statusChanged) {
                    log.info('[PrinterMonitor] Status changed:', status.printers.map(p => `${p.name}(${p.available ? 'ok' : 'offline'})`).join(', '));
                }
            } catch (error) {
                log.error('[PrinterMonitor] Poll error:', error.message);
            }
        };

        // Poll every 30 seconds
        this.printerStatusInterval = setInterval(pollPrinterStatus, 30000);
        // Initial poll after 3 seconds (let app finish starting)
        setTimeout(pollPrinterStatus, 3000);

        // IPC: Get printer status on demand
        ipcMain.handle('get-printer-status', async () => {
            try {
                const printers = await this.discoverPrinters();
                return {
                    success: true,
                    printers: printers.map(p => ({
                        name: p.name,
                        displayName: p.displayName || p.name,
                        available: p.available !== false,
                        status: p.status || 'unknown',
                        isDefault: p.isDefault || false
                    })),
                    defaultPrinter: this.defaultPrinter || null,
                    hasThermalPrinter: printers.some(p => {
                        const n = (p.name || '').toLowerCase();
                        return n.includes('epson') || n.includes('thermal') || n.includes('tm-t');
                    })
                };
            } catch (error) {
                return { success: false, printers: [], defaultPrinter: null, hasThermalPrinter: false };
            }
        });

        log.info('[PrinterMonitor] Status monitoring started (30s interval)');
    }

    // =========================================================================
    // PRINTER ROLE CONFIG — Assign printers to roles (kitchen, customer, bar)
    // =========================================================================

    setupPrinterRoleConfig() {
        this.printerConfigPath = path.join(app.getPath('userData'), 'printer-config.json');

        // Load saved config
        try {
            const raw = require('fs').readFileSync(this.printerConfigPath, 'utf-8');
            this.printerRoles = JSON.parse(raw);
            log.info('[PrinterRoles] Loaded config:', this.printerRoles);
        } catch {
            // Default: all roles use the default printer
            this.printerRoles = {
                kitchen: null,   // null = use defaultPrinter
                customer: null,
                bar: null
            };
        }

        // IPC: Get printer role config
        ipcMain.handle('get-printer-roles', async () => {
            return {
                success: true,
                roles: this.printerRoles,
                defaultPrinter: this.defaultPrinter || null
            };
        });

        // IPC: Save printer role config
        ipcMain.handle('save-printer-roles', async (event, roles) => {
            try {
                this.printerRoles = { ...this.printerRoles, ...roles };
                await fs.writeFile(this.printerConfigPath, JSON.stringify(this.printerRoles, null, 2), 'utf-8');
                log.info('[PrinterRoles] Saved config:', this.printerRoles);
                return { success: true };
            } catch (error) {
                log.error('[PrinterRoles] Failed to save:', error.message);
                return { success: false, error: error.message };
            }
        });

        // IPC: Test print on a specific printer
        ipcMain.handle('test-print-role', async (event, role) => {
            try {
                const printerName = this.printerRoles[role] || this.defaultPrinter;
                if (!printerName) {
                    return { success: false, error: 'No printer assigned to this role' };
                }

                // Build a simple test receipt
                const builder = new ESCPOSBuilder(80);
                builder.initialize()
                    .centerAlign()
                    .bold(true)
                    .text('=== TEST PRINT ===')
                    .bold(false)
                    .newline()
                    .text(`Role: ${role.toUpperCase()}`)
                    .text(`Printer: ${printerName}`)
                    .text(`Time: ${new Date().toLocaleString()}`)
                    .newline()
                    .text('If you see this, the printer')
                    .text('is working correctly.')
                    .newline()
                    .centerAlign()
                    .text('--- END TEST ---')
                    .feedAndCut();

                const buffer = builder.getBuffer();

                if (process.platform === 'darwin') {
                    const tempFile = path.join(os.tmpdir(), `test-print-${Date.now()}.bin`);
                    await fs.writeFile(tempFile, Buffer.from(buffer));
                    await execAsync(`lp -d "${printerName}" -o raw "${tempFile}"`);
                    await fs.unlink(tempFile).catch(() => {});
                } else if (process.platform === 'win32') {
                    const tempFile = path.join(os.tmpdir(), `test-print-${Date.now()}.bin`);
                    await fs.writeFile(tempFile, Buffer.from(buffer));
                    await execAsync(`powershell -Command "Get-Printer -Name '${printerName}' | Out-Null; Copy-Item '${tempFile}' -Destination '\\\\localhost\\${printerName}'" 2>$null`).catch(async () => {
                        // Fallback: try using lpr
                        await execAsync(`lpr -P "${printerName}" "${tempFile}"`);
                    });
                    await fs.unlink(tempFile).catch(() => {});
                }

                return { success: true, printer: printerName };
            } catch (error) {
                log.error(`[PrinterRoles] Test print failed for ${role}:`, error.message);
                return { success: false, error: error.message };
            }
        });

        log.info('[PrinterRoles] Config initialized');
    }

    setupWindowTitle() {
        // IPC: Set window title dynamically from renderer (restaurant settings)
        ipcMain.handle('set-window-title', async (event, title) => {
            try {
                if (this.mainWindow && typeof title === 'string' && title.trim()) {
                    this.mainWindow.setTitle(title.trim());
                    log.info(`[WindowTitle] Updated to: "${title.trim()}"`);
                    return { success: true };
                }
                return { success: false, error: 'Invalid title or no window' };
            } catch (error) {
                log.error('[WindowTitle] Failed to set:', error.message);
                return { success: false, error: error.message };
            }
        });
    }

    // =========================================================================
    // NATIVE NOTIFICATIONS
    // =========================================================================

    setupNativeNotifications() {
        const { Notification } = require('electron');

        ipcMain.handle('show-native-notification', async (event, data) => {
            try {
                const { title, body, urgency, actionId } = data;

                if (!Notification.isSupported()) {
                    log.warn('[Notification] Notifications not supported on this platform');
                    return { success: false, error: 'Notifications not supported' };
                }

                const notification = new Notification({
                    title: title || 'Quick Serve AI',
                    body: body || '',
                    urgency: urgency || 'normal', // 'low' | 'normal' | 'critical'
                    silent: false,
                    icon: path.join(__dirname, 'assets', 'icon.png'),
                });

                notification.on('click', () => {
                    // Focus the main window when notification is clicked
                    if (this.mainWindow) {
                        if (this.mainWindow.isMinimized()) this.mainWindow.restore();
                        this.mainWindow.show();
                        this.mainWindow.focus();
                    }
                    // Send action back to renderer so it can navigate/respond
                    if (this.mainWindow && actionId) {
                        this.mainWindow.webContents.send('notification-clicked', { actionId });
                    }
                });

                notification.show();
                log.info(`[Notification] Shown: "${title}" (urgency: ${urgency || 'normal'})`);
                return { success: true };
            } catch (error) {
                log.error('[Notification] Failed:', error.message);
                return { success: false, error: error.message };
            }
        });

        log.info('[Notifications] Native notification handler registered');
    }

    // =========================================================================
    // WORKSPACE MANAGER (Multi-Monitor)
    // =========================================================================

    setupWorkspaceManager() {
        const workspaceFile = path.join(app.getPath('userData'), 'workspace-layout.json');

        // Get all connected displays
        ipcMain.handle('get-displays', async () => {
            try {
                const displays = screen.getAllDisplays();
                const primaryDisplay = screen.getPrimaryDisplay();
                return {
                    success: true,
                    displays: displays.map(d => ({
                        id: d.id,
                        label: d.label || `Display ${d.id}`,
                        bounds: d.bounds,
                        workArea: d.workArea,
                        isPrimary: d.id === primaryDisplay.id,
                        scaleFactor: d.scaleFactor,
                    })),
                };
            } catch (error) {
                log.error('[Workspace] Failed to get displays:', error.message);
                return { success: false, error: error.message };
            }
        });

        // Save workspace layout
        ipcMain.handle('save-workspace-layout', async (event, layout) => {
            try {
                await fs.writeFile(workspaceFile, JSON.stringify(layout, null, 2), 'utf8');
                log.info('[Workspace] Layout saved:', JSON.stringify(layout));
                return { success: true };
            } catch (error) {
                log.error('[Workspace] Failed to save layout:', error.message);
                return { success: false, error: error.message };
            }
        });

        // Load saved workspace layout
        ipcMain.handle('get-workspace-layout', async () => {
            try {
                const data = await fs.readFile(workspaceFile, 'utf8');
                return { success: true, layout: JSON.parse(data) };
            } catch {
                return { success: true, layout: null }; // No saved layout is fine
            }
        });

        // Apply a workspace layout — position windows on the specified monitors
        ipcMain.handle('apply-workspace-layout', async (event, layout) => {
            try {
                const displays = screen.getAllDisplays();

                // Position main POS window
                if (layout.pos && this.mainWindow && !this.mainWindow.isDestroyed()) {
                    const display = displays.find(d => d.id === layout.pos.displayId);
                    if (display) {
                        const { x, y, width, height } = display.workArea;
                        this.mainWindow.setBounds({ x, y, width, height });
                        log.info(`[Workspace] POS → Display ${display.id}`);
                    }
                }

                // Open/position KDS window
                if (layout.kds) {
                    const display = displays.find(d => d.id === layout.kds.displayId);
                    if (display) {
                        const { x, y, width, height } = display.workArea;
                        // KDS will be positioned when opened
                        // Store the target bounds for the KDS window
                        this.kdsTargetBounds = { x, y, width, height };
                        log.info(`[Workspace] KDS target → Display ${display.id}`);
                    }
                }

                // Open/position customer display
                if (layout.customerDisplay) {
                    const display = displays.find(d => d.id === layout.customerDisplay.displayId);
                    if (display) {
                        this.customerDisplayTargetBounds = display.workArea;
                        log.info(`[Workspace] Customer Display target → Display ${display.id}`);
                    }
                }

                // Save the layout for next startup
                await fs.writeFile(workspaceFile, JSON.stringify(layout, null, 2), 'utf8');

                return { success: true };
            } catch (error) {
                log.error('[Workspace] Failed to apply layout:', error.message);
                return { success: false, error: error.message };
            }
        });

        // Listen for display changes
        screen.on('display-added', () => {
            log.info('[Workspace] Display added');
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send('displays-changed');
            }
        });

        screen.on('display-removed', () => {
            log.info('[Workspace] Display removed');
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send('displays-changed');
            }
        });

        log.info('[Workspace] Manager initialized');
    }

    /**
     * Get the printer name for a given role, falling back to defaultPrinter.
     */
    getPrinterForRole(role) {
        if (this.printerRoles && this.printerRoles[role]) {
            return this.printerRoles[role];
        }
        return this.defaultPrinter;
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
                    if (autoUpdater) {
                        autoUpdater.checkForUpdatesAndNotify();
                    } else {
                        log.info('Auto-updater not available in development mode');
                    }
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
            } else {
                this.createSplashScreen();
                this.createMainWindow();
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

    /**
     * WYSIWYG thermal printing - prints the exact HTML from ThermalPreview component
     * This ensures what staff see on screen is exactly what prints
     *
     * @param {Object} data - Print data
     * @param {string} data.html - The innerHTML from ThermalPreview component
     * @param {number} data.paperWidth - Paper width in mm (58 or 80)
     * @param {string} [data.printerName] - Optional specific printer name
     * @returns {Promise<{success: boolean, printer?: string, timestamp?: string, error?: string}>}
     */
    async printReceiptWYSIWYG(data) {
        const { html, paperWidth = 80, printerName } = data;

        if (!html) {
            throw new Error('No HTML content provided for printing');
        }

        const printer = printerName || this.defaultPrinter;
        if (!printer) {
            throw new Error('No printer available. Please check printer connection.');
        }

        // Calculate dimensions for thermal paper
        // Electron pageSize uses MICRONS (1mm = 1000 microns)
        // Minimum required by Electron is 352 microns
        // 80mm = 80000 microns, 58mm = 58000 microns
        const paperWidthMicrons = paperWidth * 1000;
        const paperHeightMicrons = 297000; // ~297mm (A4 height) - will print to content length

        // Build complete HTML document with thermal printing styles
        const fullHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        /* Reset and base styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            size: ${paperWidth}mm auto;
            margin: 0;
        }

        @media print {
            html, body {
                width: ${paperWidth}mm;
                margin: 0;
                padding: 0;
            }
        }

        body {
            width: ${paperWidth}mm;
            max-width: ${paperWidth}mm;
            margin: 0 auto;
            padding: 3mm;
            font-family: 'Courier New', 'Lucida Console', Monaco, monospace;
            font-size: 11pt;
            line-height: 1.4;
            color: #000;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        /* Prevent browser scaling */
        @media print {
            html {
                zoom: 1;
            }
        }

        /* Ensure QR codes and images print correctly */
        svg {
            max-width: 100%;
            height: auto;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
        }

        img {
            max-width: 100%;
            height: auto;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
        }

        /* Receipt container */
        .receipt-content {
            width: 100%;
        }

        /* Common thermal receipt styles */
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .border-dashed { border-style: dashed; }
        .border-t { border-top: 1px dashed #000; }
        .border-b { border-bottom: 1px dashed #000; }

        /* Spacing */
        .my-1 { margin-top: 4px; margin-bottom: 4px; }
        .my-2 { margin-top: 8px; margin-bottom: 8px; }
        .py-1 { padding-top: 4px; padding-bottom: 4px; }
        .py-2 { padding-top: 8px; padding-bottom: 8px; }
    </style>
</head>
<body>
    <div class="receipt-content">
        ${html}
    </div>
</body>
</html>`;

        try {
            // Write HTML to temp file
            const tempFile = path.join(require('os').tmpdir(), `receipt-wysiwyg-${Date.now()}.html`);
            await fs.writeFile(tempFile, fullHtml, 'utf8');

            log.info(`WYSIWYG print: Created temp file at ${tempFile}`);
            log.info(`WYSIWYG print: Using printer "${printer}", paper width: ${paperWidth}mm`);

            // Create hidden window for printing
            const printWindow = new BrowserWindow({
                show: false,
                width: Math.round(paperWidth * 3.78), // mm to pixels at ~96 DPI
                height: 800,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true
                }
            });

            await printWindow.loadFile(tempFile);

            // Wait for content to fully render (important for QR codes and images)
            await new Promise(resolve => setTimeout(resolve, 500));

            const printOptions = {
                silent: true,
                printBackground: true,
                deviceName: printer,
                color: false,
                margins: {
                    marginType: 'none'
                },
                landscape: false,
                pageSize: {
                    width: paperWidthMicrons,
                    height: paperHeightMicrons
                },
                scaleFactor: 100
            };

            // Print the document
            const printResult = await new Promise((resolve, reject) => {
                printWindow.webContents.print(printOptions, (success, failureReason) => {
                    if (success) {
                        resolve({ success: true });
                    } else {
                        reject(new Error(failureReason || 'Print failed'));
                    }
                });
            });

            // Cleanup
            printWindow.close();
            await fs.unlink(tempFile).catch(() => {}); // Ignore cleanup errors

            log.info('WYSIWYG receipt printed successfully');

            // Send ESC/POS cut command after print completes
            const cutSuccess = await this.sendCutCommand(printer);

            return {
                success: true,
                printer: printer,
                timestamp: new Date().toISOString(),
                paperCut: cutSuccess
            };
        } catch (error) {
            log.error('WYSIWYG print error:', error);
            throw error;
        }
    }

    /**
     * Format kitchen ticket using ESC/POS commands
     * Produces large, clear text for kitchen staff
     *
     * @param {Object} data - Kitchen ticket data
     * @returns {Buffer} - ESC/POS command buffer
     */
    formatKitchenTicket(data) {
        const {
            tableNumber,
            guestCount,
            items = [],
            orderNumber,
            orderType = 'DINE IN',
            timestamp = new Date().toISOString(),
            serverName
        } = data;

        const builder = new ESCPOSBuilder(80);

        builder
            .init()
            .align('center')
            .textSize('double')
            .bold(true)
            .text('** KITCHEN **')
            .textSize('normal')
            .bold(false)
            .feed(1);

        // Order info section
        builder.align('left');

        if (tableNumber) {
            builder.textSize('double-width').bold(true).text(`Table: ${tableNumber}`);
        }

        builder.textSize('normal').bold(false);

        if (guestCount) {
            builder.text(`Guests: ${guestCount}`);
        }

        if (orderNumber) {
            builder.text(`Order: ${orderNumber}`);
        }

        builder.text(`Type: ${orderType}`);

        if (serverName) {
            builder.text(`Server: ${serverName}`);
        }

        builder.text(`Time: ${new Date(timestamp).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
        })}`);

        builder.separator('=').feed(1);

        // Sort items by section number for grouped display
        const sortedItems = [...items].sort((a, b) => {
            const sectionA = a.sectionNumber || 999;
            const sectionB = b.sectionNumber || 999;
            return sectionA - sectionB;
        });

        // Apply SMART ITEM GROUPING: consolidate identical plain items
        const groupedItems = groupReceiptItems(sortedItems);

        // Items section - large and clear for kitchen, with section separators
        let currentSection = null;
        groupedItems.forEach((item, index) => {
            // Check if we need a section separator
            const itemSection = item.sectionNumber || 999;
            if (itemSection !== currentSection && itemSection !== 999) {
                const sectionName = item.sectionName || SECTION_NAMES[itemSection] || '';
                if (sectionName) {
                    if (currentSection !== null) {
                        builder.feed(1); // Extra spacing before new section
                    }
                    builder.sectionSeparator(sectionName);
                    builder.feed(1);
                }
                currentSection = itemSection;
            }

            // Build display name with variant if present
            const displayName = item.variantName
                ? `${item.name} (${item.variantName})`
                : item.name;

            // Item name in bold, larger text - using grouped quantity
            builder
                .textSize('double-width')
                .bold(true)
                .text(`${item.groupedQuantity}x ${displayName}`)
                .textSize('normal')
                .bold(false);

            // Modifiers (only for non-grouped items)
            if (item.modifiers && item.modifiers.length > 0) {
                item.modifiers.forEach(mod => {
                    const modName = typeof mod === 'string' ? mod : mod.name;
                    builder.text(`   + ${modName}`);
                });
            }

            // Special instructions / notes (only for non-grouped items)
            if (item.notes) {
                builder.bold(true).text(`   * ${item.notes}`).bold(false);
            }

            // Add spacing between items
            if (index < groupedItems.length - 1) {
                builder.feed(1);
            }
        });

        builder.separator('=');

        // Kitchen QC Footer - Only for takeaway orders (COLLECTION, DELIVERY, WAITING)
        const takeawayTypes = ['COLLECTION', 'DELIVERY', 'WAITING'];
        if (takeawayTypes.includes(orderType?.toUpperCase())) {
            builder
                .feed(1)
                .align('center')
                .text('Container/Item QTY: [____]    Checked: ☐')
                .feed(1);
        }

        builder
            .feed(1)
            .align('center')
            .text(`Printed: ${new Date().toLocaleTimeString('en-GB')}`)
            .cut();

        return builder.build();
    }

    /**
     * Format customer receipt using ESC/POS commands
     * Professional receipt with prices and totals
     *
     * @param {Object} data - Receipt data
     * @returns {Buffer} - ESC/POS command buffer
     */
    formatCustomerReceipt(data) {
        const {
            businessName = 'COTTAGE TANDOORI',
            address = '25 West St, Storrington',
            address2 = 'West Sussex, RH20 4DZ',
            phone = '01903 743605 / 745974',
            items = [],
            subtotal = 0,
            tax = 0,
            total = 0,
            orderNumber,
            orderType = 'DINE IN',
            tableNumber,
            timestamp = new Date().toISOString(),
            paymentMethod,
            customerName,
            footerMessage = 'Thank you for dining with us!',
            paymentStatus,
            // Delivery-specific fields
            deliveryAddress,
            deliveryPostcode,
            deliveryDistance,
            deliveryNotes
        } = data;

        const builder = new ESCPOSBuilder(80);

        builder.init();

        // Header - business info
        builder
            .align('center')
            .textSize('double')
            .bold(true)
            .text(businessName)
            .textSize('normal')
            .bold(false)
            .text(address);

        if (address2) {
            builder.text(address2);
        }

        builder.text(`Tel: ${phone}`);
        builder.separator('-');

        // Order info
        builder.align('left');

        if (orderNumber) {
            builder.text(`Order: ${orderNumber}`);
        }

        builder.text(`Type: ${orderType}`);

        if (tableNumber) {
            builder.text(`Table: ${tableNumber}`);
        }

        if (customerName) {
            builder.text(`Customer: ${customerName}`);
        }

        builder.text(`Date: ${new Date(timestamp).toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`);

        // PAID Badge - prominent display when payment is confirmed
        if (paymentStatus === 'PAID') {
            builder
                .feed(1)
                .align('center')
                .textSize('double-width')
                .bold(true)
                .text('*** PAID ***')
                .textSize('normal')
                .bold(false)
                .align('left')
                .feed(1);
        } else if (paymentStatus === 'PARTIAL') {
            builder
                .feed(1)
                .align('center')
                .bold(true)
                .text('** PARTIAL PAYMENT **')
                .bold(false)
                .align('left')
                .feed(1);
        }

        // Delivery Address Section - Only for DELIVERY orders
        if (orderType?.toUpperCase() === 'DELIVERY' && deliveryAddress) {
            builder
                .separator('=')
                .align('center')
                .bold(true)
                .text('DELIVERY ADDRESS')
                .bold(false)
                .align('left')
                .feed(1);

            // Split address into lines and print each
            const addressLines = deliveryAddress.split(/[,\n]/).map(l => l.trim()).filter(l => l);
            addressLines.forEach(line => {
                builder.text(line);
            });

            // Postcode - Emphasized (double-width for visibility)
            if (deliveryPostcode) {
                builder
                    .feed(1)
                    .align('center')
                    .textSize('double-width')
                    .bold(true)
                    .text(deliveryPostcode)
                    .textSize('normal')
                    .bold(false)
                    .align('left');
            }

            // Distance
            if (deliveryDistance) {
                builder.text(`Distance: ${deliveryDistance}`);
            }

            // Driver Notes
            if (deliveryNotes) {
                builder
                    .feed(1)
                    .bold(true)
                    .text('DRIVER NOTES:')
                    .bold(false)
                    .text(deliveryNotes);
            }

            builder.separator('=');
        } else {
            builder.separator('-');
        }

        // Sort items by section number for grouped display
        const sortedItems = [...items].sort((a, b) => {
            const sectionA = a.sectionNumber || 999;
            const sectionB = b.sectionNumber || 999;
            return sectionA - sectionB;
        });

        // Apply SMART ITEM GROUPING: consolidate identical plain items
        const groupedItems = groupReceiptItems(sortedItems);

        // Items with prices and section separators
        let currentSection = null;
        groupedItems.forEach(item => {
            // Check if we need a section separator
            const itemSection = item.sectionNumber || 999;
            if (itemSection !== currentSection && itemSection !== 999) {
                const sectionName = item.sectionName || SECTION_NAMES[itemSection] || '';
                if (sectionName) {
                    if (currentSection !== null) {
                        builder.feed(1); // Extra spacing before new section
                    }
                    builder.sectionSeparator(sectionName);
                }
                currentSection = itemSection;
            }

            // Build display name with variant if present
            const baseName = item.variantName
                ? `${item.name} (${item.variantName})`
                : item.name;

            // Smart grouping display format
            let qtyDisplay;
            let itemName;
            let priceStr;

            if (item.isGrouped) {
                // Grouped format: "3x" "ITEM NAME (£9.50 ea)" "£28.50"
                qtyDisplay = `${item.groupedQuantity}x`;
                itemName = `${baseName} (£${item.unitPrice.toFixed(2)} ea)`;
                priceStr = `£${item.groupedTotal.toFixed(2)}`;
            } else {
                // Single item format: "1x" "ITEM NAME" "£9.50"
                qtyDisplay = `${item.groupedQuantity}x`;
                itemName = baseName;
                priceStr = `£${item.groupedTotal.toFixed(2)}`;
            }

            builder.threeColumn(qtyDisplay, itemName, priceStr);

            // Modifiers with prices (only for non-grouped items)
            if (item.modifiers && item.modifiers.length > 0) {
                item.modifiers.forEach(mod => {
                    const modName = typeof mod === 'string' ? mod : mod.name;
                    const modPrice = (typeof mod === 'object' && mod.price) ? mod.price : 0;
                    if (modPrice > 0) {
                        builder.twoColumn(`   + ${modName}`, `£${modPrice.toFixed(2)}`);
                    } else {
                        builder.text(`   + ${modName}`);
                    }
                });
            }
        });

        builder.separator('-');

        // Totals
        if (subtotal > 0 && subtotal !== total) {
            builder.twoColumn('Subtotal:', `£${subtotal.toFixed(2)}`);
        }

        if (tax > 0) {
            builder.twoColumn('VAT:', `£${tax.toFixed(2)}`);
        }

        builder
            .bold(true)
            .textSize('double-height')
            .twoColumn('TOTAL:', `£${total.toFixed(2)}`)
            .textSize('normal')
            .bold(false);

        builder.separator('-');

        // Payment method
        if (paymentMethod) {
            builder.text(`Payment: ${paymentMethod}`);
            builder.feed(1);
        }

        // Footer
        builder
            .align('center')
            .text(footerMessage)
            .text('All prices include VAT')
            .feed(2)
            .cut();

        return builder.build();
    }

    /**
     * Print receipt using ESC/POS commands (raw thermal printing)
     * This is the hybrid approach - ESC/POS for text, reliable and fast
     *
     * @param {Object} data - Print data
     * @param {string} data.type - 'kitchen' or 'customer'
     * @param {Object} data.receiptData - Receipt/ticket data
     * @param {string} [data.printerName] - Optional specific printer
     * @returns {Promise<Object>} - Print result
     */
    async printReceiptESCPOS(data) {
        const { type, receiptData, printerName } = data;

        // Multi-printer routing: resolve printer by role, then explicit name, then default
        const role = type === 'kitchen' ? 'kitchen' : 'customer';
        const printer = printerName || this.getPrinterForRole(role) || this.defaultPrinter;
        if (!printer) {
            throw new Error('No printer available. Please check printer connection.');
        }

        log.info(`ESC/POS print request: type=${type}, printer=${printer}`);

        try {
            // Generate ESC/POS buffer based on type
            let buffer;
            if (type === 'kitchen') {
                buffer = this.formatKitchenTicket(receiptData);
            } else if (type === 'customer') {
                buffer = this.formatCustomerReceipt(receiptData);
            } else {
                throw new Error(`Unknown receipt type: ${type}`);
            }

            log.info(`ESC/POS buffer generated: ${buffer.length} bytes`);

            // Write buffer to temp file
            const tempFile = path.join(os.tmpdir(), `escpos-${type}-${Date.now()}.bin`);
            await fs.writeFile(tempFile, buffer);

            // Send raw data to printer
            if (process.platform === 'darwin') {
                // macOS: Use lp with raw option
                await execAsync(`lp -d "${printer}" -o raw "${tempFile}"`);
            } else if (process.platform === 'win32') {
                // Windows: Use .NET System.Printing to send raw data via print spooler
                // This is more reliable than WMI port detection which fails for modern USB printers
                const printScript = `
                    Add-Type -AssemblyName System.Printing
                    $queue = New-Object System.Printing.PrintQueue(
                        (New-Object System.Printing.LocalPrintServer),
                        '${printer.replace(/'/g, "''")}'
                    )
                    $job = $queue.AddJob()
                    $stream = $job.JobStream
                    $bytes = [System.IO.File]::ReadAllBytes('${tempFile.replace(/\\/g, '\\\\')}')
                    $stream.Write($bytes, 0, $bytes.Length)
                    $stream.Close()
                `;
                await execAsync(`powershell -Command "${printScript.replace(/\n/g, ' ')}"`);
            } else {
                throw new Error(`Unsupported platform: ${process.platform}`);
            }

            // Cleanup temp file
            await fs.unlink(tempFile).catch(() => {});

            log.info(`ESC/POS ${type} receipt printed successfully`);

            return {
                success: true,
                printer: printer,
                timestamp: new Date().toISOString(),
                type: type,
                bytesWritten: buffer.length
            };
        } catch (error) {
            log.error('ESC/POS print error:', error);
            throw error;
        }
    }

    /**
     * Send ESC/POS paper cut command to thermal printer
     * Uses raw ESC/POS commands to trigger the auto-cutter on Epson TM-T20III
     *
     * @param {string} printerName - The CUPS/system printer name
     * @returns {Promise<boolean>} - true if cut command sent successfully
     */
    async sendCutCommand(printerName) {
        // ESC/POS commands for Epson TM-T20III:
        // 0x1B 0x64 0x05 = ESC d 5 = Print and feed 5 lines (to clear cutter area)
        // 0x1D 0x56 0x42 0x00 = GS V 66 0 = Partial cut (leaves small tab for easy tear)
        const cutCommand = Buffer.from([
            0x1B, 0x64, 0x05,       // Feed 5 lines
            0x1D, 0x56, 0x42, 0x00  // Partial cut
        ]);

        const tempFile = path.join(os.tmpdir(), `cut-${Date.now()}.bin`);

        try {
            await fs.writeFile(tempFile, cutCommand);

            if (process.platform === 'darwin') {
                // macOS: Use lp command with raw option to send ESC/POS directly
                log.info(`Sending cut command to printer: ${printerName}`);
                await execAsync(`lp -d "${printerName}" -o raw "${tempFile}"`);
            } else if (process.platform === 'win32') {
                // Windows: Use .NET System.Printing to send raw data via print spooler
                const printScript = `
                    Add-Type -AssemblyName System.Printing
                    $queue = New-Object System.Printing.PrintQueue(
                        (New-Object System.Printing.LocalPrintServer),
                        '${printerName.replace(/'/g, "''")}'
                    )
                    $job = $queue.AddJob()
                    $stream = $job.JobStream
                    $bytes = [System.IO.File]::ReadAllBytes('${tempFile.replace(/\\/g, '\\\\')}')
                    $stream.Write($bytes, 0, $bytes.Length)
                    $stream.Close()
                `;
                await execAsync(`powershell -Command "${printScript.replace(/\n/g, ' ')}"`);
            }

            log.info('Paper cut command sent successfully');
            return true;
        } catch (error) {
            log.warn('Failed to send cut command:', error.message);
            // Don't fail the print job if only cut fails
            return false;
        } finally {
            // Cleanup temp file
            await fs.unlink(tempFile).catch(() => {});
        }
    }

    /**
     * Print receipt using raster image (true WYSIWYG)
     * Converts a captured HTML screenshot to ESC/POS raster bitmap
     * This produces output that exactly matches the screen preview
     *
     * @param {Object} data - Print data
     * @param {string} data.imageData - Base64 encoded PNG image data (from html2canvas)
     * @param {number} data.paperWidth - Paper width in mm (58 or 80)
     * @param {string} [data.printerName] - Optional specific printer name
     * @returns {Promise<Object>} - Print result
     */
    async printReceiptRaster(data) {
        const { imageData, paperWidth = 80, printerName } = data;

        if (!imageData) {
            throw new Error('No image data provided for raster printing');
        }

        const printer = printerName || this.defaultPrinter;
        if (!printer) {
            throw new Error('No printer available. Please check printer connection.');
        }

        log.info(`[Raster] Starting raster print to ${printer}, paperWidth: ${paperWidth}mm`);

        try {
            // Convert base64 data URL to buffer
            // Format: "data:image/png;base64,iVBORw0KGgo..."
            const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
            const imageBuffer = Buffer.from(base64Data, 'base64');

            log.info(`[Raster] Image buffer size: ${imageBuffer.length} bytes`);

            // Convert image to ESC/POS raster format
            const escposBuffer = await imageToRasterESCPOS(imageBuffer, paperWidth);

            log.info(`[Raster] ESC/POS buffer size: ${escposBuffer.length} bytes`);

            // Write to temp file
            const tempFile = path.join(os.tmpdir(), `raster-${Date.now()}.bin`);
            await fs.writeFile(tempFile, escposBuffer);

            // Send raw data to printer
            if (process.platform === 'darwin') {
                // macOS: Use lp with raw option
                await execAsync(`lp -d "${printer}" -o raw "${tempFile}"`);
            } else if (process.platform === 'win32') {
                // Windows: Use .NET System.Printing to send raw data via print spooler
                // This is more reliable than WMI port detection which fails for modern USB printers
                const printScript = `
                    Add-Type -AssemblyName System.Printing
                    $queue = New-Object System.Printing.PrintQueue(
                        (New-Object System.Printing.LocalPrintServer),
                        '${printer.replace(/'/g, "''")}'
                    )
                    $job = $queue.AddJob()
                    $stream = $job.JobStream
                    $bytes = [System.IO.File]::ReadAllBytes('${tempFile.replace(/\\/g, '\\\\')}')
                    $stream.Write($bytes, 0, $bytes.Length)
                    $stream.Close()
                `;
                await execAsync(`powershell -Command "${printScript.replace(/\n/g, ' ')}"`);
            } else {
                throw new Error(`Unsupported platform: ${process.platform}`);
            }

            // Cleanup temp file
            await fs.unlink(tempFile).catch(() => {});

            log.info('[Raster] Receipt printed successfully via raster');

            return {
                success: true,
                printer: printer,
                timestamp: new Date().toISOString(),
                bytesWritten: escposBuffer.length,
                method: 'raster'
            };
        } catch (error) {
            log.error('[Raster] Print error:', error);
            throw error;
        }
    }
}

// Start the app
new CottageTandooriPOS();
