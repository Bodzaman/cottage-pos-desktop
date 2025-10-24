/**
 * POSZoneErrorBoundary - Specialized error boundary for POSDesktop zones
 * Provides QSAI-themed fallback UI with recovery actions and error telemetry
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { QSAITheme } from '../utils/QSAIDesign';

interface Props {
  children: ReactNode;
  zoneName: string; // Name of the POS zone for logging (e.g., "Menu Selector", "Order Summary")
  onReset?: () => void; // Optional custom reset handler
  showHomeButton?: boolean; // Show button to return to home/safe state
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary for POS zones with production-grade error handling
 * - Catches runtime errors in specific zones without crashing entire POS
 * - Logs errors with zone context for debugging
 * - Provides recovery actions (Try Again, Reset Zone)
 * - QSAI-themed fallback UI matching POS design
 */
export class POSZoneErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { zoneName } = this.props;
    const isDev = import.meta.env?.DEV;
    
    // Store errorInfo in state for display
    this.setState({ errorInfo });
    
    // Enhanced error telemetry with zone context
    console.error(`❌ [POSZoneError: ${zoneName}] Runtime error caught:`, {
      zone: zoneName,
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
    
    // In production, you could send this to an error tracking service
    if (!isDev) {
      // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
      console.error('[Production Error]', { zoneName, error, errorInfo });
    }
  }

  handleReset = () => {
    const { onReset, zoneName } = this.props;
    const isDev = import.meta.env?.DEV;
    
    if (isDev) console.log(`🔄 [POSZoneError: ${zoneName}] Resetting zone...`);
    
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // Call custom reset handler if provided
    if (onReset) {
      onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { zoneName, showHomeButton } = this.props;
      const { error, errorInfo } = this.state;
      const isDev = import.meta.env?.DEV;

      return (
        <div
          className="flex flex-col items-center justify-center h-full p-6"
          style={{
            background: `linear-gradient(135deg, ${QSAITheme.background.secondary} 0%, ${QSAITheme.background.dark} 100%)`,
            borderRadius: '8px',
            border: `1px solid rgba(255, 0, 0, 0.2)`,
            boxShadow: '0 8px 20px -4px rgba(255, 0, 0, 0.3)'
          }}
        >
          {/* Error Icon */}
          <div
            className="mb-4 p-4 rounded-full"
            style={{
              background: 'rgba(255, 0, 0, 0.1)',
              border: '2px solid rgba(255, 0, 0, 0.3)'
            }}
          >
            <AlertTriangle size={48} style={{ color: '#EF4444' }} />
          </div>

          {/* Error Title */}
          <h3
            className="text-xl font-semibold mb-2"
            style={{ color: '#EF4444' }}
          >
            {zoneName} Error
          </h3>

          {/* Error Message */}
          <p
            className="text-center mb-4 max-w-md"
            style={{ color: QSAITheme.text.secondary }}
          >
            This section encountered an unexpected error. Other parts of the POS should still work.
          </p>

          {/* Error Details (Dev Mode Only) */}
          {isDev && error && (
            <details className="mb-4 max-w-2xl w-full">
              <summary
                className="cursor-pointer text-sm mb-2 hover:opacity-80"
                style={{ color: QSAITheme.purple.light }}
              >
                Error Details (Dev Mode)
              </summary>
              <div
                className="p-3 rounded text-xs overflow-auto max-h-40"
                style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#FCA5A5'
                }}
              >
                <div className="mb-2">
                  <strong>Error:</strong> {error.toString()}
                </div>
                {error.stack && (
                  <pre className="text-xs whitespace-pre-wrap">{error.stack}</pre>
                )}
                {errorInfo?.componentStack && (
                  <div className="mt-2">
                    <strong>Component Stack:</strong>
                    <pre className="text-xs whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Recovery Actions */}
          <div className="flex gap-3">
            <Button
              onClick={this.handleReset}
              className="flex items-center gap-2"
              style={{
                background: QSAITheme.purple.primary,
                color: 'white'
              }}
            >
              <RefreshCw size={16} />
              Try Again
            </Button>

            {showHomeButton && (
              <Button
                onClick={this.handleReload}
                variant="outline"
                className="flex items-center gap-2"
                style={{
                  borderColor: QSAITheme.purple.light,
                  color: QSAITheme.purple.light
                }}
              >
                <Home size={16} />
                Reload POS
              </Button>
            )}
          </div>

          {/* Help Text */}
          <p
            className="text-xs mt-4 text-center max-w-sm"
            style={{ color: QSAITheme.text.muted }}
          >
            If this error persists, try refreshing the page or contact support.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
