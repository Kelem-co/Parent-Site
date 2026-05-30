import { apiClient } from '@/lib/apiClient';
import type {
  AuthResponse,
  CompleteInvitationRequest,
  OtpRequest,
  RefreshResponse,
  OtpVerifyRequest,
  OtpVerifyResponse,
} from '@/types/api';

// In-memory access token (never persisted to localStorage)
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export async function verifyOtp(credentials: OtpVerifyRequest): Promise<AuthResponse> {
  const res = await apiClient.post<OtpVerifyResponse>('/auth/otp/verify/', credentials);
  accessToken = res.data.access;
  return {
    accessToken: res.data.access,
    expiresIn: 0,
    parentId: '',
    parentName: '',
  };
}

export async function requestOtp(phone_number: OtpRequest['phone_number']): Promise<{ message: string }> {
  const res = await apiClient.post<{ message: string }>('/auth/otp/request/', { phone_number });
  return res.data;
}

export async function completeParentInvitation(payload: CompleteInvitationRequest): Promise<{ message: string }> {
  const res = await apiClient.post<{ message: string }>('/api/parents/complete-invitation/', payload);
  return res.data;
}

export async function logout(queryClient?: import('@tanstack/react-query').QueryClient): Promise<void> {
  accessToken = null;
  queryClient?.clear();
}

export async function refreshToken(): Promise<string> {
  const res = await apiClient.post<RefreshResponse>('/auth/jwt/refresh/', {});
  accessToken = res.data.access;
  return accessToken;
}

export async function restoreSession(): Promise<AuthResponse | null> {
  try {
    const newToken = await refreshToken();
    return {
      accessToken: newToken,
      expiresIn: 0,
      parentId: '',
      parentName: '',
    };
  } catch {
    return null;
  }
}

export const login = verifyOtp;
