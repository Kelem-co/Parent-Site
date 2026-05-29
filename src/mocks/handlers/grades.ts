import { http, HttpResponse } from 'msw';
import { CHILDREN } from '@/lib/mockData';
import type { ApiResponse, GradesResponse } from '@/types/api';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export const gradesHandlers = [
  // GET /v1/children/:id/grades
  http.get(`${BASE}/v1/children/:id/grades`, ({ params }) => {
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

    const gradesData: GradesResponse = {
      subjects: child.subjects,
      overallAvg: child.overallAvg,
    };

    const body: ApiResponse<GradesResponse> = {
      success: true,
      data: gradesData,
      meta: { timestamp: new Date().toISOString() },
    };
    return HttpResponse.json(body);
  }),
];
