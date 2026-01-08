import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, AlertCircle } from 'lucide-react';
import { globalColors } from '../utils/QSAIDesign';
import { mode, Mode } from '../utils/environment';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  recoveryAttempts: number;
}

/**
 * Error Boundary specifically for MenuItemForm
 * Catches React errors, provides recovery options, and preserves form data
 */
export class MenuItemFormErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempts: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Enhanced logging with context
    console.group('🚨 MenuItemForm Error Caught by Error Boundary');
    console.error('Error:', error);
    console.error('Error Message:', error.message);
    console.error('Stack Trace:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Recovery Attempts:', this.state.recoveryAttempts + 1);
    console.error('Timestamp:', new Date().toISOString());
    console.groupEnd();

    // Update state with error info
    this.setState(prevState => ({
      errorInfo,
      recoveryAttempts: prevState.recoveryAttempts + 1,
    }));

    // Preserve crash data in sessionStorage for debugging
    try {
      const preservationKey = 'menuItemForm_crash_recovery';
      const crashData = {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        componentStack: errorInfo.componentStack,
        recoveryAttempts: this.state.recoveryAttempts + 1,
      };
      sessionStorage.setItem(preservationKey, JSON.stringify(crashData));
      console.log('✅ Crash data preserved in sessionStorage');
    } catch (e) {
      console.warn('❌ Failed to preserve crash data:', e);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  handleClearAndReset = () => {
    // Clear all form-related storage
    try {
      const keysToRemove = Object.keys(sessionStorage).filter(
        (key) => key.startsWith('menuItemForm_')
      );
      keysToRemove.forEach((key) => sessionStorage.removeItem(key));

      const localKeysToRemove = Object.keys(localStorage).filter(
        (key) => key.startsWith('menuItemForm_')
      );
      localKeysToRemove.forEach((key) => localStorage.removeItem(key));

      console.log('🧹 Cleared all form storage data');
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }

    this.handleReset();
  };

  /**
   * Analyzes error and provides actionable guidance
   */
  getErrorGuidance(): string[] {
    const errorMsg = this.state.error?.message?.toLowerCase() || '';

    // Network/API errors
    if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('failed to fetch')) {
      return [
        '📡 Check your internet connection',
        '🔄 Try refreshing the page',
        '💾 Your form data has been auto-saved and can be recovered',
      ];
    }

    // Data validation errors
    if (errorMsg.includes('undefined') || errorMsg.includes('null') || errorMsg.includes('cannot read')) {
      return [
        '⚠️ This appears to be a data validation issue',
        '🔄 Click "Reset Form" to reload with clean state',
        '🧹 If problem persists, click "Clear & Reset"',
      ];
    }

    // Render/component errors
    if (errorMsg.includes('render') || errorMsg.includes('component') || errorMsg.includes('hook')) {
      return [
        '🧩 A component failed to render properly',
        '🧹 Click "Clear & Reset" to start fresh',
        '📝 Your autosaved draft may help recover your work',
      ];
    }

    // Generic guidance
    return [
      '❌ An unexpected error occurred in the form',
      '🔄 Click "Reset Form" to attempt recovery',
      '💾 Your form data has been preserved',
    ];
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, recoveryAttempts } = this.state;
      const isDev = mode === Mode.DEV;
      const guidance = this.getErrorGuidance();

      return (
        <div className="max-w-4xl mx-auto p-6">
          <Card 
            className="border-red-500/20"
            style={{ backgroundColor: globalColors.background.primary }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-red-500">
                <AlertCircle className="h-6 w-6" />
                Form Error Detected
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error Message */}
              <Alert className="border-red-500/20 bg-red-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-red-400 font-semibold mb-2">
                  Error Details
                </AlertTitle>
                <AlertDescription className="text-red-300">
                  <strong>Message:</strong> {error?.message || 'An unexpected error occurred'}
                </AlertDescription>
              </Alert>

              {/* Actionable Guidance */}
              <div className="space-y-3">
                <p className="font-semibold" style={{ color: globalColors.text.primary }}>
                  What you can do:
                </p>
                <ul className="space-y-2">
                  {guidance.map((tip, index) => (
                    <li key={index} className="text-sm flex items-start gap-2" style={{ color: globalColors.text.secondary }}>
                      <span className="mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Multiple Recovery Attempts Warning */}
              {recoveryAttempts > 2 && (
                <Alert className="border-yellow-500/20 bg-yellow-500/10">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertTitle className="text-yellow-500 font-semibold mb-2">
                    ⚠️ Multiple Recovery Attempts Detected ({recoveryAttempts})
                  </AlertTitle>
                  <AlertDescription className="text-yellow-400 text-sm">
                    If this error persists after multiple attempts, try refreshing the entire page (F5) or contact support.
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={this.handleReset}
                  style={{
                    backgroundColor: globalColors.purple.primary,
                    color: globalColors.text.primary,
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Form
                </Button>
                <Button
                  onClick={this.handleClearAndReset}
                  variant="outline"
                  style={{
                    borderColor: globalColors.text.disabled,
                    color: globalColors.text.secondary,
                  }}
                >
                  Clear & Reset
                </Button>
                <Button
                  onClick={() => window.location.href = '/admin'}
                  variant="ghost"
                  className="ml-auto"
                  style={{ color: globalColors.text.muted }}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Return to Admin
                </Button>
              </div>

              {/* Developer Details */}
              {isDev && errorInfo && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium hover:text-purple-400 transition-colors" style={{ color: globalColors.text.secondary }}>
                    🔧 Technical Details (Development Only)
                  </summary>
                  <div className="mt-3 space-y-2">
                    <pre className="p-4 rounded bg-gray-900 text-xs overflow-auto max-h-64" style={{ color: globalColors.text.muted }}>
                      <strong>Error Stack:</strong>\n{error?.stack}
                    </pre>
                    <pre className="p-4 rounded bg-gray-900 text-xs overflow-auto max-h-64" style={{ color: globalColors.text.muted }}>
                      <strong>Component Stack:</strong>\n{errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
