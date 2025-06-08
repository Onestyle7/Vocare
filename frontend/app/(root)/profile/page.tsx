'use client';

import { GridBackgroundDemo } from '@/components/MarketComponents/GridBackgroundDemo';
import ProfileDetails from '@/components/ProfileFormComponents/ProfileDeatail';
import Header from '@/components/SupportComponents/SectionsComponents/Header';
import React from 'react';

const page = () => {
  return (
    <div>
      <Header />
      <GridBackgroundDemo />
      <ProfileDetails />
    </div>
  );
};

export default page;
