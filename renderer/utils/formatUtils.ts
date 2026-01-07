/**
 * Utility functions for formatting various data types
 */

/**
 * Format a number as currency (GBP)
 * @param amount - The amount to format
 * @param showSymbol - Whether to show the currency symbol (default: true)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, showSymbol: boolean = true): string => {
  const formatted = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  
  return showSymbol ? formatted : formatted.replace('£', '');
};

/**
 * Format a number as a percentage
 * @param value - The value to format (as decimal, e.g., 0.15 for 15%)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return (value * 100).toFixed(decimals) + "%";
};

/**
 * Format a date string in a readable format
 * @param dateString - ISO date string
 * @param includeTime - Whether to include time (default: false)
 * @returns Formatted date string
 */
export const formatDate = (dateString: string, includeTime: boolean = false): string => {
  const date = new Date(dateString);
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return new Intl.DateTimeFormat('en-GB', options).format(date);
};

/**
 * Format a phone number
 * @param phone - Phone number string
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format UK mobile numbers
  if (cleaned.length === 11 && cleaned.startsWith('07')) {
    return cleaned.slice(0, 5) + " " + cleaned.slice(5, 8) + " " + cleaned.slice(8);
  }
  
  // Format UK landline numbers
  if (cleaned.length === 11 && cleaned.startsWith('01')) {
    return cleaned.slice(0, 5) + " " + cleaned.slice(5, 8) + " " + cleaned.slice(8);
  }
  
  // Return original if no formatting rule matches
  return phone;
};

/**
 * Truncate text to a specified length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add when truncated (default: '...')
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Format file size in human readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Convert snake_case to Title Case
 * @param str - Snake case string
 * @returns Title case string
 */
export const snakeToTitleCase = (str: string): string => {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Format order code (e.g., ORD-1234)
 * @param id - Order ID
 * @param prefix - Prefix for the code (default: 'ORD')
 * @returns Formatted order code
 */
export const formatOrderCode = (id: string | number, prefix: string = 'ORD'): string => {
  return prefix + "-" + String(id).padStart(4, '0');
};
