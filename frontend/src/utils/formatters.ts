/**
 * Utility functions for formatting data
 */

// Function to format file size into human-readable format
export const formatFileSize = (bytes: number): string => {
  if (!bytes) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${sizes[i]}`;
};

/**
 * Format a number as a currency string
 * @param amount The amount to format
 * @param currency The currency code (default: GBP)
 * @returns A formatted string (e.g. £12.99)
 */
export const formatCurrency = (amount: number | null | undefined, currency: string = 'GBP'): string => {
  if (amount === null || amount === undefined) return '-';
  
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format a percentage value
 * @param value The percentage value (e.g. 0.15 for 15%)
 * @returns A formatted string (e.g. 15%)
 */
export const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '-';
  
  return new Intl.NumberFormat('en-GB', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
};

/**
 * Format a time duration from a start time
 * @param occupiedAt - The date when occupation started
 * @returns Formatted duration string (e.g., "1h 30m" or "45m")
 */
export const formatDuration = (occupiedAt: Date | null): string => {
  if (!occupiedAt) return "0m";
  
  const now = new Date();
  const diffMs = now.getTime() - occupiedAt.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffHours > 0) {
    return `${diffHours}h ${diffMins % 60}m`;
  } else {
    return `${diffMins}m`;
  }
};

/**
 * Format a date to a relative time string (e.g., "2 hours ago")
 * @param date - The date to format
 * @returns A formatted string (e.g., "2 hours ago", "just now", etc.)
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Less than a minute
  if (secondsAgo < 60) {
    return 'just now';
  }
  
  // Less than an hour
  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) {
    return `${minutesAgo} ${minutesAgo === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // Less than a day
  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) {
    return `${hoursAgo} ${hoursAgo === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Less than a week
  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo < 7) {
    return `${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago`;
  }
  
  // Less than a month
  const weeksAgo = Math.floor(daysAgo / 7);
  if (weeksAgo < 4) {
    return `${weeksAgo} ${weeksAgo === 1 ? 'week' : 'weeks'} ago`;
  }
  
  // Format as date
  return date.toLocaleDateString();
};

/**
 * Format table occupation time with appropriate styling based on duration
 * @param occupiedAt - The date when occupation started
 * @returns An object with duration string and CSS class for styling
 */
export const formatTableOccupation = (occupiedAt: Date | null): { duration: string; className: string } => {
  if (!occupiedAt) return { duration: "0m", className: "" };
  
  const now = new Date();
  const diffMs = now.getTime() - occupiedAt.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  let duration = formatDuration(occupiedAt);
  let className = "";
  
  // Style based on duration
  if (diffMins < 30) {
    className = "text-green-400";
  } else if (diffMins < 90) {
    className = "text-amber-400";
  } else {
    className = "text-red-400";
  }
  
  return { duration, className };
};
