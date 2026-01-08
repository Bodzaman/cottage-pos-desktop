
/**
 * Debug logging utility to track object-to-primitive conversion issues
 */

// Override console methods to catch object-to-primitive conversions
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

function checkForObjectToPrimitiveIssues(args: any[]) {
  args.forEach((arg, index) => {
    if (arg && typeof arg === 'object' && !(arg instanceof Date) && !(arg instanceof Array)) {
      // Check if object might cause primitive conversion issues
      if (arg.constructor === Object || arg.toString() === '[object Object]') {
        // Use original console.warn to avoid infinite recursion
        originalConsoleWarn.call(console, `🔧 [Debug] Potential object-to-primitive issue at argument ${index}:`, arg);
      }
    }
  });
}

// Enhanced logging
console.log = (...args) => {
  checkForObjectToPrimitiveIssues(args);
  originalConsoleLog.apply(console, args);
};

console.error = (...args) => {
  checkForObjectToPrimitiveIssues(args);
  originalConsoleError.apply(console, args);
};

console.warn = (...args) => {
  checkForObjectToPrimitiveIssues(args);
  originalConsoleWarn.apply(console, args);
};

// Track template literal usage
const originalStringPrototypeValueOf = String.prototype.valueOf;
String.prototype.valueOf = function() {
  if (this && typeof this === 'object' && this.constructor !== String) {
    originalConsoleWarn.call(console, '🔧 [Debug] Object being converted to primitive via valueOf:', this);
    originalConsoleWarn.call(console, 'Conversion stack trace:');
  }
  return originalStringPrototypeValueOf.call(this);
};

// Track toString calls on objects
const originalObjectToString = Object.prototype.toString;
Object.prototype.toString = function() {
  if (this && typeof this === 'object' && this instanceof Date) {
    originalConsoleWarn.call(console, '🔧 [Debug] Date object being converted to string:', this);
    originalConsoleWarn.call(console, 'Date conversion stack trace:');
  }
  return originalObjectToString.call(this);
};

export const debugLog = {
  trackObjectUsage: (obj: any, context: string) => {
    if (obj && typeof obj === 'object') {
      originalConsoleLog.call(console, `🔧 [Debug] Object usage in ${context}:`, {
        type: typeof obj,
        constructor: obj.constructor?.name,
        keys: Object.keys(obj),
        obj
      });
    }
  },
  
  trackDateUsage: (date: any, context: string) => {
    originalConsoleLog.call(console, `🔧 [Debug] Date usage in ${context}:`, {
      type: typeof date,
      isDate: date instanceof Date,
      value: date,
      string: typeof date === 'object' && date ? date.toString() : String(date)
    });
  }
};

export default debugLog;
