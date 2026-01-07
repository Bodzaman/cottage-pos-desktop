import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { apiClient } from 'app';

// Flag to track connection status
let supabaseConnectionFailed = false;
let supabaseConfigPromise: Promise<{url: string, anon_key: string}> | null = null;
let configFetched = false;
// Global flag to prevent concurrent client creation
let isClientInitializing = false;

// Default configuration for immediate sync client (will be replaced when backend config loads)
const DEFAULT_CONFIG = {
  url: 'https://mxrkttvgwwdhgnecqhfo.supabase.co',
  anon_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14cmt0dHZnd3dkaGduZWNxaGZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTI0NjcsImV4cCI6MjA2MDQ2ODQyN30.G-Hj0Tf5HpkhzfrZpbxsNcr4-XGA20w5-MRLmix9au4'
};

// Track last client config used so we can decide whether to replace the temporary client
let lastClientConfig: { url: string; anon_key: string } = { ...DEFAULT_CONFIG };

// Create SINGLE client instance - no more multiple client creation
let supabaseInstance: any = null;

// Function to get or create the single Supabase client instance
const getSupabaseInstance = async (): Promise<any> => {
  if (supabaseInstance && configFetched) {
    return supabaseInstance;
  }
  
  // Prevent concurrent client initialization
  if (isClientInitializing) {
    console.log('⏭️ [Supabase] Client already initializing, waiting...');
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
      console.log('🔄 Created single Supabase client instance with correct config');
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
export const supabase = new Proxy({} as any, {
  get(target, prop) {
    if (!supabaseInstance) {
      // For immediate access, create with default config but mark as temporary
      supabaseInstance = createClient(DEFAULT_CONFIG.url, DEFAULT_CONFIG.anon_key);
      lastClientConfig = { ...DEFAULT_CONFIG };
      console.log('⚠️ Created temporary Supabase client - will be replaced with correct config');
      
      // Immediately start fetching correct config to replace it
      getSupabaseInstance().catch(console.error);
    }
    return (supabaseInstance as any)[prop as any];
  }
});

// Fetch Supabase configuration from the backend API
const fetchSupabaseConfig = async (): Promise<{url: string, anon_key: string}> => {
  if (supabaseConfigPromise) {
    return supabaseConfigPromise;
  }
  
  supabaseConfigPromise = (async () => {
    try {
      // Clear any stale localStorage data first
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabaseUrl');
        localStorage.removeItem('supabaseKey');
        console.log('🧹 Cleared stale Supabase config from localStorage');
      }
      
      const response = await apiClient.get_supabase_config();
      
      console.log('🔗 Supabase config API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Supabase config: ${response.status}`);
      }
      
      const config = await response.json();
      console.log('✅ Fetched correct Supabase config from backend:', {
        hasUrl: !!config.url,
        hasKey: !!config.anon_key,
        urlPrefix: config.url?.substring(0, 30) + '...' || 'missing'
      });
      
      // The API returns url and anon_key, so we need to map them correctly
      const mappedConfig = {
        url: config.url,
        anon_key: config.anon_key
      };
      
      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('supabaseUrl', mappedConfig.url);
        localStorage.setItem('supabaseKey', mappedConfig.anon_key);
        console.log('💾 Stored correct Supabase config in localStorage');
      }
      
      // If we already have a client instance created with a different (temporary) config, replace it
      const needsReplacement = !!supabaseInstance && (
        lastClientConfig.url !== mappedConfig.url || lastClientConfig.anon_key !== mappedConfig.anon_key
      );

      if (needsReplacement) {
        try {
          supabaseInstance = createClient(mappedConfig.url, mappedConfig.anon_key);
          lastClientConfig = { ...mappedConfig };
          console.log('✅ Replaced temporary Supabase client with correct config');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('supabase-reconfigured'));
          }
        } catch (e) {
          console.warn('⚠️ Failed to replace Supabase client, continuing with existing instance', e);
        }
      }

      configFetched = true;
      return mappedConfig;
    } catch (error) {
      console.error('❌ Failed to fetch Supabase config from backend:', error);
      
      // Check localStorage for cached configuration
      if (typeof window !== 'undefined') {
        const cachedUrl = localStorage.getItem('supabaseUrl');
        const cachedKey = localStorage.getItem('supabaseKey');
        
        if (cachedUrl && cachedKey) {
          console.log('🔄 Using cached Supabase configuration');
          
          // Update client with cached config if different from default and not already created
          if (!configFetched && (cachedUrl !== DEFAULT_CONFIG.url || cachedKey !== DEFAULT_CONFIG.anon_key)) {
            if (supabaseInstance) {
              supabaseInstance = createClient(cachedUrl, cachedKey);
              lastClientConfig = { url: cachedUrl, anon_key: cachedKey };
              console.log('🔄 Updated client with cached config');
            }
          }
          
          return {
            url: cachedUrl,
            anon_key: cachedKey
          };
        }
      }
      
      // If no cache available, use default (already initialized)
      console.log('⚠️ Using default Supabase configuration');
      return DEFAULT_CONFIG;
    }
  })();
  
  return supabaseConfigPromise;
};

// Initialize the configuration fetch immediately (but don't block)
fetchSupabaseConfig().catch(error => {
  console.warn('Background Supabase config fetch failed:', error);
});

// Export async function to get properly configured client (optional)
export const getSupabase = async () => {
  return await getSupabaseInstance();
};

// Function to ensure Supabase is configured correctly (for backward compatibility)
export const ensureSupabaseConfigured = async () => {
  try {
    await getSupabaseInstance();
    console.log('✅ Supabase configuration verified');
    return true;
  } catch (error) {
    console.error('❌ Failed to ensure Supabase configuration:', error);
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
    console.log('✅ Supabase connection check successful');
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
