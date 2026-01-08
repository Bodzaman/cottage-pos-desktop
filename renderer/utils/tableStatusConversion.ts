import { TableStatus } from './tableTypes';

/**
 * Converts API table status (lowercase) to TableStatus enum (uppercase)
 */
export const convertApiStatusToTableStatus = (apiStatus: string): TableStatus => {
  const statusMap: Record<string, TableStatus> = {
    'available': 'AVAILABLE',
    'occupied': 'SEATED',
    'reserved': 'RESERVED', 
    'unavailable': 'UNAVAILABLE',
    'seated': 'SEATED',
    'ordered': 'ORDERED'
  };
  return statusMap[apiStatus.toLowerCase()] || 'AVAILABLE';
};
