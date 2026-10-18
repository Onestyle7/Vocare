'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';

import { analiza_brakow, generowanie_cv } from '@/features/marketing/constants';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const Benefits = () => {
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray('.desktop-card');
      const finalY = [112, 28, 0, 28, 112];
      const finalRotations = [-24, -12, 0, 12, 24];

      gsap.fromTo(
        cards,
        {
          opacity: 0,
          y: 300,
          x: (i) => (i - 2) * 150,
          rotation: (i) => (i - 2) * 45,
        },
        {
          opacity: 1,
          x: 0,
          y: (i) => finalY[i],
          rotation: (i) => finalRotations[i],
          transformOrigin: 'bottom center',
          ease: 'power2.out',
          scrollTrigger: {
            trigger: cardsContainerRef.current,
            start: 'top 85%',
            end: 'top 35%',
            scrub: 1.5,
          },
        }
      );
    },
    { scope: cardsContainerRef }
  );

  return (
    <div className="font-poppins flex flex-col bg-[#0F1013] p-3 sm:p-5">
      <div className="relative mx-auto flex w-full max-w-none flex-col overflow-hidden rounded-3xl 2xl:max-w-7xl">
        <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-12 sm:px-8 sm:py-16 md:px-12 lg:px-16 lg:py-20 2xl:py-24">
          <div className="flex flex-col items-center space-y-6 sm:space-y-7 lg:space-y-8">
            <h2 className="w-full text-center text-[28px] leading-[1.15] font-light text-[#F1F4FF] sm:text-[36px] lg:text-[48px] lg:leading-[1.1]">
              <span className="opacity-[0.79]">Od Oferty do</span>{' '}
              <span className="bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text font-normal text-transparent">
                Gotowego CV
              </span>
              <br />
              <span className="opacity-[0.79]">w Kilka Kliknięć</span>
            </h2>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:mt-20 md:grid-cols-2 md:gap-x-12 md:gap-y-20 lg:mt-28 lg:gap-x-16 lg:gap-y-24">
            <div className="order-1 flex flex-col justify-center">
              <div className="mb-6 flex items-center gap-10 lg:gap-12">
                <span className="text-[20px] font-light text-[#F1F4FF]/90 lg:text-[22px]">01</span>
                <h3 className="text-[20px] font-light text-[#F1F4FF]/90 lg:text-[22px]">
                  Generowanie CV
                </h3>
              </div>
              <p className="text-[17px] leading-7 font-light text-[#F1F4FF]/70 lg:text-[18px] lg:leading-8">
                Wystarczy link do ogłoszenia resztą zajmie się kreator, który pobiera wymagania,
                porównuje je z Twoim profilem i generuje kompletne CV dopasowane do stanowiska.
                <br />
                Cały proces zajmuje{' '}
                <span className="bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text font-normal text-transparent">
                  mniej niż 3 minuty
                </span>
                .
              </p>
            </div>

            <div className="order-2 aspect-[10/9] w-full rounded-[24px] bg-gradient-to-br from-white/10 via-white/5 to-transparent p-[1px]">
              <div className="relative h-full w-full overflow-hidden rounded-[23px] bg-[#1A1B1F]">
                <video
                  src={generowanie_cv}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="order-3 flex flex-col justify-center md:order-4">
              <div className="mb-6 flex items-center gap-10 lg:gap-12">
                <span className="text-[20px] font-light text-[#F1F4FF]/90 lg:text-[22px]">02</span>
                <h3 className="text-[20px] font-light text-[#F1F4FF]/90 lg:text-[22px]">
                  Analiza Braków
                </h3>
              </div>
              <p className="text-[17px] leading-7 font-light text-[#F1F4FF]/70 lg:text-[18px] lg:leading-8">
                Nasz system ocenia jakość wprowadzonych danych. Jeśli jakaś sekcja jest zbyt uboga,
                od razu dostaniesz wskazówkę, co do niej dodać, aby zrobić{' '}
                <span className="bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text font-normal text-transparent">
                  lepsze wrażenie
                </span>{' '}
                na rekruterze.
              </p>
            </div>

            <div className="order-4 aspect-[10/9] w-full rounded-[24px] bg-gradient-to-br from-white/10 via-white/5 to-transparent p-[1px] md:order-3">
              <div className="relative h-full w-full overflow-hidden rounded-[23px] bg-[#1A1B1F]">
                <video
                  src={analiza_brakow}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Benefits;
