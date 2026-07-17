import AuthProvider from '@/components/AuthProvider';
import TripDataProvider from '@/components/TripDataProvider';
import AppRoot from '@/components/AppRoot';

export default function Page() {
  return (
    <AuthProvider>
      <TripDataProvider>
        <AppRoot />
      </TripDataProvider>
    </AuthProvider>
  );
}
