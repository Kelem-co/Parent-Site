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

export interface AssignmentEntry {
  id: string;
  title: string;
  subject: string;
  subjectColor: string;
  type: string;
  dueDate: string;
  status: 'graded' | 'completed' | 'due' | 'pending' | 'missing' | string;
  score: number | null;
  maxScore: number;
  description: string;
}
