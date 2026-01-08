// Export all debugging utilities
export { default as ErrorBoundary } from './error-boundary';
export { SafeText, SafeDate, withSafeRendering } from './safe-render';
export { formatDate, formatTime, formatDateTime, safeString } from './date-formatter';
export { default as dateSafetyChecker } from './date-safety-checker';
// DISABLED: Render debugger exports that cause console noise in POSDesktop
// export { default as debugObjectToPrimitive } from './object-primitive-debugger';
// export { default as renderDebugger } from './render-debugger';
// export { default as primitiveConversionTracker } from './primitive-conversion-tracker';

// DISABLED: Import all debuggers to prevent object-to-primitive errors
// import './all-debuggers';

console.log('🔧 [Utils] Core utilities exported (debugging utilities disabled for production)');
