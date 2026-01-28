/**
 * useRestaurantAvailability Hook
 *
 * Polls the POS status endpoint to check if the restaurant is online
 * and accepting orders. Used by the customer website to show real-time
 * availability status and block checkout when POS is offline.
 *
 * Features:
 * - Polls every 30 seconds for real-time status
 * - Shows different states: online, offline, checking
 * - Provides custom message from restaurant (e.g., "Back in 10 minutes")
 * - Handles errors gracefully
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface RestaurantAvailability {
  /** Whether the POS system is online (received heartbeat recently) */
  isOnline: boolean;
  /** Whether the restaurant is accepting orders (combined: manual AND online AND hours) */
  isAcceptingOrders: boolean;
  /** Raw manual toggle value (for staff control, independent of heartbeat) */
  manualAcceptingOrders: boolean;
  /** Custom message from the restaurant (e.g., "Back in 10 minutes") */
  customMessage?: string | null;
  /** Whether we're currently checking status */
  isLoading: boolean;
  /** Any error that occurred during status check */
  error?: string | null;
  /** Timestamp of last successful check */
  lastChecked?: Date | null;
  /** Seconds since last heartbeat (for debugging) */
  secondsSinceHeartbeat?: number | null;
  /** Reason why ordering is unavailable (e.g., "manual_pause", "outside_hours") */
  unavailableReason?: string | null;
  /** Professional customer-facing message from backend */
  displayMessage?: string | null;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/** How often to poll for status (in milliseconds) */
const POLL_INTERVAL_MS = 30 * 1000; // 30 seconds

/** Backend status endpoint */
const STATUS_ENDPOINT = '/routes/pos/status';

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to check restaurant availability status.
 *
 * @param options.enabled - Whether to enable polling (default: true)
 * @param options.pollInterval - Custom poll interval in ms (default: 30000)
 * @returns RestaurantAvailability object with current status
 */
export function useRestaurantAvailability(options?: {
  enabled?: boolean;
  pollInterval?: number;
}): RestaurantAvailability {
  const { enabled = true, pollInterval = POLL_INTERVAL_MS } = options || {};

  const [status, setStatus] = useState<RestaurantAvailability>({
    isOnline: true, // Optimistically assume online initially
    isAcceptingOrders: true,
    manualAcceptingOrders: true, // Raw manual toggle value
    customMessage: null,
    isLoading: true,
    error: null,
    lastChecked: null,
    secondsSinceHeartbeat: null,
    unavailableReason: null,
    displayMessage: null,
  });

  /**
   * Fetch current POS status from backend
   */
  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch(STATUS_ENDPOINT);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      setStatus({
        isOnline: data.is_online ?? false,
        isAcceptingOrders: data.is_accepting_orders ?? false,
        manualAcceptingOrders: data.manual_accepting_orders ?? true,
        customMessage: data.custom_message || null,
        isLoading: false,
        error: null,
        lastChecked: new Date(),
        secondsSinceHeartbeat: data.seconds_since_heartbeat ?? null,
        unavailableReason: data.unavailable_reason || null,
        displayMessage: data.display_message || null,
      });
    } catch (err) {
      console.error('[useRestaurantAvailability] Error checking status:', err);

      setStatus((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to check status',
        lastChecked: new Date(),
      }));
    }
  }, []);

  // Initial check and polling
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Check immediately on mount
    checkStatus();

    // Set up polling interval
    const intervalId = setInterval(checkStatus, pollInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, pollInterval, checkStatus]);

  return status;
}

/**
 * Simple hook to check if restaurant is accepting orders.
 * Returns just a boolean for simpler use cases.
 */
export function useIsRestaurantOpen(): boolean {
  const { isAcceptingOrders, isLoading } = useRestaurantAvailability();

  // Return true while loading to avoid blocking UI
  if (isLoading) {
    return true;
  }

  return isAcceptingOrders;
}
