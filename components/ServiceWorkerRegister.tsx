'use client';

import { useEffect } from 'react';

// Registers the service worker in production for installable-PWA + offline
// asset caching. No-ops in development to avoid stale-cache churn.
// Also asks the registration to check for updates on focus so post-deploy
// SW revisions (cache bumps) land without needing a full reinstall.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' ||
      typeof navigator === 'undefined' ||
      !('serviceWorker' in navigator)
    ) {
      return;
    }

    let registration: ServiceWorkerRegistration | undefined;

    const register = () => {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        registration = reg;
        // Pick up a newly deployed sw.js without waiting for the browser's
        // periodic update check (important on iOS home-screen PWAs).
        void reg.update();
      }).catch(() => {});
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') void registration?.update();
    };

    window.addEventListener('load', register);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('load', register);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
}
