'use client';
import React from 'react';

import { GridBackgroundDemo } from '@/features/market-analysis/components/GridBackgroundDemo';
import ProfileDetails from '@/features/profile/components/ProfileDeatail';
import Header from '@/components/SectionsComponents/Header';
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
