import { config } from '@/lib/config';

export async function initMocks(): Promise<void> {
  if (!config.enableMocks) return;

  // SSR guard — only run in browser
  if (typeof window === 'undefined') return;

  const { worker } = await import('./browser');
  await worker.start({
    onUnhandledRequest: 'bypass', // don't warn on non-API requests
  });
}
