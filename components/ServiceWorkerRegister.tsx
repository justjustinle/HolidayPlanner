'use client';

import { useEffect } from 'react';

// Registers the service worker in production for installable-PWA + offline
// asset caching. No-ops in development to avoid stale-cache churn.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' ||
      typeof navigator === 'undefined' ||
      !('serviceWorker' in navigator)
    ) {
      return;
    }
    const register = () =>
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    window.addEventListener('load', register);
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
