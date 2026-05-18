import Image from 'next/image';

import { grid_img_1, grid_img_2, grid_img_3, grid_img_4 } from '@/features/marketing/constants';

const BentoGrid = () => {
  return (
    <div className="w-full sm:p-4">
      <div className="flex w-full flex-col gap-4">
        <div className="grid w-full grid-cols-1 gap-4 md:h-100 md:grid-cols-[0.61888111888fr_1fr]">
          <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(180deg,#16171B_0%,#16171B_30%,transparent_100%)] px-9.75 py-10 before:absolute before:top-px before:left-1/2 before:h-[2.5px] before:w-full before:-translate-x-1/2 before:bg-linear-to-r before:from-transparent before:via-white/15 before:to-transparent before:content-['']">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-15 left-1/2 h-38.25 w-141.25 -translate-x-1/2 rounded-[50%] bg-[#D9D9D9] opacity-[0.04] blur-2xl"
            />
            <div className="relative z-10 flex flex-col items-center">
              <p className="text-[16px] text-[#F1F4FF] opacity-33 sm:pt-3.5">
                Przestrzeń do kształcenia
              </p>
              <Image
                src={grid_img_1}
                alt="img-grid-1"
                width={230.4}
                height={231.2}
                className="mr-10 mask-[linear-gradient(180deg,black_20%,transparent_100%)]"
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <p className="text-[20px] text-[#F1F4FF] opacity-75">Realny Rozwój</p>
                <p className="text-center text-[14px] font-light text-[#F1F4FF] opacity-50">
                  AI nie tylko wskazuje kierunek, ale od razu rozpisuje Twój plan na ten miesiąc i
                  kolejne etapy kariery.
                </p>
              </div>
            </div>
          </div>

          <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(180deg,#16171B_0%,#16171B_30%,transparent_100%)] px-9.75 py-10 before:absolute before:top-px before:left-1/2 before:h-[2.5px] before:w-full before:-translate-x-1/2 before:bg-linear-to-r before:from-transparent before:via-white/15 before:to-transparent before:content-['']">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-15 left-1/2 h-38.25 w-141.25 -translate-x-1/2 rounded-[50%] bg-[#D9D9D9] opacity-[0.04] blur-2xl"
            />
            <div className="relative z-10 flex flex-col items-center">
              <p className="text-center text-[16px] text-[#F1F4FF] opacity-33 sm:pt-3.5">
                3 realistyczne ścieżki zamiast jednej losowej sugestii
              </p>
              <Image
                src={grid_img_2}
                alt="img-grid-2"
                width={230.4}
                height={231.2}
                className="mask-[linear-gradient(180deg,black_20%,transparent_100%)]"
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <p className="text-[20px] text-[#F1F4FF] opacity-75">Wiele Możliwości</p>
                <p className="max-w-164 text-center text-[14px] font-light text-[#F1F4FF] opacity-50">
                  Więcej niż jeden scenariusz. Poznaj 3 alternatywne ścieżki kariery dopasowane do
                  Twojego profilu - każda z gotową listą kroków &apos;na teraz&apos; i na
                  przyszłość.
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
            <div className="relative z-10 flex flex-col items-center">
              <p className="text-center text-[16px] text-[#F1F4FF] opacity-33 sm:pt-3.5">
                Indywidualne dopasowanie kariery
              </p>
              <Image
                src={grid_img_3}
                alt="img-grid-3"
                width={230.4}
                height={231.2}
                className="mask-[linear-gradient(180deg,black_20%,transparent_100%)]"
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <p className="text-center text-[20px] text-[#F1F4FF] opacity-75">
                  Spersonalizowana Ścieżka
                </p>
                <p className="max-w-164 text-center text-[14px] font-light text-[#F1F4FF] opacity-50">
                  Wykorzystaj moc AI, która przełoży Twoje wykształcenie i unikalne talenty na
                  konkretne, dopasowane do Ciebie propozycje rynku.
                </p>
              </div>
            </div>
          </div>

          <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(180deg,#16171B_0%,#16171B_30%,transparent_100%)] px-9.75 py-10 before:absolute before:top-px before:left-1/2 before:h-[2.5px] before:w-full before:-translate-x-1/2 before:bg-linear-to-r before:from-transparent before:via-white/15 before:to-transparent before:content-['']">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-15 left-1/2 h-38.25 w-141.25 -translate-x-1/2 rounded-[50%] bg-[#D9D9D9] opacity-[0.04] blur-2xl"
            />
            <div className="relative z-10 flex flex-col items-center">
              <p className="text-center text-[16px] text-[#F1F4FF] opacity-33 sm:pt-3.5">
                Transparentny matching ofert
              </p>
              <Image
                src={grid_img_4}
                alt="img-grid-4"
                width={230.4}
                height={231.2}
                className="mask-[linear-gradient(180deg,black_20%,transparent_100%)]"
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <p className="text-[20px] text-[#F1F4FF] opacity-75">Ofert Pracy</p>
                <p className="text-center text-[14px] font-light text-[#F1F4FF] opacity-50">
                  Nie tylko dopasowujemy oferty, ale pokazujemy procentową zgodność Twoich skilli z
                  wymaganiami.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BentoGrid;
