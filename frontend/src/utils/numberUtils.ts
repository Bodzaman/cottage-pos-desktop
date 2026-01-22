/**
 * Safe number formatting utilities
 * Prevents "Cannot read properties of undefined (reading 'toFixed')" errors
 */

/**
 * Safely format a number to fixed decimal places
 * @param value - The number to format (can be undefined/null)
 * @param decimals - Number of decimal places (default: 2)
 * @param fallback - Fallback value if input is invalid (default: 0)
 * @returns Formatted string
 */
export function safeToFixed(value: number | undefined | null, decimals: number = 2, fallback: number = 0): string {
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : fallback;
  return safeValue.toFixed(decimals);
}

/**
 * Safely format a currency amount
 * @param value - The amount to format
 * @param currency - Currency symbol (default: '£')
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export function safeCurrency(value: number | undefined | null, currency: string = '£', decimals: number = 2): string {
  return `${currency}${safeToFixed(value, decimals)}`;
}

/**
 * Safely add two numbers with null safety
 * @param a - First number
 * @param b - Second number
 * @returns Sum with null safety
 */
export function safeAdd(a: number | undefined | null, b: number | undefined | null): number {
  const safeA = typeof a === 'number' && !isNaN(a) ? a : 0;
  const safeB = typeof b === 'number' && !isNaN(b) ? b : 0;
  return safeA + safeB;
}

/**
 * Safely calculate tip total with validation
 * @param orderTotal - Base order total
 * @param tipAmount - Tip amount
 * @returns Safe total with tip
 */
export function safeTotalWithTip(orderTotal: number | undefined | null, tipAmount: number | undefined | null): number {
  return safeAdd(orderTotal, tipAmount);
}

/**
 * Validate that a number is safe for financial calculations
 * @param value - Value to validate
 * @returns true if safe, false otherwise
 */
export function isValidFinancialAmount(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value) && value >= 0;
}
