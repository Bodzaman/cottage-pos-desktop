import { create } from 'zustand';
import brain from 'brain';
import { CustomerProfile, CustomerProfileResponse, AppApisCustomerProfileApiCustomerAddress, RecentOrder } from '@/brain/data-contracts';
import { toast } from 'sonner';
import { usePOSCustomerStore } from './posCustomerStore';
import { useCustomerDataStore } from './customerDataStore';

// Extended types for our store
export interface CustomerIntelligenceProfile extends CustomerProfile {
  default_address?: AppApisCustomerProfileApiCustomerAddress | null;
  recent_orders?: RecentOrder[];
}

export interface SearchQuery {
  email: string;
  phone: string;
  customerRef: string;
  name: string;
}

// Customer search result from CRM endpoint (for dropdown display)
export interface CustomerSearchResult {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  customer_reference_number?: string;
  total_orders?: number;
  total_spend?: number;
  last_order_at?: string;
}

export type ViewMode = 'search' | 'loading' | 'profile';

interface CustomerIntelligenceState {
  // Search State
  searchQuery: SearchQuery;

  // Results
  customerProfile: CustomerIntelligenceProfile | null;
  searchResults: CustomerSearchResult[];  // Multiple results from name search

  // UI State
  isSearching: boolean;
  searchError: string | null;
  viewMode: ViewMode;

  // Actions
  setSearchQuery: (field: keyof SearchQuery, value: string) => void;
  searchCustomer: (field: keyof SearchQuery, value: string) => Promise<void>;
  selectCustomer: (customer: CustomerSearchResult) => Promise<void>;  // Select from dropdown
  clearSearch: () => void;
  clearSearchResults: () => void;  // Clear dropdown results
  clearCustomer: () => void;
  setViewMode: (mode: ViewMode) => void;
}

// Bridge a found profile directly to the customer stores (auto-select)
function bridgeProfileToStores(profile: CustomerIntelligenceProfile) {
  const bridgeData = {
    firstName: profile.first_name || '',
    lastName: profile.last_name || '',
    phone: profile.phone || '',
    email: profile.email || '',
    address: profile.default_address?.address_line1 || '',
    street: profile.default_address?.address_line1 || '',
    city: profile.default_address?.city || '',
    postcode: profile.default_address?.postal_code || '',
    customerRef: profile.customer_reference_number || '',
    recentOrderCount: profile.recent_orders?.length || 0,
    // CRM: Include customer ID for linking orders to customer records
    customerId: profile.id || null,
  };
  usePOSCustomerStore.getState().updateCustomer(bridgeData);
  useCustomerDataStore.getState().setCustomerData(bridgeData as any);
}

