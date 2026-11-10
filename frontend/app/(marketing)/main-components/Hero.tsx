'use client';

import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useRef } from 'react';

import Header from '@/components/SectionsComponents/Header';
import Button from '@/components/ui/assistant-button';
import { dashboard_img_2, expand_icon } from '@/features/marketing/constants';
import { useHeroDashboardAnimation } from '@/features/marketing/constants/animations';

import { LightBeam } from './light-beam';

const expandIconSize = {
  width: 14,
  height: 14,
};

const heroStats = [
  { value: '99%', label: 'Dopasowania do konkretnej oferty' },
  { value: '1200+', label: 'Zadowolonych użytkowników' },
];

const Hero = () => {
  const dashboardImageRef = useRef<HTMLDivElement>(null);

  useHeroDashboardAnimation(dashboardImageRef);

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('explore');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="font-poppins flex flex-col bg-[#0F1013] p-3 sm:p-5">
      <div className="relative mx-auto flex min-h-[calc(100svh-1.5rem)] w-full max-w-none flex-col overflow-hidden rounded-3xl bg-[#16161A] sm:min-h-[calc(100svh-2.5rem)] 2xl:min-h-[calc(55svh-2.5rem)] 2xl:max-w-7xl">
        <LightBeam />

        <Header />

        <div className="relative flex w-full flex-1 flex-col justify-center px-4 py-6 sm:px-8 sm:py-8 md:px-12 xl:py-10 xl:pr-0 xl:pl-32.5 2xl:pl-17.5">
          <div className="relative z-10 grid w-full items-center gap-8 sm:gap-10 xl:grid-cols-[minmax(0,575px)_minmax(0,1fr)] xl:items-center xl:gap-8">
            <div className="mx-auto flex w-full max-w-142.75 flex-col items-center justify-center text-center xl:mx-0 xl:items-start xl:text-left">
              <h1 className="w-full text-[28px] leading-[1.15] font-light text-[#F1F4FF] sm:text-[36px] lg:text-[42px] xl:text-[48px] xl:leading-[1.1]">
                <span className="opacity-[0.79]">Zaplanuj całą</span> <br />
                <span className="bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text font-normal text-transparent">
                  Swoją Karierę
                </span>
              </h1>

              <p className="mt-5 w-full max-w-124.5 text-[14px] leading-normal font-light text-[#F1F4FF] opacity-[0.46] sm:mt-6 sm:text-[15px] xl:mt-7 xl:text-[16px] xl:leading-[1.45]">
                Inteligentna platforma kariery, która prowadzi Cię od dopasowanej ścieżki, przez
                analizę rynku i plan działania, aż po CV gotowe do wysłania - bezpiecznie i w jednym
                miejscu.
              </p>

              <div className="mt-7 flex w-full flex-wrap items-center justify-center gap-3 sm:mt-8 xl:mt-10 xl:justify-start xl:gap-4">
                <Button
                  href="/dashboard"
                  variant="primary"
                  size="sm"
                  icon={<ChevronRight size={18} />}
                  iconPosition="right"
                  className="xl:h-13 xl:px-6 xl:text-[15px]"
                >
                  Sprawdź za darmo
                </Button>

                <Button
                  onClick={scrollToFeatures}
                  variant="secondary"
                  size="sm"
                  icon={
                    <Image
                      src={expand_icon}
                      alt="expand"
                      fill
                      className="pointer-events-none cursor-pointer object-contain"
                    />
                  }
                  iconPosition="left"
                  iconWrapperClassName="relative"
                  iconWrapperStyle={{
                    width: expandIconSize.width,
                    height: expandIconSize.height,
                  }}
                  className="cursor-pointer xl:h-13 xl:px-6 xl:text-[15px]"
                >
                  <span className="bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text text-transparent">
                    Dowiedz się więcej
                  </span>
                </Button>
              </div>

              <div className="mx-auto mt-8 grid w-full max-w-77.5 grid-cols-2 gap-3 sm:mt-22 sm:gap-6 xl:mx-0 xl:gap-8">
                {heroStats.map((stat) => (
                  <div
                    key={stat.value}
                    className="flex w-fit flex-col items-center space-y-1.5 text-[#686A71] xl:items-start xl:space-y-2"
                  >
                    <span className="bg-[linear-gradient(180deg,#8FBCFE_0%,#91A3FE_60%,#B09FFE_100%)] bg-clip-text text-[28px] leading-none text-transparent sm:text-[36px] lg:text-[38px] xl:text-[46px]">
                      {stat.value}
                    </span>

                    <span className="text-[10px] leading-tight sm:text-[11px] xl:max-w-30 xl:text-[14px]">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div
              ref={dashboardImageRef}
              className="relative flex w-[calc(100%+1rem)] justify-center opacity-0 sm:w-[calc(100%+2rem)] md:w-[calc(100%+3rem)] xl:w-full xl:min-w-0 xl:items-center xl:justify-end"
            >
              <Image
                src={dashboard_img_2}
                alt="dashboard-img"
                width={689}
                height={595}
                priority
                fetchPriority="high"
                className="pointer-events-none h-auto w-full max-w-170 object-contain object-right xl:max-w-147.25"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
