import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Flag to track connection status
let supabaseConnectionFailed = false;
let supabaseConfigPromise: Promise<{url: string, anon_key: string}> | null = null;
let configFetched = false;
// Global flag to prevent concurrent client creation
let isClientInitializing = false;

// Get configuration from environment variables (PRIMARY source - no backend needed)
const getEnvConfig = (): { url: string; anon_key: string } | null => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anon_key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (url && anon_key) {
    return { url, anon_key };
  }
  return null;
};

// Environment config (primary source)
const ENV_CONFIG = getEnvConfig();

// Track last client config used so we can decide whether to replace the temporary client
let lastClientConfig: { url: string; anon_key: string } | null = ENV_CONFIG ? { ...ENV_CONFIG } : null;

// Create SINGLE client instance - no more multiple client creation
let supabaseInstance: SupabaseClient | null = null;

// Function to get or create the single Supabase client instance
const getSupabaseInstance = async (): Promise<any> => {
  if (supabaseInstance && configFetched) {
    return supabaseInstance;
  }
  
  // Prevent concurrent client initialization
  if (isClientInitializing) {
    // Wait for current initialization to complete
    await new Promise(resolve => {
      const checkInit = () => {
        if (!isClientInitializing) {
          resolve(void 0);
        } else {
          setTimeout(checkInit, 10);
        }
      };
      checkInit();
    });
    return supabaseInstance;
  }
  
  isClientInitializing = true;
  
  try {
    // Get the correct config first
    const config = await fetchSupabaseConfig();
    
    // Create client only once with the correct config
    if (!supabaseInstance || lastClientConfig.url !== config.url || lastClientConfig.anon_key !== config.anon_key) {
      supabaseInstance = createClient(config.url, config.anon_key);
      lastClientConfig = { ...config };
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('supabase-reconfigured'));
      }
    }
    
    configFetched = true;
    return supabaseInstance;
  } finally {
    isClientInitializing = false;
  }
};

// Export a proxy that ensures the client is properly configured
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    if (!supabaseInstance) {
      // Use environment config (primary source - no backend needed)
      if (ENV_CONFIG) {
        supabaseInstance = createClient(ENV_CONFIG.url, ENV_CONFIG.anon_key);
        lastClientConfig = { ...ENV_CONFIG };
        configFetched = true;
      } else {
        // No env config available - check localStorage for runtime overrides
        const cachedUrl = typeof window !== 'undefined' ? localStorage.getItem('supabaseUrl') : null;
        const cachedKey = typeof window !== 'undefined' ? localStorage.getItem('supabaseKey') : null;

        if (cachedUrl && cachedKey) {
          supabaseInstance = createClient(cachedUrl, cachedKey);
          lastClientConfig = { url: cachedUrl, anon_key: cachedKey };
          configFetched = true;
        } else {
          // No config available - return helpful error
          console.error(' [Supabase] No configuration available');
          if (prop === 'from' || prop === 'auth' || prop === 'storage' || prop === 'rpc') {
            return () => {
              throw new Error(
                'Supabase client not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
                'in your .env file.'
              );
            };
          }
          return undefined;
        }
      }
    }
    return (supabaseInstance as any)[prop as any];
  }
});

// Fetch Supabase configuration (env vars first, localStorage fallback - no backend needed)
const fetchSupabaseConfig = async (): Promise<{url: string, anon_key: string}> => {
  if (supabaseConfigPromise) {
    return supabaseConfigPromise;
  }

  supabaseConfigPromise = (async () => {
    // 1. Environment variables (PRIMARY source - no backend needed)
    const envUrl = import.meta.env.VITE_SUPABASE_URL;
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (envUrl && envKey) {
      configFetched = true;
      return { url: envUrl, anon_key: envKey };
    }

    // 2. localStorage cache (for runtime overrides via settings UI)
    if (typeof window !== 'undefined') {
      const cachedUrl = localStorage.getItem('supabaseUrl');
      const cachedKey = localStorage.getItem('supabaseKey');

      if (cachedUrl && cachedKey) {
        configFetched = true;
        return { url: cachedUrl, anon_key: cachedKey };
      }
    }

    // 3. No config available - throw helpful error
    throw new Error(
      'Supabase configuration not found. ' +
      'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
    );
  })();

  return supabaseConfigPromise;
};

