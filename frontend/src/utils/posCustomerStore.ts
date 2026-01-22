/**
 * posCustomerStore.ts
 * 
 * Focused Zustand store for POS customer data management
 * Separates customer-specific state from order and UI state
 * 
 * Key Benefits:
 * - Components subscribe only to customer data changes
 * - No re-renders when order items or UI modals change
 * - Centralized customer data validation
 */

import { create } from 'zustand';

// ============================================================================
// CUSTOMER STORE TYPES
// ============================================================================

export interface CustomerData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  notes: string;
  tableNumber: string;
  guestCount: number;
  address: string;
  street: string;
  city: string;
  postcode: string;
  deliveryNotes: string;
}

export interface CustomerStore {
  // Customer Data
  customerData: CustomerData;
  
  // Customer Actions
  updateCustomer: (data: Partial<CustomerData>) => void;
  clearCustomer: () => void;
  setCustomerField: (field: keyof CustomerData, value: string | number) => void;
  
  // Validation Helpers
  hasRequiredDataForOrderType: (orderType: 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING') => boolean;
  getCustomerDisplayName: () => string;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialCustomerData: CustomerData = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  notes: '',
  tableNumber: '',
  guestCount: 2,
  address: '',
  street: '',
  city: '',
  postcode: '',
  deliveryNotes: ''
};

// ============================================================================
// CUSTOMER STORE IMPLEMENTATION
// ============================================================================

export const usePOSCustomerStore = create<CustomerStore>((set, get) => ({
  // ============================================================================
  // INITIAL STATE
  // ============================================================================
  customerData: { ...initialCustomerData },
  
  // ============================================================================
  // CUSTOMER ACTIONS
  // ============================================================================
  
  updateCustomer: (data: Partial<CustomerData>) => {
    set(state => ({
      customerData: {
        ...state.customerData,
        ...data
      }
    }));
  },
  
  clearCustomer: () => {
    set({ customerData: { ...initialCustomerData } });
  },
  
  setCustomerField: (field, value) => {
    set(state => ({
      customerData: {
        ...state.customerData,
        [field]: value
      }
    }));
  },
  
  // ============================================================================
  // VALIDATION HELPERS
  // ============================================================================
  
  hasRequiredDataForOrderType: (orderType) => {
    const { customerData } = get();
    
    switch (orderType) {
      case 'DINE-IN':
        // Dine-in just needs table selection (handled in order store)
        return true;
      
      case 'COLLECTION':
      case 'WAITING':
        // Collection/Waiting needs name and phone
        return !!customerData.firstName && !!customerData.phone;
      
      case 'DELIVERY':
        // Delivery needs name, phone, and address
        return !!customerData.firstName && 
               !!customerData.phone && 
               !!customerData.postcode;
      
      default:
        return false;
    }
  },
  
  getCustomerDisplayName: () => {
    const { customerData } = get();
    
    if (customerData.firstName && customerData.lastName) {
      return `${customerData.firstName} ${customerData.lastName}`;
    }
    
    if (customerData.firstName) {
      return customerData.firstName;
    }
    
    if (customerData.phone) {
      return customerData.phone;
    }
    
    return 'Guest';
  }
}));
