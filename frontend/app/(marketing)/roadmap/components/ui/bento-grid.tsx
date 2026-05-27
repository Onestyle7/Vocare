'use client';

import gsap from 'gsap';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { Separator } from '@/components/ui/separator';
import { roadmap_bell, roadmap_checkmark } from '@/features/marketing/constants';

const customTileOuter =
  'relative rounded-2xl bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-white/[0.04] p-[1px]';
const customTileInner =
  'flex h-[46px] items-center justify-center rounded-[15px] bg-[#1A1B1F] px-3 text-center text-[12px] font-light leading-tight text-[#F1F4FF]/90';

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
          <div className="grid w-full grid-cols-1 gap-4 md:h-100 md:grid-cols-[0.61888111888fr_1fr]">
            <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(180deg,#16171B_0%,#16171B_30%,transparent_100%)] px-9.75 py-10 before:absolute before:top-px before:left-1/2 before:h-[2.5px] before:w-full before:-translate-x-1/2 before:bg-linear-to-r before:from-transparent before:via-white/15 before:to-transparent before:content-['']">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-15 left-1/2 h-38.25 w-141.25 -translate-x-1/2 rounded-[50%] bg-[#D9D9D9] opacity-[0.04] blur-2xl"
              />
              <div className="relative z-10 flex flex-col items-center">
                <p className="text-[16px] text-[#F1F4FF] opacity-33 sm:pt-3.5">Notatki do kroków</p>

                <div className="group relative mt-2 flex w-full cursor-pointer flex-row items-start justify-center overflow-hidden mask-[linear-gradient(180deg,black_40%,transparent_100%)] pb-4">
                  <div className="relative z-0 -mr-28 flex h-[201px] w-[147px] translate-y-10 -rotate-[24deg] flex-col items-start space-y-2 rounded-[14px] bg-[#9D9BFF] px-4 py-4 transition-all duration-500 ease-out group-hover:-translate-x-6 group-hover:translate-y-11 group-hover:-rotate-[28deg]">
                    <div className="flex w-full flex-row items-center justify-between">
                      <p className="font-regular text-[12px] text-black opacity-50">Notatka 02</p>
                      <div className="flex flex-col space-y-px">
                        <div className="h-[2px] w-[2px] rounded-full bg-[#5A5C66] opacity-50" />
                        <div className="h-[2px] w-[2px] rounded-full bg-[#5A5C66] opacity-50" />
                        <div className="h-[2px] w-[2px] rounded-full bg-[#5A5C66] opacity-50" />
                      </div>
                    </div>
                    <Separator className="bg-black opacity-25" />
                  </div>

                  <div className="relative z-10 flex h-[201px] w-[147px] translate-y-5 flex-col items-start space-y-2 rounded-[14px] bg-[#C7A9FE] px-4 py-4 shadow-2xl transition-all duration-500 ease-out group-hover:translate-y-3 group-hover:scale-[1.02]">
                    <div className="flex w-full flex-row items-center justify-between">
                      <p className="font-regular text-[12px] text-black opacity-50">Notatka 01</p>
                      <div className="flex flex-col space-y-px">
                        <div className="h-[2px] w-[2px] rounded-full bg-[#5A5C66] opacity-50" />
                        <div className="h-[2px] w-[2px] rounded-full bg-[#5A5C66] opacity-50" />
                        <div className="h-[2px] w-[2px] rounded-full bg-[#5A5C66] opacity-50" />
                      </div>
                    </div>
                    <Separator className="bg-black opacity-25" />
                  </div>

                  <div className="relative z-0 -ml-28 flex h-[201px] w-[147px] translate-y-10 rotate-[24deg] flex-col items-start space-y-2 rounded-[14px] bg-[#9D9BFF] px-4 py-4 transition-all duration-500 ease-out group-hover:translate-x-6 group-hover:translate-y-11 group-hover:rotate-[28deg]">
                    <div className="flex w-full flex-row items-center justify-between">
                      <p className="font-regular text-[12px] text-black opacity-50">Notatka 03</p>
                      <div className="flex flex-col space-y-px">
                        <div className="h-[2px] w-[2px] rounded-full bg-[#5A5C66] opacity-50" />
                        <div className="h-[2px] w-[2px] rounded-full bg-[#5A5C66] opacity-50" />
                        <div className="h-[2px] w-[2px] rounded-full bg-[#5A5C66] opacity-50" />
                      </div>
                    </div>
                    <Separator className="bg-black opacity-25" />
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center space-y-3">
                  <p className="text-[20px] text-[#F1F4FF] opacity-75">Zapisuj, co działa</p>
                  <p className="text-center text-[14px] font-light text-[#F1F4FF] opacity-50">
                    Dodawaj notatki do każdego kroku. Twoja roadmapa staje się osobistym dziennikiem
                    kariery.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(180deg,#16171B_0%,#16171B_30%,transparent_100%)] px-9.75 py-10 before:absolute before:top-px before:left-1/2 before:h-[2.5px] before:w-full before:-translate-x-1/2 before:bg-linear-to-r before:from-transparent before:via-white/15 before:to-transparent before:content-['']">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-15 left-1/2 h-38.25 w-141.25 -translate-x-1/2 rounded-[50%] bg-[#D9D9D9] opacity-[0.04] blur-2xl"
              />
              <div className="relative z-10 flex flex-col items-center space-y-16">
                <p className="text-center text-[16px] text-[#F1F4FF] opacity-33 sm:pt-3.5">
                  Trackowanie postępu
                </p>
                <div className="flex w-full flex-row items-center justify-center space-x-14">
                  <div className="rounded-[17px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-white/[0.04] p-[1px]">
                    <div className="flex h-[95px] w-[95px] items-center justify-center rounded-[16px] bg-[#202125]">
                      <Image src={roadmap_checkmark} alt="checkmark" width={42} height={42} />
                    </div>
                  </div>
                  <div className="rounded-[17px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-white/[0.04] p-[1px]">
                    <div className="flex h-[95px] w-[95px] items-center justify-center rounded-[16px] bg-[#202125]">
                      <Image src={roadmap_checkmark} alt="checkmark" width={42} height={42} />
                    </div>
                  </div>
                  <div className="rounded-[17px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-white/[0.04] p-[1px]">
                    <div className="flex h-[95px] w-[95px] flex-row items-center justify-center space-x-1 rounded-[16px] bg-[#202125]">
                      <div className="h-[5px] w-[5px] animate-bounce rounded-full border border-white opacity-50 delay-150" />
                      <div className="h-[5px] w-[5px] animate-bounce rounded-full border border-white opacity-50 delay-200" />
                      <div className="h-[5px] w-[5px] animate-bounce rounded-full border border-white opacity-50 delay-250" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center space-y-3">
                  <p className="text-[20px] text-[#F1F4FF] opacity-75">
                    Widzisz, jak daleko zaszedłeś
                  </p>
                  <p className="max-w-164 text-center text-[14px] font-light text-[#F1F4FF] opacity-50">
                    Odhaczaj ukończone kroki i obserwuj progres w czasie rzeczywistym.
                    <br /> Każdy kamień milowy to konkretny dowód rozwoju.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-4 md:h-100 md:grid-cols-[1fr_0.61888111888fr]">
            <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(180deg,#16171B_0%,#16171B_30%,transparent_100%)] px-9.75 py-10 before:absolute before:top-px before:left-1/2 before:h-[2.5px] before:w-full before:-translate-x-1/2 before:bg-linear-to-r before:from-transparent before:via-white/15 before:to-transparent before:content-['']">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-15 left-1/2 h-38.25 w-141.25 -translate-x-1/2 rounded-[50%] bg-[#D9D9D9] opacity-[0.04] blur-2xl"
              />
              <div className="relative z-10 flex w-full flex-col items-center">
                <p className="mt-6 text-center text-[16px] text-[#F1F4FF] opacity-33 sm:pt-3.5">
                  Własne kafelki
                </p>

                <div className="relative mx-auto h-[240px] w-full max-w-[520px] mask-[linear-gradient(180deg,black_65%,transparent_100%)]">
                  <svg
                    className="pointer-events-none absolute inset-0 z-0 h-full w-full"
                    viewBox="0 0 520 240"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <line
                      x1="95"
                      y1="114"
                      x2="95"
                      y2="158"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="1"
                    />
                    <path
                      d="M 190 90 L 260 90 M 260 54 L 260 136 M 260 54 L 330 54 M 260 136 L 330 136"
                      stroke="rgba(255,255,255,0.22)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <path
                      d="M 190 182 L 260 182 L 260 218 L 330 218"
                      stroke="rgba(255,255,255,0.22)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                  </svg>

                  <div className="absolute top-[66px] left-0 w-[190px]">
                    <div className={customTileOuter}>
                      <div className={customTileInner}>
                        Podstawy
                        <br />
                        programowania
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-[158px] left-0 w-[190px]">
                    <div className={customTileOuter}>
                      <div className={customTileInner}>Kontrola wersji</div>
                    </div>
                  </div>

                  <div className="absolute top-[30px] right-0 w-[190px]">
                    <div className={customTileOuter}>
                      <div className={customTileInner}>Konteneryzacja</div>
                    </div>
                  </div>
                  <div className="absolute top-[112px] right-0 w-[190px]">
                    <div className={customTileOuter}>
                      <div className={customTileInner}>Orkiestracja</div>
                    </div>
                  </div>
                  <div className="absolute top-[194px] right-0 w-[190px]">
                    <div className={customTileOuter}>
                      <div className={customTileInner}>Automatyzacja CI/CD</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col items-center justify-center space-y-3">
                  <p className="text-center text-[20px] text-[#F1F4FF] opacity-75">
                    Rozbuduj plan po swojemu
                  </p>
                  <p className="max-w-164 text-center text-[14px] font-light text-[#F1F4FF] opacity-50">
                    Dodawaj własne zadania, projekty i cele. <br /> AI stworzyło fundament - Ty
                    decydujesz, co dobudować.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(180deg,#16171B_0%,#16171B_30%,transparent_100%)] px-9.75 py-10 before:absolute before:top-px before:left-1/2 before:h-[2.5px] before:w-full before:-translate-x-1/2 before:bg-linear-to-r before:from-transparent before:via-white/15 before:to-transparent before:content-['']">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-15 left-1/2 h-38.25 w-141.25 -translate-x-1/2 rounded-[50%] bg-[#D9D9D9] opacity-[0.04] blur-2xl"
              />
              <div
                className="group relative z-10 flex cursor-pointer flex-col items-center space-y-7"
                onMouseEnter={handleBellHover}
              >
                <p className="mb-6 text-center text-[16px] text-[#F1F4FF] opacity-33 sm:pt-3.5">
                  Pamiętamy za Ciebie
                </p>

                <div className="relative inline-block">
                  <Image
                    src={roadmap_bell}
                    alt="img-grid-4"
                    width={128}
                    height={144}
                    className="animate-bell mask-[linear-gradient(180deg,black_20%,transparent_100%)]"
                  />

                  {bellNotifCount > 0 && (
                    <div
                      ref={badgeRef}
                      className="absolute -top-1 right-2 z-20 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#E5484D] text-[15px] font-semibold text-white shadow-lg"
                    >
                      {bellNotifCount}
                    </div>
                  )}
                </div>

                <div className="mt-9 flex flex-col items-center justify-center space-y-3">
                  <p className="text-[20px] text-[#F1F4FF] opacity-75">Przypomnienia</p>
                  <p className="text-center text-[14px] font-light text-[#F1F4FF] opacity-50">
                    Nie trać tempa. Ustawiaj terminy i otrzymuj powiadomienia o zbliżających się
                    krokach.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BentoGrid;
