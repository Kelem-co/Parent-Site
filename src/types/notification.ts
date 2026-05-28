export interface NotificationEntry {
  id: string;
  title: string;
  type: 'urgent' | 'info' | 'success' | string;
  category: 'attendance' | 'grade' | 'announcement' | 'system' | string;
  time: string;
  read: boolean;
  detail: string;
  icon?: string;
  color?: string;
}
