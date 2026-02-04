/**
 * Error Logger Utility
 *
 * Logs errors to Sentry, backend analytics, and console for monitoring
 * Provides structured error reporting with context
 */

import * as Sentry from '@sentry/react';
import brain from 'brain';

// ============================================================================
// SENTRY INITIALIZATION
// ============================================================================

let sentryInitialized = false;

/**
 * Initialize Sentry for error tracking
 * Should be called once at app startup
 */
export function initializeSentry(): void {
  if (sentryInitialized) return;

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    console.warn('[ErrorLogger] VITE_SENTRY_DSN not set, Sentry disabled');
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE || 'development',
      release: import.meta.env.VITE_APP_VERSION || 'unknown',

      // Only capture errors in production
      enabled: import.meta.env.PROD,

      // Sample rate for error events (1.0 = 100%)
      sampleRate: 1.0,

      // Sample rate for performance monitoring (0.1 = 10%)
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

      // Don't capture console.log as breadcrumbs in production
      integrations: [
        Sentry.breadcrumbsIntegration({
          console: import.meta.env.DEV,
        }),
      ],

      // Filter out known non-actionable errors
      beforeSend(event, hint) {
        const error = hint.originalException;

        // Filter ResizeObserver errors (browser quirk)
        if (error instanceof Error && error.message.includes('ResizeObserver')) {
          return null;
        }

        // Filter cancelled request errors
        if (error instanceof Error && error.message.includes('AbortError')) {
          return null;
        }

        return event;
      },
    });

    sentryInitialized = true;
    console.log('[ErrorLogger] Sentry initialized');
  } catch (err) {
    console.error('[ErrorLogger] Failed to initialize Sentry:', err);
  }
}

// ============================================================================
// TYPES
// ============================================================================

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
  orderId?: string;
  orderType?: string;
  paymentStatus?: string;
  tableNumber?: number;
  additionalData?: Record<string, any>;
}

export interface ErrorLogEntry {
  message: string;
  stack?: string;
  componentStack?: string;
  context: ErrorLogContext;
  severity: 'error' | 'warning' | 'info';
}

// ============================================================================
// ERROR LOGGING
// ============================================================================

/**
 * Log error to Sentry, console, and backend
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
    console.error('[ErrorLogger] Error:', error);
    if (errorInfo?.componentStack) {
      console.error('[ErrorLogger] Component stack:', errorInfo.componentStack);
    }
    console.error('[ErrorLogger] Context:', context);
  }

  // Send to Sentry
  try {
    Sentry.withScope((scope) => {
      // Add context as tags for filtering
      if (context.page) scope.setTag('page', context.page);
      if (context.component) scope.setTag('component', context.component);
      if (context.action) scope.setTag('action', context.action);
      if (context.orderType) scope.setTag('orderType', context.orderType);

      // Add user context
      if (context.userId || context.userEmail) {
        scope.setUser({
          id: context.userId,
          email: context.userEmail,
        });
      }

      // Add extra context data
      scope.setExtras({
        ...context.additionalData,
        cartItemsCount: context.cartItemsCount,
        isAuthenticated: context.isAuthenticated,
        orderId: context.orderId,
        paymentStatus: context.paymentStatus,
        tableNumber: context.tableNumber,
      });

      // Add component stack if available
      if (errorInfo?.componentStack) {
        scope.setExtra('componentStack', errorInfo.componentStack);
      }

      Sentry.captureException(error);
    });
  } catch (sentryError) {
    console.error('[ErrorLogger] Failed to send to Sentry:', sentryError);
  }

  // Also send to backend for internal analytics
  try {
    await brain.log_frontend_error({ error: errorEntry });
  } catch (backendError) {
    // Don't let logging errors crash the app
    if (import.meta.env.DEV) {
      console.warn('[ErrorLogger] Failed to log to backend:', backendError);
    }
  }
}

/**
 * Log warning to Sentry and console
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

  if (import.meta.env.DEV) {
    console.warn('[ErrorLogger] Warning:', message, context);
  }

  // Send to Sentry as message (not exception)
  try {
    Sentry.withScope((scope) => {
      scope.setLevel('warning');
      if (context.page) scope.setTag('page', context.page);
      if (context.component) scope.setTag('component', context.component);
      scope.setExtras(context as Record<string, unknown>);
      Sentry.captureMessage(message);
    });
  } catch (error) {
    console.error('[ErrorLogger] Failed to send warning to Sentry:', error);
  }
}

// ============================================================================
// SPECIALIZED ERROR LOGGING
// ============================================================================

/**
 * Log a payment-related error with payment-specific context
 */
