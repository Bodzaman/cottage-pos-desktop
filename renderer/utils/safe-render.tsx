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
  value: any;
  format?: 'date' | 'time' | 'datetime';
  fallback?: string;
}

export const SafeDate: React.FC<SafeDateProps> = ({ value, format = 'date', fallback = '' }) => {
  let formattedValue = fallback;
  
  try {
    switch (format) {
      case 'date':
        formattedValue = formatDate(value) || fallback;
        break;
      case 'time':
        formattedValue = formatTime(value) || fallback;
        break;
      case 'datetime':
        formattedValue = formatDateTime(value) || fallback;
        break;
    }
  } catch (error) {
    console.error('🚨 [SafeDate] Error rendering date:', { value, format, error });
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
      console.error('🚨 [SafeRendering] Component render error:', { Component: Component.name, error });
      return (
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
          Error rendering {Component.name || 'component'}
        </div>
      );
    }
  };
};

export default { SafeText, SafeDate, withSafeRendering };
