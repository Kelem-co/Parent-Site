import { useQuery } from '@tanstack/react-query';
import { getSchedule } from '@/services/scheduleService';
import { queryKeys } from '@/lib/queryKeys';
import type { ScheduleEntry } from '@/types/schedule';
import type { ApiError } from '@/types/api';

export function useSchedule(childId: string) {
  return useQuery<ScheduleEntry[], ApiError>({
    queryKey: queryKeys.schedule(childId),
    queryFn: () => getSchedule(childId),
    enabled: Boolean(childId),
  });
}
