import { apiClient } from '@/lib/apiClient';
import type { ScheduleEntry } from '@/types/schedule';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

export async function getSchedule(childId: string): Promise<ScheduleEntry[]> {
  const res = await apiClient.get<ApiResponse<PaginatedResponse<ScheduleEntry>>>(
    `/v1/children/${childId}/schedule`
  );
  return res.data.data.items;
}
