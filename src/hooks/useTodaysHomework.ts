import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getTodaysHomework } from '@/services/assignmentService';
import type { ApiError } from '@/types/api';
import type { TodaysHomeworkEntry } from '@/types/assignment';

export function useTodaysHomework(childId: string) {
  return useQuery<TodaysHomeworkEntry[], ApiError>({
    queryKey: queryKeys.todaysHomework(childId),
    queryFn: () => getTodaysHomework(childId),
    enabled: Boolean(childId),
  });
}
