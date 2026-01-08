// Sound notification utilities
type NotificationType = 'new_order' | 'status_update' | 'urgent_alert' | 'order_ready' | 'payment_success';

interface NotificationSettings {
  soundEnabled: boolean;
  volume: number;
  statusAlerts: boolean;
  newOrderAlerts: boolean;
  urgentAlerts: boolean;
}

// Sound files mapping
const SOUND_FILES: Record<NotificationType, string> = {
  new_order: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAkUXrTp66hVFApGn+D1u2EdBDaG0fPTgjMLJYHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAkUXrTp66hVFApGn+D1u2EdBDaG0fPTgjMLJYHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAkUXrTp66hVFApGn+D1u2EdBDaG0fPTgj',
  status_update: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAkUXrTp66hVFApGn+D1u2EdBDaG0fPTgjMLJYHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAkUXrTp66hVFApGn+D1u2EdBDaG0fPTgjMLJYHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAkUXrTp66hVFApGn+D1u2EdBDaG0fPTgj',
  urgent_alert: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAkUXrTp66hVFApGn+D1u2EdBDaG0fPTgjMLJYHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAkUXrTp66hVFApGn+D1u2EdBDaG0fPTgjMLJYHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAkUXrTp66hVFApGn+D1u2EdBDaG0fPTgj',
  order_ready: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAkUXrTp66hVFApGn+D1u2EdBDaG0fPTgjMLJYHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAkUXrTp66hVFApGn+D1u2EdBDaG0fPTgjMLJYHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAkUXrTp66hVFApGn+D1u2EdBDaG0fPTgj',
  payment_success: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAkUXrTp66hVFApGn+D1u2EdBDaG0fPTgjMLJYHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAkUXrTp66hVFApGn+D1u2EdBDaG0fPTgjMLJYHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAkUXrTp66hVFApGn+D1u2EdBDaG0fPTgj'
};

// Create audio context for better sound control
let audioContext: AudioContext | null = null;

const initializeAudioContext = () => {
  if (!audioContext && typeof window !== 'undefined') {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.log('Audio context not supported:', error);
    }
  }
  return audioContext;
};

// Generate beep sound programmatically for notifications
const generateBeepSound = (frequency: number, duration: number, volume: number): Promise<void> => {
  return new Promise((resolve) => {
    const context = initializeAudioContext();
    if (!context) {
      resolve();
      return;
    }
    
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(volume, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + duration);
    
    setTimeout(resolve, duration * 1000);
  });
};

// Sound patterns for different notification types
const SOUND_PATTERNS: Record<NotificationType, { frequency: number; duration: number; repeat?: number; gap?: number }> = {
  new_order: { frequency: 800, duration: 0.3, repeat: 2, gap: 0.1 },
  status_update: { frequency: 600, duration: 0.2 },
  urgent_alert: { frequency: 1000, duration: 0.5, repeat: 3, gap: 0.2 },
  order_ready: { frequency: 700, duration: 0.4, repeat: 2, gap: 0.15 },
  payment_success: { frequency: 900, duration: 0.25, repeat: 1 }
};

export class SoundNotificationManager {
  private settings: NotificationSettings;
  private isPlaying: boolean = false;
  
  constructor(settings: NotificationSettings) {
    this.settings = settings;
  }
  
  updateSettings(settings: NotificationSettings) {
    this.settings = settings;
  }
  
  async playNotification(type: NotificationType): Promise<void> {
    if (!this.settings.soundEnabled || this.isPlaying) {
      return;
    }
    
    // Check specific alert settings
    if (type === 'new_order' && !this.settings.newOrderAlerts) return;
    if (type === 'status_update' && !this.settings.statusAlerts) return;
    if (type === 'urgent_alert' && !this.settings.urgentAlerts) return;
    
    this.isPlaying = true;
    
    try {
      const pattern = SOUND_PATTERNS[type];
      const volume = this.settings.volume;
      
      if (pattern.repeat && pattern.repeat > 1 && pattern.gap) {
        // Play repeated beeps
        for (let i = 0; i < pattern.repeat; i++) {
          await generateBeepSound(pattern.frequency, pattern.duration, volume);
          if (i < pattern.repeat - 1) {
            await new Promise(resolve => setTimeout(resolve, pattern.gap! * 1000));
          }
        }
      } else {
        // Play single beep
        await generateBeepSound(pattern.frequency, pattern.duration, volume);
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    } finally {
      this.isPlaying = false;
    }
  }
  
  // Test sound functionality
  async testSound(type: NotificationType): Promise<void> {
    const originalSettings = { ...this.settings };
    this.settings = {
      ...this.settings,
      soundEnabled: true,
      newOrderAlerts: true,
      statusAlerts: true,
      urgentAlerts: true
    };
    
    await this.playNotification(type);
    this.settings = originalSettings;
  }
  
  // Get user permission for notifications
  static async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission === 'denied') {
      return false;
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  // Show browser notification with sound
  static async showBrowserNotification(
    title: string,
    body: string,
    options: {
      icon?: string;
      badge?: string;
      tag?: string;
      requireInteraction?: boolean;
      soundType?: NotificationType;
      soundManager?: SoundNotificationManager;
    } = {}
  ): Promise<void> {
    const hasPermission = await this.requestNotificationPermission();
    if (!hasPermission) {
      console.log('Notification permission denied');
      return;
    }
    
    const notification = new Notification(title, {
      body,
      icon: options.icon || '/favicon.ico',
      badge: options.badge || '/favicon.ico',
      tag: options.tag,
      requireInteraction: options.requireInteraction,
      silent: true // We'll handle sound ourselves
    });
    
    // Play our custom sound
    if (options.soundType && options.soundManager) {
      await options.soundManager.playNotification(options.soundType);
    }
    
    // Auto-close notification after 5 seconds unless it requires interaction
    if (!options.requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }
}

// Default sound manager instance
let defaultSoundManager: SoundNotificationManager | null = null;

export const getDefaultSoundManager = (settings?: NotificationSettings): SoundNotificationManager => {
  if (!defaultSoundManager || settings) {
    const defaultSettings = settings || {
      soundEnabled: true,
      volume: 0.5,
      statusAlerts: true,
      newOrderAlerts: true,
      urgentAlerts: true
    };
    defaultSoundManager = new SoundNotificationManager(defaultSettings);
  }
  return defaultSoundManager;
};

// Convenience functions
export const playNewOrderSound = async (settings?: NotificationSettings) => {
  const manager = getDefaultSoundManager(settings);
  await manager.playNotification('new_order');
};

export const playStatusUpdateSound = async (settings?: NotificationSettings) => {
  const manager = getDefaultSoundManager(settings);
  await manager.playNotification('status_update');
};

export const playUrgentAlertSound = async (settings?: NotificationSettings) => {
  const manager = getDefaultSoundManager(settings);
  await manager.playNotification('urgent_alert');
};

export const playOrderReadySound = async (settings?: NotificationSettings) => {
  const manager = getDefaultSoundManager(settings);
  await manager.playNotification('order_ready');
};

export const playPaymentSuccessSound = async (settings?: NotificationSettings) => {
  const manager = getDefaultSoundManager(settings);
  await manager.playNotification('payment_success');
};
