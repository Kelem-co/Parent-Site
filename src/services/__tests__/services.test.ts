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
import { login, logout, getAccessToken } from '../authService';

const BASE = 'http://localhost:4000';

// ── MSW server ────────────────────────────────────────────────────────────────
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ── childService ──────────────────────────────────────────────────────────────
describe('childService', () => {
  it('getChildren calls GET /v1/children and returns items', async () => {
    const mockChildren = [{ id: 'STU-001', name: 'Test Child' }];
    server.use(
      http.get(`${BASE}/v1/children`, () =>
        HttpResponse.json({ success: true, data: { items: mockChildren, page: 1, pageSize: 20, total: 1 } })
      )
    );
    const result = await getChildren();
    expect(result).toEqual(mockChildren);
  });

  it('getChild calls GET /v1/children/:id and returns child', async () => {
    const mockChild = { id: 'STU-001', name: 'Test Child' };
    server.use(
      http.get(`${BASE}/v1/children/STU-001`, () =>
        HttpResponse.json({ success: true, data: mockChild })
      )
    );
    const result = await getChild('STU-001');
    expect(result).toEqual(mockChild);
  });

  it('getChildren propagates ApiError on failure', async () => {
    server.use(
      http.get(`${BASE}/v1/children`, () =>
        HttpResponse.json(
          { success: false, error: { errorCode: 'SERVER_ERROR', message: 'Internal error' } },
          { status: 500 }
        )
      )
    );
    await expect(getChildren()).rejects.toBeInstanceOf(ApiError);
  });
});

// ── assignmentService ─────────────────────────────────────────────────────────
describe('assignmentService', () => {
  it('getAssignments calls GET /v1/children/:id/assignments and returns items', async () => {
    const mockItems = [{ id: 'ASN-001', title: 'Test Assignment' }];
    server.use(
      http.get(`${BASE}/v1/children/STU-001/assignments`, () =>
        HttpResponse.json({ success: true, data: { items: mockItems, page: 1, pageSize: 20, total: 1 } })
      )
    );
    const result = await getAssignments('STU-001');
    expect(result).toEqual(mockItems);
  });
});

// ── attendanceService ─────────────────────────────────────────────────────────
describe('attendanceService', () => {
  it('getAttendance calls GET /v1/children/:id/attendance and returns response', async () => {
    const mockData = { log: [], termAttendance: 95, daysPresent: 85, totalDays: 90, absences: 3, lates: 2 };
    server.use(
      http.get(`${BASE}/v1/children/STU-001/attendance`, () =>
        HttpResponse.json({ success: true, data: mockData })
      )
    );
    const result = await getAttendance('STU-001');
    expect(result).toEqual(mockData);
  });

  it('logAbsence calls POST /v1/children/:id/attendance/absence and returns entry', async () => {
    const mockEntry = { date: '2025-06-10', status: 'absent' };
    server.use(
      http.post(`${BASE}/v1/children/STU-001/attendance/absence`, () =>
        HttpResponse.json({ success: true, data: mockEntry }, { status: 201 })
      )
    );
    const result = await logAbsence('STU-001', { date: '2025-06-10', reason: 'Sick' });
    expect(result).toEqual(mockEntry);
  });
});

// ── gradeService ──────────────────────────────────────────────────────────────
describe('gradeService', () => {
  it('getGrades calls GET /v1/children/:id/grades and returns response', async () => {
    const mockData = { subjects: [], overallAvg: 88 };
    server.use(
      http.get(`${BASE}/v1/children/STU-001/grades`, () =>
        HttpResponse.json({ success: true, data: mockData })
      )
    );
    const result = await getGrades('STU-001');
    expect(result).toEqual(mockData);
  });
});

// ── messageService ────────────────────────────────────────────────────────────
describe('messageService', () => {
  it('getMessages calls GET /v1/messages and returns items', async () => {
    const mockItems = [{ id: 'M1', teacherName: 'Mr. Test' }];
    server.use(
      http.get(`${BASE}/v1/messages`, () =>
        HttpResponse.json({ success: true, data: { items: mockItems, page: 1, pageSize: 20, total: 1 } })
      )
    );
    const result = await getMessages();
    expect(result).toEqual(mockItems);
  });

  it('sendMessage calls POST /v1/messages/:threadId/reply and returns message', async () => {
    const mockMsg = { sender: 'parent', text: 'Hello', time: '10:00 AM' };
    server.use(
      http.post(`${BASE}/v1/messages/T-01/reply`, () =>
        HttpResponse.json({ success: true, data: mockMsg }, { status: 201 })
      )
    );
    const result = await sendMessage('T-01', { text: 'Hello' });
    expect(result).toEqual(mockMsg);
  });
});

// ── notificationService ───────────────────────────────────────────────────────
describe('notificationService', () => {
  it('getNotifications calls GET /v1/children/:id/notifications and returns items', async () => {
    const mockItems = [{ id: 'N1', title: 'Test Notification' }];
    server.use(
      http.get(`${BASE}/v1/children/STU-001/notifications`, () =>
        HttpResponse.json({ success: true, data: { items: mockItems, page: 1, pageSize: 20, total: 1 } })
      )
    );
    const result = await getNotifications('STU-001');
    expect(result).toEqual(mockItems);
  });
});

// ── scheduleService ───────────────────────────────────────────────────────────
describe('scheduleService', () => {
  it('getSchedule calls GET /v1/children/:id/schedule and returns items', async () => {
    const mockItems = [{ id: 'S1', subject: 'Math' }];
    server.use(
      http.get(`${BASE}/v1/children/STU-001/schedule`, () =>
        HttpResponse.json({ success: true, data: { items: mockItems, page: 1, pageSize: 20, total: 1 } })
      )
    );
    const result = await getSchedule('STU-001');
    expect(result).toEqual(mockItems);
  });
});

// ── authService ───────────────────────────────────────────────────────────────
describe('authService', () => {
  it('login stores access token and returns AuthResponse', async () => {
    const mockAuth = { accessToken: 'tok123', expiresIn: 900, parentId: 'P1', parentName: 'Test Parent' };
    server.use(
      http.post(`${BASE}/v1/auth/login`, () =>
        HttpResponse.json({ success: true, data: mockAuth })
      )
    );
    const result = await login({ email: 'test@test.com', password: 'pass' });
    expect(result).toEqual(mockAuth);
    expect(getAccessToken()).toBe('tok123');
  });

  it('logout clears access token and calls queryClient.clear()', async () => {
    server.use(
      http.post(`${BASE}/v1/auth/logout`, () =>
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
      http.get(`${BASE}/v1/children`, () =>
        HttpResponse.json(
          { success: false, error: { errorCode: 'NOT_FOUND', message: 'Not found' } },
          { status: 404 }
        )
      )
    );
    await expect(getChildren()).rejects.toBeInstanceOf(ApiError);
  });
});
