/**
 * Offline Storage Manager
 * 
 * Provides SQLite-like storage for offline POS operations using IndexedDB
 * Handles local order storage, menu caching, and sync queue management
 */

import { OrderItem, MenuItem } from './menuTypes';

// Types for offline storage
export interface OfflineOrder {
  id: string;
  order_type: 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
  table_number?: number;
  guest_count?: number;
  items: OrderItem[];
  total_amount: number;
  customer_data?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    address?: string;
    street?: string;
    postcode?: string;
  };
  payment_method?: string;
  status: 'PENDING_SYNC' | 'SYNCED' | 'FAILED_SYNC';
  created_at: string;
  updated_at: string;
  sync_attempts: number;
  last_sync_attempt?: string;
  sync_error?: string;
}

export interface OfflineMenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_id: string;
  image_url?: string;
  active: boolean;
  variants?: any[];
  customizations?: any[];
  allergens?: string[];
  cached_at: string;
}

export interface OfflineSyncOperation {
  id: string;
  type: 'CREATE_ORDER' | 'UPDATE_ORDER' | 'CREATE_PAYMENT' | 'UPDATE_MENU';
  data: any;
  created_at: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  retry_count: number;
  last_attempt?: string;
  error_message?: string;
}

class OfflineStorageManager {
  private dbName = 'CottageTandooriPOS';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Orders store
        if (!db.objectStoreNames.contains('orders')) {
          const ordersStore = db.createObjectStore('orders', { keyPath: 'id' });
          ordersStore.createIndex('status', 'status', { unique: false });
          ordersStore.createIndex('created_at', 'created_at', { unique: false });
          ordersStore.createIndex('order_type', 'order_type', { unique: false });
        }

        // Menu items store
        if (!db.objectStoreNames.contains('menu_items')) {
          const menuStore = db.createObjectStore('menu_items', { keyPath: 'id' });
          menuStore.createIndex('category_id', 'category_id', { unique: false });
          menuStore.createIndex('active', 'active', { unique: false });
        }

