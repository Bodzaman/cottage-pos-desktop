
/**
 * Tracks all primitive conversion attempts to identify the exact source of the error
 * DISABLED: Global overrides removed to prevent infinite recursion
 */

// Store conversion attempts
const conversionAttempts: Array<{
  type: string;
  object: any;
  result: any;
  stack: string;
  timestamp: string;
}> = [];

// DISABLED: String tracking was causing infinite recursion
/*
// Track String() calls
const originalStringConstructor = String;
const StringTracker = function(value?: any) {
  // ... tracking code ...
};
*/

// DISABLED: Number tracking was causing infinite recursion  
/*
// Track Number() calls
const originalNumberConstructor = Number;
const NumberTracker = function(value?: any) {
  // ... tracking code ...
};
*/

// DISABLED: Template literal tracking
/*
// Track template literal operations
const originalStringRaw = String.raw;
String.raw = function(template, ...substitutions) {
  // ... tracking code ...
};
*/

export const getConversionAttempts = () => [...conversionAttempts];

export const clearConversionAttempts = () => {
  conversionAttempts.length = 0;
};

export const logConversionAttempts = () => {
  if (conversionAttempts.length > 0) {
    console.group('🚨 [PrimitiveTracker] Conversion Attempts Summary');
    conversionAttempts.forEach((attempt, index) => {
      console.log(`Attempt ${index + 1}:`, attempt);
    });
    console.groupEnd();
  } else {
    console.log('✅ [PrimitiveTracker] No conversion attempts detected');
  }
};

export default {
  getConversionAttempts,
  clearConversionAttempts,
  logConversionAttempts
};
