// src/components/ErrorBoundary.tsx
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to console for now; future: integrate Sentry or remote logger.
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleClearAndRetry = (): void => {
    try {
      // Clear transient state that may be poisoning the app.
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch {
      // Storage may be unavailable; ignore.
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isDev = import.meta.env.DEV;

    return (
      <div className="error-boundary-container">
        <div className="error-boundary-card">
          <h1 className="error-boundary-title">خطایی رخ داده است</h1>
          <p className="error-boundary-subtitle">
            مشکلی غیرمنتظره در برنامه به وجود آمده است. می‌توانید صفحه را
            بارگذاری مجدد کنید یا وضعیت را پاک کرده و دوباره تلاش کنید.
          </p>

          {isDev && this.state.error && (
            <details className="error-boundary-details">
              <summary>جزئیات خطا (فقط در حالت توسعه)</summary>
              <pre className="error-boundary-stack">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack ?? ''}
              </pre>
            </details>
          )}

          <div className="error-boundary-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={this.handleReload}
            >
              بارگذاری مجدد
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={this.handleClearAndRetry}
            >
              پاک کردن و تلاش مجدد
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;