'use client';
import Header from '@/components/SectionsComponents/Header';
import { GridBackgroundDemo } from '@/features/market-analysis/components/GridBackgroundDemo';
import { useLockScrollOnLg } from '@/lib/hooks/useLockScrollOnLg';

export default function Page() {
  useLockScrollOnLg();
  return (
    <div>
      <Header />
      <GridBackgroundDemo />
      <ProfileDetails />
    </div>
  );
}
