import { apiClient } from '@/lib/apiClient';
import type { ParentMeResponse, ParentStudent, UserMeResponse } from '@/types/api';

export async function getUserMe(): Promise<UserMeResponse> {
  const res = await apiClient.get<UserMeResponse>('/api/users/me/');
  return res.data;
}

export async function getParentMe(): Promise<ParentMeResponse> {
  const res = await apiClient.get<ParentMeResponse>('/api/parents/me/');
  return res.data;
}

export async function getMyStudents(): Promise<ParentStudent[]> {
  const res = await apiClient.get<ParentStudent[]>('/api/parents/my-students/');
  return res.data;
}
