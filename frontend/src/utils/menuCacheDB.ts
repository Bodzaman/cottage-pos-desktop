/**
 * IndexedDB Menu Cache - Desktop-First Architecture
 * 
 * Provides instant menu data loading for POSDesktop (<100ms vs 1-2s network fetch)
 * Enables 100% offline operation with background sync
 * 
 * Architecture:
 * - Primary storage: IndexedDB (persistent, survives app restarts)
 * - Secondary: Network (Supabase real-time)
 * - Strategy: Cache-first with background sync
 * 
 * Performance Impact:
 * - Cold start: <100ms (IndexedDB read) vs 1-2s (network fetch)
 * - Offline capability: 100% (all menu operations work offline)
 */

import { MenuCategory, MenuItem, ProteinType, Customization, ItemVariant } from './menuTypes';

const DB_NAME = 'cottage_tandoori_pos';
const DB_VERSION = 1;
const MENU_STORE = 'menu_cache';
const METADATA_STORE = 'cache_metadata';

export interface MenuCacheData {
  categories: MenuCategory[];
  menuItems: MenuItem[];
  proteinTypes: ProteinType[];
  customizations: Customization[];
  itemVariants: ItemVariant[];
  setMeals: any[]; // Type from realtimeMenuStore
}

export interface CacheMetadata {
  lastSync: number; // Unix timestamp
  version: string; // Cache version for invalidation
  recordCount: number; // Total records cached
  syncStatus: 'fresh' | 'stale' | 'never';
}

/**
 * IndexedDB wrapper for menu data caching
 */
class MenuCacheDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB connection
   */
  async init(): Promise<void> {
    if (this.db) return; // Already initialized
    if (this.initPromise) return this.initPromise; // Initialization in progress

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ [MenuCacheDB] Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ [MenuCacheDB] IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create menu cache store
        if (!db.objectStoreNames.contains(MENU_STORE)) {
          db.createObjectStore(MENU_STORE, { keyPath: 'cacheKey' });
          console.log('📦 [MenuCacheDB] Created menu_cache object store');
        }

        // Create metadata store
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
          console.log('📦 [MenuCacheDB] Created cache_metadata object store');
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Save complete menu data to cache
   * @returns Success status
   */
  async saveMenuData(menuData: MenuCacheData): Promise<boolean> {
    try {
      await this.init();
      if (!this.db) throw new Error('Database not initialized');

      const transaction = this.db.transaction([MENU_STORE, METADATA_STORE], 'readwrite');
      const menuStore = transaction.objectStore(MENU_STORE);
      const metadataStore = transaction.objectStore(METADATA_STORE);

      // Save menu data
      await this.promisifyRequest(
        menuStore.put({
          cacheKey: 'current_menu',
          ...menuData,
          cachedAt: Date.now()
        })
      );

      // Calculate total record count
      const recordCount = 
        menuData.categories.length +
        menuData.menuItems.length +
        menuData.proteinTypes.length +
        menuData.customizations.length +
        menuData.itemVariants.length +
        menuData.setMeals.length;

      // Update metadata
      const metadata: CacheMetadata = {
        lastSync: Date.now(),
        version: '1.0.0', // Could be incremented for breaking changes
        recordCount,
        syncStatus: 'fresh'
      };

      await this.promisifyRequest(
        metadataStore.put({ key: 'menu_metadata', ...metadata })
      );

      console.log(`✅ [MenuCacheDB] Saved ${recordCount} records to cache`);
      return true;
    } catch (error) {
      console.error('❌ [MenuCacheDB] Failed to save menu data:', error);
      return false;
    }
  }

  /**
   * Load menu data from cache
   * @returns Cached menu data or null if not found
   */
  async loadMenuData(): Promise<MenuCacheData | null> {
    try {
      await this.init();
      if (!this.db) throw new Error('Database not initialized');

      const transaction = this.db.transaction([MENU_STORE], 'readonly');
      const store = transaction.objectStore(MENU_STORE);
      
      const request = store.get('current_menu');
      const result = await this.promisifyRequest(request);

      if (!result) {
        console.log('ℹ️ [MenuCacheDB] No cached menu data found');
        return null;
      }

      // Extract menu data (remove IndexedDB metadata)
      const { cacheKey, cachedAt, ...menuData } = result;
      
      const recordCount = 
        menuData.categories.length +
        menuData.menuItems.length +
        menuData.proteinTypes.length +
        menuData.customizations.length +
        menuData.itemVariants.length +
        menuData.setMeals.length;

      console.log(`✅ [MenuCacheDB] Loaded ${recordCount} records from cache (cached ${Math.round((Date.now() - cachedAt) / 1000)}s ago)`);
      
      return menuData as MenuCacheData;
    } catch (error) {
      console.error('❌ [MenuCacheDB] Failed to load menu data:', error);
      return null;
    }
  }

  /**
   * Get cache metadata
   */
  async getMetadata(): Promise<CacheMetadata | null> {
    try {
      await this.init();
      if (!this.db) throw new Error('Database not initialized');

      const transaction = this.db.transaction([METADATA_STORE], 'readonly');
      const store = transaction.objectStore(METADATA_STORE);
      
      const request = store.get('menu_metadata');
      const result = await this.promisifyRequest(request);

      if (!result) return null;

      const { key, ...metadata } = result;
      return metadata as CacheMetadata;
    } catch (error) {
      console.error('❌ [MenuCacheDB] Failed to get metadata:', error);
      return null;
    }
  }

  /**
   * Check if cache is fresh (< 1 hour old)
   */
  async isCacheFresh(): Promise<boolean> {
    const metadata = await this.getMetadata();
    if (!metadata) return false;

    const ageMs = Date.now() - metadata.lastSync;
    const ageMinutes = ageMs / 1000 / 60;
    const isFresh = ageMinutes < 60; // Cache valid for 1 hour

    console.log(`📊 [MenuCacheDB] Cache age: ${Math.round(ageMinutes)} minutes (${isFresh ? 'fresh' : 'stale'})`);
    return isFresh;
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<boolean> {
    try {
      await this.init();
      if (!this.db) throw new Error('Database not initialized');

      const transaction = this.db.transaction([MENU_STORE, METADATA_STORE], 'readwrite');
      
      await this.promisifyRequest(transaction.objectStore(MENU_STORE).clear());
      await this.promisifyRequest(transaction.objectStore(METADATA_STORE).clear());

      console.log('✅ [MenuCacheDB] Cache cleared successfully');
      return true;
    } catch (error) {
      console.error('❌ [MenuCacheDB] Failed to clear cache:', error);
      return false;
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
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
      console.log('🔒 [MenuCacheDB] Database closed');
    }
  }
}

// Singleton instance
export const menuCacheDB = new MenuCacheDB();

/**
 * High-level API for menu caching
 */
export const MenuCache = {
  /**
   * Save menu data to cache
   */
  save: (menuData: MenuCacheData) => menuCacheDB.saveMenuData(menuData),

  /**
   * Load menu data from cache
   */
  load: () => menuCacheDB.loadMenuData(),

  /**
   * Check if cache is fresh
   */
  isFresh: () => menuCacheDB.isCacheFresh(),

  /**
   * Get cache metadata
   */
  getMetadata: () => menuCacheDB.getMetadata(),

  /**
   * Clear cache
   */
  clear: () => menuCacheDB.clearCache(),

  /**
   * Close database
   */
  close: () => menuCacheDB.close()
};
