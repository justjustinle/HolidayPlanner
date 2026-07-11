'use client';

import { useTripData } from './TripDataProvider';
import WelcomeGate from './WelcomeGate';
import AppShell from './AppShell';

// Decides between the loading state, the login gate, and the app itself.
export default function AppRoot() {
  const { ready, me } = useTripData();

  if (!ready) {
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-app items-center justify-center">
        <div className="animate-fade-in text-sm text-muted">Loading your trip…</div>
      </div>
    );
  }

  if (!me) return <WelcomeGate />;

  return <AppShell />;
}
