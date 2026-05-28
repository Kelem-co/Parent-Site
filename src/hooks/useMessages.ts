import { useQuery } from '@tanstack/react-query';
import { getMessages } from '@/services/messageService';
import { queryKeys } from '@/lib/queryKeys';
import type { MessageEntry } from '@/types/message';
import type { ApiError } from '@/types/api';

export function useMessages() {
  return useQuery<MessageEntry[], ApiError>({
    queryKey: queryKeys.messages(),
    queryFn: () => getMessages(),
  });
}
