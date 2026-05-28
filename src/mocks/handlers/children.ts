import { http, HttpResponse } from 'msw';
import { CHILDREN } from '@/lib/mockData';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { Child } from '@/types/child';

export const childrenHandlers = [
  // GET /v1/children — list all children
  http.get('/v1/children', () => {
    const items = CHILDREN;
    const body: ApiResponse<PaginatedResponse<Child>> = {
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

  // GET /v1/children/:childId — get a single child
  http.get('/v1/children/:childId', ({ params }) => {
    const { childId } = params as { childId: string };
    const child = CHILDREN.find((c) => c.id === childId);

    if (!child) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            errorCode: 'NOT_FOUND',
            message: `Child with id ${childId} not found`,
            details: { childId },
          },
        },
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
];
