'use client'

import React, { useEffect } from 'react'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, usePathname } from 'next/navigation'
import { getAccessToken, restoreSession } from '@/services/authService'

const App = dynamic(() => import('../App'), { ssr: false })

export function ClientOnly() {
  const router = useRouter();
  const pathname = usePathname();
  const [authReady, setAuthReady] = useState(false);
  const redirectToLogin = () => {
    router.replace('/login');
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.replace('/login');
    }
  };

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      const isInvitationPath =
        pathname === '/complete-parent-invitation' ||
        pathname.startsWith('/complete-parent-invitation/');
      const isPublic = pathname === '/login' || isInvitationPath;

      if (isPublic) {
        if (!cancelled) setAuthReady(true);
        return;
      }

      if (!getAccessToken()) {
        await restoreSession();
      }

      if (!cancelled) {
        if (!getAccessToken()) {
          redirectToLogin();
          return;
        }
        setAuthReady(true);
      }
    };

    initAuth();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  useEffect(() => {
    const isInvitationPath =
      pathname === '/complete-parent-invitation' ||
      pathname.startsWith('/complete-parent-invitation/');
    const isPublic = pathname === '/login' || isInvitationPath;
    if (authReady && !isPublic && !getAccessToken()) {
      redirectToLogin();
    }
  }, [authReady, pathname, router]);

  if (!authReady) return null;
  if (!getAccessToken() && pathname !== '/login') return null;
  return <App />
}
