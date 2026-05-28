export interface ErrorMessageProps {
  error: import('./api').ApiError;
  className?: string;
}

export interface ToastOptions {
  message: string;
  variant: 'error' | 'info' | 'success';
  durationMs?: number;
}
