import { useQuery } from '@tanstack/react-query';
import { getChildren } from '@/services/childService';
import { queryKeys } from '@/lib/queryKeys';
import type { Child } from '@/types/child';
import type { ApiError } from '@/types/api';

export function useChildren() {
  return useQuery<Child[], ApiError>({
    queryKey: queryKeys.children(),
    queryFn: getChildren,
  });
}
