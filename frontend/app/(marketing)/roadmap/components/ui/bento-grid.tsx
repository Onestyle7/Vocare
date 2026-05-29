'use client';

import gsap from 'gsap';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { Separator } from '@/components/ui/separator';
import { roadmap_bell, roadmap_checkmark } from '@/features/marketing/constants';

const customTileOuter =
  'relative rounded-[14px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-white/[0.04] p-[1px]';

const customTileInner =
  'flex h-[38px] items-center justify-center rounded-[13px] bg-[#1A1B1F] px-2.5 text-center text-[10px] font-light leading-tight text-[#F1F4FF]/90';

const bentoCardClass =
  "relative grid min-h-[400px] grid-rows-[32px_minmax(188px,1fr)_100px] overflow-hidden rounded-xl bg-[linear-gradient(180deg,#16171B_0%,#16171B_30%,transparent_100%)] px-6 py-8 before:absolute before:top-px before:left-1/2 before:h-[2.5px] before:w-full before:-translate-x-1/2 before:bg-linear-to-r before:from-transparent before:via-white/15 before:to-transparent before:content-[''] md:h-[400px] md:px-[39px] md:py-10";

const bentoGlowClass =
  'pointer-events-none absolute -top-15 left-1/2 h-38.25 w-141.25 -translate-x-1/2 rounded-[50%] bg-[#D9D9D9] opacity-[0.04] blur-2xl';

const bentoEyebrowClass =
  'relative z-10 flex h-full items-start justify-center text-center text-[16px] leading-none text-[#F1F4FF] opacity-[0.33]';

const bentoVisualClass =
  'relative z-10 flex min-h-0 w-full items-center justify-center overflow-visible';

const bentoBottomClass =
  'relative z-10 flex h-full flex-col items-center justify-start gap-3 text-center';

const bentoTitleClass = 'text-center text-[20px] leading-snug text-[#F1F4FF] opacity-75';

const bentoDescriptionClass =
  'max-w-164 text-center text-[14px] font-light leading-relaxed text-[#F1F4FF] opacity-50';

type BentoCardProps = {
  eyebrow: string;
  visual: ReactNode;
  title: string;
  description: ReactNode;
  className?: string;
  onMouseEnter?: () => void;
};

const BentoCard = ({
  eyebrow,
  visual,
  title,
  description,
  className = '',
  onMouseEnter,
}: BentoCardProps) => {
  return (
    <div className={`${bentoCardClass} ${className}`} onMouseEnter={onMouseEnter}>
      <div aria-hidden className={bentoGlowClass} />

      <p className={bentoEyebrowClass}>{eyebrow}</p>

      <div className={bentoVisualClass}>{visual}</div>

      <div className={bentoBottomClass}>
        <p className={bentoTitleClass}>{title}</p>
        <p className={bentoDescriptionClass}>{description}</p>
      </div>
    </div>
  );
};

