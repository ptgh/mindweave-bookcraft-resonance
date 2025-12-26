import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { captureReactErrorBoundary, copyLastRuntimeErrorToClipboard } from '@/utils/runtimeDiagnostics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    const errorId = captureReactErrorBoundary(error, errorInfo);

    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // Log to analytics/monitoring service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: true,
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  Something went wrong
                </h2>
                <p className="text-sm text-muted-foreground mb-2">
                  An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Error ID: <span className="font-mono">{this.state.errorId ?? 'unknown'}</span>
                </p>

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mb-4 text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Error details
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button onClick={this.handleReset} variant="default" size="sm">
                    Try again
                  </Button>
                  <Button
                    onClick={() => (window.location.href = '/')}
                    variant="outline"
                    size="sm"
                  >
                    Go home
                  </Button>
                  <Button
                    onClick={() => {
                      copyLastRuntimeErrorToClipboard().then((ok) => {
                        if (ok) console.info('[Leafnode] Copied runtime error report to clipboard');
                      });
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    Copy error report
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
