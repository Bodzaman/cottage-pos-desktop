/**
 * Master debugger that imports and initializes all debugging utilities
 */

import './error-boundary';
import './debug-logger';
import './object-primitive-debugger';
import './render-debugger';
import './primitive-conversion-tracker';
import dateSafetyChecker from './date-safety-checker';


// Initialize global debugging
if (typeof window !== 'undefined') {
  // Add debugging utilities to window for manual access
  (window as any).debugUtils = {
    dateSafetyChecker,
    
    // Quick test functions
    testObjectToPrimitive: () => {
      const testObj = { test: 'value', date: new Date() };
      try {
        const result = String(testObj);
      } catch (error) {
        console.error(' String conversion failed:', error);
      }
    },
    
    checkCurrentData: () => {
      // This will be expanded to check current React state
    },
    
    clearAllLogs: () => {
      console.clear();
    }
  };
  
}

export default {};
