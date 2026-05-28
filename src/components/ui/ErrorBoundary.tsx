import React from 'react';
import { ApiError, API_ERROR_CODES } from '@/types/api';
import { ErrorMessage } from './ErrorMessage';

interface ErrorBoundaryState {
  hasError: boolean;
  error: ApiError | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const apiError =
      error instanceof ApiError
        ? error
        : new ApiError(
            API_ERROR_CODES.UNKNOWN_ERROR,
            error instanceof Error ? error.message : 'An unexpected error occurred.',
            0,
          );
    return { hasError: true, error: apiError };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="p-4">
            <ErrorMessage error={this.state.error} />
          </div>
        )
      );
    }
    return this.props.children;
  }
}
