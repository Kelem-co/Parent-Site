import { apiClient } from '@/lib/apiClient';
import type {
  AttendanceReasonEntry,
  AttendanceRecordEntry,
  AttendanceResponse,
  AttendanceSummaryEntry,
} from '@/types/api';

interface PaginatedResponse<T> {
  results: T[];
}

interface AttendanceRecordApi {
  id: string;
  date: string;
  status: string;
  status_display: string;
  remarks: string;
  needs_reason: boolean;
  student_name: string;
  student_roll_no: string;
  section_name: string;
  grade_name: string;
  academic_year_name: string;
  branch_name: string;
  recorded_by_name: string | null;
}

interface AttendanceSummaryApi {
  id: string;
  student: string;
  student_name: string;
  academic_year: string;
  academic_year_name: string;
  total_present: number;
  total_absent: number;
  total_late: number;
  total_excused: number;
  total_school_days: number;
  attendance_rate: number;
  last_updated: string;
}

interface AttendanceReasonApi {
  id: string;
  attendance: string;
  reason_category: string;
  reason_category_display?: string;
  note: string;
  parent_confirmed: boolean;
  confirmed_at?: string | null;
  confirmed_by_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

function normalizeList<T>(data: T[] | PaginatedResponse<T> | { data?: unknown }): T[] {
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray((data as PaginatedResponse<T>).results)) {
    return (data as PaginatedResponse<T>).results;
  }
  if (Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: T[] }).data;
  }
  return [];
}

function normalizeStatus(status: string): AttendanceRecordEntry['status'] {
  switch (status.toUpperCase()) {
    case 'ABSENT':
      return 'absent';
    case 'LATE':
      return 'late';
    case 'EXCUSED':
      return 'excused';
    default:
      return 'present';
  }
}

function mapReason(item: AttendanceReasonApi): AttendanceReasonEntry {
  return item;
}

function mapRecord(
  item: AttendanceRecordApi,
  reasonsByAttendanceId: Map<string, AttendanceReasonEntry>,
): AttendanceRecordEntry {
  return {
    id: item.id,
    date: item.date,
    status: normalizeStatus(item.status),
    statusDisplay: item.status_display,
    remarks: item.remarks,
    needsReason: item.needs_reason,
    studentName: item.student_name,
    studentRollNo: item.student_roll_no,
    sectionName: item.section_name,
    gradeName: item.grade_name,
    academicYearName: item.academic_year_name,
    branchName: item.branch_name,
    recordedByName: item.recorded_by_name,
    reason: reasonsByAttendanceId.get(item.id) ?? null,
  };
}

function mapSummary(item: AttendanceSummaryApi): AttendanceSummaryEntry {
  return {
    id: item.id,
    student: item.student,
    studentName: item.student_name,
    academicYear: item.academic_year,
    academicYearName: item.academic_year_name,
    totalPresent: item.total_present,
    totalAbsent: item.total_absent,
    totalLate: item.total_late,
    totalExcused: item.total_excused,
    totalSchoolDays: item.total_school_days,
    attendanceRate: item.attendance_rate,
    lastUpdated: item.last_updated,
  };
}

function derivePolicyStanding(
  unexcusedAbsences: number,
): AttendanceResponse['summary']['policyStanding'] {
  if (unexcusedAbsences >= 5) {
    return 'Action Needed';
  }
  if (unexcusedAbsences >= 3) {
    return 'Watch';
  }
  return 'On Track';
}

export async function getAttendance(
  childId: string,
  params?: { academic_year?: string }
): Promise<AttendanceResponse> {
  const [logRes, summaryRes, reasonsRes] = await Promise.all([
    apiClient.get<AttendanceRecordApi[] | PaginatedResponse<AttendanceRecordApi>>(
      `/api/attendance/by-student/`,
      { params: { student: childId, academic_year: params?.academic_year } }
    ),
    apiClient.get<AttendanceSummaryApi[] | PaginatedResponse<AttendanceSummaryApi>>(
      `/api/attendance-summaries/`,
      { params: { student: childId } }
    ),
    apiClient.get<AttendanceReasonApi[] | PaginatedResponse<AttendanceReasonApi>>(
      `/api/attendance-reasons/`,
      { params: { student: childId } }
    ),
  ]);

  const reasons = normalizeList(reasonsRes.data).map(mapReason);
  const reasonsByAttendanceId = new Map(
    reasons.map((reason) => [reason.attendance, reason] as const),
  );
  const records = normalizeList(logRes.data).map((row) =>
    mapRecord(row, reasonsByAttendanceId),
  );
  const summary = normalizeList(summaryRes.data).map(mapSummary)[0];
  const totalDays = summary?.totalSchoolDays ?? 0;
  const daysPresent = summary?.totalPresent ?? 0;
  const absences = summary?.totalAbsent ?? 0;
  const lates = summary?.totalLate ?? 0;
  const excused = summary?.totalExcused ?? 0;
  const pendingReasons = records.filter(
    (record) => record.needsReason && !record.reason?.parent_confirmed,
  ).length;
  const unexcusedAbsences = records.filter(
    (record) => record.status === 'absent' && !record.reason?.parent_confirmed,
  ).length;

  return {
    summary: {
      termAttendance: summary?.attendanceRate ?? 0,
      daysPresent,
      totalDays,
      absences,
      lates,
      excused,
      pendingReasons,
      unexcusedAbsences,
      policyStanding: derivePolicyStanding(unexcusedAbsences),
    },
    records,
    reasons,
  };
}

export async function getAttendanceReasons(childId: string) {
  const res = await apiClient.get(`/api/attendance-reasons/`, { params: { student: childId } });
  return normalizeList(res.data).map(mapReason);
}

export async function parentUpdateAttendanceReason(
  reasonId: string,
  body: { reason_category: string; note: string; parent_confirmed: boolean }
) {
  const res = await apiClient.patch(`/api/attendance-reasons/${reasonId}/parent-update/`, body);
  return res.data;
}

export async function parentCreateAttendanceReason(
  body: {
    attendance: string;
    reason_category: string;
    note: string;
    parent_confirmed: boolean;
  },
) {
  const res = await apiClient.post(`/api/attendance-reasons/parent-create/`, body);
  return res.data;
}

export async function logAbsence(
  params: { attendanceId: string; reasonId?: string | null },
  body: { reason: string; note?: string }
): Promise<AttendanceReasonEntry> {
  if (params.reasonId) {
    return parentUpdateAttendanceReason(params.reasonId, {
      reason_category: body.reason,
      note: body.note ?? '',
      parent_confirmed: true,
    });
  }

  return parentCreateAttendanceReason({
    attendance: params.attendanceId,
    reason_category: body.reason,
    note: body.note ?? '',
    parent_confirmed: true,
  });
}
