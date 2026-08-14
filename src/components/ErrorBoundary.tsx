import { Component, type ErrorInfo, type ReactNode } from 'react';
import { trackException } from '../lib/monitoring/appInsights';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    trackException(error, { componentStack: info.componentStack ?? '' });
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: 32,
            fontFamily: 'var(--font-sans, sans-serif)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Something went wrong</p>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
            Reload the page to continue. Your stories are safe.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1.5px solid #ccc',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
