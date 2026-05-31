'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useRef } from 'react';
import { ScrollParallax } from 'react-just-parallax';

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
  { value: '8 róż.', label: 'atrybutów stylu pracy' },
  { value: '4 poz.', label: 'Wynagrodzeń dla stanowisk' },
  { value: '1200+', label: 'Zadowolonych użytkowników' },
];

const GridBackground = () => {
  const cellSize = 41;
  const highlightedCells = [
    { row: 1, col: 2, opacity: 0.03 },
    { row: 0, col: 8, opacity: 0.03 },
    { row: 6, col: 2, opacity: 0.03 },
    { row: 2, col: 4, opacity: 0.03 },
    { row: 4, col: 12, opacity: 0.03 },
  ];

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
      style={{
        WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, #000 10%, transparent 100%)',
        maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, #000 10%, transparent 100%)',
      }}
    >
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="grid-pattern"
            width={cellSize}
            height={cellSize}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`}
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        {highlightedCells.map((cell, i) => (
          <rect
            key={i}
            x={cell.col * cellSize}
            y={cell.row * cellSize}
            width={cellSize}
            height={cellSize}
            fill={`rgba(255, 255, 255, ${cell.opacity})`}
          />
        ))}
      </svg>
    </div>
  );
};

const DifficultyRing = ({ value = 82 }: { value?: number }) => {
  const ringRef = useRef<SVGSVGElement>(null);
  const progressRef = useRef<SVGCircleElement>(null);
  const size = 168;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (value / 100) * circumference;

  useGSAP(
    () => {
      if (!progressRef.current) return;
      gsap.fromTo(
        progressRef.current,
        { strokeDashoffset: circumference },
        {
          strokeDashoffset: targetOffset,
          duration: 1.4,
          ease: 'power3.out',
          delay: 0.2,
          scrollTrigger: {
            trigger: ringRef.current,
            start: 'top 85%',
          },
        }
      );
    },
    { scope: ringRef }
  );

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        ref={ringRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <defs>
          <linearGradient id="difficulty-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8FBCFE" />
            <stop offset="50%" stopColor="#8491FE" />
            <stop offset="100%" stopColor="#C7A9FE" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2A2B30"
          strokeWidth={stroke}
        />
        <circle
          ref={progressRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#difficulty-gradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[13px] leading-tight font-light text-[#C9CCD4]">
          Trudność
          <br />
          wejścia
        </span>
        <span className="mt-1 text-[#F1F4FF]">
          <span className="text-[28px] font-medium">{value}</span>
          <span className="text-[14px] text-[#9CA3AF]">/100</span>
        </span>
      </div>
    </div>
  );
};

const CountUp = ({
  value,
  suffix = ' PLN',
  duration = 1.4,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) => {
  const elRef = useRef<HTMLSpanElement>(null);
  useGSAP(
    () => {
      if (!elRef.current) return;
      const counter = { val: 0 };
      gsap.to(counter, {
        val: value,
        duration,
        ease: 'power3.out',
        delay: 0.2,
        scrollTrigger: {
          trigger: elRef.current,
          start: 'top 85%',
        },
        onUpdate: () => {
          if (elRef.current) {
            elRef.current.textContent = Math.round(counter.val).toLocaleString('pl-PL') + suffix;
          }
        },
      });
    },
    { scope: elRef }
  );

  return (
    <span ref={elRef} className="text-[16px]">
      0{suffix}
    </span>
  );
};

const Hero = () => {
  const widgetRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>('.progress-fill').forEach((bar) => {
        gsap.to(bar, {
          width: bar.dataset.target,
          duration: 1.2,
          ease: 'power3.out',
          delay: 0.2,
          scrollTrigger: {
            trigger: widgetRef.current,
            start: 'top 85%',
          },
        });
      });
    },
    { scope: widgetRef }
  );

  return (
    <div className="font-poppins flex flex-col bg-[#0F1013] p-3 sm:p-5">
      <div className="relative mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-none flex-col overflow-hidden rounded-3xl bg-[#16161A] sm:min-h-[calc(100dvh-2.5rem)] 2xl:min-h-0 2xl:max-w-7xl">
        <Header />
        <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-8 sm:py-8 md:px-12 lg:px-16 lg:pt-8 lg:pb-12 2xl:pt-20">
          <div className="relative z-10 flex flex-1 flex-col items-center gap-10 sm:gap-14 lg:flex-row lg:items-start lg:gap-10">
            <div className="flex w-full max-w-142.75 flex-col items-center text-center lg:flex-1 lg:items-start lg:text-left">
              <h1 className="w-full text-[28px] leading-[1.15] text-[#F1F4FF] sm:text-[36px] lg:text-[48px] lg:leading-[1.1]">
                <span className="opacity-[0.79]">
                  Rynek czeka na <br />
                </span>
                <span className="bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text font-medium text-transparent">
                  Twój ruch
                </span>
              </h1>
              <p className="mt-5 w-full max-w-124.5 text-[14px] leading-normal font-light text-[#F1F4FF] opacity-[0.46] sm:mt-6 sm:text-[15px] lg:mt-7 lg:text-[16px] lg:leading-[1.45]">
                Nie zgaduj, czy Twoja ścieżka kariery ma sens. Tworzymy raport, który pokazuje
                widełki, trudność wejścia, brakujące kompetencje - dla każdej Twojej ścieżki osobno.
              </p>
              <div className="mt-7 flex w-full flex-wrap items-center justify-center gap-3 sm:mt-8 lg:mt-10 lg:justify-start lg:gap-4">
                <Button
                  href="/sign-up"
                  variant="primary"
                  size="sm"
                  icon={<ChevronRight size={18} />}
                  iconPosition="right"
                  className="lg:h-13 lg:px-6 lg:text-[15px]"
                >
                  Sprawdź za darmo
                </Button>
                <Button
                  href="/explore"
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
              <button className="mt-6 flex h-10 w-full max-w-85 items-center justify-center space-x-2 rounded-full bg-[#191B1F] px-4 text-[11px] text-[#7B7D84] sm:mt-7 sm:h-11 sm:max-w-95 sm:text-[12px] lg:mt-8 lg:h-13 lg:max-w-97.75 lg:text-[14px]">
                <span className="h-1.5 w-1.5 flex-none rounded-full bg-[#8491FD] sm:h-2 sm:w-2"></span>
                <p className="truncate">Sprawdź w jaki sposób wykorzystujemy dane</p>
              </button>
            </div>

            <div className="relative flex min-h-[380px] w-full overflow-hidden rounded-3xl sm:min-h-[440px] lg:min-h-100 lg:flex-1 lg:self-stretch">
              <GridBackground />

              <div className="absolute top-6 left-2 z-10 origin-top-left scale-[0.70] sm:top-10 sm:left-6 sm:scale-90 lg:top-10 lg:left-10 lg:scale-100 2xl:top-0">
                <ScrollParallax strength={0.14}>
                  <div className="h-[56px] w-[136px] rounded-[16px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-white/[0.04] p-[1px]">
                    <div className="flex h-full w-full flex-row items-center justify-center gap-2 rounded-[15px] bg-[#202125]">
                      <div className="flex w-full flex-row items-center justify-center gap-2 pr-2 text-[#F1F4FF]">
                        <ArrowDown />
                        <CountUp value={6000} />
                      </div>
                    </div>
                  </div>
                </ScrollParallax>
              </div>

              <div className="absolute top-[85px] left-6 z-10 origin-top-left scale-[0.70] sm:top-28 sm:left-12 sm:scale-90 lg:top-1/4 lg:left-1/4 lg:scale-100">
                <ScrollParallax strength={0.06}>
                  <div className="h-[56px] w-[136px] rounded-[16px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-white/[0.04] p-[1px]">
                    <div className="flex h-full w-full flex-row items-center justify-center gap-2 rounded-[15px] bg-[#202125]">
                      <div className="flex w-full flex-row items-center justify-center gap-2 pr-2 text-[#F1F4FF]">
                        <ArrowDown className="rotate-x-180" />
                        <CountUp value={9600} />
                      </div>
                    </div>
                  </div>
                </ScrollParallax>
              </div>

              <div className="absolute top-6 right-2 z-10 origin-top-right scale-[0.70] sm:top-8 sm:right-6 sm:scale-90 lg:top-8 lg:right-12 lg:scale-100">
                <DifficultyRing value={82} />
              </div>

              <div className="absolute bottom-6 left-1/2 z-10 origin-bottom -translate-x-1/2 scale-[0.85] sm:bottom-10 sm:scale-95 lg:-bottom-6 lg:-translate-y-1/2 lg:scale-100">
                <div
                  ref={widgetRef}
                  className="h-[194px] w-[372px] rounded-[16px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-white/[0.04] p-[1px]"
                >
                  <div className="flex h-full w-full flex-col justify-center rounded-[15px] bg-[#1E1F24] p-5">
                    <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-9">
                      {[
                        { name: 'Motywacja', progress: '30%' },
                        { name: 'Styl pracy', progress: '65%' },
                        { name: 'Wynagrodzenie', progress: '40%' },
                        { name: 'Rekomendacja', progress: '20%' },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="relative h-[42px] w-full rounded-[12px] border border-dashed border-[#44464C]"
                        >
                          <div className="absolute -top-[18px] left-1/2 flex w-[124px] -translate-x-1/2 flex-col items-center justify-center rounded-[10px] bg-[#2C2D33] py-2 shadow-lg">
                            <span className="text-[12px] font-normal tracking-wide text-[#9CA3AF]">
                              {item.name}
                            </span>
                            <div className="mt-1.5 h-[2px] w-[50px] overflow-hidden rounded-full bg-[#4B4D54]">
                              <div
                                className="progress-fill h-full w-0 bg-[#9CA3AF]"
                                data-target={item.progress}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-0 z-30 rounded-3xl bg-gradient-to-b from-transparent via-[#16161A]/60 via-[80%] to-[#16161A]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
