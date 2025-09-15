'use client';

import { ScrollProgress } from '@/components/magicui/scroll-progress';
import MarketAnalysis from '@/components/MarketComponents/MarketAnalysisPage';
import Header from '@/components/SectionsComponents/Header';
import React from 'react';

const page = () => {
  return (
    <main>
      <ScrollProgress />
      <Header />
      <MarketAnalysis />
    </main>
  );
};

export default page;
