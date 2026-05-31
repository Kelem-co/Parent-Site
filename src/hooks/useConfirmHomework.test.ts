import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useConfirmHomework } from './useConfirmHomework';
import { queryKeys } from '@/lib/queryKeys';

const invalidateQueries = vi.fn();
const useMutationMock = vi.fn();
let capturedConfig: { onSuccess?: () => void } | undefined;

vi.mock('@tanstack/react-query', () => ({
  useMutation: (...args: unknown[]) => useMutationMock(...args),
  useQueryClient: () => ({
    invalidateQueries,
  }),
}));

describe('useConfirmHomework', () => {
  beforeEach(() => {
    invalidateQueries.mockReset();
    useMutationMock.mockReset();
    capturedConfig = undefined;
    useMutationMock.mockImplementation((config) => {
      capturedConfig = config;
      return {} as ReturnType<typeof useConfirmHomework>;
    });
  });

  it('invalidates today homework for the selected child on success', () => {
    useConfirmHomework('student-1');
    capturedConfig?.onSuccess?.();

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.todaysHomework('student-1'),
    });
  });
});
