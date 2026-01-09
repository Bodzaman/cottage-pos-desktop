import { create } from 'zustand';
import { apiClient } from 'app';
import { CustomerProfile, CustomerProfileResponse, AppApisCustomerProfileApiCustomerAddress, RecentOrder } from 'types';
import { toast } from 'sonner';

// Extended types for our store
export interface CustomerIntelligenceProfile extends CustomerProfile {
  default_address?: AppApisCustomerProfileApiCustomerAddress | null;
  recent_orders?: RecentOrder[];
}

export interface SearchQuery {
  email: string;
  phone: string;
  customerRef: string;
}

export type ViewMode = 'search' | 'loading' | 'profile';

interface CustomerIntelligenceState {
  // Search State
  searchQuery: SearchQuery;
  
  // Results
  customerProfile: CustomerIntelligenceProfile | null;
  
  // UI State
  isSearching: boolean;
  searchError: string | null;
  viewMode: ViewMode;
  
  // Actions
  setSearchQuery: (field: keyof SearchQuery, value: string) => void;
  searchCustomer: (field: keyof SearchQuery, value: string) => Promise<void>;
  clearSearch: () => void;
  clearCustomer: () => void;
  setViewMode: (mode: ViewMode) => void;
}

export const usePOSCustomerIntelligence = create<CustomerIntelligenceState>((set, get) => ({
  // Initial State
  searchQuery: {
    email: '',
    phone: '',
    customerRef: '',
  },
  
  customerProfile: null,
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
      viewMode: 'loading' 
    });
    
    try {
      console.log(`🔍 [CustomerIntelligence] Searching by ${field}:`, trimmedValue);
      
      // Map field to API parameter
      const searchParams: any = {};
      if (field === 'email') {
        searchParams.email = trimmedValue;
      } else if (field === 'phone') {
        searchParams.phone = trimmedValue;
      } else if (field === 'customerRef') {
        searchParams.customer_reference = trimmedValue;
      }
      
      // Use lookup-customer endpoint
      const response = await apiClient.lookup_customer(searchParams);
      const data: CustomerProfileResponse = await response.json();
      
      console.log('📊 [CustomerIntelligence] Search result:', data);
      
      if (data.success && data.customer) {
        // Now fetch comprehensive data (addresses, orders, favorites)
        try {
          const comprehensiveResponse = await apiClient.get_customer_profile({ 
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
            
            set({ 
              customerProfile: enrichedProfile,
              isSearching: false,
              searchError: null,
              viewMode: 'profile'
            });
            
            toast.success(`✅ Found ${enrichedProfile.first_name || ''} ${enrichedProfile.last_name || 'customer'}`);
          } else {
            // Fallback to basic profile if comprehensive fails
            set({ 
              customerProfile: { ...data.customer, recent_orders: [] },
              isSearching: false,
              searchError: null,
              viewMode: 'profile'
            });
            toast.success('Customer found');
          }
        } catch (compError) {
          console.warn('⚠️ [CustomerIntelligence] Could not load comprehensive data:', compError);
          // Still show basic profile
          set({ 
            customerProfile: { ...data.customer, recent_orders: [] },
            isSearching: false,
            searchError: null,
            viewMode: 'profile'
          });
          toast.success('Customer found');
        }
      } else {
        set({ 
          customerProfile: null,
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
        isSearching: false,
        searchError: 'Search failed. Please try again.',
        viewMode: 'search'
      });
      toast.error('Search failed. Please try again.');
    }
  },
  
  clearSearch: () => {
    set({
      searchQuery: {
        email: '',
        phone: '',
        customerRef: '',
      },
      searchError: null,
    });
  },
  
  clearCustomer: () => {
    set({
      customerProfile: null,
      searchQuery: {
        email: '',
        phone: '',
        customerRef: '',
      },
      searchError: null,
      viewMode: 'search',
    });
  },
  
  setViewMode: (mode) => {
    set({ viewMode: mode });
  },
}));
