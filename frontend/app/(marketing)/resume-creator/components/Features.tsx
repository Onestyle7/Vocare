'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, MoreVertical } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';

import Button from '@/components/ui/assistant-button';
import { Separator } from '@/components/ui/separator';
import {
  arrow_icon,
  bottom_puzzle,
  featuresList,
  glass_img,
  upper_puzzle,
} from '@/features/marketing/constants';
import { useCardsAnimation } from '@/features/marketing/constants/animations';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const Features = () => {
  const bentoRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const clientWidth = e.currentTarget.clientWidth;
    const activeIndex = Math.round(scrollLeft / clientWidth);
    setActiveSlide(activeIndex);
  };

  useCardsAnimation(cardsContainerRef);

  return (
    <div className="font-poppins flex w-full max-w-[100vw] flex-col overflow-x-hidden bg-[#0F1013] p-3 sm:p-5">
      {' '}
      <div className="relative mx-auto flex w-full max-w-none flex-col overflow-hidden rounded-3xl 2xl:max-w-7xl">
        <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-12 sm:px-8 sm:py-16 md:px-12 lg:px-16 lg:py-20 2xl:py-24">
          <div className="flex flex-col items-center space-y-6 sm:space-y-7 lg:space-y-8">
            <h2 className="w-full text-center text-[28px] leading-[1.15] font-light text-[#F1F4FF] sm:text-[36px] lg:text-[48px] lg:leading-[1.1]">
              <span className="opacity-[0.79]">Poznaj</span>{' '}
              <span className="bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text font-normal text-transparent">
                Potęgę AI
              </span>
              <br />
              <span className="opacity-[0.79]">w Tworzeniu CV</span>
            </h2>

            <p className="w-full max-w-178 text-center text-[14px] leading-normal font-light text-[#F1F4FF] opacity-[0.46] sm:text-[15px] lg:text-[18px] lg:leading-[1.45]">
              Zanim Twoje CV zobaczy rekruter, musi przejść przez algorytm. Nasz kreator zestawia
              Twój profil z ofertą, uzupełnia brakujące słowa kluczowe i tworzy aplikację w 100%
              odporną na ATS.
            </p>

            <Button
              href="/dashboard"
              variant="secondary"
              size="sm"
              icon={<Image src={arrow_icon} alt="expand" width={20} height={20} />}
              iconPosition="right"
              className="lg:h-13 lg:px-6 lg:text-[15px]"
            >
              <span className="cursor-pointer bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text text-transparent">
                Sprawdź swoje obecne CV
              </span>
            </Button>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[360px] flex-col items-center pt-10 pb-4 xl:hidden">
          <div
            className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-6 [&::-webkit-scrollbar]:hidden"
            onScroll={handleScroll}
          >
            <div className="z-0 h-[250px] w-full shrink-0 snap-center rounded-[24px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-transparent to-[55%] p-[1px]">
              <div className="flex h-full w-full flex-col space-y-[21px] rounded-[23px] bg-[#202125] p-5">
                <p className="text-[22px] opacity-[75%]">Analiza ATS</p>
                <Separator className="h-[1px]! bg-[#FFFFFF]/50!" />
                <p className="text-[16px] font-light opacity-[50%]">
                  Twoje CV jest automatycznie sprawdzane pod kątem zgodności z systemami ATS. Koniec
                  z odrzuceniem przez robota.
                </p>
              </div>
            </div>

            <div className="z-10 h-[250px] w-full shrink-0 snap-center rounded-[24px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-transparent to-[55%] p-[1px]">
              <div className="relative h-full w-full overflow-hidden rounded-[23px] bg-[#202125]">
                <div className="pointer-events-none absolute inset-0 z-0">
                  {[
                    { row: 1, col: 1, opacity: 0.05 },
                    { row: 3, col: 3, opacity: 0.04 },
                    { row: 5, col: 0, opacity: 0.05 },
                    { row: 6, col: 3, opacity: 0.03 },
                  ].map((cell, i) => (
                    <div
                      key={i}
                      className="absolute"
                      style={{
                        top: cell.row * 43,
                        left: cell.col * 43,
                        width: 43,
                        height: 43,
                        backgroundColor: `rgba(255, 255, 255, ${cell.opacity})`,
                      }}
                    />
                  ))}
                </div>

                <div
                  className="pointer-events-none absolute inset-0 z-0 opacity-30"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '43px 43px',
                  }}
                />

                <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
                  <Image
                    src={upper_puzzle}
                    alt="puzzle top"
                    width={140}
                    height={140}
                    className="-mb-3 rotate-12"
                  />
                  <Image
                    src={bottom_puzzle}
                    alt="puzzle bottom"
                    width={90}
                    height={90}
                    className="-mt-8 -ml-2 rotate-12"
                  />
                </div>
              </div>
            </div>

            <div className="z-20 h-[250px] w-full shrink-0 snap-center rounded-[24px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-transparent to-[55%] p-[1px]">
              <div className="flex h-full w-full flex-col space-y-[21px] rounded-[23px] bg-[#202125] p-5">
                <p className="text-[22px] opacity-[75%]">Dopasowanie do oferty</p>
                <Separator className="h-[1px]! bg-[#FFFFFF]/50!" />
                <p className="text-[16px] font-light opacity-[50%]">
                  Twoje CV jest automatycznie sprawdzane pod kątem zgodności z systemami ATS. Koniec
                  z odrzuceniem przez robota.
                </p>
              </div>
            </div>

            <div className="z-10 h-[250px] w-full shrink-0 snap-center rounded-[24px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-transparent to-[55%] p-[1px]">
              <div className="relative h-full w-full overflow-hidden rounded-[23px] bg-[#202125]">
                <div className="pointer-events-none absolute inset-0 z-0">
                  {[
                    { row: 0, col: 2, opacity: 0.04 },
                    { row: 2, col: 0, opacity: 0.05 },
                    { row: 4, col: 3, opacity: 0.03 },
                    { row: 6, col: 1, opacity: 0.05 },
                  ].map((cell, i) => (
                    <div
                      key={i}
                      className="absolute"
                      style={{
                        top: cell.row * 43,
                        left: cell.col * 43,
                        width: 43,
                        height: 43,
                        backgroundColor: `rgba(255, 255, 255, ${cell.opacity})`,
                      }}
                    />
                  ))}
                </div>

                <div
                  className="pointer-events-none absolute inset-0 z-0 opacity-30"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '43px 43px',
                  }}
                />

                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                  <Image src={glass_img} alt="magnifying glass" width={240} height={240} />
                </div>
              </div>
            </div>

            <div className="z-0 h-[250px] w-full shrink-0 snap-center rounded-[24px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-transparent to-[55%] p-[1px]">
              <div className="flex h-full w-full flex-col space-y-[21px] rounded-[23px] bg-[#202125] p-5">
                <p className="text-[22px] opacity-[75%]">Brakujące umiejętności</p>
                <Separator className="h-[1px]! bg-[#FFFFFF]/50!" />
                <p className="text-[16px] font-light opacity-[50%]">
                  Otrzymujesz listę skilli, których brakuje Ci do idealnego dopasowania wraz z
                  konkretnymi sugestiami co uzupełnić.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                  activeSlide === index ? 'bg-[#C7A9FE]' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        <div
          ref={cardsContainerRef}
          className="hidden w-full items-center justify-center gap-0 px-0 xl:flex"
        >
          <div className="desktop-card z-0 h-[318px] w-[216px] rounded-[24px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-transparent to-[55%] p-[1px]">
            <div className="flex h-full w-full flex-col space-y-[21px] rounded-[23px] bg-[#202125] p-5">
              <p className="text-[22px] opacity-[75%]">Analiza ATS</p>
              <Separator className="h-[1px]! bg-[#FFFFFF]/50!" />
              <p className="text-[16px] font-light opacity-[50%]">
                Twoje CV jest automatycznie sprawdzane pod kątem zgodności z systemami ATS. Koniec z
                odrzuceniem przez robota.
              </p>
            </div>
          </div>

          <div className="desktop-card z-10 h-[318px] w-[216px] rounded-[24px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-transparent to-[55%] p-[1px]">
            <div className="relative h-full w-full overflow-hidden rounded-[23px] bg-[#202125]">
              <div className="pointer-events-none absolute inset-0 z-0">
                {[
                  { row: 1, col: 1, opacity: 0.05 },
                  { row: 3, col: 3, opacity: 0.04 },
                  { row: 5, col: 0, opacity: 0.05 },
                  { row: 6, col: 3, opacity: 0.03 },
                ].map((cell, i) => (
                  <div
                    key={i}
                    className="absolute"
                    style={{
                      top: cell.row * 43,
                      left: cell.col * 43,
                      width: 43,
                      height: 43,
                      backgroundColor: `rgba(255, 255, 255, ${cell.opacity})`,
                    }}
                  />
                ))}
              </div>

              <div
                className="pointer-events-none absolute inset-0 z-0 opacity-30"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '43px 43px',
                }}
              />

              <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
                <Image
                  src={upper_puzzle}
                  alt="puzzle top"
                  width={185}
                  height={185}
                  className="-mb-3 rotate-12"
                />
                <Image
                  src={bottom_puzzle}
                  alt="puzzle bottom"
                  width={120}
                  height={120}
                  className="-mt-8 -ml-2 rotate-12"
                />
              </div>
            </div>
          </div>

          <div className="desktop-card z-20 h-[318px] w-[216px] rounded-[24px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-transparent to-[55%] p-[1px]">
            <div className="flex h-full w-full flex-col space-y-[21px] rounded-[23px] bg-[#202125] p-5">
              <p className="text-[22px] opacity-[75%]">Dopasowanie do oferty</p>
              <Separator className="h-[1px]! bg-[#FFFFFF]/50!" />
              <p className="text-[16px] font-light opacity-[50%]">
                Twoje CV jest automatycznie sprawdzane pod kątem zgodności z systemami ATS. Koniec z
                odrzuceniem przez robota.
              </p>
            </div>
          </div>

          <div className="desktop-card z-10 h-[318px] w-[216px] rounded-[24px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-transparent to-[55%] p-[1px]">
            <div className="relative h-full w-full overflow-hidden rounded-[23px] bg-[#202125]">
              <div className="pointer-events-none absolute inset-0 z-0">
                {[
                  { row: 0, col: 2, opacity: 0.04 },
                  { row: 2, col: 0, opacity: 0.05 },
                  { row: 4, col: 3, opacity: 0.03 },
                  { row: 6, col: 1, opacity: 0.05 },
                ].map((cell, i) => (
                  <div
                    key={i}
                    className="absolute"
                    style={{
                      top: cell.row * 43,
                      left: cell.col * 43,
                      width: 43,
                      height: 43,
                      backgroundColor: `rgba(255, 255, 255, ${cell.opacity})`,
                    }}
                  />
                ))}
              </div>

              <div
                className="pointer-events-none absolute inset-0 z-0 opacity-30"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '43px 43px',
                }}
              />

              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                <Image src={glass_img} alt="magnifying glass" width={320} height={320} />
              </div>
            </div>
          </div>

          <div className="desktop-card z-0 h-[318px] w-[216px] rounded-[24px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-transparent to-[55%] p-[1px]">
            <div className="flex h-full w-full flex-col space-y-[21px] rounded-[23px] bg-[#202125] p-5">
              <p className="text-[22px] opacity-[75%]">Brakujące umiejętności</p>
              <Separator className="h-[1px]! bg-[#FFFFFF]/50!" />
              <p className="text-[16px] font-light opacity-[50%]">
                Otrzymujesz listę skilli, których brakuje Ci do idealnego dopasowania wraz z
                konkretnymi sugestiami co uzupełnić.
              </p>
            </div>
          </div>
        </div>

        <div
          ref={bentoRef}
          className="relative mx-auto flex w-full max-w-5xl flex-col px-4 pt-16 pb-12 sm:px-8 sm:pt-20 sm:pb-16 md:px-12 lg:px-16 lg:pb-20 xl:pt-56"
        >
          <div className="grid grid-cols-1 gap-x-32 gap-y-14 md:grid-cols-2 lg:gap-x-48">
            {featuresList.map((item) => (
              <div key={item.number} className="flex flex-col">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Image src={item.icon} alt="" width={20} height={20} />
                    <span className="text-[15px] font-light text-[#F1F4FF] opacity-90">
                      {item.label}
                    </span>
                  </div>
                  <MoreVertical size={18} className="text-[#F1F4FF] opacity-40" />
                </div>

                <Separator className="mb-8 h-[1px]! bg-[#FFFFFF]/10!" />

                <h3 className="mb-4 text-[20px] leading-[1.3] font-light text-[#F1F4FF] opacity-90 lg:text-[22px]">
                  {item.number}. {item.title}
                </h3>

                <p className="mb-8 text-[14px] leading-6 font-light text-[#F1F4FF] opacity-50">
                  {item.description}
                </p>

                <Link
                  href="/dashboard/resume"
                  className="inline-flex items-center gap-1.5 text-[14px] text-[#F1F4FF] opacity-70 transition-opacity hover:opacity-100"
                >
                  Dowiedz się więcej
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto mt-4 w-full 2xl:max-w-7xl">
        <div className="mb-3 flex w-full items-center justify-between px-1">
          <span className="text-[11px] font-light text-[#F1F4FF] opacity-50 sm:text-[14px] lg:text-[16px]">
            Wydaje się fajne, ale
          </span>
          <span className="text-[11px] font-light text-[#F1F4FF] opacity-50 sm:text-[14px] lg:text-[16px]">
            co tak naprawdę
          </span>
          <span className="text-[11px] font-light text-[#F1F4FF] opacity-50 sm:text-[14px] lg:text-[16px]">
            możesz zyskać?
          </span>
        </div>
        <div className="h-px w-full bg-white opacity-10" />
      </div>
    </div>
  );
};

export default Features;
