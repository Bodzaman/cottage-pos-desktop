import React, { createContext, useState, useEffect, useContext, ReactNode, useRef } from 'react';
import { supabase } from 'utils/supabaseClient';
import { apiClient } from 'app';
import { toast } from 'sonner';
import { ensureSupabaseConfigured } from 'utils/supabaseClient';
import { useOnboardingStore } from 'utils/onboardingStore';
import { useCartStore } from './cartStore';
import { useChatStore } from './chat-store';

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

// New types for favorite lists
export type FavoriteListItem = {
  id: string;
  menu_item_id: string;
  menu_item_name: string;
  menu_item_price: number | null;
  menu_item_image: string | null;
  added_at: string;
};

export type FavoriteList = {
  id: string;
  list_name: string;
  created_at: string;
  updated_at: string;
  item_count: number;
  items: FavoriteListItem[];
};

type SimpleAuthContextType = {
  // Core user data
  user: SimpleUser | null;
  profile: CustomerProfile | null;
  addresses: CustomerAddress[];
  favorites: CustomerFavorite[];
  favoriteLists: FavoriteList[];
  
  // Loading states
  isLoading: boolean;
  
  // Simple role checks
  isAdmin: boolean;
  isCustomer: boolean;
  isAuthenticated: boolean;
  
  // NEW: Track if user just completed signup (session flag)
  justSignedUp: boolean;
  setJustSignedUp: (value: boolean) => void;
  
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
  
  // NEW: List management actions
  createList: (listName: string) => Promise<{ error: any; list: FavoriteList | null }>;
  renameList: (listId: string, newName: string) => Promise<{ error: any }>;
  deleteList: (listId: string) => Promise<{ error: any }>;
  addToList: (listId: string, favoriteId: string) => Promise<{ error: any }>;
  removeFromList: (listId: string, favoriteId: string) => Promise<{ error: any }>;
  refreshLists: () => Promise<void>;
};

const SimpleAuthContext = createContext<SimpleAuthContextType>(null!);

export function useSimpleAuth() {
  return useContext(SimpleAuthContext);
}

type SimpleAuthProviderProps = {
  children: ReactNode;
};

