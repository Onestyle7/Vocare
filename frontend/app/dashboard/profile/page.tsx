'use client';
import React from 'react';

import { GridBackgroundDemo } from '@/components/MarketComponents/GridBackgroundDemo';
import ProfileDetails from '@/components/ProfileFormComponents/ProfileDeatail';
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
