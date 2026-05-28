import { apiClient } from '@/lib/apiClient';
import type { NotificationEntry } from '@/types/notification';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

export async function getNotifications(
  childId: string,
  params?: { read?: boolean; page?: number; pageSize?: number }
): Promise<NotificationEntry[]> {
  const res = await apiClient.get<ApiResponse<PaginatedResponse<NotificationEntry>>>(
    `/v1/children/${childId}/notifications`,
    { params }
  );
  return res.data.data.items;
}
