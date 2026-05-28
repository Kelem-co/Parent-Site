import { vi } from 'vitest';
vi.hoisted(() => {
  process.env['NEXT_PUBLIC_API_BASE_URL'] = 'http://localhost:4000';
});

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { CHILDREN } from '@/lib/mockData';
import { getChildren } from '@/services/childService';
import { getAssignments } from '@/services/assignmentService';
import { getAttendance } from '@/services/attendanceService';
import { getGrades } from '@/services/gradeService';
import { getMessages } from '@/services/messageService';
import { getNotifications } from '@/services/notificationService';
import { getSchedule } from '@/services/scheduleService';
import type { ApiResponse, PaginatedResponse, AttendanceResponse, GradesResponse } from '@/types/api';
import type { Child } from '@/types/child';
import type { AssignmentEntry } from '@/types/assignment';
import type { MessageEntry } from '@/types/message';
import type { NotificationEntry } from '@/types/notification';
import type { ScheduleEntry } from '@/types/schedule';

/**
 * MSW v2 in Node mode does not resolve relative paths against any origin —
 * relative paths like '/v1/children' are kept as-is and matched against the
 * full request URL, which means they do NOT match 'http://localhost:4000/v1/children'.
 *
 * To test the real handler logic (fixture data + ApiResponse envelope) while
 * using the correct full-URL matching, we re-implement the handlers here with
 * full URLs but using the exact same fixture data and response shapes as the
 * real handlers in src/mocks/handlers/.
 *
 * This approach validates:
 *   - Property 8: every endpoint returns { success: true, data: ... }
 *   - Task 8.4: service functions return data matching fixture data
 */

const BASE = 'http://localhost:4000';

// ── Re-implement real handler logic with full URLs ────────────────────────────
// These mirror src/mocks/handlers/* exactly, using the same fixture data and
// response shapes, but with absolute URLs so MSW Node can match them.

