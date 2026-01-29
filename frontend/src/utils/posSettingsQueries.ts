/**
 * POS Settings React Query Hooks
 *
 * React Query-based data fetching for POS settings.
 * Replaces manual caching and module-level flags in posSettingsStore.
 *
 * Benefits:
 * - Automatic cache management with staleTime/gcTime
 * - Request deduplication built-in
 * - No module-level flags or race conditions
 * - Background refetch on window focus
 * - useMutation for optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import brain from 'brain';
import { toast } from 'sonner';
import type { POSSettings, UrgencySettings } from './posSettingsStore';
import { DEFAULT_URGENCY_SETTINGS } from './posSettingsStore';

// ==============================================================================
// QUERY KEYS
// ==============================================================================

export const posSettingsKeys = {
  all: ['pos-settings'] as const,
  settings: () => [...posSettingsKeys.all, 'current'] as const,
};

// ==============================================================================
// DEFAULT VALUES
// ==============================================================================

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
  variant_carousel_enabled: true,
  urgency_settings: DEFAULT_URGENCY_SETTINGS
};

// ==============================================================================
// FETCHERS
// ==============================================================================

async function fetchPOSSettings(): Promise<POSSettings> {
  const response = await brain.get_pos_settings();
  const result = await response.json();

  if (result.settings) {
    console.log('[posSettingsQueries] Settings fetched successfully');
    return result.settings;
  }

  console.warn('[posSettingsQueries] No settings received, using defaults');
  return defaultPOSSettings;
}

async function updatePOSSettings(settings: POSSettings): Promise<POSSettings> {
  const response = await brain.save_pos_settings({ settings });
  const result = await response.json();

  if (result.success) {
    console.log('[posSettingsQueries] Settings updated successfully');
    return settings;
  }

  throw new Error(result.message || 'Failed to save settings');
}

// ==============================================================================
// HOOKS
// ==============================================================================

/**
 * Main hook to fetch POS settings.
 * Uses React Query for automatic caching, deduplication, and background refetch.
 *
 * @example
 * ```tsx
 * const { data: settings, isLoading, error } = usePOSSettingsQuery();
 * ```
 */
export function usePOSSettingsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: posSettingsKeys.settings(),
    queryFn: fetchPOSSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes (matching original cache TTL)
    gcTime: 60 * 60 * 1000,   // 1 hour retention
    enabled: options?.enabled ?? true,
    refetchOnWindowFocus: true,
    // Return defaults on error to match original behavior
    placeholderData: defaultPOSSettings,
  });
}

/**
 * Hook to get urgency settings specifically.
 */
export function useUrgencySettingsQuery() {
  const { data: settings, ...rest } = usePOSSettingsQuery();
  return {
    data: settings?.urgency_settings ?? DEFAULT_URGENCY_SETTINGS,
    ...rest
  };
}

/**
 * Hook to get service charge settings specifically.
 */
export function useServiceChargeSettingsQuery() {
  const { data: settings, ...rest } = usePOSSettingsQuery();
  return {
    data: settings?.service_charge ?? { enabled: false, percentage: 10.0 },
    ...rest
  };
}

/**
 * Hook to get delivery charge settings specifically.
 */
export function useDeliveryChargeSettingsQuery() {
  const { data: settings, ...rest } = usePOSSettingsQuery();
  return {
    data: settings?.delivery_charge ?? { enabled: true, amount: 3.50 },
    ...rest
  };
}

/**
 * Hook to get delivery settings specifically.
 */
export function useDeliverySettingsQuery() {
  const { data: settings, ...rest } = usePOSSettingsQuery();
  return {
    data: settings?.delivery ?? {
      radius_miles: 6.0,
      minimum_order_value: 15.0,
      allowed_postcodes: ["RH20", "BN5", "RH13", "BN6", "RH14"]
    },
    ...rest
  };
}

// ==============================================================================
// MUTATIONS
// ==============================================================================

/**
 * Hook to update POS settings with optimistic updates.
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdatePOSSettings();
 *
 * const handleSave = async () => {
 *   await updateMutation.mutateAsync(newSettings);
 * };
 * ```
 */
export function useUpdatePOSSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePOSSettings,
    onMutate: async (newSettings) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: posSettingsKeys.settings() });

      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData<POSSettings>(posSettingsKeys.settings());

      // Optimistically update to the new value
      queryClient.setQueryData(posSettingsKeys.settings(), newSettings);

      // Return context with the previous value
      return { previousSettings };
    },
    onError: (err, newSettings, context) => {
      // Rollback to the previous value on error
      if (context?.previousSettings) {
        queryClient.setQueryData(posSettingsKeys.settings(), context.previousSettings);
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
      toast.error(`Failed to update settings: ${errorMessage}`);
    },
    onSuccess: () => {
      toast.success('POS settings updated successfully');
    },
    onSettled: () => {
      // Refetch to ensure server state is accurate
      queryClient.invalidateQueries({ queryKey: posSettingsKeys.settings() });
    },
  });
}

// ==============================================================================
// INVALIDATION HELPERS
// ==============================================================================

/**
 * Hook to get a function that invalidates POS settings cache.
 * Useful after external updates.
 */
export function useInvalidatePOSSettings() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: posSettingsKeys.settings() });
  };
}

/**
 * Get POS settings from cache (for imperative access).
 */
export function getPOSSettingsFromCache(queryClient: ReturnType<typeof useQueryClient>): POSSettings {
  return queryClient.getQueryData<POSSettings>(posSettingsKeys.settings()) ?? defaultPOSSettings;
}
