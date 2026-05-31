export interface HomeworkEntry {
  id: string;
  title: string;
  subject: string;
  subjectColor: string;
  date: string;
  score: number | null;
  maxScore: number;
  status: 'graded' | 'completed' | 'due' | 'pending' | 'missing' | string;
  type: string;
}

export interface HomeworkConfirmationSummary {
  id: string;
  is_confirmed: boolean;
  feedback: string;
  confirmed_at: string | null;
}

export interface TodaysHomeworkEntry {
  id: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  teacherName: string;
  title: string;
  description: string;
  dueDate: string;
  subject: string;
  section: string;
  branchId: string;
  branchName: string;
  confirmed: boolean;
  homeworkConfirmation: HomeworkConfirmationSummary | null;
}

export interface ConfirmHomeworkRequest {
  assessment: string;
  student: string;
  is_confirmed: boolean;
}

export interface AssignmentEntry {
  id: string;
  assessmentId?: string;
  title: string;
  section?: string;
  subject: string;
  subjectColor: string;
  type: string;
  taskType?: string;
  taskTypeDisplay?: string;
  dueDate: string;
  status: 'graded' | 'completed' | 'due' | 'pending' | 'missing' | string;
  score: number | null;
  maxScore: number;
  description: string;
}
