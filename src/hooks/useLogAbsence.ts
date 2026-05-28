import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logAbsence } from '@/services/attendanceService';
import { queryKeys } from '@/lib/queryKeys';
import type { LogAbsenceRequest, ApiError } from '@/types/api';
import type { AttendanceLogEntry } from '@/types/child';

export function useLogAbsence(childId: string) {
  const queryClient = useQueryClient();

  return useMutation<AttendanceLogEntry, ApiError, LogAbsenceRequest>({
    mutationFn: (body: LogAbsenceRequest) => logAbsence(childId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance(childId) });
    },
  });
}
