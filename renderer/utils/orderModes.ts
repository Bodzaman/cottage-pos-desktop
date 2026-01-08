/**
 * Central Order Mode Constants
 * Standard format: UPPERCASE with underscore (matches backend storage)
 * Example: 'DINE_IN', 'COLLECTION', 'DELIVERY', 'WAITING'
 */

export const ORDER_MODES = {
  DINE_IN: 'DINE_IN',
  WAITING: 'WAITING',
  COLLECTION: 'COLLECTION',
  DELIVERY: 'DELIVERY'
} as const;

export type OrderMode = typeof ORDER_MODES[keyof typeof ORDER_MODES];

/**
 * Helper functions for order mode format conversion
 */

/**
 * Convert order mode to display format
 * DINE_IN -> Dine In
 * COLLECTION -> Collection
 */
export const orderModeToDisplay = (mode: string): string => {
  return mode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Convert order mode to API/backend format (uppercase with underscore)
 * dine-in -> DINE_IN
 * Dine In -> DINE_IN
 * dine_in -> DINE_IN
 */
export const orderModeToApi = (mode: string): string => {
  return mode.toUpperCase().replace(/-/g, '_').replace(/\s/g, '_');
};

/**
 * Convert order mode from API format to lowercase with underscore
 * DINE_IN -> dine_in
 * Used for legacy components that expect lowercase format
 */
export const orderModeToLowercase = (mode: string): string => {
  return mode.toLowerCase();
};

/**
 * Validate if a string is a valid order mode
 */
export const isValidOrderMode = (mode: string): boolean => {
  const normalized = orderModeToApi(mode);
  return Object.values(ORDER_MODES).includes(normalized as OrderMode);
};

/**
 * Get all order modes as array
 */
export const getAllOrderModes = (): OrderMode[] => {
  return Object.values(ORDER_MODES);
};
