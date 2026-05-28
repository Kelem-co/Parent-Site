import { http, HttpResponse } from 'msw';
import { CHILDREN } from '@/lib/mockData';
import type { ApiResponse, AttendanceResponse } from '@/types/api';
import type { AttendanceLogEntry } from '@/types/child';

export const attendanceHandlers = [
  // GET /v1/children/:id/attendance
  http.get('/v1/children/:id/attendance', ({ params }) => {
    const { id } = params as { id: string };
    const child = CHILDREN.find((c) => c.id === id);

    if (!child) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            errorCode: 'NOT_FOUND',
            message: `Child with id ${id} not found`,
            details: { childId: id },
          },
        },
        { status: 404 },
      );
    }

    const log = child.attendance_log;
    const absences = log.filter((e) => e.status === 'absent').length;
    const lates = log.filter((e) => e.status === 'late').length;
    const daysPresent = log.filter((e) => e.status === 'present').length;
    const totalDays = log.length;
    const termAttendance = totalDays > 0 ? Math.round((daysPresent / totalDays) * 100) : 100;

    const attendanceData: AttendanceResponse = {
      log,
      termAttendance,
      daysPresent,
      totalDays,
      absences,
      lates,
    };

    const body: ApiResponse<AttendanceResponse> = {
      success: true,
      data: attendanceData,
      meta: { timestamp: new Date().toISOString() },
    };
    return HttpResponse.json(body);
  }),

  // POST /v1/children/:id/attendance/absence
  http.post('/v1/children/:id/attendance/absence', async ({ params, request }) => {
    const { id } = params as { id: string };
    const child = CHILDREN.find((c) => c.id === id);

    if (!child) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            errorCode: 'NOT_FOUND',
            message: `Child with id ${id} not found`,
            details: { childId: id },
          },
        },
        { status: 404 },
      );
    }

    const reqBody = (await request.json()) as { date?: string; reason?: string };
    const date = reqBody?.date ?? new Date().toISOString().split('T')[0];

    const newEntry: AttendanceLogEntry = {
      date,
      status: 'absent',
    };

    const body: ApiResponse<AttendanceLogEntry> = {
      success: true,
      data: newEntry,
      meta: { timestamp: new Date().toISOString() },
    };
    return HttpResponse.json(body, { status: 201 });
  }),
];
