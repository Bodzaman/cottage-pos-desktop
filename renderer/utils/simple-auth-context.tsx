



import React, { createContext, useState, useEffect, useContext, ReactNode, useRef } from 'react';
import { supabase } from './supabaseClient';
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

type SimpleAuthContextType = {
  // Core user data
  user: SimpleUser | null;
  profile: CustomerProfile | null;
  addresses: CustomerAddress[];
  favorites: CustomerFavorite[];
  
  // Loading states
  isLoading: boolean;
  
  // Simple role checks
  isAdmin: boolean;
  isCustomer: boolean;
  isAuthenticated: boolean;
  
  // Auth actions
  signUp: (email: string, password: string, userData: { first_name: string; last_name: string; phone?: string }) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  
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
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [favorites, setFavorites] = useState<CustomerFavorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Request deduplication using useRef to persist across renders
  const isFetching = useRef(false);

  // Simple computed values
  const isAuthenticated = !!user;
  const isAdmin = profile?.is_admin || false;
  const isCustomer = isAuthenticated && !isAdmin;

  // Initialize auth state
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error('Error getting auth session:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch profile and addresses when user is authenticated
  useEffect(() => {
    if (user && !profile && !isFetching.current) {
      console.log('🔄 [SimpleAuth] Starting customer data fetch...');
      console.trace('[SimpleAuth] Fetch triggered');
      isFetching.current = true;
      
      const fetchProfile = async () => {
        try {
          // Fetch customer profile from new clean table
          const { data: profileData, error: profileError } = await supabase
            .from('customer_profiles')
            .select('id, email, first_name, last_name, phone, customer_reference_number, is_admin, created_at, updated_at, image_url, google_profile_image, auth_provider')
            .eq('id', user.id)
            .single();

          if (profileError) {
            // If no profile exists, create one for new users
            if (profileError.code === 'PGRST116') { // No rows returned
              const newProfile = {
                id: user.id,
                email: user.email || '',
                first_name: user.user_metadata?.full_name?.split(' ')[0] || null,
                last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
                phone: null,
                customer_reference_number: null, // Will be assigned later
                is_admin: user.email === 'bod@barkworthhathaway.com',
                image_url: null,
                google_profile_image: null,
                auth_provider: null
              };
              
              const { data: createdProfile, error: createError } = await supabase
                .from('customer_profiles')
                .insert([newProfile])
                .select('id, email, first_name, last_name, phone, customer_reference_number, is_admin, created_at, updated_at, image_url, google_profile_image, auth_provider')
                .single();
              
              if (createError) {
                console.error('❌ [SimpleAuth] Error creating customer profile:', createError);
                setProfile(null);
              } else {
                // Map the customer_reference_number to customer_ref_number for consistency
                // Ensure Date fields are properly handled to prevent object-to-primitive conversion errors
                const safeCreatedAt = typeof createdProfile.created_at === 'string' 
                  ? createdProfile.created_at 
                  : String(new Date(createdProfile.created_at).toISOString());
                const safeUpdatedAt = typeof createdProfile.updated_at === 'string' 
                  ? createdProfile.updated_at 
                  : String(new Date(createdProfile.updated_at).toISOString());
                
                const mappedProfile = {
                  ...createdProfile,
                  customer_ref_number: createdProfile.customer_reference_number,
                  created_at: safeCreatedAt,
                  updated_at: safeUpdatedAt
                };
                setProfile(mappedProfile);
              }
            } else {
              setProfile(null);
            }
          } else {
            // Map the customer_reference_number to customer_ref_number for consistency
            // Ensure Date fields are properly handled to prevent object-to-primitive conversion errors
            const safeCreatedAt = typeof profileData.created_at === 'string' 
              ? profileData.created_at 
              : String(new Date(profileData.created_at).toISOString());
            const safeUpdatedAt = typeof profileData.updated_at === 'string' 
              ? profileData.updated_at 
              : String(new Date(profileData.updated_at).toISOString());
            
            const mappedProfile = {
              ...profileData,
              customer_ref_number: profileData.customer_reference_number,
              created_at: safeCreatedAt,
              updated_at: safeUpdatedAt
            };
            setProfile(mappedProfile);
          }

          // Only fetch additional data if profile operations succeeded
          if (profileData || profileError?.code === 'PGRST116') {
            // Fetch customer addresses with error boundary
            try {
              const { data: addressData, error: addressError } = await supabase
                .from('customer_addresses')
                .select('*')
                .eq('customer_id', user.id)
                .order('is_default', { ascending: false });

              if (addressError) {
                console.error('❌ [SimpleAuth] Error fetching addresses:', addressError);
                setAddresses([]);
              } else {
                setAddresses(addressData || []);
              }
            } catch (addressErr) {
              console.error('❌ [SimpleAuth] Unexpected error fetching addresses:', addressErr);
              setAddresses([]);
            }

            // Fetch customer favorites with error boundary
            try {
              const { data: favoritesData, error: favoritesError } = await supabase
                .from('customer_favorites')
                .select('*')
                .eq('customer_id', user.id)
                .order('created_at', { ascending: false });

              if (favoritesError) {
                console.error('❌ [SimpleAuth] Error fetching favorites:', favoritesError);
                setFavorites([]);
              } else {
                setFavorites(favoritesData || []);
              }
            } catch (favoritesErr) {
              console.error('❌ [SimpleAuth] Unexpected error fetching favorites:', favoritesErr);
              setFavorites([]);
            }
          }
        } catch (error) {
          console.error('❌ [SimpleAuth] Critical error in customer data fetch - continuing with limited functionality:', error);
          // Set safe defaults to prevent component tree failure
          setProfile(null);
          setAddresses([]);
          setFavorites([]);
          
          // Don't throw the error - just log it and continue
          // This prevents the component tree from crashing
        } finally {
          isFetching.current = false;
        }
      };

      // Add timeout to prevent hanging requests
      const timeoutId = setTimeout(() => {
        if (isFetching.current) {
          console.warn('⚠️ [SimpleAuth] Customer data fetch timeout - resetting');
          isFetching.current = false;
          setProfile(null);
          setAddresses([]);
          setFavorites([]);
        }
      }, 10000); // 10 second timeout

      fetchProfile().finally(() => {
        clearTimeout(timeoutId);
      });

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [user]);

  // Auth actions
  const signUp = async (email: string, password: string, userData: { first_name: string; last_name: string; phone?: string }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${userData.first_name} ${userData.last_name}`
          }
        }
      });

      if (error) {
        return { error };
      }

      // Profile will be created automatically by the useEffect when user changes
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback'
        }
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      return { error };
    }
  };

  // Profile actions
  const updateProfile = async (data: Partial<CustomerProfile>) => {
    console.log('🔧 [SimpleAuth] updateProfile called with:', data);
    if (!user || !profile) {
      console.log('❌ [SimpleAuth] updateProfile: User not authenticated');
      return { error: { message: 'User not authenticated' } };
    }

    try {
      const safeUpdatedAt = String(new Date().toISOString());
      console.log('🔧 [SimpleAuth] About to update with ISO date:', safeUpdatedAt);
      const { error } = await supabase
        .from('customer_profiles')
        .update({ ...data, updated_at: safeUpdatedAt })
        .eq('id', user.id);

      if (error) {
        console.log('❌ [SimpleAuth] updateProfile database error:', error);
        return { error };
      }

      console.log('✅ [SimpleAuth] updateProfile success, updating local state');
      // Update local profile state
      setProfile(prev => prev ? { ...prev, ...data } : null);
      return { error: null };
    } catch (error) {
      console.error('❌ [SimpleAuth] updateProfile catch error:', error);
      return { error };
    }
  };

  // Address actions
  const addAddress = async (addressData: Omit<CustomerAddress, 'id' | 'customer_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      return { error: { message: 'User not authenticated' }, address: null };
    }

    try {
      const { data, error } = await supabase
        .from('customer_addresses')
        .insert([{ ...addressData, customer_id: user.id }])
        .select()
        .single();

      if (error) {
        return { error, address: null };
      }

      // Update local addresses state
      setAddresses(prev => [data, ...prev]);
      return { error: null, address: data };
    } catch (error) {
      return { error, address: null };
    }
  };

  const updateAddress = async (id: string, data: Partial<CustomerAddress>) => {
    if (!user) {
      return { error: { message: 'User not authenticated' } };
    }

    try {
      const { error } = await supabase
        .from('customer_addresses')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('customer_id', user.id);

      if (error) {
        return { error };
      }

      // Update local addresses state
      setAddresses(prev => prev.map(addr => addr.id === id ? { ...addr, ...data } : addr));
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const deleteAddress = async (id: string) => {
    if (!user) {
      return { error: { message: 'User not authenticated' } };
    }

    try {
      const { error } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', id)
        .eq('customer_id', user.id);

      if (error) {
        return { error };
      }

      // Update local addresses state
      setAddresses(prev => prev.filter(addr => addr.id !== id));
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const setDefaultAddress = async (id: string) => {
    if (!user) {
      return { error: { message: 'User not authenticated' } };
    }

    try {
      // First, unset all default addresses
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', user.id);

      // Then set the selected address as default
      const { error } = await supabase
        .from('customer_addresses')
        .update({ is_default: true })
        .eq('id', id)
        .eq('customer_id', user.id);

      if (error) {
        return { error };
      }

      // Update local addresses state
      setAddresses(prev => prev.map(addr => ({ ...addr, is_default: addr.id === id })));
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const unsetDefaultAddress = async () => {
    if (!user) {
      return { error: { message: 'User not authenticated' } };
    }

    try {
      // Unset all default addresses
      const { error } = await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', user.id);

      if (error) {
        return { error };
      }

      // Update local addresses state
      setAddresses(prev => prev.map(addr => ({ ...addr, is_default: false })));
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Favorites actions
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

      const { data, error } = await supabase
        .from('customer_favorites')
        .insert([favoriteData])
        .select()
        .single();

      if (error) {
        return { error, favorite: null };
      }

      // Update local favorites state
      setFavorites(prev => [data, ...prev]);
      return { error: null, favorite: data };
    } catch (error) {
      return { error, favorite: null };
    }
  };

  const removeFavorite = async (id: string) => {
    if (!user) {
      return { error: { message: 'User not authenticated' } };
    }

    try {
      const { error } = await supabase
        .from('customer_favorites')
        .delete()
        .eq('id', id)
        .eq('customer_id', user.id);

      if (error) {
        return { error };
      }

      // Update local favorites state
      setFavorites(prev => prev.filter(fav => fav.id !== id));
      return { error: null };
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

  const value: SimpleAuthContextType = {
    user,
    profile,
    addresses,
    favorites,
    isLoading,
    isAdmin,
    isCustomer,
    isAuthenticated,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    unsetDefaultAddress,
    addFavorite,
    removeFavorite,
    isFavorite
  };

  return (
    <SimpleAuthContext.Provider value={value}>
      {children}
    </SimpleAuthContext.Provider>
  );
}
