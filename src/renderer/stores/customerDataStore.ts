
/**
 * Customer Data Store - Customer information management for POS system
 * 
 * ADAPTED FOR ELECTRON: This store manages customer data across different order types
 * with proper validation and helper methods for the POS interface.
 * 
 * CHANGES FROM DATABUTTON VERSION:
 * - Updated import paths for Electron renderer structure
 * - Maintained all Zustand functionality and customer validation
 * - Preserved order type-specific validation logic
 * - Added enhanced customer display methods
 */

import { create } from 'zustand';
import { CustomerData, OrderType } from './types'; // ELECTRON: Updated import path

interface CustomerDataStore {
  customerData: CustomerData;
  showCustomerModal: boolean;

  // Actions
  setCustomerData: (data: Partial<CustomerData>) => void;
  clearCustomerData: () => void;
  setShowCustomerModal: (show: boolean) => void;

  // Helper methods
  hasRequiredCustomerData: (orderType: OrderType) => boolean;
  getCustomerSummary: () => string;
  validateCustomerData: (orderType: OrderType) => string[];
  getCustomerDisplayName: () => string;
  getCustomerDisplayAddress: () => string;
}

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

export const useCustomerDataStore = create<CustomerDataStore>((set, get) => ({
  customerData: { ...initialCustomerData },
  showCustomerModal: false,

  setCustomerData: (data) => {
    set(state => ({
      customerData: { ...state.customerData, ...data }
    }));
  },

  clearCustomerData: () => {
    set({ customerData: { ...initialCustomerData } });
  },

  setShowCustomerModal: (show) => {
    set({ showCustomerModal: show });
  },

  hasRequiredCustomerData: (orderType) => {
    const { customerData } = get();

    switch (orderType) {
      case 'DINE-IN':
        return !!customerData.tableNumber;

      case 'COLLECTION':
      case 'DELIVERY':
      case 'WAITING':
        if (!customerData.firstName) return false;
        if (orderType === 'DELIVERY') {
          return !!(customerData.street && customerData.postcode);
        }
        return true;

      default:
        return true;
    }
  },

  getCustomerSummary: () => {
    const { customerData } = get();

    if (customerData.tableNumber) {
      return `Table ${customerData.tableNumber} (${customerData.guestCount || 2} guests)`;
    }

    if (customerData.firstName || customerData.lastName) {
      const name = `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim();
      return name || 'Customer';
    }

    return 'Customer';
  },

  // Enhanced validation with detailed error messages
  validateCustomerData: (orderType: OrderType) => {
    const { customerData } = get();
    const errors: string[] = [];

    switch (orderType) {
      case 'DINE-IN':
        if (!customerData.tableNumber) {
          errors.push('Table number is required');
        }
        break;

      case 'COLLECTION':
      case 'DELIVERY':
      case 'WAITING':
        if (!customerData.firstName) {
          errors.push('Customer name is required');
        }
        break;
    }

    if (orderType === 'DELIVERY') {
      if (!customerData.street) {
        errors.push('Street address is required for delivery');
      }
      if (!customerData.postcode) {
        errors.push('Postcode is required for delivery');
      }
    }

    return errors;
  },

  // Enhanced customer display helpers
  getCustomerDisplayName: () => {
    const { customerData } = get();
    if (customerData.firstName || customerData.lastName) {
      return `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim();
    }
    return 'Not specified';
  },

  getCustomerDisplayAddress: () => {
    const { customerData } = get();
    const parts = [customerData.street, customerData.city, customerData.postcode].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : customerData.address || 'Not specified';
  }
}));

// Export helper functions for external usage
export const customerDataHelpers = {
  getCustomerDisplayName: (customerData: CustomerData): string => {
    if (customerData.firstName || customerData.lastName) {
      return `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim();
    }
    return 'Not specified';
  },

  getCustomerDisplayAddress: (customerData: CustomerData): string => {
    const parts = [customerData.street, customerData.city, customerData.postcode].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : customerData.address || 'Not specified';
  },

  validateCustomerData: (customerData: CustomerData, orderType: OrderType): string[] => {
    const errors: string[] = [];

    switch (orderType) {
      case 'DINE-IN':
        if (!customerData.tableNumber) {
          errors.push('Table number is required');
        }
        break;

      case 'COLLECTION':
      case 'DELIVERY':
      case 'WAITING':
        if (!customerData.firstName) {
          errors.push('Customer name is required');
        }
        break;
    }

    if (orderType === 'DELIVERY') {
      if (!customerData.street) {
        errors.push('Street address is required for delivery');
      }
      if (!customerData.postcode) {
        errors.push('Postcode is required for delivery');
      }
    }

    return errors;
  }
};
