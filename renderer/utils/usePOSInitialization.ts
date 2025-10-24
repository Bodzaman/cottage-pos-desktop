import { useEffect, useState } from 'react';
import { loadPOSBundle } from './realtimeMenuStore';
import { loadTableConfig } from './tableConfigStore';
import { registerServiceWorker } from './serviceWorkerManager';
import { outboxSyncManager } from './outboxSyncManager';
import { useHeaderViewChange } from './headerViewChange';
import posPerf from './posPerformance';
import { OfflineFirst } from './offlineFirstManager';
import { useRealtimeMenuStore } from './realtimeMenuStore';

const isDev = import.meta.env.DEV;

interface InitializationState {
  bundleLoaded: boolean;
  initialLoad: boolean;
  offlineServicesReady: boolean;
  tableConfigLoaded: boolean;
}

interface UsePOSInitializationProps {
  onViewChange?: (view: 'pos' | 'reservations') => void;
}

/**
 * usePOSInitialization - Centralized POS initialization lifecycle management
 * 
 * **RESPONSIBILITY:** 
 * Orchestrates the complete POS startup sequence, ensuring all dependencies are loaded
 * and services are ready before the UI becomes interactive.
 * 
 * **DATA FLOW:**
 * 1. Loads menu bundle from backend → Updates realtimeMenuStore
 * 2. Registers service worker → Enables offline capabilities
 * 3. Initializes sync managers → Enables outbox pattern for resilient data persistence
 * 4. Sets up header listeners → Enables navigation between POS views
 * 5. Starts realtime subscriptions (delayed 15s) → Live menu updates
 * 
 * **STATE EXPORTS:**
 * - `initialization.bundleLoaded`: Menu data fetched and store populated
 * - `initialization.initialLoad`: Show skeletons until bundle loads
 * - `initialization.offlineServicesReady`: Service worker + sync managers ready
 * 
 * **DEPENDENCIES:**
 * - realtimeMenuStore: Receives menu data from bundle
 * - serviceWorkerManager: Offline support
 * - outboxSyncManager: Queues operations when offline
 * - headerViewChange: Navigation events
 * 
 * **CLEANUP:** 
 * Properly unsubscribes from header listeners on unmount to prevent memory leaks
 * 
 * @param onViewChange - Callback fired when user switches between POS/Reservations views
 * @returns initialization - Loading state object for coordinating skeletons and UI readiness
 */
