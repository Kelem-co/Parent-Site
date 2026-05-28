// Feature: nextjs-codebase-refactor
// Properties 10–12: filterAssignments correctness

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { filterAssignments } from './AssignmentsModule';
import { AssignmentEntry } from '@/types/assignment';

const statusValues = ['graded', 'completed', 'due', 'submitted', 'missing'];

const assignmentArb = fc.record<AssignmentEntry>({
  id: fc.string({ minLength: 1 }),
  title: fc.string({ minLength: 1 }),
  subject: fc.string({ minLength: 1 }),
  subjectColor: fc.constant('#3949ab'),
  type: fc.string({ minLength: 1 }),
  dueDate: fc.string({ minLength: 1 }),
  status: fc.constantFrom(...statusValues),
  score: fc.option(fc.integer({ min: 0, max: 100 }), { nil: null }),
  maxScore: fc.integer({ min: 1, max: 100 }),
  description: fc.string(),
});

const assignmentsArb = fc.array(assignmentArb);
const filterArb = fc.constantFrom('All', ...statusValues);

// Property 10: Filter subset and correctness
describe('filterAssignments — subset and correctness', () => {
  it('every result item is in the original array and satisfies the filter predicate', () => {
    fc.assert(
      fc.property(assignmentsArb, filterArb, (assignments, filter) => {
        if (filter === 'All') return;
        const result = filterAssignments(assignments, filter);
        for (const item of result) {
          // Subset: item must exist in original
          expect(assignments.some((a) => a.id === item.id)).toBe(true);
          // Correctness: item must satisfy predicate
          expect(item.status.toLowerCase()).toBe(filter.toLowerCase());
        }
      }),
      { numRuns: 100 }
    );
  });
});

// Property 11: Filter idempotence
describe('filterAssignments — idempotence', () => {
  it('applying the same filter twice returns the same result as once', () => {
    fc.assert(
      fc.property(assignmentsArb, filterArb, (assignments, filter) => {
        const once = filterAssignments(assignments, filter);
        const twice = filterAssignments(once, filter);
        expect(twice).toEqual(once);
      }),
      { numRuns: 100 }
    );
  });
});

// Property 12: Filter completeness for "All"
describe('filterAssignments — completeness for All', () => {
  it('applying "All" filter returns an array of the same length as the input', () => {
    fc.assert(
      fc.property(assignmentsArb, (assignments) => {
        const result = filterAssignments(assignments, 'All');
        expect(result.length).toBe(assignments.length);
      }),
      { numRuns: 100 }
    );
  });
});