export const usePOSCustomerIntelligence = create<CustomerIntelligenceState>((set, get) => ({
  // Initial State
  searchQuery: {
    email: '',
    phone: '',
    customerRef: '',
    name: '',
  },

  customerProfile: null,
  searchResults: [],
  isSearching: false,
  searchError: null,
  viewMode: 'search',
  
  // Actions
  setSearchQuery: (field, value) => {
    set((state) => ({
      searchQuery: {
        ...state.searchQuery,
        [field]: value,
      },
    }));
  },
  
  searchCustomer: async (field, value) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      toast.error('Please enter a search value');
      return;
    }

    set({
      isSearching: true,
      searchError: null,
      searchResults: [],
      viewMode: 'loading'
    });

    try {
      console.log(`🔍 [CustomerIntelligence] Searching by ${field}:`, trimmedValue);

      // NAME SEARCH: Use CRM search endpoint (supports fuzzy name matching)
      if (field === 'name') {
        const response = await brain.crm_search_customers({ query: trimmedValue, limit: 10 });
        const data = await response.json();

        console.log('📊 [CustomerIntelligence] CRM search result:', data);

        if (data.success && data.customers?.length > 0) {
          // Multiple results - store for dropdown selection
          if (data.customers.length === 1) {
            // Single result - auto-select
            const customer = data.customers[0];
            await get().selectCustomer(customer);
          } else {
            // Multiple results - show dropdown
            set({
              searchResults: data.customers,
              isSearching: false,
              searchError: null,
              viewMode: 'search'
            });
            toast.success(`Found ${data.customers.length} customers`);
          }
        } else {
          set({
            customerProfile: null,
            searchResults: [],
            isSearching: false,
            searchError: 'No customers found',
            viewMode: 'search'
          });
          toast.error('No customers found');
        }
        return;
      }

      // OTHER SEARCHES: Use lookup-customer endpoint (email, phone, customerRef)
      const searchParams: any = {};
      if (field === 'email') {
        searchParams.email = trimmedValue;
      } else if (field === 'phone') {
        searchParams.phone = trimmedValue;
      } else if (field === 'customerRef') {
        searchParams.customer_reference = trimmedValue;
      }

      const response = await brain.lookup_customer(searchParams);
      const data: CustomerProfileResponse = await response.json();

      console.log('📊 [CustomerIntelligence] Search result:', data);

      if (data.success && data.customer) {
        // Now fetch comprehensive data (addresses, orders, favorites)
        try {
          const comprehensiveResponse = await brain.get_customer_profile({
            customer_id: data.customer.id,
            comprehensive: true
          });
          const comprehensiveData: CustomerProfileResponse = await comprehensiveResponse.json();

          if (comprehensiveData.success) {
            // Merge data
            const enrichedProfile: CustomerIntelligenceProfile = {
              ...data.customer,
              default_address: comprehensiveData.default_address,
              recent_orders: comprehensiveData.recent_orders || [],
            };

            // Auto-bridge: write to customer stores immediately
            bridgeProfileToStores(enrichedProfile);

            set({
              customerProfile: enrichedProfile,
              searchResults: [],
              isSearching: false,
              searchError: null,
              viewMode: 'profile'
            });

            toast.success(`Found ${enrichedProfile.first_name || ''} ${enrichedProfile.last_name || 'customer'}`);
          } else {
            // Fallback to basic profile if comprehensive fails
            const basicProfile: CustomerIntelligenceProfile = { ...data.customer, recent_orders: [] };
            bridgeProfileToStores(basicProfile);

            set({
              customerProfile: basicProfile,
              searchResults: [],
              isSearching: false,
              searchError: null,
              viewMode: 'profile'
            });
            toast.success('Customer found');
          }
        } catch (compError) {
          console.warn('⚠️ [CustomerIntelligence] Could not load comprehensive data:', compError);
          // Still show basic profile
          const basicProfile: CustomerIntelligenceProfile = { ...data.customer, recent_orders: [] };
          bridgeProfileToStores(basicProfile);

          set({
            customerProfile: basicProfile,
            searchResults: [],
            isSearching: false,
            searchError: null,
            viewMode: 'profile'
          });
          toast.success('Customer found');
        }
      } else {
        set({
          customerProfile: null,
          searchResults: [],
          isSearching: false,
          searchError: data.error || 'Customer not found',
          viewMode: 'search'
        });
        toast.error(data.error || 'Customer not found');
      }
    } catch (error) {
      console.error('❌ [CustomerIntelligence] Search error:', error);
      set({
        customerProfile: null,
        searchResults: [],
        isSearching: false,
        searchError: 'Search failed. Please try again.',
        viewMode: 'search'
      });
      toast.error('Search failed. Please try again.');
    }
  },
  
  // Select a customer from search results dropdown
  selectCustomer: async (customer: CustomerSearchResult) => {
    set({ isSearching: true, searchResults: [] });

    try {
      console.log('🎯 [CustomerIntelligence] Selecting customer:', customer.id);

      // Fetch comprehensive profile data for the selected customer
      const comprehensiveResponse = await brain.get_customer_profile({
        customer_id: customer.id,
        comprehensive: true
      });
      const comprehensiveData: CustomerProfileResponse = await comprehensiveResponse.json();

      if (comprehensiveData.success && comprehensiveData.customer) {
        const enrichedProfile: CustomerIntelligenceProfile = {
          ...comprehensiveData.customer,
          default_address: comprehensiveData.default_address,
          recent_orders: comprehensiveData.recent_orders || [],
        };

        // Bridge to POS stores
        bridgeProfileToStores(enrichedProfile);

        set({
          customerProfile: enrichedProfile,
          searchResults: [],
          isSearching: false,
          searchError: null,
          viewMode: 'profile'
        });

        toast.success(`Selected ${enrichedProfile.first_name || ''} ${enrichedProfile.last_name || 'customer'}`);
      } else {
        // Fallback: use the basic customer data from search result
        const basicProfile: CustomerIntelligenceProfile = {
          id: customer.id,
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone: customer.phone,
          customer_reference_number: customer.customer_reference_number,
          recent_orders: [],
        };

        bridgeProfileToStores(basicProfile);

        set({
          customerProfile: basicProfile,
          searchResults: [],
          isSearching: false,
          searchError: null,
          viewMode: 'profile'
        });

        toast.success('Customer selected');
      }
    } catch (error) {
      console.error('❌ [CustomerIntelligence] Select customer error:', error);
      set({
        isSearching: false,
        searchError: 'Failed to load customer details',
      });
      toast.error('Failed to load customer details');
    }
  },

  clearSearch: () => {
    set({
      searchQuery: {
        email: '',
        phone: '',
        customerRef: '',
        name: '',
      },
      searchError: null,
      searchResults: [],
    });
  },

  clearSearchResults: () => {
    set({ searchResults: [] });
  },

  clearCustomer: () => {
    set({
      customerProfile: null,
      searchQuery: {
        email: '',
        phone: '',
        customerRef: '',
        name: '',
      },
      searchError: null,
      searchResults: [],
      viewMode: 'search',
    });
  },
  
  setViewMode: (mode) => {
    set({ viewMode: mode });
  },
}));
