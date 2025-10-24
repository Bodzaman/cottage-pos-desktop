import { create } from 'zustand';
import brain from 'brain';
import { getDeviceFingerprint } from 'utils/deviceFingerprint';
import { supabase } from 'utils/supabaseClient';

interface POSAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  email: string | null;
  userId: string | null;
  role: string | null;
  profileImageUrl: string | null;
}

interface POSAuthActions {
  checkAuthStatus: () => Promise<void>;
  login: (email: string, options?: { userId?: string; role?: string; session?: any }) => void;
  logout: () => Promise<void>;
}

/**
 * Zustand store for POS authentication.
 * This is a SINGLETON - all components share the same state instance.
 */
export const usePOSAuth = create<POSAuthState & POSAuthActions>((set, get) => ({
  // State
  isAuthenticated: false,
  isLoading: true,
  email: null,
  userId: null,
  role: null,
  profileImageUrl: null,

  // Actions
  checkAuthStatus: async () => {
    try {
      set({ isLoading: true });
      
      // Step 1: Check if device is trusted (skip login flow)
      const deviceFingerprint = getDeviceFingerprint();
      const userIdFromStorage = localStorage.getItem('pos_user_id');
      
      if (userIdFromStorage) {
        try {
          const deviceCheckResponse = await brain.check_user_trusted_device({
            user_id: userIdFromStorage,
            device_fingerprint: deviceFingerprint,
          });
          const deviceData = await deviceCheckResponse.json();
          
          if (deviceData.is_trusted) {
            // Device is trusted, check if Supabase session is still valid
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session && session.user.id === userIdFromStorage) {
              // Valid session + trusted device, verify POS access
              const accessResponse = await brain.check_pos_access({
                user_id: session.user.id,
              });
              const accessData = await accessResponse.json();
              
              if (accessData.has_access) {
                // Fetch profile image
                let profileImageUrl: string | null = null;
                try {
                  const imageResponse = await brain.get_profile_image({ userId: session.user.id });
                  const imageData = await imageResponse.json();
                  if (imageData.success && imageData.image_url) {
                    profileImageUrl = imageData.image_url;
                  }
                } catch (err) {
                  console.log('No profile image found');
                }
                
                set({
                  isAuthenticated: true,
                  isLoading: false,
                  email: session.user.email || null,
                  userId: session.user.id,
                  role: accessData.role || null,
                  profileImageUrl,
                });
                return;
              }
            }
          }
        } catch (err) {
          console.error('Device trust check failed:', err);
        }
      }
      
      // Step 2: No trusted device, check Supabase session only
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Verify user has POS access
        const accessResponse = await brain.check_pos_access({
          user_id: session.user.id,
        });
        const accessData = await accessResponse.json();
        
        if (accessData.has_access) {
          // Fetch profile image
          let profileImageUrl: string | null = null;
          try {
            const imageResponse = await brain.get_profile_image({ userId: session.user.id });
            const imageData = await imageResponse.json();
            if (imageData.success && imageData.image_url) {
              profileImageUrl = imageData.image_url;
            }
          } catch (err) {
            console.log('No profile image found');
          }
          
          set({
            isAuthenticated: true,
            isLoading: false,
            email: session.user.email || null,
            userId: session.user.id,
            role: accessData.role || null,
            profileImageUrl,
          });
          return;
        }
      }
      
      // No valid auth
      set({ isAuthenticated: false, isLoading: false, email: null, userId: null, role: null, profileImageUrl: null });
    } catch (error) {
      console.error('Auth check failed:', error);
      set({ isAuthenticated: false, isLoading: false, email: null, userId: null, role: null, profileImageUrl: null });
    }
  },

  login: (email: string, options?: { userId?: string; role?: string; session?: any }) => {
    if (options?.userId) {
      localStorage.setItem('pos_user_id', options.userId);
    }
    set({ 
      isAuthenticated: true, 
      isLoading: false, 
      email,
      userId: options?.userId || null,
      role: options?.role || null,
      profileImageUrl: null, // Will be fetched by checkAuthStatus
    });
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('pos_user_id');
      set({ isAuthenticated: false, isLoading: false, email: null, userId: null, role: null, profileImageUrl: null });
    } catch (error) {
      console.error('Logout failed:', error);
      // Force clear state even if signOut fails
      localStorage.removeItem('pos_user_id');
      set({ isAuthenticated: false, isLoading: false, email: null, userId: null, role: null, profileImageUrl: null });
    }
  },
}));

// Initialize auth check on store creation
usePOSAuth.getState().checkAuthStatus();
