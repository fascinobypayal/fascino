import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-background">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="font-serif text-2xl mb-3">Something went wrong</h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-8">
            An unexpected error occurred. Please return to the home page and try again.
          </p>
          <button
            onClick={this.handleReload}
            className="bg-accent text-accent-foreground px-6 py-3 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors shadow-sm uppercase tracking-wider"
          >
            Return to Home
          </button>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-8 text-[10px] text-left text-muted-foreground bg-muted/40 p-4 rounded max-w-xl overflow-auto">
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