// Initialize configuration check (but don't block startup)
fetchSupabaseConfig().catch(error => {
});

// Export async function to get properly configured client (optional)
export const getSupabase = async () => {
  return await getSupabaseInstance();
};

// Function to ensure Supabase is configured correctly (for backward compatibility)
export const ensureSupabaseConfigured = async () => {
  try {
    await getSupabaseInstance();
    return true;
  } catch (error) {
    console.error(' Failed to ensure Supabase configuration:', error);
    return false;
  }
};

// Function to check if the connection is working
export const checkSupabaseConnection = async () => {
  try {
    // Ensure we have the correct configuration first
    const client = await getSupabaseInstance();
    
    const { error } = await client.from('menu_items').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('Supabase connection check failed:', error);
      supabaseConnectionFailed = true;
      return false;
    }
    supabaseConnectionFailed = false;
    return true;
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    supabaseConnectionFailed = true;
    return false;
  }
};

// Check connection status
export const hasSupabaseConnectionFailed = () => supabaseConnectionFailed;

// Function to reinitialize the client with new credentials
export const initializeSupabase = async (url: string, key: string) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('supabaseUrl', url);
      localStorage.setItem('supabaseKey', key);
    }
    
    // Create a new client with the updated credentials
    const newClient = createClient(url, key);
    
    // Test the connection
    const { error } = await newClient.from('menu_items').select('count', { count: 'exact', head: true });
    if (error) throw error;
    
    // If successful, replace the instance
    supabaseInstance = newClient;
    lastClientConfig = { url, anon_key: key };
    supabaseConnectionFailed = false;
    configFetched = true;
    
    toast.success('Database connection updated successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Supabase:', error);
    toast.error('Failed to connect to database. Check your credentials.');
    supabaseConnectionFailed = true;
    return false;
  }
};

// Function to get the current Supabase configuration for debugging
export const getSupabaseConfig = () => {
  return {
    url: 'configured',
    key: 'configured',
    connectionFailed: supabaseConnectionFailed
  };
};

// ============================================================================
// SLEEP/WAKE RECONNECTION (Electron only)
// ============================================================================

/**
 * Reconnect Supabase realtime channels after system resume from sleep.
 *
 * When a laptop sleeps, WebSocket connections go stale. On wake, Supabase
 * Realtime won't automatically reconnect — channels silently stop receiving
 * updates. This function tears down all channels and lets consumers re-subscribe.
 *
 * Called automatically from the Electron preload bridge when the OS resumes.
 */
export const reconnectAfterSleep = async () => {
  console.log('[Supabase] System resumed — reconnecting realtime channels');

  if (!supabaseInstance) {
    console.warn('[Supabase] No client instance to reconnect');
    return;
  }

  try {
    // 1. Remove all existing realtime channels (they're stale after sleep)
    const channels = supabaseInstance.getChannels();
    console.log(`[Supabase] Removing ${channels.length} stale channels`);
    await supabaseInstance.removeAllChannels();

    // 2. Verify the connection is still alive
    const connected = await checkSupabaseConnection();
    if (connected) {
      console.log('[Supabase] Connection verified after resume');
    } else {
      console.warn('[Supabase] Connection check failed after resume — consumers should retry');
    }

    // 3. Dispatch event so all realtime consumers know to re-subscribe
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('supabase-reconnected'));
    }
  } catch (error) {
    console.error('[Supabase] Error during reconnection:', error);
  }
};

// Auto-register sleep/wake handler in Electron
if (typeof window !== 'undefined' && 'electronAPI' in window) {
  const electronAPI = (window as any).electronAPI;
  if (electronAPI?.onSystemResume) {
    electronAPI.onSystemResume(async () => {
      // Small delay to let network interfaces come back up
      await new Promise(resolve => setTimeout(resolve, 2000));
      await reconnectAfterSleep();

      // Re-trigger POS heartbeat so backend knows we're back online
      try {
        const { triggerHeartbeat } = await import('./posHeartbeat');
        await triggerHeartbeat();
        console.log('[Supabase] Heartbeat re-triggered after resume');
      } catch {
        // Heartbeat module may not be loaded in non-POS contexts
      }
    });
    console.log('[Supabase] Registered sleep/wake reconnection handler');
  }
}
