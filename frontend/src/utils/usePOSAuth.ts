import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabaseClient';

/** Compute SHA-256 hash of PIN + userId for offline verification */
async function hashPinLocally(pin: string, userId: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + ':' + userId);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export type UserRole = 'staff' | 'admin';

interface POSStaffUser {
  userId: string;
  username: string;
  fullName: string;
  role: UserRole;
}

interface POSAuthStore {
  user: POSStaffUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // PIN state (persisted)
  pinEnabled: boolean;
  lastUserId: string | null;
  lastUserName: string | null;
  lastUserRole: UserRole | null;
  localPinHash: string | null;

  // Role helpers
  isAdmin: () => boolean;
  isStaff: () => boolean;
  getRole: () => UserRole | null;

  // Actions
  login: (username: string, password: string) => Promise<void>;
  loginWithPin: (pin: string) => Promise<boolean>;
  setPin: (pin: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

/**
 * Zustand store for POS staff authentication.
 * Uses username/password with server-side bcrypt validation via pos_staff_login RPC.
 * Session persists across page reloads.
 */
export const usePOSAuth = create<POSAuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      pinEnabled: false,
      lastUserId: null,
      lastUserName: null,
      lastUserRole: null,
      localPinHash: null,

      // Role helpers
      isAdmin: () => get().user?.role === 'admin',
      isStaff: () => get().user?.role === 'staff',
      getRole: () => get().user?.role ?? null,

      login: async (username: string, password: string) => {
        set({ isLoading: true });

        try {
          // Call RPC for secure server-side validation with bcrypt
          const { data, error } = await supabase.rpc('pos_staff_login', {
            p_username: username,
            p_password: password
          });

          if (error) {
            console.error('Login RPC error:', error);
            throw new Error('Login failed. Please try again.');
          }

          if (!data || data.length === 0) {
            throw new Error('Invalid username or password');
          }

          const user = data[0];

          set({
            user: {
              userId: user.user_id,
              username: user.username,
              fullName: user.full_name,
              role: user.role || 'staff'
            },
            isAuthenticated: true,
            isLoading: false,
            lastUserId: user.user_id,
            lastUserName: user.full_name,
            lastUserRole: user.role || 'staff',
            // Sync PIN status from database (overrides stale localStorage)
            pinEnabled: user.pin_enabled ?? false
          });
        } catch (error) {
          set({ isLoading: false, isAuthenticated: false, user: null });
          throw error;
        }
      },

      loginWithPin: async (pin: string): Promise<boolean> => {
        const { lastUserId, localPinHash, user } = get();
        if (!lastUserId) return false;

        set({ isLoading: true });

        // Try server-side verification first (when online)
        try {
          const { data, error } = await supabase.rpc('pos_staff_login_pin', {
            p_user_id: lastUserId,
            p_pin: pin
          });

          if (!error && data?.success) {
            set({
              user: {
                userId: data.user_id,
                username: data.username,
                fullName: data.full_name,
                role: data.role || 'staff'
              },
              isAuthenticated: true,
              isLoading: false,
              lastUserRole: data.role || 'staff'
            });
            return true;
          }

          // RPC returned invalid PIN (not a network error)
          if (!error && data && !data.success) {
            set({ isLoading: false });
            return false;
          }
        } catch {
          // Network error — fall through to offline verification
        }

        // Offline fallback: verify against local SHA-256 hash
        const { lastUserRole } = get();
        if (localPinHash && user) {
          const computedHash = await hashPinLocally(pin, lastUserId);
          if (computedHash === localPinHash) {
            // Restore user with persisted role for offline access
            set({
              isAuthenticated: true,
              isLoading: false,
              user: {
                ...user,
                role: lastUserRole || user.role || 'staff'
              }
            });
            return true;
          }
        }

        set({ isLoading: false });
        return false;
      },

      setPin: async (pin: string): Promise<boolean> => {
        const { user } = get();
        if (!user) return false;

        try {
          const { error } = await supabase.rpc('pos_staff_set_pin', {
            p_user_id: user.userId,
            p_pin: pin
          });

          if (error) {
            console.error('Set PIN error:', error);
            return false;
          }

          // Store local hash for offline verification
          const localHash = await hashPinLocally(pin, user.userId);
          set({ pinEnabled: true, localPinHash: localHash });
          return true;
        } catch {
          return false;
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        const { user } = get();
        if (!user) {
          throw new Error('Not authenticated');
        }

        const { error } = await supabase.rpc('pos_staff_change_password', {
          p_user_id: user.userId,
          p_current_password: currentPassword,
          p_new_password: newPassword
        });

        if (error) {
          console.error('Change password error:', error);
          throw new Error(error.message || 'Failed to change password');
        }
      }
    }),
    {
      name: 'pos-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        pinEnabled: state.pinEnabled,
        lastUserId: state.lastUserId,
        lastUserName: state.lastUserName,
        lastUserRole: state.lastUserRole,
        localPinHash: state.localPinHash
      })
    }
  )
);

/**
 * Hook version for backwards compatibility and easier consumption.
 * Returns all auth state and actions.
 */
export function usePOSAuthHook() {
  const user = usePOSAuth(state => state.user);
  const isAuthenticated = usePOSAuth(state => state.isAuthenticated);
  const isLoading = usePOSAuth(state => state.isLoading);
  const login = usePOSAuth(state => state.login);
  const logout = usePOSAuth(state => state.logout);
  const changePassword = usePOSAuth(state => state.changePassword);
  const isAdmin = usePOSAuth(state => state.isAdmin);
  const isStaff = usePOSAuth(state => state.isStaff);
  const getRole = usePOSAuth(state => state.getRole);

  return {
    user,
    userId: user?.userId,
    username: user?.username,
    fullName: user?.fullName,
    role: user?.role,
    isAuthenticated,
    isLoading,
    isAdmin,
    isStaff,
    getRole,
    login,
    logout,
    changePassword
  };
}
