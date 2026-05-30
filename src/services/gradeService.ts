import { apiClient } from '@/lib/apiClient';
import type { GradesResponse } from '@/types/api';

export async function getGrades(childId: string): Promise<GradesResponse> {
  const res = await apiClient.get<Array<{
    subject_name: string;
    percentage: number;
  }>>(
    `/api/assessment-results/by-student/`,
    { params: { student: childId } }
  );
  const bySubject = new Map<string, number[]>();
  for (const r of res.data) {
    const arr = bySubject.get(r.subject_name) ?? [];
    arr.push(r.percentage);
    bySubject.set(r.subject_name, arr);
  }
  const subjects = Array.from(bySubject.entries()).map(([name, scores]) => ({
    name,
    score: Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)),
    color: '#3949ab',
    teacher: '',
  }));
  const overallAvg = subjects.length
    ? Number((subjects.reduce((a, s) => a + s.score, 0) / subjects.length).toFixed(1))
    : 0;
  return { subjects, overallAvg };
}
