"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.props.fallback) {
      return this.props.fallback;
    }
    if (this.state.hasError) {
      return (
        <div className="min-h-[40vh] flex items-center justify-center p-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 max-w-md text-center">
            <div className="inline-flex w-12 h-12 rounded-full bg-red-100 text-negative items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" aria-hidden />
            </div>
            <h2 className="font-display text-lg font-semibold text-ink mb-2">
              Something went wrong
            </h2>
            <p className="text-mute text-sm mb-6">
              An unexpected error occurred. Refresh the page to try again.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-surface border border-border hover:border-mute text-ink text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              aria-label="Refresh page"
            >
              <RefreshCw className="w-4 h-4" aria-hidden />
              Refresh page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
