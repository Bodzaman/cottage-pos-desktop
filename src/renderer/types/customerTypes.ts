
/**
 * Customer Data Types - TypeScript interfaces for customer management
 * 
 * ADAPTED FOR ELECTRON: Core customer data types and validation helpers
 * for the POS system customer management functionality.
 * 
 * Used across customer data store, order processing, and validation logic.
 */

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
}

export type OrderType = 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING' | 'AI_ORDERS';

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

// Enhanced customer validation with detailed checks
export const validateCustomerDataDetailed = (customerData: CustomerData, orderType: OrderType): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  const requiredErrors = validateCustomerData(customerData, orderType);
  errors.push(...requiredErrors);

  // Additional validation warnings
  if (orderType !== 'DINE-IN' && !customerData.phone) {
    warnings.push('Phone number is recommended for better customer service');
  }

  if (orderType === 'DELIVERY' && !customerData.deliveryNotes) {
    warnings.push('Delivery notes help drivers find the location');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Customer data summary for display purposes
export interface CustomerSummary {
  name: string;
  contact: string;
  address?: string;
  tableInfo?: string;
  orderType: OrderType;
}

export const getCustomerSummary = (customerData: CustomerData, orderType: OrderType): CustomerSummary => {
  const name = getCustomerDisplayName(customerData);
  const contact = customerData.phone || customerData.email || 'No contact info';
  const address = orderType === 'DELIVERY' ? getCustomerDisplayAddress(customerData) : undefined;
  const tableInfo = orderType === 'DINE-IN' && customerData.tableNumber 
    ? `Table ${customerData.tableNumber} (${customerData.guestCount || 2} guests)`
    : undefined;

  return {
    name,
    contact,
    address,
    tableInfo,
    orderType
  };
};
