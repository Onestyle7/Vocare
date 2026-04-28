import React from 'react';

import PricingMain from '@/components/PricingComponents/PricingMain';
import Header from '@/components/SectionsComponents/Header';

import Maintenance from '../../maintenance/page';

const Page = () => {
  const isMaintenance = false;

  return (
    <main>
      {isMaintenance ? (
        <Maintenance />
      ) : (
        <>
          <Header />

          <PricingMain />
        </>
      )}
    </main>
  );
};

export default Page;
