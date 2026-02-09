import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--cream, #faf8f3)',
            padding: '2rem',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              textAlign: 'center',
              background: 'var(--paper-white, #fff)',
              border: '2px solid var(--border, #d4c5a9)',
              padding: '3rem 2rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          >
            <h1
              style={{
                fontFamily: "'Libre Baskerville', serif",
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--ink, #1a1a1a)',
                marginBottom: '0.75rem',
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                color: 'var(--newsprint, #2a2a2a)',
                fontSize: '0.9375rem',
                marginBottom: '1.5rem',
                lineHeight: 1.6,
              }}
            >
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'var(--ink, #1a1a1a)',
                color: 'var(--paper-white, #fff)',
                border: 'none',
                padding: '0.75rem 2rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                letterSpacing: '0.03em',
                textTransform: 'uppercase' as const,
                cursor: 'pointer',
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
