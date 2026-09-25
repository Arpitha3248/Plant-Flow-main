import React from 'react';

interface State { hasError: boolean; error: string }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error?.message ?? String(error) };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', background: '#fee2e2', color: '#991b1b', height: '100%' }}>
          <h2 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>⚠ App Error (check console for full stack)</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{this.state.error}</pre>
          <button
            onClick={() => { this.setState({ hasError: false, error: '' }); window.location.href = '/login'; }}
            style={{ marginTop: 16, padding: '8px 16px', background: '#991b1b', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Back to Login
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
