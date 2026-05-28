import { describe, it, expect } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';
import { ApiError, API_ERROR_CODES } from '@/types/api';

/**
 * Unit tests for ErrorBoundary.getDerivedStateFromError
 * Tests that the static method correctly wraps errors in ApiError
 * and sets hasError: true.
 * Validates: Requirements 8.6
 */
describe('ErrorBoundary.getDerivedStateFromError (Task 13.5)', () => {
  it('returns hasError:true and the same ApiError when given an ApiError', () => {
    const apiError = new ApiError(API_ERROR_CODES.NOT_FOUND, 'Not found', 404);
    const state = ErrorBoundary.getDerivedStateFromError(apiError);
    expect(state.hasError).toBe(true);
    expect(state.error).toBe(apiError);
    expect(state.error?.errorCode).toBe(API_ERROR_CODES.NOT_FOUND);
    expect(state.error?.status).toBe(404);
  });

  it('wraps a plain Error in ApiError with UNKNOWN_ERROR code', () => {
    const plainError = new Error('Something broke');
    const state = ErrorBoundary.getDerivedStateFromError(plainError);
    expect(state.hasError).toBe(true);
    expect(state.error).toBeInstanceOf(ApiError);
    expect(state.error?.errorCode).toBe(API_ERROR_CODES.UNKNOWN_ERROR);
    expect(state.error?.message).toBe('Something broke');
    expect(state.error?.status).toBe(0);
  });

  it('wraps a string error in ApiError with UNKNOWN_ERROR code and default message', () => {
    const state = ErrorBoundary.getDerivedStateFromError('string error');
    expect(state.hasError).toBe(true);
    expect(state.error).toBeInstanceOf(ApiError);
    expect(state.error?.errorCode).toBe(API_ERROR_CODES.UNKNOWN_ERROR);
    expect(state.error?.message).toBe('An unexpected error occurred.');
  });

  it('wraps null in ApiError with UNKNOWN_ERROR code', () => {
    const state = ErrorBoundary.getDerivedStateFromError(null);
    expect(state.hasError).toBe(true);
    expect(state.error).toBeInstanceOf(ApiError);
    expect(state.error?.errorCode).toBe(API_ERROR_CODES.UNKNOWN_ERROR);
  });

  it('wraps an object error in ApiError with UNKNOWN_ERROR code', () => {
    const state = ErrorBoundary.getDerivedStateFromError({ code: 'CUSTOM' });
    expect(state.hasError).toBe(true);
    expect(state.error).toBeInstanceOf(ApiError);
    expect(state.error?.errorCode).toBe(API_ERROR_CODES.UNKNOWN_ERROR);
  });

  it('preserves ApiError errorCode for all known error codes', () => {
    const codes = Object.values(API_ERROR_CODES);
    for (const code of codes) {
      const apiError = new ApiError(code, `Error: ${code}`, 400);
      const state = ErrorBoundary.getDerivedStateFromError(apiError);
      expect(state.error?.errorCode).toBe(code);
    }
  });
});
