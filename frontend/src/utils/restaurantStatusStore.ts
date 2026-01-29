/**
 * Restaurant Status Store (Zustand)
 *
 * Global state management for restaurant availability status.
 * Replaces polling in individual components with a centralized store.
 *
 * Features:
 * - Single source of truth for restaurant status
 * - Polls backend every 30 seconds
 * - Provides countdown timer data
 * - Opening hours and service period info
 * - Subscribable for real-time updates
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

export type ServicePeriod = 'lunch' | 'dinner' | 'closed' | null;
export type UnavailableReason =
  | 'manual_pause'
  | 'pos_offline'
  | 'outside_hours'
  | 'closed_today'
  | 'pos_never_connected'
  | 'pos_initializing'
  | null;

export interface RestaurantStatus {
  // Core availability
  isOnline: boolean;
  isAcceptingOrders: boolean;
  manualAcceptingOrders: boolean;

  // Messages
  customMessage: string | null;
  displayMessage: string | null;
  unavailableReason: UnavailableReason;

  // Opening hours info
  currentService: ServicePeriod;
  nextOpenAt: string | null; // ISO timestamp
  timeUntilOpenSeconds: number | null;
  nextServiceName: ServicePeriod;
  todaysHours: string | null; // "12 PM - 2:30 PM, 5:30 PM - 10 PM"
  isOpenToday: boolean;
  currentDay: string | null;

  // Meta
  isLoading: boolean;
  error: string | null;
  lastChecked: Date | null;
  secondsSinceHeartbeat: number | null;
}

export interface RestaurantStatusStore extends RestaurantStatus {
  // Actions
  fetchStatus: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;

  // Internal
  _pollingInterval: ReturnType<typeof setInterval> | null;
  _isPolling: boolean;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const POLL_INTERVAL_MS = 30 * 1000; // 30 seconds
const STATUS_ENDPOINT = '/routes/pos/status';

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: RestaurantStatus = {
  isOnline: true, // Optimistically assume online
  isAcceptingOrders: true,
  manualAcceptingOrders: true,
  customMessage: null,
  displayMessage: null,
  unavailableReason: null,
  currentService: null,
  nextOpenAt: null,
  timeUntilOpenSeconds: null,
  nextServiceName: null,
  todaysHours: null,
  isOpenToday: true,
  currentDay: null,
  isLoading: true,
  error: null,
  lastChecked: null,
  secondsSinceHeartbeat: null,
};

// ============================================================================
// STORE
// ============================================================================

export const useRestaurantStatusStore = create<RestaurantStatusStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    _pollingInterval: null,
    _isPolling: false,

    fetchStatus: async () => {
      try {
        let data;

        if (isElectron) {
          // Electron: Use brain module for direct Supabase query
          const brain = await import('brain');
          const response = await brain.apiClient.get_pos_status();
          data = await response.json();
        } else {
          // Web: Use backend API endpoint
          const response = await fetch(STATUS_ENDPOINT);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          data = await response.json();
        }

        set({
          isOnline: data.is_online ?? false,
          isAcceptingOrders: data.is_accepting_orders ?? false,
          manualAcceptingOrders: data.manual_accepting_orders ?? true,
          customMessage: data.custom_message || null,
          displayMessage: data.display_message || null,
          unavailableReason: data.unavailable_reason || null,
          currentService: data.current_service || null,
          nextOpenAt: data.next_open_at || null,
          timeUntilOpenSeconds: data.time_until_open_seconds ?? null,
          nextServiceName: data.next_service_name || null,
          todaysHours: data.todays_hours || null,
          isOpenToday: data.is_open_today ?? true,
          currentDay: data.current_day || null,
          isLoading: false,
          error: null,
          lastChecked: new Date(),
          secondsSinceHeartbeat: data.seconds_since_heartbeat ?? null,
        });
      } catch (err) {
        console.error('[RestaurantStatusStore] Error fetching status:', err);
        set({
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to check status',
          lastChecked: new Date(),
        });
      }
    },

    startPolling: () => {
      const state = get();
      if (state._isPolling) {
        return; // Already polling
      }

      // Fetch immediately
      state.fetchStatus();

      // Set up polling interval
      const intervalId = setInterval(() => {
        get().fetchStatus();
      }, POLL_INTERVAL_MS);

      set({
        _pollingInterval: intervalId,
        _isPolling: true,
      });

      console.log('[RestaurantStatusStore] Started polling');
    },

    stopPolling: () => {
      const state = get();
      if (state._pollingInterval) {
        clearInterval(state._pollingInterval);
        set({
          _pollingInterval: null,
          _isPolling: false,
        });
        console.log('[RestaurantStatusStore] Stopped polling');
      }
    },
  }))
);

// ============================================================================
// SELECTORS (for optimized re-renders)
// ============================================================================

export const selectIsAcceptingOrders = (state: RestaurantStatusStore) =>
  state.isAcceptingOrders;

export const selectIsOnline = (state: RestaurantStatusStore) => state.isOnline;

export const selectDisplayMessage = (state: RestaurantStatusStore) =>
  state.displayMessage;

export const selectCurrentService = (state: RestaurantStatusStore) =>
  state.currentService;

export const selectTimeUntilOpen = (state: RestaurantStatusStore) =>
  state.timeUntilOpenSeconds;

export const selectNextOpenAt = (state: RestaurantStatusStore) =>
  state.nextOpenAt;

export const selectTodaysHours = (state: RestaurantStatusStore) =>
  state.todaysHours;

export const selectUnavailableReason = (state: RestaurantStatusStore) =>
  state.unavailableReason;

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to get the full restaurant status.
 * Automatically starts polling when mounted.
 */
export function useRestaurantStatus() {
  const store = useRestaurantStatusStore();

  // Start polling on first use
  if (!store._isPolling && typeof window !== 'undefined') {
    store.startPolling();
  }

  return store;
}

/**
 * Simple hook to check if restaurant is accepting orders.
 * Returns true while loading to avoid blocking UI.
 */
export function useIsRestaurantOpen(): boolean {
  const { isAcceptingOrders, isLoading } = useRestaurantStatusStore();

  // Start polling if not already
  const store = useRestaurantStatusStore.getState();
  if (!store._isPolling && typeof window !== 'undefined') {
    store.startPolling();
  }

  // Return true while loading to avoid blocking UI
  if (isLoading) {
    return true;
  }

  return isAcceptingOrders;
}

/**
 * Get formatted time until restaurant opens.
 * Returns strings like "45 min", "2h 30min", "Opens tomorrow at 12 PM"
 */
export function useTimeUntilOpen(): string | null {
  const { timeUntilOpenSeconds, nextOpenAt, nextServiceName } =
    useRestaurantStatusStore();

  if (timeUntilOpenSeconds === null || timeUntilOpenSeconds <= 0) {
    return null;
  }

  const hours = Math.floor(timeUntilOpenSeconds / 3600);
  const minutes = Math.floor((timeUntilOpenSeconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (hours < 24) {
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  }

  // More than 24 hours - show the next open time
  if (nextOpenAt) {
    try {
      const date = new Date(nextOpenAt);
      const dayName = date.toLocaleDateString('en-GB', { weekday: 'long' });
      const time = date.toLocaleTimeString('en-GB', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return `${dayName} at ${time}`;
    } catch {
      return null;
    }
  }

  return null;
}
