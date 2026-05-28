import { useQuery } from '@tanstack/react-query';
import { getAttendance } from '@/services/attendanceService';
import { queryKeys } from '@/lib/queryKeys';
import type { AttendanceResponse, ApiError } from '@/types/api';

export function useAttendance(childId: string) {
  return useQuery<AttendanceResponse, ApiError>({
    queryKey: queryKeys.attendance(childId),
    queryFn: () => getAttendance(childId),
    enabled: Boolean(childId),
  });
}
