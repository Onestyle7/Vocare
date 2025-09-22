'use client';

import { GridBackgroundDemo } from '@/components/MarketComponents/GridBackgroundDemo';
import ProfileDetails from '@/components/ProfileFormComponents/ProfileDeatail';
import Header from '@/components/SectionsComponents/Header';
import React, { useEffect } from 'react';

const page = () => {
  // Disable page scroll on large screens (lg ≥ 1024px)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const apply = () => {
      const isLarge = window.matchMedia('(min-width: 1024px)').matches;
      const html = document.documentElement;
      const body = document.body;
      if (isLarge) {
        html.style.overflow = 'hidden';
        body.style.overflow = 'hidden';
      } else {
        html.style.overflow = '';
        body.style.overflow = '';
      }
    };
    apply();
    window.addEventListener('resize', apply);
    return () => {
      const html = document.documentElement;
      const body = document.body;
      html.style.overflow = '';
      body.style.overflow = '';
      window.removeEventListener('resize', apply);
    };
  }, []);

  return (
    <div>
      <Header />
      <GridBackgroundDemo />
      <ProfileDetails />
    </div>
  );
};

export default page;
