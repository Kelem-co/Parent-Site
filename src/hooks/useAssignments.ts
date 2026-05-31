import { useQuery } from '@tanstack/react-query';
import { getAssignments } from '@/services/assignmentService';
import { queryKeys } from '@/lib/queryKeys';
import type { AssignmentEntry } from '@/types/assignment';
import type { ApiError } from '@/types/api';
import type { Child } from '@/types';

export function useAssignments(child: Child) {
  return useQuery<AssignmentEntry[], ApiError>({
    queryKey: queryKeys.assignments(child),
    queryFn: () => getAssignments(child),
    enabled: Boolean(child.id),
  });
}
