/**
 * KDS Authentication Utilities
 * Manages kitchen display PIN lock state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from 'app';

interface KDSAuthState {
  isLocked: boolean;
  lastActivityTime: number;
  autoLockMinutes: number;
  lock: () => void;
  unlock: () => void;
  updateActivity: () => void;
  checkAutoLock: () => void;
  setAutoLockMinutes: (minutes: number) => void;
}

/**
 * KDS Auth Store
 * Manages lock state and auto-lock functionality
 */
export const useKDSAuth = create<KDSAuthState>()(
  persist(
    (set, get) => ({
      isLocked: true, // Default to locked
      lastActivityTime: Date.now(),
      autoLockMinutes: 30,

      lock: () => {
        set({ isLocked: true });
      },

      unlock: () => {
        set({ 
          isLocked: false,
          lastActivityTime: Date.now() 
        });
      },

      updateActivity: () => {
        set({ lastActivityTime: Date.now() });
      },

      checkAutoLock: () => {
        const { isLocked, lastActivityTime, autoLockMinutes } = get();
        if (!isLocked) {
          const inactiveMinutes = (Date.now() - lastActivityTime) / 1000 / 60;
          if (inactiveMinutes >= autoLockMinutes) {
            set({ isLocked: true });
            return true;
          }
        }
        return false;
      },

      setAutoLockMinutes: (minutes: number) => {
        set({ autoLockMinutes: minutes });
      },
    }),
    {
      name: 'kds-auth-storage',
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => sessionStorage.removeItem(name),
      },
      // Persist lock state and settings during browser session
      partialize: (state) => ({ 
        isLocked: state.isLocked, // Persist to prevent reset on rerender
        autoLockMinutes: state.autoLockMinutes 
      }),
    }
  )
);

/**
 * Initialize KDS schema on first use
 */
export async function initializeKDSSchema(): Promise<boolean> {
  try {
    const response = await apiClient.setup_kds_schema();
    const result = await response.json();
    return result.success || false;
  } catch (error) {
    console.error('Failed to initialize KDS schema:', error);
    return false;
  }
}

/**
 * Check if KDS is configured with a PIN
 */
export async function checkKDSSetup(): Promise<{
  schemaReady: boolean;
  hasPinSet: boolean;
  message: string;
}> {
  try {
    const response = await apiClient.check_kds_schema();
    const result = await response.json();
    return {
      schemaReady: result.schema_ready || false,
      hasPinSet: result.has_pin_set || false,
      message: result.message || ''
    };
  } catch (error) {
    console.error('Failed to check KDS setup:', error);
    return {
      schemaReady: false,
      hasPinSet: false,
      message: 'Setup check failed'
    };
  }
}

/**
 * Set KDS PIN (admin function)
 */
export async function setKDSPin(pin: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiClient.set_kds_pin({ pin });
    const result = await response.json();
    return {
      success: result.success || false,
      message: result.message || ''
    };
  } catch (error) {
    console.error('Failed to set KDS PIN:', error);
    return {
      success: false,
      message: 'Failed to set PIN'
    };
  }
}
