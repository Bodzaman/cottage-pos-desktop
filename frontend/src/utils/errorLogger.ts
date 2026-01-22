/**
 * Error Logger Utility
 * 
 * Logs errors to backend analytics and console for monitoring
 * Provides structured error reporting with context
 */

import brain from 'brain';

export interface ErrorLogContext {
  page?: string;
  component?: string;
  action?: string;
  userId?: string;
  userEmail?: string;
  cartItemsCount?: number;
  isAuthenticated?: boolean;
  timestamp?: string;
  userAgent?: string;
  url?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorLogEntry {
  message: string;
  stack?: string;
  componentStack?: string;
  context: ErrorLogContext;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Log error to console and backend
 * 
 * @param error - Error object
 * @param errorInfo - Additional React error info
 * @param context - Contextual information
 */
export async function logError(
  error: Error,
  errorInfo?: { componentStack?: string },
  context: ErrorLogContext = {}
): Promise<void> {
  const errorEntry: ErrorLogEntry = {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack,
    context: {
      ...context,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    },
    severity: 'error',
  };

  // Always log to console in development
  if (import.meta.env.DEV) {
    console.error('Original error:', error);
    if (errorInfo?.componentStack) {
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  // TODO: Send to backend analytics endpoint
  // For now, we'll just log to console
  // In production, you could send to Sentry, LogRocket, or custom endpoint
  try {
    // Example: await brain.log_frontend_error({ error: errorEntry });
  } catch (logError) {
    // Don't let logging errors crash the app
    console.error('Failed to log error to backend:', logError);
  }
}

/**
 * Log warning to console and backend
 * 
 * @param message - Warning message
 * @param context - Contextual information
 */
export async function logWarning(
  message: string,
  context: ErrorLogContext = {}
): Promise<void> {
  const warningEntry: ErrorLogEntry = {
    message,
    context: {
      ...context,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    },
    severity: 'warning',
  };


  try {
    // TODO: Send to backend if needed
  } catch (error) {
    console.error('Failed to log warning to backend:', error);
  }
}

/**
 * Create error context from cart store
 * Helper to extract relevant cart information for error logging
 */
export function createCartErrorContext(
  cartItemsCount: number,
  userId?: string,
  userEmail?: string
): ErrorLogContext {
  return {
    page: 'OnlineOrders',
    cartItemsCount,
    userId,
    userEmail,
    isAuthenticated: !!userId,
  };
}
