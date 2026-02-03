// POSDesktop Service Worker
// Handles offline caching for app shell, static assets, and API responses

const CACHE_NAME = 'cottage-tandoori-pos-v1';
const API_CACHE_NAME = 'cottage-tandoori-api-v1';
const IMAGE_CACHE_NAME = 'cottage-tandoori-images-v1';

const swSelf = self as unknown as ServiceWorkerGlobalScope;

// App shell resources to cache immediately
const APP_SHELL_URLS = [
  '/',
  '/pos-desktop',
];

// API endpoints to cache
const CACHEABLE_API_PATTERNS = [
  /\/routes\/get-pos-bundle/,
  /\/routes\/offline-sync-status/,
  /\/routes\/menu-delta-sync/,
  /\/routes\/get-real-menu-data/,
  /\/routes\/get-categories/,
  /\/routes\/get-menu-items/,
];

// Image patterns to cache
const CACHEABLE_IMAGE_PATTERNS = [
  /\.(jpg|jpeg|png|gif|webp|svg)$/i,
  /static\.databutton\.com/,
  /images\.unsplash\.com/,
];

// Network timeout for offline fallback
const NETWORK_TIMEOUT = 3000;

// ============================================================================
// INSTALLATION
// ============================================================================

swSelf.addEventListener('install', (event: ExtendableEvent) => {
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        
        // Cache app shell with individual error handling
        const cachePromises = APP_SHELL_URLS.map(async (url) => {
          try {
            await cache.add(url);
          } catch (error) {
          }
        });
        
        await Promise.allSettled(cachePromises);
        
        // Skip waiting to activate immediately
        await swSelf.skipWaiting();
        
      } catch (error) {
        console.error(' [ServiceWorker] Installation failed:', error);
      }
    })()
  );
});

// ============================================================================
// ACTIVATION
// ============================================================================

swSelf.addEventListener('activate', (event: ExtendableEvent) => {
  
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames
          .filter(name => {
            return name.startsWith('cottage-tandoori-') && 
                   name !== CACHE_NAME && 
                   name !== API_CACHE_NAME && 
                   name !== IMAGE_CACHE_NAME;
          })
          .map(name => {
            return caches.delete(name);
          });
        
        await Promise.all(deletePromises);
        
        // Take control of all open pages
        await swSelf.clients.claim();
        
      } catch (error) {
        console.error(' [ServiceWorker] Activation failed:', error);
      }
    })()
  );
});

// ============================================================================
// FETCH HANDLING
// ============================================================================

swSelf.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different resource types
  if (isAppShellRequest(url)) {
    event.respondWith(handleAppShellRequest(request));
  } else if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isImageRequest(url)) {
    event.respondWith(handleImageRequest(request));
  } else {
    // Let other requests pass through
    return;
  }
});

// ============================================================================
// REQUEST HANDLERS
// ============================================================================

/**
 * Handle app shell requests (HTML, CSS, JS)
 */
async function handleAppShellRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache, try network with timeout
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT);
    
    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    
    // Return offline page or cached fallback
    const cache = await caches.open(CACHE_NAME);
    const fallback = await cache.match('/') || await cache.match('/pos-desktop');
    
    if (fallback) {
      return fallback;
    }
    
    return new Response('App unavailable offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Handle API requests
 */
async function handleAPIRequest(request) {
  try {
    // Try network first for API requests (fresh data)
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT);
    
    // Cache successful API responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    
    // Fall back to cache
    const cache = await caches.open(API_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline indicator for failed API requests
    return new Response(JSON.stringify({
      error: 'offline',
      message: 'Network request failed - offline mode'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle image requests
 */
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE_NAME);
    
    // Try cache first for images (they don't change often)
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Try network
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT);
    
    // Cache successful image responses
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    
    // Return placeholder for failed images
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f0f0f0"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#999">No Image</text></svg>',
      {
        status: 200,
        headers: { 'Content-Type': 'image/svg+xml' }
      }
    );
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if request is for app shell resources
 */
function isAppShellRequest(url) {
  return url.pathname === '/' || 
         url.pathname === '/pos-desktop' ||
         url.pathname.endsWith('.html') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js') ||
         url.pathname.includes('/assets/');
}

/**
 * Check if request is for API endpoints
 */
function isAPIRequest(url) {
  return CACHEABLE_API_PATTERNS.some(pattern => pattern.test(url.pathname));
}

/**
 * Check if request is for images
 */
function isImageRequest(url) {
  return CACHEABLE_IMAGE_PATTERNS.some(pattern => {
    if (pattern instanceof RegExp) {
      return pattern.test(url.pathname) || pattern.test(url.hostname);
    }
    return url.pathname.includes(pattern) || url.hostname.includes(pattern);
  });
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(request, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(request, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

swSelf.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    swSelf.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      const deletePromises = cacheNames
        .filter(name => name.startsWith('cottage-tandoori-'))
        .map(name => caches.delete(name));
      return Promise.all(deletePromises);
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    }).catch(error => {
      event.ports[0].postMessage({ success: false, error: error.message });
    });
  }
});
