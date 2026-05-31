import { apiClient } from '@/lib/apiClient';
import type {
  ChatMessage,
  ChatThread,
  CreateChatThreadRequest,
  MessageEntry,
  MessageThread,
  MarkReadResponse,
  ResolveThreadResponse,
  SendChatMessageRequest,
  ThreadMessage,
} from '@/types/message';

type PaginatedThreadsResponse = {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: ChatThread[];
};

export async function listChatThreads(): Promise<ChatThread[]> {
  const res = await apiClient.get<ChatThread[] | PaginatedThreadsResponse>('/api/chat-threads/');
  return Array.isArray(res.data) ? res.data : res.data.results ?? [];
}

export async function createChatThread(
  body: CreateChatThreadRequest
): Promise<ChatThread> {
  const res = await apiClient.post<ChatThread>('/api/chat-threads/', body);
  return res.data;
}

export async function listThreadMessages(threadId: string): Promise<ChatMessage[]> {
  const res = await apiClient.get<ChatMessage[]>(
    `/api/chat-threads/${threadId}/messages/`
  );
  return res.data;
}

export async function resolveChatThread(params: {
  studentId: string;
  teacherId?: string;
  parentId?: string;
}): Promise<ResolveThreadResponse> {
  const res = await apiClient.get<ResolveThreadResponse>('/api/chat-threads/resolve/', {
    params: {
      student: params.studentId,
      teacher: params.teacherId,
      parent: params.parentId,
    },
  });
  return res.data;
}

export async function sendChatMessage(
  threadId: string,
  body: SendChatMessageRequest
): Promise<ChatMessage> {
  const res = await apiClient.post<ChatMessage>(
    `/api/chat-threads/${threadId}/messages/`,
    body
  );
  return res.data;
}

export async function markThreadRead(
  threadId: string,
  messageId?: string
): Promise<MarkReadResponse> {
  const res = await apiClient.post<MarkReadResponse>(
    `/api/chat-threads/${threadId}/mark-read/`,
    messageId ? { message_id: messageId } : {}
  );
  return res.data;
}

// Legacy compatibility wrappers kept so older tests/mocks still type-check.
export async function getMessages(): Promise<MessageEntry[]> {
  const threads = await listChatThreads();
  return threads.map((thread) => ({
    id: thread.id,
    teacherName: thread.teacher,
    teacherInitials: 'TE',
    subject: 'Conversation',
    preview: '',
    time: thread.updated_at,
    unread: thread.unread_count > 0,
  }));
}

export async function getMessageThread(threadId: string): Promise<MessageThread> {
  const messages = await listThreadMessages(threadId);
  return {
    dateGroup: 'Conversation',
    messages: messages.map<ThreadMessage>((message) => ({
      sender: 'teacher',
      text: message.text,
      time: message.created_at,
      readAt: message.read_by_ids.length ? message.updated_at : undefined,
    })),
  };
}

export async function sendMessage(
  threadId: string,
  body: SendChatMessageRequest
): Promise<ChatMessage> {
  return sendChatMessage(threadId, body);
}
