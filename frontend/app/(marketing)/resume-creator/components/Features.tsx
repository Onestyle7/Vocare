'use client';

import Image from 'next/image';
import { useRef } from 'react';

import Button from '@/components/ui/assistant-button';
import { Separator } from '@/components/ui/separator';
import { arrow_icon, bottom_puzzle, glass_img, upper_puzzle } from '@/features/marketing/constants';

const Features = () => {
  const bentoRef = useRef<HTMLDivElement>(null);

  const scrollToBento = () => {
    bentoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
              <span className="opacity-[0.79]">w Tworzeniu CV</span>
            </h1>

            <p className="w-full max-w-178 text-center text-[14px] leading-normal font-light text-[#F1F4FF] opacity-[0.46] sm:text-[15px] lg:text-[18px] lg:leading-[1.45]">
              Zanim Twoje CV zobaczy rekruter, musi przejść przez algorytm. Nasz kreator zestawia
              Twój profil z ofertą, uzupełnia brakujące słowa kluczowe i tworzy aplikację w 100%
              odporną na ATS.
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
                Sprawdź swoje obecne CV
              </span>
            </Button>
          </div>
        </div>
        <div className="flex w-full flex-row items-center justify-center gap-8">
          {/* Card 1 */}
          <div className="z-0 h-[318px] w-[216px] translate-y-28 -rotate-24 rounded-[24px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-transparent to-[55%] p-[1px]">
            <div className="flex h-full w-full flex-col space-y-[21px] rounded-[23px] bg-[#202125] p-5">
              <p className="text-[22px] opacity-[75%]">Analiza ATS</p>
              <Separator className="h-[1px]! bg-[#FFFFFF]/50!" />
              <p className="text-[16px] font-light opacity-[50%]">
                Twoje CV jest automatycznie sprawdzane pod kątem zgodności z systemami ATS. Koniec z
                odrzuceniem przez robota.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="z-10 h-[318px] w-[216px] translate-y-7 -rotate-12 rounded-[24px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-transparent to-[55%] p-[1px]">
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

          {/* Card 3 */}
          <div className="z-20 h-[318px] w-[216px] rounded-[24px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-transparent to-[55%] p-[1px]">
            <div className="flex h-full w-full flex-col space-y-[21px] rounded-[23px] bg-[#202125] p-5">
              <p className="text-[22px] opacity-[75%]">Dopasowanie do oferty</p>
              <Separator className="h-[1px]! bg-[#FFFFFF]/50!" />
              <p className="text-[16px] font-light opacity-[50%]">
                Twoje CV jest automatycznie sprawdzane pod kątem zgodności z systemami ATS. Koniec z
                odrzuceniem przez robota.
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="z-10 h-[318px] w-[216px] translate-y-7 rotate-12 rounded-[24px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-transparent to-[55%] p-[1px]">
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

          {/* Card 5 */}
          <div className="z-0 h-[318px] w-[216px] translate-y-28 rotate-24 rounded-[24px] bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-transparent to-[55%] p-[1px]">
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
      </div>
    </div>
  );
};

export default Features;
