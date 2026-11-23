import type { Metadata } from 'next';
import Image from 'next/image';

import Header from '@/components/SectionsComponents/Header';
import { JsonLd } from '@/components/seo/JsonLd';
import Copy from '@/components/SupportComponents/Copy';
import { PricingFaq } from '@/features/billing/components/PricingFaq';
import { PricingInteractive } from '@/features/billing/components/PricingInteractive';
import { PricingViewTracker } from '@/features/billing/components/PricingViewTracker';
import { curve_pricing } from '@/features/marketing/constants';
import { buildMarketingMetadata } from '@/features/marketing/utils/metadata';
import { buildPageBreadcrumbJsonLd } from '@/features/marketing/utils/structuredData';

import Footer from '../(marketing)/assistant/components/Footer';
import Maintenance from '../maintenance/page';

export const metadata: Metadata = buildMarketingMetadata({
  path: '/pricing',
  title: 'Cennik – plany i tokeny',
  description:
    'Sprawdź cennik Vocare i pakiety tokenów AI. Darmowy start bez karty płatniczej. Wybierz elastyczny plan dopasowany do Twojego rozwoju zawodowego.',
  ogAlt: 'Cennik Vocare',
});

export default async function PricingPage() {
  const isMaintenance = false;

  return (
    <main>
      <JsonLd data={buildPageBreadcrumbJsonLd('Cennik', '/pricing')} />
      {isMaintenance ? (
        <Maintenance />
      ) : (
        <>
          <PricingViewTracker />
          <Header />

          <section className="relative -mt-21 pt-30 pb-12 md:pb-20" id="pricing">
            <div className="main-font-color relative flex flex-col items-center justify-center max-lg:overflow-x-hidden xl:mx-10">
              <div className="font-korbin relative mx-auto flex w-full max-w-7xl flex-col items-center justify-center">
                <div className="relative flex flex-col items-center justify-center sm:mt-8">
                  <Copy>
                    <h1 className="text-color text-center text-3xl font-bold md:text-[3rem] xl:leading-[0.8]">
                      <span>Plan dopasowany pod </span>
                      <span className="relative inline-block pb-4 md:pb-6">
                        Ciebie
                        <Image
                          src={curve_pricing}
                          alt="line"
                          width={224}
                          height={124}
                          className="pointer-events-none absolute bottom-2 left-1/2 h-auto w-[85%] max-w-[320px] -translate-x-1/2 md:max-w-90"
                        />
                      </span>
                    </h1>
                  </Copy>
                  <p className="text-md font-poppins mt-4 w-3/4 text-center font-extralight text-gray-300 sm:mt-2 sm:text-lg">
                    Darmowy start. Bez karty płatniczej.
                  </p>
                </div>

                <PricingInteractive />
              </div>
            </div>
          </section>
          <PricingFaq />
          <Footer />
        </>
      )}
    </main>
  );
}
