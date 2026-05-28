import { childrenHandlers } from './children';
import { assignmentsHandlers } from './assignments';
import { attendanceHandlers } from './attendance';
import { gradesHandlers } from './grades';
import { messagesHandlers } from './messages';
import { notificationsHandlers } from './notifications';
import { scheduleHandlers } from './schedule';

export const handlers = [
  ...childrenHandlers,
  ...assignmentsHandlers,
  ...attendanceHandlers,
  ...gradesHandlers,
  ...messagesHandlers,
  ...notificationsHandlers,
  ...scheduleHandlers,
];
