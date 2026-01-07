import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cardStyle } from "../utils/designSystem";
import { mode, Mode } from "../utils/environment";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  /** Optional callback when retry is triggered */
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
  isRetrying: boolean;
}

// Max retry attempts before requiring manual intervention
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Error Boundary Component
 * Catches errors in child components and displays a friendly fallback UI
 * with exponential backoff retry mechanism
 */
class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      retryCount: 0,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // In development, show more detailed error info
    if (mode === Mode.DEV) {
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  componentWillUnmount() {
    // Clean up any pending retry timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  /**
   * Calculate exponential backoff delay
   * Retry 1: 1s, Retry 2: 2s, Retry 3: 4s
   */
  private getRetryDelay(attemptNumber: number): number {
    return Math.min(1000 * Math.pow(2, attemptNumber - 1), 8000);
  }

  /**
   * Handle retry with exponential backoff
   */
  private handleRetry = () => {
    const { retryCount } = this.state;
    const { onRetry } = this.props;

    // If we've exceeded max retries, require manual refresh
    if (retryCount >= MAX_RETRY_ATTEMPTS) {
      window.location.reload();
      return;
    }

    this.setState({ isRetrying: true });

    const delay = this.getRetryDelay(retryCount + 1);

    // Optional callback for parent component
    if (onRetry) {
      onRetry();
    }

    this.retryTimeoutId = setTimeout(() => {
      this.setState({ 
        hasError: false, 
        error: null, 
        retryCount: retryCount + 1,
        isRetrying: false
      });
    }, delay);
  };

  /**
   * Manual reset (for testing or manual intervention)
   */
  private handleManualReset = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
    this.setState({ 
      hasError: false, 
      error: null, 
      retryCount: 0,
      isRetrying: false
    });
  };

  render() {
    const { hasError, error, retryCount, isRetrying } = this.state;
    const { fallbackMessage } = this.props;

    if (hasError) {
      const isDev = mode === Mode.DEV;
      const canAutoRetry = retryCount < MAX_RETRY_ATTEMPTS;

      return (
        <Card style={cardStyle} className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-purple-300">
              {fallbackMessage || 'This section encountered an error. Other parts of the admin panel should still work.'}
            </p>

            {/* Retry count indicator */}
            {retryCount > 0 && (
              <p className="text-sm text-purple-400">
                Retry attempts: {retryCount} / {MAX_RETRY_ATTEMPTS}
              </p>
            )}

            {/* Error details - only shown in dev mode */}
            {isDev && error && (
              <details className="text-sm text-gray-400">
                <summary className="cursor-pointer hover:text-purple-300 font-medium">Error details (dev mode only)</summary>
                <pre className="mt-2 p-3 bg-black/60 rounded text-xs overflow-auto border border-red-900/30">
                  {error.toString()}
                  {error.stack && `\n\n${error.stack}`}
                </pre>
              </details>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              {canAutoRetry ? (
                <Button
                  onClick={this.handleRetry}
                  disabled={isRetrying}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  aria-label={isRetrying ? "Retrying..." : "Try again"}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                  {isRetrying ? 'Retrying...' : 'Try Again'}
                </Button>
              ) : (
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-red-600 hover:bg-red-700"
                  aria-label="Reload page"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
              )}

              {/* Manual reset for testing */}
              {isDev && (
                <Button
                  onClick={this.handleManualReset}
                  variant="outline"
                  className="border-purple-600 text-purple-300 hover:bg-purple-600 hover:text-white"
                  aria-label="Manual reset (dev only)"
                >
                  Manual Reset
                </Button>
              )}
            </div>

            {/* Help text */}
            {!canAutoRetry && (
              <p className="text-xs text-gray-500">
                Maximum retry attempts reached. Reloading the page will reset the error boundary.
              </p>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
