
/**
 * Comprehensive debugger for object-to-primitive conversion issues
 * DISABLED: Global overrides removed to prevent infinite recursion
 */

export const debugObjectToPrimitive = {
  trackObject: (obj: any) => {
    // Disabled: no-op function
  },

  untrackObject: (obj: any) => {
    // Disabled: no-op function
  }
};

export default debugObjectToPrimitive;
