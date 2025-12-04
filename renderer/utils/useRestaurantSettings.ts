

import { useState, useEffect, useCallback } from 'react';
import brain from 'brain';
import { toast } from 'sonner';

// Types for restaurant settings
export interface BusinessProfile {
  name: string;
  address: string;
  postcode: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  tax_id: string;
  logo_url: string;
}

export interface OpeningHours {
  day: string;
  open: string;
  close: string;
  is_closed: boolean;
}

export interface DeliverySettings {
  radius_km: number;
  postcodes: string[];
  min_order: number;
  delivery_fee: number;
}

export interface KitchenStatus {
  is_open: boolean;
  message: string;
}

export interface AIMessages {
  greeting: string;
  closing: string;
  busy_message: string;
}

export interface RestaurantSettings {
  business_profile: BusinessProfile;
  opening_hours: OpeningHours[];
  delivery: DeliverySettings;
  kitchen_status: KitchenStatus;
  ai_messages: AIMessages;
}

// Default values
export const defaultBusinessProfile: BusinessProfile = {
  name: "Cottage Tandoori",
  address: "25 West St, Storrington, Pulborough, West Sussex",
  postcode: "RH20 4DZ",
  phone: "01903 743343",
  email: "contact@cottagetandoori.co.uk",
  website: "www.cottagetandoori.co.uk",
  description: "Authentic Indian cuisine in a warm and welcoming environment",
  tax_id: "GB123456789",
  logo_url: ""
};

export const defaultOpeningHours: OpeningHours[] = [
  { day: "Monday", open: "17:00", close: "23:00", is_closed: false },
  { day: "Tuesday", open: "17:00", close: "23:00", is_closed: false },
  { day: "Wednesday", open: "17:00", close: "23:00", is_closed: false },
  { day: "Thursday", open: "17:00", close: "23:00", is_closed: false },
  { day: "Friday", open: "17:00", close: "23:00", is_closed: false },
  { day: "Saturday", open: "17:00", close: "23:00", is_closed: false },
  { day: "Sunday", open: "17:00", close: "23:00", is_closed: false },
];

export const defaultDeliverySettings: DeliverySettings = {
  radius_km: 9.65, // 6 miles
  postcodes: [],
  min_order: 15.0,
  delivery_fee: 2.5
};

export const defaultKitchenStatus: KitchenStatus = {
  is_open: true,
  message: ""
};

export const defaultAIMessages: AIMessages = {
  greeting: "Welcome to Cottage Tandoori, how may I assist you today?",
  closing: "Thank you for choosing Cottage Tandoori. We look forward to serving you.",
  busy_message: "We're currently experiencing high demand. Your order may take slightly longer than usual. Thank you for your patience."
};

export const defaultRestaurantSettings: RestaurantSettings = {
  business_profile: defaultBusinessProfile,
  opening_hours: defaultOpeningHours,
  delivery: defaultDeliverySettings,
  kitchen_status: defaultKitchenStatus,
  ai_messages: defaultAIMessages
};

// Cache management
let settingsCache: RestaurantSettings | null = null;
let lastFetchTime: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Custom hook for accessing and managing restaurant settings
 * Provides centralized access to all restaurant settings with caching
 */
