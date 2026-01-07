import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabaseClient';

interface POSStaffUser {
  userId: string;
  username: string;
  fullName: string;
}

interface POSAuthStore {
  user: POSStaffUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (username: string, password: string) => Promise<void>;
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
              fullName: user.full_name
            },
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false, isAuthenticated: false, user: null });
          throw error;
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
        isAuthenticated: state.isAuthenticated
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

  return {
    user,
    userId: user?.userId,
    username: user?.username,
    fullName: user?.fullName,
    isAuthenticated,
    isLoading,
    login,
    logout,
    changePassword
  };
}
