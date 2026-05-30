'use client'

import React, { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, usePathname } from 'next/navigation'
import { getAccessToken } from '@/services/authService'

const App = dynamic(() => import('../App'), { ssr: false })

export function ClientOnly() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isPublic = pathname === '/login' || pathname.startsWith('/complete-parent-invitation/');
    if (!isPublic && !getAccessToken()) {
      router.replace('/login');
    }
  }, [pathname, router]);

  if (!getAccessToken()) return null;
  return <App />
}
