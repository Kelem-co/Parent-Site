import { http, HttpResponse } from 'msw';
import { CHILDREN } from '@/lib/mockData';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

function buildStudentAttendanceRows(studentId: string) {
  const child = CHILDREN.find((entry) => entry.id === studentId);
  if (!child) {
    return null;
  }

  return child.attendance_log
    .filter((entry) => entry.status !== 'no-school' && entry.status !== 'empty')
    .map((entry, index) => ({
      id: `attendance-${studentId}-${index}`,
      organization: 'org-1',
      branch: child.branchId,
      academic_year: 'ay-1',
      section: child.section,
      student: studentId,
      recorded_by: 'teacher-1',
      date: entry.date,
      status: entry.status.toUpperCase(),
      remarks: '',
      client_side_id: `client-${studentId}-${index}`,
      reason: null,
      created_at: '2026-05-30T00:00:00Z',
      updated_at: '2026-05-30T00:00:00Z',
      student_name: child.name,
      student_roll_no: '12',
      section_name: child.section,
      grade_name: child.grade,
      academic_year_name: '2025/2026',
      branch_name: child.branchName,
      recorded_by_name: 'Teacher One',
      status_display: entry.status.charAt(0).toUpperCase() + entry.status.slice(1),
      needs_reason: entry.status === 'absent' || entry.status === 'late',
    }));
}

export const attendanceHandlers = [
  http.get(`${BASE}/api/attendance/by-student/`, ({ request }) => {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('student') ?? '';
    const rows = buildStudentAttendanceRows(studentId);

    if (!rows) {
      return HttpResponse.json(
        { detail: `Student with id ${studentId} not found` },
        { status: 404 },
      );
    }

    return HttpResponse.json(rows);
  }),

  http.get(`${BASE}/api/attendance-summaries/`, ({ request }) => {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('student');
    const child = CHILDREN.find((entry) => entry.id === studentId);

    if (!child) {
      return HttpResponse.json([]);
    }

    const rows = child.attendance_log.filter(
      (entry) => entry.status !== 'no-school' && entry.status !== 'empty',
    );
    const total_present = rows.filter((entry) => entry.status === 'present').length;
    const total_absent = rows.filter((entry) => entry.status === 'absent').length;
    const total_late = rows.filter((entry) => entry.status === 'late').length;
    const total_excused = rows.filter((entry) => entry.status === 'excused').length;
    const total_school_days = rows.length;

    return HttpResponse.json([
      {
        id: `summary-${studentId}`,
        organization: 'org-1',
        student: studentId,
        student_name: child.name,
        academic_year: 'ay-1',
        academic_year_name: '2025/2026',
        total_present,
        total_absent,
        total_late,
        total_excused,
        total_school_days,
        attendance_rate: total_school_days > 0
          ? Math.round(((total_present + total_excused) / total_school_days) * 100)
          : 0,
        last_updated: '2026-05-30T00:00:00Z',
      },
    ]);
  }),

  http.get(`${BASE}/api/attendance-reasons/`, ({ request }) => {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('student');
    const rows = buildStudentAttendanceRows(studentId ?? '');

    if (!rows) {
      return HttpResponse.json([]);
    }

    const reasons = rows
      .filter((row) => row.status === 'ABSENT' || row.status === 'LATE')
      .map((row, index) => ({
        id: `reason-${row.id}`,
        organization: 'org-1',
        attendance: row.id,
        reason_category: index % 2 === 0 ? 'SICKNESS' : 'UNKNOWN',
        reason_category_display: index % 2 === 0 ? 'Sickness' : 'Unknown',
        note: index % 2 === 0 ? 'Parent note on file' : '',
        parent_confirmed: index % 2 === 0,
        created_at: '2026-05-30T00:00:00Z',
        updated_at: '2026-05-30T00:00:00Z',
      }));

    return HttpResponse.json(reasons);
  }),

  http.post(`${BASE}/api/attendance-reasons/parent-create/`, async ({ request }) => {
    const body = await request.json() as {
      attendance: string;
      reason_category: string;
      note: string;
      parent_confirmed: boolean;
    };

    return HttpResponse.json({
      id: `reason-${body.attendance}`,
      attendance: body.attendance,
      reason_category: body.reason_category,
      note: body.note,
      parent_confirmed: body.parent_confirmed,
      updated_at: '2026-05-30T00:00:00Z',
    });
  }),

  http.patch(`${BASE}/api/attendance-reasons/:id/parent-update/`, async ({ params, request }) => {
    const body = await request.json() as {
      reason_category: string;
      note: string;
      parent_confirmed: boolean;
    };

    return HttpResponse.json({
      id: params.id,
      reason_category: body.reason_category,
      note: body.note,
      parent_confirmed: body.parent_confirmed,
      updated_at: '2026-05-30T00:00:00Z',
    });
  }),
];
