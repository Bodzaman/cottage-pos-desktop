/**
 * Outbox Sync Manager
 * Handles queuing and synchronization of orders when offline
 *
 * DUAL-MODE PERSISTENCE:
 * - Web/Browser: Uses IndexedDB via offlineStorage
 * - Electron: Uses SQLite via IPC (SOLE source of truth, IndexedDB bypassed)
 *
 * This ensures queue state is crash-safe in Electron and prevents drift/double-sync.
 */

import { offlineStorage, OfflineOrder, OfflineSyncOperation } from './offlineStorage';
import brain from 'brain';
import { OrderItem } from './types';
import { getOfflineStatus, onOfflineStatusChange } from './serviceWorkerManager';
import { isElectronOfflineAvailable, getElectronAPI, ElectronOfflineOrderRecord } from '../types/electron';

const isDev = import.meta.env?.DEV;

// Sync operation types
export type SyncOperationType =
  | 'CREATE_ORDER'
  | 'UPDATE_ORDER_STATUS'
  | 'CREATE_PAYMENT'
  | 'UPDATE_TABLE_STATUS'
  | 'CREATE_PRINT_JOB';

// Sync operation data structure
export interface SyncOperationData {
  type: SyncOperationType;
  orderId?: string;
  tableNumber?: number;
  data: any;
  idempotencyKey: string;
  priority: number; // 1 = highest, 5 = lowest
  retryCount: number;
  maxRetries: number;
  createdAt: string;
}

// Sync result
export interface SyncResult {
  success: boolean;
  error?: string;
  serverResponse?: any;
  shouldRetry: boolean;
}

// Sync status
export interface OutboxSyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  failedOperations: number;
  lastSyncAttempt?: string;
  lastSuccessfulSync?: string;
  errors: string[];
}

class OutboxSyncManager {
  private isInitialized = false;
  private isSyncing = false;
  private syncInterval: number | null = null;
  private retryTimeouts = new Map<string, number>();
  private statusCallbacks: Array<(status: OutboxSyncStatus) => void> = [];
  private maxConcurrentSyncs = 3;
  private activeSyncs = new Set<string>();
  private useElectronPersistence = false;

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Determine persistence mode
      this.useElectronPersistence = isElectronOfflineAvailable();

      if (this.useElectronPersistence) {
        // Electron mode: SQLite is the SOLE source of truth
        // No IndexedDB initialization needed
        console.log('📦 [OutboxSync] Using Electron SQLite persistence (IndexedDB bypassed)');

        // Log current queue stats
        try {
          const response = await getElectronAPI()?.offlineOrderGetStats();
          if (response?.success && response.stats) {
            console.log('📦 [OutboxSync] SQLite queue stats:', response.stats);
          } else if (response?.error) {
            console.warn('📦 [OutboxSync] SQLite stats error:', response.error);
          }
        } catch (err) {
          console.warn('📦 [OutboxSync] Failed to get SQLite stats:', err);
        }
      } else {
        // Web mode: use IndexedDB
        await offlineStorage.initialize();
        console.log('📦 [OutboxSync] Using IndexedDB persistence');
      }

      // Set up offline status monitoring
      onOfflineStatusChange((isOffline) => {
        if (!isOffline) {
          // We're back online, start syncing
          this.startPeriodicSync();
        } else {
          // We're offline, stop syncing
          this.stopPeriodicSync();
        }
        this.notifyStatusCallbacks();
      });

      // If we're currently online, start syncing
      if (!getOfflineStatus()) {
        this.startPeriodicSync();
      }

