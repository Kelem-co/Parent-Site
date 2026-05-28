import { useQuery } from '@tanstack/react-query';
import { getNotifications } from '@/services/notificationService';
import { queryKeys } from '@/lib/queryKeys';
import type { NotificationEntry } from '@/types/notification';
import type { ApiError } from '@/types/api';

export function useNotifications(childId: string) {
  return useQuery<NotificationEntry[], ApiError>({
    queryKey: queryKeys.notifications(childId),
    queryFn: () => getNotifications(childId),
    enabled: Boolean(childId),
  });
}
