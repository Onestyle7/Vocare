'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';
import { useEffect, useRef } from 'react';

import Button from '@/components/ui/assistant-button';
import { arrow_icon } from '@/features/marketing/constants';

export const roadmap_cylinder = '/roadmap/roadmap_cylinder.svg';
export const roadmap_flag = '/roadmap/roadmap_flag.svg';
export const roadmap_layers = '/roadmap/roadmap_layers.svg';
export const roadmap_map_pin = '/roadmap/roadmap_map_pin.svg';
export const roadmap_path = '/roadmap/roadmap_path.svg';
export const roadmap_terminal = '/roadmap/roadmap_terminal.svg';
export const roadmap_user = '/roadmap/roadmap_user.svg';

export const roadmap_sun = '/roadmap/Sun.svg';
export const roadmap_puzzle = '/roadmap/Puzzle.svg';
export const roadmap_path_1 = '/roadmap/Path.svg';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const RoadmapNode = ({
  icon,
  left,
  top,
  sizeClass,
  innerRoundedClass,
  imgSize,
}: {
  icon: string;
  left: string;
  top: string;
  sizeClass: string;
  innerRoundedClass: string;
  imgSize: number;
}) => (
  <div
    className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-white/[0.04] p-[1px] shadow-2xl ${sizeClass}`}
    style={{ left, top }}
  >
    <div
      className={`flex h-full w-full items-center justify-center bg-[#1A1A1F] ${innerRoundedClass}`}
    >
      <Image
        src={icon}
        alt="Roadmap icon"
        width={imgSize}
        height={imgSize}
        className="opacity-80"
      />
    </div>
  </div>
);

const MAIN_BG_PATH = 'M 150 250 L 850 250';
const MAIN_ANIMATED_PATH = 'M 150 250 L 620 250';

const LEFT_BRANCHES = ['M 385 250 L 325 125 L 250 125', 'M 385 250 L 325 375 L 250 375'];

const RIGHT_BRANCHES = ['M 620 250 L 680 125 L 750 125', 'M 620 250 L 680 375 L 750 375'];

const Features = () => {
  const bentoRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !diagramRef.current) return;

    const allAnimated = svgRef.current.querySelectorAll<SVGPathElement>('.animated-path');

    allAnimated.forEach((path) => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
    });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: diagramRef.current,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
      });

      tl.to(
        '.main-line',
        {
          strokeDashoffset: 0,
          duration: 1.34,
          ease: 'none',
        },
        0
      );

      tl.to(
        '.left-branch',
        {
          strokeDashoffset: 0,
          duration: 0.55,
          ease: 'power2.out',
        },
        0.66
      );

      tl.to(
        '.right-branch-bottom',
        {
          strokeDashoffset: (index, target) => target.getTotalLength() / 2,
          duration: 0.45,
          ease: 'power2.out',
        },
        1.34
      );
    }, diagramRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="font-poppins flex flex-col bg-[#0F1013] p-3 sm:p-5">
      <div className="relative mx-auto flex w-full max-w-none flex-col overflow-hidden rounded-3xl 2xl:max-w-7xl">
        <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-12 sm:px-8 sm:py-16 md:px-12 lg:px-16 lg:py-20 2xl:py-24">
          <div className="flex flex-col items-center space-y-6 sm:space-y-7 lg:space-y-8">
            <h1 className="w-full text-center text-[28px] leading-[1.15] font-light text-[#F1F4FF] sm:text-[36px] lg:text-[48px] lg:leading-[1.1]">
              <span className="opacity-[0.79]">Poznaj</span>{' '}
              <span className="bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text font-normal text-transparent">
                Potęgę AI
              </span>
              <br />
              <span className="opacity-[0.79]">w Projektowaniu Roadmap</span>
            </h1>

            <p className="w-full max-w-178 text-center text-[14px] leading-normal font-light text-[#F1F4FF] opacity-[0.46] sm:text-[15px] lg:text-[18px] lg:leading-[1.45]">
              Nie zostawiaj swojej przyszłości przypadkowi. Na podstawie wybranej ścieżki kariery,
              nasz algorytm tworzy spersonalizowaną roadmapę. Dopasuj horyzont czasowy i zyskaj
              przejrzysty przewodnik, który wskaże Ci kolejne kroki.
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
                Wygeneruj roadmape
              </span>
            </Button>
          </div>

          <div className="hidden md:block">
            <div
              ref={diagramRef}
              className="mt-16 w-full overflow-x-auto pb-8 sm:mt-24"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div className="relative mx-auto aspect-[2.2/1] max-w-5xl min-w-[800px]">
                <svg
                  ref={svgRef}
                  viewBox="0 0 1000 500"
                  className="pointer-events-none absolute inset-0 z-0 h-full w-full"
                >
                  <defs>
                    <linearGradient
                      id="roadmapLineGradient"
                      gradientUnits="userSpaceOnUse"
                      x1="150"
                      y1="250"
                      x2="850"
                      y2="250"
                    >
                      <stop offset="0%" stopColor="#9296FD" />
                      <stop offset="50%" stopColor="#8491FE" />
                      <stop offset="77%" stopColor="#9D9BFF" />
                      <stop offset="100%" stopColor="#C7A9FE" />
                    </linearGradient>
                  </defs>

                  <path
                    d={MAIN_BG_PATH}
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth="2"
                    fill="none"
                  />

                  {[...LEFT_BRANCHES, ...RIGHT_BRANCHES].map((d, i) => (
                    <path
                      key={`bg-${i}`}
                      d={d}
                      stroke="rgba(255, 255, 255, 0.15)"
                      strokeWidth="2"
                      fill="none"
                    />
                  ))}

                  <path
                    className="animated-path main-line"
                    d={MAIN_ANIMATED_PATH}
                    stroke="url(#roadmapLineGradient)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />

                  {LEFT_BRANCHES.map((d, i) => (
                    <path
                      key={`left-${i}`}
                      className="animated-path left-branch"
                      d={d}
                      stroke="url(#roadmapLineGradient)"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                    />
                  ))}

                  <path
                    className="animated-path right-branch-bottom"
                    d={RIGHT_BRANCHES[1]}
                    stroke="url(#roadmapLineGradient)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>

                <div
                  className="absolute z-0 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
                  style={{
                    left: '48%',
                    top: '50%',
                    backgroundColor: '#8491FE',
                    opacity: 0.1,
                  }}
                />

                <RoadmapNode
                  icon={roadmap_map_pin}
                  left="48%"
                  top="50%"
                  sizeClass="h-24 w-24 rounded-[32px]"
                  innerRoundedClass="rounded-[31px]"
                  imgSize={32}
                />

                <RoadmapNode
                  icon={roadmap_user}
                  left="15%"
                  top="50%"
                  sizeClass="h-24 w-24 rounded-[32px]"
                  innerRoundedClass="rounded-[31px]"
                  imgSize={32}
                />

                <RoadmapNode
                  icon={roadmap_terminal}
                  left="25%"
                  top="25%"
                  sizeClass="h-16 w-16 rounded-[20px]"
                  innerRoundedClass="rounded-[19px]"
                  imgSize={24}
                />

                <RoadmapNode
                  icon={roadmap_layers}
                  left="25%"
                  top="75%"
                  sizeClass="h-16 w-16 rounded-[20px]"
                  innerRoundedClass="rounded-[19px]"
                  imgSize={24}
                />

                <RoadmapNode
                  icon={roadmap_flag}
                  left="85%"
                  top="50%"
                  sizeClass="h-24 w-24 rounded-[32px]"
                  innerRoundedClass="rounded-[31px]"
                  imgSize={32}
                />

                <RoadmapNode
                  icon={roadmap_path}
                  left="75%"
                  top="25%"
                  sizeClass="h-16 w-16 rounded-[20px]"
                  innerRoundedClass="rounded-[19px]"
                  imgSize={24}
                />

                <RoadmapNode
                  icon={roadmap_cylinder}
                  left="75%"
                  top="75%"
                  sizeClass="h-16 w-16 rounded-[20px]"
                  innerRoundedClass="rounded-[19px]"
                  imgSize={24}
                />
              </div>
            </div>
          </div>

          <div className="mx-auto mt-16 grid w-full max-w-4xl grid-cols-1 items-center justify-center gap-10 md:grid-cols-3 md:gap-8 lg:gap-16">
            <div className="flex flex-col">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-[22px] w-[22px] items-center justify-center">
                  <Image src={roadmap_path_1} alt="Wybierz ścieżkę" width={22} height={22} />
                </div>
                <h3 className="text-[16px] font-normal text-[#F1F4FF] sm:text-[18px]">
                  Wybierz ścieżkę
                </h3>
              </div>
              <div className="mb-6 h-px w-full bg-white/[0.08]" />
              <h4 className="mb-3 text-[15px] font-medium text-[#F1F4FF] sm:text-[16px]">
                1. Krok
              </h4>
              <p className="text-[13px] leading-relaxed font-light text-[#F1F4FF] opacity-[0.46] sm:text-[14px]">
                Wskaż kierunek kariery z wygenerowanych propozycji
              </p>
            </div>

            <div className="flex flex-col">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-[22px] w-[22px] items-center justify-center">
                  <Image src={roadmap_sun} alt="Ustaw horyzont" width={22} height={22} />
                </div>
                <h3 className="text-[16px] font-normal text-[#F1F4FF] sm:text-[18px]">
                  Ustaw horyzont
                </h3>
              </div>
              <div className="mb-6 h-px w-full bg-white/[0.08]" />
              <h4 className="mb-3 text-[15px] font-medium text-[#F1F4FF] sm:text-[16px]">
                2. Krok
              </h4>
              <p className="text-[13px] leading-relaxed font-light text-[#F1F4FF] opacity-[0.46] sm:text-[14px]">
                kwartał, rok, dwa lata - wybierz perspektywę, która Ci pasuje
              </p>
            </div>

            <div className="flex flex-col">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-[22px] w-[22px] items-center justify-center">
                  <Image src={roadmap_puzzle} alt="Działaj krok po kroku" width={22} height={22} />
                </div>
                <h3 className="text-[16px] font-normal text-[#F1F4FF] sm:text-[18px]">
                  Działaj krok po kroku
                </h3>
              </div>
              <div className="mb-6 h-px w-full bg-white/[0.08]" />
              <h4 className="mb-3 text-[15px] font-medium text-[#F1F4FF] sm:text-[16px]">
                3. Krok
              </h4>
              <p className="text-[13px] leading-relaxed font-light text-[#F1F4FF] opacity-[0.46] sm:text-[14px]">
                Otrzymasz konkretne zadania, zasoby i kamienie milowe
              </p>
            </div>
          </div>

          <div ref={bentoRef} />
        </div>
      </div>
    </div>
  );
};

export default Features;
