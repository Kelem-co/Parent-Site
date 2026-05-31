import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useQuery } from '@tanstack/react-query';
import { useTodaysHomework } from './useTodaysHomework';
import { queryKeys } from '@/lib/queryKeys';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

const useQueryMock = vi.mocked(useQuery);

describe('useTodaysHomework', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useQueryMock.mockReturnValue({} as ReturnType<typeof useQuery>);
  });

  it('configures the selected child query and enables only when childId exists', () => {
    useTodaysHomework('student-1');
    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: queryKeys.todaysHomework('student-1'),
        enabled: true,
      }),
    );

    useTodaysHomework('');
    expect(useQueryMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        queryKey: queryKeys.todaysHomework(''),
        enabled: false,
      }),
    );
  });
});
