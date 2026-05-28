import { apiClient } from '@/lib/apiClient';
import type { AssignmentEntry, HomeworkEntry } from '@/types/assignment';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

export async function getAssignments(
  childId: string,
  params?: { status?: string; page?: number; pageSize?: number }
): Promise<AssignmentEntry[]> {
  const res = await apiClient.get<ApiResponse<PaginatedResponse<AssignmentEntry>>>(
    `/v1/children/${childId}/assignments`,
    { params }
  );
  return res.data.data.items;
}

export async function getHomework(
  childId: string,
  params?: { page?: number; pageSize?: number }
): Promise<HomeworkEntry[]> {
  const res = await apiClient.get<ApiResponse<PaginatedResponse<HomeworkEntry>>>(
    `/v1/children/${childId}/homework`,
    { params }
  );
  return res.data.data.items;
}
