
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

    // Raster image printing - true WYSIWYG thermal printing
    // Converts HTML screenshot (from html2canvas) to ESC/POS raster bitmap
    // Use this when you need printed output to exactly match the screen preview
    printReceiptRaster: (data) => ipcRenderer.invoke('print-receipt-raster', data),

    getConfig: () => ipcRenderer.invoke('get-config'),
    saveConfig: (config) => ipcRenderer.invoke('save-config', config),

    // Stripe payment methods (secure - calls main process which has secret key)
    stripeCreatePaymentIntent: (data) => ipcRenderer.invoke('stripe-create-payment-intent', data),
    stripeConfirmPayment: (data) => ipcRenderer.invoke('stripe-confirm-payment', data),

    // Platform info
    platform: process.platform,
    version: process.versions
});
