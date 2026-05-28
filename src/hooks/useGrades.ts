import { useQuery } from '@tanstack/react-query';
import { getGrades } from '@/services/gradeService';
import { queryKeys } from '@/lib/queryKeys';
import type { GradesResponse, ApiError } from '@/types/api';

export function useGrades(childId: string) {
  return useQuery<GradesResponse, ApiError>({
    queryKey: queryKeys.grades(childId),
    queryFn: () => getGrades(childId),
    enabled: Boolean(childId),
  });
}
