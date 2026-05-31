import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { sendChatMessage } from '@/services/messageService';
import type { ApiError } from '@/types/api';
import type { ChatMessage, SendChatMessageRequest } from '@/types/message';

export function useSendMessage(threadId: string) {
  const queryClient = useQueryClient();

  return useMutation<ChatMessage, ApiError, SendChatMessageRequest>({
    mutationFn: (body) => sendChatMessage(threadId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatThreadMessages(threadId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chatThreads() });
    },
  });
}
