import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ApiError } from '../api';
import type { ApiResponse, PaginatedResponse } from '../api';

/**
 * Property 1: ApiResponse envelope preserves data
 * Validates: Requirements 1.2, 4.4
 */
describe('ApiResponse (Property 1)', () => {
  it('preserves data for any value', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        const response: ApiResponse<unknown> = { success: true, data: value };
        expect(response.data).toBe(value);
        expect(response.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 2: PaginatedResponse preserves all items
 * Validates: Requirements 1.3, 4.4
 */
describe('PaginatedResponse (Property 2)', () => {
  it('preserves all items and total matches length', () => {
    fc.assert(
      fc.property(fc.array(fc.anything()), (items) => {
        const response: PaginatedResponse<unknown> = {
          items,
          page: 1,
          pageSize: 20,
          total: items.length,
        };
        expect(response.items).toEqual(items);
        expect(response.total).toBe(items.length);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 3: ApiError preserves errorCode, message, and status
 * Validates: Requirements 1.4, 5.4
 */
describe('ApiError (Property 3)', () => {
  it('preserves errorCode, message, and status', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        fc.integer({ min: 0, max: 599 }),
        (errorCode, message, status) => {
          const error = new ApiError(errorCode, message, status);
          expect(error.errorCode).toBe(errorCode);
          expect(error.message).toBe(message);
          expect(error.status).toBe(status);
          expect(error.name).toBe('ApiError');
          expect(error).toBeInstanceOf(Error);
        }
      ),
      { numRuns: 100 }
    );
  });
});
