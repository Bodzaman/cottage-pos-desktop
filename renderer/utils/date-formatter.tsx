/**
 * Safe date formatting utilities to prevent object-to-primitive conversion errors
 */

export const formatDate = (date: any): string => {
  if (!date) return '';
  
  try {
    // Handle various date formats safely
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString();
    }
    
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    
    // If it's an object with date properties, extract the date
    if (typeof date === 'object' && date.toISOString) {
      return date.toLocaleDateString();
    }
    
    console.warn('🔧 [DateFormatter] Unknown date format:', typeof date, date);
    return String(date);
  } catch (error) {
    console.error('🚨 [DateFormatter] Error formatting date:', { date, error });
    return 'Invalid Date';
  }
};

export const formatTime = (date: any): string => {
  if (!date) return '';
  
  try {
    if (typeof date === 'string') {
      return new Date(date).toLocaleTimeString();
    }
    
    if (date instanceof Date) {
      return date.toLocaleTimeString();
    }
    
    if (typeof date === 'object' && date.toISOString) {
      return date.toLocaleTimeString();
    }
    
    console.warn('🔧 [TimeFormatter] Unknown time format:', typeof date, date);
    return String(date);
  } catch (error) {
    console.error('🚨 [TimeFormatter] Error formatting time:', { date, error });
    return 'Invalid Time';
  }
};

export const formatDateTime = (date: any): string => {
  if (!date) return '';
  
  try {
    if (typeof date === 'string') {
      const d = new Date(date);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
    }
    
    if (date instanceof Date) {
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    }
    
    if (typeof date === 'object' && date.toISOString) {
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    }
    
    console.warn('🔧 [DateTimeFormatter] Unknown datetime format:', typeof date, date);
    return String(date);
  } catch (error) {
    console.error('🚨 [DateTimeFormatter] Error formatting datetime:', { date, error });
    return 'Invalid DateTime';
  }
};

// Safe string conversion for any object
export const safeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  
  try {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return String(value);
    
    // Handle Date objects
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    // Handle objects with toString method
    if (typeof value === 'object' && typeof value.toString === 'function') {
      const result = value.toString();
      if (result !== '[object Object]') {
        return result;
      }
    }
    
    // Fallback to JSON stringification
    return JSON.stringify(value);
  } catch (error) {
    console.error('🚨 [SafeString] Error converting to string:', { value, error });
    return '[Conversion Error]';
  }
};
