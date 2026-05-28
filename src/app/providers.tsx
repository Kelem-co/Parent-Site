'use client';

import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureApiClient } from '@/lib/apiClient';
import { getAccessToken } from '@/services/authService';
import { initMocks } from '@/mocks';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 minutes — data stays fresh
      retry: 2,                    // retry failed requests twice
      refetchOnWindowFocus: false, // avoid jarring refetches in a portal
    },
    mutations: {
      retry: 0,                    // mutations do not retry automatically
    },
  },
});

// Configure the API client with auth callbacks
configureApiClient({
  getAccessToken,
  onUnauthorized: () => {
    // Clear any cached auth state and redirect to login
    queryClient.clear();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
  onServerError: (message: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('api:server-error', { detail: { message } })
      );
    }
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initMocks().catch(console.error);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
