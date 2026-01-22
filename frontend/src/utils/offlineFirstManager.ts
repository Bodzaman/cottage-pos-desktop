/**
 * Offline-First Manager - Desktop-First Architecture
 * 
 * Coordinates offline operation and synchronization for POSDesktop
 * Provides unified interface for offline-first data management
 * 
 * Responsibilities:
 * - Detect online/offline transitions
 * - Queue operations during offline periods
 * - Auto-sync when connection restored
 * - Provide offline status to UI
 * - Coordinate menu cache and session persistence
 * 
 * Architecture:
 * - Local-first: All operations work offline by default
 * - Outbox pattern: Queue operations for later sync
 * - Optimistic UI: Show success immediately, sync in background
 * - Conflict resolution: Last-write-wins (simple strategy)
 */

import { MenuCache } from './menuCacheDB';
import { SessionPersistence, PersistedSession } from './sessionPersistence';
import { BackgroundSync } from './backgroundSyncWorker';

export interface OfflineOperation {
  id: string;
  type: 'order_create' | 'order_update' | 'payment_process' | 'print_ticket';
  data: any;
  timestamp: number;
  retries: number;
}

export interface OfflineStatus {
  isOnline: boolean;
  lastOnlineAt: number | null;
  pendingOperations: number;
  syncInProgress: boolean;
  menuCacheAge: number | null; // Minutes since last cache update
  sessionRestored: boolean;
}

type StatusChangeListener = (status: OfflineStatus) => void;

/**
 * Offline-first manager for desktop POS
 */
class OfflineFirstManager {
  private isOnline = navigator.onLine;
  private lastOnlineAt: number | null = navigator.onLine ? Date.now() : null;
  private operationQueue: OfflineOperation[] = [];
  private listeners: StatusChangeListener[] = [];
  private sessionRestored = false;
  private isInitialized = false;

  /**
   * Initialize offline-first manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('⚠️ [OfflineFirst] Already initialized');
      return;
    }

    console.log('🚀 [OfflineFirst] Initializing offline-first manager');

    // Setup online/offline event listeners
    this.setupNetworkListeners();

    // Start background sync service
    BackgroundSync.start();

    // Queue initial menu sync task (low priority, runs when idle)
    BackgroundSync.queueTask({
      type: 'menu_update',
      priority: 2,
      data: {},
      maxRetries: 3
    });

    this.isInitialized = true;
    this.notifyListeners();

    console.log('✅ [OfflineFirst] Initialization complete');
  }

  /**
   * Shutdown offline-first manager
   */
  shutdown(): void {
    console.log('⏹️ [OfflineFirst] Shutting down');
    
    BackgroundSync.stop();
    SessionPersistence.stopAutoSave();
    
    this.isInitialized = false;
    console.log('✅ [OfflineFirst] Shutdown complete');
  }

  /**
   * Check if app is currently online
   */
  checkOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Get comprehensive offline status
   */
  async getStatus(): Promise<OfflineStatus> {
    const metadata = await MenuCache.getMetadata();
    const menuCacheAge = metadata 
      ? Math.round((Date.now() - metadata.lastSync) / 1000 / 60) 
      : null;

    const syncState = BackgroundSync.getState();

    return {
      isOnline: this.isOnline,
      lastOnlineAt: this.lastOnlineAt,
      pendingOperations: this.operationQueue.length + syncState.pendingTasks.length,
      syncInProgress: syncState.isSyncing,
      menuCacheAge,
      sessionRestored: this.sessionRestored
    };
  }

  /**
   * Queue an operation for offline execution
   */
  queueOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retries'>): void {
    const newOperation: OfflineOperation = {
      ...operation,
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0
    };

    this.operationQueue.push(newOperation);
    console.log(`📥 [OfflineFirst] Operation queued: ${newOperation.type} (${this.operationQueue.length} pending)`);
    
    this.notifyListeners();

