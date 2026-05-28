import { http, HttpResponse } from 'msw';
import { CHILDREN } from '@/lib/mockData';
import type { ApiResponse, PaginatedResponse, SendMessageRequest } from '@/types/api';
import type { MessageEntry, MessageThread, ThreadMessage } from '@/types/message';

export const messagesHandlers = [
  // GET /v1/messages — aggregate all children's messages
  http.get('/v1/messages', () => {
    const items: MessageEntry[] = CHILDREN.flatMap((child) => child.messages);

    const body: ApiResponse<PaginatedResponse<MessageEntry>> = {
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

  // GET /v1/messages/:threadId — get a full message thread
  http.get('/v1/messages/:threadId', ({ params }) => {
    const { threadId } = params as { threadId: string };

    // Find the matching message across all children
    const allMessages = CHILDREN.flatMap((child) => child.messages);
    const message = allMessages.find((m) => m.id === threadId);

    if (!message) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            errorCode: 'NOT_FOUND',
            message: `Message thread ${threadId} not found`,
            details: { threadId },
          },
        },
        { status: 404 },
      );
    }

    const thread: MessageThread = {
      dateGroup: 'Today',
      messages: [
        {
          sender: 'teacher',
          text: message.preview,
          time: message.time,
        },
      ],
    };

    const body: ApiResponse<MessageThread> = {
      success: true,
      data: thread,
      meta: { timestamp: new Date().toISOString() },
    };
    return HttpResponse.json(body);
  }),

  // POST /v1/messages/:threadId/reply — send a reply
  http.post('/v1/messages/:threadId/reply', async ({ request }) => {
    const reqBody = (await request.json()) as SendMessageRequest;

    const newMessage: ThreadMessage = {
      sender: 'parent',
      text: reqBody.text,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    const body: ApiResponse<ThreadMessage> = {
      success: true,
      data: newMessage,
      meta: { timestamp: new Date().toISOString() },
    };
    return HttpResponse.json(body, { status: 201 });
  }),
];
