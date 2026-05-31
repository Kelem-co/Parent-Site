import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { confirmHomework } from '@/services/assignmentService';
import type { ConfirmHomeworkRequest } from '@/types/assignment';
import type { ApiError } from '@/types/api';

export function useConfirmHomework(childId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, ConfirmHomeworkRequest>({
    mutationFn: (body) => confirmHomework(body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.todaysHomework(childId),
      });
    },
  });
}
