import React from 'react';
import Section from '../SupportComponents/Section';
import Image from 'next/image';
import { Button } from '../ui/button';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { landingCopy } from '@/app/constants/landingCopy';
// import { ArrowRight } from 'lucide-react';

const MobileFeatureImprovements = () => {
  const { language } = useLanguage();
  const copy = landingCopy[language];

  return (
    <Section
      crosses
      customPaddings
      className="font-korbin relative overflow-hidden px-10 max-md:-mb-70"
      id="brain"
    >
      <div className="relative flex h-[100vh] w-full flex-col items-center justify-center lg:border-t 2xl:h-[50vh]">
        <div className="mt-6 mb-10 flex h-full w-full flex-col items-center justify-start py-8 sm:px-4 md:py-0 2xl:h-full 2xl:justify-center">
          <div className="mb-4 text-center">
            <p className="mb-6 font-bold text-gray-400">{copy.mobileFeature.eyebrow}</p>
            <h2 className="text-4xl font-bold">{copy.mobileFeature.title}</h2>
          </div>
          <div className="mt-4 flex h-full w-full flex-col items-center justify-center gap-4 sm:flex-row sm:px-8">
            <div className="h-1/2 w-full md:h-full md:w-1/2">
              <div className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#181920]">
                <div className="absolute -top-35 -right-35 z-10 md:-top-25 md:-right-20">
                  <Image
                    src="/images/shape-mobile-2.png"
                    alt="phone"
                    width={448}
                    height={448}
                    className="rotate-45 opacity-35 md:rotate-45"
                  />
                </div>
                <div className="flex h-full w-2/3 flex-col justify-end">
                  <div className="mb-4 flex h-2/3 w-full flex-col items-start justify-end px-4 md:mb-10 md:px-10">
                    <p className="mb-4 font-bold text-[#818fff]">{copy.mobileFeature.badge}</p>
                    <h2 className="z-20 text-2xl font-bold tracking-tight text-white/85 sm:text-4xl">
                      {copy.mobileFeature.secondaryTitle}
                    </h2>
                    <Button
                      className="group relative z-20 mt-10 h-12 w-5/6 rounded-full bg-[linear-gradient(90deg,rgba(146,150,253,1)_0%,rgba(132,145,254,1)_50%,rgba(199,169,254,1)_100%,rgba(157,155,255,1)_77%)] font-bold text-white md:mt-16 md:w-2/3"
                      variant="default"
                      disabled
                    >
                      {copy.mobileFeature.cta}
                      {/* <ArrowRight className="ml-2 transition-all ease-in-out group-hover:translate-x-2" /> */}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-1/3 w-full md:h-full md:w-1/2">
              <div className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#818fff]">
                <div
                  aria-hidden
                  className="pointer-events-none absolute right-8 bottom-4 h-80 w-55 -translate-y-1 rounded-full blur-2xl"
                  style={{
                    background:
                      'radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.18) 55%, transparent 75%)',
                    filter: 'blur(10px)',
                  }}
                />
                <div className="absolute right-0 -bottom-40 z-10 md:bottom-0">
                  <Image src="/images/iphone-1.png" alt="phone" width={348} height={348} />
                </div>
                <div className="absolute -bottom-8 -left-10">
                  <Image
                    src="/images/shape-mobile-1.png"
                    alt="phone"
                    width={348}
                    height={348}
                    className="opacity-80"
                  />
                </div>
                <div className="absolute -top-4 translate-x-1/2 rotate-x-180">
                  <Image
                    src="/images/shape-mobile-3.png"
                    alt="phone"
                    width={348}
                    height={348}
                    className="opacity-80"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default MobileFeatureImprovements;
