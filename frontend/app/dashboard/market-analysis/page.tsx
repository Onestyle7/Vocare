'use client';

import { ScrollProgress } from '@/components/magicui/scroll-progress';
import DetailedMarketAnalysis from '@/components/MarketComponents/DetailedMarketAnalysis';
import Header from '@/components/SectionsComponents/Header';
import React from 'react';

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
