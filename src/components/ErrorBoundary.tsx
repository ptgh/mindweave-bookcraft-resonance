
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      hasError: true,
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-red-500/30 bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-slate-200 text-xl font-medium mb-2">Neural Pathway Disrupted</h1>
            <p className="text-slate-400 text-sm mb-6">
              A quantum fluctuation has disrupted the consciousness matrix. The system is attempting to reestablish connection.
            </p>
            <button
              onClick={this.handleReset}
              className="bg-transparent border border-[rgba(255,255,255,0.15)] text-[#cdd6f4] text-xs font-medium py-1.5 px-3 rounded-lg transition-all duration-200 hover:border-[#89b4fa] hover:text-[#89b4fa] hover:shadow-[0_0_10px_rgba(137,180,250,0.3)] flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Restore Connection</span>
            </button>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-slate-400 text-xs cursor-pointer hover:text-slate-300">
                  Debug Information
                </summary>
                <pre className="mt-2 text-xs text-red-400 bg-slate-800/50 p-3 rounded border border-slate-700 overflow-auto max-h-32">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
