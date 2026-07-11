import TripDataProvider from '@/components/TripDataProvider';
import AppRoot from '@/components/AppRoot';

export default function Page() {
  return (
    <TripDataProvider>
      <AppRoot />
    </TripDataProvider>
  );
}
