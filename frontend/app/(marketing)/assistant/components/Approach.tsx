import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

import {
  ai_grid,
  approach_elipse_1,
  approach_elipse_2,
  approach_elipse_3,
  approach_img_1,
  approach_img_2,
  approach_img_3,
  approach_line_1,
  approach_line_2,
  arrow_grid_icon,
  brain_grid,
  expand_icon,
  shield_icon,
  user_icon,
} from '@/features/marketing/constants';

const Approach = () => {
  return (
    <div className="font-poppins flex min-h-screen flex-col bg-[#0F1013] p-3 sm:p-5">
      <div className="relative mx-auto flex w-full max-w-none flex-col overflow-hidden rounded-3xl 2xl:max-w-7xl">
        <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-12 sm:px-8 sm:py-0">
          <div className="flex flex-col items-center space-y-6 sm:space-y-7 lg:space-y-8">
            <h1 className="w-full max-w-245 text-center text-[28px] leading-[1.15] font-light text-[#F1F4FF] sm:text-[36px] lg:text-[48px] lg:leading-[1.1]">
              <span className="block opacity-[0.79]">Innowacyjne Podejście</span>
              <span className="mt-1 inline-flex max-w-full flex-wrap items-baseline justify-center gap-x-2 sm:gap-x-3 lg:mt-0 lg:flex-nowrap">
                <span className="opacity-[0.79]">w</span>
                <span className="bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text font-normal text-transparent">
                  Dopasowywaniu
                </span>
                <span className="opacity-[0.79]">Kariery</span>
              </span>
            </h1>
          </div>

          <div className="mt-16 flex w-full flex-col gap-16 lg:mt-24">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
              <div className="flex flex-col justify-center gap-4">
                <div className="flex min-h-40 w-full flex-col items-start justify-center space-y-2.5 rounded-2xl border-gray-600/40 p-6">
                  <p className="text-[22px] text-[#F1F4FF] opacity-75">
                    1. Twój profil, Twoja ścieżka
                  </p>
                  <p className="text-[14px] leading-6 font-light opacity-50">
                    Wprowadź swoje dane, a system stworzy dopasowany profil i określi najlepszy
                    kierunek rozwoju kariery.
                  </p>
                </div>

                <div className="relative flex min-h-40 w-full rounded-2xl bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-transparent to-[55%] p-[1px]">
                  <div className="flex h-full w-full flex-col items-start justify-center space-y-2.5 rounded-[15px] bg-[#191B1F] p-6">
                    <p className="text-[22px] text-[#F1F4FF] opacity-75">2. Analiza AI</p>
                    <p className="text-[14px] leading-6 font-light opacity-50">
                      AI w sekundach analizuje ogromne dane i tworzy dopasowaną, spersonalizowaną
                      ścieżkę kariery wraz z planem działania.
                    </p>
                  </div>
                </div>

                <div className="flex min-h-40 w-full flex-col items-start justify-center space-y-2.5 rounded-2xl border-gray-600/40 p-6">
                  <p className="text-[22px] text-[#F1F4FF] opacity-75">3. Twoje ścieżki kariery</p>
                  <p className="text-[14px] leading-6 font-light opacity-50">
                    Otrzymujesz 3 dopasowane ścieżki kariery z prawdopodobieństwem sukcesu, analizę
                    SWOT oraz konkretne oferty pracy z No Fluff Jobs.
                  </p>
                </div>
              </div>

              <div className="relative flex min-h-100 w-full items-center justify-center overflow-hidden rounded-3xl bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-white/3 to-transparent p-6 before:absolute before:top-px before:left-1/2 before:h-0.5 before:w-[80%] before:-translate-x-1/2 before:bg-linear-to-r before:from-transparent before:via-white/10 before:to-transparent before:content-[''] after:absolute after:top-[60%] after:left-px after:h-[70%] after:w-[1.5px] after:-translate-y-1/2 after:bg-linear-to-b after:from-transparent after:via-white/10 after:to-transparent after:content-[''] lg:min-h-125">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-15 left-1/4 h-68.25 w-161.25 -translate-x-1/2 rounded-[50%] bg-[#D9D9D9] opacity-[0.04] blur-2xl"
                />
                <div className="pointer-events-none absolute inset-0 z-0">
                  {[
                    { row: 1, col: 2, opacity: 0.03 },
                    { row: 0, col: 8, opacity: 0.03 },
                    { row: 6, col: 2, opacity: 0.03 },
                    { row: 2, col: 4, opacity: 0.03 },
                    { row: 4, col: 12, opacity: 0.03 },
                  ].map((cell, i) => (
                    <div
                      key={i}
                      className="absolute"
                      style={{
                        top: cell.row * 41,
                        left: cell.col * 41,
                        width: 41,
                        height: 41,
                        backgroundColor: `rgba(255, 255, 255, ${cell.opacity})`,
                      }}
                    />
                  ))}
                </div>

                <div
                  className="pointer-events-none absolute inset-0 z-0 opacity-30"
                  style={{
                    backgroundImage: `
      linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
    `,
                    backgroundSize: '41px 41px',
                  }}
                />

                <div className="relative z-10 flex h-full w-full items-center justify-center">
                  <Image
                    src={approach_img_1}
                    alt="aproach-img-1"
                    width={143}
                    height={144}
                    className="pointer-events-none absolute top-0 left-0 w-30 min-[480px]:w-40 sm:w-50 lg:w-[143px]"
                  />
                  <Image
                    src={approach_img_2}
                    alt="aproach-img-2"
                    width={256}
                    height={258}
                    className="pointer-events-none absolute right-0 w-30 min-[480px]:w-40 sm:w-50 lg:w-[256px]"
                  />
                  <Image
                    src={approach_img_3}
                    alt="aproach-img-3"
                    width={143}
                    height={144}
                    className="pointer-events-none absolute bottom-0 left-0 w-30 min-[480px]:w-40 sm:w-50 lg:w-[143px]"
                  />
                  <Image
                    src={approach_line_1}
                    alt=""
                    width={265.83}
                    height={46.47}
                    className="pointer-events-none absolute bottom-[18%] left-[36%] -z-1 w-[44%] min-[480px]:bottom-[15%] min-[480px]:left-[32%] min-[480px]:w-[50%] sm:bottom-[12%] sm:left-[28%] sm:w-[60%] lg:bottom-10 lg:left-30 lg:w-[265px]"
                  />
                  <Image
                    src={approach_line_2}
                    alt=""
                    width={279.83}
                    height={46.47}
                    className="pointer-events-none absolute top-[18%] left-[28%] w-[52%] min-[480px]:top-[15%] min-[480px]:left-[27%] min-[480px]:w-[55%] sm:top-[12%] sm:left-[28%] sm:w-[60%] lg:top-10 lg:left-24 lg:w-[280px]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-[23px] md:grid-cols-3">
              <div className="relative flex h-118 w-full flex-col items-center overflow-hidden rounded-3xl bg-[#16171B] px-8 py-10">
                <div className="pointer-events-none absolute inset-0 flex justify-center">
                  <Image
                    src={approach_elipse_1}
                    alt=""
                    width={344}
                    height={344}
                    className="absolute top-[30px] opacity-60"
                    aria-hidden
                  />
                  <Image
                    src={approach_elipse_3}
                    alt=""
                    width={244}
                    height={244}
                    className="absolute top-[30px] opacity-70"
                    aria-hidden
                  />
                  <Image
                    src={approach_elipse_2}
                    alt=""
                    width={144}
                    height={144}
                    className="absolute top-[40px] opacity-80"
                    aria-hidden
                  />
                </div>

                <div className="relative z-10 flex h-full w-full flex-col items-center">
                  <div className="absolute top-16 flex h-11 w-11 items-center justify-center rounded-full bg-[#1F2025] before:absolute before:inset-[-8px] before:rounded-full before:bg-[#9296FD]/10 before:blur-md">
                    <Image
                      src={user_icon}
                      alt=""
                      width={20}
                      height={20}
                      className="pointer-events-none relative z-10"
                    />
                  </div>

                  <div className="flex-1" />

                  <div className="absolute top-[48%] mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-[#1F2025] before:absolute before:inset-[-8px] before:rounded-full before:bg-[#9296FD]/10 before:blur-md sm:top-[49%]">
                    <Image
                      src={shield_icon}
                      alt=""
                      width={20}
                      height={20}
                      className="pointer-events-none relative z-10"
                    />
                  </div>

                  <h3 className="text-center text-[20px] leading-[1.3] font-light text-[#F1F4FF] opacity-80">
                    Bezpieczeństwo jest
                    <br />
                    naszym priorytetem
                  </h3>

                  <Link href="/privacy-policy" className="mt-6 flex cursor-pointer items-center gap-2 rounded-full bg-[#1F2025] px-5 py-3 text-[14px] text-[#9296FD] transition-colors hover:bg-[#26272D]">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Jak chronimy dane
                  </Link>
                </div>
              </div>

              <div className="relative flex h-118 w-full flex-col items-center overflow-hidden rounded-3xl bg-[#16171B] px-8 py-10">
                <div
                  aria-hidden
                  className="pointer-events-none absolute top-[20%] left-1/2 h-[200px] w-[200px] -translate-x-1/2 rounded-full bg-[#9296FD]/15 blur-3xl"
                />

                <div className="relative z-10 flex h-full w-full flex-col items-center">
                  <div className="flex flex-1 items-center justify-center">
                    <Image
                      src={arrow_grid_icon}
                      alt=""
                      width={180}
                      height={180}
                      className="pointer-events-none w-[140px] sm:w-[160px]"
                    />
                  </div>

                  <h3 className="text-center text-[20px] leading-[1.3] font-light text-[#F1F4FF] opacity-80">
                    Zawsze aktualne
                    <br />
                    dane
                  </h3>

                  <Link href="/dashboard/market-analysis" className="mt-6 flex cursor-pointer items-center gap-2 rounded-full bg-[#1F2025] px-5 py-3 text-[14px] transition-colors hover:bg-[#26272D]">
                    <Image src={expand_icon} alt="" width={14} height={14} className="opacity-60" />
                    <span>
                      <span className="text-[#9296FD]">Sprawdź </span>
                      <span className="bg-[linear-gradient(90deg,#9296FD,#C7A9FE)] bg-clip-text font-medium text-transparent">
                        analize rynkową
                      </span>
                    </span>
                  </Link>
                </div>
              </div>

              <div className="relative flex h-118 w-full flex-col items-center overflow-hidden rounded-3xl bg-[#16171B] px-8 py-10">
                <div
                  aria-hidden
                  className="pointer-events-none absolute top-[20%] left-1/2 h-[200px] w-[200px] -translate-x-1/2 rounded-full bg-[#9296FD]/15 blur-3xl"
                />

                <div className="relative z-10 flex h-full w-full flex-col items-center">
                  <div className="relative flex w-full flex-1 items-center justify-center">
                    <div className="relative flex h-[160px] w-[160px] items-center justify-center sm:h-[180px] sm:w-[180px]">
                      <div className="absolute top-0 bottom-0 left-1/2 z-20 w-[1px] -translate-x-1/2 bg-white/5"></div>

                      <Image
                        src={ai_grid}
                        alt=""
                        width={180}
                        height={180}
                        className="pointer-events-none absolute right-10 h-full w-full object-contain sm:right-11"
                        style={{ clipPath: 'inset(0 0% 0 0)' }}
                      />

                      <Image
                        src={brain_grid}
                        alt=""
                        width={180}
                        height={180}
                        className="pointer-events-none absolute inset-0 h-full w-full object-contain"
                        style={{ clipPath: 'inset(0 0 0 50%)' }}
                      />
                    </div>
                  </div>

                  <h3 className="text-center text-[20px] leading-[1.3] font-light text-[#F1F4FF] opacity-80">
                    Lepsza alternatywa
                    <br />w doborze kariery
                  </h3>

                  <Link href="/profile" className="mt-6 flex cursor-pointer items-center gap-2 rounded-full bg-[#7B7DF5] px-6 py-3 text-[14px] font-medium text-white transition-colors hover:bg-[#6B6DE8]">
                    Sprawdź za darmo
                    <ChevronRight size={18} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Approach;
