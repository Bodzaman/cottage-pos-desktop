/**
 * Offline Sync Manager
 *
 * Handles bi-directional synchronization between local storage and Supabase backend
 * Provides conflict resolution and graceful degradation for offline operations
 */

import brain from 'brain';
import { offlineStorage, OfflineOrder, OfflineSyncOperation } from './offlineStorage';
import { MenuItem } from './types';

export interface SyncStatus {
  isOnline: boolean;
  lastSyncAttempt?: Date;
  lastSuccessfulSync?: Date;
  pendingOperations: number;
  failedOperations: number;
  isCurrentlySyncing: boolean;
  syncError?: string;
}

export interface ConflictResolution {
  strategy: 'LOCAL_WINS' | 'SERVER_WINS' | 'MERGE' | 'MANUAL';
  reason: string;
}

class OfflineSyncManager {
  private syncStatus: SyncStatus = {
    isOnline: navigator.onLine,
    pendingOperations: 0,
    failedOperations: 0,
    isCurrentlySyncing: false
  };

  private syncInProgress = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private statusListeners: ((status: SyncStatus) => void)[] = [];
  private conflictResolver?: (conflict: any) => ConflictResolution;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Initialize sync status
    this.updateSyncStatus({ isOnline: navigator.onLine });

    // Start periodic sync if online
    if (navigator.onLine) {
      this.startPeriodicSync();
    }
  }

  // ============================================================================
  // STATUS MANAGEMENT
  // ============================================================================

  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  onSyncStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.statusListeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.statusListeners.indexOf(listener);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  private updateSyncStatus(updates: Partial<SyncStatus>): void {
    this.syncStatus = { ...this.syncStatus, ...updates };
    this.statusListeners.forEach(listener => listener(this.syncStatus));
  }

  private async refreshPendingCounts(): Promise<void> {
    try {
      const pendingOps = await offlineStorage.getPendingSyncOperations();
      const pendingOrders = await offlineStorage.getOrders('PENDING_SYNC');
      const failedOrders = await offlineStorage.getOrders('FAILED_SYNC');

      this.updateSyncStatus({
        pendingOperations: pendingOps.length + pendingOrders.length,
        failedOperations: failedOrders.length
      });
    } catch (error) {
      console.error('Failed to refresh pending counts:', error);
    }
  }

  // ============================================================================
  // NETWORK STATUS HANDLERS
  // ============================================================================

  private handleOnline(): void {
    this.updateSyncStatus({ isOnline: true, syncError: undefined });
    this.startPeriodicSync();
    this.performFullSync();
  }

  private handleOffline(): void {
    this.updateSyncStatus({ isOnline: false });
    this.stopPeriodicSync();
  }

  private startPeriodicSync(): void {
    if (this.syncInterval) return;

    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.performIncrementalSync();
      }
    }, 30000);
  }

  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // ============================================================================
  // SYNC OPERATIONS
  // ============================================================================

  async performFullSync(): Promise<void> {
    if (this.syncInProgress || !navigator.onLine) return;

    this.syncInProgress = true;
    this.updateSyncStatus({
      isCurrentlySyncing: true,
      lastSyncAttempt: new Date()
    });

    try {
      // 1. Sync local orders to server
      await this.syncLocalOrdersToServer();

      // 2. Refresh menu cache
      await this.refreshMenuCache();

      // 3. Process pending sync operations
      await this.processPendingSyncOperations();

      // 4. Update counts
      await this.refreshPendingCounts();

      this.updateSyncStatus({
        lastSuccessfulSync: new Date(),
        isCurrentlySyncing: false,
        syncError: undefined
      });

    } catch (error) {
      console.error('Full sync failed:', error);
      this.updateSyncStatus({
        isCurrentlySyncing: false,
        syncError: error instanceof Error ? error.message : 'Unknown sync error'
      });
    } finally {
      this.syncInProgress = false;
    }
  }

  async performIncrementalSync(): Promise<void> {
    if (this.syncInProgress || !navigator.onLine) return;

    this.syncInProgress = true;
    this.updateSyncStatus({
      isCurrentlySyncing: true,
      lastSyncAttempt: new Date()
    });

    try {
      // Only sync pending operations for incremental sync
      await this.processPendingSyncOperations();
      await this.syncLocalOrdersToServer();
      await this.refreshPendingCounts();

      this.updateSyncStatus({
        lastSuccessfulSync: new Date(),
        isCurrentlySyncing: false
      });

    } catch (error) {
      console.error('Incremental sync failed:', error);
      this.updateSyncStatus({
        isCurrentlySyncing: false,
        syncError: error instanceof Error ? error.message : 'Unknown sync error'
      });
    } finally {
      this.syncInProgress = false;
    }
  }

  // ============================================================================
  // ORDER SYNCHRONIZATION
  // ============================================================================

  async syncOrderToServer(order: OfflineOrder): Promise<boolean> {
    if (!navigator.onLine) {
      // Store order locally for later sync
      await offlineStorage.saveOrder({
        ...order,
        status: 'PENDING_SYNC'
      });
      return false;
    }

    try {
      // Attempt to sync order to server
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (brain as any).place_order_example({
        order_type: order.order_type,
        items: order.items,
        customer_id: order.customer_data?.first_name,
        total: order.total_amount
      });

      if (response.ok) {
        // Mark as synced
        await offlineStorage.updateOrderSyncStatus(order.id, 'SYNCED');
        return true;
      } else {
        throw new Error(`Server responded with status ${response.status}`);
      }

    } catch (error) {
      console.error(`Failed to sync order ${order.id}:`, error);

      // Update failed sync status
      await offlineStorage.updateOrderSyncStatus(
        order.id,
        'FAILED_SYNC',
        error instanceof Error ? error.message : 'Unknown error'
      );

      return false;
    }
  }

  private async syncLocalOrdersToServer(): Promise<void> {
    const pendingOrders = await offlineStorage.getOrders('PENDING_SYNC');
    const failedOrders = await offlineStorage.getOrders('FAILED_SYNC');

    // Retry failed orders that haven't exceeded max attempts
    const retriableOrders = failedOrders.filter(order => order.sync_attempts < 3);

    const ordersToSync = [...pendingOrders, ...retriableOrders];

    for (const order of ordersToSync) {
      await this.syncOrderToServer(order);

      // Small delay between syncs to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // ============================================================================
  // MENU CACHE MANAGEMENT
  // ============================================================================

  async refreshMenuCache(): Promise<void> {
    if (!navigator.onLine) return;

    try {

      const response = await brain.get_menu_with_ordering();

      if (response.ok) {
        const menuData = await response.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = (menuData.data as any)?.items || (menuData as any).items || [];

        // Convert to offline format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const offlineItems = items.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price || 0,
          category_id: item.category_id || '',
          image_url: item.image_url,
          active: item.active !== false,
          variants: item.variants,
          customizations: item.customizations,
          allergens: item.allergens,
          cached_at: new Date().toISOString()
        })) || [];

        await offlineStorage.cacheMenuItems(offlineItems);

      } else {
        throw new Error(`Failed to fetch menu: ${response.status}`);
      }

    } catch (error) {
      console.error('Failed to refresh menu cache:', error);
    }
  }

  async getMenuItems(): Promise<MenuItem[]> {
    // Try to get fresh data if online
    if (navigator.onLine) {
      try {
        const response = await brain.get_menu_with_ordering();
        if (response.ok) {
          const menuData = await response.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (menuData.data as any)?.items || (menuData as any).items || [];
        }
      } catch (error) {
        // Silently fall through to cached data
      }
    }

    // Fallback to cached data
    const cachedItems = await offlineStorage.getCachedMenuItems();
    return cachedItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category_id: item.category_id,
      image_url: item.image_url,
      active: item.active,
      variants: item.variants as MenuItem['variants'],
      // MenuItem does not have these fields, cast to satisfy return type
      spice_indicators: null,
      featured: false,
      dietary_tags: null,
      display_order: 0
    })) as MenuItem[];
  }

  // ============================================================================
  // SYNC OPERATIONS QUEUE
  // ============================================================================

  private async processPendingSyncOperations(): Promise<void> {
    const pendingOps = await offlineStorage.getPendingSyncOperations();

    for (const operation of pendingOps) {
      await this.processSyncOperation(operation);

      // Small delay between operations
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  private async processSyncOperation(operation: OfflineSyncOperation): Promise<void> {
    try {
      await offlineStorage.updateSyncOperation(operation.id, {
        status: 'PROCESSING' as const,
        last_attempt: new Date().toISOString()
      });

      let success = false;

      switch (operation.type) {
        case 'CREATE_ORDER':
          success = await this.syncOrderToServer(operation.data);
          break;

        case 'UPDATE_ORDER':
          // Handle order updates
          success = true; // Placeholder
          break;

        case 'CREATE_PAYMENT':
          // Handle payment sync
          success = true; // Placeholder
          break;

        case 'UPDATE_MENU':
          // Handle menu updates
          await this.refreshMenuCache();
          success = true;
          break;

        default:
          console.warn(`Unknown operation type: ${operation.type}`);
          success = false;
      }

      if (success) {
        await offlineStorage.updateSyncOperation(operation.id, {
          status: 'COMPLETED' as const,
          last_attempt: new Date().toISOString()
        });
      } else {
        throw new Error('Operation failed');
      }

    } catch (error) {
      console.error(`Failed to process sync operation ${operation.id}:`, error);

      await offlineStorage.updateSyncOperation(operation.id, {
        status: 'FAILED' as const,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        last_attempt: new Date().toISOString()
      });
    }
  }

  // ============================================================================
  // CONFLICT RESOLUTION
  // ============================================================================

  setConflictResolver(resolver: (conflict: any) => ConflictResolution): void {
    this.conflictResolver = resolver;
  }

  private resolveConflict(localData: any, serverData: any): ConflictResolution {
    if (this.conflictResolver) {
      return this.conflictResolver({ localData, serverData });
    }

    // Default strategy: server wins for safety
    return {
      strategy: 'SERVER_WINS',
      reason: 'Default conflict resolution - server data preferred'
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async forceSync(): Promise<void> {
    await this.performFullSync();
  }

  async clearFailedOperations(): Promise<void> {
    const failedOrders = await offlineStorage.getOrders('FAILED_SYNC');

    for (const order of failedOrders) {
      await offlineStorage.updateOrderSyncStatus(order.id, 'PENDING_SYNC');
    }

    await this.refreshPendingCounts();
  }

  async getStorageStats() {
    return await offlineStorage.getStorageStats();
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  destroy(): void {
    this.stopPeriodicSync();
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    this.statusListeners = [];
  }
}

// Singleton instance
export const offlineSync = new OfflineSyncManager();

// Initialize sync status on import
offlineSync.performFullSync().catch(error => {
  console.error('Initial sync failed:', error);
});
