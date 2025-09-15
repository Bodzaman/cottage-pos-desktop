import { ipcMain } from 'electron';
import log from 'electron-log';

export function setupIpcHandlers() {
  log.info('Setting up IPC handlers for Cottage Tandoori POS');

  // Basic app info handler
  ipcMain.handle('app:getVersion', () => {
    return process.env.npm_package_version || '1.0.0';
  });

  // Basic app state handler
  ipcMain.handle('app:getState', () => {
    return {
      isOnline: true,
      lastSync: new Date().toISOString(),
      status: 'ready'
    };
  });

  // Thermal printer handlers (minimal implementation)
  ipcMain.handle('printer:getStatus', async () => {
    log.info('Printer status requested - thermal printing not yet implemented');
    return { status: 'not_configured', message: 'Thermal printing will be added in future release' };
  });

  ipcMain.handle('printer:print', async (event, data) => {
    log.info('Print request received - thermal printing not yet implemented', data);
    return { success: false, message: 'Thermal printing will be added in future release' };
  });

  log.info('IPC handlers setup complete');
}
