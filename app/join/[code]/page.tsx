'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Invite deep link. The providers (auth + trip data) live on the root route, so
// this page just stashes the code and bounces to '/', where TripDataProvider
// picks it up once the account resolves: it runs join_trip and opens the trip
// (signing in first if needed).
export default function JoinPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  useEffect(() => {
    try {
      if (params.code) localStorage.setItem('pending_join_code', params.code);
    } catch {
      /* ignore */
    }
    router.replace('/');
  }, [params.code, router]);

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-app items-center justify-center">
      <div className="animate-fade-in text-sm text-muted">Opening your invite…</div>
    </div>
  );
}
