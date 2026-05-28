import { apiClient } from '@/lib/apiClient';
import type { ApiResponse, GradesResponse } from '@/types/api';

export async function getGrades(childId: string): Promise<GradesResponse> {
  const res = await apiClient.get<ApiResponse<GradesResponse>>(
    `/v1/children/${childId}/grades`
  );
  return res.data.data;
}
