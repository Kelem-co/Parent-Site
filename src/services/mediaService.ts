import { apiClient } from '@/lib/apiClient';
import type {
  MediaFileResponse,
} from '@/types/api';
import type {
  MediaUploadInit,
  MultipartCompleteResponse,
  MultipartPartUrl,
  MultipartUploadPart,
} from '@/types/message';

function normalizeEtag(etag: string | null): string {
  return (etag ?? '').replace(/^"+|"+$/g, '');
}

export async function initMultipartUpload(file: File): Promise<MediaUploadInit> {
  const res = await apiClient.post<MediaUploadInit>('/api/media/upload', {
    file_name: file.name,
    content_type: file.type || 'application/octet-stream',
  });
  return res.data;
}

export async function getMultipartPartUrl(
  mediaId: string,
  uploadId: string,
  partNumber: number
): Promise<MultipartPartUrl> {
  const res = await apiClient.post<MultipartPartUrl>(
    `/api/media/${mediaId}/multipart/part-url`,
    { upload_id: uploadId, part_number: partNumber }
  );
  return res.data;
}

export async function completeMultipartUpload(
  mediaId: string,
  uploadId: string,
  parts: MultipartUploadPart[]
): Promise<MultipartCompleteResponse> {
  const res = await apiClient.post<MultipartCompleteResponse>(
    `/api/media/${mediaId}/multipart/complete`,
    { upload_id: uploadId, parts }
  );
  return res.data;
}

export async function getMediaFile(mediaId: string): Promise<MediaFileResponse> {
  const res = await apiClient.get<{ data: MediaFileResponse } | MediaFileResponse>(
    `/api/media/${mediaId}`
  );
  return 'data' in res.data ? res.data.data : res.data;
}

export async function uploadFileToMedia(file: File): Promise<string> {
  const init = await initMultipartUpload(file);
  const part = await getMultipartPartUrl(init.id, init.upload_id, 1);
  const putResponse = await fetch(part.presigned_url, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });

  if (!putResponse.ok) {
    throw new Error('Failed to upload attachment.');
  }

  const etag = normalizeEtag(putResponse.headers.get('etag'));
  if (!etag) {
    throw new Error('Upload completed but attachment verification failed.');
  }

  await completeMultipartUpload(init.id, init.upload_id, [
    { part_number: 1, etag },
  ]);

  return init.id;
}
