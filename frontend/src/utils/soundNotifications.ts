// Sound notification utilities
type NotificationType = 'new_order' | 'status_update' | 'urgent_alert' | 'order_ready' | 'payment_success';

interface NotificationSettings {
  soundEnabled: boolean;
  volume: number;
  statusAlerts: boolean;
  newOrderAlerts: boolean;
  urgentAlerts: boolean;
}

// Detect Electron mode for path resolution
const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;

// MP3 sound file path for online order notifications
// Use relative path in Electron (file:// protocol), absolute path in browser
const ONLINE_ORDER_MP3_PATH = isElectron
  ? './audio-sounds/online_order_notification_sound_pos.mp3'
  : '/audio-sounds/online_order_notification_sound_pos.mp3';

// Preloaded MP3 audio element (singleton)
let preloadedMp3Audio: HTMLAudioElement | null = null;

// Preload the MP3 file on module load
const preloadOnlineOrderMp3 = () => {
  if (typeof window === 'undefined') return;
  if (preloadedMp3Audio) return; // Already preloaded

  try {
    preloadedMp3Audio = new Audio(ONLINE_ORDER_MP3_PATH);
    preloadedMp3Audio.preload = 'auto';
    // Preload by loading metadata
    preloadedMp3Audio.load();
  } catch (error) {
    console.warn('Failed to preload online order MP3:', error);
  }
};

// Preload on module initialization
if (typeof window !== 'undefined') {
  // Delay preload slightly to not block initial render
  setTimeout(preloadOnlineOrderMp3, 1000);
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
  private mp3Audio: HTMLAudioElement | null = null;

  constructor(settings: NotificationSettings) {
    this.settings = settings;
    this.initMp3Audio();
  }

  private initMp3Audio() {
    if (typeof window === 'undefined') return;
    // Use the preloaded audio if available, otherwise create new
    if (preloadedMp3Audio) {
      this.mp3Audio = preloadedMp3Audio;
    } else {
      try {
        this.mp3Audio = new Audio(ONLINE_ORDER_MP3_PATH);
        this.mp3Audio.preload = 'auto';
      } catch (error) {
        console.warn('Failed to initialize MP3 audio:', error);
      }
    }
  }

  updateSettings(settings: NotificationSettings) {
    this.settings = settings;
  }

  /**
   * Play MP3 sound for new online orders
   * Falls back to beep sound if MP3 playback fails
   */
  async playNewOrderMP3(volume?: number): Promise<void> {
    if (!this.settings.soundEnabled) {
      return;
    }

    const effectiveVolume = volume !== undefined ? volume / 100 : this.settings.volume;

    // Try to play MP3 first
    if (this.mp3Audio) {
      try {
        this.mp3Audio.currentTime = 0;
        this.mp3Audio.volume = Math.max(0, Math.min(1, effectiveVolume));
        await this.mp3Audio.play();
        return; // Success - exit early
      } catch (error) {
        console.warn('MP3 playback failed, falling back to beep:', error);
        // Fall through to beep fallback
      }
    }

    // Fallback to programmatic beep
    await this.playNotification('new_order');
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
      return;
    }
    
    const notification = new Notification(title, {
      body,
      icon: options.icon,
      badge: options.badge,
      tag: options.tag,
      requireInteraction: options.requireInteraction,
      silent: true // We play our own custom sound
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

/**
 * Play MP3 sound for new online orders
 * This uses the custom MP3 file with fallback to beep
 */
export const playOnlineOrderMP3 = async (volume?: number, settings?: NotificationSettings) => {
  const manager = getDefaultSoundManager(settings);
  await manager.playNewOrderMP3(volume);
};