        // Sync operations store
        if (!db.objectStoreNames.contains('sync_operations')) {
          const syncStore = db.createObjectStore('sync_operations', { keyPath: 'id' });
          syncStore.createIndex('status', 'status', { unique: false });
          syncStore.createIndex('type', 'type', { unique: false });
          syncStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // Print queue store
        if (!db.objectStoreNames.contains('print_queue')) {
          const printStore = db.createObjectStore('print_queue', { keyPath: 'id' });
          printStore.createIndex('status', 'status', { unique: false });
          printStore.createIndex('created_at', 'created_at', { unique: false });
        }
      };
    });
  }

  // ============================================================================
  // ORDER MANAGEMENT
  // ============================================================================

  async saveOrder(order: OfflineOrder): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['orders'], 'readwrite');
      const store = transaction.objectStore('orders');
      
      const request = store.put(order);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save order'));
    });
  }

  async getOrders(status?: string): Promise<OfflineOrder[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['orders'], 'readonly');
      const store = transaction.objectStore('orders');
      
      let request: IDBRequest;
      
      if (status) {
        const index = store.index('status');
        request = index.getAll(status);
      } else {
        request = store.getAll();
      }
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to get orders'));
    });
  }

  async updateOrderSyncStatus(orderId: string, status: OfflineOrder['status'], error?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const order = await this.getOrder(orderId);
    if (!order) throw new Error('Order not found');

    order.status = status;
    order.updated_at = new Date().toISOString();
    order.last_sync_attempt = new Date().toISOString();
    
    if (error) {
      order.sync_error = error;
      order.sync_attempts += 1;
    } else if (status === 'SYNCED') {
      order.sync_error = undefined;
    }

    await this.saveOrder(order);
  }

  async getOrder(orderId: string): Promise<OfflineOrder | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['orders'], 'readonly');
      const store = transaction.objectStore('orders');
      
      const request = store.get(orderId);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('Failed to get order'));
    });
  }

  // ============================================================================
  // MENU CACHING
  // ============================================================================

  async cacheMenuItems(items: OfflineMenuItem[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['menu_items'], 'readwrite');
      const store = transaction.objectStore('menu_items');
      
      // Clear existing items first
      store.clear();
      
      // Add new items
      let completed = 0;
      const total = items.length;
      
      if (total === 0) {
        resolve();
        return;
      }
      
      items.forEach(item => {
        const request = store.add(item);
        
        request.onsuccess = () => {
          completed++;
          if (completed === total) resolve();
        };
        
        request.onerror = () => reject(new Error('Failed to cache menu item'));
      });
    });
  }

  async getCachedMenuItems(): Promise<OfflineMenuItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['menu_items'], 'readonly');
      const store = transaction.objectStore('menu_items');
      
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to get cached menu items'));
    });
  }

  async isCacheValid(maxAgeHours: number = 24): Promise<boolean> {
    const items = await this.getCachedMenuItems();
    
    if (items.length === 0) return false;
    
    const oldestItem = items.reduce((oldest, item) => {
      const itemTime = new Date(item.cached_at).getTime();
      const oldestTime = new Date(oldest.cached_at).getTime();
      return itemTime < oldestTime ? item : oldest;
    });
    
    const ageHours = (Date.now() - new Date(oldestItem.cached_at).getTime()) / (1000 * 60 * 60);
    return ageHours < maxAgeHours;
  }

  // ============================================================================
  // SYNC OPERATIONS QUEUE
  // ============================================================================

  async addSyncOperation(operation: Omit<OfflineSyncOperation, 'id' | 'created_at'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const operationWithId: OfflineSyncOperation = {
      ...operation,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_operations'], 'readwrite');
      const store = transaction.objectStore('sync_operations');
      
      const request = store.add(operationWithId);
      
      request.onsuccess = () => resolve(operationWithId.id);
      request.onerror = () => reject(new Error('Failed to add sync operation'));
    });
  }

  async getPendingSyncOperations(): Promise<OfflineSyncOperation[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_operations'], 'readonly');
      const store = transaction.objectStore('sync_operations');
      const index = store.index('status');
      
      const request = index.getAll('PENDING');
      
      request.onsuccess = () => {
        // Sort by created_at to process oldest first
        const operations = request.result.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        resolve(operations);
      };
      
      request.onerror = () => reject(new Error('Failed to get pending sync operations'));
    });
  }

  async updateSyncOperation(operationId: string, updates: Partial<OfflineSyncOperation>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_operations'], 'readwrite');
      const store = transaction.objectStore('sync_operations');
      
      const getRequest = store.get(operationId);
      
      getRequest.onsuccess = () => {
        const operation = getRequest.result;
        if (!operation) {
          reject(new Error('Sync operation not found'));
          return;
        }
        
        const updatedOperation = { ...operation, ...updates };
        
        const putRequest = store.put(updatedOperation);
        
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(new Error('Failed to update sync operation'));
      };
      
      getRequest.onerror = () => reject(new Error('Failed to get sync operation'));
    });
  }

  // ============================================================================
  // CLEANUP UTILITIES
  // ============================================================================

  async cleanupOldData(daysToKeep: number = 30): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffString = cutoffDate.toISOString();

    // Clean up old synced orders
    const orders = await this.getOrders('SYNCED');
    const oldOrders = orders.filter(order => order.created_at < cutoffString);
    
    for (const order of oldOrders) {
      await this.deleteOrder(order.id);
    }

    // Clean up completed sync operations
    const syncOps = await this.getCompletedSyncOperations();
    const oldSyncOps = syncOps.filter(op => op.created_at < cutoffString);
    
    for (const op of oldSyncOps) {
      await this.deleteSyncOperation(op.id);
    }
  }

  private async deleteOrder(orderId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['orders'], 'readwrite');
      const store = transaction.objectStore('orders');
      
      const request = store.delete(orderId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete order'));
    });
  }

  private async getCompletedSyncOperations(): Promise<OfflineSyncOperation[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_operations'], 'readonly');
      const store = transaction.objectStore('sync_operations');
      const index = store.index('status');
      
      const request = index.getAll('COMPLETED');
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to get completed sync operations'));
    });
  }

  private async deleteSyncOperation(operationId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_operations'], 'readwrite');
      const store = transaction.objectStore('sync_operations');
      
      const request = store.delete(operationId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete sync operation'));
    });
  }

  // ============================================================================
  // STATS & MONITORING
  // ============================================================================

  async getStorageStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    syncedOrders: number;
    failedOrders: number;
    cachedMenuItems: number;
    pendingSyncOps: number;
    cacheAge?: string;
  }> {
    const allOrders = await this.getOrders();
    const menuItems = await this.getCachedMenuItems();
    const pendingSyncOps = await this.getPendingSyncOperations();
    
    const stats = {
      totalOrders: allOrders.length,
      pendingOrders: allOrders.filter(o => o.status === 'PENDING_SYNC').length,
      syncedOrders: allOrders.filter(o => o.status === 'SYNCED').length,
      failedOrders: allOrders.filter(o => o.status === 'FAILED_SYNC').length,
      cachedMenuItems: menuItems.length,
      pendingSyncOps: pendingSyncOps.length,
      cacheAge: undefined as string | undefined
    };
    
    if (menuItems.length > 0) {
      const oldestCache = menuItems.reduce((oldest, item) => {
        const itemTime = new Date(item.cached_at).getTime();
        const oldestTime = new Date(oldest.cached_at).getTime();
        return itemTime < oldestTime ? item : oldest;
      });
      
      const ageHours = (Date.now() - new Date(oldestCache.cached_at).getTime()) / (1000 * 60 * 60);
      stats.cacheAge = `${Math.round(ageHours)} hours ago`;
    }
    
    return stats;
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorageManager();

// Auto-initialize on import
offlineStorage.initialize().catch(error => {
  console.error('❌ Failed to initialize offline storage:', error);
});
