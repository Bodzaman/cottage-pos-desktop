/**
 * Service Worker Registration and Management
 * Handles registration, updates, and offline status for POSDesktop
 */

// Service worker registration status
let swRegistration: ServiceWorkerRegistration | null = null;
let isOffline = false;
let offlineCallbacks: Array<(offline: boolean) => void> = [];

// ============================================================================
// SERVICE WORKER REGISTRATION
// ============================================================================

/**
 * Register service worker for offline functionality
 */
export async function registerServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ [ServiceWorker] Service workers not supported');
    return false;
  }

  try {
    console.log('🔧 [ServiceWorker] Registering...');
    
    // Register the service worker
    swRegistration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('✅ [ServiceWorker] Registered successfully:', swRegistration.scope);

    // Handle updates
    swRegistration.addEventListener('updatefound', handleServiceWorkerUpdate);

    // Handle controller change (new version activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 [ServiceWorker] Controller changed, reloading...');
      window.location.reload();
    });

    // Set up offline detection
    setupOfflineDetection();

    return true;

  } catch (error) {
    console.error('❌ [ServiceWorker] Registration failed:', error);
    return false;
  }
}

/**
 * Handle service worker updates
 */
function handleServiceWorkerUpdate() {
  if (!swRegistration) return;

  const newWorker = swRegistration.installing;
  if (!newWorker) return;

  console.log('🆕 [ServiceWorker] New version available');

  newWorker.addEventListener('statechange', () => {
    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
      console.log('📦 [ServiceWorker] New version ready to activate');
      
      // Notify user about update (could show a toast or banner)
      notifyServiceWorkerUpdate();
    }
  });
}

/**
 * Notify about service worker update
 */
function notifyServiceWorkerUpdate() {
  // This could integrate with your toast system
  console.log('🔔 [ServiceWorker] App update available. Refresh to apply.');
  
  // For now, just log. In production, you might want to show a toast:
  // toast.info('App update available. Refresh to apply.', {
  //   action: {
  //     label: 'Refresh',
  //     onClick: () => window.location.reload()
  //   }
  // });
}

// ============================================================================
// OFFLINE DETECTION
// ============================================================================

/**
 * Set up network status monitoring
 */
function setupOfflineDetection() {
  // Initial status
  isOffline = !navigator.onLine;
  
  // Listen for network changes
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Also monitor fetch failures as a backup detection method
  setupFetchMonitoring();
}

/**
 * Handle coming online
 */
function handleOnline() {
  console.log('🟢 [ServiceWorker] Network connection restored');
  setOfflineStatus(false);
}

/**
 * Handle going offline
 */
function handleOffline() {
  console.log('🔴 [ServiceWorker] Network connection lost');
  setOfflineStatus(true);
}

/**
 * Set offline status and notify callbacks
 */
function setOfflineStatus(offline: boolean) {
  if (isOffline !== offline) {
    isOffline = offline;
    offlineCallbacks.forEach(callback => {
      try {
        callback(offline);
      } catch (error) {
        console.error('❌ [ServiceWorker] Error in offline callback:', error);
      }
    });
  }
}

/**
 * Monitor fetch requests for additional offline detection
 */
function setupFetchMonitoring() {
  const originalFetch = window.fetch;
  
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      
      // If we get a response and were offline, we're back online
      if (isOffline && response.ok) {
        setOfflineStatus(false);
      }
      
      return response;
    } catch (error) {
      // If fetch fails, we might be offline
      if (!isOffline && navigator.onLine) {
        // Double-check with a simple request
        try {
          await originalFetch('/ping', { method: 'HEAD' });
        } catch {
          setOfflineStatus(true);
        }
      }
      
      throw error;
    }
  };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Check if currently offline
 */
export function getOfflineStatus(): boolean {
  return isOffline;
}

/**
 * Subscribe to offline status changes
 */
export function onOfflineStatusChange(callback: (offline: boolean) => void): () => void {
  offlineCallbacks.push(callback);
  
  // Return unsubscribe function
  return () => {
    const index = offlineCallbacks.indexOf(callback);
    if (index > -1) {
      offlineCallbacks.splice(index, 1);
    }
  };
}

/**
 * Manually trigger service worker update
 */
export async function updateServiceWorker(): Promise<boolean> {
  if (!swRegistration) {
    console.warn('⚠️ [ServiceWorker] No registration found');
    return false;
  }

  try {
    await swRegistration.update();
    console.log('🔄 [ServiceWorker] Update check completed');
    return true;
  } catch (error) {
    console.error('❌ [ServiceWorker] Update failed:', error);
    return false;
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!swRegistration) {
    return true;
  }

  try {
    const result = await swRegistration.unregister();
    console.log('🗑️ [ServiceWorker] Unregistered:', result);
    swRegistration = null;
    return result;
  } catch (error) {
    console.error('❌ [ServiceWorker] Unregistration failed:', error);
    return false;
  }
}

/**
 * Get service worker registration info
 */
export function getServiceWorkerInfo() {
  return {
    registered: !!swRegistration,
    scope: swRegistration?.scope,
    active: !!swRegistration?.active,
    waiting: !!swRegistration?.waiting,
    installing: !!swRegistration?.installing,
    offline: isOffline
  };
}

/**
 * Send message to service worker
 */
export function sendMessageToServiceWorker(message: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!swRegistration?.active) {
      reject(new Error('No active service worker'));
      return;
    }

    const messageChannel = new MessageChannel();
    
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data);
    };

    messageChannel.port1.onerror = (error) => {
      reject(error);
    };

    swRegistration.active.postMessage(message, [messageChannel.port2]);
  });
}

/**
 * Clear all service worker caches
 */
export async function clearServiceWorkerCaches(): Promise<boolean> {
  try {
    const result = await sendMessageToServiceWorker({ type: 'CLEAR_CACHE' });
    console.log('🗑️ [ServiceWorker] Caches cleared:', result);
    return result.success;
  } catch (error) {
    console.error('❌ [ServiceWorker] Failed to clear caches:', error);
    return false;
  }
}
