import { apiClient } from '@/lib/apiClient';
import type { AssignmentEntry, HomeworkEntry } from '@/types/assignment';

export async function getAssignments(
  childId: string,
  params?: { status?: string; page?: number; pageSize?: number }
): Promise<AssignmentEntry[]> {
  const res = await apiClient.get<Array<{
    id: string;
    assessment_title: string;
    subject_name: string;
    submission_status: string;
    obtained_marks: string;
    total_marks: string;
  }>>(
    `/api/assessment-results/by-student/`,
    { params: { student: childId, ...params } }
  );
  return res.data.map((r) => ({
    id: r.id,
    title: r.assessment_title,
    subject: r.subject_name,
    subjectColor: '#3949ab',
    type: 'Assessment',
    dueDate: '',
    status: r.submission_status.toLowerCase(),
    score: Number(r.obtained_marks),
    maxScore: Number(r.total_marks),
    description: '',
  }));
}

export async function getHomework(
  childId: string,
  params?: { page?: number; pageSize?: number }
): Promise<HomeworkEntry[]> {
  const assignments = await getAssignments(childId, params);
  return assignments.map((a) => ({
    id: a.id,
    title: a.title,
    subject: a.subject,
    subjectColor: a.subjectColor,
    date: '',
    score: a.score,
    maxScore: a.maxScore,
    status: a.status,
    type: a.type,
  }));
}
