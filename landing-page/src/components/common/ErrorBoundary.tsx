/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  readonly children: ReactNode;
  readonly fallback?: ReactNode | ((props: { readonly error: Error; readonly reset: () => void }) => ReactNode);
  readonly onError?: (error: Error, errorInfo: ErrorInfo) => void;
  readonly onReset?: () => void;
}

interface State {
  readonly error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = { error: null };

  public constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    } else {
      console.error('ErrorBoundary caught an unhandled exception:', error, errorInfo);
    }
  }

  public resetBoundary = () => {
    this.props.onReset?.();
    this.setState({ error: null });
  };

  public render() {
    const { error } = this.state;
    if (error) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback({ error, reset: this.resetBoundary });
      }
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="w-full min-h-[50vh] flex flex-col items-center justify-center p-8 bg-slate-50 text-center rounded-2xl border border-slate-200">
          <h2 className="text-xl font-bold text-brand-primary">Something went wrong.</h2>
          <p className="text-xs text-slate-500 mt-2">Failed to render this section.</p>
          {import.meta.env.DEV && (
            <p className="text-[10px] text-red-500 mt-1 font-mono">{error.message}</p>
          )}
          <button
            onClick={this.resetBoundary}
            className="mt-4 bg-brand-accent hover:bg-opacity-90 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}