export async function logPaymentError(
  error: Error,
  paymentContext: {
    orderId?: string;
    orderType?: string;
    paymentMethod?: string;
    amount?: number;
    errorCode?: string;
    isRetryable?: boolean;
  }
): Promise<void> {
  await logError(error, undefined, {
    action: 'payment_processing',
    orderId: paymentContext.orderId,
    orderType: paymentContext.orderType,
    additionalData: {
      paymentMethod: paymentContext.paymentMethod,
      amount: paymentContext.amount,
      errorCode: paymentContext.errorCode,
      isRetryable: paymentContext.isRetryable,
    },
  });
}

/**
 * Log an order processing error with order-specific context
 */
export async function logOrderError(
  error: Error,
  orderContext: {
    orderId?: string;
    orderType?: string;
    tableNumber?: number;
    itemCount?: number;
    step?: string;
  }
): Promise<void> {
  await logError(error, undefined, {
    action: 'order_processing',
    orderId: orderContext.orderId,
    orderType: orderContext.orderType,
    tableNumber: orderContext.tableNumber,
    additionalData: {
      itemCount: orderContext.itemCount,
      step: orderContext.step,
    },
  });
}

/**
 * Log a print job error with print-specific context
 */
export async function logPrintError(
  error: Error,
  printContext: {
    orderId?: string;
    printJobId?: string;
    printerType?: string;
    templateType?: string;
  }
): Promise<void> {
  await logError(error, undefined, {
    action: 'print_job',
    orderId: printContext.orderId,
    additionalData: {
      printJobId: printContext.printJobId,
      printerType: printContext.printerType,
      templateType: printContext.templateType,
    },
  });
}

/**
 * Log a table status sync error
 */
export async function logTableSyncError(
  error: Error,
  tableContext: {
    tableNumber?: number;
    expectedStatus?: string;
    actualStatus?: string;
  }
): Promise<void> {
  await logError(error, undefined, {
    action: 'table_status_sync',
    tableNumber: tableContext.tableNumber,
    additionalData: {
      expectedStatus: tableContext.expectedStatus,
      actualStatus: tableContext.actualStatus,
    },
  });
}

// ============================================================================
// BREADCRUMBS
// ============================================================================

/**
 * Add a breadcrumb for debugging
 * Breadcrumbs are shown in Sentry error reports to trace user actions
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, any>,
  level: Sentry.SeverityLevel = 'info'
): void {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Add user context for error tracking
 */
export function setUserContext(
  userId?: string,
  userEmail?: string,
  additionalData?: Record<string, any>
): void {
  if (userId || userEmail) {
    Sentry.setUser({
      id: userId,
      email: userEmail,
      ...additionalData,
    });
  } else {
    Sentry.setUser(null);
  }
}

// ============================================================================
// CONTEXT HELPERS
// ============================================================================

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

/**
 * Create error context for POS operations
 */
export function createPOSErrorContext(
  action: string,
  tableNumber?: number,
  orderType?: string,
  staffId?: string
): ErrorLogContext {
  return {
    page: 'POSDesktop',
    action,
    tableNumber,
    orderType,
    userId: staffId,
    isAuthenticated: !!staffId,
  };
}

/**
 * Create error context for checkout operations
 */
export function createCheckoutErrorContext(
  step: string,
  orderType: string,
  cartItemsCount: number,
  userId?: string
): ErrorLogContext {
  return {
    page: 'Checkout',
    action: step,
    orderType,
    cartItemsCount,
    userId,
    isAuthenticated: !!userId,
  };
}