export function usePOSInitialization({ onViewChange }: UsePOSInitializationProps = {}) {
  const [state, setState] = useState<InitializationState>({
    bundleLoaded: false,
    initialLoad: true,
    offlineServicesReady: false,
    tableConfigLoaded: false
  });

  // ============================================================================
  // OFFLINE-FIRST INITIALIZATION (NEW: Cache-first menu loading)
  // ============================================================================
  useEffect(() => {
    const initializeOfflineFirst = async () => {
      try {
        if (isDev) console.log('🚀 [POSDesktop] Initializing offline-first manager...');
        
        // Initialize offline-first manager
        await OfflineFirst.initialize();
        
        // Try to load menu from cache first (instant <100ms)
        const cachedMenuData = await OfflineFirst.loadMenuData();
        
        if (cachedMenuData) {
          // Cache hit! Load menu data instantly
          if (isDev) console.log('⚡ [POSDesktop] Menu loaded from cache (instant)');
          
          const store = useRealtimeMenuStore.getState();
          // ✅ FIX: Use setter functions to ensure computeLookups() is called
          store.setCategories(cachedMenuData.categories);
          store.setMenuItems(cachedMenuData.menuItems);
          store.setProteinTypes(cachedMenuData.proteinTypes);
          store.setCustomizations(cachedMenuData.customizations);
          store.setItemVariants(cachedMenuData.itemVariants); // This will call computeLookups()
          store.setSetMeals(cachedMenuData.setMeals);
          store.isLoading = false;
          store.isConnected = true;
          store.lastUpdate = Date.now();
          
          // Mark bundle as loaded from cache
          setState(prev => ({ 
            ...prev, 
            bundleLoaded: true,
            initialLoad: false 
          }));
        }
        
        if (isDev) console.log('✅ [POSDesktop] Offline-first manager initialized');
      } catch (error) {
        console.error('❌ [POSDesktop] Failed to initialize offline-first:', error);
      }
    };
    
    initializeOfflineFirst();
    
    // Cleanup on unmount
    return () => {
      OfflineFirst.shutdown();
    };
  }, []);

  // ============================================================================
  // BUNDLE LOADING & REALTIME SUBSCRIPTIONS (ENHANCED: Background refresh)
  // ============================================================================
  useEffect(() => {
    const initializePOSDesktop = async () => {
      try {
        if (isDev) console.log('🚀 [POSDesktop] Starting background menu refresh...');
        
        // Load POS bundle and table config in parallel
        // This now happens in BACKGROUND after cache load
        const bundleStartTime = performance.now();
        const [bundleSuccess, tableConfigSuccess] = await Promise.all([
          loadPOSBundle(),
          loadTableConfig()
        ]);
        
        const bundleLoadDuration = performance.now() - bundleStartTime;
        if (isDev) {
          console.log(`✅ [POSDesktop] Network bundle loaded in ${bundleLoadDuration.toFixed(2)}ms`);
          console.log(`✅ [POSDesktop] Table config: ${tableConfigSuccess ? 'loaded' : 'failed'}`);
        }
        
        // After network load, save to cache for next time
        const store = useRealtimeMenuStore.getState();
        const menuDataToCache = {
          categories: store.categories,
          menuItems: store.menuItems,
          proteinTypes: store.proteinTypes,
          customizations: store.customizations,
          itemVariants: store.itemVariants,
          setMeals: store.setMeals
        };
        await OfflineFirst.saveMenuData(menuDataToCache);
        if (isDev) console.log('💾 [POSDesktop] Menu data cached for next startup');
        
        setState(prev => ({ 
          ...prev, 
          bundleLoaded: bundleSuccess,
          tableConfigLoaded: tableConfigSuccess,
          initialLoad: false 
        }));
        
        // Start real-time subscriptions after 15 seconds if no user interaction
        setTimeout(() => {
          if (isDev) console.log('⏰ [POSDesktop] 15s elapsed, starting real-time subscriptions...');
          const { startRealtimeSubscriptionsIfNeeded } = require('./realtimeMenuStore');
          startRealtimeSubscriptionsIfNeeded();
        }, 15000);
      } catch (error) {
        console.error('❌ [POSDesktop] Initialization failed:', error);
        setState(prev => ({ ...prev, bundleLoaded: true, tableConfigLoaded: false, initialLoad: false }));
      }
    };
    
    initializePOSDesktop();
  }, []);

  // ============================================================================
  // OFFLINE SERVICES INITIALIZATION
  // ============================================================================
  useEffect(() => {
    const initializeOfflineServices = async () => {
      try {
        // Register service worker for offline support
        const swRegistered = await registerServiceWorker();
        if (swRegistered && isDev) {
          console.log('✅ [POSDesktop] Service worker registered successfully');
        }
        
        // Initialize outbox sync manager
        await outboxSyncManager.initialize();
        if (isDev) console.log('✅ [POSDesktop] Outbox sync manager initialized');
        
        setState(prev => ({ ...prev, offlineServicesReady: true }));
      } catch (error) {
        console.error('❌ [POSDesktop] Failed to initialize offline services:', error);
      }
    };
    
    initializeOfflineServices();
  }, []);

  // ============================================================================
  // HEADER VIEW CHANGE LISTENER
  // ============================================================================
  useEffect(() => {
    if (!onViewChange) return;
    
    const cleanup = useHeaderViewChange((event) => {
      switch (event.view) {
        case 'pos':
          onViewChange('pos');
          break;
        case 'reservations':
          onViewChange('reservations');
          break;
        default:
          console.warn('[POSDesktop] Unknown view:', event.view);
      }
    })();
    
    return cleanup;
  }, [onViewChange]);

  // ============================================================================
  // MENU STORE INITIALIZATION WITH PERFORMANCE GUARD
  // ============================================================================
  useEffect(() => {
    // React StrictMode guard - prevents double initialization
    let isActive = true;
    let cleanupFunctions: (() => void)[] = [];
    
    // Use initialization guard to prevent multiple concurrent starts
    posPerf.startInitialization('pos_desktop', async () => {
      // Check if effect is still active (not unmounted)
      if (!isActive) return;
      
      // Additional initialization logic can go here if needed
      if (isDev) console.log('✅ [POSDesktop] Menu store initialization complete');
    });
    
    return () => {
      isActive = false;
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, []);

  return {
    bundleLoaded: state.bundleLoaded,
    initialLoad: state.initialLoad,
    offlineServicesReady: state.offlineServicesReady,
    tableConfigLoaded: state.tableConfigLoaded,
    isFullyInitialized: state.bundleLoaded && state.offlineServicesReady && state.tableConfigLoaded
  };
}
