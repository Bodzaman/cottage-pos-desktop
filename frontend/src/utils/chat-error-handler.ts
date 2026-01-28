/**
 * Chat Error Handler (Issue 6)
 *
 * Classifies errors into user-friendly categories with appropriate messages
 * instead of showing generic "Sorry, I encountered an error" for everything.
 */

export type ChatErrorType = 'network' | 'rate_limit' | 'timeout' | 'server_error' | 'parse_error' | 'unknown';

interface ClassifiedError {
  type: ChatErrorType;
  message: string;
  canRetry: boolean;
}

/**
 * Classify an error into a user-friendly message based on the error details.
 */
export function classifyChatError(error: any): ClassifiedError {
  const errorMessage = error?.message || String(error);

  // Network errors (offline, DNS, CORS, etc.)
  if (
    error instanceof TypeError && errorMessage.includes('fetch') ||
    errorMessage.includes('NetworkError') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('ERR_INTERNET_DISCONNECTED') ||
    errorMessage.includes('ERR_NETWORK') ||
    !navigator.onLine
  ) {
    return {
      type: 'network',
      message: 'Connection lost. Please check your internet and try again.',
      canRetry: true,
    };
  }

  // Rate limiting (429)
  if (errorMessage.includes('HTTP 429') || errorMessage.includes('rate limit') || errorMessage.includes('Too Many Requests')) {
    return {
      type: 'rate_limit',
      message: 'Our AI is busy right now. Please wait a moment and try again.',
      canRetry: true,
    };
  }

  // Timeout errors
  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('ETIMEDOUT') ||
    errorMessage.includes('HTTP 408') ||
    errorMessage.includes('HTTP 504')
  ) {
    return {
      type: 'timeout',
      message: 'The request took too long. Please try again.',
      canRetry: true,
    };
  }

  // Server errors (500, 502, 503)
  if (
    errorMessage.includes('HTTP 500') ||
    errorMessage.includes('HTTP 502') ||
    errorMessage.includes('HTTP 503') ||
    errorMessage.includes('Internal Server Error') ||
    errorMessage.includes('Bad Gateway') ||
    errorMessage.includes('Service Unavailable')
  ) {
    return {
      type: 'server_error',
      message: 'Something went wrong on our end. Please try again in a moment.',
      canRetry: true,
    };
  }

  // Parse errors (malformed responses)
  if (
    errorMessage.includes('JSON') ||
    errorMessage.includes('parse') ||
    errorMessage.includes('Unexpected token') ||
    errorMessage.includes('No response body')
  ) {
    return {
      type: 'parse_error',
      message: "I didn't quite understand that response. Please try again.",
      canRetry: true,
    };
  }

  // Unknown/generic errors
  return {
    type: 'unknown',
    message: 'Sorry, something went wrong. Please try again.',
    canRetry: true,
  };
}
