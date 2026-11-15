/**
 * ErrorBoundary - Class-based React Error Boundary.
 * Catches any render/lifecycle error in its child tree and renders a clean
 * recovery card instead of unmounting #root into a blank white screen.
 */
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            background: '#01091D',
            color: '#FFFFFF',
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ background: '#EF4444', color: '#FFFFFF', padding: '24px', borderRadius: '12px', marginBottom: '24px', maxWidth: '600px' }}>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '20px' }}>⚠️ Evaluation Dashboard Recovery</h2>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#FCA5A5' }}>
              A render error occurred while building the dashboard. This has been caught and contained.
            </p>
            {this.state.error && (
              <pre style={{ margin: 0, fontSize: '11px', color: '#FCA5A5', overflow: 'auto', maxHeight: '200px', textAlign: 'left' }}>
                {String(this.state.error?.message ?? '')}
              </pre>
            )}
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
            }}
            style={{
              background: '#00E5FF',
              color: '#01091D',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
