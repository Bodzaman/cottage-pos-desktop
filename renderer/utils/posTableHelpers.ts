import { TableStatus } from './tableTypes';

/**
 * Convert API status (lowercase) to TableStatus (uppercase)
 */
export const convertApiStatusToTableStatus = (apiStatus: string): TableStatus => {
  const upperStatus = apiStatus.toUpperCase();
  
  // Map known statuses to valid TableStatus values
  switch (upperStatus) {
    case 'AVAILABLE':
      return 'AVAILABLE';
    case 'OCCUPIED':
    case 'SEATED':
      return 'SEATED';
    case 'ORDERED':
      return 'ORDERED';
    case 'BILL_REQUESTED':
      return 'BILL_REQUESTED';
    case 'PAYMENT_PROCESSING':
      return 'PAYMENT_PROCESSING';
    case 'PAYMENT_COMPLETE':
      return 'PAYMENT_COMPLETE';
    default:
      console.warn(`Unknown table status: ${apiStatus}, defaulting to AVAILABLE`);
      return 'AVAILABLE';
  }
};
