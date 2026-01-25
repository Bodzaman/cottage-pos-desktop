/**
 * Maps Config Store
 *
 * Zustand store for caching the Google Maps API key globally.
 * This prevents redundant API calls when switching between order types
 * (Collection/Delivery) which would otherwise cause jarring UI delays.
 *
 * The API key is fetched once and reused across all components that need it.
 */

import { create } from 'zustand';
import brain from 'brain';

interface RestaurantLocation {
  lat: number;
  lng: number;
  address?: string;
}

interface MapsConfigStore {
  // State
  apiKey: string | null;
  restaurantLocation: RestaurantLocation | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  // Actions
  fetchApiKey: () => Promise<void>;
  reset: () => void;
}

// Cache duration: 5 minutes (in milliseconds)
const CACHE_DURATION = 5 * 60 * 1000;

export const useMapsConfigStore = create<MapsConfigStore>((set, get) => ({
  // Initial state
  apiKey: null,
  restaurantLocation: null,
  isLoading: false,
  error: null,
  lastFetched: null,

  // Fetch API key (only if not already cached or cache expired)
  fetchApiKey: async () => {
    const state = get();

    // Skip if already loading
    if (state.isLoading) {
      return;
    }

    // Skip if we have a valid cached key
    if (state.apiKey && state.lastFetched) {
      const age = Date.now() - state.lastFetched;
      if (age < CACHE_DURATION) {
        return;
      }
    }

    set({ isLoading: true, error: null });

    try {
      const response = await brain.get_maps_config();
      const data = await response.json();

      if (data?.apiKey) {
        set({
          apiKey: data.apiKey,
          restaurantLocation: data.restaurant
            ? {
                lat: data.restaurant.latitude,
                lng: data.restaurant.longitude,
                address: data.restaurant.address,
              }
            : null,
          isLoading: false,
          error: null,
          lastFetched: Date.now(),
        });
      } else {
        set({
          apiKey: null,
          isLoading: false,
          error: 'Google Maps API key not found',
          lastFetched: Date.now(),
        });
      }
    } catch (error) {
      console.error('[MapsConfigStore] Failed to fetch maps config:', error);
      set({
        isLoading: false,
        error: 'Failed to load address lookup service',
        lastFetched: null,
      });
    }
  },

  // Reset state (useful for testing or logout)
  reset: () => {
    set({
      apiKey: null,
      restaurantLocation: null,
      isLoading: false,
      error: null,
      lastFetched: null,
    });
  },
}));

// Export a hook for convenience
export const useMapsConfig = () => {
  const store = useMapsConfigStore();
  return {
    apiKey: store.apiKey,
    restaurantLocation: store.restaurantLocation,
    isLoading: store.isLoading,
    error: store.error,
    fetchApiKey: store.fetchApiKey,
  };
};

export default useMapsConfigStore;
