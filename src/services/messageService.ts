import { apiClient } from '@/lib/apiClient';
import type { MessageEntry, MessageThread, ThreadMessage } from '@/types/message';
import type { ApiResponse, PaginatedResponse, SendMessageRequest } from '@/types/api';

export async function getMessages(
  params?: { page?: number; pageSize?: number }
): Promise<MessageEntry[]> {
  const res = await apiClient.get<ApiResponse<PaginatedResponse<MessageEntry>>>(
    '/v1/messages',
    { params }
  );
  return res.data.data.items;
}

export async function getMessageThread(threadId: string): Promise<MessageThread> {
  const res = await apiClient.get<ApiResponse<MessageThread>>(
    `/v1/messages/${threadId}`
  );
  return res.data.data;
}

export async function sendMessage(
  threadId: string,
  body: SendMessageRequest
): Promise<ThreadMessage> {
  const res = await apiClient.post<ApiResponse<ThreadMessage>>(
    `/v1/messages/${threadId}/reply`,
    body
  );
  return res.data.data;
}
