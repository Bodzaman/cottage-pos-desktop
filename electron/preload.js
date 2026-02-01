
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Legacy print methods
    printReceipt: (data) => ipcRenderer.invoke('print-receipt', data),
    printTest: () => ipcRenderer.invoke('print-test'),
    getPrinters: () => ipcRenderer.invoke('get-printers'),

    // WYSIWYG thermal printing - prints the exact HTML from ThermalPreview
    printReceiptWYSIWYG: (data) => ipcRenderer.invoke('print-receipt-wysiwyg', data),

    // ESC/POS thermal printing - raw commands for reliable thermal printing
    // Use this for kitchen tickets and customer receipts
    printReceiptESCPOS: (data) => ipcRenderer.invoke('print-receipt-escpos', data),

    // Z-Report / End of Day thermal printing
    printZReport: (data) => ipcRenderer.invoke('print-z-report', data),

    // Raster image printing - true WYSIWYG thermal printing
    // Converts HTML screenshot (from html2canvas) to ESC/POS raster bitmap
    // Use this when you need printed output to exactly match the screen preview
    printReceiptRaster: (data) => ipcRenderer.invoke('print-receipt-raster', data),

    getConfig: () => ipcRenderer.invoke('get-config'),
    saveConfig: (config) => ipcRenderer.invoke('save-config', config),

    // Stripe payment methods (secure - calls main process which has secret key)
    stripeGetStatus: () => ipcRenderer.invoke('stripe-get-status'),
    stripeCreatePaymentIntent: (data) => ipcRenderer.invoke('stripe-create-payment-intent', data),
    stripeConfirmPayment: (data) => ipcRenderer.invoke('stripe-confirm-payment', data),

    // Platform info
    platform: process.platform,
    version: process.versions,

    // Local file-system cache (instant cold starts)
    cacheSet: (key, data) => ipcRenderer.invoke('cache-set', key, data),
    cacheGet: (key) => ipcRenderer.invoke('cache-get', key),
    cacheClear: (key) => ipcRenderer.invoke('cache-clear', key),

    // Crash recovery state persistence
    saveCrashState: (state) => ipcRenderer.invoke('save-crash-state', state),
    getCrashState: () => ipcRenderer.invoke('get-crash-state'),
    clearCrashState: () => ipcRenderer.invoke('clear-crash-state'),

    // Sleep/Wake lifecycle events
    onSystemResume: (callback) => {
        ipcRenderer.on('system-resumed', () => callback());
    },
    onSystemSuspend: (callback) => {
        ipcRenderer.on('system-suspended', () => callback());
    },
    removeSystemResumeListener: () => {
        ipcRenderer.removeAllListeners('system-resumed');
    },
    removeSystemSuspendListener: () => {
        ipcRenderer.removeAllListeners('system-suspended');
    },

    // Receipt history for reprint
    saveReceiptHistory: (receipt) => ipcRenderer.invoke('save-receipt-history', receipt),
    getReceiptHistory: () => ipcRenderer.invoke('get-receipt-history'),

    // Printer status monitoring
    getPrinterStatus: () => ipcRenderer.invoke('get-printer-status'),
    onPrinterStatus: (callback) => {
        ipcRenderer.on('printer-status-update', (event, status) => callback(status));
    },
    removePrinterStatusListener: () => {
        ipcRenderer.removeAllListeners('printer-status-update');
    },

    // Printer role configuration (multi-printer routing)
    getPrinterRoles: () => ipcRenderer.invoke('get-printer-roles'),
    savePrinterRoles: (roles) => ipcRenderer.invoke('save-printer-roles', roles),
    testPrintRole: (role) => ipcRenderer.invoke('test-print-role', role),

    // Window title (dynamic from restaurant settings)
    setWindowTitle: (title) => ipcRenderer.invoke('set-window-title', title),

    // Multi-monitor workspace management
    getDisplays: () => ipcRenderer.invoke('get-displays'),
    getWorkspaceLayout: () => ipcRenderer.invoke('get-workspace-layout'),
    saveWorkspaceLayout: (layout) => ipcRenderer.invoke('save-workspace-layout', layout),
    applyWorkspaceLayout: (layout) => ipcRenderer.invoke('apply-workspace-layout', layout),
    onDisplaysChanged: (callback) => {
        ipcRenderer.on('displays-changed', () => callback());
    },
    removeDisplaysChangedListener: () => {
        ipcRenderer.removeAllListeners('displays-changed');
    },

    // Native notifications (Windows 10/11 action center)
    showNotification: (data) => ipcRenderer.invoke('show-native-notification', data),
    onNotificationClicked: (callback) => {
        ipcRenderer.on('notification-clicked', (event, data) => callback(data));
    },
    removeNotificationClickedListener: () => {
        ipcRenderer.removeAllListeners('notification-clicked');
    },

    // ============================================================================
    // OFFLINE ORDER QUEUE (SQLite persistence - survives app restarts)
    // ============================================================================

    // Enqueue an order for offline sync
    // order: { id, idempotency_key, local_id, order_data }
    offlineOrderEnqueue: (order) => ipcRenderer.invoke('offline-order-enqueue', order),

    // List orders by status (optional status filter: 'pending', 'syncing', 'synced', 'failed')
    offlineOrderList: (status) => ipcRenderer.invoke('offline-order-list', status),

    // Mark order as synced with server ID
    offlineOrderMarkSynced: (id, serverId) => ipcRenderer.invoke('offline-order-mark-synced', { id, serverId }),

    // Mark order as failed with error message
    offlineOrderMarkFailed: (id, error) => ipcRenderer.invoke('offline-order-mark-failed', { id, error }),

    // Get offline order queue statistics
    offlineOrderGetStats: () => ipcRenderer.invoke('offline-order-get-stats'),

    // Delete an offline order
    offlineOrderDelete: (id) => ipcRenderer.invoke('offline-order-delete', id),

    // ============================================================================
    // PRINT QUEUE (SQLite persistence - retry failed prints)
    // ============================================================================

    // Enqueue a print job
    // job: { id, order_id?, job_type: 'receipt'|'kitchen'|'z-report', print_data, printer_name? }
    printQueueEnqueue: (job) => ipcRenderer.invoke('print-queue-enqueue', job),

    // List print jobs by status (optional status filter: 'pending', 'printing', 'printed', 'failed')
    printQueueList: (status) => ipcRenderer.invoke('print-queue-list', status),

    // Mark print job as printed
    printQueueMarkPrinted: (id) => ipcRenderer.invoke('print-queue-mark-printed', id),

    // Mark print job as failed with error message
    printQueueMarkFailed: (id, error) => ipcRenderer.invoke('print-queue-mark-failed', { id, error }),

    // Retry a failed print job (reset to pending)
    printQueueRetry: (id) => ipcRenderer.invoke('print-queue-retry', id),

    // Get print queue statistics
    printQueueGetStats: () => ipcRenderer.invoke('print-queue-get-stats'),

    // Delete a print job
    printQueueDelete: (id) => ipcRenderer.invoke('print-queue-delete', id)
});
