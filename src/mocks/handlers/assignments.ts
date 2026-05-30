import { http, HttpResponse } from 'msw';
import { CHILDREN } from '@/lib/mockData';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { AssignmentEntry, HomeworkEntry } from '@/types/assignment';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export const assignmentsHandlers = [
  // GET /api/children/:id/assignments
  http.get(`${BASE}/api/children/:id/assignments`, ({ params }) => {
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

    const items: AssignmentEntry[] = child.assignments;
    const body: ApiResponse<PaginatedResponse<AssignmentEntry>> = {
      success: true,
      data: {
        items,
        page: 1,
        pageSize: 20,
        total: items.length,
      },
      meta: { timestamp: new Date().toISOString() },
    };
    return HttpResponse.json(body);
  }),

  // GET /api/children/:id/homework
  http.get(`${BASE}/api/children/:id/homework`, ({ params }) => {
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

    const items: HomeworkEntry[] = child.homework;
    const body: ApiResponse<PaginatedResponse<HomeworkEntry>> = {
      success: true,
      data: {
        items,
        page: 1,
        pageSize: 20,
        total: items.length,
      },
      meta: { timestamp: new Date().toISOString() },
    };
    return HttpResponse.json(body);
  }),
];
