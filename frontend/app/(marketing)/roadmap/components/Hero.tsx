'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useRef } from 'react';

import Header from '@/components/SectionsComponents/Header';
import Button from '@/components/ui/assistant-button';
import { expand_icon } from '@/features/marketing/constants';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const expandIconSize = {
  width: 14,
  height: 14,
};

const heroStats = [
  { value: '99%', label: 'Dopasowania do konkretnej oferty' },
  { value: '2 min', label: 'Do gotowej roadmapy' },
  { value: '1200+', label: 'Zadowolonych użytkowników' },
];

const tileOuter =
  'relative z-10 rounded-2xl bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-white/[0.04] p-[1px]';
const tileInner =
  'flex h-[58px] items-center justify-center rounded-[14px] bg-[#1A1B1F] px-2 text-center text-[11px] font-light leading-tight text-[#F1F4FF]/90 [overflow-wrap:anywhere] sm:h-[72px] sm:rounded-[15px] sm:px-5 sm:text-[15px]';

const VLine = ({ animClass }: { animClass?: string }) => (
  <div className="pointer-events-none absolute top-full left-1/2 h-10 w-px -translate-x-1/2 overflow-hidden bg-[#FFFFFF]/15">
    <div
      className={`h-full w-full origin-top scale-y-0 bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_100%)] shadow-[0_0_12px_rgba(132,145,254,0.8)] ${
        animClass || ''
      }`}
    />
  </div>
);

const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const roadmapRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: roadmapRef.current,
          start: 'top 80%',
        },
        defaults: { ease: 'none' },
      });

      tl.to('.draw-start', { scaleY: 1, duration: 0.6 });

      tl.to('.draw-h-fork', { scaleX: 1, duration: 0.4 }, 0.3);

      tl.to('.draw-v-fork', { scaleY: 1, duration: 0.15 }, 0.7);

      tl.to('.draw-vl-2', { scaleY: 1, duration: 0.4 }, 0.6);
      tl.to('.draw-vl-3', { scaleY: 1, duration: 0.4 }, 1.0);

      tl.to('.draw-vr-2', { scaleY: 1, duration: 0.4 }, 0.85);
      tl.to('.draw-vr-3', { scaleY: 0.5, duration: 0.2 }, 1.25);
      tl.to('.draw-vr-4', { scaleY: 1, duration: 0.4 }, 1.1);
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="font-poppins flex flex-col bg-[#0F1013] p-3 sm:p-5">
      <div className="relative mx-auto flex min-h-[calc(100svh-1.5rem)] w-full max-w-none flex-col overflow-hidden rounded-3xl bg-[#16161A] sm:min-h-[calc(100svh-2.5rem)] lg:min-h-0 xl:min-h-[calc(100svh-2.5rem)] 2xl:min-h-[calc(55svh-2.5rem)] 2xl:max-w-7xl">
        <Header />

        <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pt-10 pb-6 sm:px-8 sm:pt-12 sm:pb-8 md:px-12 lg:px-16 lg:pt-[clamp(3rem,10svh,7rem)] lg:pb-12 2xl:pt-20">
          <div className="relative z-10 flex flex-col items-center gap-6 sm:gap-10 lg:flex-row lg:items-start lg:gap-10">
            <div className="flex w-full max-w-142.75 flex-col items-center text-center lg:flex-1 lg:items-start lg:self-stretch lg:text-left">
              <h1 className="w-full text-[28px] leading-[1.15] font-light text-[#F1F4FF] sm:text-[36px] lg:text-[48px] lg:leading-[1.1]">
                <span className="opacity-[0.79]">Od celu do</span> <br />
                <span className="bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text font-normal text-transparent">
                  Konkretnych Kroków
                </span>
              </h1>

              <p className="mt-5 w-full max-w-124.5 text-[14px] leading-normal font-light text-[#F1F4FF] opacity-[0.46] sm:mt-6 sm:text-[15px] lg:mt-7 lg:text-[16px] lg:leading-[1.45]">
                Przestań zgadywać, co robić jako pierwsze. Na bazie Twojej ścieżki kariery stworzymy
                plan dostosowany do wybranego horyzontu - żebyś wiedział dokładnie, co robić dziś, a
                co za miesiąc.
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
                    <span className="bg-[linear-gradient(180deg,#8FBCFE_0%,#91A3FE_60%,#B09FFE_100%)] bg-clip-text text-[28px] leading-none text-transparent sm:text-[36px] lg:text-[36px] xl:text-[46px]">
                      {stat.value}
                    </span>
                    <span className="text-[10px] leading-tight sm:text-[11px] lg:text-[14px]">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div ref={roadmapRef} className="relative w-full self-stretch lg:flex-1">
              <div className="relative mx-auto w-full max-w-[520px] pt-4">
                <div className="pointer-events-none absolute inset-x-0 top-4 z-0">
                  <div
                    className="absolute top-[4.875rem] h-px overflow-hidden bg-[#FFFFFF]/15 sm:top-[5.75rem]"
                    style={{
                      left: 'calc(25% - 12px)',
                      width: 'calc(50% + 24px)',
                    }}
                  >
                    <div className="draw-h-fork h-full w-full origin-left scale-x-0 bg-[linear-gradient(90deg,#9296FD_0%,#8491FE_50%,#9D9BFF_100%)] shadow-[0_0_12px_rgba(132,145,254,0.8)]" />
                  </div>
                  <div
                    className="absolute top-[4.875rem] w-px overflow-hidden bg-[#FFFFFF]/15 sm:top-[5.75rem]"
                    style={{
                      left: 'calc(75% + 12px)',
                      height: '1.25rem',
                    }}
                  >
                    <div className="draw-v-fork h-full w-full origin-top scale-y-0 bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_100%)] shadow-[0_0_12px_rgba(132,145,254,0.8)]" />
                  </div>
                </div>
                <div className="relative z-10 grid grid-cols-2 gap-x-12 gap-y-10">
                  {' '}
                  <div className={`${tileOuter} col-start-1 row-start-1`}>
                    <div className={tileInner}>Fundamenty programowania CNC</div>
                    <VLine animClass="draw-start" />
                  </div>
                  <div className={`${tileOuter} col-start-1 row-start-2`}>
                    <div className={tileInner}>Rysunek techniczny</div>
                    <VLine animClass="draw-vl-2" />
                  </div>
                  <div className={`${tileOuter} col-start-2 row-start-2`}>
                    <div className={tileInner}>Fanuc w praktyce</div>
                    <VLine animClass="draw-vr-2" />
                  </div>
                  <div className={`${tileOuter} col-start-1 row-start-3`}>
                    <div className={tileInner}>Metrologia</div>
                    <VLine animClass="draw-vl-3" />
                  </div>
                  <div className={`${tileOuter} col-start-2 row-start-3`}>
                    <div className={tileInner}>Podstawy systemów CAM</div>
                    <VLine animClass="draw-vr-3" />
                  </div>
                  <div className={`${tileOuter} col-start-1 row-start-4`}>
                    <div className={tileInner}>G-code</div>
                  </div>
                  <div className={`${tileOuter} col-start-2 row-start-4`}>
                    <div className={tileInner}>Weryfikacja kodu</div>
                    <VLine animClass="draw-vr-4" />{' '}
                  </div>
                  <div className={`${tileOuter} col-start-2 row-start-5`}>
                    <div className={tileInner}>Makroprogramowanie</div>
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-48 bg-gradient-to-t from-[#16161A] via-[#16161A]/85 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
