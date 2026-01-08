/**
 * Date safety checker to prevent object-to-primitive conversion errors
 */

// Check if a value is a problematic Date object
export const isProblematicDate = (value: any): boolean => {
  if (!value) return false;
  
  // Check for Date objects that might cause issues
  if (value instanceof Date) {
    // Check if Date is invalid
    if (isNaN(value.getTime())) {
      console.warn('🚨 [DateSafety] Invalid Date object detected:', value);
      return true;
    }
    return false;
  }
  
  // Check for objects that might be Date-like
  if (typeof value === 'object' && value !== null) {
    // Check for Supabase timestamp objects
    if (typeof value.seconds === 'number' && typeof value.nanoseconds === 'number') {
      console.warn('🔧 [DateSafety] Firestore Timestamp detected:', value);
      return true;
    }
    
    // Check for PostgreSQL timestamp objects
    if (value._date || value.date) {
      console.warn('🔧 [DateSafety] PostgreSQL timestamp detected:', value);
      return true;
    }
    
    // Check for objects with date-like properties
    if (value.toISOString && typeof value.toISOString === 'function') {
      console.warn('🔧 [DateSafety] Date-like object detected:', value);
      return true;
    }
  }
  
  return false;
};

// Safe date extraction
export const extractSafeDate = (value: any): Date | null => {
  if (!value) return null;
  
  try {
    // Handle actual Date objects
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }
    
    // Handle string dates
    if (typeof value === 'string') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Handle Firestore Timestamps
    if (value.seconds && value.nanoseconds) {
      return new Date(value.seconds * 1000 + value.nanoseconds / 1000000);
    }
    
    // Handle PostgreSQL timestamps
    if (value._date) {
      return new Date(value._date);
    }
    
    if (value.date) {
      return new Date(value.date);
    }
    
    // Handle objects with toISOString
    if (value.toISOString && typeof value.toISOString === 'function') {
      return new Date(value.toISOString());
    }
    
    return null;
  } catch (error) {
    console.error('🚨 [DateSafety] Error extracting date:', { value, error });
    return null;
  }
};

// Safe date string conversion
export const safeDateString = (value: any): string => {
  const date = extractSafeDate(value);
  if (!date) return '';
  
  try {
    return date.toISOString();
  } catch (error) {
    console.error('🚨 [DateSafety] Error converting date to string:', { value, error });
    return '';
  }
};

// Check data objects for problematic dates
export const checkDataForProblematicDates = (data: any, context: string = 'unknown'): void => {
  if (!data || typeof data !== 'object') return;
  
  const checkValue = (val: any, path: string) => {
    if (isProblematicDate(val)) {
      console.warn(`🚨 [DateSafety] Problematic date found at ${context}.${path}:`, val);
    }
    
    if (Array.isArray(val)) {
      val.forEach((item, index) => checkValue(item, `${path}[${index}]`));
    } else if (val && typeof val === 'object') {
      Object.keys(val).forEach(key => checkValue(val[key], `${path}.${key}`));
    }
  };
  
  if (Array.isArray(data)) {
    data.forEach((item, index) => checkValue(item, `[${index}]`));
  } else {
    Object.keys(data).forEach(key => checkValue(data[key], key));
  }
};

export default {
  isProblematicDate,
  extractSafeDate,
  safeDateString,
  checkDataForProblematicDates
};
