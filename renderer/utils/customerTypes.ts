import type { OrderType } from './masterTypes';

export interface CustomerData {
  // Common fields
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  notes?: string;
  
  // Dine-in specific
  tableNumber?: string;
  guestCount?: number;
  
  // Delivery specific
  address?: string;
  street?: string;
  city?: string;
  postcode?: string;
  deliveryNotes?: string;
  deliveryFee?: number; // Calculated delivery fee from postcode validation
}

// Helper function to get customer display name
export const getCustomerDisplayName = (customerData: CustomerData): string => {
  if (customerData.firstName || customerData.lastName) {
    return `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim();
  }
  return 'Not specified';
};

// Helper function to get customer display address
export const getCustomerDisplayAddress = (customerData: CustomerData): string => {
  const parts = [customerData.street, customerData.city, customerData.postcode].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : customerData.address || 'Not specified';
};

// Helper function to validate customer data based on order type
export const validateCustomerData = (customerData: CustomerData, orderType: OrderType): string[] => {
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
};
