// Feature: nextjs-codebase-refactor
// Property 13: Gradebook deduplication and completeness

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { aggregateGradebookTasks, GradebookTask } from './gradebookAggregation';

const taskArb = (id: string) =>
  fc.record<GradebookTask>({
    id: fc.constant(id),
    title: fc.string({ minLength: 1 }),
    subject: fc.string({ minLength: 1 }),
    subjectColor: fc.constant('#3949ab'),
    type: fc.constantFrom('Homework', 'Assignment', 'Quiz', 'Exam'),
    dueDate: fc.string({ minLength: 1 }),
    status: fc.constantFrom('graded', 'due', 'missing', 'submitted'),
    score: fc.option(fc.integer({ min: 0, max: 100 }), { nil: null }),
    maxScore: fc.integer({ min: 1, max: 100 }),
    description: fc.string(),
  });

// Generate three arrays with all-unique IDs across all three
const threeUniqueArraysArb = fc
  .array(fc.uuid(), { minLength: 0, maxLength: 10 })
  .chain((hwIds) =>
    fc
      .array(fc.uuid(), { minLength: 0, maxLength: 10 })
      .chain((asnIds) =>
        fc
          .array(fc.uuid(), { minLength: 0, maxLength: 10 })
          .filter((examIds) => {
            const all = [...hwIds, ...asnIds, ...examIds];
            return new Set(all).size === all.length;
          })
          .chain((examIds) =>
            fc
              .tuple(
                fc.tuple(...(hwIds.length ? hwIds.map(taskArb) : [fc.constant([] as any)])),
                fc.tuple(...(asnIds.length ? asnIds.map(taskArb) : [fc.constant([] as any)])),
                fc.tuple(...(examIds.length ? examIds.map(taskArb) : [fc.constant([] as any)]))
              )
              .map(([hw, asn, exam]) => ({
                homework: hwIds.length ? (hw as GradebookTask[]) : [],
                assignments: asnIds.length ? (asn as GradebookTask[]) : [],
                exams: examIds.length ? (exam as GradebookTask[]) : [],
              }))
          )
      )
  );

// Property 13: Gradebook deduplication and completeness
describe('aggregateGradebookTasks', () => {
  it('no duplicate IDs, no items dropped, all source items present when all IDs are unique', () => {
    // Use a simpler approach: generate flat arrays with unique IDs
    const uniqueIdsArb = fc.array(fc.uuid(), { minLength: 0, maxLength: 30 }).chain((ids) => {
      const unique = [...new Set(ids)];
      const third = Math.floor(unique.length / 3);
      const hwIds = unique.slice(0, third);
      const asnIds = unique.slice(third, third * 2);
      const examIds = unique.slice(third * 2);

      const makeTask = (id: string): GradebookTask => ({
        id,
        title: 'Test',
        subject: 'Math',
        subjectColor: '#000',
        type: 'Assignment',
        dueDate: 'Jun 1',
        status: 'due',
        score: null,
        maxScore: 10,
      });

      return fc.constant({
        homework: hwIds.map(makeTask),
        assignments: asnIds.map(makeTask),
        exams: examIds.map(makeTask),
        totalCount: unique.length,
      });
    });

    fc.assert(
      fc.property(uniqueIdsArb, ({ homework, assignments, exams, totalCount }) => {
        const result = aggregateGradebookTasks(homework, assignments, exams);

        // No duplicate IDs
        const ids = result.map((t) => t.id);
        expect(new Set(ids).size).toBe(ids.length);

        // No items dropped
        expect(result.length).toBe(totalCount);

        // Source completeness
        const resultIds = new Set(ids);
        for (const item of [...homework, ...assignments, ...exams]) {
          expect(resultIds.has(item.id)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });
});
