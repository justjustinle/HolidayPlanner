'use client';

import { useEffect } from 'react';

// Next.js App Router error UI. The installed PWA can hit this after a deploy
// when a stale service-worker cache serves an HTML shell whose `/_next/static`
// chunk hashes no longer exist. Clearing caches + unregistering the SW, then
// reloading, recovers without asking people to reinstall the home-screen app.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const recover = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch {
      /* best-effort */
    }
    window.location.reload();
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-app flex-col items-center justify-center px-6 text-center">
      <h1 className="font-serif text-[24px] font-semibold text-ink">Something went wrong</h1>
      <p className="mt-3 max-w-sm text-[14px] text-muted">
        Usually this is a stale offline cache after an update. Tap reload to clear it and
        try again.
      </p>
      <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
        <button
          type="button"
          onClick={recover}
          className="rounded-xl bg-ink py-3 text-[15px] font-medium text-white"
        >
          Clear cache &amp; reload
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-xl border border-black/10 bg-cream-card py-3 text-[15px] font-medium text-ink"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
