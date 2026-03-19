'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Maintenance() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Opóźnienie dla płynnego wejścia elementów
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#FF6B35] font-sans text-black selection:bg-black selection:text-[#FF6B35]">
      {/* --- TŁO: Siatka (Grid) --- */}
      {/* Używamy absolute inset-0, ale z niższym z-indexem. Usunąłem skomplikowane animacje na rzecz prostego opacity. */}
      <div className="pointer-events-none absolute inset-0 z-0 flex justify-between px-6 opacity-20 md:px-12">
        {/* Generujemy 6 pionowych linii dla struktury */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`h-full w-[1px] origin-top bg-black transition-transform duration-[1500ms] ease-out ${
              mounted ? 'scale-y-100' : 'scale-y-0'
            }`}
            style={{ transitionDelay: `${i * 100}ms` }}
          />
        ))}
      </div>

      {/* --- TREŚĆ GŁÓWNA --- */}
      <div className="relative z-10 flex h-screen w-full flex-col p-6 md:p-12">
        {/* 1. Nawigacja (Lewy górny róg) */}
        <header className="flex-none">
          <Link
            href="/"
            className={`group flex w-fit items-center gap-4 transition-all duration-700 ease-out ${
              mounted ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
            }`}
          >
            {/* Kółko ze strzałką */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black transition-colors duration-300 group-hover:bg-black group-hover:text-[#FF6B35] md:h-12 md:w-12">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1 md:h-6 md:w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
            </div>

            {/* Tekst przycisku */}
            <span className="font-grotesk text-lg font-bold tracking-wide uppercase md:text-xl">
              Powrót
            </span>
          </Link>
        </header>

        {/* 2. Centrum (Maintenance Message) */}
        <main className="flex flex-1 flex-col items-center justify-center text-center">
          {/* Wielki Nagłówek */}
          <div className="relative overflow-hidden">
            <h1
              className={`text-[13vw] leading-[0.8] font-black tracking-tighter uppercase transition-transform duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                mounted ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
              }`}
            >
              Main
              <br />
              tenance
            </h1>
          </div>

          {/* Podtytuł */}
          <div className="mt-8 overflow-hidden md:mt-12">
            <p
              className={`font-grotesk mx-auto max-w-xl border-l-2 border-black pl-6 text-left text-lg font-medium transition-all delay-300 duration-1000 ease-out md:text-2xl ${
                mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
            >
              Przerwa techniczna. <br />
              System płatności przechodzi planowaną modernizację.
            </p>
          </div>
        </main>

        {/* 3. Stopka (Informacje techniczne) */}
        <footer className="flex w-full flex-none items-end justify-between border-t-2 border-black pt-4">
          <div
            className={`font-grotesk font-mono text-xs font-bold tracking-widest uppercase transition-opacity delay-700 duration-1000 md:text-sm ${mounted ? 'opacity-100' : 'opacity-0'}`}
          >
            System Status: <span className="animate-pulse">Offline</span>
          </div>
          <div
            className={`font-mono text-xs font-bold tracking-widest uppercase transition-opacity delay-700 duration-1000 md:text-sm ${mounted ? 'opacity-100' : 'opacity-0'}`}
          >
            ERR: 503
          </div>
        </footer>
      </div>
    </div>
  );
}
