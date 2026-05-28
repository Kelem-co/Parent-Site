export interface ThreadMessage {
  sender: 'teacher' | 'parent';
  text: string;
  time: string;
  readAt?: string;
}

export interface MessageThread {
  dateGroup: string;
  messages: ThreadMessage[];
}

export interface MessageEntry {
  id: string;
  teacherName: string;
  teacherInitials: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  avatarColor?: string;
}
