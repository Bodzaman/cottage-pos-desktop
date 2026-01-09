import { create } from 'zustand';
import type { CustomerData } from './customerTypes';
import type { OrderType } from './masterTypes';

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
  deliveryNotes: '',
  deliveryFee: undefined
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
  }
}));
