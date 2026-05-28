import { apiClient } from '@/lib/apiClient';
import type { AttendanceLogEntry } from '@/types/child';
import type { ApiResponse, AttendanceResponse, LogAbsenceRequest } from '@/types/api';

export async function getAttendance(
  childId: string,
  params?: { from?: string; to?: string }
): Promise<AttendanceResponse> {
  const res = await apiClient.get<ApiResponse<AttendanceResponse>>(
    `/v1/children/${childId}/attendance`,
    { params }
  );
  return res.data.data;
}

export async function logAbsence(
  childId: string,
  body: LogAbsenceRequest
): Promise<AttendanceLogEntry> {
  const res = await apiClient.post<ApiResponse<AttendanceLogEntry>>(
    `/v1/children/${childId}/attendance/absence`,
    body
  );
  return res.data.data;
}
