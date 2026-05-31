import { apiClient } from '@/lib/apiClient';
import type { CalendarDocumentResponse, MediaFileResponse } from '@/types/api';

export interface CurrentCalendarDocument {
  id: string;
  organizationId: string;
  branchId: string;
  academicYearId: string | null;
  mediaFileId: string | null;
  fileName: string | null;
  downloadUrl: string | null;
}

export async function getCurrentCalendarDocument(params: {
  organization: string;
  branch: string;
}): Promise<CurrentCalendarDocument> {
  const calendarRes = await apiClient.get<CalendarDocumentResponse>(
    '/api/calendar-documents/current/',
    { params },
  );

  const document = calendarRes.data;
  let downloadUrl: string | null = null;

  if (document.media_file) {
    const mediaRes = await apiClient.get<{ data: MediaFileResponse }>(
      `/api/media/${document.media_file}`,
    );
    downloadUrl = mediaRes.data.data.download_url;
  }

  return {
    id: document.id,
    organizationId: document.organization,
    branchId: document.branch,
    academicYearId: document.academic_year,
    mediaFileId: document.media_file,
    fileName: document.file_name,
    downloadUrl,
  };
}
