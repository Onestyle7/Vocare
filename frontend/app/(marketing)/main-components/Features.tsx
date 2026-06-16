'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { ScrollParallax } from 'react-just-parallax';

import Button from '@/components/ui/assistant-button';
import { arrow_icon, tile_1, tile_2, tile_3, tile_4 } from '@/features/marketing/constants';

import { LightBeam } from './light-beam';
import MainCard from './main-card';

const Features = () => {
  const bentoRef = useRef<HTMLDivElement>(null);

  const scrollToBento = () => {
    bentoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div id="explore" className="font-poppins flex flex-col bg-[#0F1013] p-3 sm:p-5">
      <div className="relative mx-auto flex w-full max-w-none flex-col overflow-hidden rounded-3xl 2xl:max-w-7xl">
        <LightBeam />

        <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-12 sm:px-8 sm:py-16 md:px-12 lg:px-16 lg:py-20 2xl:py-24">
          <div className="absolute z-0 hidden lg:bottom-1/5 lg:left-15 lg:block xl:bottom-1/5 xl:left-35">
            <ScrollParallax strength={0.12}>
              <Image src={tile_1} alt="tile" width={90} height={90} />
            </ScrollParallax>
          </div>

          <div className="absolute z-0 hidden lg:top-15 lg:left-40 lg:block xl:top-15 xl:left-60">
            <ScrollParallax strength={0.06}>
              <Image src={tile_2} alt="tile" width={90} height={90} />
            </ScrollParallax>
          </div>

          <div className="absolute z-0 hidden lg:right-15 lg:bottom-1/5 lg:block xl:right-35 xl:bottom-1/5">
            <ScrollParallax strength={0.1}>
              <Image src={tile_4} alt="tile" width={90} height={90} />
            </ScrollParallax>
          </div>

          <div className="absolute z-0 hidden lg:top-15 lg:right-40 lg:block xl:top-15 xl:right-60">
            <ScrollParallax strength={0.08}>
              <Image src={tile_3} alt="tile" width={90} height={90} />
            </ScrollParallax>
          </div>

          <div className="relative z-10 flex flex-col items-center space-y-6 sm:space-y-7 lg:space-y-8">
            <h1 className="w-full text-center text-[28px] leading-[1.15] font-light text-[#F1F4FF] sm:text-[36px] lg:text-[48px] lg:leading-[1.1]">
              <span className="opacity-[0.79]">Poznaj</span>{' '}
              <span className="bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text font-normal text-transparent">
                Potęgę AI
              </span>
              <br />
              <span className="opacity-[0.79]">w Swojej Karierze</span>
            </h1>

            <p className="w-full max-w-178 text-center text-[14px] leading-normal font-light text-[#F1F4FF] opacity-[0.46] sm:text-[15px] lg:text-[18px] lg:leading-[1.45]">
              Koniec z chaosem przeglądania ofert i zgadywania, co dalej. Vocare zamienia Twój
              profil w konkretny plan: pokazuje dokąd możesz pójść, ile na tym zarobisz, jak się tam
              dostać i z czym aplikować.
            </p>

            <Button
              onClick={scrollToBento}
              variant="secondary"
              size="sm"
              icon={<Image src={arrow_icon} alt="expand" width={20} height={20} />}
              iconPosition="right"
              className="lg:h-13 lg:px-6 lg:text-[15px]"
            >
              <span className="cursor-pointer bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text text-transparent">
                Jak to działa?
              </span>
            </Button>
          </div>
        </div>
        <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
          <MainCard
            title="Doradca 
Zawodowy"
            description="3 dopasowane ścieżki kariery zamiast jednej losowej sugestii."
            href="/assistant"
          />
          <MainCard
            title="Analiza
Rynkowa"
            description="Widełki, trudność wejścia i braki kompetencji dla każdej ścieżki."
            href="/market-analysis"
          />
          <MainCard
            title="Roadmapa"
            description="Spersonalizowany plan krok po kroku pod Twój horyzont czasowy."
            href="/roadmap"
          />
          <MainCard
            title="Kreator CV"
            description="CV dopasowane do oferty i odporne na ATS - gotowe w 3 minuty."
            href="/resume-creator"
          />
        </div>
      </div>

      <div className="mx-auto mt-20 w-full 2xl:max-w-7xl">
        <div className="mb-3 flex w-full items-center justify-between px-1">
          <span className="text-[11px] font-light text-[#F1F4FF] opacity-50 sm:text-[14px] lg:text-[16px]">
            Wydaje się fajne, ale
          </span>
          <span className="text-[11px] font-light text-[#F1F4FF] opacity-50 sm:text-[14px] lg:text-[16px]">
            jak naprawdę
          </span>
          <span className="text-[11px] font-light text-[#F1F4FF] opacity-50 sm:text-[14px] lg:text-[16px]">
            to działa?
          </span>
        </div>
        <div className="h-px w-full bg-white opacity-10" />
      </div>
    </div>
  );
};

export default Features;
