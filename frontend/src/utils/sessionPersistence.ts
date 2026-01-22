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

const DB_NAME = 'cottage_tandoori_pos_sessions';  // Separate DB to avoid collision with menuCacheDB
const DB_VERSION = 1;
const SESSION_STORE = 'active_sessions';

// One-time cleanup flag to delete corrupted databases
let cleanupPerformed = false;

/**
 * Delete old/corrupted IndexedDB databases on first run
 * This runs once per session to clean up migration issues
 */
async function performOneTimeCleanup(): Promise<void> {
  if (cleanupPerformed) return;
  cleanupPerformed = true;

  const databasesToDelete = [
    'cottage_tandoori_pos',  // Old conflicting DB name - safe to delete
    // Note: Do NOT delete 'cottage_tandoori_pos_sessions' - that's our current database
  ];

  for (const dbName of databasesToDelete) {
    try {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = () => {
          resolve();
        };
        request.onerror = () => {
          resolve(); // Continue even if delete fails
        };
        request.onblocked = () => {
          resolve();
        };
      });
    } catch (e) {
    }
  }

}

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
    // One-time cleanup to delete corrupted databases from previous versions
    await performOneTimeCleanup();

    // If db exists but is missing the object store, reset it
    if (this.db && !this.db.objectStoreNames.contains(SESSION_STORE)) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }

    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      let upgradeTransaction: IDBTransaction | null = null;

      request.onerror = () => {
        console.error(' [SessionDB] Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        upgradeTransaction = (event.target as IDBOpenDBRequest).transaction;
        
        if (!db.objectStoreNames.contains(SESSION_STORE)) {
          const store = db.createObjectStore(SESSION_STORE, { keyPath: 'sessionId' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;

        // If there was an upgrade, wait for its transaction to complete
        if (upgradeTransaction) {
          upgradeTransaction.oncomplete = () => {
            // Add extra delay to ensure object stores are fully available
            setTimeout(() => {
              resolve();
            }, 200);
          };
          upgradeTransaction.onerror = () => {
            console.error(' [SessionDB] Upgrade transaction failed');
            reject(upgradeTransaction?.error);
          };
        } else {
          // No upgrade needed - verify object store exists
          if (!this.db.objectStoreNames.contains(SESSION_STORE)) {
            // Object store doesn't exist - need to trigger upgrade by incrementing version
            this.db.close();
            this.db = null;

            // Re-open with incremented version to trigger onupgradeneeded
            const upgradeRequest = indexedDB.open(DB_NAME, DB_VERSION + 1);
            upgradeRequest.onerror = () => reject(upgradeRequest.error);
            upgradeRequest.onupgradeneeded = (evt) => {
              const db = (evt.target as IDBOpenDBRequest).result;
              if (!db.objectStoreNames.contains(SESSION_STORE)) {
                const store = db.createObjectStore(SESSION_STORE, { keyPath: 'sessionId' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
              }
            };
            upgradeRequest.onsuccess = () => {
              this.db = upgradeRequest.result;
              resolve();
            };
          } else {
            // Object store exists, we're good
            resolve();
          }
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
      
      return true;
    } catch (error) {
      console.error(' [SessionDB] Failed to save session:', error);
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
        return null;
      }

      const session = result.value as PersistedSession;
      const ageMinutes = Math.round((Date.now() - session.timestamp) / 1000 / 60);
      
      return session;
    } catch (error) {
      // Handle race condition: object store not immediately available after init
      if (error instanceof DOMException && error.name === 'NotFoundError' && retryCount < 2) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return this.loadSession(retryCount + 1);
      }
      
      console.error(' [SessionDB] Failed to load session:', error);
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
      
      return true;
    } catch (error) {
      console.error(' [SessionDB] Failed to delete session:', error);
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

      return true;
    } catch (error) {
      console.error(' [SessionDB] Failed to clear sessions:', error);
      return false;
    }
  }

  /**
   * Start auto-save (every 5 seconds)
   */
  startAutoSave(getSessionData: () => PersistedSession): void {
    if (this.autoSaveInterval) {
      return;
    }

    this.autoSaveInterval = setInterval(async () => {
      const session = getSessionData();
      
      // Only save if there are items in the order
      if (session.orderItems.length > 0) {
        await this.saveSession(session);
      }
    }, 5000); // Every 5 seconds

  }

  /**
   * Stop auto-save
   */
  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
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