      this.isInitialized = true;
      if (isDev) console.log('✅ [OutboxSync] Initialized successfully');

    } catch (error) {
      console.error('❌ [OutboxSync] Initialization failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // OUTBOX OPERATIONS
  // ============================================================================

  /**
   * Queue an order for creation when online
   */
  async queueOrderCreation(orderData: {
    order_type: 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
    table_number?: number;
    guest_count?: number;
    items: OrderItem[];
    total_amount: number;
    customer_data?: any;
    payment_method?: string;
  }): Promise<string> {

    const orderId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const idempotencyKey = `create_order_${orderId}`;

    if (this.useElectronPersistence) {
      // Electron mode: write ONLY to SQLite
      const electronAPI = getElectronAPI();
      if (!electronAPI) {
        throw new Error('Electron API not available');
      }

      const response = await electronAPI.offlineOrderEnqueue({
        id: orderId,
        idempotency_key: idempotencyKey,
        local_id: orderId,
        order_data: orderData
      });

      // IPC returns { success: true, order: {...} }
      if (!response?.success) {
        throw new Error('Failed to enqueue order to SQLite');
      }

      if (isDev) console.log(`📤 [OutboxSync] Queued order to SQLite: ${orderId}`);
    } else {
      // Web mode: use IndexedDB
      const offlineOrder: OfflineOrder = {
        id: orderId,
        ...orderData,
        status: 'PENDING_SYNC',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sync_attempts: 0
      };

      await offlineStorage.saveOrder(offlineOrder);

      await offlineStorage.addSyncOperation({
        type: 'CREATE_ORDER',
        data: {
          orderId,
          orderData,
          idempotencyKey
        },
        status: 'PENDING',
        retry_count: 0
      });

      if (isDev) console.log(`📤 [OutboxSync] Queued order to IndexedDB: ${orderId}`);
    }

    this.notifyStatusCallbacks();

    // Try immediate sync if online
    if (!getOfflineStatus()) {
      this.triggerSync();
    }

    return orderId;
  }

  /**
   * Queue order status update
   */
  async queueOrderStatusUpdate(orderId: string, status: string, notes?: string): Promise<void> {
    const idempotencyKey = `update_order_${orderId}_${status}_${Date.now()}`;

    // Note: Status updates are less critical for crash recovery
    // For now, just use IndexedDB in both modes (can be enhanced later)
    await offlineStorage.addSyncOperation({
      type: 'UPDATE_ORDER',
      data: {
        orderId,
        status,
        notes,
        idempotencyKey
      },
      status: 'PENDING',
      retry_count: 0
    });

    if (isDev) console.log(`📤 [OutboxSync] Queued order status update: ${orderId} -> ${status}`);
    this.notifyStatusCallbacks();

    if (!getOfflineStatus()) {
      this.triggerSync();
    }
  }

  /**
   * Queue payment creation
   */
  async queuePaymentCreation(orderId: string, paymentData: any): Promise<void> {
    const idempotencyKey = `create_payment_${orderId}_${Date.now()}`;

    await offlineStorage.addSyncOperation({
      type: 'CREATE_PAYMENT',
      data: {
        orderId,
        paymentData,
        idempotencyKey
      },
      status: 'PENDING',
      retry_count: 0
    });

    if (isDev) console.log(`📤 [OutboxSync] Queued payment creation: ${orderId}`);
    this.notifyStatusCallbacks();

    if (!getOfflineStatus()) {
      this.triggerSync();
    }
  }

  // ============================================================================
  // SYNCHRONIZATION
  // ============================================================================

  /**
   * Start periodic synchronization
   */
  private startPeriodicSync(): void {
    if (this.syncInterval) return;

    // Sync every 30 seconds when online
    this.syncInterval = window.setInterval(() => {
      this.triggerSync();
    }, 30000);

    // Do an immediate sync
    this.triggerSync();
  }

  /**
   * Stop periodic synchronization
   */
  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Trigger synchronization process
   */
  async triggerSync(): Promise<void> {
    if (this.isSyncing || getOfflineStatus()) {
      return;
    }

    this.isSyncing = true;
    this.notifyStatusCallbacks();

    try {
      if (this.useElectronPersistence) {
        // Electron mode: sync from SQLite
        await this.triggerSyncElectron();
      } else {
        // Web mode: sync from IndexedDB
        await this.triggerSyncIndexedDB();
      }
    } catch (error) {
      console.error('❌ [OutboxSync] Sync process failed:', error);
    } finally {
      this.isSyncing = false;
      this.notifyStatusCallbacks();
    }
  }

  /**
   * Sync orders from SQLite (Electron mode)
   */
  private async triggerSyncElectron(): Promise<void> {
    const electronAPI = getElectronAPI();
    if (!electronAPI) return;

    // Get pending orders from SQLite
    const response = await electronAPI.offlineOrderList('pending');

    // IPC returns { success: true, orders: [...] }
    if (!response?.success || !response.orders) {
      if (isDev) console.log('ℹ️ [OutboxSync] Failed to get pending orders from SQLite');
      return;
    }

    const pendingOrders = response.orders;

    if (pendingOrders.length === 0) {
      if (isDev) console.log('ℹ️ [OutboxSync] No pending orders in SQLite');
      return;
    }

    if (isDev) console.log(`🔄 [OutboxSync] Starting sync of ${pendingOrders.length} orders from SQLite`);

    // Process each order
    for (const order of pendingOrders) {
      if (this.activeSyncs.has(order.id)) {
        continue; // Already processing
      }

      this.activeSyncs.add(order.id);

      try {
        await this.syncOrderFromSQLite(order);
      } catch (error) {
        console.error(`❌ [OutboxSync] Error syncing order ${order.id}:`, error);
      } finally {
        this.activeSyncs.delete(order.id);
      }
    }
  }

  /**
   * Sync a single order from SQLite
   */
  private async syncOrderFromSQLite(order: ElectronOfflineOrderRecord): Promise<void> {
    const electronAPI = getElectronAPI();
    if (!electronAPI) return;

    try {
      // Parse order data
      const orderData = typeof order.order_data === 'string'
        ? JSON.parse(order.order_data)
        : order.order_data;

      if (isDev) console.log(`🔄 [OutboxSync] Syncing order ${order.local_id} from SQLite`);

      // Call the backend to create the order
      const response = await (brain as any).place_order({
        order_type: orderData.order_type,
        table_number: orderData.table_number,
        guest_count: orderData.guest_count,
        items: orderData.items,
        total_amount: orderData.total_amount,
        customer_data: orderData.customer_data,
        payment_method: orderData.payment_method,
        idempotency_key: order.idempotency_key
      });

      const result = await response.json();

      if (response.ok) {
        // Mark as synced in SQLite
        const serverId = result.order?.id || result.id || 'unknown';
        await electronAPI.offlineOrderMarkSynced(order.id, serverId);
        if (isDev) console.log(`✅ [OutboxSync] Order synced: ${order.id} -> ${serverId}`);
      } else {
        const errorMessage = result.detail || 'Failed to create order';

        // Check if we should retry
        const shouldRetry = response.status >= 500;

        if (shouldRetry && order.retry_count < 5) {
          // Will be retried on next sync cycle
          if (isDev) console.log(`⏳ [OutboxSync] Order ${order.id} will retry (attempt ${order.retry_count + 1})`);
        } else {
          // Mark as failed in SQLite
          await electronAPI.offlineOrderMarkFailed(order.id, errorMessage);
          console.error(`❌ [OutboxSync] Order failed: ${order.id} - ${errorMessage}`);
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';

      // Mark as failed after max retries
      if (order.retry_count >= 4) {
        await electronAPI.offlineOrderMarkFailed(order.id, errorMessage);
        console.error(`❌ [OutboxSync] Order failed after retries: ${order.id}`);
      } else {
        if (isDev) console.log(`⏳ [OutboxSync] Order ${order.id} network error, will retry`);
      }
    }
  }

  /**
   * Sync orders from IndexedDB (Web mode)
   */
  private async triggerSyncIndexedDB(): Promise<void> {
    const pendingOps = await offlineStorage.getPendingSyncOperations();

    if (pendingOps.length === 0) {
      if (isDev) console.log('ℹ️ [OutboxSync] No pending operations to sync');
      return;
    }

    if (isDev) console.log(`🔄 [OutboxSync] Starting sync of ${pendingOps.length} operations`);

    // Process operations in priority order
    const sortedOps = pendingOps.sort((a, b) => {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    // Process operations with concurrency limit
    await this.processSyncOperationsBatch(sortedOps);
  }

  /**
   * Process sync operations in batches (IndexedDB mode)
   */
  private async processSyncOperationsBatch(operations: OfflineSyncOperation[]): Promise<void> {
    const chunks = [];
    for (let i = 0; i < operations.length; i += this.maxConcurrentSyncs) {
      chunks.push(operations.slice(i, i + this.maxConcurrentSyncs));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(op => this.processSyncOperation(op));
      await Promise.allSettled(promises);

      // Small delay between batches to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Process a single sync operation (IndexedDB mode)
   */
  private async processSyncOperation(operation: OfflineSyncOperation): Promise<void> {
    if (this.activeSyncs.has(operation.id)) {
      return; // Already processing this operation
    }

    this.activeSyncs.add(operation.id);

    try {
      if (isDev) console.log(`🔄 [OutboxSync] Processing ${operation.type}: ${operation.id}`);

      await offlineStorage.updateSyncOperation(operation.id, {
        status: 'PROCESSING',
        last_attempt: new Date().toISOString()
      });

      const result = await this.executeSyncOperation(operation);

      if (result.success) {
        await offlineStorage.updateSyncOperation(operation.id, {
          status: 'COMPLETED'
        });
        if (isDev) console.log(`✅ [OutboxSync] Completed ${operation.type}: ${operation.id}`);
      } else {
        const newRetryCount = operation.retry_count + 1;
        const shouldRetry = result.shouldRetry && newRetryCount < 5;

        if (shouldRetry) {
          // Schedule retry with exponential backoff
          const retryDelay = Math.min(1000 * Math.pow(2, newRetryCount), 30000);

          await offlineStorage.updateSyncOperation(operation.id, {
            status: 'PENDING',
            retry_count: newRetryCount,
            error_message: result.error
          });

          setTimeout(() => {
            this.triggerSync();
          }, retryDelay);

          if (isDev) console.log(`⏳ [OutboxSync] Retrying ${operation.type} in ${retryDelay}ms: ${operation.id}`);
        } else {
          await offlineStorage.updateSyncOperation(operation.id, {
            status: 'FAILED',
            error_message: result.error
          });
          console.error(`❌ [OutboxSync] Failed ${operation.type}: ${operation.id} - ${result.error}`);
        }
      }

    } catch (error) {
      console.error(`❌ [OutboxSync] Error processing operation ${operation.id}:`, error);

      await offlineStorage.updateSyncOperation(operation.id, {
        status: 'FAILED',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      this.activeSyncs.delete(operation.id);
    }
  }

  /**
   * Execute a specific sync operation (IndexedDB mode)
   */
  private async executeSyncOperation(operation: OfflineSyncOperation): Promise<SyncResult> {
    const { type, data } = operation;

    try {
      switch (type) {
        case 'CREATE_ORDER':
          return await this.syncCreateOrder(data);

        case 'UPDATE_ORDER':
          return await this.syncUpdateOrderStatus(data);

        case 'CREATE_PAYMENT':
          return await this.syncCreatePayment(data);

        default:
          return {
            success: false,
            error: `Unknown operation type: ${type}`,
            shouldRetry: false
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        shouldRetry: true
      };
    }
  }

  // ============================================================================
  // SYNC OPERATION HANDLERS (IndexedDB mode)
  // ============================================================================

  private async syncCreateOrder(data: any): Promise<SyncResult> {
    try {
      const response = await (brain as any).place_order({
        order_type: data.orderData.order_type,
        table_number: data.orderData.table_number,
        guest_count: data.orderData.guest_count,
        items: data.orderData.items,
        total_amount: data.orderData.total_amount,
        customer_data: data.orderData.customer_data,
        payment_method: data.orderData.payment_method,
        idempotency_key: data.idempotencyKey
      });

      const result = await response.json();

      if (response.ok) {
        // Update local order with server ID
        await offlineStorage.updateOrderSyncStatus(data.orderId, 'SYNCED');

        return {
          success: true,
          serverResponse: result,
          shouldRetry: false
        };
      } else {
        return {
          success: false,
          error: result.detail || 'Failed to create order',
          shouldRetry: response.status >= 500
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        shouldRetry: true
      };
    }
  }

  private async syncUpdateOrderStatus(data: any): Promise<SyncResult> {
    try {
      const response = await (brain as any).update_order_status({
        order_id: data.orderId,
        status: data.status,
        notes: data.notes,
        idempotency_key: data.idempotencyKey
      });

      if (response.ok) {
        return { success: true, shouldRetry: false };
      } else {
        const result = await response.json();
        return {
          success: false,
          error: result.detail || 'Failed to update order status',
          shouldRetry: response.status >= 500
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        shouldRetry: true
      };
    }
  }

  private async syncCreatePayment(data: any): Promise<SyncResult> {
    try {
      const response = await (brain as any).process_payment2({
        order_id: data.orderId,
        payment_method: data.paymentData.payment_method,
        amount: data.paymentData.amount,
        idempotency_key: data.idempotencyKey
      });

      if (response.ok) {
        return { success: true, shouldRetry: false };
      } else {
        const result = await response.json();
        return {
          success: false,
          error: result.detail || 'Failed to process payment',
          shouldRetry: response.status >= 500
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        shouldRetry: true
      };
    }
  }

  // ============================================================================
  // STATUS AND MONITORING
  // ============================================================================

  async getStatus(): Promise<OutboxSyncStatus> {
    if (this.useElectronPersistence) {
      // Electron mode: read ONLY from SQLite
      try {
        const electronAPI = getElectronAPI();
        const response = await electronAPI?.offlineOrderGetStats();

        // IPC returns { success: true, stats: {...} }
        if (response?.success && response.stats) {
          const stats = response.stats;
          return {
            isOnline: !getOfflineStatus(),
            isSyncing: this.isSyncing,
            pendingOperations: (stats.pending || 0) + (stats.syncing || 0),
            failedOperations: stats.failed || 0,
            lastSyncAttempt: stats.oldest_pending || undefined,
            errors: []
          };
        }
      } catch (error) {
        console.error('⚠️ [OutboxSync] Failed to get SQLite stats:', error);
      }

      // Fallback if SQLite fails
      return {
        isOnline: !getOfflineStatus(),
        isSyncing: this.isSyncing,
        pendingOperations: 0,
        failedOperations: 0,
        errors: ['Failed to read queue status']
      };
    }

    // Web mode: read from IndexedDB
    const pendingOps = await offlineStorage.getPendingSyncOperations();
    const allOps = await (offlineStorage as any).getSyncOperations?.() || [];
    const failedOps = allOps.filter((op: any) => op.status === 'FAILED');

    return {
      isOnline: !getOfflineStatus(),
      isSyncing: this.isSyncing,
      pendingOperations: pendingOps.length,
      failedOperations: failedOps.length,
      lastSyncAttempt: pendingOps.length > 0 ? pendingOps[0].last_attempt : undefined,
      errors: failedOps.slice(0, 5).map((op: any) => op.error_message || 'Unknown error')
    };
  }

  onStatusChange(callback: (status: OutboxSyncStatus) => void): () => void {
    this.statusCallbacks.push(callback);

    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  private async notifyStatusCallbacks(): Promise<void> {
    if (this.statusCallbacks.length === 0) return;

    try {
      const status = await this.getStatus();
      this.statusCallbacks.forEach(callback => {
        try {
          callback(status);
        } catch (error) {
          console.error('❌ [OutboxSync] Error in status callback:', error);
        }
      });
    } catch (error) {
      console.error('❌ [OutboxSync] Error getting status for callbacks:', error);
    }
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  async cleanup(): Promise<void> {
    this.stopPeriodicSync();

    // Clear retry timeouts
    this.retryTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.retryTimeouts.clear();

    // Clean up old completed operations (IndexedDB only, SQLite has its own cleanup)
    if (!this.useElectronPersistence) {
      await offlineStorage.cleanupOldData(7); // Keep 7 days of data
    }
  }
}

// Singleton instance
export const outboxSyncManager = new OutboxSyncManager();

// Auto-initialize
outboxSyncManager.initialize().catch(error => {
  console.error('❌ Failed to initialize outbox sync manager:', error);
});
