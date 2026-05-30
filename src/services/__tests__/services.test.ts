import { vi } from 'vitest';
// Set env var before any module that reads config is imported
vi.hoisted(() => {
  process.env['NEXT_PUBLIC_API_BASE_URL'] = 'http://localhost:4000';
});

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { ApiError, API_ERROR_CODES } from '@/types/api';
import { getChildren, getChild } from '../childService';
import { getAssignments } from '../assignmentService';
import { getAttendance, logAbsence } from '../attendanceService';
import { getGrades } from '../gradeService';
import { getMessages, sendMessage } from '../messageService';
import { getNotifications } from '../notificationService';
import { getSchedule } from '../scheduleService';
import { verifyOtp, requestOtp, completeParentInvitation, refreshToken, logout, getAccessToken } from '../authService';
import { getUserMe, getParentMe, getMyStudents } from '../parentService';

const BASE = 'http://localhost:4000';

// ── MSW server ────────────────────────────────────────────────────────────────
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ── childService ──────────────────────────────────────────────────────────────
describe('childService', () => {
  it('getChildren calls parent students endpoint and returns mapped children', async () => {
    const mockChildren = [{ id: 'STU-001', first_name: 'Test', last_name: 'Child', grade_name: '6', section_name: 'A' }];
    server.use(
      http.get(`${BASE}/api/parents/my-students/`, () => HttpResponse.json(mockChildren)),
      http.get(`${BASE}/api/attendance-summaries/`, () => HttpResponse.json([]))
    );
    const result = await getChildren();
    expect(result[0]?.id).toEqual('STU-001');
  });

  it('getChild returns mapped child by id from parent students endpoint', async () => {
    server.use(
      http.get(`${BASE}/api/parents/my-students/`, () => HttpResponse.json([{ id: 'STU-001', first_name: 'Test', last_name: 'Child', grade_name: '6', section_name: 'A' }])),
      http.get(`${BASE}/api/attendance-summaries/`, () => HttpResponse.json([]))
    );
    const result = await getChild('STU-001');
    expect(result.id).toEqual('STU-001');
  });

  it('getChildren propagates ApiError on failure', async () => {
    server.use(
      http.get(`${BASE}/api/parents/my-students/`, () =>
        HttpResponse.json({ error: { errorCode: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 })
      )
    );
    await expect(getChildren()).rejects.toBeInstanceOf(ApiError);
  });
});

// ── assignmentService ─────────────────────────────────────────────────────────
describe('assignmentService', () => {
  it('getAssignments calls GET /api/children/:id/assignments and returns items', async () => {
    const mockItems = [{ id: 'ASN-001', title: 'Test Assignment' }];
    server.use(
      http.get(`${BASE}/api/children/STU-001/assignments`, () =>
        HttpResponse.json({ success: true, data: { items: mockItems, page: 1, pageSize: 20, total: 1 } })
      )
    );
    const result = await getAssignments('STU-001');
    expect(result).toEqual(mockItems);
  });
});

// ── attendanceService ─────────────────────────────────────────────────────────
describe('attendanceService', () => {
  it('getAttendance calls GET /api/children/:id/attendance and returns response', async () => {
    const mockData = { log: [], termAttendance: 95, daysPresent: 85, totalDays: 90, absences: 3, lates: 2 };
    server.use(
      http.get(`${BASE}/api/children/STU-001/attendance`, () =>
        HttpResponse.json({ success: true, data: mockData })
      )
    );
    const result = await getAttendance('STU-001');
    expect(result).toEqual(mockData);
  });

  it('logAbsence calls POST /api/children/:id/attendance/absence and returns entry', async () => {
    const mockEntry = { date: '2025-06-10', status: 'absent' };
    server.use(
      http.post(`${BASE}/api/children/STU-001/attendance/absence`, () =>
        HttpResponse.json({ success: true, data: mockEntry }, { status: 201 })
      )
    );
    const result = await logAbsence('STU-001', { date: '2025-06-10', reason: 'Sick' });
    expect(result).toEqual(mockEntry);
  });
});

// ── gradeService ──────────────────────────────────────────────────────────────
describe('gradeService', () => {
  it('getGrades calls GET /api/children/:id/grades and returns response', async () => {
    const mockData = { subjects: [], overallAvg: 88 };
    server.use(
      http.get(`${BASE}/api/children/STU-001/grades`, () =>
        HttpResponse.json({ success: true, data: mockData })
      )
    );
    const result = await getGrades('STU-001');
    expect(result).toEqual(mockData);
  });
});

// ── messageService ────────────────────────────────────────────────────────────
describe('messageService', () => {
  it('getMessages calls GET /api/messages and returns items', async () => {
    const mockItems = [{ id: 'M1', teacherName: 'Mr. Test' }];
    server.use(
      http.get(`${BASE}/api/messages`, () =>
        HttpResponse.json({ success: true, data: { items: mockItems, page: 1, pageSize: 20, total: 1 } })
      )
    );
    const result = await getMessages();
    expect(result).toEqual(mockItems);
  });

  it('sendMessage calls POST /api/messages/:threadId/reply and returns message', async () => {
    const mockMsg = { sender: 'parent', text: 'Hello', time: '10:00 AM' };
    server.use(
      http.post(`${BASE}/api/messages/T-01/reply`, () =>
        HttpResponse.json({ success: true, data: mockMsg }, { status: 201 })
      )
    );
    const result = await sendMessage('T-01', { text: 'Hello' });
    expect(result).toEqual(mockMsg);
  });
});

// ── notificationService ───────────────────────────────────────────────────────
describe('notificationService', () => {
  it('getNotifications calls GET /api/children/:id/notifications and returns items', async () => {
    const mockItems = [{ id: 'N1', title: 'Test Notification' }];
    server.use(
      http.get(`${BASE}/api/children/STU-001/notifications`, () =>
        HttpResponse.json({ success: true, data: { items: mockItems, page: 1, pageSize: 20, total: 1 } })
      )
    );
    const result = await getNotifications('STU-001');
    expect(result).toEqual(mockItems);
  });
});

// ── scheduleService ───────────────────────────────────────────────────────────
describe('scheduleService', () => {
  it('getSchedule calls GET /api/children/:id/schedule and returns items', async () => {
    const mockItems = [{ id: 'S1', subject: 'Math' }];
    server.use(
      http.get(`${BASE}/api/children/STU-001/schedule`, () =>
        HttpResponse.json({ success: true, data: { items: mockItems, page: 1, pageSize: 20, total: 1 } })
      )
    );
    const result = await getSchedule('STU-001');
    expect(result).toEqual(mockItems);
  });
});

// ── authService ───────────────────────────────────────────────────────────────
describe('authService', () => {
  it('verifyOtp stores access token and returns mapped AuthResponse', async () => {
    server.use(
      http.post(`${BASE}/auth/otp/verify/`, () =>
        HttpResponse.json({ access: 'tok123', refresh: 'ref123' })
      )
    );
    const result = await verifyOtp({ phone_number: '+251900000000', otp_code: '123456' });
    expect(result.accessToken).toEqual('tok123');
    expect(getAccessToken()).toBe('tok123');
  });

  it('requestOtp calls otp request endpoint', async () => {
    server.use(http.post(`${BASE}/auth/otp/request/`, () => HttpResponse.json({ message: 'OTP sent successfully.' })));
    const result = await requestOtp('+251900000000');
    expect(result.message).toContain('OTP sent');
  });

  it('completeParentInvitation calls complete endpoint', async () => {
    server.use(http.post(`${BASE}/api/parents/complete-invitation/`, () => HttpResponse.json({ message: 'Parent account activated successfully.' })));
    const result = await completeParentInvitation({ uid: 'u', token: 't' });
    expect(result.message).toContain('activated');
  });

  it('refreshToken updates access token', async () => {
    server.use(http.post(`${BASE}/auth/jwt/refresh/`, () => HttpResponse.json({ access: 'tok-refreshed' })));
    const token = await refreshToken();
    expect(token).toEqual('tok-refreshed');
    expect(getAccessToken()).toEqual('tok-refreshed');
  });

  it('logout clears access token and calls queryClient.clear()', async () => {
    server.use(
      http.post(`${BASE}/api/auth/logout`, () =>
        HttpResponse.json({ success: true, data: null })
      )
    );
    const mockQueryClient = { clear: vi.fn() };
    await logout(mockQueryClient as never);
    expect(getAccessToken()).toBeNull();
    expect(mockQueryClient.clear).toHaveBeenCalledOnce();
  });

  it('failed service call propagates ApiError', async () => {
    server.use(
      http.get(`${BASE}/api/children`, () =>
        HttpResponse.json(
          { success: false, error: { errorCode: 'NOT_FOUND', message: 'Not found' } },
          { status: 404 }
        )
      )
    );
    await expect(getChildren()).rejects.toBeInstanceOf(ApiError);
  });
});

describe('parentService', () => {
  it('getUserMe calls /api/users/me/', async () => {
    server.use(http.get(`${BASE}/api/users/me/`, () => HttpResponse.json({ id: 'u1', name: 'Parent User', phone_number: '+251900000000' })));
    const result = await getUserMe();
    expect(result.id).toEqual('u1');
  });

  it('getParentMe calls /api/parents/me/', async () => {
    server.use(http.get(`${BASE}/api/parents/me/`, () => HttpResponse.json({ id: 'p1', user: { id: 'u1', name: 'Parent User', phone_number: '+251900000000' } })));
    const result = await getParentMe();
    expect(result.id).toEqual('p1');
  });

  it('getMyStudents calls /api/parents/my-students/', async () => {
    server.use(http.get(`${BASE}/api/parents/my-students/`, () => HttpResponse.json([{ id: 's1', first_name: 'A', last_name: 'B', section_name: 'A', grade_name: '6' }])));
    const result = await getMyStudents();
    expect(result[0]?.id).toEqual('s1');
  });
});
