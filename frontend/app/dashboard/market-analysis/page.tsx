'use client';

import React from 'react';

import { ScrollProgress } from '@/components/magicui/scroll-progress';
import DetailedMarketAnalysis from '@/features/market-analysis/components/DetailedMarketAnalysis';
import Header from '@/components/SectionsComponents/Header';

const page = () => {
  return (
    <main>
      <ScrollProgress />
      <Header />
      <DetailedMarketAnalysis />
    </main>
  );
};

export default page;
