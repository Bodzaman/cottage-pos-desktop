
/**
 * Comprehensive debugger for object-to-primitive conversion issues
 * DISABLED: Global overrides removed to prevent infinite recursion
 */

export const debugObjectToPrimitive = {
  trackObject: (obj: any) => {
    console.log('🔧 [ObjectPrimitive] Object tracking disabled to prevent recursion');
  },
  
  logConversion: (obj: any, context: string) => {
    console.log(`🔧 [ObjectPrimitive] Manual conversion check in ${context}:`, {
      object: obj,
      type: typeof obj,
      isDate: obj instanceof Date,
      isArray: Array.isArray(obj),
      constructor: obj?.constructor?.name,
      toString: obj?.toString?.(),
      valueOf: obj?.valueOf?.(),
      keys: obj && typeof obj === 'object' ? Object.keys(obj) : undefined
    });
  }
};

export default debugObjectToPrimitive;
