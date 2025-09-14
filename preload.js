
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    printReceipt: (data) => ipcRenderer.invoke('print-receipt', data),
    printTest: () => ipcRenderer.invoke('print-test'),
    getPrinters: () => ipcRenderer.invoke('get-printers'),
    getConfig: () => ipcRenderer.invoke('get-config'),
    saveConfig: (config) => ipcRenderer.invoke('save-config', config),
    
    // Platform info
    platform: process.platform,
    version: process.versions
});
