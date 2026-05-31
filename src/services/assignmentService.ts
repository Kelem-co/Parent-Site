import { apiClient } from '@/lib/apiClient';
import type { Child } from '@/types';
import type {
  AssignmentEntry,
  ConfirmHomeworkRequest,
  HomeworkEntry,
  TodaysHomeworkEntry,
} from '@/types/assignment';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface AssessmentResultApiItem {
  id: string;
  assessment_id: string;
  assessment_title: string;
  assessment_description: string;
  assessment_due_date: string;
  subject_name: string;
  section_name: string;
  submission_status: string;
  obtained_marks: string | null;
  total_marks: string;
  task_type: string;
  task_type_display: string;
}

interface AssessmentApiItem {
  id: string;
  title: string;
  description: string;
  due_date: string;
  total_marks: string;
  subject_name: string;
  section_name: string;
  task_type: string;
  task_type_display: string;
}

interface TodaysHomeworkApiItem {
  id: string;
  student_id: string;
  student_name: string;
  student_roll_no: string;
  teacher_name: string;
  title: string;
  description: string;
  due_date: string;
  subject_name: string;
  section_name: string;
  branch_id: string;
  branch_name: string;
  confirmed: boolean;
  homework_confirmation: {
    id: string;
    is_confirmed: boolean;
    feedback: string;
    confirmed_at: string | null;
  } | null;
}

function mapResultStatus(status: string): AssignmentEntry['status'] {
  if (status === 'GRADED') return 'graded';
  if (status === 'SUBMITTED') return 'submitted';
  if (status === 'MISSING') return 'missing';
  return 'due';
}

function mapResultRow(row: AssessmentResultApiItem): AssignmentEntry {
  const normalizedStatus = mapResultStatus(row.submission_status);

  return {
    id: row.id,
    assessmentId: row.assessment_id,
    title: row.assessment_title,
    section: row.section_name,
    subject: row.subject_name,
    subjectColor: '#3949ab',
    type: row.task_type_display,
    taskType: row.task_type.toLowerCase(),
    taskTypeDisplay: row.task_type_display,
    dueDate: row.assessment_due_date,
    status: normalizedStatus === 'due' && row.obtained_marks !== null ? 'graded' : normalizedStatus,
    score: row.obtained_marks === null ? null : Number(row.obtained_marks),
    maxScore: Number(row.total_marks),
    description: row.assessment_description,
  };
}

function mapAssessmentRow(row: AssessmentApiItem): AssignmentEntry {
  return {
    id: row.id,
    assessmentId: row.id,
    title: row.title,
    section: row.section_name,
    subject: row.subject_name,
    subjectColor: '#3949ab',
    type: row.task_type_display,
    taskType: row.task_type.toLowerCase(),
    taskTypeDisplay: row.task_type_display,
    dueDate: row.due_date,
    status: 'due',
    score: null,
    maxScore: Number(row.total_marks),
    description: row.description,
  };
}

function mapTodaysHomeworkItem(item: TodaysHomeworkApiItem): TodaysHomeworkEntry {
  return {
    id: item.id,
    studentId: item.student_id,
    studentName: item.student_name,
    studentRollNo: item.student_roll_no,
    teacherName: item.teacher_name,
    title: item.title,
    description: item.description,
    dueDate: item.due_date,
    subject: item.subject_name,
    section: item.section_name,
    branchId: item.branch_id,
    branchName: item.branch_name,
    confirmed: item.confirmed,
    homeworkConfirmation: item.homework_confirmation,
  };
}

export async function getAssignments(
  child: Child,
  params?: { status?: string; page?: number; pageSize?: number },
): Promise<AssignmentEntry[]> {
  const resultsRequest = apiClient.get<AssessmentResultApiItem[]>(
    '/api/assessment-results/by-student/',
    { params: { student: child.id, ...params } },
  );

  const assessmentsRequest = child.sectionId
    ? apiClient.get<PaginatedResponse<AssessmentApiItem>>('/api/assessments/', {
        params: {
          branch: child.branchId,
          section: child.sectionId,
          status: 'PUBLISHED',
        },
      })
    : Promise.resolve(null);

  const [resultsResponse, assessmentsResponse] = await Promise.all([
    resultsRequest,
    assessmentsRequest,
  ]);

  const resultEntries = resultsResponse.data.map(mapResultRow);
  const merged = new Map<string, AssignmentEntry>();

  for (const entry of resultEntries) {
    if (entry.assessmentId) {
      merged.set(entry.assessmentId, entry);
    }
  }

  const assessmentRows = assessmentsResponse?.data.results ?? [];
  for (const row of assessmentRows) {
    if (merged.has(row.id)) continue;
    const entry = mapAssessmentRow(row);
    merged.set(row.id, entry);
  }

  return Array.from(merged.values()).sort((left, right) =>
    right.dueDate.localeCompare(left.dueDate),
  );
}

export async function getHomework(
  child: Child,
  params?: { page?: number; pageSize?: number },
): Promise<HomeworkEntry[]> {
  const assignments = await getAssignments(child, params);
  return assignments.map((a) => ({
    id: a.id,
    title: a.title,
    subject: a.subject,
    subjectColor: a.subjectColor,
    date: a.dueDate,
    score: a.score,
    maxScore: a.maxScore,
    status: a.status,
    type: a.taskTypeDisplay ?? a.type,
  }));
}

export async function getTodaysHomework(
  childId: string,
): Promise<TodaysHomeworkEntry[]> {
  const res = await apiClient.get<
    PaginatedResponse<TodaysHomeworkApiItem> | TodaysHomeworkApiItem[]
  >('/api/assessments/todays-homework/', {
    params: { student: childId },
  });

  const rows = Array.isArray(res.data) ? res.data : res.data.results;
  return rows.map(mapTodaysHomeworkItem);
}

export async function confirmHomework(
  body: ConfirmHomeworkRequest,
): Promise<void> {
  await apiClient.post('/api/homework-confirmations/', body);
}
