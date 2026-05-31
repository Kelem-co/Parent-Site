import { apiClient } from '@/lib/apiClient';
import type { GradesResponse } from '@/types/api';

interface AssessmentResultGradeRow {
  subject_name: string;
  percentage: number;
  teacher_name?: string | null;
}

const SUBJECT_COLORS = [
  '#3949ab',
  '#7c3aed',
  '#059669',
  '#0891b2',
  '#ea580c',
  '#dc2626',
  '#16a34a',
  '#9333ea',
] as const;

function getSubjectColor(subjectName: string): string {
  let hash = 0;
  for (let index = 0; index < subjectName.length; index += 1) {
    hash = (hash * 31 + subjectName.charCodeAt(index)) >>> 0;
  }

  return SUBJECT_COLORS[hash % SUBJECT_COLORS.length] ?? SUBJECT_COLORS[0];
}

export async function getGrades(childId: string): Promise<GradesResponse> {
  const res = await apiClient.get<AssessmentResultGradeRow[]>(
    `/api/assessment-results/by-student/`,
    { params: { student: childId } },
  );

  const bySubject = new Map<
    string,
    { scores: number[]; teacher: string }
  >();

  for (const r of res.data) {
    if (!Number.isFinite(r.percentage)) continue;

    const existing = bySubject.get(r.subject_name) ?? { scores: [], teacher: '' };
    existing.scores.push(r.percentage);
    if (!existing.teacher && r.teacher_name) {
      existing.teacher = r.teacher_name;
    }
    bySubject.set(r.subject_name, existing);
  }

  const subjects = Array.from(bySubject.entries())
    .map(([name, details]) => ({
      name,
      score: Number(
        (
          details.scores.reduce((total, score) => total + score, 0)
          / details.scores.length
        ).toFixed(1),
      ),
      color: getSubjectColor(name),
      teacher: details.teacher,
    }))
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));

  const overallAvg = subjects.length
    ? Number(
      (
        subjects.reduce((total, subject) => total + subject.score, 0)
        / subjects.length
      ).toFixed(1),
    )
    : 0;
  return { subjects, overallAvg };
}
