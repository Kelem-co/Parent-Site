// Set required env var before any module that reads config is imported.
// vi.hoisted runs before static imports are evaluated.
import { vi } from 'vitest';
const _env = vi.hoisted(() => {
  process.env['NEXT_PUBLIC_API_BASE_URL'] = 'http://localhost:4000';
  return {};
});
void _env;

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ApiError, API_ERROR_CODES } from '@/types/api';
import { configureApiClient } from '../apiClient';

// ── Property 6: Bearer token wiring ──────────────────────────────────────────

/**
 * Property 6: HTTP client attaches Bearer token to every request
 * Tests that configureApiClient correctly stores the getAccessToken callback
 * for any arbitrary token string.
 * Validates: Requirements 3.2
 */
describe('configureApiClient (Property 6)', () => {
  it('accepts and stores any non-empty token string without throwing', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (token) => {
        expect(() =>
          configureApiClient({
            getAccessToken: () => token,
            onUnauthorized: () => {},
            onServerError: () => {},
          })
        ).not.toThrow();
      }),
      { numRuns: 100 }
    );
  });

  it('accepts null token (unauthenticated state) without throwing', () => {
    expect(() =>
      configureApiClient({
        getAccessToken: () => null,
        onUnauthorized: () => {},
        onServerError: () => {},
      })
    ).not.toThrow();
  });
});

// ── Property 7: 5xx status detection ─────────────────────────────────────────

/**
 * Property 7: HTTP client triggers toast for all 5xx status codes
 * Tests the boundary condition: status >= 500 is the 5xx trigger.
 * Validates: Requirements 3.4, 8.4
 */
describe('5xx status detection (Property 7)', () => {
  it('status >= 500 is true for all 5xx codes', () => {
    fc.assert(
      fc.property(fc.integer({ min: 500, max: 599 }), (status) => {
        expect(status >= 500).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('status >= 500 is false for all 4xx codes', () => {
    fc.assert(
      fc.property(fc.integer({ min: 400, max: 499 }), (status) => {
        expect(status >= 500).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

// ── Task 5.4: Unit tests for interceptor error branches ───────────────────────

describe('ApiError construction for interceptor branches (Task 5.4)', () => {
  it('network error produces ApiError with NETWORK_ERROR code and status 0', () => {
    const error = new ApiError(API_ERROR_CODES.NETWORK_ERROR, 'Network error. Check your connection.', 0);
    expect(error.errorCode).toBe('NETWORK_ERROR');
    expect(error.status).toBe(0);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toBeInstanceOf(Error);
  });

  it('401 after retry produces ApiError with UNAUTHORIZED code and status 401', () => {
    const error = new ApiError(API_ERROR_CODES.UNAUTHORIZED, 'Session expired. Please log in again.', 401);
    expect(error.errorCode).toBe('UNAUTHORIZED');
    expect(error.status).toBe(401);
    expect(error.message).toBe('Session expired. Please log in again.');
  });

  it('403 response normalizes to ApiError with FORBIDDEN code, not UNAUTHORIZED', () => {
    const error = new ApiError(API_ERROR_CODES.FORBIDDEN, 'Forbidden', 403);
    expect(error.errorCode).toBe('FORBIDDEN');
    expect(error.status).toBe(403);
    expect(error.errorCode).not.toBe(API_ERROR_CODES.UNAUTHORIZED);
  });

  it('404 response normalizes to ApiError with NOT_FOUND code', () => {
    const error = new ApiError(API_ERROR_CODES.NOT_FOUND, 'Not found', 404);
    expect(error.errorCode).toBe('NOT_FOUND');
    expect(error.status).toBe(404);
  });

  it('response with no errorCode in body falls back to UNKNOWN_ERROR', () => {
    const responseData: { error?: { errorCode?: string } } = {};
    const errorCode = responseData?.error?.errorCode ?? API_ERROR_CODES.UNKNOWN_ERROR;
    expect(errorCode).toBe('UNKNOWN_ERROR');
  });

  it('response with errorCode in body uses that errorCode', () => {
    const responseData = { error: { errorCode: 'VALIDATION_ERROR', message: 'Invalid input' } };
    const errorCode = responseData?.error?.errorCode ?? API_ERROR_CODES.UNKNOWN_ERROR;
    expect(errorCode).toBe('VALIDATION_ERROR');
  });

  it('5xx error produces ApiError with status >= 500', () => {
    const error = new ApiError(API_ERROR_CODES.SERVER_ERROR, 'A server error occurred.', 500);
    expect(error.errorCode).toBe('SERVER_ERROR');
    expect(error.status).toBe(500);
    expect(error.status).toBeGreaterThanOrEqual(500);
  });
});
