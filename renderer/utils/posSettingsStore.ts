import { create } from 'zustand';
import { apiClient } from 'app';
import { toast } from 'sonner';

// Types matching the backend POSSettings model
interface POSServiceChargeSettings {
  enabled: boolean;
  percentage: number;
}

interface POSDeliveryChargeSettings {
  enabled: boolean;
  amount: number;
}

interface POSDeliverySettings {
  radius_miles: number;
  minimum_order_value: number;
  allowed_postcodes: string[];
}

interface POSSettings {
  service_charge: POSServiceChargeSettings;
  delivery_charge: POSDeliveryChargeSettings;
  delivery: POSDeliverySettings;
}

interface POSSettingsStore {
  settings: POSSettings | null;
  isLoading: boolean;
  error: string | null;
  lastFetch: number;
  
  // Actions
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: POSSettings) => Promise<boolean>;
  refreshSettings: () => Promise<void>;
}

// Default settings to match backend defaults
const defaultPOSSettings: POSSettings = {
  service_charge: {
    enabled: false,
    percentage: 10.0
  },
  delivery_charge: {
    enabled: true,
    amount: 3.50
  },
  delivery: {
    radius_miles: 6.0,
    minimum_order_value: 15.0,
    allowed_postcodes: ["RH20", "BN5", "RH13", "BN6", "RH14"]
  },
  variant_carousel_enabled: true
};

export const usePOSSettings = create<POSSettingsStore>((set, get) => ({
  settings: defaultPOSSettings, // Start with defaults
  isLoading: false,
  error: null,
  lastFetch: 0,
  
  fetchSettings: async () => {
    const state = get();
    
    // Avoid unnecessary fetches (cache for 5 minutes)
    const now = Date.now();
    if (state.lastFetch && (now - state.lastFetch) < 5 * 60 * 1000 && state.settings) {
      return;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiClient.get_pos_settings();
      const result = await response.json();
      
      if (result.settings) {
        set({ 
          settings: result.settings, 
          isLoading: false, 
          lastFetch: now,
          error: null 
        });
      } else {
        console.warn('No POS settings received, using defaults');
        set({ 
          settings: defaultPOSSettings, 
          isLoading: false, 
          lastFetch: now,
          error: null 
        });
      }
    } catch (error) {
      console.error('Failed to fetch POS settings:', error);
      set({ 
        settings: defaultPOSSettings, // Fallback to defaults
        isLoading: false, 
        error: 'Failed to load settings, using defaults',
        lastFetch: now
      });
    }
  },
  
  updateSettings: async (newSettings: POSSettings) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiClient.save_pos_settings({ settings: newSettings });
      const result = await response.json();
      
      if (result.success) {
        set({ 
          settings: newSettings, 
          isLoading: false, 
          lastFetch: Date.now(),
          error: null 
        });
        toast.success('POS settings updated successfully');
        return true;
      } else {
        throw new Error(result.message || 'Failed to save settings');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
      console.error('Failed to update POS settings:', error);
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      toast.error(`Failed to update settings: ${errorMessage}`);
      return false;
    }
  },
  
  refreshSettings: async () => {
    set({ lastFetch: 0 }); // Force refresh
    await get().fetchSettings();
  }
}));

// Auto-fetch settings on first use
let hasAutoFetched = false;
export const useAutoFetchPOSSettings = () => {
  const { fetchSettings, settings } = usePOSSettings();
  
  // Auto-fetch once when first component using settings mounts
  if (!hasAutoFetched) {
    hasAutoFetched = true;
    fetchSettings().catch(console.error);
  }
  
  return settings;
};

// Hook for components that need POS settings
export const usePOSSettingsWithAutoFetch = () => {
  const store = usePOSSettings();
  useAutoFetchPOSSettings(); // Trigger auto-fetch
  return store;
};
