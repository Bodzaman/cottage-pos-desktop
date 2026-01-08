/**
 * Master debugger that imports and initializes all debugging utilities
 */

import './error-boundary';
import './debug-logger';
import './object-primitive-debugger';
import './render-debugger';
import './primitive-conversion-tracker';
import dateSafetyChecker from './date-safety-checker';

console.log('🔧 [Master Debugger] All debugging utilities loaded');

// Initialize global debugging
if (typeof window !== 'undefined') {
  // Add debugging utilities to window for manual access
  (window as any).debugUtils = {
    dateSafetyChecker,
    
    // Quick test functions
    testObjectToPrimitive: () => {
      console.log('🔧 Testing object-to-primitive conversion...');
      const testObj = { test: 'value', date: new Date() };
      try {
        const result = String(testObj);
        console.log('✅ String conversion successful:', result);
      } catch (error) {
        console.error('❌ String conversion failed:', error);
      }
    },
    
    checkCurrentData: () => {
      console.log('🔧 Checking current page data for problematic objects...');
      // This will be expanded to check current React state
    },
    
    clearAllLogs: () => {
      console.clear();
      console.log('🔧 [Master Debugger] Logs cleared, debuggers still active');
    }
  };
  
  console.log('🔧 [Master Debugger] Debug utilities available at window.debugUtils');
}

export default {};
