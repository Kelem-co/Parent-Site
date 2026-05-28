'use client';

import { useState, useEffect, useCallback } from 'react';

export interface UseHomeworkConfirmationReturn {
  isConfirmed: boolean;
  handleConfirm: () => void;
  resetConfirmation: () => void;
}

export function useHomeworkConfirmation(
  childId: string,
): UseHomeworkConfirmationReturn {
  const storageKey = `homework-confirmed-${childId}`;

  const [isConfirmed, setIsConfirmed] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(storageKey) === 'true';
      }
    } catch {
      // ignore — SSR or storage access error
    }
    return false;
  });

  // Re-read from localStorage whenever childId changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        setIsConfirmed(
          localStorage.getItem(`homework-confirmed-${childId}`) === 'true',
        );
      } else {
        setIsConfirmed(false);
      }
    } catch {
      setIsConfirmed(false);
    }
  }, [childId]);

  const handleConfirm = useCallback(() => {
    if (isConfirmed) return;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`homework-confirmed-${childId}`, 'true');
      }
    } catch {
      // ignore — storage access error
    }
    setIsConfirmed(true);
  }, [childId, isConfirmed]);

  const resetConfirmation = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`homework-confirmed-${childId}`);
      }
    } catch {
      // ignore — storage access error
    }
    setIsConfirmed(false);
  }, [childId]);

  return { isConfirmed, handleConfirm, resetConfirmation };
}