    // If online, try to sync immediately
    if (this.isOnline) {
      this.processQueue();
    }
  }

  /**
   * Load menu data (cache-first strategy)
   */
  async loadMenuData(): Promise<any> {
    try {
      // Try cache first (instant load)
      const cachedData = await MenuCache.load();
      
      if (cachedData) {
        console.log('⚡ [OfflineFirst] Menu loaded from cache (instant)');
        return cachedData;
      }

      // No cache available, will need to fetch from network
      console.log('🌐 [OfflineFirst] No cache, network fetch required');
      return null;
    } catch (error) {
      console.error('❌ [OfflineFirst] Failed to load menu data:', error);
      return null;
    }
  }

  /**
   * Save menu data to cache
   */
  async saveMenuData(menuData: any): Promise<void> {
    try {
      await MenuCache.save(menuData);
      console.log('✅ [OfflineFirst] Menu data cached');
      this.notifyListeners();
    } catch (error) {
      console.error('❌ [OfflineFirst] Failed to cache menu data:', error);
    }
  }

  /**
   * Load persisted session (if any)
   */
  async loadSession(): Promise<PersistedSession | null> {
    try {
      const session = await SessionPersistence.load();
      
      if (session) {
        this.sessionRestored = true;
        this.notifyListeners();
      }
      
      return session;
    } catch (error) {
      console.error('❌ [OfflineFirst] Failed to load session:', error);
      return null;
    }
  }

  /**
   * Save current session
   */
  async saveSession(session: PersistedSession): Promise<void> {
    try {
      await SessionPersistence.save(session);
    } catch (error) {
      console.error('❌ [OfflineFirst] Failed to save session:', error);
    }
  }

  /**
   * Start auto-saving session
   */
  startSessionAutoSave(getSessionData: () => PersistedSession): void {
    SessionPersistence.startAutoSave(getSessionData);
  }

  /**
   * Clear saved session
   */
  async clearSession(sessionId: string): Promise<void> {
    try {
      await SessionPersistence.delete(sessionId);
      this.sessionRestored = false;
      this.notifyListeners();
    } catch (error) {
      console.error('❌ [OfflineFirst] Failed to clear session:', error);
    }
  }

  /**
   * Subscribe to status changes
   */
  subscribe(listener: StatusChangeListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Process queued operations
   */
  private async processQueue(): Promise<void> {
    if (!this.isOnline || this.operationQueue.length === 0) {
      return;
    }

    console.log(`🔄 [OfflineFirst] Processing ${this.operationQueue.length} queued operations`);

    const operations = [...this.operationQueue];
    this.operationQueue = [];

    for (const operation of operations) {
      try {
        await this.executeOperation(operation);
        console.log(`✅ [OfflineFirst] Operation completed: ${operation.type}`);
      } catch (error) {
        console.error(`❌ [OfflineFirst] Operation failed: ${operation.type}`, error);
        
        // Re-queue if under retry limit
        operation.retries++;
        if (operation.retries < 3) {
          this.operationQueue.push(operation);
        }
      }
    }

    this.notifyListeners();
  }

  /**
   * Execute a queued operation
   */
  private async executeOperation(operation: OfflineOperation): Promise<void> {
    switch (operation.type) {
      case 'order_create':
        // Placeholder: Submit order to backend
        console.log('📦 [OfflineFirst] Creating order:', operation.data);
        break;
      
      case 'payment_process':
        // Placeholder: Process payment
        console.log('💳 [OfflineFirst] Processing payment:', operation.data);
        break;
      
      case 'print_ticket':
        // Placeholder: Send to printer
        console.log('🖨️ [OfflineFirst] Printing ticket:', operation.data);
        break;
      
      default:
        console.warn(`⚠️ [OfflineFirst] Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Setup network event listeners
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      console.log('🌐 [OfflineFirst] Connection restored');
      this.isOnline = true;
      this.lastOnlineAt = Date.now();
      this.notifyListeners();
      
      // Process queued operations
      this.processQueue();
      
      // Trigger background sync
      BackgroundSync.queueTask({
        type: 'menu_update',
        priority: 1,
        data: {},
        maxRetries: 3
      });
    });

    window.addEventListener('offline', () => {
      console.log('📡 [OfflineFirst] Connection lost - entering offline mode');
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  /**
   * Notify all listeners of status change
   */
  private async notifyListeners(): Promise<void> {
    const status = await this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }
}

// Singleton instance
export const offlineFirstManager = new OfflineFirstManager();

/**
 * High-level API for offline-first operations
 */
export const OfflineFirst = {
  /**
   * Initialize manager
   */
  initialize: () => offlineFirstManager.initialize(),

  /**
   * Shutdown manager
   */
  shutdown: () => offlineFirstManager.shutdown(),

  /**
   * Check if online
   */
  isOnline: () => offlineFirstManager.checkOnlineStatus(),

  /**
   * Get status
   */
  getStatus: () => offlineFirstManager.getStatus(),

  /**
   * Queue operation
   */
  queueOperation: (operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retries'>) => 
    offlineFirstManager.queueOperation(operation),

  /**
   * Load menu data (cache-first)
   */
  loadMenuData: () => offlineFirstManager.loadMenuData(),

  /**
   * Save menu data
   */
  saveMenuData: (menuData: any) => offlineFirstManager.saveMenuData(menuData),

  /**
   * Load session
   */
  loadSession: () => offlineFirstManager.loadSession(),

  /**
   * Save session
   */
  saveSession: (session: PersistedSession) => offlineFirstManager.saveSession(session),

  /**
   * Start session auto-save
   */
  startSessionAutoSave: (getSessionData: () => PersistedSession) => 
    offlineFirstManager.startSessionAutoSave(getSessionData),

  /**
   * Clear session
   */
  clearSession: (sessionId: string) => offlineFirstManager.clearSession(sessionId),

  /**
   * Subscribe to status changes
   */
  subscribe: (listener: StatusChangeListener) => offlineFirstManager.subscribe(listener)
};
