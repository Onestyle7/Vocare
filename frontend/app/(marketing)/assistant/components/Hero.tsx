import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

import Header from '@/components/SectionsComponents/Header';
import Button from '@/components/ui/assistant-button';
import { expand_icon, hero_image } from '@/features/marketing/constants';

const heroImageSize = {
  width: 422,
  height: 524,
};

const expandIconSize = {
  width: 14,
  height: 14,
};

const heroStats = [
  { value: '95%', label: 'Dokładności przy generowaniu' },
  { value: '46%', label: 'Więcej rozmów rekrutacyjnych' },
  { value: '1200+', label: 'Zadowolonych użytkowników' },
];

const heroLines = [
  {
    src: '/asisstant/Line 28.png',
    width: 955,
    height: 3,
    left: 0,
    top: 18,
    opacity: 0,
  },
  {
    src: '/asisstant/Line 29.png',
    width: 815,
    height: 7,
    left: 138,
    top: 225,
    opacity: 0.8,
  },
  {
    src: '/asisstant/Line 28.png',
    width: 697,
    height: 3,
    left: 299,
    top: 487,
    opacity: 0.9,
  },
  {
    src: '/asisstant/Line 26.png',
    width: 486,
    height: 794,
    left: 0,
    top: 0,
    opacity: 0.9,
  },
  {
    src: '/asisstant/Line 27.png',
    width: 486,
    height: 794,
    left: 278,
    top: 0,
    opacity: 0.9,
  },
  {
    src: '/asisstant/Line 30.png',
    width: 539,
    height: 794,
    left: 468,
    top: 0,
    opacity: 0.82,
  },
  {
    src: '/asisstant/Line 31-1.png',
    width: 257,
    height: 582,
    left: 309,
    top: 312,
    opacity: 0.75,
  },
  {
    src: '/asisstant/Line 31.png',
    width: 126,
    height: 177,
    left: 262,
    top: 254,
    opacity: 0,
  },
  {
    src: '/asisstant/Line 32.png',
    width: 540,
    height: 794,
    left: 554,
    top: 0,
    opacity: 0.82,
  },
  {
    src: '/asisstant/Line 33.png',
    width: 487,
    height: 794,
    left: 734,
    top: 200,
    opacity: 0.82,
  },
];

const Hero = () => {
  return (
    <div className="font-poppins flex flex-col bg-[#0F1013] p-3 sm:p-5">
      <div className="relative mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-none flex-col overflow-hidden rounded-3xl bg-[#16161A] sm:min-h-[calc(100dvh-2.5rem)] lg:min-h-0 2xl:max-w-7xl">
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 right-0 hidden h-198.5 w-238.75 overflow-hidden lg:block xl:-right-20.5 2xl:hidden"
        >
          {heroLines.map((line) => (
            <Image
              key={line.src + '-' + line.left + '-' + line.top}
              src={line.src}
              alt=""
              width={line.width}
              height={line.height}
              className="absolute h-auto max-w-none select-none"
              style={{
                left: line.left,
                top: line.top,
                width: line.width,
                opacity: line.opacity,
              }}
            />
          ))}
        </div>

        <Header />

        <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-8 sm:py-8 md:px-12 lg:px-16 lg:pt-8 lg:pb-12 2xl:pt-20">
          <div className="relative z-10 flex flex-1 flex-col items-center gap-10 sm:gap-14 lg:flex-row lg:items-start lg:gap-10">
            <div className="flex w-full max-w-142.75 flex-col items-center text-center lg:flex-1 lg:items-start lg:text-left">
              <h1 className="w-full text-[28px] leading-[1.15] text-[#F1F4FF] sm:text-[36px] lg:text-[48px] lg:leading-[1.1]">
                <span className="opacity-[0.79]">Nie szukaj pracy, Zaplanuj </span>
                <span className="bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text font-medium text-transparent">
                  całą karierę
                </span>
              </h1>

              <p className="mt-5 w-full max-w-124.5 text-[14px] leading-normal font-light text-[#F1F4FF] opacity-[0.46] sm:mt-6 sm:text-[15px] lg:mt-7 lg:text-[16px] lg:leading-[1.45]">
                Przestań gonić pojedyncze oferty. Nasz algorytm analizuje tysiące scenariuszy, by
                stworzyć dla Ciebie precyzyjny i wieloletni plan zawodowego rozwoju.
              </p>

              <div className="mt-7 flex w-full flex-wrap items-center justify-center gap-3 sm:mt-8 lg:mt-10 lg:justify-start lg:gap-4">
                <Button
                  href="/dashboard"
                  variant="primary"
                  size="sm"
                  icon={<ChevronRight size={18} />}
                  iconPosition="right"
                  className="lg:h-13 lg:px-6 lg:text-[15px]"
                >
                  Sprawdź za darmo
                </Button>

                <Button
                  href="/"
                  variant="secondary"
                  size="sm"
                  icon={
                    <Image
                      src={expand_icon}
                      alt="expand"
                      fill
                      className="pointer-events-none object-contain"
                    />
                  }
                  iconPosition="left"
                  iconWrapperClassName="relative"
                  iconWrapperStyle={{
                    width: expandIconSize.width,
                    height: expandIconSize.height,
                  }}
                  className="lg:h-13 lg:px-6 lg:text-[15px]"
                >
                  <span className="bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text text-transparent">
                    Sprawdź pozostałe
                  </span>
                </Button>
              </div>

              <div className="mt-8 grid w-full max-w-127.5 grid-cols-3 gap-3 sm:mt-10 sm:gap-6 lg:gap-8">
                {heroStats.map((stat) => (
                  <div
                    key={stat.value}
                    className="flex flex-col items-center space-y-1.5 text-[#686A71] lg:items-start lg:space-y-2"
                  >
                    <span className="bg-[linear-gradient(180deg,#8FBCFE_0%,#91A3FE_60%,#B09FFE_100%)] bg-clip-text text-[28px] leading-none text-transparent sm:text-[36px] lg:text-[46px]">
                      {stat.value}
                    </span>
                    <span className="text-[10px] leading-tight sm:text-[11px] lg:text-[14px]">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href="/privacy-policy"
                className="mt-6 flex h-10 w-full max-w-85 cursor-pointer items-center justify-center space-x-2 rounded-full bg-[#191B1F] px-4 text-[11px] text-[#7B7D84] sm:mt-7 sm:h-11 sm:max-w-95 sm:text-[12px] lg:mt-8 lg:h-13 lg:max-w-97.75 lg:text-[14px]"
              >
                <span className="h-1.5 w-1.5 flex-none rounded-full bg-[#8491FD] sm:h-2 sm:w-2"></span>
                <p className="truncate">Sprawdź w jaki sposób wykorzystujemy dane</p>
              </Link>
            </div>

            <div className="relative flex w-full justify-center lg:flex-1 lg:justify-end">
              <div
                className="pointer-events-none relative w-full max-w-60 sm:max-w-[320px] lg:max-w-105.5"
                style={{
                  aspectRatio: heroImageSize.width + ' / ' + heroImageSize.height,
                }}
              >
                <Image
                  src={hero_image}
                  alt="hero-img"
                  fill
                  priority
                  sizes="(max-width: 640px) 240px, (max-width: 1024px) 320px, 422px"
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
