/**
 * usePOSStatusControl Hook
 *
 * Extends useRestaurantAvailability with mutation capabilities
 * for staff to pause/resume online orders and set custom messages.
 *
 * Used by POSDesktop to give staff control over online ordering status.
 */

import { useState, useCallback } from 'react';
import { useRestaurantAvailability, RestaurantAvailability } from './useRestaurantAvailability';

// Check if running in Electron (has electronAPI on window)
const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

// ============================================================================
// TYPES
// ============================================================================

export interface POSStatusControl extends RestaurantAvailability {
  /** Update the online ordering status */
  updateStatus: (isAccepting: boolean, message?: string) => Promise<boolean>;
  /** Whether a status update is in progress */
  isUpdating: boolean;
  /** Error from last update attempt */
  updateError: string | null;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for controlling POS online ordering status.
 *
 * Combines read access (from useRestaurantAvailability) with write access
 * to pause/resume orders and set custom messages.
 *
 * @example
 * ```tsx
 * const { isAcceptingOrders, updateStatus, isUpdating } = usePOSStatusControl();
 *
 * const handleToggle = async (checked: boolean) => {
 *   await updateStatus(checked, checked ? null : 'Back in 10 minutes');
 * };
 * ```
 */
export function usePOSStatusControl(): POSStatusControl {
  const availability = useRestaurantAvailability();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  /**
   * Update the online ordering status.
   *
   * @param isAccepting - Whether to accept online orders
   * @param message - Optional custom message for customers when paused
   * @returns true if update succeeded, false otherwise
   */
  const updateStatus = useCallback(async (
    isAccepting: boolean,
    message?: string
  ): Promise<boolean> => {
    setIsUpdating(true);
    setUpdateError(null);

    try {
      if (isElectron) {
        // Electron: Use brain module for direct Supabase update
        // This avoids the file:// URL resolution issue
        const brain = await import('brain');
        await brain.apiClient.set_pos_status({
          is_accepting_orders: isAccepting,
          custom_message: message || null,
        });
      } else {
        // Web: Use backend API endpoint (proxied by Vite dev server)
        const response = await fetch('/routes/pos/status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_accepting_orders: isAccepting,
            custom_message: message || null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `HTTP ${response.status}`);
        }
      }

      // Success - the useRestaurantAvailability hook will pick up the change
      // on its next poll (every 30 seconds), but we could also manually refresh
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
      console.error('[usePOSStatusControl] Error:', errorMessage);
      setUpdateError(errorMessage);
      return false;

    } finally {
      setIsUpdating(false);
    }
  }, []);

  return {
    ...availability,
    updateStatus,
    isUpdating,
    updateError,
  };
}

export default usePOSStatusControl;
