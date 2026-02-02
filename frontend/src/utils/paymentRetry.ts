/**
 * Payment Retry Utility
 *
 * Provides exponential backoff retry logic for payment operations.
 * Distinguishes between retryable and non-retryable errors.
 */

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

/**
 * Stripe error codes that are safe to retry
 * See: https://stripe.com/docs/error-codes
 */
const RETRYABLE_ERROR_CODES = new Set([
  'rate_limit',                    // Too many requests
  'api_connection_error',          // Network error
  'api_error',                     // Temporary Stripe error
  'lock_timeout',                  // Concurrency issue
  'idempotency_key_in_use',       // Concurrent request with same key
  'resource_missing',             // Sometimes transient
]);

/**
 * Stripe error codes that should NOT be retried
 */
const NON_RETRYABLE_ERROR_CODES = new Set([
  'card_declined',                // Card was declined
  'expired_card',                 // Card expired
  'incorrect_cvc',                // Wrong CVC
  'incorrect_number',             // Invalid card number
  'invalid_cvc',                  // Invalid CVC format
  'invalid_expiry_month',         // Invalid expiry
  'invalid_expiry_year',          // Invalid expiry
  'invalid_number',               // Invalid card number format
  'authentication_required',      // 3DS required - needs user action
  'payment_intent_unexpected_state', // Payment already processed/failed
]);

/**
 * HTTP status codes that indicate a retryable error
 */
const RETRYABLE_HTTP_CODES = new Set([
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
]);

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,      // 1 second
  maxDelayMs: 30000,      // 30 seconds
  backoffFactor: 2,       // Double delay each retry
};

export interface PaymentError {
  code?: string;
  type?: string;
  message: string;
  httpStatus?: number;
  isRetryable: boolean;
  declineCode?: string;
}

// ============================================================================
// ERROR ANALYSIS
// ============================================================================

/**
 * Analyzes a Stripe error to determine if it's retryable
 */
export function classifyPaymentError(error: any): PaymentError {
  const code = error?.code || error?.error?.code;
  const type = error?.type || error?.error?.type;
  const message = error?.message || error?.error?.message || 'Unknown payment error';
  const httpStatus = error?.statusCode || error?.status;
  const declineCode = error?.decline_code || error?.error?.decline_code;

  // Check explicit non-retryable codes first
  if (code && NON_RETRYABLE_ERROR_CODES.has(code)) {
    return {
      code,
      type,
      message,
      httpStatus,
      isRetryable: false,
      declineCode,
    };
  }

  // Check for retryable error codes
  if (code && RETRYABLE_ERROR_CODES.has(code)) {
    return {
      code,
      type,
      message,
      httpStatus,
      isRetryable: true,
      declineCode,
    };
  }

  // Check HTTP status codes
  if (httpStatus && RETRYABLE_HTTP_CODES.has(httpStatus)) {
    return {
      code,
      type,
      message,
      httpStatus,
      isRetryable: true,
      declineCode,
    };
  }

  // Network errors are usually retryable
  if (error instanceof TypeError || type === 'api_connection_error') {
    return {
      code: 'network_error',
      type: 'api_connection_error',
      message: 'Network connection error',
      isRetryable: true,
    };
  }

  // Default: non-retryable
  return {
    code,
    type,
    message,
    httpStatus,
    isRetryable: false,
    declineCode,
  };
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

/**
 * Calculates delay for exponential backoff with jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(config.backoffFactor, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // Add up to 30% jitter
  return Math.min(exponentialDelay + jitter, config.maxDelayMs);
}

/**
 * Sleeps for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: PaymentError;
  attempts: number;
  totalDurationMs: number;
}

/**
 * Executes a payment operation with retry logic
 *
 * @param operation - The async operation to execute
 * @param config - Retry configuration
 * @returns Result with success/error info and retry statistics
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<RetryResult<T>> {
  const startTime = Date.now();
  let lastError: PaymentError | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Execute the operation
      const result = await operation();
      return {
        success: true,
        data: result,
        attempts: attempt + 1,
        totalDurationMs: Date.now() - startTime,
      };
    } catch (error: any) {
      // Classify the error
      lastError = classifyPaymentError(error);

      console.warn(
        `[PaymentRetry] Attempt ${attempt + 1}/${config.maxRetries + 1} failed:`,
        lastError
      );

      // Don't retry non-retryable errors
      if (!lastError.isRetryable) {
        console.warn('[PaymentRetry] Error is not retryable, giving up');
        break;
      }

      // Don't retry if we've exhausted all attempts
      if (attempt >= config.maxRetries) {
        console.warn('[PaymentRetry] Max retries exceeded, giving up');
        break;
      }

      // Calculate delay and wait before retrying
      const delayMs = calculateDelay(attempt, config);
      console.log(`[PaymentRetry] Waiting ${delayMs}ms before retry...`);
      await sleep(delayMs);
    }
  }

  // All retries failed
  return {
    success: false,
    error: lastError,
    attempts: config.maxRetries + 1,
    totalDurationMs: Date.now() - startTime,
  };
}

// ============================================================================
// PAYMENT-SPECIFIC HELPERS
// ============================================================================

/**
 * Confirms a payment with automatic retry for transient errors
 */
export async function confirmPaymentWithRetry(
  stripe: any,
  elements: any,
  confirmParams: any,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<RetryResult<{ paymentIntent: any }>> {
  return executeWithRetry(
    async () => {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams,
        redirect: 'if_required',
      });

      if (error) {
        throw error;
      }

      if (!paymentIntent) {
        throw new Error('Payment confirmation returned no payment intent');
      }

      return { paymentIntent };
    },
    config
  );
}

