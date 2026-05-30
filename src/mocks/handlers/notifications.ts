import { http, HttpResponse } from 'msw';
import { CHILDREN } from '@/lib/mockData';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { NotificationEntry } from '@/types/notification';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export const notificationsHandlers = [
  // GET /api/children/:id/notifications
  http.get(`${BASE}/api/children/:id/notifications`, ({ params }) => {
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

    const items: NotificationEntry[] = child.notifications;
    const body: ApiResponse<PaginatedResponse<NotificationEntry>> = {
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
