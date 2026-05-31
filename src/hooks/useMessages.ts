import { useQuery } from '@tanstack/react-query';
import { listThreadMessages } from '@/services/messageService';
import { queryKeys } from '@/lib/queryKeys';
import type { ApiError } from '@/types/api';
import type { ChatMessage } from '@/types/message';

export function useMessages(threadId: string | null) {
  return useQuery<ChatMessage[], ApiError>({
    queryKey: threadId ? queryKeys.chatThreadMessages(threadId) : ['chat', 'threads', 'inactive'],
    queryFn: () => listThreadMessages(threadId as string),
    enabled: Boolean(threadId),
  });
}
