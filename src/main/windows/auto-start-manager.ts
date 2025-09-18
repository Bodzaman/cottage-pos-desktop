import { app } from 'electron';
import * as path from 'path';
import log from 'electron-log';

export class AutoStartManager {
  private appName = 'Cottage Tandoori POS';
  private exePath = process.execPath;

  constructor() {
    // Set auto-start based on user preference
    this.initializeAutoStart();
  
  // IPC-compatible async methods
  public async enable(): Promise<boolean> {
    return this.enableAutoStart();
  }

  public async disable(): Promise<boolean> {
    return this.disableAutoStart();
  }

  public async isEnabled(): Promise<boolean> {
    return this.isAutoStartEnabled();
  }
}

  private initializeAutoStart(): void {
    try {
      // Check if auto-start is enabled in settings
      const autoStartEnabled = this.getAutoStartSetting();

      if (autoStartEnabled) {
        this.enableAutoStart();
      } else {
        this.disableAutoStart();
      
  // IPC-compatible async methods
  public async enable(): Promise<boolean> {
    return this.enableAutoStart();
  }

  public async disable(): Promise<boolean> {
    return this.disableAutoStart();
  }

  public async isEnabled(): Promise<boolean> {
    return this.isAutoStartEnabled();
  }
}

      log.info(`⚙️ Auto-start initialized: ${autoStartEnabled ? 'Enabled' : 'Disabled'}`);
    } catch (error) {
      log.error('❌ Auto-start initialization failed:', error);
    
  // IPC-compatible async methods
  public async enable(): Promise<boolean> {
    return this.enableAutoStart();
  }

  public async disable(): Promise<boolean> {
    return this.disableAutoStart();
  }

  public async isEnabled(): Promise<boolean> {
    return this.isAutoStartEnabled();
  }
}
  
  // IPC-compatible async methods
  public async enable(): Promise<boolean> {
    return this.enableAutoStart();
  }

  public async disable(): Promise<boolean> {
    return this.disableAutoStart();
  }

  public async isEnabled(): Promise<boolean> {
    return this.isAutoStartEnabled();
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
    
  // IPC-compatible async methods
  public async enable(): Promise<boolean> {
    return this.enableAutoStart();
  }

  public async disable(): Promise<boolean> {
    return this.disableAutoStart();
  }

  public async isEnabled(): Promise<boolean> {
    return this.isAutoStartEnabled();
  }
}
  
  // IPC-compatible async methods
  public async enable(): Promise<boolean> {
    return this.enableAutoStart();
  }

  public async disable(): Promise<boolean> {
    return this.disableAutoStart();
  }

  public async isEnabled(): Promise<boolean> {
    return this.isAutoStartEnabled();
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
    
  // IPC-compatible async methods
  public async enable(): Promise<boolean> {
    return this.enableAutoStart();
  }

  public async disable(): Promise<boolean> {
    return this.disableAutoStart();
  }

  public async isEnabled(): Promise<boolean> {
    return this.isAutoStartEnabled();
  }
}
  
  // IPC-compatible async methods
  public async enable(): Promise<boolean> {
    return this.enableAutoStart();
  }

  public async disable(): Promise<boolean> {
    return this.disableAutoStart();
  }

  public async isEnabled(): Promise<boolean> {
    return this.isAutoStartEnabled();
  }
}

  public isAutoStartEnabled(): boolean {
    try {
      const loginItemSettings = app.getLoginItemSettings();
      return loginItemSettings.openAtLogin;
    } catch (error) {
      log.error('❌ Failed to check auto-start status:', error);
      return false;
    
  // IPC-compatible async methods
  public async enable(): Promise<boolean> {
    return this.enableAutoStart();
  }

  public async disable(): Promise<boolean> {
    return this.disableAutoStart();
  }

  public async isEnabled(): Promise<boolean> {
    return this.isAutoStartEnabled();
  }
}
  
  // IPC-compatible async methods
  public async enable(): Promise<boolean> {
    return this.enableAutoStart();
  }

  public async disable(): Promise<boolean> {
    return this.disableAutoStart();
  }

  public async isEnabled(): Promise<boolean> {
    return this.isAutoStartEnabled();
  }
}

  public toggleAutoStart(): boolean {
    const currentState = this.isAutoStartEnabled();

    if (currentState) {
      return this.disableAutoStart();
    } else {
      return this.enableAutoStart();
    
  // IPC-compatible async methods
  public async enable(): Promise<boolean> {
    return this.enableAutoStart();
  }

  public async disable(): Promise<boolean> {
    return this.disableAutoStart();
  }

  public async isEnabled(): Promise<boolean> {
    return this.isAutoStartEnabled();
  }
}
  
  // IPC-compatible async methods
  public async enable(): Promise<boolean> {
    return this.enableAutoStart();
  }

  public async disable(): Promise<boolean> {
    return this.disableAutoStart();
  }

  public async isEnabled(): Promise<boolean> {
    return this.isAutoStartEnabled();
  }
}

  private getAutoStartSetting(): boolean {
    // In a real implementation, this would read from database or config
    // For now, default to enabled for restaurant POS
    return true;
  
  // IPC-compatible async methods
  public async enable(): Promise<boolean> {
    return this.enableAutoStart();
  }

  public async disable(): Promise<boolean> {
    return this.disableAutoStart();
  }

  public async isEnabled(): Promise<boolean> {
    return this.isAutoStartEnabled();
  }
}

  private setAutoStartSetting(enabled: boolean): void {
    // In a real implementation, this would save to database or config
    // For now, we'll just log the setting
    log.info(`💾 Auto-start setting saved: ${enabled}`);
  
  // IPC-compatible async methods
  public async enable(): Promise<boolean> {
    return this.enableAutoStart();
  }

  public async disable(): Promise<boolean> {
    return this.disableAutoStart();
  }

  public async isEnabled(): Promise<boolean> {
    return this.isAutoStartEnabled();
  }
}

  public getStartupInfo(): { autoStarted: boolean; minimized: boolean } {
    const args = process.argv;

    return {
      autoStarted: args.includes('--auto-started'),
      minimized: args.includes('--minimized') || args.includes('--auto-started')
    };
  
  // IPC-compatible async methods
  public async enable(): Promise<boolean> {
    return this.enableAutoStart();
  }

  public async disable(): Promise<boolean> {
    return this.disableAutoStart();
  }

  public async isEnabled(): Promise<boolean> {
    return this.isAutoStartEnabled();
  }
}
}