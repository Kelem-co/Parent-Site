import { useQuery } from '@tanstack/react-query';
import { getBranchIdentity } from '@/services/branchService';
import { queryKeys } from '@/lib/queryKeys';
import type { ApiError, BranchIdentityResponse } from '@/types/api';

export function useBranchIdentity(branchId?: string) {
  return useQuery<BranchIdentityResponse, ApiError>({
    queryKey: branchId ? queryKeys.branchIdentity(branchId) : ['branches', 'identity', 'missing'],
    queryFn: async () => getBranchIdentity(branchId as string),
    enabled: Boolean(branchId),
  });
}
