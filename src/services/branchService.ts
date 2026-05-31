import { apiClient } from '@/lib/apiClient';
import type { BranchIdentityResponse } from '@/types/api';

export async function getBranchIdentity(branchId: string): Promise<BranchIdentityResponse> {
  const res = await apiClient.get<BranchIdentityResponse>(`/api/branches/${branchId}/school-name/`);
  return res.data;
}