const BentoGrid = () => {
  const [bellNotifCount, setBellNotifCount] = useState(0);
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bellNotifCount > 0 && badgeRef.current) {
      gsap.fromTo(
        badgeRef.current,
        { scale: 0.3, rotation: -20 },
        { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(3)' }
      );
    }
  }, [bellNotifCount]);

  const handleBellHover = () => {
    setBellNotifCount((prev) => prev + 1);
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes bell-shake {
              0% { transform: rotate(0deg); }
              15% { transform: rotate(10deg); }
              30% { transform: rotate(-10deg); }
              45% { transform: rotate(7deg); }
              60% { transform: rotate(-7deg); }
              75% { transform: rotate(3deg); }
              85% { transform: rotate(-3deg); }
              100% { transform: rotate(0deg); }
            }

            .group:hover .animate-bell {
              animation: bell-shake 0.8s ease-in-out 1;
              transform-origin: top center;
            }
          `,
        }}
      />

      <div className="w-full sm:p-4">
        <div className="flex w-full flex-col gap-4">
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-[0.61888111888fr_1fr]">
            <BentoCard
              eyebrow="Notatki do kroków"
              title="Zapisuj, co działa"
              description={
                <>
                  Dodawaj notatki do każdego kroku. Twoja roadmapa staje się osobistym dziennikiem.
                </>
              }
              visual={
                <div className="group relative flex h-full w-full cursor-pointer items-center justify-center overflow-hidden mask-[linear-gradient(180deg,black_48%,transparent_100%)]">
                  <div className="relative z-0 -mr-24 flex h-[178px] w-[130px] translate-y-7 -rotate-[24deg] flex-col items-start space-y-2 rounded-[14px] bg-[#9D9BFF] px-3.5 py-3.5 transition-all duration-500 ease-out group-hover:-translate-x-6 group-hover:translate-y-8 group-hover:-rotate-[28deg]">
                    <div className="flex w-full flex-row items-center justify-between">
                      <p className="text-[11px] text-black opacity-50">Notatka 02</p>
                      <div className="flex flex-col space-y-px">
                        <div className="h-[2px] w-[2px] rounded-full bg-[#5A5C66] opacity-50" />
                        <div className="h-[2px] w-[2px] rounded-full bg-[#5A5C66] opacity-50" />
                        <div className="h-[2px] w-[2px] rounded-full bg-[#5A5C66] opacity-50" />
                      </div>
                    </div>
                    <Separator className="bg-black opacity-25" />
                  </div>

                  <div className="relative z-10 flex h-[178px] w-[130px] translate-y-2 flex-col items-start space-y-2 rounded-[14px] bg-[#C7A9FE] px-3.5 py-3.5 shadow-2xl transition-all duration-500 ease-out group-hover:-translate-y-1 group-hover:scale-[1.02]">
                    <div className="flex w-full flex-row items-center justify-between">
                      <p className="text-[11px] text-black opacity-50">Notatka 01</p>
                      <div className="flex flex-col space-y-px">
                        <div className="h-[2px] w-[2px] rounded-full bg-[#5A5C66] opacity-50" />
                        <div className="h-[2px] w-[2px] rounded-full bg-[#5A5C66] opacity-50" />
                        <div className="h-[2px] w-[2px] rounded-full bg-[#5A5C66] opacity-50" />
                      </div>
                    </div>
                    <Separator className="bg-black opacity-25" />
                  </div>

                  <div className="relative z-0 -ml-24 flex h-[178px] w-[130px] translate-y-7 rotate-[24deg] flex-col items-start space-y-2 rounded-[14px] bg-[#9D9BFF] px-3.5 py-3.5 transition-all duration-500 ease-out group-hover:translate-x-6 group-hover:translate-y-8 group-hover:rotate-[28deg]">
                    <div className="flex w-full flex-row items-center justify-between">
                      <p className="text-[11px] text-black opacity-50">Notatka 03</p>
                      <div className="flex flex-col space-y-px">
                        <div className="h-[2px] w-[2px] rounded-full bg-[#5A5C66] opacity-50" />
                        <div className="h-[2px] w-[2px] rounded-full bg-[#5A5C66] opacity-50" />
                        <div className="h-[2px] w-[2px] rounded-full bg-[#5A5C66] opacity-50" />
                      </div>
                    </div>
                    <Separator className="bg-black opacity-25" />
                  </div>
                </div>
              }
            />

            <BentoCard
              eyebrow="Trackowanie postępu"
              title="Widzisz, jak daleko zaszedłeś"
              description={
                <>
                  Odhaczaj ukończone kroki i obserwuj progres w czasie rzeczywistym.
                  <br />
                  Każdy kamień milowy to konkretny dowód rozwoju.
                </>
              }
              visual={
                <div className="flex w-full flex-row items-center justify-center gap-4 sm:gap-8 lg:gap-14">
                  <div className="rounded-[17px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-white/[0.04] p-[1px]">
                    <div className="flex h-[82px] w-[82px] items-center justify-center rounded-[16px] bg-[#202125] sm:h-[95px] sm:w-[95px]">
                      <Image src={roadmap_checkmark} alt="checkmark" width={42} height={42} />
                    </div>
                  </div>

                  <div className="rounded-[17px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-white/[0.04] p-[1px]">
                    <div className="flex h-[82px] w-[82px] items-center justify-center rounded-[16px] bg-[#202125] sm:h-[95px] sm:w-[95px]">
                      <Image src={roadmap_checkmark} alt="checkmark" width={42} height={42} />
                    </div>
                  </div>

                  <div className="rounded-[17px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-white/[0.04] p-[1px]">
                    <div className="flex h-[82px] w-[82px] flex-row items-center justify-center gap-1 rounded-[16px] bg-[#202125] sm:h-[95px] sm:w-[95px]">
                      <div className="h-[5px] w-[5px] animate-bounce rounded-full border border-white opacity-50 delay-150" />
                      <div className="h-[5px] w-[5px] animate-bounce rounded-full border border-white opacity-50 delay-200" />
                      <div className="h-[5px] w-[5px] animate-bounce rounded-full border border-white opacity-50 delay-250" />
                    </div>
                  </div>
                </div>
              }
            />
          </div>

          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-[1fr_0.61888111888fr]">
            <BentoCard
              eyebrow="Własne kafelki"
              title="Rozbuduj plan po swojemu"
              description={
                <>
                  Dodawaj własne zadania, projekty i cele.
                  <br />
                  AI stworzyło fundament - Ty decydujesz, co dobudować.
                </>
              }
              visual={
                <div className="relative mx-auto h-[168px] w-full max-w-[390px] -translate-y-4 mask-[linear-gradient(180deg,black_72%,transparent_100%)]">
                  <svg
                    className="pointer-events-none absolute inset-0 z-0 h-full w-full"
                    viewBox="0 0 390 168"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <line
                      x1="66"
                      y1="80"
                      x2="66"
                      y2="110"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="1"
                    />

                    <path
                      d="M 132 63 L 195 63 M 195 38 L 195 96 M 195 38 L 258 38 M 195 96 L 258 96"
                      stroke="rgba(255,255,255,0.22)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />

                    <path
                      d="M 132 129 L 195 129 L 195 154 L 258 154"
                      stroke="rgba(255,255,255,0.22)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                  </svg>

                  <div className="absolute top-[46px] left-0 w-[132px] sm:w-[142px]">
                    <div className={customTileOuter}>
                      <div className={customTileInner}>
                        Podstawy
                        <br />
                        programowania
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-[110px] left-0 w-[132px] sm:w-[142px]">
                    <div className={customTileOuter}>
                      <div className={customTileInner}>Kontrola wersji</div>
                    </div>
                  </div>

                  <div className="absolute top-[21px] right-0 w-[132px] sm:w-[142px]">
                    <div className={customTileOuter}>
                      <div className={customTileInner}>Konteneryzacja</div>
                    </div>
                  </div>

                  <div className="absolute top-[78px] right-0 w-[132px] sm:w-[142px]">
                    <div className={customTileOuter}>
                      <div className={customTileInner}>Orkiestracja</div>
                    </div>
                  </div>

                  <div className="absolute top-[135px] right-0 w-[132px] sm:w-[142px]">
                    <div className={customTileOuter}>
                      <div className={customTileInner}>Automatyzacja CI/CD</div>
                    </div>
                  </div>
                </div>
              }
            />

            <BentoCard
              className="group cursor-pointer"
              onMouseEnter={handleBellHover}
              eyebrow="Pamiętamy za Ciebie"
              title="Przypomnienia"
              description={
                <>
                  Nie trać tempa. Ustawiaj terminy i otrzymuj powiadomienia o zbliżających się
                  krokach.
                </>
              }
              visual={
                <div className="relative inline-flex h-full items-center justify-center">
                  <Image
                    src={roadmap_bell}
                    alt="img-grid-4"
                    width={112}
                    height={126}
                    className="animate-bell mask-[linear-gradient(180deg,black_20%,transparent_100%)]"
                  />

                  {bellNotifCount > 0 && (
                    <div
                      ref={badgeRef}
                      className="absolute top-5 right-2 z-20 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#E5484D] text-[15px] font-semibold text-white shadow-lg"
                    >
                      {bellNotifCount}
                    </div>
                  )}
                </div>
              }
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default BentoGrid;
