import { app } from 'electron';
import * as path from 'path';
import log from 'electron-log';

export class AutoStartManager {
  private appName = 'Cottage Tandoori POS';
  private exePath = process.execPath;

  constructor() {
    // Set auto-start based on user preference
    this.initializeAutoStart();
  }

  private initializeAutoStart(): void {
    try {
      // Check if auto-start is enabled in settings
      const autoStartEnabled = this.getAutoStartSetting();

      if (autoStartEnabled) {
        this.enableAutoStart();
      } else {
        this.disableAutoStart();
      }

      log.info(`⚙️ Auto-start initialized: ${autoStartEnabled ? 'Enabled' : 'Disabled'}`);
    } catch (error) {
      log.error('❌ Auto-start initialization failed:', error);
    }
  }

  public enableAutoStart(): boolean {
    try {
      // Set login item (Windows registry entry)
      app.setLoginItemSettings({
        openAtLogin: true,
        name: this.appName,
        path: this.exePath,
        args: ['--auto-started']
      });

      this.setAutoStartSetting(true);
      log.info('✅ Auto-start enabled');
      return true;
    } catch (error) {
      log.error('❌ Failed to enable auto-start:', error);
      return false;
    }
  }

  public disableAutoStart(): boolean {
    try {
      // Remove login item
      app.setLoginItemSettings({
        openAtLogin: false,
        name: this.appName
      });

      this.setAutoStartSetting(false);
      log.info('🚫 Auto-start disabled');
      return true;
    } catch (error) {
      log.error('❌ Failed to disable auto-start:', error);
      return false;
    }
  }

  public isAutoStartEnabled(): boolean {
    try {
      const loginItemSettings = app.getLoginItemSettings();
      return loginItemSettings.openAtLogin;
    } catch (error) {
      log.error('❌ Failed to check auto-start status:', error);
      return false;
    }
  }

  public toggleAutoStart(): boolean {
    const currentState = this.isAutoStartEnabled();

    if (currentState) {
      return this.disableAutoStart();
    } else {
      return this.enableAutoStart();
    }
  }

  private getAutoStartSetting(): boolean {
    // In a real implementation, this would read from database or config
    // For now, default to enabled for restaurant POS
    return true;
  }

  private setAutoStartSetting(enabled: boolean): void {
    // In a real implementation, this would save to database or config
    // For now, we'll just log the setting
    log.info(`💾 Auto-start setting saved: ${enabled}`);
  }

  public getStartupInfo(): { autoStarted: boolean; minimized: boolean } {
    const args = process.argv;

    return {
      autoStarted: args.includes('--auto-started'),
      minimized: args.includes('--minimized') || args.includes('--auto-started')
    };
  }
}