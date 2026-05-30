import { apiClient } from '@/lib/apiClient';
import type { AttendanceLogEntry } from '@/types/child';
import type { AttendanceResponse } from '@/types/api';

export async function getAttendance(
  childId: string,
  params?: { academic_year?: string }
): Promise<AttendanceResponse> {
  const [logRes, summaryRes] = await Promise.all([
    apiClient.get<Array<{ date: string; status: string }>>(
      `/api/attendance/by-student/`,
      { params: { student: childId, academic_year: params?.academic_year } }
    ),
    apiClient.get<Array<{ total_present: number; total_school_days: number; total_absent: number; total_late: number }>>(
      `/api/attendance-summaries/`,
      { params: { student: childId } }
    ),
  ]);

  const log: AttendanceLogEntry[] = logRes.data.map((row) => ({
    date: row.date,
    status: row.status.toLowerCase(),
  }));
  const summary = summaryRes.data[0];
  const totalDays = summary?.total_school_days ?? 0;
  const daysPresent = summary?.total_present ?? 0;
  const absences = summary?.total_absent ?? 0;
  const lates = summary?.total_late ?? 0;

  return {
    log,
    termAttendance: totalDays > 0 ? (daysPresent / totalDays) * 100 : 0,
    daysPresent,
    totalDays,
    absences,
    lates,
  };
}

export async function getAttendanceReasons(childId: string) {
  const res = await apiClient.get(`/api/attendance-reasons/`, { params: { student: childId } });
  return res.data;
}

export async function parentUpdateAttendanceReason(
  reasonId: string,
  body: { reason_category: string; note: string; parent_confirmed: boolean }
) {
  const res = await apiClient.patch(`/api/attendance-reasons/${reasonId}/parent-update/`, body);
  return res.data;
}

export async function logAbsence(
  _childId: string,
  _body: { date: string; reason?: string }
): Promise<AttendanceLogEntry> {
  throw new Error('Use /api/attendance-reasons/<reason_uuid>/parent-update/ for parent updates.');
}
