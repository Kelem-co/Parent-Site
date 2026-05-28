// Feature: nextjs-codebase-refactor
// Properties 1–5: Grade utility correctness

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  getGradeColor,
  getGradeBg,
  getGradeLetter,
  getSubjectInitials,
} from '@/lib';

const scoreArb = fc.integer({ min: 0, max: 100 });

// Property 1: Grade color exhaustiveness
describe('getGradeColor', () => {
  it('returns exactly one of the three valid color classes for any score in [0,100]', () => {
    const valid = new Set(['text-emerald-600', 'text-amber-600', 'text-red-600']);
    fc.assert(
      fc.property(scoreArb, (score) => {
        const result = getGradeColor(score);
        expect(valid.has(result)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

// Property 2: Grade letter exhaustiveness
describe('getGradeLetter', () => {
  it('returns exactly one of A, B, C, D, F for any score in [0,100]', () => {
    const valid = new Set(['A', 'B', 'C', 'D', 'F']);
    fc.assert(
      fc.property(scoreArb, (score) => {
        const result = getGradeLetter(score);
        expect(valid.has(result)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

// Property 3: Grade utility tier consistency
describe('getGradeColor + getGradeBg tier consistency', () => {
  it('both agree on emerald/amber/red tier for any score in [0,100]', () => {
    fc.assert(
      fc.property(scoreArb, (score) => {
        const color = getGradeColor(score);
        const bg = getGradeBg(score);
        if (color === 'text-emerald-600') expect(bg).toContain('emerald');
        else if (color === 'text-amber-600') expect(bg).toContain('amber');
        else expect(bg).toContain('red');
      }),
      { numRuns: 100 }
    );
  });
});

// Property 4: Grade letter monotonicity
describe('getGradeLetter monotonicity', () => {
  it('getGradeLetter(s1) <= getGradeLetter(s2) in F<D<C<B<A ordering when s1 < s2', () => {
    const order: Record<string, number> = { F: 0, D: 1, C: 2, B: 3, A: 4 };
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 99 }),
        fc.integer({ min: 1, max: 100 }),
        (a, b) => {
          const s1 = Math.min(a, b - 1);
          const s2 = Math.max(a + 1, b);
          if (s1 >= s2) return;
          expect(order[getGradeLetter(s1)]).toBeLessThanOrEqual(order[getGradeLetter(s2)]);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 5: Subject initials bounds
describe('getSubjectInitials', () => {
  it('returns 1–2 uppercase ASCII letters for any non-empty subject name', () => {
    // Use strings that contain at least one ASCII letter (realistic subject names)
    const subjectNameArb = fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]*$/);
    fc.assert(
      fc.property(subjectNameArb, (name) => {
        const result = getSubjectInitials(name);
        expect(result.length).toBeGreaterThanOrEqual(1);
        expect(result.length).toBeLessThanOrEqual(2);
        expect(/^[A-Z]+$/.test(result)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
