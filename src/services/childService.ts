import { apiClient } from '@/lib/apiClient';
import type { Child } from '@/types/child';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

export async function getChildren(): Promise<Child[]> {
  const res = await apiClient.get<ApiResponse<PaginatedResponse<Child>>>('/v1/children');
  return res.data.data.items;
}

export async function getChild(childId: string): Promise<Child> {
  const res = await apiClient.get<ApiResponse<Child>>(`/v1/children/${childId}`);
  return res.data.data;
}
