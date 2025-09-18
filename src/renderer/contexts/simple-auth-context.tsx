
/**
 * Simple Authentication Context - User authentication and profile management
 * 
 * ADAPTED FOR ELECTRON: This context provides comprehensive authentication
 * functionality with customer profiles, addresses, and favorites management.
 * 
 * CHANGES FROM DATABUTTON VERSION:
 * - Replaced Supabase client with apiClient for authentication
 * - Updated import paths for Electron renderer structure  
 * - Maintained all authentication functionality and user state management
 * - Enhanced error handling for desktop environment
 * - Preserved customer profile, address, and favorites management
 */

import React, { createContext, useState, useEffect, useContext, ReactNode, useRef } from 'react';
import { apiClient } from './apiClient'; // ELECTRON: Replace supabase import
import { toast } from 'sonner';

// Simple types for clean auth system
export type SimpleUser = {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
};

export type CustomerProfile = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  customer_reference_number: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  image_url?: string | null;
  google_profile_image?: string | null;
  auth_provider?: string | null;
};

export type CustomerAddress = {
  id: string;
  customer_id: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postal_code: string;
  address_type: string;
  is_default: boolean;
  delivery_instructions: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomerFavorite = {
  id: string;
  customer_id: string;
  menu_item_id: string;
  menu_item_name: string;
  variant_id: string | null;
  variant_name: string | null;
  image_url: string | null;
  created_at: string;
};

// Enhanced staff authentication for POS system
export type StaffUser = {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'staff' | 'cashier';
  permissions: string[];
  shift_start?: string;
  shift_end?: string;
  last_activity?: string;
};

type SimpleAuthContextType = {
  // Core user data
  user: SimpleUser | null;
  profile: CustomerProfile | null;
  staffUser: StaffUser | null; // ELECTRON: Add staff user for POS
  addresses: CustomerAddress[];
  favorites: CustomerFavorite[];

  // Loading states
  isLoading: boolean;
  isAuthenticating: boolean; // ELECTRON: Add authentication loading state

  // Enhanced role checks for POS
  isAdmin: boolean;
  isCustomer: boolean;
  isStaff: boolean; // ELECTRON: Add staff check
  isManager: boolean; // ELECTRON: Add manager check
  isAuthenticated: boolean;

  // Auth actions
  signUp: (email: string, password: string, userData: { first_name: string; last_name: string; phone?: string }) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;

  // ELECTRON: Staff authentication for POS
  signInStaff: (email: string, password: string) => Promise<{ error: any; user?: StaffUser }>;
  signOutStaff: () => Promise<void>;
  checkStaffPermission: (permission: string) => boolean;

  // Profile actions
  updateProfile: (data: Partial<CustomerProfile>) => Promise<{ error: any }>;

  // Address actions
  addAddress: (address: Omit<CustomerAddress, 'id' | 'customer_id' | 'created_at' | 'updated_at'>) => Promise<{ error: any; address: CustomerAddress | null }>;
  updateAddress: (id: string, data: Partial<CustomerAddress>) => Promise<{ error: any }>;
  deleteAddress: (id: string) => Promise<{ error: any }>;
  setDefaultAddress: (id: string) => Promise<{ error: any }>;
  unsetDefaultAddress: () => Promise<{ error: any }>;

  // Favorites actions
  addFavorite: (menuItemId: string, menuItemName: string, variantId?: string | null, variantName?: string | null, imageUrl?: string | null) => Promise<{ error: any; favorite: CustomerFavorite | null }>;
  removeFavorite: (id: string) => Promise<{ error: any }>;
  isFavorite: (menuItemId: string, variantId?: string | null) => boolean;

  // ELECTRON: Session management for POS
  refreshSession: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  extendSession: () => Promise<{ error: any }>;
};

const SimpleAuthContext = createContext<SimpleAuthContextType>(null!);

export function useSimpleAuth() {
  return useContext(SimpleAuthContext);
}

type SimpleAuthProviderProps = {
  children: ReactNode;
};

export function SimpleAuthProvider({ children }: SimpleAuthProviderProps) {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null); // ELECTRON: Add staff user state
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [favorites, setFavorites] = useState<CustomerFavorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false); // ELECTRON: Add authentication state

  // Request deduplication using useRef to persist across renders
  const isFetching = useRef(false);
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null); // ELECTRON: Session monitoring

  // Enhanced computed values for POS
  const isAuthenticated = !!user || !!staffUser;
  const isAdmin = profile?.is_admin || staffUser?.role === 'admin' || false;
  const isStaff = !!staffUser || false; // ELECTRON: Staff check
  const isManager = staffUser?.role === 'manager' || staffUser?.role === 'admin' || false; // ELECTRON: Manager check
  const isCustomer = isAuthenticated && !isStaff;

  // ELECTRON: Initialize auth state with session validation
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);

      try {
        // Check for existing session
        const sessionResponse = await apiClient.getSession();

        if (sessionResponse.success && sessionResponse.user) {
          setUser(sessionResponse.user);

          // Check if it's a staff session
          if (sessionResponse.staffUser) {
            setStaffUser(sessionResponse.staffUser);
          }
        }

        // Set up session monitoring for POS
        startSessionMonitoring();

      } catch (error) {
        console.error('❌ [SimpleAuth] Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Cleanup on unmount
    return () => {
      stopSessionMonitoring();
    };
  }, []);

  // ELECTRON: Session monitoring for POS system
  const startSessionMonitoring = () => {
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
    }

    sessionCheckInterval.current = setInterval(async () => {
      try {
        const isValid = await validateSession();
        if (!isValid && (user || staffUser)) {
          console.warn('⚠️ [SimpleAuth] Session expired, signing out...');
          await signOut();
          toast.warning('Session expired. Please sign in again.');
        }
      } catch (error) {
        console.error('❌ [SimpleAuth] Session validation error:', error);
      }
    }, 300000); // Check every 5 minutes
  };

  const stopSessionMonitoring = () => {
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
      sessionCheckInterval.current = null;
    }
  };

  // Fetch profile and addresses when user is authenticated
  useEffect(() => {
    if (user && !profile && !isFetching.current) {
      console.log('🔄 [SimpleAuth] Starting customer data fetch...');
      isFetching.current = true;

      const fetchProfile = async () => {
        try {
          // ELECTRON: Replace Supabase calls with apiClient calls
          const profileResponse = await apiClient.getCustomerProfile({ customer_id: user.id });

          if (profileResponse.success && profileResponse.profile) {
            setProfile(profileResponse.profile);

            // Fetch addresses
            const addressResponse = await apiClient.getCustomerAddresses({ customer_id: user.id });
            if (addressResponse.success && addressResponse.addresses) {
              setAddresses(addressResponse.addresses);
            }

            // Fetch favorites
            const favoritesResponse = await apiClient.getCustomerFavorites({ customer_id: user.id });
            if (favoritesResponse.success && favoritesResponse.favorites) {
              setFavorites(favoritesResponse.favorites);
            }
          } else {
            // Create profile for new users
            const newProfile = {
              id: user.id,
              email: user.email || '',
              first_name: user.user_metadata?.full_name?.split(' ')[0] || null,
              last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
              phone: null,
              customer_reference_number: null,
              is_admin: user.email === 'bod@barkworthhathaway.com',
              image_url: null,
              google_profile_image: null,
              auth_provider: null
            };

            const createResponse = await apiClient.createCustomerProfile(newProfile);
            if (createResponse.success) {
              setProfile(createResponse.profile);
            }
          }
        } catch (error) {
          console.error('❌ [SimpleAuth] Error fetching customer data:', error);
          setProfile(null);
          setAddresses([]);
          setFavorites([]);
        } finally {
          isFetching.current = false;
        }
      };

      fetchProfile();
    }
  }, [user]);

  // Enhanced auth actions for Electron POS
  const signUp = async (email: string, password: string, userData: { first_name: string; last_name: string; phone?: string }) => {
    setIsAuthenticating(true);
    try {
      const response = await apiClient.signUp({
        email,
        password,
        userData: {
          full_name: `${userData.first_name} ${userData.last_name}`
        }
      });

      if (response.success) {
        setUser(response.user);
        return { error: null };
      } else {
        return { error: response.error };
      }
    } catch (error) {
      return { error };
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsAuthenticating(true);
    try {
      const response = await apiClient.signIn({ email, password });

      if (response.success) {
        setUser(response.user);
        return { error: null };
      } else {
        return { error: response.error };
      }
    } catch (error) {
      return { error };
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsAuthenticating(true);
    try {
      const response = await apiClient.signInWithGoogle();
      return { error: response.error };
    } catch (error) {
      return { error };
    } finally {
      setIsAuthenticating(false);
    }
  };

  // ELECTRON: Staff authentication for POS
  const signInStaff = async (email: string, password: string) => {
    setIsAuthenticating(true);
    try {
      const response = await apiClient.signInStaff({ email, password });

      if (response.success && response.staffUser) {
        setStaffUser(response.staffUser);
        startSessionMonitoring();
        return { error: null, user: response.staffUser };
      } else {
        return { error: response.error };
      }
    } catch (error) {
      return { error };
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signOut = async () => {
    try {
      stopSessionMonitoring();
      await apiClient.signOut();
      setUser(null);
      setProfile(null);
      setStaffUser(null);
      setAddresses([]);
      setFavorites([]);
    } catch (error) {
      console.error('❌ [SimpleAuth] Error signing out:', error);
    }
  };

  const signOutStaff = async () => {
    try {
      stopSessionMonitoring();
      await apiClient.signOutStaff();
      setStaffUser(null);
    } catch (error) {
      console.error('❌ [SimpleAuth] Error signing out staff:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const response = await apiClient.resetPassword({ email });
      return { error: response.error };
    } catch (error) {
      return { error };
    }
  };

  // ELECTRON: Staff permission checking
  const checkStaffPermission = (permission: string): boolean => {
    if (!staffUser) return false;
    return staffUser.permissions.includes(permission) || staffUser.role === 'admin';
  };

  // Profile actions (adapted for apiClient)
  const updateProfile = async (data: Partial<CustomerProfile>) => {
    if (!user || !profile) {
      return { error: { message: 'User not authenticated' } };
    }

    try {
      const response = await apiClient.updateCustomerProfile({ customer_id: user.id }, data);

      if (response.success) {
        setProfile(prev => prev ? { ...prev, ...data } : null);
        return { error: null };
      } else {
        return { error: response.error };
      }
    } catch (error) {
      return { error };
    }
  };

  // Address actions (adapted for apiClient)
  const addAddress = async (addressData: Omit<CustomerAddress, 'id' | 'customer_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      return { error: { message: 'User not authenticated' }, address: null };
    }

    try {
      const response = await apiClient.addCustomerAddress({ customer_id: user.id }, addressData);

      if (response.success && response.address) {
        setAddresses(prev => [response.address, ...prev]);
        return { error: null, address: response.address };
      } else {
        return { error: response.error, address: null };
      }
    } catch (error) {
      return { error, address: null };
    }
  };

  const updateAddress = async (id: string, data: Partial<CustomerAddress>) => {
    if (!user) {
      return { error: { message: 'User not authenticated' } };
    }

    try {
      const response = await apiClient.updateCustomerAddress({ address_id: id }, data);

      if (response.success) {
        setAddresses(prev => prev.map(addr => addr.id === id ? { ...addr, ...data } : addr));
        return { error: null };
      } else {
        return { error: response.error };
      }
    } catch (error) {
      return { error };
    }
  };

  const deleteAddress = async (id: string) => {
    if (!user) {
      return { error: { message: 'User not authenticated' } };
    }

    try {
      const response = await apiClient.deleteCustomerAddress({ address_id: id });

      if (response.success) {
        setAddresses(prev => prev.filter(addr => addr.id !== id));
        return { error: null };
      } else {
        return { error: response.error };
      }
    } catch (error) {
      return { error };
    }
  };

  const setDefaultAddress = async (id: string) => {
    if (!user) {
      return { error: { message: 'User not authenticated' } };
    }

    try {
      const response = await apiClient.setDefaultCustomerAddress({ address_id: id });

      if (response.success) {
        setAddresses(prev => prev.map(addr => ({ ...addr, is_default: addr.id === id })));
        return { error: null };
      } else {
        return { error: response.error };
      }
    } catch (error) {
      return { error };
    }
  };

  const unsetDefaultAddress = async () => {
    if (!user) {
      return { error: { message: 'User not authenticated' } };
    }

    try {
      const response = await apiClient.unsetDefaultCustomerAddress({ customer_id: user.id });

      if (response.success) {
        setAddresses(prev => prev.map(addr => ({ ...addr, is_default: false })));
        return { error: null };
      } else {
        return { error: response.error };
      }
    } catch (error) {
      return { error };
    }
  };

  // Favorites actions (adapted for apiClient)
  const addFavorite = async (
    menuItemId: string, 
    menuItemName: string, 
    variantId?: string | null, 
    variantName?: string | null, 
    imageUrl?: string | null
  ) => {
    if (!user) {
      return { error: { message: 'User not authenticated' }, favorite: null };
    }

    try {
      const favoriteData = {
        customer_id: user.id,
        menu_item_id: menuItemId,
        menu_item_name: menuItemName,
        variant_id: variantId,
        variant_name: variantName,
        image_url: imageUrl
      };

      const response = await apiClient.addCustomerFavorite(favoriteData);

      if (response.success && response.favorite) {
        setFavorites(prev => [response.favorite, ...prev]);
        return { error: null, favorite: response.favorite };
      } else {
        return { error: response.error, favorite: null };
      }
    } catch (error) {
      return { error, favorite: null };
    }
  };

  const removeFavorite = async (id: string) => {
    if (!user) {
      return { error: { message: 'User not authenticated' } };
    }

    try {
      const response = await apiClient.removeCustomerFavorite({ favorite_id: id });

      if (response.success) {
        setFavorites(prev => prev.filter(fav => fav.id !== id));
        return { error: null };
      } else {
        return { error: response.error };
      }
    } catch (error) {
      return { error };
    }
  };

  const isFavorite = (menuItemId: string, variantId?: string | null): boolean => {
    return favorites.some(fav => 
      fav.menu_item_id === menuItemId && 
      fav.variant_id === variantId
    );
  };

  // ELECTRON: Session management functions
  const refreshSession = async () => {
    try {
      const response = await apiClient.refreshSession();
      if (response.success) {
        if (response.user) setUser(response.user);
        if (response.staffUser) setStaffUser(response.staffUser);
      }
    } catch (error) {
      console.error('❌ [SimpleAuth] Error refreshing session:', error);
    }
  };

  const validateSession = async (): Promise<boolean> => {
    try {
      const response = await apiClient.validateSession();
      return response.success && response.valid;
    } catch (error) {
      console.error('❌ [SimpleAuth] Error validating session:', error);
      return false;
    }
  };

  const extendSession = async () => {
    try {
      const response = await apiClient.extendSession();
      return { error: response.error };
    } catch (error) {
      return { error };
    }
  };

  const value: SimpleAuthContextType = {
    user,
    profile,
    staffUser,
    addresses,
    favorites,
    isLoading,
    isAuthenticating,
    isAdmin,
    isCustomer,
    isStaff,
    isManager,
    isAuthenticated,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    signInStaff,
    signOutStaff,
    checkStaffPermission,
    updateProfile,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    unsetDefaultAddress,
    addFavorite,
    removeFavorite,
    isFavorite,
    refreshSession,
    validateSession,
    extendSession
  };

  return (
    <SimpleAuthContext.Provider value={value}>
      {children}
    </SimpleAuthContext.Provider>
  );
}

// ELECTRON: Export helper functions for POS system
export const authHelpers = {
  // Check if current user has admin access
  hasAdminAccess: (profile: CustomerProfile | null, staffUser: StaffUser | null): boolean => {
    return profile?.is_admin || staffUser?.role === 'admin' || false;
  },

  // Check if current user can manage orders
  canManageOrders: (staffUser: StaffUser | null): boolean => {
    if (!staffUser) return false;
    return ['admin', 'manager', 'staff'].includes(staffUser.role);
  },

  // Check if current user can process payments
  canProcessPayments: (staffUser: StaffUser | null): boolean => {
    if (!staffUser) return false;
    return ['admin', 'manager', 'staff', 'cashier'].includes(staffUser.role);
  },

  // Get user display name
  getUserDisplayName: (user: SimpleUser | null, profile: CustomerProfile | null, staffUser: StaffUser | null): string => {
    if (staffUser) {
      return staffUser.email.split('@')[0]; // Use email prefix for staff
    }

    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }

    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }

    return user?.email || 'User';
  }
};
