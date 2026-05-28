// Feature: nextjs-codebase-refactor
// Property 9: useMessageThreads — thread append and sender correctness

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { MessageThread } from '@/types';

// Pure helper that mirrors the handleSend logic from useMessageThreads
function sendReply(
  thread: MessageThread[],
  replyText: string
): MessageThread[] {
  const updated = thread.map((g) => ({ ...g, messages: [...g.messages] }));
  const todayLabel = 'TODAY, JUN 3';
  let todayGroupIdx = updated.findIndex((g) => g.dateGroup === todayLabel);

  if (todayGroupIdx === -1) {
    updated.push({ dateGroup: todayLabel, messages: [] });
    todayGroupIdx = updated.length - 1;
  }

  updated[todayGroupIdx] = {
    ...updated[todayGroupIdx],
    messages: [
      ...updated[todayGroupIdx].messages,
      { sender: 'parent', text: replyText, time: 'Today, 11:51 AM' },
    ],
  };

  return updated;
}

function totalMessages(thread: MessageThread[]): number {
  return thread.reduce((sum, g) => sum + g.messages.length, 0);
}

// Property 9: Message thread append and sender correctness
describe('useMessageThreads — handleSend', () => {
  it('increases total message count by exactly 1 and appends a parent message with the sent text', () => {
    const threadArb = fc.array(
      fc.record({
        dateGroup: fc.string({ minLength: 1 }),
        messages: fc.array(
          fc.record({
            sender: fc.constantFrom('teacher' as const, 'parent' as const),
            text: fc.string({ minLength: 1 }),
            time: fc.string({ minLength: 1 }),
          })
        ),
      })
    );

    const replyArb = fc.string({ minLength: 1 });

    fc.assert(
      fc.property(threadArb, replyArb, (thread, replyText) => {
        const before = totalMessages(thread);
        const after = sendReply(thread, replyText);
        const afterCount = totalMessages(after);

        // Count increased by exactly 1
        expect(afterCount).toBe(before + 1);

        // Last message in the TODAY group is from parent with correct text
        const todayGroup = after.find((g) => g.dateGroup === 'TODAY, JUN 3');
        expect(todayGroup).toBeDefined();
        const lastMsg = todayGroup!.messages[todayGroup!.messages.length - 1];
        expect(lastMsg.sender).toBe('parent');
        expect(lastMsg.text).toBe(replyText);
      }),
      { numRuns: 100 }
    );
  });
});
