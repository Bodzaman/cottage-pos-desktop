/**
 * Session Persistence - Desktop-First Architecture
 * 
 * Preserves active POS session state across app restarts/crashes
 * Prevents data loss from unexpected shutdowns
 * 
 * What's Persisted:
 * - Active order items with modifiers and customizations
 * - Customer data (name, phone, address)
 * - Order type and table selection
 * - Guest count and special notes
 * 
 * Storage: IndexedDB (persistent, survives app restarts)
 * Update Frequency: Every 5 seconds during active order
 * Restoration: Automatic on app startup with user prompt
 */

import { OrderItem } from './menuTypes';
import { CustomerData } from './customerDataStore';

const DB_NAME = 'cottage_tandoori_pos';
const DB_VERSION = 1;
const SESSION_STORE = 'active_sessions';

export interface PersistedSession {
  sessionId: string; // Unique session identifier
  timestamp: number; // Last update timestamp
  
  // Order state
  orderItems: OrderItem[];
  orderType: 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
  selectedTableNumber: number | null;
  guestCount: number;
  
  // Customer data
  customerData: CustomerData;
  
  // Order totals (for display only)
  subtotal: number;
  tax: number;
  total: number;
}

/**
 * IndexedDB wrapper for session persistence
 */
class SessionPersistenceDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private currentSessionId: string | null = null;

  /**
   * Initialize IndexedDB connection
   */
  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      let upgradeTransaction: IDBTransaction | null = null;

      request.onerror = () => {
        console.error('❌ [SessionDB] Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        upgradeTransaction = (event.target as IDBOpenDBRequest).transaction;
        
        if (!db.objectStoreNames.contains(SESSION_STORE)) {
          const store = db.createObjectStore(SESSION_STORE, { keyPath: 'sessionId' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('📦 [SessionDB] Created active_sessions store');
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        
        // If there was an upgrade, wait for its transaction to complete
        if (upgradeTransaction) {
          upgradeTransaction.oncomplete = () => {
            // Add extra delay to ensure object stores are fully available
            setTimeout(() => {
              console.log('✅ [SessionDB] IndexedDB initialized (with upgrade)');
              resolve();
            }, 200);
          };
          upgradeTransaction.onerror = () => {
            console.error('❌ [SessionDB] Upgrade transaction failed');
            reject(upgradeTransaction?.error);
          };
        } else {
          // No upgrade needed, but wait a tick to ensure DB is fully ready
          setTimeout(() => {
            console.log('✅ [SessionDB] IndexedDB initialized');
            resolve();
          }, 50);
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Save current session state
   */
  async saveSession(session: PersistedSession): Promise<boolean> {
    try {
      await this.init();
      if (!this.db) throw new Error('Database not initialized');

      const transaction = this.db.transaction([SESSION_STORE], 'readwrite');
      const store = transaction.objectStore(SESSION_STORE);

      await this.promisifyRequest(store.put(session));
      
      console.log(`💾 [SessionDB] Session saved (${session.orderItems.length} items, ${session.orderType})`);
      return true;
    } catch (error) {
      console.error('❌ [SessionDB] Failed to save session:', error);
      return false;
    }
  }

  /**
   * Load most recent session
   * @param retryCount Internal parameter for retry logic
   */
  async loadSession(retryCount = 0): Promise<PersistedSession | null> {
    try {
      await this.init();
      if (!this.db) throw new Error('Database not initialized');

      const transaction = this.db.transaction([SESSION_STORE], 'readonly');
      const store = transaction.objectStore(SESSION_STORE);
      const index = store.index('timestamp');

      // Get all sessions ordered by timestamp
      const request = index.openCursor(null, 'prev'); // Most recent first
      const result = await this.promisifyRequest(request);

      if (!result) {
        console.log('ℹ️ [SessionDB] No saved session found');
        return null;
      }

      const session = result.value as PersistedSession;
      const ageMinutes = Math.round((Date.now() - session.timestamp) / 1000 / 60);
      
      console.log(`✅ [SessionDB] Loaded session from ${ageMinutes} minutes ago (${session.orderItems.length} items)`);
      return session;
    } catch (error) {
      // Handle race condition: object store not immediately available after init
      if (error instanceof DOMException && error.name === 'NotFoundError' && retryCount < 2) {
        console.warn(`⚠️ [SessionDB] Object store not ready, retrying in 100ms... (attempt ${retryCount + 1}/2)`);
        await new Promise(resolve => setTimeout(resolve, 100));
        return this.loadSession(retryCount + 1);
      }
      
      console.error('❌ [SessionDB] Failed to load session:', error);
      return null;
    }
  }

  /**
   * Delete a specific session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      await this.init();
      if (!this.db) throw new Error('Database not initialized');

      const transaction = this.db.transaction([SESSION_STORE], 'readwrite');
      const store = transaction.objectStore(SESSION_STORE);

      await this.promisifyRequest(store.delete(sessionId));
      
      console.log(`🗑️ [SessionDB] Session deleted: ${sessionId}`);
      return true;
    } catch (error) {
      console.error('❌ [SessionDB] Failed to delete session:', error);
      return false;
    }
  }

  /**
   * Clear all saved sessions
   */
  async clearAllSessions(): Promise<boolean> {
    try {
      await this.init();
      if (!this.db) throw new Error('Database not initialized');

      const transaction = this.db.transaction([SESSION_STORE], 'readwrite');
      await this.promisifyRequest(transaction.objectStore(SESSION_STORE).clear());

      console.log('✅ [SessionDB] All sessions cleared');
      return true;
    } catch (error) {
      console.error('❌ [SessionDB] Failed to clear sessions:', error);
      return false;
    }
  }

  /**
   * Start auto-save (every 5 seconds)
   */
  startAutoSave(getSessionData: () => PersistedSession): void {
    if (this.autoSaveInterval) {
      console.warn('⚠️ [SessionDB] Auto-save already running');
      return;
    }

    this.autoSaveInterval = setInterval(async () => {
      const session = getSessionData();
      
      // Only save if there are items in the order
      if (session.orderItems.length > 0) {
        await this.saveSession(session);
      }
    }, 5000); // Every 5 seconds

    console.log('⏱️ [SessionDB] Auto-save started (5s interval)');
  }

  /**
   * Stop auto-save
   */
  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log('⏹️ [SessionDB] Auto-save stopped');
    }
  }

  /**
   * Convert IDBRequest to Promise
   */
  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Close database and cleanup
   */
  close(): void {
    this.stopAutoSave();
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
      console.log('🔒 [SessionDB] Database closed');
    }
  }
}

// Singleton instance
export const sessionDB = new SessionPersistenceDB();

/**
 * High-level API for session persistence
 */
export const SessionPersistence = {
  /**
   * Save current session
   */
  save: (session: PersistedSession) => sessionDB.saveSession(session),

  /**
   * Load most recent session
   */
  load: () => sessionDB.loadSession(),

  /**
   * Delete session
   */
  delete: (sessionId: string) => sessionDB.deleteSession(sessionId),

  /**
   * Clear all sessions
   */
  clearAll: () => sessionDB.clearAllSessions(),

  /**
   * Start auto-save
   */
  startAutoSave: (getSessionData: () => PersistedSession) => 
    sessionDB.startAutoSave(getSessionData),

  /**
   * Stop auto-save
   */
  stopAutoSave: () => sessionDB.stopAutoSave(),

  /**
   * Close database
   */
  close: () => sessionDB.close()
};

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
