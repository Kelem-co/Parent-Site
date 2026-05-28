import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendMessage } from '@/services/messageService';
import { queryKeys } from '@/lib/queryKeys';
import type { SendMessageRequest, ApiError } from '@/types/api';
import type { ThreadMessage } from '@/types/message';

export function useSendMessage(threadId: string) {
  const queryClient = useQueryClient();

  return useMutation<ThreadMessage, ApiError, SendMessageRequest>({
    mutationFn: (body: SendMessageRequest) => sendMessage(threadId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messageThread(threadId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.messages() });
    },
  });
}
