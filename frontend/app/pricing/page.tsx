import Header from '@/components/SectionsComponents/Header';
import PricingMain from '@/features/billing/components/PricingMain';

import Maintenance from '../maintenance/page';

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
