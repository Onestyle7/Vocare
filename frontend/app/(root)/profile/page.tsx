'use client';
import React from 'react';
import Header from '@/components/SectionsComponents/Header';
import { GridBackgroundDemo } from '@/components/MarketComponents/GridBackgroundDemo';
import ProfileDetails from '@/components/ProfileFormComponents/ProfileDeatail';
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
