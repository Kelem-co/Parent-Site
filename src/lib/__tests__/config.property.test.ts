import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { buildConfig } from '../config';

/**
 * Property 4: Config module correctly reads and parses env vars
 * Validates: Requirements 2.1, 2.2
 */
describe('buildConfig (Property 4)', () => {
  it('correctly reads apiBaseUrl and apiTimeoutMs from env map', () => {
    fc.assert(
      fc.property(
        fc.webUrl(),
        fc.integer({ min: 1, max: 60000 }),
        fc.boolean(),
        (baseUrl, timeoutMs, enableMocks) => {
          const env = {
            NEXT_PUBLIC_API_BASE_URL: baseUrl,
            NEXT_PUBLIC_API_TIMEOUT_MS: String(timeoutMs),
            NEXT_PUBLIC_ENABLE_MOCKS: String(enableMocks),
          };
          const result = buildConfig(env);
          expect(result.apiBaseUrl).toBe(baseUrl);
          expect(result.apiTimeoutMs).toBe(timeoutMs);
          expect(result.enableMocks).toBe(enableMocks);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('defaults apiTimeoutMs to 10000 when not set', () => {
    fc.assert(
      fc.property(fc.webUrl(), (baseUrl) => {
        const env = { NEXT_PUBLIC_API_BASE_URL: baseUrl };
        const result = buildConfig(env);
        expect(result.apiTimeoutMs).toBe(10000);
        expect(result.enableMocks).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 5: Config module throws with variable name when required var is absent
 * Validates: Requirements 2.5
 */
describe('buildConfig (Property 5)', () => {
  it('throws with variable name when NEXT_PUBLIC_API_BASE_URL is absent', () => {
    fc.assert(
      fc.property(
        fc.option(fc.constant(''), { nil: undefined }),
        (badValue) => {
          const env: Record<string, string | undefined> = {
            NEXT_PUBLIC_API_BASE_URL: badValue ?? undefined,
          };
          expect(() => buildConfig(env)).toThrow('NEXT_PUBLIC_API_BASE_URL');
        }
      ),
      { numRuns: 100 }
    );
  });
});
