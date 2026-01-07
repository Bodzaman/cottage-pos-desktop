/**
 * Centralized API Error Handler
 * 
 * Provides consistent error extraction and handling across all API calls.
 * Handles common HTTP error patterns from the brain client.
 */

export interface ApiError {
  status: number;
  message: string;
  detail?: any;
  isNotFound: boolean;
  isConflict: boolean;
  isServerError: boolean;
}

/**
 * Extract meaningful error information from API HTTP client errors
 * 
 * The API HTTP client throws errors with this structure:
 * {
 *   status: number,
 *   error: { detail: any },
 *   statusText: string
 * }
 */
export function extractApiError(error: any): ApiError {
  // Debug logging
  console.log('🔍 API Error Debug:', {
    error,
    status: error?.status,
    statusText: error?.statusText,
    errorProp: error?.error,
    detail: error?.error?.detail,
    message: error?.message,
    keys: Object.keys(error || {})
  });

  const status = error?.status || 500;
  const detail = error?.error?.detail;
  
  let message = 'An unexpected error occurred';

  // Handle 404 - Not Found
  if (status === 404) {
    message = detail?.message || detail || 'Resource not found';
    return {
      status,
      message,
      detail,
      isNotFound: true,
      isConflict: false,
      isServerError: false
    };
  }

  // Handle 409 - Conflict (usually asset in use)
  if (status === 409) {
    if (typeof detail === 'object' && detail !== null) {
      const usingItems = detail.using_items || [];
      const itemList = usingItems.length > 0 
        ? `\n\nUsed by: ${usingItems.slice(0, 5).join(', ')}${usingItems.length > 5 ? ` and ${usingItems.length - 5} more` : ''}`
        : '';
      
      message = `Cannot delete - it's currently used by ${detail.count || 'one or more'} menu item(s).${itemList}\n\n${detail.suggestion || 'Remove or replace it from those menu items first.'}`;
    } else {
      message = detail || 'Resource is currently in use';
    }
    
    return {
      status,
      message,
      detail,
      isNotFound: false,
      isConflict: true,
      isServerError: false
    };
  }

  // Handle 500 - Server Error
  if (status >= 500) {
    message = detail?.message || detail || error?.message || 'Server error occurred';
    return {
      status,
      message,
      detail,
      isNotFound: false,
      isConflict: false,
      isServerError: true
    };
  }

  // Handle 422 - Validation Error
  if (status === 422) {
    if (Array.isArray(detail)) {
      // FastAPI validation errors are arrays
      const validationMsgs = detail.map((err: any) => 
        `${err.loc?.join('.') || 'field'}: ${err.msg}`
      ).join(', ');
      message = `Validation error: ${validationMsgs}`;
    } else {
      message = detail?.message || detail || 'Validation error';
    }
    
    return {
      status,
      message,
      detail,
      isNotFound: false,
      isConflict: false,
      isServerError: false
    };
  }

  // Generic error handling
  message = 
    detail?.message || 
    detail || 
    error?.message || 
    error?.statusText || 
    `Request failed with status ${status}`;

  return {
    status,
    message,
    detail,
    isNotFound: false,
    isConflict: false,
    isServerError: status >= 500
  };
}

/**
 * Check if an error is a 404 Not Found error
 */
export function isNotFoundError(error: any): boolean {
  return error?.status === 404;
}

/**
 * Check if an error is a 409 Conflict error (resource in use)
 */
export function isConflictError(error: any): boolean {
  return error?.status === 409;
}

/**
 * Check if an error is a server error (5xx)
 */
export function isServerError(error: any): boolean {
  const status = error?.status || 0;
  return status >= 500 && status < 600;
}

/**
 * Get a user-friendly error message from any error
 */
export function getErrorMessage(error: any): string {
  return extractApiError(error).message;
}
