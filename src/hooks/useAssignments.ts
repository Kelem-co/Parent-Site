import { useQuery } from '@tanstack/react-query';
import { getAssignments } from '@/services/assignmentService';
import { queryKeys } from '@/lib/queryKeys';
import type { AssignmentEntry } from '@/types/assignment';
import type { ApiError } from '@/types/api';

export function useAssignments(childId: string) {
  return useQuery<AssignmentEntry[], ApiError>({
    queryKey: queryKeys.assignments(childId),
    queryFn: () => getAssignments(childId),
    enabled: Boolean(childId),
  });
}
