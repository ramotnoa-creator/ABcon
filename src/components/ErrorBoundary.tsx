import { Component, type ErrorInfo, type PropsWithChildren } from 'react';
import { log } from '../lib/logger';

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Root error boundary — catches React render crashes and shows a
 * Hebrew-language fallback instead of a white screen.
 */
export default class ErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    log('error', 'ui', `React render crash: ${error.message}`, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark p-4"
        >
          <div className="w-full max-w-md rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-gray-900 p-8 text-center shadow-lg">
            <span className="material-symbols-outlined text-red-500 text-[48px] mb-4 block">
              error
            </span>

            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              משהו השתבש
            </h1>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              אירעה שגיאה בלתי צפויה. ניתן לנסות שוב או לחזור לדף הבית.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <pre className="mb-6 max-h-32 overflow-auto rounded bg-red-50 dark:bg-red-950 p-3 text-xs text-red-700 dark:text-red-300 text-left ltr">
                {this.state.error.message}
              </pre>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
              >
                נסה שוב
              </button>

              <a
                href="/"
                className="rounded-lg border border-gray-300 dark:border-gray-700 px-6 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                חזור לדף הבית
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
