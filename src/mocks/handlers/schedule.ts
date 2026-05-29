import { http, HttpResponse } from 'msw';
import { CHILDREN } from '@/lib/mockData';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { ScheduleEntry } from '@/types/schedule';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export const scheduleHandlers = [
  // GET /v1/children/:id/schedule
  http.get(`${BASE}/v1/children/:id/schedule`, ({ params }) => {
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

    const items: ScheduleEntry[] = child.schedule;
    const body: ApiResponse<PaginatedResponse<ScheduleEntry>> = {
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