export function useRestaurantSettings() {
  const [settings, setSettings] = useState<RestaurantSettings | null>(settingsCache);
  const [isLoading, setIsLoading] = useState<boolean>(!settingsCache);
  const [error, setError] = useState<Error | null>(null);

  // Load settings from API or cache
  const loadSettings = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setError(null);
      
      // Check if we can use the cache
      const now = Date.now();
      if (
        !forceRefresh && 
        settingsCache && 
        now - lastFetchTime < CACHE_TTL
      ) {
        setSettings(settingsCache);
        setIsLoading(false);
        return settingsCache;
      }
      
      // Cache expired or force refresh, fetch from API
      setIsLoading(true);
      
      const response = await brain.get_restaurant_settings();
      const data = await response.json();
      
      if (data.success && data.settings) {
        // Ensure we have complete settings by merging with defaults for any missing sections
        const completeSettings = {
          ...defaultRestaurantSettings,
          ...data.settings,
          // Ensure nested objects are properly merged with defaults
          business_profile: {
            ...defaultBusinessProfile,
            ...data.settings.business_profile
          },
          opening_hours: data.settings.opening_hours || defaultOpeningHours,
          delivery: {
            ...defaultDeliverySettings,
            ...data.settings.delivery
          },
          kitchen_status: {
            ...defaultKitchenStatus,
            ...data.settings.kitchen_status
          },
          ai_messages: {
            ...defaultAIMessages,
            ...data.settings.ai_messages
          }
        };
        
        // Update the local state and cache
        settingsCache = completeSettings;
        lastFetchTime = now;
        setSettings(completeSettings);
        return completeSettings;
      } else {
        // If API returned success but no data, use defaults
        console.warn('No settings found in API response, using defaults');
        settingsCache = defaultRestaurantSettings;
        lastFetchTime = now;
        setSettings(defaultRestaurantSettings);
        return defaultRestaurantSettings;
      }
    } catch (err) {
      console.error('Error loading restaurant settings:', err);
      setError(err instanceof Error ? err : new Error('Failed to load settings'));
      
      // If this is the first load and we have no cache, use defaults
      if (!settingsCache) {
        settingsCache = defaultRestaurantSettings;
        setSettings(defaultRestaurantSettings);
      }
      
      return settingsCache;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save settings to API
  const saveSettings = useCallback(async (newSettings: Partial<RestaurantSettings>): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // If we don't have existing settings, load them first
      if (!settings && !settingsCache) {
        await loadSettings();
      }
      
      // Merge with existing settings to create a complete settings object
      const currentSettings = settings || settingsCache || defaultRestaurantSettings;
      const mergedSettings = {
        ...currentSettings,
        ...newSettings,
        // Handle nested objects correctly if they're being updated
        ...(newSettings.business_profile ? {
          business_profile: {
            ...currentSettings.business_profile,
            ...newSettings.business_profile
          }
        } : {}),
        ...(newSettings.delivery ? {
          delivery: {
            ...currentSettings.delivery,
            ...newSettings.delivery
          }
        } : {}),
        ...(newSettings.kitchen_status ? {
          kitchen_status: {
            ...currentSettings.kitchen_status,
            ...newSettings.kitchen_status
          }
        } : {}),
        ...(newSettings.ai_messages ? {
          ai_messages: {
            ...currentSettings.ai_messages,
            ...newSettings.ai_messages
          }
        } : {})
      };
      
      const response = await brain.save_restaurant_settings({
        settings: mergedSettings
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update cache and state with the new settings
        settingsCache = mergedSettings;
        lastFetchTime = Date.now();
        setSettings(mergedSettings);
        toast.success('Restaurant settings saved successfully');
        return true;
      } else {
        toast.error(`Failed to save settings: ${data.message || 'Unknown error'}`);
        return false;
      }
    } catch (err) {
      console.error('Error saving restaurant settings:', err);
      setError(err instanceof Error ? err : new Error('Failed to save settings'));
      toast.error('Error saving restaurant settings');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [settings, loadSettings]);

  // Clear cache (useful when testing)
  const clearCache = useCallback(() => {
    settingsCache = null;
    lastFetchTime = 0;
  }, []);

  // Load settings on mount if not already in cache
  useEffect(() => {
    if (!settingsCache) {
      loadSettings();
    }
  }, [loadSettings]);

  // Return everything needed to work with restaurant settings
  return {
    settings,
    isLoading,
    error,
    loadSettings,
    saveSettings,
    clearCache,
    // Utility function to get a specific part of settings with defaults
    getBusinessProfile: () => settings?.business_profile || defaultBusinessProfile,
    getOpeningHours: () => settings?.opening_hours || defaultOpeningHours,
    getDeliverySettings: () => settings?.delivery || defaultDeliverySettings,
    getKitchenStatus: () => settings?.kitchen_status || defaultKitchenStatus,
    getAIMessages: () => settings?.ai_messages || defaultAIMessages,
    // Helper methods for specific section updates
    updateProfile: async (profileUpdates: Partial<BusinessProfile>) => {
      const currentProfile = settings?.business_profile || defaultBusinessProfile;
      const updatedProfile = {
        ...currentProfile,
        ...profileUpdates
      };
      
      // Send profile as separate field, not nested in settings
      const response = await brain.save_restaurant_settings({
        profile: updatedProfile
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local cache with the new profile data
        const updatedSettings = {
          ...(settings || defaultRestaurantSettings),
          business_profile: updatedProfile
        };
        
        settingsCache = updatedSettings;
        lastFetchTime = Date.now();
        setSettings(updatedSettings);
        return true;
      } else {
        console.error('Failed to save profile:', data.message);
        return false;
      }
    },
    updateOpeningHours: async (hoursUpdates: OpeningHours[]) => {
      return saveSettings({ opening_hours: hoursUpdates });
    },
    updateDeliverySettings: async (deliveryUpdates: Partial<DeliverySettings>) => {
      try {
        setIsLoading(true);
        setError(null);

        // Get current delivery settings and merge with updates
        const currentDelivery = settings?.delivery || settingsCache?.delivery || defaultDeliverySettings;
        const mergedDelivery = {
          ...currentDelivery,
          ...deliveryUpdates
        };

        // Send delivery data directly to the backend endpoint
        const response = await brain.save_restaurant_settings({
          delivery: mergedDelivery
        });

        const data = await response.json();

        if (data.success) {
          // Update local cache with the new delivery settings
          const updatedSettings = {
            ...(settings || settingsCache || defaultRestaurantSettings),
            delivery: mergedDelivery
          };
          
          settingsCache = updatedSettings;
          lastFetchTime = Date.now();
          setSettings(updatedSettings);
          toast.success('Delivery settings saved successfully');
          return true;
        } else {
          toast.error(`Failed to save delivery settings: ${data.message || 'Unknown error'}`);
          return false;
        }
      } catch (err) {
        console.error('Error saving delivery settings:', err);
        setError(err instanceof Error ? err : new Error('Failed to save delivery settings'));
        toast.error('Error saving delivery settings');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    updateKitchenStatus: async (statusUpdates: Partial<KitchenStatus>) => {
      return saveSettings({
        kitchen_status: {
          ...(settings?.kitchen_status || defaultKitchenStatus),
          ...statusUpdates
        }
      });
    },
    updateAIMessages: async (messageUpdates: Partial<AIMessages>) => {
      return saveSettings({
        ai_messages: {
          ...(settings?.ai_messages || defaultAIMessages),
          ...messageUpdates
        }
      });
    }
  };
}
