/**
 * Restaurant Config React Query Hooks
 *
 * React Query-based data fetching for restaurant configuration.
 * Used by checkout and other public pages.
 */

import { useQuery } from '@tanstack/react-query';
import brain from 'brain';

// ==============================================================================
// TYPES
// ==============================================================================

export interface RestaurantConfig {
  name: string;
  address: string;
  postcode: string;
  phone: string;
  email?: string;
  delivery_fee: number;
  delivery_free_over: number;
  delivery_min_order: number;
  estimated_delivery_time: string;
  estimated_collection_time: string;
  delivery_enabled: boolean;
}

// ==============================================================================
// QUERY KEYS
// ==============================================================================

export const restaurantConfigKeys = {
  all: ['restaurant-config'] as const,
  config: () => [...restaurantConfigKeys.all, 'current'] as const,
};

// ==============================================================================
// DEFAULTS
// ==============================================================================

const DEFAULT_CONFIG: RestaurantConfig = {
  name: 'Cottage Tandoori',
  address: '25 West St, Storrington, Pulborough, West Sussex',
  postcode: 'RH20 4DZ',
  phone: '01903 743343',
  delivery_fee: 3.50,
  delivery_free_over: 30,
  delivery_min_order: 15,
  estimated_delivery_time: '25-35 minutes',
  estimated_collection_time: '15-20 minutes',
  delivery_enabled: true,
};

// ==============================================================================
// FETCHERS
// ==============================================================================

async function fetchRestaurantConfig(): Promise<RestaurantConfig> {
  const response = await brain.get_restaurant_config();
  const data = await response.json();

  if (data.success && data.config) {
    console.log('[restaurantConfigQueries] Config fetched successfully');
    return data.config;
  }

  console.warn('[restaurantConfigQueries] No config received, using defaults');
  return DEFAULT_CONFIG;
}

// ==============================================================================
// HOOKS
// ==============================================================================

/**
 * Hook to fetch restaurant configuration.
 * Uses React Query for automatic caching and deduplication.
 *
 * @example
 * ```tsx
 * const { data: config, isLoading, error } = useRestaurantConfig();
 *
 * if (isLoading) return <Loading />;
 *
 * return <div>Pickup at {config?.name}</div>;
 * ```
 */
export function useRestaurantConfig(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: restaurantConfigKeys.config(),
    queryFn: fetchRestaurantConfig,
    staleTime: 60 * 60 * 1000, // 1 hour (config rarely changes)
    gcTime: 24 * 60 * 60 * 1000, // 24 hours retention
    enabled: options?.enabled ?? true,
    placeholderData: DEFAULT_CONFIG, // Show defaults while loading
  });
}

/**
 * Get default restaurant config (for fallback scenarios).
 */
export function getDefaultRestaurantConfig(): RestaurantConfig {
  return DEFAULT_CONFIG;
}
