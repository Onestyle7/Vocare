import Image from 'next/image';

import Header from '@/components/SectionsComponents/Header';
import Section from '@/components/SupportComponents/Section';
import { PricingInteractive } from '@/features/billing/components/PricingInteractive';
import { curve_pricing } from '@/features/marketing/constants/countries';

import Copy from '../../components/SupportComponents/Copy';
import Maintenance from '../maintenance/page';

export default async function PricingPage() {
  const isMaintenance = false;

  return (
    <main>
      {isMaintenance ? (
        <Maintenance />
      ) : (
        <>
          <Header />

          <Section
            className="relative -mt-21 pt-30"
            crosses
            crossesOffset="lg:translate-y-[7.5rem]"
            customPaddings
            id="pricing"
          >
            <div className="main-font-color relative flex flex-col items-center justify-center max-lg:overflow-x-hidden xl:mx-10 xl:border">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] mask-[radial-gradient(ellipse_at_center,white_0%,transparent_60%)] bg-size-[90px_90px] mask-size-[200%_200%] mask-center mask-no-repeat [-webkit-mask-image:radial-gradient(ellipse_at_center,white_0%,transparent_60%)] dark:bg-[linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]" />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white mask-[radial-gradient(ellipse_at_bottom,transparent_40%,black_70%)] dark:bg-[#0f1014]"></div>
              <div className="font-korbin relative mx-auto flex max-w-7xl flex-col items-center justify-center">
                <div className="relative flex flex-col items-center justify-center sm:mt-8">
                  <Copy>
                    <h1 className="text-color text-center text-3xl font-bold md:text-[3rem] xl:leading-[0.8]">
                      <span>Dopasowany pod </span>
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
                  <p className="text-md mt-4 w-3/4 text-center font-light text-gray-300 sm:mt-2 sm:text-lg">
                    Darmowy start. Bez karty płatniczej.
                  </p>
                </div>

                <PricingInteractive />
              </div>
            </div>
          </Section>
        </>
      )}
    </main>
  );
}