/**
 * Creates a payment intent with automatic retry
 */
export async function createPaymentIntentWithRetry(
  createFn: () => Promise<{ clientSecret: string }>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<RetryResult<{ clientSecret: string }>> {
  return executeWithRetry(createFn, config);
}

/**
 * Confirms a payment with the backend with automatic retry
 */
export async function confirmPaymentWithBackendRetry(
  confirmFn: () => Promise<{ success: boolean; message?: string }>,
  config: RetryConfig = { ...DEFAULT_RETRY_CONFIG, maxRetries: 2 }
): Promise<RetryResult<{ success: boolean; message?: string }>> {
  return executeWithRetry(
    async () => {
      const result = await confirmFn();
      if (!result.success) {
        // Throw to trigger retry for backend failures
        const error: any = new Error(result.message || 'Backend confirmation failed');
        error.code = 'backend_confirmation_failed';
        error.isRetryable = true;
        throw error;
      }
      return result;
    },
    config
  );
}

// ============================================================================
// USER-FRIENDLY ERROR MESSAGES
// ============================================================================

/**
 * Returns a user-friendly error message for payment errors
 */
export function getPaymentErrorMessage(error: PaymentError): string {
  // Card-specific messages
  if (error.declineCode) {
    switch (error.declineCode) {
      case 'insufficient_funds':
        return 'Your card has insufficient funds. Please try a different payment method.';
      case 'lost_card':
      case 'stolen_card':
        return 'This card cannot be used. Please try a different card.';
      case 'do_not_honor':
        return 'Your bank declined this transaction. Please contact your bank or try a different card.';
      default:
        return 'Your card was declined. Please try a different payment method.';
    }
  }

  // Error code specific messages
  switch (error.code) {
    case 'card_declined':
      return 'Your card was declined. Please check your card details or try a different card.';
    case 'expired_card':
      return 'Your card has expired. Please use a different card.';
    case 'incorrect_cvc':
      return 'The security code (CVC) is incorrect. Please check and try again.';
    case 'incorrect_number':
    case 'invalid_number':
      return 'The card number is invalid. Please check and try again.';
    case 'network_error':
      return 'Network connection error. Please check your internet and try again.';
    case 'rate_limit':
      return 'Too many requests. Please wait a moment and try again.';
    case 'authentication_required':
      return 'Additional authentication required. Please complete the verification.';
    default:
      return error.message || 'Payment failed. Please try again.';
  }
}
