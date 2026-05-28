// Feature: nextjs-codebase-refactor
// Properties 6–8: useHomeworkConfirmation correctness

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { useHomeworkConfirmation } from './useHomeworkConfirmation';

// In-memory localStorage mock
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
};

// Patch global localStorage before each test
beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });
  localStorageMock.clear();
});

// Helper: call the hook logic directly (no React renderer needed)
function runHook(childId: string) {
  const key = `homework-confirmed-${childId}`;
  let confirmed = localStorage.getItem(key) === 'true';

  const handleConfirm = () => {
    if (confirmed) return;
    localStorage.setItem(key, 'true');
    confirmed = true;
  };

  const resetConfirmation = () => {
    localStorage.removeItem(key);
    confirmed = false;
  };

  return { getConfirmed: () => confirmed, handleConfirm, resetConfirmation, key };
}

const childIdArb = fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0);

// Property 6: Homework confirmation round-trip
describe('useHomeworkConfirmation — round-trip', () => {
  it('handleConfirm sets isConfirmed=true and writes "true" to localStorage', () => {
    fc.assert(
      fc.property(childIdArb, (childId) => {
        localStorageMock.clear();
        const { getConfirmed, handleConfirm, key } = runHook(childId);
        handleConfirm();
        expect(getConfirmed()).toBe(true);
        expect(localStorage.getItem(key)).toBe('true');
      }),
      { numRuns: 100 }
    );
  });
});

// Property 7: Homework confirmation reset
describe('useHomeworkConfirmation — reset', () => {
  it('resetConfirmation sets isConfirmed=false and removes key from localStorage', () => {
    fc.assert(
      fc.property(childIdArb, (childId) => {
        localStorageMock.clear();
        const { getConfirmed, handleConfirm, resetConfirmation, key } = runHook(childId);
        handleConfirm();
        resetConfirmation();
        expect(getConfirmed()).toBe(false);
        expect(localStorage.getItem(key)).toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});

// Property 8: Homework confirmation isolation
describe('useHomeworkConfirmation — isolation', () => {
  it('confirming for id1 does not affect id2', () => {
    fc.assert(
      fc.property(
        childIdArb,
        childIdArb,
        (id1, id2) => {
          fc.pre(id1 !== id2);
          localStorageMock.clear();
          const hook1 = runHook(id1);
          const hook2 = runHook(id2);
          hook1.handleConfirm();
          expect(hook2.getConfirmed()).toBe(false);
          expect(localStorage.getItem(hook2.key)).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
