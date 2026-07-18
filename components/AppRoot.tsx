'use client';

import { useTripData } from './TripDataProvider';
import { useAuth } from './AuthProvider';
import WelcomeGate from './WelcomeGate';
import AppShell from './AppShell';
import MyTripsScreen from './trips/MyTripsScreen';

// Decides between the loading state, the sign-in gate, the My Trips picker, and
// the app itself.
export default function AppRoot() {
  const { ready, me, activeTripId } = useTripData();
  const { authReady, authEnabled, account } = useAuth();

  if (!ready || !authReady) {
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-app items-center justify-center">
        <div className="animate-fade-in text-sm text-muted">Loading your trip…</div>
      </div>
    );
  }

  // Auth-on multi-trip flow.
  if (authEnabled) {
    if (!account) return <WelcomeGate />; // Google sign-in
    if (!activeTripId) return <MyTripsScreen />; // pick / create / join a trip
    if (!me) return <WelcomeGate />; // chose a trip but not a member → claim/join
    return <AppShell />;
  }

  // Auth-off single-trip flow (unchanged).
  if (!me) return <WelcomeGate />;
  return <AppShell />;
}
