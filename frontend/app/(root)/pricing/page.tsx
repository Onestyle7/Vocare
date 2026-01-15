import PricingMain from '@/components/PricingComponents/PricingMain';
import Header from '@/components/SectionsComponents/Header';
import React from 'react';
import Maintenance from '../maintance/page';

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
