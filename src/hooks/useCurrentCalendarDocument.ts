import { useQuery } from '@tanstack/react-query';
import { getCurrentCalendarDocument } from '@/services/calendarService';
import type { ApiError } from '@/types/api';
import type { CurrentCalendarDocument } from '@/services/calendarService';

export function useCurrentCalendarDocument(params?: {
  organizationId?: string;
  branchId?: string;
  enabled?: boolean;
}) {
  const organizationId = params?.organizationId;
  const branchId = params?.branchId;
  const enabled = params?.enabled ?? true;

  return useQuery<CurrentCalendarDocument, ApiError>({
    queryKey: ['calendar-document', 'current', organizationId, branchId],
    queryFn: () =>
      getCurrentCalendarDocument({
        organization: organizationId as string,
        branch: branchId as string,
      }),
    enabled: Boolean(organizationId && branchId && enabled),
  });
}
