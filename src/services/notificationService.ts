import { apiClient } from '@/lib/apiClient';
import type { NotificationEntry } from '@/types/notification';

export async function getNotifications(
  _childId: string,
  _params?: { read?: boolean; page?: number; pageSize?: number }
): Promise<NotificationEntry[]> {
  const res = await apiClient.get<Array<{
    id: string;
    subject: string;
    message: string;
    is_urgent: boolean;
    scheduled_at: string;
  }>>(
    `/api/announcements/`,
    { params: { target_roles: 'PARENTS', is_urgent: true, ordering: '-created_at' } }
  );
  return res.data.map((n) => ({
    id: n.id,
    title: n.subject,
    type: n.is_urgent ? 'urgent' : 'info',
    category: 'announcement',
    time: n.scheduled_at,
    read: false,
    detail: n.message,
    color: n.is_urgent ? 'red' : 'blue',
  }));
}
