import React from 'react';
import { safeString, formatDate, formatTime, formatDateTime } from './date-formatter';

/**
 * Safe rendering utilities to prevent object-to-primitive conversion errors
 */

interface SafeTextProps {
  value: any;
  fallback?: string;
}

export const SafeText: React.FC<SafeTextProps> = ({ value, fallback = '' }) => {
  const safeValue = safeString(value) || fallback;
  return <>{safeValue}</>;
};

interface SafeDateProps {
  value?: any;
  date?: any; // Alias for value - for backward compatibility
  format?: 'date' | 'time' | 'datetime';
  fallback?: string;
}

export const SafeDate: React.FC<SafeDateProps> = ({ value, date, format = 'date', fallback = '' }) => {
  // Support both 'value' and 'date' props
  const dateValue = value ?? date;
  let formattedValue = fallback;
  
  try {
    switch (format) {
      case 'date':
        formattedValue = formatDate(dateValue) || fallback;
        break;
      case 'time':
        formattedValue = formatTime(dateValue) || fallback;
        break;
      case 'datetime':
        formattedValue = formatDateTime(dateValue) || fallback;
        break;
    }
  } catch (error) {
    formattedValue = fallback;
  }
  
  return <>{formattedValue}</>;
};

// HOC to wrap components with safe rendering
export const withSafeRendering = <P extends object>(Component: React.ComponentType<P>) => {
  return (props: P) => {
    try {
      return <Component {...props} />;
    } catch (error) {
      return (
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
          Error rendering {Component.name || 'component'}
        </div>
      );
    }
  };
};

export default { SafeText, SafeDate, withSafeRendering };