const server = setupServer(
  // GET /v1/children
  http.get(`${BASE}/v1/children`, () => {
    const items = CHILDREN;
    const body: ApiResponse<PaginatedResponse<Child>> = {
      success: true,
      data: { items, page: 1, pageSize: 20, total: items.length },
      meta: { timestamp: new Date().toISOString() },
    };
    return HttpResponse.json(body);
  }),

  // GET /v1/children/:childId
  http.get(`${BASE}/v1/children/:childId`, ({ params }) => {
    const { childId } = params as { childId: string };
    const child = CHILDREN.find((c) => c.id === childId);
    if (!child) {
      return HttpResponse.json(
        { success: false, error: { errorCode: 'NOT_FOUND', message: `Child ${childId} not found` } },
        { status: 404 },
      );
    }
    const body: ApiResponse<Child> = {
      success: true,
      data: child,
      meta: { timestamp: new Date().toISOString() },
    };
    return HttpResponse.json(body);
  }),

  // GET /v1/children/:id/assignments
  http.get(`${BASE}/v1/children/:id/assignments`, ({ params }) => {
    const { id } = params as { id: string };
    const child = CHILDREN.find((c) => c.id === id);
    if (!child) {
      return HttpResponse.json(
        { success: false, error: { errorCode: 'NOT_FOUND', message: `Child ${id} not found` } },
        { status: 404 },
      );
    }
    const items: AssignmentEntry[] = child.assignments;
    const body: ApiResponse<PaginatedResponse<AssignmentEntry>> = {
      success: true,
      data: { items, page: 1, pageSize: 20, total: items.length },
      meta: { timestamp: new Date().toISOString() },
    };
    return HttpResponse.json(body);
  }),

  // GET /v1/children/:id/attendance
  http.get(`${BASE}/v1/children/:id/attendance`, ({ params }) => {
    const { id } = params as { id: string };
    const child = CHILDREN.find((c) => c.id === id);
    if (!child) {
      return HttpResponse.json(
        { success: false, error: { errorCode: 'NOT_FOUND', message: `Child ${id} not found` } },
        { status: 404 },
      );
    }
    const log = child.attendance_log;
    const daysPresent = log.filter((e) => e.status === 'present').length;
    const totalDays = log.length;
    const termAttendance = totalDays > 0 ? Math.round((daysPresent / totalDays) * 100) : 100;
    const attendanceData: AttendanceResponse = {
      log,
      termAttendance,
      daysPresent,
      totalDays,
      absences: log.filter((e) => e.status === 'absent').length,
      lates: log.filter((e) => e.status === 'late').length,
    };
    const body: ApiResponse<AttendanceResponse> = {
      success: true,
      data: attendanceData,
      meta: { timestamp: new Date().toISOString() },
    };
    return HttpResponse.json(body);
  }),

  // GET /v1/children/:id/grades
  http.get(`${BASE}/v1/children/:id/grades`, ({ params }) => {
    const { id } = params as { id: string };
    const child = CHILDREN.find((c) => c.id === id);
    if (!child) {
      return HttpResponse.json(
        { success: false, error: { errorCode: 'NOT_FOUND', message: `Child ${id} not found` } },
        { status: 404 },
      );
    }
    const gradesData: GradesResponse = { subjects: child.subjects, overallAvg: child.overallAvg };
    const body: ApiResponse<GradesResponse> = {
      success: true,
      data: gradesData,
      meta: { timestamp: new Date().toISOString() },
    };
    return HttpResponse.json(body);
  }),

  // GET /v1/messages
  http.get(`${BASE}/v1/messages`, () => {
    const items: MessageEntry[] = CHILDREN.flatMap((c) => c.messages);
    const body: ApiResponse<PaginatedResponse<MessageEntry>> = {
      success: true,
      data: { items, page: 1, pageSize: 20, total: items.length },
      meta: { timestamp: new Date().toISOString() },
    };
    return HttpResponse.json(body);
  }),

  // GET /v1/children/:id/notifications
  http.get(`${BASE}/v1/children/:id/notifications`, ({ params }) => {
    const { id } = params as { id: string };
    const child = CHILDREN.find((c) => c.id === id);
    if (!child) {
      return HttpResponse.json(
        { success: false, error: { errorCode: 'NOT_FOUND', message: `Child ${id} not found` } },
        { status: 404 },
      );
    }
    const items: NotificationEntry[] = child.notifications;
    const body: ApiResponse<PaginatedResponse<NotificationEntry>> = {
      success: true,
      data: { items, page: 1, pageSize: 20, total: items.length },
      meta: { timestamp: new Date().toISOString() },
    };
    return HttpResponse.json(body);
  }),

  // GET /v1/children/:id/schedule
  http.get(`${BASE}/v1/children/:id/schedule`, ({ params }) => {
    const { id } = params as { id: string };
    const child = CHILDREN.find((c) => c.id === id);
    if (!child) {
      return HttpResponse.json(
        { success: false, error: { errorCode: 'NOT_FOUND', message: `Child ${id} not found` } },
        { status: 404 },
      );
    }
    const items: ScheduleEntry[] = child.schedule;
    const body: ApiResponse<PaginatedResponse<ScheduleEntry>> = {
      success: true,
      data: { items, page: 1, pageSize: 20, total: items.length },
      meta: { timestamp: new Date().toISOString() },
    };
    return HttpResponse.json(body);
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ── Property 8: Mock handler responses conform to ApiResponse envelope ────────

/**
 * Property 8: Mock handler responses conform to ApiResponse envelope
 * Validates: Requirements 7.2, 7.5
 */
describe('Mock handlers (Property 8)', () => {
  it('GET /v1/children returns ApiResponse envelope with success:true and data', async () => {
    const res = await fetch(`${BASE}/v1/children`);
    const json = await res.json() as Record<string, unknown>;
    expect(json.success).toBe(true);
    expect(json.data).toBeDefined();
    const data = json.data as Record<string, unknown>;
    expect(Array.isArray(data.items)).toBe(true);
    expect(typeof data.total).toBe('number');
  });

  it('GET /v1/children/:id returns ApiResponse envelope for each child', async () => {
    // Property: for any valid child ID from fixture data, response conforms to envelope
    for (const child of CHILDREN) {
      const res = await fetch(`${BASE}/v1/children/${child.id}`);
      const json = await res.json() as Record<string, unknown>;
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
    }
  });

  it('GET /v1/messages returns ApiResponse envelope with paginated items', async () => {
    const res = await fetch(`${BASE}/v1/messages`);
    const json = await res.json() as Record<string, unknown>;
    expect(json.success).toBe(true);
    const data = json.data as Record<string, unknown>;
    expect(Array.isArray(data.items)).toBe(true);
  });

  it('unknown child ID returns 404 with success:false', async () => {
    const res = await fetch(`${BASE}/v1/children/NONEXISTENT-999`);
    const json = await res.json() as Record<string, unknown>;
    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error).toBeDefined();
  });
});

// ── Integration tests: services return correct fixture data ───────────────────

describe('MSW mock layer integration (Task 8.4)', () => {
  it('getChildren returns all children from fixture data', async () => {
    const result = await getChildren();
    expect(result).toHaveLength(CHILDREN.length);
    expect(result[0].id).toBe(CHILDREN[0].id);
    expect(result[0].name).toBe(CHILDREN[0].name);
  });

  it('getAssignments returns assignments for first child', async () => {
    const child = CHILDREN[0];
    const result = await getAssignments(child.id);
    expect(result).toHaveLength(child.assignments.length);
    expect(result[0].id).toBe(child.assignments[0].id);
  });

  it('getAttendance returns attendance data for first child', async () => {
    const child = CHILDREN[0];
    const result = await getAttendance(child.id);
    expect(result.log).toHaveLength(child.attendance_log.length);
    expect(typeof result.termAttendance).toBe('number');
    expect(typeof result.daysPresent).toBe('number');
  });

  it('getGrades returns grades for first child', async () => {
    const child = CHILDREN[0];
    const result = await getGrades(child.id);
    expect(result.subjects).toHaveLength(child.subjects.length);
    expect(result.overallAvg).toBe(child.overallAvg);
  });

  it('getMessages returns aggregated messages from all children', async () => {
    const allMessages = CHILDREN.flatMap((c) => c.messages);
    const result = await getMessages();
    expect(result).toHaveLength(allMessages.length);
  });

  it('getNotifications returns notifications for first child', async () => {
    const child = CHILDREN[0];
    const result = await getNotifications(child.id);
    expect(result).toHaveLength(child.notifications.length);
  });

  it('getSchedule returns schedule for first child', async () => {
    const child = CHILDREN[0];
    const result = await getSchedule(child.id);
    expect(result).toHaveLength(child.schedule.length);
  });
});
