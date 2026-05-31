import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logAbsence } from '@/services/attendanceService';
import { queryKeys } from '@/lib/queryKeys';
import type { LogAbsenceRequest, ApiError } from '@/types/api';
import type { AttendanceReasonEntry } from '@/types/api';

export function useLogAbsence(
  childId: string,
  attendanceId: string | null,
  reasonId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation<AttendanceReasonEntry, ApiError, LogAbsenceRequest>({
    mutationFn: (body: LogAbsenceRequest) => {
      if (!attendanceId) {
        throw new Error('Attendance record is required.');
      }
      return logAbsence(
        { attendanceId, reasonId },
        {
        reason: body.reason ?? 'UNKNOWN',
        note: body.note,
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance(childId) });
    },
  });
}
