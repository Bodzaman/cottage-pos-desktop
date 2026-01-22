
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('settingsAPI', {
    getConfig: () => ipcRenderer.invoke('get-config'),
    saveConfig: (config) => ipcRenderer.invoke('save-config', config),
    getPrinters: () => ipcRenderer.invoke('get-printers'),
    
    // Listen for config updates
    onLoadConfig: (callback) => {
        ipcRenderer.on('load-config', (event, config) => callback(config));
    }
});
