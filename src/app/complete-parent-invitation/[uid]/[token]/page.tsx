'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { completeParentInvitation } from '@/services/authService';

type Props = {
  params: Promise<{ uid: string; token: string }>;
};

function toFieldError(error: unknown, key: string): string | null {
  if (typeof error !== 'object' || error === null) return null;
  const maybe = (error as Record<string, unknown>)[key];
  if (Array.isArray(maybe) && typeof maybe[0] === 'string') return maybe[0];
  return null;
}

export default function CompleteParentInvitationPage({ params }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      const route = await params;
      try {
        await completeParentInvitation({ uid: route.uid, token: route.token });
        setStatus('success');
        setTimeout(() => router.replace('/login'), 1000);
      } catch (error) {
        const details = (error as { details?: unknown })?.details;
        const message =
          toFieldError(details, 'uid') ??
          toFieldError(details, 'token') ??
          'Invalid or expired invitation. Please contact your school.';
        setErrorMessage(message);
        setStatus('error');
      }
    }

    run();
  }, [params, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-center">
        {status === 'loading' && <p className="text-slate-700">Activating your parent account...</p>}
        {status === 'success' && <p className="text-emerald-700">Account activated. Redirecting to OTP login...</p>}
        {status === 'error' && (
          <>
            <p className="text-red-600">{errorMessage}</p>
            <p className="mt-2 text-sm text-slate-500">Please request a new invitation or contact your school office.</p>
          </>
        )}
      </div>
    </main>
  );
}
