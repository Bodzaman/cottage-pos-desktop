/**
 * Error handling utilities for browser compatibility and extension conflicts
 */

// Global error handler for unhandled promise rejections
export const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections (like the async listener error)
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    
    // Check if it's the common browser extension error
    if (error && typeof error === 'object') {
      const errorMessage = error.message || '';
      
      // Common browser extension errors to suppress
      const extensionErrors = [
        'A listener indicated an asynchronous response by returning true',
        'message channel closed before a response was received',
        'Extension context invalidated',
        'The message port closed before a response was received',
        'Could not establish connection. Receiving end does not exist'
      ];
      
      const isExtensionError = extensionErrors.some(pattern => 
        errorMessage.includes(pattern)
      );
      
      if (isExtensionError) {
        console.warn('🔧 Browser extension error suppressed:', errorMessage);
        event.preventDefault(); // Prevent the error from showing in console
        return;
      }
    }
    
    // Log other unhandled promise rejections for debugging
    console.error('🚨 Unhandled promise rejection:', error);
  });

  // Handle general errors
  window.addEventListener('error', (event) => {
    const error = event.error;
    
    if (error && typeof error === 'object') {
      const errorMessage = error.message || '';
      
      // Suppress known browser extension errors
      const extensionErrors = [
        'Script error',
        'Non-Error promise rejection captured',
        'ResizeObserver loop limit exceeded'
      ];
      
      const isExtensionError = extensionErrors.some(pattern => 
        errorMessage.includes(pattern)
      );
      
      if (isExtensionError) {
        console.warn('🔧 Browser error suppressed:', errorMessage);
        event.preventDefault();
        return;
      }
    }
  });
};

// Wrapper for fetch requests with proper error handling
export const safeFetch = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    // Handle network errors gracefully
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }
    
    if (error.message?.includes('Failed to fetch')) {
      throw new Error('Network error - please check your connection');
    }
    
    throw error;
  }
};

// Wrapper for async operations with error boundaries
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  fallbackValue?: T,
  errorMessage = 'Operation failed'
): Promise<T | undefined> => {
  try {
    return await operation();
  } catch (error: any) {
    console.warn(`🔧 ${errorMessage}:`, error);
    return fallbackValue;
  }
};

// Check if we're running in a problematic browser environment
export const checkBrowserCompatibility = () => {
  const userAgent = navigator.userAgent;
  const warnings: string[] = [];
  
  // Check for known problematic extensions
  if (window.chrome && window.chrome.runtime) {
    warnings.push('Chrome extensions detected - some errors may be suppressed');
  }
  
  // Check for old browsers
  if (!window.fetch) {
    warnings.push('Old browser detected - some features may not work');
  }
  
  if (warnings.length > 0) {
    console.info('🔧 Browser compatibility warnings:', warnings);
  }
  
  return warnings;
};
