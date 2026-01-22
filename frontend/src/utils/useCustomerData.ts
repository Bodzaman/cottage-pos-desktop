import { useState, useEffect } from 'react';
import { useSimpleAuth } from './simple-auth-context';

/**
 * Customer data structure
 */
export interface CustomerData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

/**
 * Delivery address structure
 */
export interface DeliveryAddress {
  street: string;
  city: string;
  postcode: string;
  notes?: string;
}

/**
 * Hook return type
 */
interface UseCustomerDataReturn {
  customerData: CustomerData;
  deliveryAddress: DeliveryAddress;
  isLoading: boolean;
  error: string | null;
  updateCustomerData: (data: Partial<CustomerData>) => void;
  updateDeliveryAddress: (address: Partial<DeliveryAddress>) => void;
  resetToProfile: () => void;
}

/**
 * useCustomerData - Single source of truth for customer information
 * 
 * Handles:
 * - Profile data loading and integration
 * - Fallback hierarchy: profile → user → empty
 * - Clean state management
 * - No timing dependencies or race conditions
 */
export function useCustomerData(): UseCustomerDataReturn {
  const { user, isAuthenticated, profile, addresses } = useSimpleAuth();
  
  // Core customer data state
  const [customerData, setCustomerData] = useState<CustomerData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });
  
  // Delivery address state
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    street: '',
    city: '',
    postcode: '',
    notes: ''
  });
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load customer data from profile/user when available
  useEffect(() => {
    const loadCustomerData = () => {
      try {
        setIsLoading(true);
        setError(null);
        
        let loadedData: CustomerData = {
          firstName: '',
          lastName: '',
          phone: '',
          email: ''
        };
        
        if (isAuthenticated && user) {
          // Priority 1: Use profile data if available
          if (profile) {
            console.log('🔍 useCustomerData: Loading from profile:', profile);
            loadedData = {
              firstName: profile.first_name || '',
              lastName: profile.last_name || '',
              phone: profile.phone || '',
              email: profile.email || user.email || ''
            };
          }
          // Priority 2: Fallback to user metadata
          else if (user.user_metadata) {
            console.log('🔍 useCustomerData: Loading from user_metadata:', user.user_metadata);
            loadedData = {
              firstName: user.user_metadata.first_name || '',
              lastName: user.user_metadata.last_name || '',
              phone: user.user_metadata.phone || '',
              email: user.email || ''
            };
          }
          // Priority 3: Basic user data only
          else {
            console.log('🔍 useCustomerData: Loading basic user data');
            loadedData = {
              firstName: '',
              lastName: '',
              phone: '',
              email: user.email || ''
            };
          }
        }
        // Priority 4: Guest user - empty data
        else {
          console.log('🔍 useCustomerData: Guest user - empty data');
          loadedData = {
            firstName: '',
            lastName: '',
            phone: '',
            email: ''
          };
        }
        
        console.log('✅ useCustomerData: Final loaded data:', loadedData);
        setCustomerData(loadedData);
        
        // ✅ NEW: Load default delivery address from saved addresses
        if (addresses && addresses.length > 0) {
          const defaultAddress = addresses.find(addr => addr.is_default) || addresses[0];
          if (defaultAddress) {
            console.log('🏠 useCustomerData: Loading default address:', defaultAddress);
            setDeliveryAddress({
              street: defaultAddress.address_line1,
              city: defaultAddress.city,
              postcode: defaultAddress.postal_code,
              notes: defaultAddress.delivery_instructions || ''
            });
          }
        } else {
          console.log('🏠 useCustomerData: No saved addresses found - using empty address');
          setDeliveryAddress({
            street: '',
            city: '',
            postcode: '',
            notes: ''
          });
        }
        
      } catch (err) {
        console.error('❌ useCustomerData: Error loading customer data:', err);
        setError('Failed to load customer information');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCustomerData();
  }, [isAuthenticated, user, profile, addresses]);
  
  // Update customer data
  const updateCustomerData = (data: Partial<CustomerData>) => {
    setCustomerData(prev => ({ ...prev, ...data }));
  };
  
  // Update delivery address
  const updateDeliveryAddress = (address: Partial<DeliveryAddress>) => {
    setDeliveryAddress(prev => ({ ...prev, ...address }));
  };
  
  // Reset to profile data
  const resetToProfile = () => {
    if (isAuthenticated && user) {
      if (profile) {
        setCustomerData({
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          phone: profile.phone || '',
          email: profile.email || user.email || ''
        });
      } else if (user.user_metadata) {
        setCustomerData({
          firstName: user.user_metadata.first_name || '',
          lastName: user.user_metadata.last_name || '',
          phone: user.user_metadata.phone || '',
          email: user.email || ''
        });
      }
    }
  };
  
  return {
    customerData,
    deliveryAddress,
    isLoading,
    error,
    updateCustomerData,
    updateDeliveryAddress,
    resetToProfile
  };
}
