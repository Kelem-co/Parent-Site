import { apiClient } from '@/lib/apiClient';
import type { ApiResponse, LoginRequest, AuthResponse } from '@/types/api';

// In-memory access token (never persisted to localStorage)
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const res = await apiClient.post<ApiResponse<AuthResponse>>('/v1/auth/login', credentials);
  accessToken = res.data.data.accessToken;
  return res.data.data;
}

export async function logout(queryClient?: import('@tanstack/react-query').QueryClient): Promise<void> {
  await apiClient.post('/v1/auth/logout');
  accessToken = null;
  queryClient?.clear();
}

export async function refreshToken(): Promise<string> {
  // Refresh token is sent automatically via HttpOnly cookie (withCredentials: true)
  const res = await apiClient.post<ApiResponse<AuthResponse>>('/v1/auth/refresh');
  accessToken = res.data.data.accessToken;
  return accessToken;
}

export async function restoreSession(): Promise<AuthResponse | null> {
  try {
    const newToken = await refreshToken();
    const res = await apiClient.get<ApiResponse<AuthResponse>>('/v1/auth/me');
    return res.data.data;
  } catch {
    return null;
  }
}