export function SimpleAuthProvider({ children }: SimpleAuthProviderProps) {
  console.log('🟢 SimpleAuthProvider: Component rendering started');
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [favorites, setFavorites] = useState<CustomerFavorite[]>([]);
  const [favoriteLists, setFavoriteLists] = useState<FavoriteList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [justSignedUp, setJustSignedUp] = useState(false); // NEW: Session flag for post-signup flow
  
  // Request deduplication using useRef to persist across renders
  const isFetching = useRef(false);

  // Simple computed values
  const isAuthenticated = !!user;
  const isAdmin = profile?.is_admin || false;
  const isCustomer = isAuthenticated && !isAdmin;

  // Initialize auth state (gate behind ensured Supabase config)
  useEffect(() => {
    let unsub: { unsubscribe: () => void } | null = null;

    const initAuth = async () => {
      try {
        // CRITICAL: Wait for real Supabase config before accessing auth
        await ensureSupabaseConfigured();

        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('🔐 [Auth Event]:', event, session?.user?.id);
          setUser(session?.user || null);
          setIsLoading(false);
          
          // ✅ NEW (MYA-1525): Migrate guest cart to authenticated user on login/signup
          if (event === 'SIGNED_IN' && session?.user) {
            try {
              console.log('🛒 [Auth] Triggering cart migration for user:', session.user.id);
              await useCartStore.getState().migrateGuestCartToUser(session.user.id);
              console.log('✅ [Auth] Cart migration completed successfully');
            } catch (error) {
              console.error('❌ [Auth] Cart migration failed:', error);
              // Don't block login flow if migration fails
            }
          }
          
          // ✅ NEW (MYA-1525): Clear userId from cart on logout (keep items as guest cart)
          if (event === 'SIGNED_OUT') {
            try {
              console.log('🛒 [Auth] Clearing cart userId on logout (items preserved as guest cart)');
              useCartStore.setState({ userId: null });
              console.log('✅ [Auth] Cart reset to guest mode');
            } catch (error) {
              console.error('❌ [Auth] Failed to reset cart to guest mode:', error);
            }
            
            // ✅ NEW (MYA-1525): Clear chat userContext on logout
            try {
              console.log('💬 [Auth] Clearing chat userContext on logout');
              useChatStore.getState().clearUserContext();
              console.log('✅ [Auth] Chat userContext cleared');
            } catch (error) {
              console.error('❌ [Auth] Failed to clear chat userContext:', error);
            }
          }
        });
        unsub = subscription;
      } catch (error) {
        console.error('Error getting auth session:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      try {
        unsub?.unsubscribe();
      } catch {
        // no-op
      }
    };
  }, []);

  // Fetch profile and addresses when user is authenticated
  useEffect(() => {
    if (user && !profile && !isFetching.current) {
      console.log('🔄 [SimpleAuth] Starting customer data fetch...');
      isFetching.current = true;
      
      const fetchProfile = async () => {
        try {
          // CRITICAL: Ensure Supabase is fully configured before any table calls
          await ensureSupabaseConfigured();

          // Try to fetch by auth_user_id first (canonical linkage)
          let profileData: any | null = null;
          let profileError: any | null = null;
          let hasAuthUserId = true;

          // Add retry logic for schema cache lag
          const maxRetries = 2;
          let attempt = 0;
          let byAuth: any = null;

          while (attempt < maxRetries) {
            byAuth = await supabase
              .from('customers')
              .select('id, email, first_name, last_name, phone, customer_reference_number, created_at, updated_at, image_url, google_profile_image')
              .eq('auth_user_id', user.id)
              .maybeSingle();

            // Check if we hit schema cache issue
            if (byAuth.error) {
              const isSchemaCache = (byAuth.error as any)?.code === 'PGRST204' && 
                                   String((byAuth.error as any)?.message || '').includes("'auth_user_id'");
              
              if (isSchemaCache && attempt < maxRetries - 1) {
                console.warn(`⚠️ [SimpleAuth] Schema cache miss on attempt ${attempt + 1}/${maxRetries} - waiting 2s before retry...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                attempt++;
                continue;
              }
              
              // Final attempt failed or different error
              profileError = byAuth.error;
              if (isSchemaCache) {
                console.warn('⚠️ [SimpleAuth] customers.auth_user_id not found in schema cache after retries - falling back to id based lookup');
                hasAuthUserId = false;
              }
              break;
            }
            
            // Success
            if (byAuth.data) {
              profileData = byAuth.data;
            }
            break;
          }

          // Fallback: legacy records where id === auth user id
          if (!profileData) {
            const byId = await supabase
              .from('customers')
              .select('id, email, first_name, last_name, phone, customer_reference_number, created_at, updated_at, image_url, google_profile_image')
              .eq('id', user.id)
              .maybeSingle();

            if (byId.error && !profileError) profileError = byId.error;
            if (byId.data) profileData = byId.data;
          }

          // Fetch admin flag from profiles (self-only via RLS)
          const { data: adminRow } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('auth_user_id', user.id)
            .maybeSingle();
          const adminFlag = adminRow?.is_admin ?? false;

          if (!profileData) {
            // If no profile exists, create one for new users. Prefer DB-generated id
            console.log('📝 [SimpleAuth] No customer record found, creating one...');
            
            // Extract name from user_metadata (works for both email signup and Google OAuth)
            const fullName = user.user_metadata?.full_name || '';
            const nameParts = fullName.split(' ');
            const firstName = nameParts[0] || null;
            const lastName = nameParts.slice(1).join(' ') || null;
            
            const newProfileData: any = {
              email: user.email || '',
              first_name: firstName,
              last_name: lastName,
              phone: user.user_metadata?.phone || null,
              customer_reference_number: null,
              image_url: user.user_metadata?.image_url || null,
              google_profile_image: user.user_metadata?.avatar_url || null
            };
            
            if (hasAuthUserId) {
              newProfileData.auth_user_id = user.id;
            } else {
              // As a last resort in environments without auth_user_id, set id = auth uid for linkage
              (newProfileData as any).id = user.id;
            }
            
            // UPSERT LOGIC: Check if customer with this email already exists
            console.log('🔍 [SimpleAuth] Checking for existing customer with email:', user.email);
            const { data: existingCustomer, error: checkError } = await supabase
              .from('customers')
              .select('id, email, first_name, last_name, phone, customer_reference_number, created_at, updated_at, image_url, google_profile_image, auth_user_id')
              .eq('email', user.email || '')
              .maybeSingle();
            
            let created: any;
            
            if (existingCustomer) {
              // Customer exists - UPDATE with new auth_user_id
              console.log('🔄 [SimpleAuth] Customer exists, updating auth_user_id:', existingCustomer.id);
              
              const updateData: any = {
                first_name: firstName || existingCustomer.first_name,
                last_name: lastName || existingCustomer.last_name,
                phone: user.user_metadata?.phone || existingCustomer.phone,
                image_url: user.user_metadata?.image_url || existingCustomer.image_url,
                google_profile_image: user.user_metadata?.avatar_url || existingCustomer.google_profile_image
              };
              
              if (hasAuthUserId) {
                updateData.auth_user_id = user.id;
              }
              
              created = await supabase
                .from('customers')
                .update(updateData)
                .eq('id', existingCustomer.id)
                .select('id, email, first_name, last_name, phone, customer_reference_number, created_at, updated_at, image_url, google_profile_image')
                .single();
            } else {
              // No existing customer - INSERT new record
              console.log('➕ [SimpleAuth] No existing customer, creating new record');
              created = await supabase
                .from('customers')
                .insert([newProfileData])
                .select('id, email, first_name, last_name, phone, customer_reference_number, created_at, updated_at, image_url, google_profile_image')
                .single();
            }

            if (created.error) {
              console.error('❌ [SimpleAuth] Error creating/updating customer record:', created.error);
              // Check if error is due to RLS policy
              if (created.error.code === '42501') {
                console.error('🚨 [SimpleAuth] RLS policy blocking customer record creation!');
                toast.error('Account setup failed. Please contact support.');
              } else if (created.error.code === '23505') {
                // Still got duplicate key error despite check - race condition
                console.error('🚨 [SimpleAuth] Race condition detected - email already exists');
                toast.error('Account already exists. Please sign in instead.');
              } else {
                toast.error('Failed to set up account. Please try again.');
              }
              setProfile(null);
            } else if (created.data) {
              console.log('✅ [SimpleAuth] Customer record created/updated successfully');
              const createdProfile = created.data as any;
              const safeCreatedAt = typeof createdProfile.created_at === 'string' 
                ? createdProfile.created_at 
                : String(new Date(createdProfile.created_at).toISOString());
              const safeUpdatedAt = typeof createdProfile.updated_at === 'string' 
                ? createdProfile.updated_at 
                : String(new Date(createdProfile.updated_at).toISOString());
              const mappedProfile = {
                ...createdProfile,
                is_admin: adminFlag,
                customer_ref_number: createdProfile.customer_reference_number,
                created_at: safeCreatedAt,
                updated_at: safeUpdatedAt
              } as CustomerProfile & { customer_ref_number?: string | null };
              setProfile(mappedProfile);
              // Use this id for downstream fetches
              profileData = createdProfile;
            }
          } else {
            // Map and set
            const safeCreatedAt = typeof profileData.created_at === 'string' 
              ? profileData.created_at 
              : String(new Date(profileData.created_at).toISOString());
            const safeUpdatedAt = typeof profileData.updated_at === 'string' 
              ? profileData.updated_at 
              : String(new Date(profileData.updated_at).toISOString());
            const mappedProfile = {
              ...profileData,
              is_admin: adminFlag,
              customer_ref_number: profileData.customer_reference_number,
              created_at: safeCreatedAt,
              updated_at: safeUpdatedAt
            } as CustomerProfile & { customer_ref_number?: string | null };
            setProfile(mappedProfile);
          }

          // Only fetch additional data if we have a profile row (either existing or newly created)
          if (profileData) {
            const customerId = profileData.id as string;

            // Fetch customer addresses with error boundary
            try {
              const { data: addressData, error: addressError } = await supabase
                .from('customer_addresses')
                .select('*')
                .eq('customer_id', customerId)
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
                .eq('customer_id', customerId)
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

            // NEW: Fetch customer favorite lists with error boundary
            try {
              const listsResponse = await apiClient.get_customer_lists({ customerId: customerId });
              const listsData = await listsResponse.json();
              if (listsData.lists) {
                setFavoriteLists(listsData.lists);
              } else {
                setFavoriteLists([]);
              }
            } catch (listsErr) {
              console.error('❌ [SimpleAuth] Error fetching favorite lists:', listsErr);
              setFavoriteLists([]);
            }
          }
        } catch (error) {
          console.error('❌ [SimpleAuth] Critical error in customer data fetch - continuing with limited functionality:', error);
          // Set safe defaults to prevent component tree failure
          setProfile(null);
          setAddresses([]);
          setFavorites([]);
          setFavoriteLists([]);
          
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
          setFavoriteLists([]);
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

  // ============================================================================
  // PROFESSIONAL PATTERN: Fetch onboarding status at provider level
  // ============================================================================
  // Fetch onboarding status when user + profile are ready (app-level state management)
  useEffect(() => {
    const fetchOnboardingStatus = async () => {
      // Only fetch if we have both user session AND customer profile
      if (!user?.id || !profile?.id) return;
      
      console.log('🎯 [SimpleAuthProvider] Fetching onboarding status for customer:', profile.id);
      
      try {
        await useOnboardingStore.getState().fetchStatus(profile.id);
        console.log('✅ [SimpleAuthProvider] Onboarding status loaded');
      } catch (error) {
        console.error('❌ [SimpleAuthProvider] Failed to fetch onboarding status:', error);
      }
    };

    fetchOnboardingStatus();
  }, [user?.id, profile?.id]); // Re-fetch if user or profile changes

  // Auth actions
  const signUp = async (email: string, password: string, userData: { first_name: string; last_name: string; phone?: string }) => {
    try {
      // CRITICAL: Sign out any existing session first to prevent conflicts
      console.log('🔐 [SimpleAuth] Signing out existing session before signup');
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${userData.first_name} ${userData.last_name}`,
            phone: userData.phone || null
          },
          emailRedirectTo: undefined // Disable email confirmation requirement
        }
      });

      if (error) {
        console.error('❌ [SimpleAuth] Signup error:', error);
        return { error };
      }

      if (!data.user) {
        console.error('❌ [SimpleAuth] No user returned from signup');
        return { error: { message: 'No user returned from signup' } };
      }

      console.log('✅ [SimpleAuth] User created:', data.user.id);

      // CRITICAL: Auto-confirm email using service role to create active session
      try {
        console.log('📧 [SimpleAuth] Auto-confirming email for instant session...');
        const confirmResponse = await apiClient.auto_confirm_email({ user_id: data.user.id });
        const confirmResult = await confirmResponse.json();
        
        if (confirmResult.success) {
          console.log('✅ [SimpleAuth] Email auto-confirmed - session is active');
        } else {
          console.warn('⚠️ [SimpleAuth] Email confirmation failed, but continuing:', confirmResult.message);
        }
      } catch (confirmError) {
        console.warn('⚠️ [SimpleAuth] Email auto-confirm error (non-critical):', confirmError);
      }

      // Force sign in to establish session immediately
      console.log('🔐 [SimpleAuth] Signing in to establish active session...');
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        console.warn('⚠️ [SimpleAuth] Auto sign-in failed:', signInError);
        // Not critical - user can still log in manually
      } else {
        console.log('✅ [SimpleAuth] Active session established!');
        // The useEffect hook will now detect the new user and create the customer record
      }

      return { error: null };
    } catch (error) {
      console.error('❌ [SimpleAuth] Signup exception:', error);
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
      
      // ✅ FIX (MYA-1552): Clear cart and chat stores on logout
      console.log('🧹 [SimpleAuth] Clearing cartStore.userId on logout');
      useCartStore.setState({ userId: null });
      
      console.log('🧹 [SimpleAuth] Clearing chatStore.userContext on logout');
      useChatStore.setState({
        userContext: {
          isAuthenticated: false,
          userId: undefined,
          userName: undefined,
          orderHistory: [],
          favorites: []
        }
      });
      
      console.log('✅ [SimpleAuth] Logout complete - auth state cleared');
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
    if (!user) {
      console.log('❌ [SimpleAuth] updateProfile: User not authenticated');
      return { error: { message: 'User not authenticated' } };
    }

    try {
      const safeUpdatedAt = String(new Date().toISOString());
      console.log('🔧 [SimpleAuth] About to update with ISO date:', safeUpdatedAt);
      // Exclude is_admin from updates to customers table
      const { is_admin: _omitIsAdmin, auth_provider: _omitAuthProvider, ...rest } = (data || {}) as any;

      // Prefer updating by the resolved customer id; fall back to auth_user_id
      let error: any = null;
      if (profile?.id) {
        const res = await supabase.from('customers').update({ ...rest, updated_at: safeUpdatedAt }).eq('id', profile.id);
        error = res.error;
      } else {
        // Try update via auth_user_id first
        let res = await supabase.from('customers').update({ ...rest, updated_at: safeUpdatedAt }).eq('auth_user_id', user.id);
        error = res.error;
        if (error && (error as any).code === 'PGRST204' && String((error as any).message || '').includes("'auth_user_id'")) {
          console.warn('⚠️ [SimpleAuth] updateProfile: auth_user_id column missing - retrying update by id fallback');
          res = await supabase.from('customers').update({ ...rest, updated_at: safeUpdatedAt }).eq('id', user.id);
          error = res.error;
        }
      }

      if (error) {
        console.log('❌ [SimpleAuth] updateProfile database error:', error);
        return { error };
      }

      console.log('✅ [SimpleAuth] updateProfile success, updating local state');
      // Update local profile state
      setProfile(prev => prev ? { ...prev, ...rest } as CustomerProfile : prev);
      return { error: null };
    } catch (error) {
      console.error('❌ [SimpleAuth] updateProfile catch error:', error);
      return { error };
    }
  };

  // Address actions
  const addAddress = async (addressData: Omit<CustomerAddress, 'id' | 'customer_id' | 'created_at' | 'updated_at'>) => {
    if (!user || !profile?.id) {
      return { error: { message: 'User not authenticated or profile not loaded' }, address: null };
    }

    try {
      const { data, error } = await supabase
        .from('customer_addresses')
        .insert([{ ...addressData, customer_id: profile.id }])
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
    if (!user || !profile?.id) {
      return { error: { message: 'User not authenticated or profile not loaded' } };
    }

    try {
      const { error } = await supabase
        .from('customer_addresses')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('customer_id', profile.id);

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
    if (!user || !profile?.id) {
      return { error: { message: 'User not authenticated or profile not loaded' } };
    }

    try {
      const { error } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', id)
        .eq('customer_id', profile.id);

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
    if (!user || !profile?.id) {
      return { error: { message: 'User not authenticated or profile not loaded' } };
    }

    try {
      // First, unset all default addresses
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', profile.id);

      // Then set the selected address as default
      const { error } = await supabase
        .from('customer_addresses')
        .update({ is_default: true })
        .eq('id', id)
        .eq('customer_id', profile.id);

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
    if (!user || !profile?.id) {
      return { error: { message: 'User not authenticated or profile not loaded' } };
    }

    try {
      // Unset all default addresses
      const { error } = await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', profile.id);

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
    if (!user || !profile?.id) {
      return { error: { message: 'User not authenticated or profile not loaded' }, favorite: null };
    }

    try {
      const favoriteData = {
        customer_id: profile.id,
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
    if (!user || !profile?.id) {
      return { error: { message: 'User not authenticated or profile not loaded' } };
    }

    try {
      const { error } = await supabase
        .from('customer_favorites')
        .delete()
        .eq('id', id)
        .eq('customer_id', profile.id);

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

  // NEW: List management actions
  const createList = async (listName: string) => {
    if (!user || !profile?.id) {
      return { error: { message: 'User not authenticated or profile not loaded' }, list: null };
    }

    try {
      const response = await apiClient.create_favorite_list({ customer_id: profile.id, list_name: listName });
      const data = await response.json();

      if (data.error || !data.success) {
        return { error: data, list: null };
      }

      // Map backend response to FavoriteList structure
      const newList: FavoriteList = {
        id: data.list_id,
        customer_id: profile.id,
        list_name: data.list_name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        item_count: 0
      };

      // Update local lists state
      setFavoriteLists(prev => [...prev, newList]);
      
      return { error: null, list: newList };
    } catch (error) {
      console.error('Error creating list:', error);
      return { error, list: null };
    }
  };

  const renameList = async (listId: string, newName: string) => {
    if (!user || !profile?.id) {
      return { error: { message: 'User not authenticated or profile not loaded' } };
    }

    try {
      const response = await apiClient.rename_favorite_list({ list_id: listId, new_name: newName });
      const data = await response.json();

      if (data.error) {
        return { error: data };
      }

      // Update local lists state
      setFavoriteLists(prev => prev.map(list => 
        list.id === listId ? { ...list, list_name: newName, updated_at: new Date().toISOString() } : list
      ));
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const deleteList = async (listId: string) => {
    if (!user || !profile?.id) {
      return { error: { message: 'User not authenticated or profile not loaded' } };
    }

    try {
      const response = await apiClient.delete_favorite_list({ list_id: listId });
      const data = await response.json();

      if (data.error) {
        return { error: data };
      }

      // Update local lists state
      setFavoriteLists(prev => prev.filter(list => list.id !== listId));
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const addToList = async (listId: string, favoriteId: string) => {
    if (!user || !profile?.id) {
      return { error: { message: 'User not authenticated or profile not loaded' } };
    }

    try {
      const response = await apiClient.add_favorite_to_list({ 
        list_id: listId, 
        favorite_id: favoriteId,
        customer_id: profile.id
      });
      const data = await response.json();

      if (data.error) {
        return { error: data };
      }

      // Refresh lists to get updated item counts
      await refreshLists();
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const removeFromList = async (listId: string, favoriteId: string) => {
    if (!user || !profile?.id) {
      return { error: { message: 'User not authenticated or profile not loaded' } };
    }

    try {
      const response = await apiClient.remove_favorite_from_list({ 
        list_id: listId, 
        favorite_id: favoriteId,
        customer_id: profile.id
      });
      const data = await response.json();

      if (data.error) {
        return { error: data };
      }

      // Refresh lists to get updated item counts
      await refreshLists();
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const refreshLists = async () => {
    if (!profile?.id) return;
    try {
      const response = await apiClient.get_customer_lists({ customerId: profile.id });
      const data = await response.json();
      if (data.lists) {
        setFavoriteLists(data.lists);
      }
    } catch (error) {
      console.error('Failed to refresh lists:', error);
    }
  };

  const value: SimpleAuthContextType = {
    user,
    profile,
    addresses,
    favorites,
    favoriteLists,
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
    isFavorite,
    createList,
    renameList,
    deleteList,
    addToList,
    removeFromList,
    refreshLists,
    justSignedUp,
    setJustSignedUp
  };

  return (
    <SimpleAuthContext.Provider value={value}>
      {children}
    </SimpleAuthContext.Provider>
  );
}
