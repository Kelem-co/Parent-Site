'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { requestOtp, verifyOtp } from '@/services/authService';
import { getParentMe, getUserMe } from '@/services/parentService';
import { getChildren } from '@/services/childService';

type Step = 'phone' | 'otp';

function toFieldError(error: unknown, key: string): string | null {
  if (typeof error !== 'object' || error === null) return null;
  const maybe = (error as Record<string, unknown>)[key];
  if (Array.isArray(maybe) && typeof maybe[0] === 'string') return maybe[0];
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  async function onRequestOtp(e: FormEvent) {
    e.preventDefault();
    setPhoneError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      const res = await requestOtp(phoneNumber.trim());
      setMessage(res.message);
      setStep('otp');
    } catch (error) {
      setPhoneError(toFieldError((error as { details?: unknown })?.details, 'phone_number') ?? 'Failed to send OTP.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setOtpError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      await verifyOtp({ phone_number: phoneNumber.trim(), otp_code: otpCode.trim() });
      await Promise.all([getUserMe(), getParentMe(), getChildren()]);
      router.push('/');
    } catch (error) {
      setOtpError(toFieldError((error as { details?: unknown })?.details, 'otp_code') ?? 'Invalid or expired OTP code.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Parent Login</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in using your phone number and OTP.</p>

        {step === 'phone' ? (
          <form className="mt-6 space-y-4" onSubmit={onRequestOtp}>
            <label className="block text-sm font-medium text-slate-700">
              Phone Number
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+2519XXXXXXXX"
              />
            </label>
            {phoneError ? <p className="text-sm text-red-600">{phoneError}</p> : null}
            {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
            <button disabled={isSubmitting} className="w-full rounded-md bg-[#3949AB] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {isSubmitting ? 'Sending...' : 'Request OTP'}
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={onVerifyOtp}>
            <p className="text-xs text-slate-500">OTP sent to {phoneNumber}</p>
            <label className="block text-sm font-medium text-slate-700">
              OTP Code
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
              />
            </label>
            {otpError ? <p className="text-sm text-red-600">{otpError}</p> : null}
            <button disabled={isSubmitting} className="w-full rounded-md bg-[#3949AB] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {isSubmitting ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
