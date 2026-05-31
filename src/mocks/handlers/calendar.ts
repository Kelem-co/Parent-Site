import { http, HttpResponse } from 'msw';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export const calendarHandlers = [
  http.get(`${BASE}/api/calendar-documents/current/`, ({ request }) => {
    const url = new URL(request.url);
    const organization = url.searchParams.get('organization');
    const branch = url.searchParams.get('branch');

    if (!organization || !branch) {
      return HttpResponse.json(
        { detail: 'organization and branch are required.' },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      id: 'calendar-1',
      organization,
      branch,
      academic_year: null,
      media_file: 'media-1',
      file_name: 'academic-calendar.pdf',
      created_at: '2026-05-30T10:29:12.191063Z',
      updated_at: '2026-05-30T13:17:05.788647Z',
    });
  }),

  http.get(`${BASE}/api/media/:id`, ({ params }) =>
    HttpResponse.json({
      data: {
        id: params['id'],
        key: 'media/key',
        bucket: 'bucket',
        file_name: 'academic-calendar.pdf',
        content_type: 'application/pdf',
        size: 100,
        etag: 'etag',
        status: 'UPLOADED',
        uploaded_by: 'user-1',
        created_at: '2026-05-30T10:29:12.191063Z',
        updated_at: '2026-05-30T13:17:05.788647Z',
        download_url: 'https://example.com/calendar.pdf',
      },
    })
  ),
];
