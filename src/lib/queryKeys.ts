export const queryKeys = {
  children: () => ['children'] as const,
  child: (id: string) => ['children', id] as const,
  assignments: (childId: string) => ['assignments', childId] as const,
  homework: (childId: string) => ['homework', childId] as const,
  attendance: (childId: string) => ['attendance', childId] as const,
  grades: (childId: string) => ['grades', childId] as const,
  messages: () => ['messages'] as const,
  messageThread: (threadId: string) => ['messages', threadId] as const,
  notifications: (childId: string) => ['notifications', childId] as const,
  schedule: (childId: string) => ['schedule', childId] as const,
} as const;
