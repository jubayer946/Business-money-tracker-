
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  // Children and fallback are optional to provide flexibility in usage
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary catches errors in its child component tree.
 */
// Fix: Extending React.Component explicitly ensures that inherited members like setState and props are correctly recognized by TypeScript.
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { 
    hasError: false, 
    error: null, 
    errorInfo: null 
  };

  /**
   * Static method to update state when an error occurs during rendering.
   */
  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  /**
   * Log error information and update state with component stack details.
   */
  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Fix: Accessing setState inherited from React.Component base class.
    this.setState({ errorInfo });
  }

  /**
   * Reset the error state, allowing the user to attempt a reload.
   */
  private handleRetry = () => {
    // Fix: Accessing setState inherited from React.Component base class to clear error state.
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    // Fix: Accessing state and props inherited from React.Component base class for rendering logic.
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    // Check if an error has been caught and render fallback if necessary.
    if (hasError) {
      // Check for a custom fallback UI provided via props.
      if (fallback) {
        return fallback as React.ReactElement;
      }
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-500">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 max-w-md w-full text-center shadow-xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
              Something went wrong
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              We encountered an unexpected error. Please try again or contact support if the problem persists.
            </p>
            {error && (
              <details className="mb-6 text-left group">
                <summary className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 cursor-pointer list-none flex items-center justify-center gap-1 group-open:mb-2">
                  <span className="group-open:rotate-180 transition-transform">▼</span> Error Details
                </summary>
                <pre className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-[10px] overflow-auto max-h-40 text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-700 font-mono">
                  {error.toString()}
                  {errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <button 
              onClick={this.handleRetry} 
              className="w-full bg-indigo-600 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              <RefreshCw size={18} />
              <span className="uppercase tracking-widest text-xs">Reload App</span>
            </button>
          </div>
        </div>
      );
    }
    // Return children from props when no error is caught.
    return (children as React.ReactNode) || null;
  }
}
