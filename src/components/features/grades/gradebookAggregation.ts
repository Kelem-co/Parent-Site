// Pure aggregation function extracted for testability
// Feature: nextjs-codebase-refactor, Property 13

export interface GradebookTask {
  id: string;
  title: string;
  subject: string;
  subjectColor: string;
  type: string;
  dueDate: string;
  status: string;
  score: number | null;
  maxScore: number;
  description?: string;
}

/**
 * Combines homework, assignments, and exams into a deduplicated GradebookTask list.
 * Deduplication key is the `id` field — if an id appears in more than one source,
 * only the first occurrence is kept.
 */
export function aggregateGradebookTasks(
  homework: GradebookTask[],
  assignments: GradebookTask[],
  exams: GradebookTask[]
): GradebookTask[] {
  const seen = new Set<string>();
  const result: GradebookTask[] = [];

  for (const item of [...homework, ...assignments, ...exams]) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }

  return result;
}
