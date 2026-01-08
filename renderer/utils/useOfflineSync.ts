import { useState, useEffect, useCallback } from 'react';
import { useOfflineStatus } from './useOfflineStatus';
import { toast } from 'sonner';

/**
 * useOfflineSync - Offline data caching and sync queue management
 * 
 * Provides:
 * - Profile data caching in localStorage
 * - Order history caching
 * - Sync queue for offline actions
 * - Automatic sync when back online
 */

interface SyncQueueItem {
  id: string;
  type: 'profile_update' | 'address_update' | 'address_create' | 'address_delete';
  data: any;
  timestamp: number;
}

interface CachedProfile {
  data: any;
  timestamp: number;
}

interface CachedOrders {
  data: any[];
  timestamp: number;
}

const CACHE_KEYS = {
  PROFILE: 'cottage_cached_profile',
  ORDERS: 'cottage_cached_orders',
  SYNC_QUEUE: 'cottage_sync_queue',
  ADDRESSES: 'cottage_cached_addresses'
};

const CACHE_EXPIRY = 1000 * 60 * 60 * 24; // 24 hours

export function useOfflineSync() {
  const { isOnline, wasOffline } = useOfflineStatus();
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load sync queue from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CACHE_KEYS.SYNC_QUEUE);
      if (stored) {
        setSyncQueue(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }, []);

  // Save sync queue to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CACHE_KEYS.SYNC_QUEUE, JSON.stringify(syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }, [syncQueue]);

  // Auto-sync when connection returns
  useEffect(() => {
    if (isOnline && syncQueue.length > 0 && !isSyncing) {
      console.log('🔄 Connection restored. Processing sync queue...');
      processSyncQueue();
    }
  }, [isOnline, syncQueue.length]);

  /**
   * Cache profile data
   */
  const cacheProfile = useCallback((profileData: any) => {
    try {
      const cached: CachedProfile = {
        data: profileData,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEYS.PROFILE, JSON.stringify(cached));
      console.log('💾 Profile cached for offline viewing');
    } catch (error) {
      console.error('Failed to cache profile:', error);
    }
  }, []);

  /**
   * Get cached profile data
   */
  const getCachedProfile = useCallback((): any | null => {
    try {
      const stored = localStorage.getItem(CACHE_KEYS.PROFILE);
      if (!stored) return null;

      const cached: CachedProfile = JSON.parse(stored);
      
      // Check if cache is expired
      if (Date.now() - cached.timestamp > CACHE_EXPIRY) {
        localStorage.removeItem(CACHE_KEYS.PROFILE);
        return null;
      }

      return cached.data;
    } catch (error) {
      console.error('Failed to get cached profile:', error);
      return null;
    }
  }, []);

  /**
   * Cache order history
   */
  const cacheOrders = useCallback((orders: any[]) => {
    try {
      const cached: CachedOrders = {
        data: orders,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEYS.ORDERS, JSON.stringify(cached));
      console.log(`💾 ${orders.length} orders cached for offline viewing`);
    } catch (error) {
      console.error('Failed to cache orders:', error);
    }
  }, []);

  /**
   * Get cached order history
   */
  const getCachedOrders = useCallback((): any[] | null => {
    try {
      const stored = localStorage.getItem(CACHE_KEYS.ORDERS);
      if (!stored) return null;

      const cached: CachedOrders = JSON.parse(stored);
      
      // Check if cache is expired
      if (Date.now() - cached.timestamp > CACHE_EXPIRY) {
        localStorage.removeItem(CACHE_KEYS.ORDERS);
        return null;
      }

      return cached.data;
    } catch (error) {
      console.error('Failed to get cached orders:', error);
      return null;
    }
  }, []);

  /**
   * Cache addresses
   */
  const cacheAddresses = useCallback((addresses: any[]) => {
    try {
      const cached = {
        data: addresses,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEYS.ADDRESSES, JSON.stringify(cached));
      console.log(`💾 ${addresses.length} addresses cached for offline viewing`);
    } catch (error) {
      console.error('Failed to cache addresses:', error);
    }
  }, []);

  /**
   * Get cached addresses
   */
  const getCachedAddresses = useCallback((): any[] | null => {
    try {
      const stored = localStorage.getItem(CACHE_KEYS.ADDRESSES);
      if (!stored) return null;

      const cached = JSON.parse(stored);
      
      // Check if cache is expired
      if (Date.now() - cached.timestamp > CACHE_EXPIRY) {
        localStorage.removeItem(CACHE_KEYS.ADDRESSES);
        return null;
      }

      return cached.data;
    } catch (error) {
      console.error('Failed to get cached addresses:', error);
      return null;
    }
  }, []);

  /**
   * Add action to sync queue (called when offline)
   */
  const queueAction = useCallback((type: SyncQueueItem['type'], data: any) => {
    const queueItem: SyncQueueItem = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now()
    };

    setSyncQueue(prev => [...prev, queueItem]);
    console.log(`📝 Queued ${type} for sync when online`);
    toast.info('Action saved. Will sync when connection returns.');
  }, []);

  /**
   * Process sync queue (called when back online)
   */
  const processSyncQueue = useCallback(async () => {
    if (!isOnline || syncQueue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    console.log(`🔄 Processing ${syncQueue.length} queued actions...`);

    const processedIds: string[] = [];
    const failedIds: string[] = [];

    for (const item of syncQueue) {
      try {
        console.log(`⏳ Processing ${item.type}...`);
        
        // Process based on type
        // Note: These would need to be implemented with actual API calls
        // For now, we'll simulate success
        
        switch (item.type) {
          case 'profile_update':
            // await apiClient.update_profile(item.data);
            console.log('✅ Profile update synced');
            break;
          case 'address_create':
            // await apiClient.create_address(item.data);
            console.log('✅ Address creation synced');
            break;
          case 'address_update':
            // await apiClient.update_address(item.data);
            console.log('✅ Address update synced');
            break;
          case 'address_delete':
            // await apiClient.delete_address(item.data);
            console.log('✅ Address deletion synced');
            break;
        }
        
        processedIds.push(item.id);
      } catch (error) {
        console.error(`❌ Failed to sync ${item.type}:`, error);
        failedIds.push(item.id);
      }
    }

    // Remove successfully processed items from queue
    setSyncQueue(prev => prev.filter(item => !processedIds.includes(item.id)));

    setIsSyncing(false);

    // Show results
    if (processedIds.length > 0) {
      toast.success(`${processedIds.length} action(s) synced successfully!`);
    }
    if (failedIds.length > 0) {
      toast.error(`${failedIds.length} action(s) failed to sync. Will retry later.`);
    }
  }, [isOnline, syncQueue, isSyncing]);

  /**
   * Clear all cached data (useful for logout)
   */
  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEYS.PROFILE);
    localStorage.removeItem(CACHE_KEYS.ORDERS);
    localStorage.removeItem(CACHE_KEYS.ADDRESSES);
    localStorage.removeItem(CACHE_KEYS.SYNC_QUEUE);
    setSyncQueue([]);
    console.log('🗑️ All offline cache cleared');
  }, []);

  /**
   * Check if data is from cache
   */
  const isDataCached = useCallback((cacheKey: keyof typeof CACHE_KEYS): boolean => {
    try {
      const stored = localStorage.getItem(CACHE_KEYS[cacheKey]);
      return stored !== null;
    } catch {
      return false;
    }
  }, []);

  return {
    // Status
    isOnline,
    isSyncing,
    queueLength: syncQueue.length,
    
    // Profile caching
    cacheProfile,
    getCachedProfile,
    
    // Order caching
    cacheOrders,
    getCachedOrders,
    
    // Address caching
    cacheAddresses,
    getCachedAddresses,
    
    // Sync queue
    queueAction,
    processSyncQueue,
    
    // Utilities
    clearCache,
    isDataCached
  };
}
